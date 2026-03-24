'use client';

import * as Tone from 'tone';
import { useRef } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_OUTPUT_HANDLE_ID,
    type AdvancedDrumTrackData,
    CONTROL_INPUT_HANDLE_ID,
    createDefaultAdvancedDrumTracks,
    getAdjacencyGlowClasses,
    isAudioEdge,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import NodeMixControl from './NodeMixControl';
import PackedNode from './PackedNode';

const TRACK_LENGTHS = [4, 8, 12, 16];

const velocityClasses: Record<number, string> = {
    0: 'bg-slate-900 border-slate-700 hover:border-green-500/35',
    1: 'bg-green-500/25 border-green-400/50 text-green-100',
    2: 'bg-green-500/55 border-green-300 text-slate-950',
    3: 'bg-green-300 border-green-200 text-slate-950 shadow-[0_0_12px_rgba(74,222,128,0.35)]',
};

const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read drum sample.'));
        reader.readAsDataURL(file);
    });

export default function AdvancedDrumNode({ id }: { id: string }) {
    const updateNodeData = useStore((state) => state.updateNodeData);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const loadAdvancedDrumTrackSample = useStore((state) => state.loadAdvancedDrumTrackSample);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        const hasControlIn = edges.some((edge) => isControlEdge(edge) && edge.target === id);
        const hasAudioOut = edges.some((edge) => isAudioEdge(edge) && edge.source === id);
        return !hasControlIn && !hasAudioOut;
    });

    const fileInputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const tracks: AdvancedDrumTrackData[] =
        nodeData?.advancedDrumTracks ?? createDefaultAdvancedDrumTracks();
    const swing = nodeData?.swing ?? 0;
    const currentStep = nodeData?.currentStep ?? -1;
    const isPlaying = nodeData?.isPlaying ?? false;
    const accentStyle = useNodeAccentStyle('advanceddrum');
    const mix = nodeData?.mix ?? 80;

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-green-500 rounded-2xl p-3 shadow-2xl text-white w-[27rem] flex flex-col transition-all hover:shadow-green-500/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('advanceddrum') : ''
            }`}
        >
            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-green-500"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-green-500 hover:text-slate-950 hover:border-green-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>

                    <div className="flex-1 flex flex-col gap-2 text-center">
                        <span className="text-[10px] font-black uppercase text-green-300 tracking-[0.2em]">
                            Advanced Drums
                        </span>
                        <div className="rounded-xl border border-green-500/15 bg-slate-900/40 px-3 py-2 text-[10px] text-slate-400">
                            Internal 16th-note clock with Bloop input support for external stepping.
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={async () => {
                                await Tone.start();
                                toggleNodePlayback(id, !isPlaying);
                            }}
                            className={`nodrag rounded-xl px-4 py-2 text-xs font-black transition-all ${
                                isPlaying
                                    ? 'border border-green-500/40 bg-green-500/15 text-green-200 hover:bg-green-500/20'
                                    : 'bg-green-500 text-slate-950 hover:bg-green-400'
                            }`}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>
                        <LockButton id={id} isAdjacent={isAdjacent} accentColor="green-500" />
                    </div>
                </div>

                <div className="mb-3">
                    <NodeMixControl
                        value={mix}
                        onChange={(value) => updateNodeValue(id, { mix: value })}
                    />
                </div>

                <div className="mb-3 rounded-2xl border border-green-500/15 bg-slate-900/40 p-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Swing
                        </label>
                        <span className="text-[10px] font-mono text-green-200">
                            {Math.round(swing * 100)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="0.6"
                        step="0.02"
                        value={swing}
                        onChange={(event) => updateNodeData(id, { swing: Number(event.target.value) })}
                        className="nodrag mt-2 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    {tracks.map((track, trackIndex) => (
                        <div
                            key={`${id}-track-${trackIndex}`}
                            className="rounded-2xl border border-green-500/10 bg-slate-900/30 p-2"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-green-200">
                                        {track.label}
                                    </div>
                                    <div className="truncate text-[10px] text-slate-400">
                                        {track.sampleName ?? 'Default kit sound'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={track.length}
                                        onChange={(event) => {
                                            const nextTracks = tracks.map((candidate, index) =>
                                                index === trackIndex
                                                    ? { ...candidate, length: Number(event.target.value) }
                                                    : candidate
                                            );
                                            updateNodeData(id, { advancedDrumTracks: nextTracks });
                                        }}
                                        className="nodrag rounded-lg border border-green-500/15 bg-slate-950/50 px-2 py-1 text-[10px] font-bold text-green-100 outline-none"
                                    >
                                        {TRACK_LENGTHS.map((length) => (
                                            <option key={length} value={length} className="bg-slate-950 text-green-100">
                                                {length} steps
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => fileInputsRef.current[trackIndex]?.click()}
                                        className="nodrag rounded-lg bg-green-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-green-400"
                                    >
                                        Sample
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
                                {Array.from({ length: 16 }, (_, stepIndex) => {
                                    const velocity = track.steps[stepIndex] ?? 0;
                                    const isStepActive =
                                        stepIndex === currentStep ||
                                        (track.length < 16 && currentStep >= 0 && currentStep % track.length === stepIndex);
                                    const isOutsideLength = stepIndex >= track.length;

                                    return (
                                        <button
                                            key={`${track.label}-${stepIndex}`}
                                            onClick={() => {
                                                const nextTracks = tracks.map((candidate, index) => {
                                                    if (index !== trackIndex) {
                                                        return candidate;
                                                    }

                                                    const nextSteps = [...candidate.steps];
                                                    nextSteps[stepIndex] = (nextSteps[stepIndex] + 1) % 4;
                                                    return {
                                                        ...candidate,
                                                        steps: nextSteps,
                                                    };
                                                });
                                                updateNodeData(id, { advancedDrumTracks: nextTracks });
                                            }}
                                            className={`nodrag aspect-square rounded-md border text-[9px] font-black transition-all ${
                                                velocityClasses[velocity] ?? velocityClasses[0]
                                            } ${isStepActive ? 'shadow-[0_0_0_2px_rgba(134,239,172,0.5)]' : ''} ${
                                                isOutsideLength ? 'opacity-35' : ''
                                            }`}
                                            aria-label={`${track.label} step ${stepIndex + 1}`}
                                        >
                                            {velocity === 0 ? '' : velocity}
                                        </button>
                                    );
                                })}
                            </div>

                            <input
                                ref={(element) => {
                                    fileInputsRef.current[trackIndex] = element;
                                }}
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) {
                                        return;
                                    }

                                    try {
                                        const arrayBuffer = await file.arrayBuffer();
                                        const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer.slice(0));
                                        const dataUrl = await fileToDataUrl(file);
                                        loadAdvancedDrumTrackSample(id, trackIndex, audioBuffer, {
                                            sampleName: file.name,
                                            sampleDataUrl: dataUrl,
                                        });
                                    } catch (error) {
                                        console.error('Failed to load drum sample', error);
                                    } finally {
                                        event.target.value = '';
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-green-300">
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
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-green-500"
                />
            )}
        </div>
    );
}
