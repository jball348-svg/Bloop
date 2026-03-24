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

export default function EffectNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });
    const subType = nodeData?.subType || 'none';
    const accentStyle = useNodeAccentStyle('effect');
    const wet = nodeData?.wet ?? 0.5;
    const mix = Math.round(wet * 100);
    const roomSize = Math.round((nodeData?.roomSize ?? 0.5) * 100);
    const delayTime = nodeData?.delayTime ?? 0.45;
    const feedback = nodeData?.feedback ?? 0.4;
    const distortion = Math.round((nodeData?.distortion ?? 0.5) * 100);
    const phaserFrequency = nodeData?.frequency ?? 4;
    const bits = nodeData?.bits ?? 4;
    const isBypassed = wet <= 0.001;

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        changeNodeSubType(id, 'effect', e.target.value);
    };

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-fuchsia-500 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-fuchsia-500/20 group relative select-none${
            isAdjacent ? getAdjacencyGlowClasses('effect') : ''
        }`}
        >
            <ModulationTargetHandle paramKey="wet" top={84} />
            {subType === 'reverb' && <ModulationTargetHandle paramKey="roomSize" top={150} />}
            {subType === 'delay' && (
                <>
                    <ModulationTargetHandle paramKey="delayTime" top={150} />
                    <ModulationTargetHandle paramKey="feedback" top={206} />
                </>
            )}
            {subType === 'phaser' && <ModulationTargetHandle paramKey="frequency" top={150} />}

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
                            <NodeMixControl
                                value={mix}
                                bypassed={isBypassed}
                                onToggleBypass={() => {
                                    updateNodeValue(id, { wet: isBypassed ? 0.5 : 0 });
                                }}
                                onChange={(value) => updateNodeValue(id, { wet: value / 100 })}
                            />

                            {subType === 'reverb' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depth</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{roomSize}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={roomSize}
                                        onChange={(event) => updateNodeValue(id, { roomSize: Number(event.target.value) / 100 })}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'delay' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                                            <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{delayTime.toFixed(2)}s</span>
                                        </div>
                                        <input type="range" min="0.05" max="1.2" step="0.01" value={delayTime}
                                            onChange={(event) => updateNodeValue(id, { delayTime: Number(event.target.value) })}
                                            className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback</label>
                                            <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{Math.round(feedback * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="0.95" step="0.01" value={feedback}
                                            onChange={(event) => updateNodeValue(id, { feedback: Number(event.target.value) })}
                                            className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                        />
                                    </div>
                                </>
                            )}

                            {subType === 'distortion' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drive</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{distortion}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={distortion}
                                        onChange={(event) => updateNodeValue(id, { distortion: Number(event.target.value) / 100 })}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'phaser' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speed</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{phaserFrequency.toFixed(1)}Hz</span>
                                    </div>
                                    <input type="range" min="0.1" max="20" step="0.1" value={phaserFrequency}
                                        onChange={(event) => updateNodeValue(id, { frequency: Number(event.target.value) })}
                                        className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            )}

                            {subType === 'bitcrusher' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bits</label>
                                        <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{bits}</span>
                                    </div>
                                    <input type="range" min="1" max="8" step="1" value={bits}
                                        onChange={(event) => updateNodeValue(id, { bits: Number(event.target.value) })}
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
