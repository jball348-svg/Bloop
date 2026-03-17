import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';
import * as Tone from 'tone';

export default function GeneratorNode({ id }: { id: string }) {
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize audio node on mount
    useEffect(() => {
        initAudioNode(id, 'generator');
        return () => removeAudioNode(id);
    }, [id, initAudioNode, removeAudioNode]);

    const togglePlay = () => {
        if (!isPlaying) {
            Tone.Transport.start();
        } else {
            Tone.Transport.stop();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-5 shadow-2xl text-white w-56 transition-all hover:shadow-indigo-500/20 group">
            <div className="flex justify-between items-center mb-6">
                <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                    Generator
                </div>
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>

            <h3 className="text-lg font-bold mb-1 group-hover:text-indigo-300 transition-colors">
                Chaos Spark
            </h3>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4">C Minor Pentatonic</p>

            <button
                onClick={togglePlay}
                className={`w-full py-3 rounded-xl font-bold transition-all transform active:scale-95 ${isPlaying
                        ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 hover:bg-emerald-500/30'
                    }`}
            >
                {isPlaying ? 'STOP' : 'PLAY'}
            </button>


            {/* The output port at the bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-4 h-4 bg-indigo-500 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-transform"
            />
        </div>
    );
}