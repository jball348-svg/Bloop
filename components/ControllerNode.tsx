import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore, ROOT_NOTES } from '@/store/useStore';
import { Scale } from '@tonaljs/tonal';

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
    
    const nodeData = useStore((state: any) => state.nodes.find((n: any) => n.id === id)?.data);
    const subType = nodeData?.subType || 'none';
    const rootNote = nodeData?.rootNote || 'C';
    const scaleType = nodeData?.scaleType || 'major pentatonic';

    const [isPlaying, setIsPlaying] = useState(false);
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
                heldKeys.current.add(key);
                fireNoteOn(id, note);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];
            if (note) {
                heldKeys.current.delete(key);
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
        };
    }, [subType, id, fireNoteOn, fireNoteOff]);

    // Arpeggiator Logic (using a local interval for simplicity and true modularity)
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

    return (
        <div className="bg-slate-900 border-2 border-yellow-500 rounded-2xl p-5 shadow-2xl text-white w-56 min-h-[160px] flex flex-col transition-all hover:shadow-yellow-500/20 group relative">
            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                    <select 
                        value={subType}
                        onChange={handleSubTypeChange}
                        className="nodrag w-full bg-yellow-500/10 text-[10px] font-black uppercase text-yellow-400 tracking-[0.2em] border-none outline-none cursor-pointer hover:bg-yellow-500/20 rounded px-1 py-1 truncate"
                    >
                        <option value="none" className="bg-slate-900 text-slate-500 italic">Select Controller...</option>
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
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`w-full py-2.5 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isPlaying
                                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 hover:bg-emerald-500/30'
                            }`}
                        >
                            {isPlaying ? 'STOP' : 'PLAY'}
                        </button>
                    </div>
                )}

                {subType === 'keys' && (
                    <div className="flex flex-col gap-2 bg-slate-800/50 p-3 rounded-lg border border-yellow-500/20">
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {['A','W','S','E','D','F','T'].map(k => (
                                <div key={k} className="flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 font-bold">{k}</span>
                                    <div className={`w-4 h-6 rounded-sm border ${['W','E','T'].includes(k) ? 'bg-slate-900 border-yellow-500/50' : 'bg-yellow-500/20 border-yellow-500/50'}`} />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                            {['G','Y','H','U','J','K'].map(k => (
                                <div key={k} className="flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 font-bold">{k}</span>
                                    <div className={`w-4 h-6 rounded-sm border ${['Y','U'].includes(k) ? 'bg-slate-900 border-yellow-500/50' : 'bg-yellow-500/20 border-yellow-500/50'}`} />
                                </div>
                            ))}
                        </div>
                        <span className="text-[8px] text-yellow-300/50 font-bold uppercase tracking-tighter text-center mt-2">QWERTY KEYBOARD ACTIVE</span>
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
