'use client';

import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import LockButton from './LockButton';

export default function VisualiserNode({ id }: { id: string }) {
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const audioNodes = useStore((state) => state.audioNodes);
    const edges = useStore((state) => state.edges);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const [mode, setMode] = useState<'waveform' | 'spectrum'>('waveform');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<Tone.Analyser | null>(null);
    const fftRef = useRef<Tone.FFT | null>(null);
    const animFrameRef = useRef<number>(0);

    // Setup analysers connected to the Tone.js passthrough node
    useEffect(() => {
        const gainNode = audioNodes.get(id);
        if (!(gainNode instanceof Tone.Gain)) return;

        const analyser = new Tone.Analyser('waveform', 256);
        const fft = new Tone.FFT(64);
        gainNode.connect(analyser);
        gainNode.connect(fft);
        analyserRef.current = analyser;
        fftRef.current = fft;

        return () => {
            analyser.dispose();
            fft.dispose();
        };
    }, [id, audioNodes, edges]);

    // Animation loop for canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f172a'; // slate-900
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (mode === 'waveform' && analyserRef.current) {
                const values = analyserRef.current.getValue() as Float32Array;
                ctx.beginPath();
                ctx.strokeStyle = '#ec4899'; // pink-500
                ctx.lineWidth = 1.5;
                const sliceWidth = canvas.width / values.length;
                values.forEach((v, i) => {
                    const x = i * sliceWidth;
                    const y = ((v + 1) / 2) * canvas.height;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
            }

            if (mode === 'spectrum' && fftRef.current) {
                const values = fftRef.current.getValue() as Float32Array;
                const barWidth = canvas.width / values.length;
                ctx.fillStyle = '#ec4899';
                values.forEach((v, i) => {
                    const normalized = Math.max(0, (v + 140) / 140); // roughly -140dB to 0dB
                    const barHeight = normalized * canvas.height;
                    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
                });
            }
        };

        draw();
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [mode]);

    // Set canvas size after mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Set canvas to match node width minus padding
            canvas.width = 224; // 256 - 32px padding
        }
    }, []);

    return (
        <div className={`bg-slate-800 border-2 border-pink-500 rounded-2xl p-3 shadow-2xl text-white w-64 flex flex-col transition-all hover:shadow-pink-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-pink-500 hover:text-white hover:border-pink-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px rgba(236, 72, 153, 0.3)` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] text-center">
                        VISUALISER
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="pink-500" />
                </div>

                <div className="flex gap-1 mb-3">
                    <button
                        onClick={() => setMode('waveform')}
                        className={`flex-1 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                            mode === 'waveform'
                                ? 'bg-pink-500 text-white'
                                : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        }`}
                    >
                        WAVE
                    </button>
                    <button
                        onClick={() => setMode('spectrum')}
                        className={`flex-1 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                            mode === 'spectrum'
                                ? 'bg-pink-500 text-white'
                                : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        }`}
                    >
                        FREQ
                    </button>
                </div>

                <canvas
                    ref={canvasRef}
                    height={120}
                    className="w-full rounded-lg bg-slate-900"
                />

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
                <Handle
                    type="target"
                    id={AUDIO_INPUT_HANDLE_ID}
                    position={Position.Top}
                    className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-pink-500"
                />
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
