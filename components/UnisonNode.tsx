import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import ModulationTargetHandle from './ModulationTargetHandle';
import NodeMixControl from './NodeMixControl';
import PackedNode from './PackedNode';

export default function UnisonNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const wet = nodeData?.wet ?? 0.5;
    const depth = Math.round((nodeData?.depth ?? 0.7) * 100);
    const frequency = nodeData?.frequency ?? 3.35;
    const mix = Math.round(wet * 100);
    const isBypassed = wet <= 0.001;
    const accentStyle = useNodeAccentStyle('unison');

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-violet-500 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-violet-500/20 group relative select-none${
            isAdjacent ? getAdjacencyGlowClasses('unison') : ''
        }`}
        >
            <ModulationTargetHandle paramKey="wet" top={92} />
            <ModulationTargetHandle paramKey="frequency" top={214} />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-violet-500 hover:text-white hover:border-violet-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                            style={{ boxShadow: `0 0 6px rgba(139, 92, 246, 0.3)` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNodeAndCleanUp(id);
                            }}
                        >
                            ×
                        </button>
                        <div className="flex-1 text-[10px] font-black uppercase text-violet-400 tracking-[0.2em] text-center">
                            UNISON
                        </div>
                        <LockButton id={id} isAdjacent={isAdjacent} accentColor="violet-500" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <NodeMixControl
                            value={mix}
                            bypassed={isBypassed}
                            onToggleBypass={() => {
                                updateNodeValue(id, { wet: isBypassed ? 0.5 : 0 });
                            }}
                            onChange={(value) => updateNodeValue(id, { wet: value / 100 })}
                        />

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depth</label>
                                <span className="text-[10px] font-mono text-violet-400 font-bold">{depth}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={depth}
                                onChange={(event) => updateNodeValue(id, { depth: Number(event.target.value) / 100 })}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speed</label>
                                <span className="text-[10px] font-mono text-violet-400 font-bold">
                                    {frequency.toFixed(1)}Hz
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={frequency}
                                onChange={(event) => updateNodeValue(id, { frequency: Number(event.target.value) })}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                        </div>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-violet-500">
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
                    className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-violet-500"
                />
            )}
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-violet-500"
                />
            )}
        </div>
    );
}
