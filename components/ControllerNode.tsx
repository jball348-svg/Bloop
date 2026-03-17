import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore, ROOT_NOTES } from '@/store/useStore';
import { Scale } from '@tonaljs/tonal';
import * as Tone from 'tone';

const TONAL_SCALES = [
    'major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
    'major pentatonic', 'minor pentatonic', 'blues', 'chromatic'
];

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

export default function ControllerNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state: any) => state.changeNodeSubType);
    const fireNoteOn = useStore((state: any) => state.fireNoteOn);
    const fireNoteOff = useStore((state: any) => state.fireNoteOff);
    const updateArpScale = useStore((state: any) => state.updateArpScale);
    const updateOctave = useStore((state: any) => state.updateOctave);
    const isAdjacent = useStore((state: any) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state: any) => {
        const edges = state.edges;
        return !edges.some((e: any) => e.source === id || e.target === id);
    });
    const octave = useStore((state: any) =>
        state.nodes.find((n: any) => n.id === id)?.data.octave ?? 4
    );

    const nodeData = useStore((state: any) => state.nodes.find((n: any) => n.id === id)?.data);
    const subType = nodeData?.subType || 'none';
    const rootNote = nodeData?.rootNote || 'C';
    const scaleType = nodeData?.scaleType || 'major pentatonic';
    const keyMap = buildKeyMap(octave);

    const [isPlaying, setIsPlaying] = useState(false);
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const heldKeys = useRef<Set<string>>(new Set());
    const seqRef = useRef<Tone.Sequence | null>(null);

    // Keyboard Logic
    useEffect(() => {
        if (subType !== 'keys') return;
        const currentKeyMap = buildKeyMap(octave);

        const releaseHeldKeys = () => {
            heldKeys.current.forEach((key) => {
                const note = currentKeyMap[key];
                if (note) {
                    fireNoteOff(id, note);
                }
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
    }, [subType, id, fireNoteOn, fireNoteOff, octave]);

    // Arpeggiator Logic
    useEffect(() => {
        if (subType !== 'arp' || !isPlaying) {
            if (seqRef.current) {
                seqRef.current.stop();
                seqRef.current.dispose();
                seqRef.current = null;
            }
            Tone.getTransport().stop();
            return;
        }

        const notes = Scale.get(`${rootNote}4 ${scaleType}`).notes;
        if (notes.length === 0) return;

        // Dispose any existing sequence before creating a new one
        if (seqRef.current) {
            seqRef.current.stop();
            seqRef.current.dispose();
        }

        seqRef.current = new Tone.Sequence(
            (time, note) => {
                fireNoteOn(id, note);
                // Schedule the note-off slightly before the next step
                Tone.getDraw().schedule(() => {}, time);
                setTimeout(() => fireNoteOff(id, note), 80);
            },
            notes,
            '8n'
        );

        seqRef.current.start(0);
        Tone.getTransport().bpm.value = 120;
        Tone.getTransport().start();

        return () => {
            if (seqRef.current) {
                seqRef.current.stop();
                seqRef.current.dispose();
                seqRef.current = null;
            }
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
            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
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
                            <div className="flex items-center gap-1 mb-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">OCT</span>
                                {[1, 2, 3, 4, 5, 6, 7].map((oct) => (
                                    <button
                                        key={oct}
                                        onClick={() => updateOctave(id, oct)}
                                        className={`nodrag w-6 h-6 text-[10px] font-bold rounded transition-colors ${
                                            octave === oct
                                                ? 'bg-yellow-400 text-slate-900'
                                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
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
                                            className={`w-7 h-24 border border-slate-300 flex items-end justify-center pb-2 text-[10px] font-bold rounded-b-md cursor-pointer transition-colors ${
                                                activeKeys.has(key) ? 'bg-yellow-400 text-slate-900 border-yellow-500' : 'bg-white text-slate-400'
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
                                            className={`absolute w-5 h-16 border border-slate-700 flex items-end justify-center pb-2 text-[8px] font-bold rounded-b-sm cursor-pointer pointer-events-auto transition-colors z-20 ${
                                                activeKeys.has(key) ? 'bg-yellow-400 text-slate-900 border-yellow-500' : 'bg-black text-slate-500'
                                            }`}
                                        >
                                            {key.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-yellow-500">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                            not connected
                        </span>
                        <div className="flex-1 h-px bg-current" />
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
