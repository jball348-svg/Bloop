import { useStore } from '@/store/useStore';

interface LockButtonProps {
    id: string;
    isAdjacent: boolean;
    accentColor: string;
}

export default function LockButton({ id, isAdjacent, accentColor }: LockButtonProps) {
    const node = useStore((state) => state.nodes.find((n) => n.id === id));
    const isLocked = node?.data.isLocked;
    const isPacked = node?.data.isPacked;
    const toggleNodeLock = useStore((state) => state.toggleNodeLock);
    const packGroup = useStore((state) => state.packGroup);

    if (!isAdjacent && !isLocked && !isPacked) {
        return <div className="w-3.5 h-3.5 flex-shrink-0 ml-1.5" />;
    }

    if (isPacked) return null; // PackedNode handles its own UI

    return (
        <div className="flex items-center gap-1 ml-1.5">
            <button
                className={`nodrag relative flex-shrink-0 w-3.5 h-3.5 rounded-full bg-slate-800/90 border flex items-center justify-center z-20 transition-all hover:scale-110 backdrop-blur-sm ${
                    isLocked 
                        ? `border-${accentColor} text-${accentColor.replace('-500', '-400')}` 
                        : 'border-slate-600/50 text-slate-500 hover:text-cyan-400 hover:border-cyan-400'
                }`}
                style={isLocked ? { boxShadow: `0 0 6px rgba(34, 211, 238, 0.3)` } : {}}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeLock(id);
                }}
                title={isLocked ? "Unlock Group" : "Lock Group"}
            >
                {isLocked ? (
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                )}
            </button>

            {isLocked && (
                <button
                    className={`nodrag relative flex-shrink-0 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-${accentColor}/50 text-${accentColor.replace('-500', '-400')} hover:bg-${accentColor} hover:text-white hover:border-${accentColor} flex items-center justify-center z-20 transition-all hover:scale-110 backdrop-blur-sm`}
                    onClick={(e) => {
                        e.stopPropagation();
                        packGroup(id);
                    }}
                    title="Pack Group"
                >
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.29 7 12 12 20.71 7" />
                        <line x1="12" y1="22" x2="12" y2="12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
