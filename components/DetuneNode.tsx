import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    isAudioEdge,
    useStore,
} from '@/store/useStore';

export default function DetuneNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const [cents, setCents] = useState(0);
    const [mix, setMix] = useState(100);
    const [isBypassed, setIsBypassed] = useState(false);

    const handleCentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setCents(val);
        updateNodeValue(id, { pitch: val / 100 });
    };

    const handleMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setMix(val);
        updateNodeValue(id, { wet: isBypassed ? 0 : val / 100 });
    };

    return (
        <div className={`bg-slate-800 border-2 border-teal-500 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-teal-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-teal-500 hover:text-white hover:border-teal-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                            style={{ boxShadow: `0 0 6px rgba(20, 184, 166, 0.3)` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNodeAndCleanUp(id);
                            }}
                        >
                            ×
                        </button>
                        <div className="text-[10px] font-black uppercase text-teal-400 tracking-[0.2em]">
                            DETUNE
                        </div>
                        <div className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mix</label>
                                    <button
                                        onClick={() => {
                                            const next = !isBypassed;
                                            setIsBypassed(next);
                                            updateNodeValue(id, { wet: next ? 0 : mix / 100 });
                                        }}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                                            isBypassed
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                        }`}
                                    >
                                        {isBypassed ? 'BYPASSED' : 'BYPASS'}
                                    </button>
                                </div>
                                <span className="text-[10px] font-mono text-teal-400 font-bold">{isBypassed ? 0 : mix}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mix}
                                onChange={handleMixChange}
                                disabled={isBypassed}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pitch</label>
                                <span className="text-[10px] font-mono text-teal-400 font-bold">
                                    {cents > 0 ? '+' : ''}{cents}¢
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={cents}
                                onChange={handleCentsChange}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-teal-500">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                            not connected
                        </span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            <Handle
                type="target"
                id={AUDIO_INPUT_HANDLE_ID}
                position={Position.Top}
                className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-teal-500"
            />
            <Handle
                type="source"
                id={AUDIO_OUTPUT_HANDLE_ID}
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-teal-500"
            />
        </div>
    );
}
