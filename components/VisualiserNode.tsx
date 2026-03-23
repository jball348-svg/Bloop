'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_INPUT_SECONDARY_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import { hexToRgba } from '@/lib/nodePalette';
import { useNodeAccent, useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

const VISUALISER_MODES = [
    { id: 'waveform', label: 'Wave' },
    { id: 'spectrum', label: 'Freq' },
    { id: 'vu', label: 'VU' },
    { id: 'lissajous', label: 'XY' },
] as const;

const SPECTRUM_LABELS = [
    { label: '60Hz', frequency: 60 },
    { label: '250Hz', frequency: 250 },
    { label: '1k', frequency: 1000 },
    { label: '4k', frequency: 4000 },
    { label: '16k', frequency: 16000 },
] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getMeterValue = (meter: Tone.Meter | null) => {
    const value = meter?.getValue();
    if (Array.isArray(value)) {
        return Math.max(...value);
    }
    return typeof value === 'number' ? value : -60;
};

export default function VisualiserNode({ id }: { id: string }) {
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const updateNodeData = useStore((state) => state.updateNodeData);
    const audioNodes = useStore((state) => state.audioNodes);
    const edges = useStore((state) => state.edges);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const canvasEdges = state.edges;
        return !canvasEdges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const accentStyle = useNodeAccentStyle('visualiser');
    const accent = useNodeAccent('visualiser');
    const mode = nodeData?.visualiserMode ?? 'waveform';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const primaryWaveformRef = useRef<Tone.Analyser | null>(null);
    const secondaryWaveformRef = useRef<Tone.Analyser | null>(null);
    const fftRef = useRef<Tone.FFT | null>(null);
    const meterRef = useRef<Tone.Meter | null>(null);
    const peakHoldRef = useRef<number[]>([]);
    const animFrameRef = useRef<number>(0);

    const secondaryEdge = useMemo(
        () =>
            edges.find(
                (edge) =>
                    isAudioEdge(edge) &&
                    edge.target === id &&
                    edge.targetHandle === AUDIO_INPUT_SECONDARY_HANDLE_ID
            ),
        [edges, id]
    );

    useEffect(() => {
        const passthroughNode = audioNodes.get(id);
        if (!(passthroughNode instanceof Tone.Gain)) {
            return;
        }

        const primaryWaveform = new Tone.Analyser('waveform', 256);
        const secondaryWaveform = new Tone.Analyser('waveform', 256);
        const fft = new Tone.FFT(128);
        const meter = new Tone.Meter({ smoothing: 0.85 });

        passthroughNode.connect(primaryWaveform);
        passthroughNode.connect(fft);
        passthroughNode.connect(meter);

        const actualSecondarySourceId = secondaryEdge
            ? secondaryEdge.data?.originalSource || secondaryEdge.source
            : null;
        const secondarySourceNode =
            actualSecondarySourceId ? audioNodes.get(actualSecondarySourceId) : null;
        if (secondarySourceNode) {
            secondarySourceNode.connect(secondaryWaveform);
        }

        primaryWaveformRef.current = primaryWaveform;
        secondaryWaveformRef.current = secondaryWaveform;
        fftRef.current = fft;
        meterRef.current = meter;
        peakHoldRef.current = [];

        return () => {
            primaryWaveform.dispose();
            secondaryWaveform.dispose();
            fft.dispose();
            meter.dispose();
            primaryWaveformRef.current = null;
            secondaryWaveformRef.current = null;
            fftRef.current = null;
            meterRef.current = null;
            peakHoldRef.current = [];
        };
    }, [audioNodes, id, secondaryEdge]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;
        const accentSoft = hexToRgba(accent, 0.18);
        const accentGlow = hexToRgba(accent, 0.34);
        const gridColor = 'rgba(148, 163, 184, 0.12)';
        const labelColor = 'rgba(148, 163, 184, 0.88)';

        const drawGrid = () => {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let row = 1; row < 4; row += 1) {
                const y = (height / 4) * row;
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            for (let column = 1; column < 4; column += 1) {
                const x = (width / 4) * column;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            ctx.stroke();
        };

        const drawFrame = () => {
            animFrameRef.current = requestAnimationFrame(drawFrame);
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#0b1120';
            ctx.fillRect(0, 0, width, height);
            drawGrid();

            if (mode === 'waveform' && primaryWaveformRef.current) {
                const values = primaryWaveformRef.current.getValue() as Float32Array;
                ctx.strokeStyle = accent;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 16;
                ctx.shadowColor = accentGlow;
                ctx.beginPath();
                values.forEach((value, index) => {
                    const x = (index / (values.length - 1)) * width;
                    const y = ((value + 1) / 2) * height;
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.fillStyle = labelColor;
                ctx.font = '10px "Avenir Next", sans-serif';
                ctx.fillText('Amplitude', 10, 14);
                ctx.fillText('Time', width - 28, height - 8);
            }

            if (mode === 'spectrum' && fftRef.current) {
                const values = fftRef.current.getValue() as Float32Array;
                const peaks = peakHoldRef.current;
                const barWidth = width / values.length;

                values.forEach((value, index) => {
                    const normalized = clamp01((value + 110) / 110);
                    peaks[index] = Math.max((peaks[index] ?? 0) * 0.96, normalized);

                    const barHeight = normalized * (height - 20);
                    const peakY = height - peaks[index] * (height - 20) - 10;

                    ctx.fillStyle = accentSoft;
                    ctx.fillRect(index * barWidth, height - barHeight - 10, Math.max(1, barWidth - 1), barHeight);

                    ctx.fillStyle = accent;
                    ctx.fillRect(index * barWidth, peakY, Math.max(1, barWidth - 1), 2);
                });

                ctx.fillStyle = labelColor;
                ctx.font = '10px "Avenir Next", sans-serif';
                SPECTRUM_LABELS.forEach(({ label, frequency }) => {
                    const normalized = Math.log10(frequency / 20) / Math.log10(20000 / 20);
                    const x = clamp01(normalized) * width;
                    ctx.fillText(label, Math.min(width - 24, Math.max(2, x - 10)), height - 2);
                });
            }

            if (mode === 'vu') {
                const meterDb = getMeterValue(meterRef.current);
                const normalized = clamp01((meterDb + 60) / 60);
                const barHeight = normalized * (height - 20);

                ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
                ctx.fillRect(width / 2 - 20, 8, 40, height - 16);
                ctx.strokeStyle = accentGlow;
                ctx.strokeRect(width / 2 - 20, 8, 40, height - 16);

                const gradient = ctx.createLinearGradient(0, height - 12, 0, 8);
                gradient.addColorStop(0, accentSoft);
                gradient.addColorStop(1, accent);
                ctx.fillStyle = gradient;
                ctx.fillRect(width / 2 - 16, height - barHeight - 12, 32, barHeight);

                ctx.fillStyle = labelColor;
                ctx.font = '10px "Avenir Next", sans-serif';
                ['0', '-12', '-24', '-36', '-48', '-60'].forEach((tick, index) => {
                    const y = 12 + ((height - 24) / 5) * index;
                    ctx.fillText(tick, width / 2 + 28, y + 3);
                });
                ctx.fillText(`${Math.round(meterDb)} dB`, 10, 14);
            }

            if (mode === 'lissajous') {
                const xValues = primaryWaveformRef.current?.getValue() as Float32Array | undefined;
                const yValues =
                    (secondaryWaveformRef.current?.getValue() as Float32Array | undefined) ?? xValues;

                ctx.strokeStyle = gridColor;
                ctx.beginPath();
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width / 2, height);
                ctx.moveTo(0, centerY);
                ctx.lineTo(width, centerY);
                ctx.stroke();

                if (!secondaryEdge || !xValues || !yValues) {
                    ctx.fillStyle = labelColor;
                    ctx.font = '12px "Avenir Next", sans-serif';
                    ctx.fillText('Connect a second source', width / 2 - 62, centerY - 6);
                    ctx.fillText('to the XY input', width / 2 - 42, centerY + 12);
                } else {
                    ctx.strokeStyle = accent;
                    ctx.lineWidth = 1.4;
                    ctx.shadowBlur = 14;
                    ctx.shadowColor = accentGlow;
                    ctx.beginPath();
                    const step = Math.max(1, Math.floor(xValues.length / 120));
                    for (let index = 0; index < xValues.length; index += step) {
                        const x = ((xValues[index] + 1) / 2) * width;
                        const y = height - ((yValues[index] + 1) / 2) * height;
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        };

        drawFrame();
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [accent, mode, secondaryEdge]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-pink-500 rounded-2xl p-3 shadow-2xl text-white w-72 flex flex-col transition-all hover:shadow-pink-500/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('visualiser') : ''
            }`}
        >
            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-pink-500 hover:text-white hover:border-pink-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px ${hexToRgba(accent, 0.3)}` }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">
                            Visualiser
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            Waveform, spectrum, VU, XY
                        </div>
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="pink-500" />
                </div>

                <div className="grid grid-cols-4 gap-1 mb-3">
                    {VISUALISER_MODES.map((visualiserMode) => (
                        <button
                            key={visualiserMode.id}
                            onClick={() => updateNodeData(id, { visualiserMode: visualiserMode.id })}
                            className={`nodrag rounded-xl px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] transition-all ${
                                mode === visualiserMode.id
                                    ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.28)]'
                                    : 'bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/18'
                            }`}
                        >
                            {visualiserMode.label}
                        </button>
                    ))}
                </div>

                <canvas
                    ref={canvasRef}
                    width={256}
                    height={152}
                    className="w-full rounded-2xl bg-slate-900 border border-pink-500/10"
                />

                <div className="mt-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <span>Primary In</span>
                    <span>{mode}</span>
                    <span>{secondaryEdge ? 'XY Ready' : 'Single Feed'}</span>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-pink-500">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                            not connected
                        </span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <>
                    <Handle
                        type="target"
                        id={AUDIO_INPUT_HANDLE_ID}
                        position={Position.Top}
                        className="w-4 h-4 border-4 border-slate-900 !top-[-8px] !left-[34%] -translate-x-1/2 hover:scale-125 transition-all bg-pink-500"
                    />
                    <Handle
                        type="target"
                        id={AUDIO_INPUT_SECONDARY_HANDLE_ID}
                        position={Position.Top}
                        className="w-4 h-4 border-4 border-slate-900 !top-[-8px] !left-[66%] -translate-x-1/2 hover:scale-125 transition-all bg-pink-300"
                    />
                </>
            )}
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-pink-500"
                />
            )}
        </div>
    );
}
