'use client';

import { useEffect, useMemo } from 'react';
import * as Tone from 'tone';
import { Handle, Position } from 'reactflow';
import {
    CONTROL_OUTPUT_HANDLE_ID,
    ROOT_NOTES,
    TRANSPORT_RATE_OPTIONS,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

const NOTE_OPTIONS = [3, 4, 5].flatMap((octave) =>
    ROOT_NOTES.map((note) => `${note}${octave}`)
);

export default function PulseNode({ id }: { id: string }) {
    const updateNodeData = useStore((state) => state.updateNodeData);
    const firePulse = useStore((state) => state.firePulse);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });

    const pulseSync = nodeData?.pulseSync ?? true;
    const pulseRate = nodeData?.pulseRate ?? '4n';
    const pulseIntervalMs = nodeData?.pulseIntervalMs ?? 500;
    const pulseNote = nodeData?.pulseNote ?? 'C4';
    const isPlaying = nodeData?.isPlaying ?? false;
    const accentStyle = useNodeAccentStyle('pulse');

    const effectiveIntervalMs = useMemo(
        () => (pulseSync ? Tone.Time(pulseRate).toMilliseconds() : pulseIntervalMs),
        [pulseSync, pulseRate, pulseIntervalMs]
    );

    useEffect(() => {
        if (isPlaying) {
            toggleNodePlayback(id, true);
        }
    }, [effectiveIntervalMs, id, isPlaying, pulseRate, pulseSync, pulseIntervalMs, toggleNodePlayback]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-lime-500 rounded-2xl p-3 shadow-2xl text-white w-72 flex flex-col transition-all hover:shadow-lime-500/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('pulse') : ''
            }`}
        >
            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-lime-500 hover:text-slate-950 hover:border-lime-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(132, 204, 22, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-[10px] font-black uppercase text-lime-400 tracking-[0.2em] text-center">
                        Pulse
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="lime-500" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={async () => {
                                await Tone.start();
                                firePulse(id, effectiveIntervalMs);
                            }}
                            className="nodrag rounded-xl bg-lime-500 px-3 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition-all hover:bg-lime-400 active:scale-95"
                        >
                            Fire
                        </button>
                        <button
                            onClick={async () => {
                                await Tone.start();
                                toggleNodePlayback(id, !isPlaying);
                            }}
                            className={`nodrag rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                isPlaying
                                    ? 'border border-lime-500/40 bg-lime-500/15 text-lime-300 hover:bg-lime-500/20'
                                    : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                            }`}
                        >
                            {isPlaying ? 'Stop' : 'Auto'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-lime-500/15 bg-slate-900/40 px-3 py-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Sync To Tempo
                            </span>
                            <span className="text-[10px] font-mono text-lime-300">
                                {pulseSync ? pulseRate : `${pulseIntervalMs}ms`}
                            </span>
                        </div>
                        <button
                            onClick={() => updateNodeData(id, { pulseSync: !pulseSync })}
                            className={`nodrag rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                pulseSync
                                    ? 'bg-lime-500 text-slate-950'
                                    : 'bg-slate-700 text-slate-300'
                            }`}
                        >
                            {pulseSync ? 'On' : 'Off'}
                        </button>
                    </div>

                    {pulseSync ? (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Division
                            </label>
                            <select
                                value={pulseRate}
                                onChange={(event) => updateNodeData(id, { pulseRate: event.target.value as typeof pulseRate })}
                                className="nodrag rounded-lg border border-lime-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-lime-200 outline-none"
                            >
                                {TRANSPORT_RATE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-slate-900 text-lime-200">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Interval
                                </label>
                                <span className="text-[10px] font-mono text-lime-300">{pulseIntervalMs}ms</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="2000"
                                step="25"
                                value={pulseIntervalMs}
                                onChange={(event) => updateNodeData(id, { pulseIntervalMs: Number(event.target.value) })}
                                className="nodrag w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Trigger Note
                        </label>
                        <select
                            value={pulseNote}
                            onChange={(event) => updateNodeData(id, { pulseNote: event.target.value })}
                            className="nodrag rounded-lg border border-lime-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-lime-200 outline-none"
                        >
                            {NOTE_OPTIONS.map((note) => (
                                <option key={note} value={note} className="bg-slate-900 text-lime-200">
                                    {note}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-lime-400">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={CONTROL_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-lime-500"
                />
            )}
        </div>
    );
}
