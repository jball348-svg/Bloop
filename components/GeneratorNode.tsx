import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store/useStore';

const WAVE_SHAPES = ['sine', 'square', 'triangle', 'sawtooth'];

export default function GeneratorNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state: any) => state.updateNodeValue);
    const nodeData = useStore((state: any) => state.nodes.find((n: any) => n.id === id)?.data);
    
    const subType = nodeData?.subType || 'none';
    const waveShape = nodeData?.waveShape || 'sine';

    const [freq, setFreq] = useState(440);

    const handleWaveShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateNodeValue(id, { waveShape: e.target.value });
    };

    const handleFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setFreq(val);
        updateNodeValue(id, { frequency: val });
    };

    return (
        <div className="bg-slate-900 border-2 border-blue-500 rounded-2xl p-5 shadow-2xl text-white w-56 min-h-[160px] flex flex-col transition-all hover:shadow-blue-500/20 group relative">
            {/* Input handle for MIDI data from Controller */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-yellow-400"
            />

            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Generator</span>
                    <div className="w-2 h-2 rounded-full ml-2 flex-shrink-0 bg-blue-400 animate-pulse" />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wave Shape</label>
                        <select 
                            value={waveShape}
                            onChange={handleWaveShapeChange}
                            className="nodrag bg-slate-800 text-[10px] text-blue-300 border-none outline-none rounded p-1 uppercase font-bold"
                        >
                            {WAVE_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {subType === 'wave' && (
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</label>
                                <span className="text-[10px] font-mono text-blue-400 font-bold">{freq}Hz</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="2000"
                                value={freq}
                                onChange={handleFreqChange}
                                className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Audio output port at the bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-blue-500"
            />
        </div>
    );
}