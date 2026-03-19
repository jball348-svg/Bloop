import { Handle, Position } from 'reactflow';
import {
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    CHORD_QUALITY_OPTIONS,
    DEFAULT_CHORD_QUALITY,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import LockButton from './LockButton';

export default function ChordNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });

    const quality = nodeData?.subType || DEFAULT_CHORD_QUALITY;

    return (
        <div className={`bg-slate-800 border-2 border-sky-500 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-sky-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-sky-400"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-sky-500 hover:text-white hover:border-sky-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px rgba(168, 85, 247, 0.3)` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
                        Chord
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="sky-500" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <select
                            value={quality}
                            onChange={(event) => changeNodeSubType(id, 'chord', event.target.value)}
                            className="nodrag rounded-lg border border-sky-400/15 bg-slate-800/90 p-2 text-[11px] font-bold text-sky-200 outline-none transition-colors hover:border-sky-400/35"
                        >
                            {CHORD_QUALITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-slate-900 text-sky-200">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-sky-400">
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
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-sky-500"
                />
            )}
        </div>
    );
}
