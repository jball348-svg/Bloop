import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

export default function EffectNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const subType = nodeData?.subType || 'none';

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const [mix, setMix] = useState(50);
    const [depth, setDepth] = useState(50);
    const [time, setTime] = useState(50);
    const [isBypassed, setIsBypassed] = useState(false);

    const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        changeNodeSubType(id, 'effect', e.target.value);
    };

    const handleMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setMix(val);
        updateNodeValue(id, { wet: val / 100 });
    };

    const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setDepth(val);
        updateNodeValue(id, { roomSize: val / 100 });
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setTime(val);
        const delayVal = 0.1 + (val / 100) * 0.9;
        updateNodeValue(id, { delayTime: delayVal });
    };

    return (
        <div className={`bg-slate-800 border-2 border-fuchsia-500 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-fuchsia-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className={`flex justify-between items-center ${subType === 'none' ? 'h-full' : 'mb-3'}`}>
                        <button
                            className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-fuchsia-500 hover:text-white hover:border-fuchsia-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                            style={{ boxShadow: `0 0 6px rgba(217, 70, 239, 0.3)` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNodeAndCleanUp(id);
                            }}
                        >
                            ×
                        </button>
                        <select
                            value={subType}
                            onChange={handleSubTypeChange}
                            className="nodrag w-full bg-fuchsia-500/10 text-[10px] font-black uppercase text-fuchsia-400 tracking-[0.2em] border-none outline-none cursor-pointer hover:bg-fuchsia-500/20 rounded px-1 py-1 truncate"
                        >
                            {subType === 'none' && (
                                <option value="none" className="bg-slate-900 text-slate-500 italic">Select Effect...</option>
                            )}
                            <option value="reverb" className="bg-slate-900 text-fuchsia-400">Wash Reverb</option>
                            <option value="delay" className="bg-slate-900 text-fuchsia-400">Ping-Pong Delay</option>
                            <option value="distortion" className="bg-slate-900 text-fuchsia-400">Heat Distortion</option>
                            <option value="phaser" className="bg-slate-900 text-fuchsia-400">Cosmic Phaser</option>
                            <option value="bitcrusher" className="bg-slate-900 text-fuchsia-400">Digital Crusher</option>
                        </select>
                        <LockButton id={id} isAdjacent={isAdjacent} accentColor="fuchsia-500" />
                    </div>

                    {subType !== 'none' && (
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
                                                    ? 'bg-fuchsia-500 text-white'
                                                    : 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                                            }`}
                                        >
                                            {isBypassed ? 'BYPASSED' : 'BYPASS'}
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{isBypassed ? 0 : mix}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={mix}
                                    onChange={handleMixChange}
                                    disabled={isBypassed}
                                    className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {subType === 'reverb' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depth</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{depth}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={depth}
                                        onChange={handleDepthChange}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'delay' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{(0.1 + (time / 100) * 0.9).toFixed(2)}s</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={time}
                                        onChange={handleTimeChange}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'distortion' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drive</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{depth}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={depth}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setDepth(val);
                                            updateNodeValue(id, { distortion: val / 100 });
                                        }}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'phaser' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speed</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{(0.1 + (time / 100) * 19.9).toFixed(1)}Hz</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={time}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setTime(val);
                                            updateNodeValue(id, { frequency: 0.1 + (val / 100) * 19.9 });
                                        }}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'bitcrusher' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bits</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{Math.round(1 + (depth / 100) * 7)}</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={depth}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setDepth(val);
                                            updateNodeValue(id, { bits: Math.round(1 + (val / 100) * 7) });
                                        }}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-fuchsia-500">
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
                    className={`w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all ${
                        subType === 'none' ? 'bg-slate-600' : 'bg-fuchsia-500'
                    }`}
                />
            )}
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className={`w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all ${
                        subType === 'none' ? 'bg-slate-600' : 'bg-fuchsia-500'
                    }`}
                />
            )}
        </div>
    );
}
