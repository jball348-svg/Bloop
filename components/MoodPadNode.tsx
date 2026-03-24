'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonaljs/tonal';
import { Handle, Position } from 'reactflow';
import {
    CONTROL_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

const TENSION_PRESETS = [
    { label: 'Calm', intervals: [0, 7, 12] },
    { label: 'Warm', intervals: [0, 4, 7, 11] },
    { label: 'Dreamy', intervals: [0, 5, 7, 14] },
    { label: 'Restless', intervals: [0, 3, 7, 10] },
    { label: 'Tense', intervals: [0, 1, 7, 10, 13] },
] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const serializeNotes = (notes: string[]) => notes.join('|');

const buildMoodChord = (x: number, y: number) => {
    const presetIndex = Math.min(
        TENSION_PRESETS.length - 1,
        Math.floor(clamp01(x) * TENSION_PRESETS.length)
    );
    const preset = TENSION_PRESETS[presetIndex] ?? TENSION_PRESETS[0];
    const baseMidi = 48 + Math.round(clamp01(y) * 24);

    return preset.intervals.map((interval, index) => {
        const octaveLift =
            y > 0.72 && index >= Math.max(1, Math.floor(preset.intervals.length / 2))
                ? 12
                : 0;

        return Midi.midiToNoteName(baseMidi + interval + octaveLift, { sharps: true });
    });
};

export default function MoodPadNode({ id }: { id: string }) {
    const fireNoteOn = useStore((state) => state.fireNoteOn);
    const fireNoteOff = useStore((state) => state.fireNoteOff);
    const updateNodeData = useStore((state) => state.updateNodeData);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });

    const moodX = clamp01(nodeData?.moodX ?? 0.35);
    const moodY = clamp01(nodeData?.moodY ?? 0.55);
    const padRef = useRef<HTMLDivElement | null>(null);
    const accentStyle = useNodeAccentStyle('moodpad');
    const activeNotesRef = useRef<string[]>([]);
    const releaseTimeoutRef = useRef<number | null>(null);
    const pointerIdRef = useRef<number | null>(null);
    const draggingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    const descriptor = useMemo(() => {
        const presetIndex = Math.min(
            TENSION_PRESETS.length - 1,
            Math.floor(moodX * TENSION_PRESETS.length)
        );
        return TENSION_PRESETS[presetIndex]?.label ?? 'Calm';
    }, [moodX]);

    const registerLabel = useMemo(() => {
        if (moodY < 0.25) {
            return 'Dark';
        }
        if (moodY < 0.5) {
            return 'Low';
        }
        if (moodY < 0.75) {
            return 'Lifted';
        }
        return 'Bright';
    }, [moodY]);

    const releaseSpecificNotes = useCallback((notes: string[]) => {
        notes.forEach((note) => fireNoteOff(id, note));
        if (serializeNotes(notes) === serializeNotes(activeNotesRef.current)) {
            activeNotesRef.current = [];
        }
    }, [fireNoteOff, id]);

    const clearReleaseTimer = useCallback(() => {
        if (releaseTimeoutRef.current !== null) {
            window.clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
        }
    }, []);

    const releaseActiveNotes = useCallback(() => {
        clearReleaseTimer();
        if (activeNotesRef.current.length === 0) {
            return;
        }

        releaseSpecificNotes([...activeNotesRef.current]);
    }, [clearReleaseTimer, releaseSpecificNotes]);

    const triggerPadNotes = useCallback((nextX: number, nextY: number) => {
        updateNodeData(id, { moodX: nextX, moodY: nextY });

        const nextNotes = buildMoodChord(nextX, nextY);
        if (serializeNotes(nextNotes) === serializeNotes(activeNotesRef.current)) {
            return;
        }

        releaseActiveNotes();
        nextNotes.forEach((note) => fireNoteOn(id, note));
        activeNotesRef.current = nextNotes;

        releaseTimeoutRef.current = window.setTimeout(() => {
            releaseSpecificNotes(nextNotes);
        }, 220);
    }, [fireNoteOn, id, releaseActiveNotes, releaseSpecificNotes, updateNodeData]);

    const updateFromClientPoint = useCallback((clientX: number, clientY: number) => {
        const rect = padRef.current?.getBoundingClientRect();
        if (!rect) {
            return;
        }

        const nextX = clamp01((clientX - rect.left) / rect.width);
        const nextY = clamp01(1 - (clientY - rect.top) / rect.height);
        triggerPadNotes(nextX, nextY);
    }, [triggerPadNotes]);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!draggingRef.current) {
                return;
            }

            if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
                return;
            }

            updateFromClientPoint(event.clientX, event.clientY);
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (!draggingRef.current) {
                return;
            }

            if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
                return;
            }

            draggingRef.current = false;
            pointerIdRef.current = null;
            setIsDragging(false);
            releaseActiveNotes();
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            releaseActiveNotes();
        };
    }, [releaseActiveNotes, updateFromClientPoint]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    const cursorStyle = {
        left: `${moodX * 100}%`,
        top: `${(1 - moodY) * 100}%`,
    };

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-rose-500 rounded-2xl p-3 shadow-2xl text-white w-80 flex flex-col transition-all hover:shadow-rose-500/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('moodpad') : ''
            }`}
        >
            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(244, 63, 94, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                        Mood Pad
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="rose-500" />
                </div>

                <div className="mb-3 rounded-2xl border border-rose-500/15 bg-slate-900/40 p-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-rose-300">
                        <span>{descriptor}</span>
                        <span>{registerLabel}</span>
                    </div>
                </div>

                <div
                    ref={padRef}
                    onPointerDown={async (event) => {
                        await Tone.start();
                        draggingRef.current = true;
                        pointerIdRef.current = event.pointerId;
                        setIsDragging(true);
                        updateFromClientPoint(event.clientX, event.clientY);
                    }}
                    className={`nodrag relative mx-auto mb-3 h-44 w-44 overflow-hidden rounded-[1.75rem] border border-rose-400/25 bg-[radial-gradient(circle_at_20%_20%,rgba(251,113,133,0.22),transparent_42%),radial-gradient(circle_at_80%_25%,rgba(251,191,36,0.18),transparent_34%),linear-gradient(140deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] shadow-inner ${
                        isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
                    }`}
                    style={{ touchAction: 'none' }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:25%_25%]" />
                    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-rose-200/70">
                        <span>Calm</span>
                        <span>Tense</span>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex flex-col justify-between py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-rose-200/70">
                        <span>Bright</span>
                        <span>Dark</span>
                    </div>
                    <div
                        className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.55)] transition-transform"
                        style={cursorStyle}
                    />
                </div>

                <div className="rounded-xl border border-rose-500/15 bg-slate-900/40 px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Current Voicing
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-rose-200">
                        {buildMoodChord(moodX, moodY).join(' · ')}
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-rose-400">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={CONTROL_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-rose-500"
                />
            )}
        </div>
    );
}
