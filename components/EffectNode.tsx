import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

export default function EffectNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const subType = useStore((state) => state.nodes.find(n => n.id === id)?.data.subType || 'none');
    const [mix, setMix] = useState(50);
    const [isBypassed, setIsBypassed] = useState(false);

    // Initialize audio node on mount
    useEffect(() => {
        if (subType !== 'none') {
            initAudioNode(id, 'effect', subType);
        }
        return () => removeAudioNode(id);
    }, [id, initAudioNode, removeAudioNode, subType]);

    const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubType = e.target.value;
        changeNodeSubType(id, 'effect', newSubType);
    };

    const handleMixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setMix(val);
        updateNodeValue(id, { wet: val / 100 });
    };

    return (
        <div className="bg-slate-900 border-2 border-fuchsia-500 rounded-2xl p-5 shadow-2xl text-white w-56 min-h-[160px] flex flex-col transition-all hover:shadow-fuchsia-500/20 group relative">
            {/* Effect Pattern Aesthetic - Diagonal Stripes */}
            {subType !== 'none' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl overflow-hidden">
                    <div className="absolute inset-0" 
                         style={{ 
                             backgroundImage: 'repeating-linear-gradient(45deg, #d946ef 0, #d946ef 1px, transparent 0, transparent 50%)', 
                             backgroundSize: '10px 10px' 
                         }} />
                </div>
            )}
            
            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className={`flex justify-between items-center ${subType === 'none' ? 'h-full' : 'mb-6'}`}>
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
                    </select>
                </div>

                {subType !== 'none' && (
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
                )}
            </div>

            {/* The input port at the top */}
            <Handle
                type="target"
                position={Position.Top}
                className={`w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all ${
                    subType === 'none' ? 'bg-slate-600 grayscale' : 'bg-fuchsia-500'
                }`}
            />

            {/* The output port at the bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className={`w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all ${
                    subType === 'none' ? 'bg-slate-600 grayscale' : 'bg-fuchsia-500'
                }`}
            />
        </div>
    );
}