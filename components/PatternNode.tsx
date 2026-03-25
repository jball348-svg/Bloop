'use client';

import { useMemo, useState } from 'react';
import * as Tone from 'tone';
import { Handle, Position } from 'reactflow';
import {
    CONTROL_OUTPUT_HANDLE_ID,
    MAX_PATTERN_LOOP_BARS,
    PIANO_ROLL_NOTE_OPTIONS,
    PATTERN_STEPS_PER_BAR,
    type PatternNote,
    getMathTargetOptionsForNode,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import MathInputHandle, { useMathInputSelection } from './MathInputHandle';
import PackedNode from './PackedNode';

const createNoteAtCell = (note: string, step: number): PatternNote => ({
    id: crypto.randomUUID(),
    note,
    startStep: step,
    lengthSteps: 1,
    velocity: 0.75,
});

export default function PatternNode({ id }: { id: string }) {
    const updatePatternData = useStore((state) => state.updatePatternData);
    const upsertPatternNote = useStore((state) => state.upsertPatternNote);
    const removePatternNote = useStore((state) => state.removePatternNote);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const node = useStore((state) => state.nodes.find((entry) => entry.id === id));
    const nodeData = node?.data;
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && edge.source === id);
    });
    const accentStyle = useNodeAccentStyle('pattern');

    const notes: PatternNote[] = nodeData?.patternNotes ?? [];
    const loopBars = Math.max(1, Math.min(MAX_PATTERN_LOOP_BARS, nodeData?.patternLoopBars ?? 2));
    const stepsPerBar = nodeData?.patternStepsPerBar ?? PATTERN_STEPS_PER_BAR;
    const totalSteps = loopBars * stepsPerBar;
    const currentStep = nodeData?.currentStep ?? -1;
    const isPlaying = nodeData?.isPlaying ?? false;

    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

    const selectedNote = notes.find((note: PatternNote) => note.id === selectedNoteId) ?? null;
    const stepNumbers = useMemo(() => Array.from({ length: totalSteps }, (_, index) => index), [totalSteps]);
    const targetOptions = getMathTargetOptionsForNode(node, { selectedPatternNoteId: selectedNoteId });
    const { mathInputTarget, setMathInputTarget } = useMathInputSelection(id, targetOptions);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node relative w-[22rem] select-none rounded-2xl border-2 border-blue-700 bg-slate-800 p-3 text-white shadow-2xl transition-all hover:shadow-blue-700/20 ${
                isAdjacent ? getAdjacencyGlowClasses('pattern') : ''
            }`}
        >
            <MathInputHandle
                nodeId={id}
                mathInputTarget={mathInputTarget}
                targetOptions={targetOptions}
                onTargetChange={(target) => setMathInputTarget(id, target)}
            />
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={CONTROL_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="h-4 w-4 border-4 border-slate-900 !-right-2 bg-blue-700 transition-all hover:scale-125"
                />
            )}

            <div className="relative z-10 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                    <button
                        className="nodrag relative z-20 mr-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/90 text-[8px] text-slate-400 backdrop-blur-sm transition-all hover:scale-110 hover:border-blue-300 hover:bg-blue-700 hover:text-white"
                        style={{ boxShadow: '0 0 6px rgba(29, 78, 216, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                        Pattern
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="blue-700" />
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                        onClick={async () => {
                            await Tone.start();
                            toggleNodePlayback(id, !isPlaying);
                        }}
                        className={`nodrag rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            isPlaying
                                ? 'border border-blue-400/35 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15'
                                : 'bg-blue-700 text-white hover:bg-blue-600'
                        }`}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    <div className="rounded-xl border border-blue-500/20 bg-slate-900/40 px-3 py-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Loop
                        </div>
                        <select
                            value={loopBars}
                            onChange={(event) =>
                                updatePatternData(id, { loopBars: Number(event.target.value) })
                            }
                            className="nodrag mt-1 w-full bg-transparent text-[11px] font-bold text-blue-200 outline-none"
                        >
                            {Array.from({ length: MAX_PATTERN_LOOP_BARS }, (_, index) => index + 1).map((bars) => (
                                <option key={bars} value={bars} className="bg-slate-900 text-blue-200">
                                    {bars} bar{bars === 1 ? '' : 's'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rounded-2xl border border-blue-500/15 bg-slate-900/40 p-2">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Piano Roll
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                            click to add, click note to edit
                        </div>
                    </div>

                    <div className="max-h-[20rem] overflow-auto">
                        <div className="min-w-[28rem]">
                            <div
                                className="grid gap-px"
                                style={{ gridTemplateColumns: `3.25rem repeat(${totalSteps}, minmax(1rem, 1fr))` }}
                            >
                                <div className="sticky left-0 top-0 z-20 bg-slate-900/95" />
                                {stepNumbers.map((step) => (
                                    <div
                                        key={`${id}-header-${step}`}
                                        className={`sticky top-0 z-10 flex h-5 items-center justify-center bg-slate-900/95 text-[8px] font-black ${
                                            step % stepsPerBar === 0 ? 'text-blue-200' : 'text-slate-500'
                                        }`}
                                    >
                                        {step + 1}
                                    </div>
                                ))}

                                {PIANO_ROLL_NOTE_OPTIONS.map((pitch) => (
                                    <div key={`${id}-${pitch}-row`} className="contents">
                                        <div
                                            className="sticky left-0 z-10 flex h-6 items-center justify-end bg-slate-900/90 pr-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400"
                                        >
                                            {pitch}
                                        </div>
                                        {stepNumbers.map((step: number) => {
                                            const noteAtCell = notes.find(
                                                (note: PatternNote) =>
                                                    note.note === pitch &&
                                                    step >= note.startStep &&
                                                    step < note.startStep + note.lengthSteps
                                            );
                                            const isStartCell = noteAtCell?.startStep === step;
                                            const isSelected = noteAtCell?.id === selectedNoteId;
                                            const isCurrent = currentStep === step;

                                            return (
                                                <button
                                                    key={`${id}-${pitch}-${step}`}
                                                    onClick={() => {
                                                        if (noteAtCell) {
                                                            setSelectedNoteId(noteAtCell.id);
                                                            return;
                                                        }
                                                        const nextNote = createNoteAtCell(pitch, step);
                                                        upsertPatternNote(id, nextNote);
                                                        setSelectedNoteId(nextNote.id);
                                                    }}
                                                    className={`nodrag h-6 border transition-all ${
                                                        noteAtCell
                                                            ? isSelected
                                                                ? 'border-blue-200 bg-blue-500 text-white'
                                                                : 'border-blue-500/30 bg-blue-700/80 text-white'
                                                            : isCurrent
                                                                ? 'border-blue-500/35 bg-blue-500/10'
                                                                : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900'
                                                    } ${isStartCell ? 'rounded-l-md' : ''} ${
                                                        noteAtCell && step === noteAtCell.startStep + noteAtCell.lengthSteps - 1
                                                            ? 'rounded-r-md'
                                                            : ''
                                                    }`}
                                                    title={noteAtCell ? `${noteAtCell.note} • ${noteAtCell.lengthSteps} steps` : `Add ${pitch}`}
                                                >
                                                    {isStartCell ? <span className="text-[8px] font-black">{Math.round((noteAtCell?.velocity ?? 0) * 100)}</span> : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {selectedNote && (
                    <div className="mt-3 rounded-2xl border border-blue-500/15 bg-slate-900/40 p-3">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                                Selected Note
                            </div>
                            <button
                                onClick={() => {
                                    removePatternNote(id, selectedNote.id);
                                    setSelectedNoteId(null);
                                }}
                                className="nodrag rounded-full bg-rose-500 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white"
                            >
                                Delete
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Pitch</label>
                                <select
                                    value={selectedNote.note}
                                    onChange={(event) =>
                                        upsertPatternNote(id, { ...selectedNote, note: event.target.value })
                                    }
                                    className="nodrag rounded-lg border border-blue-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-blue-200 outline-none"
                                >
                                    {PIANO_ROLL_NOTE_OPTIONS.map((pitch) => (
                                        <option key={pitch} value={pitch} className="bg-slate-900 text-blue-200">
                                            {pitch}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Start</label>
                                <input
                                    type="range"
                                    min="0"
                                    max={Math.max(0, totalSteps - 1)}
                                    step="1"
                                    value={selectedNote.startStep}
                                    onChange={(event) =>
                                        upsertPatternNote(id, {
                                            ...selectedNote,
                                            startStep: Number(event.target.value),
                                        })
                                    }
                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                    style={{ accentColor: 'var(--node-accent)' }}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Length</label>
                                <input
                                    type="range"
                                    min="1"
                                    max={Math.max(1, totalSteps - selectedNote.startStep)}
                                    step="1"
                                    value={selectedNote.lengthSteps}
                                    onChange={(event) =>
                                        upsertPatternNote(id, {
                                            ...selectedNote,
                                            lengthSteps: Number(event.target.value),
                                        })
                                    }
                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                    style={{ accentColor: 'var(--node-accent)' }}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Velocity</label>
                                    <span className="text-[10px] font-mono font-bold text-blue-300">
                                        {Math.round(selectedNote.velocity * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="1"
                                    step="0.01"
                                    value={selectedNote.velocity}
                                    onChange={(event) =>
                                        upsertPatternNote(id, {
                                            ...selectedNote,
                                            velocity: Number(event.target.value),
                                        })
                                    }
                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                    style={{ accentColor: 'var(--node-accent)' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-blue-300">
                        <div className="h-px flex-1 bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="h-px flex-1 bg-current" />
                    </div>
                )}
            </div>
        </div>
    );
}
