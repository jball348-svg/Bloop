import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    useStore,
} from '@/store/useStore';

interface PackedNodeProps {
    id: string;
}

export default function PackedNode({ id }: PackedNodeProps) {
    const nodes = useStore((state) => state.nodes);
    const node = nodes.find((n) => n.id === id);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const unpackGroup = useStore((state) => state.unpackGroup);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(node?.data.packedName || 'Packed Patch');
    const inputRef = useRef<HTMLInputElement>(null);

    // Identify the cluster and its boundaries based on SIGNAL_ORDER
    const SIGNAL_ORDER: Record<string, number> = {
        tempo: -1,
        controller: 0,
        keys: 0,
        chord: 0.5,
        adsr: 0.75,
        generator: 1,
        drum: 1,
        unison: 1.5,
        detune: 1.5,
        effect: 2,
        visualiser: 2.5,
        speaker: 3,
    };

    const packGroupId = node?.data.packGroupId;
    const clusterNodes = nodes.filter(n => n.data.packGroupId === packGroupId);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    if (clusterNodes.length === 0) return null;

    const entryNode = clusterNodes.reduce((a, b) => (SIGNAL_ORDER[a.type] ?? 99) < (SIGNAL_ORDER[b.type] ?? 99) ? a : b);
    const exitNode = clusterNodes.reduce((a, b) => (SIGNAL_ORDER[a.type] ?? -1) > (SIGNAL_ORDER[b.type] ?? -1) ? a : b);

    const hasControlIn = ['controller', 'keys', 'chord', 'adsr', 'generator', 'drum'].includes(entryNode.type);
    const hasAudioIn = ['effect', 'unison', 'detune', 'visualiser', 'speaker'].includes(entryNode.type);
    const hasControlOut = ['controller', 'keys', 'chord', 'adsr'].includes(exitNode.type);
    const hasAudioOut = ['generator', 'drum', 'effect', 'unison', 'detune', 'visualiser'].includes(exitNode.type);

    const handleBlur = () => {
        setIsEditing(false);
        updateNodeValue(id, { packedName: name });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div className={`bg-slate-800 border-2 border-orange-400 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-orange-400/20 group relative select-none${
            isAdjacent ? getAdjacencyGlowClasses(entryNode.type) : ''
        }`}>
            {/* Handles - Rendered conditionally based on cluster capabilities */}
            {hasControlIn && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-yellow-400"
                />
            )}
            {hasControlOut && (
                <Handle
                    type="source"
                    id={CONTROL_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-yellow-400"
                />
            )}
            {hasAudioIn && (
                <Handle
                    type="target"
                    id={AUDIO_INPUT_HANDLE_ID}
                    position={Position.Top}
                    className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-red-500"
                />
            )}
            {hasAudioOut && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-red-500"
                />
            )}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center h-5">
                    <div className="w-4" /> {/* Spacer for balance */}
                    
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="nodrag select-text bg-slate-900/50 border-b border-orange-400 text-[10px] font-black uppercase text-orange-400 text-center focus:outline-none px-1 w-32"
                        />
                    ) : (
                        <div 
                            className="flex-1 text-center text-[10px] font-black uppercase text-orange-400 tracking-[0.2em] cursor-pointer hover:text-orange-300 transition-colors"
                            onClick={() => setIsEditing(true)}
                        >
                            {name}
                        </div>
                    )}

                    <button
                        className="nodrag relative flex-shrink-0 w-4 h-4 rounded-full bg-slate-800/90 border border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-400 flex items-center justify-center z-20 transition-all hover:scale-110 backdrop-blur-sm shadow-[0_0_6px_rgba(251,146,60,0.3)]"
                        onClick={(e) => {
                            e.stopPropagation();
                            unpackGroup(id);
                        }}
                        title="Unpack Group"
                    >
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center py-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500/60 transition-all group-hover:scale-110 group-hover:text-orange-400 mb-1">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.29 7 12 12 20.71 7" />
                        <line x1="12" y1="22" x2="12" y2="12" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
