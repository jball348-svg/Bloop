import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    CHORD_QUALITY_OPTIONS,
    DEFAULT_CHORD_QUALITY,
    isAudioEdge,
    useStore,
} from '@/store/useStore';

export default function ChordNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const quality = nodeData?.subType || DEFAULT_CHORD_QUALITY;

    return (
        <div className={`bg-slate-900 border-2 border-sky-500 rounded-2xl p-5 shadow-2xl text-white w-56 min-h-[180px] flex flex-col transition-all hover:shadow-sky-500/20 group relative overflow-hidden${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>
            <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.06]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(135deg, #38bdf8 0, #38bdf8 1px, transparent 1px, transparent 12px)',
                    }}
                />
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
            </div>

            <Handle
                type="target"
                id={AUDIO_INPUT_HANDLE_ID}
                position={Position.Top}
                className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-sky-400"
            />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
                        Chord
                    </span>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-sky-200">
                        Root Pos
                    </span>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Chord Quality
                        </label>
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

                    <div className="rounded-xl border border-sky-400/15 bg-slate-800/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            Harmonic Voicing
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-sky-100/90">
                            Turns one incoming note into a full chord before it hits the generator.
                        </p>
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

            <Handle
                type="source"
                id={AUDIO_OUTPUT_HANDLE_ID}
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-sky-500"
            />
        </div>
    );
}
