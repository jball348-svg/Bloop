import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

export default function EffectNode({ id }: { id: string }) {
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const [mix, setMix] = useState(50);
    const [isBypassed, setIsBypassed] = useState(false);

    // Initialize audio node on mount
    useEffect(() => {
        initAudioNode(id, 'effect');
        return () => removeAudioNode(id);
    }, [id, initAudioNode, removeAudioNode]);

    const handleMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setMix(val);
        updateNodeValue(id, { wet: val / 100 });
    };

    return (
        <div className="bg-slate-900 border-2 border-fuchsia-500 rounded-2xl p-5 shadow-2xl text-white w-56 transition-all hover:shadow-fuchsia-500/20 group relative">
            {/* Effect Pattern Aesthetic - Diagonal Stripes */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl overflow-hidden">
                <div className="absolute inset-0" 
                     style={{ 
                         backgroundImage: 'repeating-linear-gradient(45deg, #d946ef 0, #d946ef 1px, transparent 0, transparent 50%)', 
                         backgroundSize: '10px 10px' 
                     }} />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[10px] font-black uppercase text-fuchsia-400 tracking-[0.2em]">
                        Effect
                    </div>
                    <div className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-500/20 px-2 py-0.5 rounded">
                        REVERB
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-4 group-hover:text-fuchsia-300 transition-colors">
                    Wash Reverb
                </h3>

                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Mix</label>
                            <button 
                                onClick={() => {
                                    const nextBypassed = !isBypassed;
                                    setIsBypassed(nextBypassed);
                                    updateNodeValue(id, { bypass: nextBypassed, wet: mix / 100 });
                                }}
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                                    isBypassed ? 'bg-fuchsia-500 text-white' : 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50'
                                }`}
                            >
                                {isBypassed ? 'BYPASSED' : 'BYPASS'}
                            </button>
                        </div>
                        <span className="text-sm font-mono text-fuchsia-400 font-bold">{isBypassed ? 0 : mix}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={mix}
                        onChange={handleMixChange}
                        disabled={isBypassed}
                        className="nodrag w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* The input port at the top */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-fuchsia-500 border-4 border-slate-900 !-top-2 hover:scale-125 transition-transform"
            />

            {/* The output port at the bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-4 h-4 bg-fuchsia-500 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-transform"
            />
        </div>
    );
}