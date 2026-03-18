import { useStore } from '@/store/useStore';

export default function SpeakerNode({ id: _id }: { id: string }) {
    void _id;

    const masterVolume = useStore((state) => state.masterVolume);
    const setMasterVolume = useStore((state) => state.setMasterVolume);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMasterVolume(parseFloat(e.target.value));
    };

    return (
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl text-white w-56 transition-all hover:shadow-emerald-500/20 group relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl"
                 style={{ backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)', backgroundSize: '4px 4px' }} />

            <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Output</div>
                    <div className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">SPEAKER</div>
                </div>

                <div className="w-full aspect-square bg-slate-800 rounded-full mb-6 border-4 border-slate-700 flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
                    <div className="w-1/2 h-1/2 bg-slate-900 rounded-full border-2 border-slate-600 shadow-inner flex items-center justify-center">
                        <div className="w-1/3 h-1/3 bg-slate-800 rounded-full border border-slate-500" />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Master Volume</label>
                        <span className="text-sm font-mono text-emerald-400 font-bold">{masterVolume}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={masterVolume}
                        onChange={handleVolumeChange}
                        className="nodrag w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="rounded-xl border border-emerald-500/20 bg-slate-800/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        Global output control
                    </div>
                </div>
            </div>
        </div>
    );
}
