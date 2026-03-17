import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore, ROOT_NOTES, SCALES } from '@/store/useStore';
import * as Tone from 'tone';

export default function GeneratorNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const updateArpScale = useStore((state) => state.updateArpScale);
    const nodeData = useStore((state) => state.nodes.find(n => n.id === id)?.data);
    
    const subType = nodeData?.subType || 'none';
    const isPlaying = nodeData?.isPlaying || false;
    const rootNote = nodeData?.rootNote || 'C';
    const scaleType = nodeData?.scaleType || 'pentatonic';

    const [freq, setFreq] = useState(440);

    const togglePlay = () => {
        toggleNodePlayback(id, !isPlaying);
    };

    const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubType = e.target.value;
        changeNodeSubType(id, 'generator', newSubType);
    };

    const handleFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setFreq(val);
        updateNodeValue(id, { frequency: val });
    };

    return (
        <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-5 shadow-2xl text-white w-56 min-h-[160px] flex flex-col transition-all hover:shadow-indigo-500/20 group relative">
            {/* Generator Pattern Aesthetic - Subtle Grid */}
            {subType !== 'none' && (
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-2xl overflow-hidden">
                    <div className="absolute inset-0" 
                         style={{ 
                             backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                             backgroundSize: '20px 20px'
                         }} />
                </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className={`flex justify-between items-center ${subType === 'none' ? 'h-full' : 'mb-6'}`}>
                    <select 
                        value={subType}
                        onChange={handleSubTypeChange}
                        className="nodrag w-full bg-indigo-500/10 text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] border-none outline-none cursor-pointer hover:bg-indigo-500/20 rounded px-1 py-1 truncate"
                    >
                        {subType === 'none' && (
                            <option value="none" className="bg-slate-900 text-slate-500 italic">Select Generator...</option>
                        )}
                        <option value="arp" className="bg-slate-900 text-indigo-400">Arpeggiator</option>
                        <option value="wave" className="bg-slate-900 text-indigo-400">Continuous Wave</option>
                    </select>
                    {subType !== 'none' && (
                        <div className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    )}
                </div>

                {subType !== 'none' && (
                    <div className="flex flex-col gap-4">
                        {subType === 'arp' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Root</label>
                                    <select 
                                        value={rootNote}
                                        onChange={(e) => updateArpScale(id, e.target.value, scaleType)}
                                        className="nodrag bg-slate-800 text-[10px] text-indigo-300 border-none outline-none rounded p-1"
                                    >
                                        {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scale</label>
                                    <select 
                                        value={scaleType}
                                        onChange={(e) => updateArpScale(id, rootNote, e.target.value as any)}
                                        className="nodrag bg-slate-800 text-[10px] text-indigo-300 border-none outline-none rounded p-1"
                                    >
                                        {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {subType === 'wave' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</label>
                                    <span className="text-[10px] font-mono text-indigo-400 font-bold">{freq}Hz</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="2000"
                                    value={freq}
                                    onChange={handleFreqChange}
                                    className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        )}
                        
                        <button
                            onClick={togglePlay}
                            className={`w-full py-2.5 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isPlaying
                                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 hover:bg-emerald-500/30'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-400' : 'bg-emerald-400'}`} />
                            {isPlaying ? 'STOP' : 'PLAY'}
                        </button>
                    </div>
                )}
            </div>

            {/* The output port at the bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className={`w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all ${
                    subType === 'none' ? 'bg-slate-600 grayscale' : 'bg-indigo-500'
                }`}
            />
        </div>
    );
}