'use client';

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_OUTPUT_HANDLE_ID,
    CONTROL_INPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isAudioEdge,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

const extractWaveform = (audioBuffer: AudioBuffer, sampleCount = 64) => {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / sampleCount));
    const peaks: number[] = [];

    for (let index = 0; index < sampleCount; index += 1) {
        const start = index * blockSize;
        const end = Math.min(channelData.length, start + blockSize);
        let peak = 0;

        for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
            peak = Math.max(peak, Math.abs(channelData[sampleIndex] ?? 0));
        }

        peaks.push(peak);
    }

    return peaks;
};

const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read sample file.'));
        reader.readAsDataURL(file);
    });

export default function SamplerNode({ id }: { id: string }) {
    const loadSample = useStore((state) => state.loadSample);
    const updateSamplerSettings = useStore((state) => state.updateSamplerSettings);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        const hasControlIn = edges.some((edge) => isControlEdge(edge) && edge.target === id);
        const hasAudioOut = edges.some((edge) => isAudioEdge(edge) && edge.source === id);
        return !hasControlIn && !hasAudioOut;
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const accentStyle = useNodeAccentStyle('sampler');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const hasSample = nodeData?.hasSample ?? false;
    const sampleName = nodeData?.sampleName || 'No sample loaded';
    const sampleWaveform = nodeData?.sampleWaveform;
    const loop = nodeData?.loop ?? false;
    const playbackRate = nodeData?.playbackRate ?? 1;
    const reverse = nodeData?.reverse ?? false;
    const pitchShift = nodeData?.pitchShift ?? 0;
    const isPlaying = nodeData?.isPlaying ?? false;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#0f172a';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const waveform: number[] = sampleWaveform ?? [];

        if (waveform.length === 0) {
            context.fillStyle = 'rgba(148, 163, 184, 0.6)';
            context.font = '12px monospace';
            context.textAlign = 'center';
            context.fillText('Load a sample', canvas.width / 2, canvas.height / 2 + 4);
            return;
        }

        context.strokeStyle = '#d6d3d1';
        context.lineWidth = 2;
        context.beginPath();

        waveform.forEach((peak, index) => {
            const x = (index / Math.max(waveform.length - 1, 1)) * canvas.width;
            const amplitude = peak * (canvas.height / 2 - 6);
            const yTop = canvas.height / 2 - amplitude;
            const yBottom = canvas.height / 2 + amplitude;

            context.moveTo(x, yTop);
            context.lineTo(x, yBottom);
        });

        context.stroke();
    }, [sampleWaveform]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-stone-400 rounded-2xl p-3 shadow-2xl text-white w-80 flex flex-col transition-all hover:shadow-stone-400/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('sampler') : ''
            }`}
        >
            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-stone-400"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-stone-400 hover:text-slate-950 hover:border-stone-300 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(168, 162, 158, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-stone-200">
                        Sampler
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="stone-400" />
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="nodrag rounded-xl bg-stone-400 px-3 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition-all hover:bg-stone-300 active:scale-95"
                    >
                        {hasSample ? 'Replace Sample' : 'Load Sample'}
                    </button>

                    <div className="rounded-xl border border-stone-400/15 bg-slate-900/40 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Loaded Clip
                        </div>
                        <div className="mt-1 truncate text-[11px] font-mono text-stone-200">
                            {sampleName}
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={272}
                        height={88}
                        className="w-full rounded-2xl border border-stone-400/15 bg-slate-950/80"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={async () => {
                                await Tone.start();
                                toggleNodePlayback(id, !isPlaying);
                            }}
                            disabled={!hasSample}
                            className={`nodrag rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                hasSample
                                    ? isPlaying
                                        ? 'border border-stone-400/40 bg-stone-400/15 text-stone-100 hover:bg-stone-400/20'
                                        : 'bg-stone-400 text-slate-950 hover:bg-stone-300'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>

                        <button
                            onClick={() => updateSamplerSettings(id, { loop: !loop })}
                            disabled={!hasSample}
                            className={`nodrag rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                hasSample
                                    ? loop
                                        ? 'bg-stone-400 text-slate-950'
                                        : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {loop ? 'Looping' : 'Loop'}
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Speed
                            </label>
                            <span className="text-[10px] font-mono text-stone-200">
                                {playbackRate.toFixed(2)}x
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.25"
                            max="2"
                            step="0.05"
                            value={playbackRate}
                            onChange={(event) =>
                                updateSamplerSettings(id, { playbackRate: Number(event.target.value) })
                            }
                            className="nodrag w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-stone-400"
                        />
                    </div>

                    <button
                        onClick={() => setShowAdvanced((value) => !value)}
                        className="nodrag rounded-xl border border-stone-400/15 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-stone-200 transition-colors hover:border-stone-300/30"
                    >
                        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                    </button>

                    {showAdvanced && (
                        <div className="rounded-2xl border border-stone-400/15 bg-slate-900/40 p-3">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Pitch
                                        </label>
                                        <span className="text-[10px] font-mono text-stone-200">
                                            {pitchShift > 0 ? '+' : ''}
                                            {pitchShift} st
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-12"
                                        max="12"
                                        step="1"
                                        value={pitchShift}
                                        onChange={(event) =>
                                            updateSamplerSettings(id, { pitchShift: Number(event.target.value) })
                                        }
                                        className="nodrag w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-stone-400"
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-stone-400/15 bg-slate-950/40 px-3 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Reverse
                                        </span>
                                        <span className="text-[10px] font-mono text-stone-200">
                                            {reverse ? 'Next trigger plays backward' : 'Forward playback'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => updateSamplerSettings(id, { reverse: !reverse })}
                                        className={`nodrag rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                            reverse
                                                ? 'bg-stone-400 text-slate-950'
                                                : 'bg-slate-700 text-slate-300'
                                        }`}
                                    >
                                        {reverse ? 'On' : 'Off'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-stone-300">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                        return;
                    }

                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer.slice(0));
                        const dataUrl = await fileToDataUrl(file);
                        loadSample(id, audioBuffer, {
                            sampleName: file.name,
                            sampleDataUrl: dataUrl,
                            waveform: extractWaveform(audioBuffer),
                        });
                    } catch (error) {
                        console.error('Failed to load sample', error);
                    } finally {
                        event.target.value = '';
                    }
                }}
            />

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-stone-400"
                />
            )}
        </div>
    );
}
