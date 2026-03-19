import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import LockButton from './LockButton';

export default function UnisonNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const [depth, setDepth] = useState(70);
    const [speed, setSpeed] = useState(30);
    const [mix, setMix] = useState(50);
    const [isBypassed, setIsBypassed] = useState(false);

    useEffect(() => {
        updateNodeValue(id, {
            wet: 0.5,
            depth: 0.7,
            frequency: 0.5 + (30 / 100) * 9.5,
        });
    }, [id]);

    const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setDepth(val);
        updateNodeValue(id, { depth: val / 100 });
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setSpeed(val);
        const frequency = 0.5 + (val / 100) * 9.5;
        updateNodeValue(id, { frequency });
    };

    const handleMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setMix(val);
        updateNodeValue(id, { wet: isBypassed ? 0 : val / 100 });
    };

    return (
        <div className={`bg-slate-800 border-2 border-violet-500 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-violet-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

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
                                                ? 'bg-violet-500 text-white'
                                                : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                        }`}
                                    >
                                        {isBypassed ? 'BYPASSED' : 'BYPASS'}
                                    </button>
                                </div>
                                <span className="text-[10px] font-mono text-violet-400 font-bold">{isBypassed ? 0 : mix}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mix}
                                onChange={handleMixChange}
                                disabled={isBypassed}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

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
                                onChange={handleDepthChange}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speed</label>
                                <span className="text-[10px] font-mono text-violet-400 font-bold">
                                    {(0.5 + (speed / 100) * 9.5).toFixed(1)}Hz
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={speed}
                                onChange={handleSpeedChange}
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

            <Handle
                type="target"
                id={AUDIO_INPUT_HANDLE_ID}
                position={Position.Top}
                className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-violet-500"
            />
            <Handle
                type="source"
                id={AUDIO_OUTPUT_HANDLE_ID}
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-violet-500"
            />
        </div>
    );
}
