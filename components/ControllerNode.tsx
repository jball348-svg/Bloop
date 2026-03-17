import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore, ROOT_NOTES } from '@/store/useStore';
import { Scale } from '@tonaljs/tonal';
import * as Tone from 'tone';

const TONAL_SCALES = [
    'major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
    'major pentatonic', 'minor pentatonic', 'blues', 'chromatic'
];

const KEY_TO_NOTE: Record<string, string> = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4', 'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4', 'u': 'A#4', 'j': 'B4', 'k': 'C5'
};

export default function ControllerNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state: any) => state.changeNodeSubType);
    const fireNoteOn = useStore((state: any) => state.fireNoteOn);
    const fireNoteOff = useStore((state: any) => state.fireNoteOff);
    const updateArpScale = useStore((state: any) => state.updateArpScale);
    const isAdjacent = useStore((state: any) => state.adjacentNodeIds.has(id));

    const nodeData = useStore((state: any) => state.nodes.find((n: any) => n.id === id)?.data);
    const subType = nodeData?.subType || 'none';
    const rootNote = nodeData?.rootNote || 'C';
    const scaleType = nodeData?.scaleType || 'major pentatonic';

    const [isPlaying, setIsPlaying] = useState(false);
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const heldKeys = useRef<Set<string>>(new Set());
    const arpRef = useRef<any>(null);

    // Keyboard Logic
    useEffect(() => {
        if (subType !== 'keys') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];
            if (note && !heldKeys.current.has(key)) {
                e.preventDefault();
                heldKeys.current.add(key);
                setActiveKeys(new Set(heldKeys.current));
                fireNoteOn(id, note);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];
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
            heldKeys.current.forEach(key => fireNoteOff(id, KEY_TO_NOTE[key]));
            heldKeys.current.clear();
            setActiveKeys(new Set());
        };
    }, [subType, id, fireNoteOn, fireNoteOff]);

    // Arpeggiator Logic
    useEffect(() => {
        if (subType !== 'arp' || !isPlaying) {
            if (arpRef.current) clearInterval(arpRef.current);
            return;
        }

        const notes = Scale.get(`${rootNote}4 ${scaleType}`).notes;
        let index = 0;

        arpRef.current = setInterval(() => {
            const note = notes[index % notes.length];
            fireNoteOn(id, note);
            setTimeout(() => fireNoteOff(id, note), 100);
            index++;
        }, 200);

        return () => {
            if (arpRef.current) clearInterval(arpRef.current);
        };
    }, [subType, isPlaying, rootNote, scaleType, id, fireNoteOn, fireNoteOff]);

    const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        changeNodeSubType(id, 'controller', e.target.value);
    };

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
        <div className={`bg-slate-900 border-2 border-yellow-500 rounded-2xl p-5 shadow-2xl text-white w-72 min-h-[160px] flex flex-col transition-all hover:shadow-yellow-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>
            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                    <select
                        value={subType}
                        onChange={handleSubTypeChange}
                        className="nodrag w-full bg-yellow-500/10 text-[10px] font-black uppercase text-yellow-400 tracking-[0.2em] border-none outline-none cursor-pointer hover:bg-yellow-500/20 rounded px-1 py-1 truncate"
                    >
                        <option value="arp" className="bg-slate-900 text-yellow-400">Arpeggiator</option>
                        <option value="keys" className="bg-slate-900 text-yellow-400">QWERTY Keyboard</option>
                    </select>
                </div>

                {subType === 'arp' && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Root</label>
                                <select
                                    value={rootNote}
                                    onChange={(e) => updateArpScale(id, e.target.value, scaleType)}
                                    className="nodrag bg-slate-800 text-[10px] text-yellow-300 border-none outline-none rounded p-1"
                                >
                                    {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scale</label>
                                <select
                                    value={scaleType}
                                    onChange={(e) => updateArpScale(id, rootNote, e.target.value)}
                                    className="nodrag bg-slate-800 text-[10px] text-yellow-300 border-none outline-none rounded p-1"
                                >
                                    {TONAL_SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                await Tone.start();
                                setIsPlaying(!isPlaying);
                            }}
                            className={`w-full py-2.5 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                                isPlaying
                                    ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500/50 hover:bg-yellow-500/30'
                                    : 'bg-yellow-500 text-slate-900 hover:bg-yellow-600'
                            }`}
                        >
                            {isPlaying ? 'STOP' : 'PLAY'}
                        </button>
                    </div>
                )}

                {subType === 'keys' && (
                    <div className="flex flex-col items-center bg-slate-800/50 p-4 rounded-xl border border-yellow-500/20">
                        <div className="relative flex h-32 w-full justify-center select-none nodrag">
                            <div className="flex">
                                {[
                                    { k: 'a', n: 'C4' }, { k: 's', n: 'D4' }, { k: 'd', n: 'E4' },
                                    { k: 'f', n: 'F4' }, { k: 'g', n: 'G4' }, { k: 'h', n: 'A4' },
                                    { k: 'j', n: 'B4' }, { k: 'k', n: 'C5' }
                                ].map(({ k, n }) => (
                                    <div
                                        key={k}
                                        onMouseDown={async () => { await Tone.start(); handleMouseDown(k, n); }}
                                        onMouseUp={() => handleMouseUp(k, n)}
                                        onMouseLeave={() => handleMouseUp(k, n)}
                                        className={`w-7 h-24 border border-slate-300 flex items-end justify-center pb-2 text-[10px] font-bold rounded-b-md cursor-pointer transition-colors ${
                                            activeKeys.has(k) ? 'bg-yellow-400 text-slate-900 border-yellow-500' : 'bg-white text-slate-400'
                                        }`}
                                    >
                                        {k.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-0 left-[22px] flex pointer-events-none">
                                {[
                                    { k: 'w', n: 'C#4', offset: 0 },
                                    { k: 'e', n: 'D#4', offset: 28 },
                                    { k: 't', n: 'F#4', offset: 84 },
                                    { k: 'y', n: 'G#4', offset: 112 },
                                    { k: 'u', n: 'A#4', offset: 140 }
                                ].map(({ k, n, offset }) => (
                                    <div
                                        key={k}
                                        onMouseDown={async () => { await Tone.start(); handleMouseDown(k, n); }}
                                        onMouseUp={() => handleMouseUp(k, n)}
                                        onMouseLeave={() => handleMouseUp(k, n)}
                                        style={{ left: `${offset}px` }}
                                        className={`absolute w-5 h-16 border border-slate-700 flex items-end justify-center pb-2 text-[8px] font-bold rounded-b-sm cursor-pointer pointer-events-auto transition-colors z-20 ${
                                            activeKeys.has(k) ? 'bg-yellow-400 text-slate-900 border-yellow-500' : 'bg-black text-slate-500'
                                        }`}
                                    >
                                        {k.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-yellow-400"
            />
        </div>
    );
}
