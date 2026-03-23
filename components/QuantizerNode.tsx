'use client';

import { Handle, Position } from 'reactflow';
import {
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    ROOT_NOTES,
    TONAL_SCALE_OPTIONS,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

export default function QuantizerNode({ id }: { id: string }) {
    const updateNodeData = useStore((state) => state.updateNodeData);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });

    const rootNote = nodeData?.rootNote ?? 'C';
    const scaleType = nodeData?.scaleType ?? 'major';
    const bypass = nodeData?.bypass ?? false;
    const accentStyle = useNodeAccentStyle('quantizer');

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-purple-500 rounded-2xl p-3 shadow-2xl text-white w-60 flex flex-col transition-all hover:shadow-purple-500/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('quantizer') : ''
            }`}
        >
            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-purple-500"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-purple-500 hover:text-white hover:border-purple-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(168, 85, 247, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                        Quantizer
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="purple-500" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-purple-500/15 bg-slate-900/40 px-3 py-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">
                            {rootNote} {scaleType}
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Snap incoming notes to the nearest in-key pitch.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Root
                            </label>
                            <select
                                value={rootNote}
                                onChange={(event) => updateNodeData(id, { rootNote: event.target.value })}
                                className="nodrag rounded-lg border border-purple-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-purple-200 outline-none"
                            >
                                {ROOT_NOTES.map((note) => (
                                    <option key={note} value={note} className="bg-slate-900 text-purple-200">
                                        {note}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Scale
                            </label>
                            <select
                                value={scaleType}
                                onChange={(event) => updateNodeData(id, { scaleType: event.target.value })}
                                className="nodrag rounded-lg border border-purple-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-purple-200 outline-none"
                            >
                                {TONAL_SCALE_OPTIONS.map((scale) => (
                                    <option key={scale} value={scale} className="bg-slate-900 text-purple-200">
                                        {scale}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-purple-500/15 bg-slate-900/40 px-3 py-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Bypass
                            </span>
                            <span className="text-[10px] font-mono text-purple-300">
                                {bypass ? 'Passing notes through untouched' : 'Quantizing every trigger'}
                            </span>
                        </div>
                        <button
                            onClick={() => updateNodeData(id, { bypass: !bypass })}
                            className={`nodrag rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                bypass
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-purple-500 text-white'
                            }`}
                        >
                            {bypass ? 'Off' : 'On'}
                        </button>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-purple-400">
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
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-purple-500"
                />
            )}
        </div>
    );
}
