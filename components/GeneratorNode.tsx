import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';
import * as Tone from 'tone';

export default function GeneratorNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const nodeData = useStore((state) => state.nodes.find(n => n.id === id)?.data);
    const subType = nodeData?.subType || 'none';
    const isPlaying = nodeData?.isPlaying || false;

    // Initialize audio node on mount
    useEffect(() => {
        if (subType !== 'none') {
            initAudioNode(id, 'generator', subType);
        }
        return () => removeAudioNode(id);
    }, [id, initAudioNode, removeAudioNode, subType]);

    const togglePlay = () => {
        toggleNodePlayback(id, !isPlaying);
    };

    const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubType = e.target.value;
        changeNodeSubType(id, 'generator', newSubType);
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
                    <>
                        <button
                            onClick={togglePlay}
                            className={`w-full py-3 mt-4 rounded-xl font-bold transition-all transform active:scale-95 ${isPlaying
                                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 hover:bg-emerald-500/30'
                                }`}
                        >
                            {isPlaying ? 'STOP' : 'PLAY'}
                        </button>
                    </>
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