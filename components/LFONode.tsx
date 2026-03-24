'use client';

import { useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
    MODULATION_OUTPUT_HANDLE_ID,
    getMathTargetOptionsForNode,
    getAdjacencyGlowClasses,
    isModulationEdge,
    TRANSPORT_RATE_OPTIONS,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import MathInputHandle, { useMathInputSelection } from './MathInputHandle';
import PackedNode from './PackedNode';

const WAVE_OPTIONS = ['sine', 'triangle', 'square', 'sawtooth'] as const;

export default function LFONode({ id }: { id: string }) {
    const updateNodeData = useStore((state) => state.updateNodeData);
    const rebuildModulationGraph = useStore((state) => state.rebuildModulationGraph);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const node = useStore((state) => state.nodes.find((entry) => entry.id === id));
    const nodeData = node?.data;
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isConnected = useStore((state) =>
        state.edges.some((edge) => isModulationEdge(edge) && edge.source === id)
    );
    const accentStyle = useNodeAccentStyle('lfo');

    const waveform = nodeData?.lfoWaveform ?? 'sine';
    const sync = nodeData?.lfoSync ?? true;
    const rate = nodeData?.lfoRate ?? '4n';
    const hz = nodeData?.lfoHz ?? 1;
    const depth = nodeData?.lfoDepth ?? 0.35;
    const targetOptions = getMathTargetOptionsForNode(node);
    const { mathInputTarget, setMathInputTarget } = useMathInputSelection(id, targetOptions);

    useEffect(() => {
        rebuildModulationGraph();
    }, [rebuildModulationGraph, waveform, sync, rate, hz, depth]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node relative w-64 select-none rounded-2xl border-2 border-lime-700 bg-slate-800 p-3 text-white shadow-2xl transition-all hover:shadow-lime-700/20 ${
                isAdjacent ? getAdjacencyGlowClasses('lfo') : ''
            }`}
        >
            <MathInputHandle
                nodeId={id}
                mathInputTarget={mathInputTarget}
                targetOptions={targetOptions}
                onTargetChange={(target) => setMathInputTarget(id, target)}
            />
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={MODULATION_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="h-4 w-4 border-4 border-slate-900 !-right-2 bg-lime-500 transition-all hover:scale-125"
                />
            )}

            <div className="relative z-10 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                    <button
                        className="nodrag relative z-20 mr-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/90 text-[8px] text-slate-400 backdrop-blur-sm transition-all hover:scale-110 hover:border-lime-400 hover:bg-lime-500 hover:text-slate-950"
                        style={{ boxShadow: '0 0 6px rgba(132, 204, 22, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
                        LFO
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="lime-700" />
                </div>

                <div
                    className="rounded-2xl border px-3 py-3"
                    style={{
                        borderColor: 'var(--node-accent-border)',
                        backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                    }}
                >
                    <div className="mb-3 flex gap-2">
                        <button
                            onClick={() => updateNodeData(id, { lfoSync: true })}
                            className={`nodrag rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                                sync ? 'bg-lime-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                            }`}
                        >
                            Sync
                        </button>
                        <button
                            onClick={() => updateNodeData(id, { lfoSync: false })}
                            className={`nodrag rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                                !sync ? 'bg-lime-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                            }`}
                        >
                            Hz
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                Wave
                            </label>
                            <select
                                value={waveform}
                                onChange={(event) => updateNodeData(id, { lfoWaveform: event.target.value as typeof waveform })}
                                className="nodrag rounded-lg border border-lime-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-lime-200 outline-none"
                            >
                                {WAVE_OPTIONS.map((option) => (
                                    <option key={option} value={option} className="bg-slate-900 text-lime-200">
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {sync ? (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                    Rate
                                </label>
                                <select
                                    value={rate}
                                    onChange={(event) => updateNodeData(id, { lfoRate: event.target.value as typeof rate })}
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
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                        Rate
                                    </label>
                                    <span className="text-[10px] font-mono font-bold text-lime-300">{hz.toFixed(2)}Hz</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="12"
                                    step="0.1"
                                    value={hz}
                                    onChange={(event) => updateNodeData(id, { lfoHz: Number(event.target.value) })}
                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                    style={{ accentColor: 'var(--node-accent)' }}
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                    Depth
                                </label>
                                <span className="text-[10px] font-mono font-bold text-lime-300">
                                    {Math.round(depth * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={depth}
                                onChange={(event) => updateNodeData(id, { lfoDepth: Number(event.target.value) })}
                                className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                style={{ accentColor: 'var(--node-accent)' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-lime-300/85">
                    <span>{isConnected ? 'Patched' : 'Manual Routing'}</span>
                    <span>Drag to a mod target</span>
                </div>
            </div>
        </div>
    );
}
