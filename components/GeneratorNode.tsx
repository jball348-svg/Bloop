import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

const WAVE_SHAPES = ['sine', 'square', 'triangle', 'sawtooth'];

export default function GeneratorNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state: any) => state.updateNodeValue);
    const nodeData = useStore((state: any) => state.nodes.find((n: any) => n.id === id)?.data);
    const isActive = useStore((state: any) => state.activeGenerators.has(id));
    const isAdjacent = useStore((state: any) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state: any) => {
        const edges = state.edges;
        return !edges.some((e: any) => e.source === id || e.target === id);
    });

    const waveShape = nodeData?.waveShape || 'sine';

    const handleWaveShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateNodeValue(id, { waveShape: e.target.value });
    };

    return (
        <div className={`bg-slate-900 border-2 border-red-500 rounded-2xl p-5 shadow-2xl text-white w-56 min-h-[160px] flex flex-col transition-all hover:shadow-red-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>
            {/* Input handle for MIDI data from Controller */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-yellow-400"
            />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em]">Generator</span>
                        <div className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 transition-colors ${
                            isActive ? 'bg-red-400 animate-pulse' : 'bg-slate-600'
                        }`} />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wave Shape</label>
                            <select
                                value={waveShape}
                                onChange={handleWaveShapeChange}
                                className="nodrag bg-slate-800 text-[10px] text-red-300 border-none outline-none rounded p-1 uppercase font-bold"
                            >
                                {WAVE_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-red-400">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                            not connected
                        </span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {/* Audio output port at the bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-red-500"
            />
        </div>
    );
}
