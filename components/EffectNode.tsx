import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

export default function EffectNode({ id }: { id: string }) {
    const initAudioNode = useStore((state) => state.initAudioNode);
    const removeAudioNode = useStore((state) => state.removeAudioNode);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const [mix, setMix] = useState(50);

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
        <div className="bg-slate-900 border-2 border-fuchsia-500 rounded-2xl p-5 shadow-2xl text-white w-56 transition-all hover:shadow-fuchsia-500/20 group">
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Mix</label>
                    <span className="text-sm font-mono text-fuchsia-400 font-bold">{mix}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={mix}
                    onChange={handleMixChange}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
            </div>


            {/* The input port at the top */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-fuchsia-500 border-4 border-slate-900 !-top-2 hover:scale-125 transition-transform"
            />
        </div>
    );
}