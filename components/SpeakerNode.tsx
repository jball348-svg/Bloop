import { useStore } from '@/store/useStore';

export default function SpeakerNode({ id }: { id: string }) {
    const masterVolume = useStore((state) => state.masterVolume);
    const setMasterVolume = useStore((state) => state.setMasterVolume);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMasterVolume(parseFloat(e.target.value));
    };

    return (
        <div className={`bg-slate-900 border-2 border-emerald-500 rounded-2xl p-3 shadow-2xl text-white w-56 transition-all hover:shadow-emerald-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>
            <div className="relative z-10 flex flex-col">
                <div className="flex items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px rgba(16, 185, 129, 0.3)` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Amplifier</div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Master Volume</label>
                        <span className="text-sm font-mono text-emerald-400 font-bold">{masterVolume}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={masterVolume}
                        onChange={handleVolumeChange}
                        className="nodrag w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
            </div>
        </div>
    );
}
