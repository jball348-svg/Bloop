import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_OUTPUT_HANDLE_ID,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import * as Tone from 'tone';
import LockButton from './LockButton';

const buildKeyMap = (oct: number): Record<string, string> => ({
    'a': `C${oct}`, 'w': `C#${oct}`, 's': `D${oct}`,
    'e': `D#${oct}`, 'd': `E${oct}`, 'f': `F${oct}`,
    't': `F#${oct}`, 'g': `G${oct}`, 'y': `G#${oct}`,
    'h': `A${oct}`, 'u': `A#${oct}`, 'j': `B${oct}`,
    'k': `C${oct + 1}`
});

const WHITE_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const BLACK_KEYS = [
    { key: 'w', offset: 0 },
    { key: 'e', offset: 28 },
    { key: 't', offset: 84 },
    { key: 'y', offset: 112 },
    { key: 'u', offset: 140 }
];

export default function KeysNode({ id }: { id: string }) {
    const fireNoteOn = useStore((state) => state.fireNoteOn);
    const fireNoteOff = useStore((state) => state.fireNoteOff);
    const updateOctave = useStore((state) => state.updateOctave);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });
    const octave = useStore((state) =>
        state.nodes.find((node) => node.id === id)?.data.octave ?? 4
    );

    const keyMap = buildKeyMap(octave);
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const heldKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
        const currentKeyMap = buildKeyMap(octave);

        const releaseHeldKeys = () => {
            heldKeys.current.forEach((key) => {
                const note = currentKeyMap[key];
                if (note) fireNoteOff(id, note);
            });
            heldKeys.current.clear();
            setActiveKeys(new Set());
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const note = currentKeyMap[key];
            if (note && !heldKeys.current.has(key)) {
                e.preventDefault();
                heldKeys.current.add(key);
                setActiveKeys(new Set(heldKeys.current));
                fireNoteOn(id, note);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const note = currentKeyMap[key];
            if (note) {
                heldKeys.current.delete(key);
                setActiveKeys(new Set(heldKeys.current));
                fireNoteOff(id, note);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            releaseHeldKeys();
        };
    }, [id, fireNoteOn, fireNoteOff, octave]);

    const handleMouseDown = (key: string, note: string) => {
        if (!heldKeys.current.has(key)) {
            heldKeys.current.add(key);
            setActiveKeys(new Set(heldKeys.current));
            fireNoteOn(id, note);
        }
    };

    const handleMouseUp = (key: string, note: string) => {
        if (heldKeys.current.has(key)) {
            heldKeys.current.delete(key);
            setActiveKeys(new Set(heldKeys.current));
            fireNoteOff(id, note);
        }
    };

    return (
        <div className={`bg-slate-800 border-2 border-white rounded-2xl p-3 shadow-2xl text-white w-72 flex flex-col transition-all hover:shadow-white/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-white hover:text-black hover:border-white flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                            style={{ boxShadow: `0 0 6px rgba(255, 255, 255, 0.3)` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNodeAndCleanUp(id);
                            }}
                        >
                            ×
                        </button>
                        <div className="flex-1 text-[10px] font-black uppercase text-white tracking-[0.2em] border-none outline-none cursor-default truncate text-center">
                            KEYS
                        </div>
                        <LockButton id={id} isAdjacent={isAdjacent} accentColor="white" />
                    </div>

                    <div className="flex flex-col items-center bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-1 mb-3">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest mr-1">OCT</span>
                            {[1, 2, 3, 4, 5, 6, 7].map((oct) => (
                                <button
                                    key={oct}
                                    onClick={() => updateOctave(id, oct)}
                                    className={`nodrag w-6 h-6 text-[10px] font-bold rounded transition-colors ${
                                        octave === oct
                                            ? 'bg-white text-black'
                                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                                >
                                    {oct}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex h-32 w-full justify-center select-none nodrag">
                            <div className="flex">
                                {WHITE_KEYS.map((key) => (
                                    <div
                                        key={key}
                                        onMouseDown={async () => { await Tone.start(); handleMouseDown(key, keyMap[key]); }}
                                        onMouseUp={() => handleMouseUp(key, keyMap[key])}
                                        onMouseLeave={() => handleMouseUp(key, keyMap[key])}
                                        className={`w-7 h-24 border border-white/20 flex items-end justify-center pb-2 text-[10px] font-bold rounded-b-md cursor-pointer transition-colors ${
                                            activeKeys.has(key) ? 'bg-white text-black border-white' : 'bg-white text-black/60'
                                        }`}
                                    >
                                        {key.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-0 left-[22px] flex pointer-events-none">
                                {BLACK_KEYS.map(({ key, offset }) => (
                                    <div
                                        key={key}
                                        onMouseDown={async () => { await Tone.start(); handleMouseDown(key, keyMap[key]); }}
                                        onMouseUp={() => handleMouseUp(key, keyMap[key])}
                                        onMouseLeave={() => handleMouseUp(key, keyMap[key])}
                                        style={{ left: `${offset}px` }}
                                        className={`absolute w-5 h-16 border border-white/20 flex items-end justify-center pb-2 text-[8px] font-bold rounded-b-sm cursor-pointer pointer-events-auto transition-colors z-20 ${
                                            activeKeys.has(key) ? 'bg-slate-200 text-black border-white' : 'bg-black text-white/60'
                                        }`}
                                    >
                                        {key.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-white">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            <Handle
                type="source"
                id={AUDIO_OUTPUT_HANDLE_ID}
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-black !-bottom-2 hover:scale-125 transition-all bg-white"
            />
        </div>
    );
}
