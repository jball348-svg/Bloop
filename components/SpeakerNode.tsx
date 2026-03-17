import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

export default function SpeakerNode({ id }: { id: string }) {
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const [volume, setVolume] = useState(80);

    // Initialize audio node on mount
    useEffect(() => {
        initAudioNode(id, 'speaker');
        // Set initial volume
        updateNodeValue(id, { volume: 80 });
        return () => removeAudioNode(id);
    }, [id, initAudioNode, removeAudioNode]);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        updateNodeValue(id, { volume: val });
    };

    return (
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl text-white w-56 transition-all hover:shadow-emerald-500/20 group relative overflow-hidden">
            {/* Speaker Grill Aesthetic */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
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
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Main Volume</label>
                        <span className="text-sm font-mono text-emerald-400 font-bold">{volume}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="nodrag w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
            </div>

            {/* The input port at the top */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-emerald-500 border-4 border-slate-900 !-top-2 hover:scale-125 transition-transform"
            />
        </div>
    );
}
