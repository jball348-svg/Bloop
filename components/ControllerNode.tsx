import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_OUTPUT_HANDLE_ID,
    ROOT_NOTES,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import { Scale } from '@tonaljs/tonal';
import * as Tone from 'tone';
import LockButton from './LockButton';

const TONAL_SCALES = [
    'major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
    'major pentatonic', 'minor pentatonic', 'blues', 'chromatic'
];


export default function ControllerNode({ id }: { id: string }) {
    const changeNodeSubType = useStore((state) => state.changeNodeSubType);
    const fireNoteOn = useStore((state) => state.fireNoteOn);
    const fireNoteOff = useStore((state) => state.fireNoteOff);
    const updateArpScale = useStore((state) => state.updateArpScale);
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

    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const subType = nodeData?.subType || 'none';
    const rootNote = nodeData?.rootNote || 'C';
    const scaleType = nodeData?.scaleType || 'major pentatonic';

    const [isPlaying, setIsPlaying] = useState(false);
    const seqRef = useRef<Tone.Sequence | null>(null);


    useEffect(() => {
        if (!isPlaying) {
            if (seqRef.current) {
                seqRef.current.stop();
                seqRef.current.dispose();
                seqRef.current = null;
            }
            return;
        }

        const notes = Scale.get(`${rootNote}4 ${scaleType}`).notes;
        if (notes.length === 0) return;

        if (seqRef.current) {
            seqRef.current.stop();
            seqRef.current.dispose();
        }

        seqRef.current = new Tone.Sequence(
            (time, note) => {
                fireNoteOn(id, note);
                Tone.getDraw().schedule(() => {}, time);
                setTimeout(() => fireNoteOff(id, note), 80);
            },
            notes,
            '8n'
        );

        seqRef.current.start(0);

        return () => {
            if (seqRef.current) {
                seqRef.current.stop();
                seqRef.current.dispose();
                seqRef.current = null;
            }
        };
    }, [isPlaying, rootNote, scaleType, id, fireNoteOn, fireNoteOff]);


    return (
        <div className={`bg-slate-800 border-2 border-yellow-500 rounded-2xl p-3 shadow-2xl text-white w-72 flex flex-col transition-all hover:shadow-yellow-500/20 group relative${
            isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
        }`}>

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-yellow-500 hover:text-white hover:border-yellow-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                            style={{ boxShadow: `0 0 6px rgba(234, 179, 8, 0.3)` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNodeAndCleanUp(id);
                            }}
                        >
                            ×
                        </button>
                        <div className="flex-1 text-[10px] font-black uppercase text-yellow-400 tracking-[0.2em] border-none outline-none cursor-default truncate text-center">
                            ARPEGGIATOR
                        </div>
                        <LockButton id={id} isAdjacent={isAdjacent} accentColor="yellow-500" />
                    </div>

                    <div className="flex flex-col gap-3">
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
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-yellow-500">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-yellow-400"
                />
            )}
        </div>
    );
}
