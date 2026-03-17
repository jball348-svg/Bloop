import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

export default function SpeakerNode({ id }: { id: string }) {
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);

    // Component-level initialization for default values
    useEffect(() => {
        updateNodeValue(id, { volume: 80 });
    }, [id, updateNodeValue]);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        updateNodeValue(id, { volume: val });
    };

    return (
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl text-white w-56 transition-all hover:shadow-emerald-500/20 group relative">
            {/* Speaker Grill Aesthetic */}
            <div className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl" 
                 style={{ backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">
                        Output
                    </div>
                    <div className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                        SPEAKER
                    </div>
                </div>

                <div className="w-full aspect-square bg-slate-800 rounded-full mb-6 border-4 border-slate-700 flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
                    <div className="w-1/2 h-1/2 bg-slate-900 rounded-full border-2 border-slate-600 shadow-inner flex items-center justify-center">
                         <div className="w-1/3 h-1/3 bg-slate-800 rounded-full border border-slate-500" />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Main Volume</label>
                            <button 
                                onClick={() => {
                                    const nextMuted = !isMuted;
                                    setIsMuted(nextMuted);
                                    updateNodeValue(id, { volume: nextMuted ? 0 : volume, mute: nextMuted });
                                }}
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                                    isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                }`}
                            >
                                {isMuted ? 'MUTED' : 'MUTE'}
                            </button>
                        </div>
                        <span className="text-sm font-mono text-emerald-400 font-bold">{isMuted ? 0 : volume}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        disabled={isMuted}
                        className="nodrag w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* The input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-fuchsia-500 border-4 border-slate-900 !-top-2 hover:scale-125 transition-transform"
            />
        </div>
    );
}
