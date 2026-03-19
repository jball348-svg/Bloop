import { useStore } from '@/store/useStore';

interface LockButtonProps {
    id: string;
    isAdjacent: boolean;
    accentColor: string;
}

export default function LockButton({ id, isAdjacent, accentColor }: LockButtonProps) {
    const isLocked = useStore((state) => state.nodes.find((n) => n.id === id)?.data.isLocked);
    const toggleNodeLock = useStore((state) => state.toggleNodeLock);

    if (!isAdjacent && !isLocked) {
        return <div className="w-3.5 h-3.5 flex-shrink-0 ml-1.5" />;
    }

    return (
        <button
            className={`nodrag relative flex-shrink-0 w-3.5 h-3.5 ml-1.5 rounded-full bg-slate-800/90 border flex items-center justify-center z-20 transition-all hover:scale-110 backdrop-blur-sm ${
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
    );
}
