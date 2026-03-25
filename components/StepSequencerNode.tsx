'use client';

import { useEffect } from 'react';
import * as Tone from 'tone';
import { Handle, Position } from 'reactflow';
import {
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    SONG_NOTE_OPTIONS,
    TRANSPORT_RATE_OPTIONS,
    getSequencerStepMix,
    type SequencerStep,
    createDefaultStepSequence,
    getMathTargetOptionsForNode,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import MathInputHandle, { useMathInputSelection } from './MathInputHandle';
import PackedNode from './PackedNode';

export default function StepSequencerNode({ id }: { id: string }) {
    const updateNodeData = useStore((state) => state.updateNodeData);
    const updateSequencerStep = useStore((state) => state.updateSequencerStep);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const node = useStore((state) => state.nodes.find((entry) => entry.id === id));
    const nodeData = node?.data;
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });

    const sequenceSync = nodeData?.sequenceSync ?? true;
    const sequenceRate = nodeData?.sequenceRate ?? '8n';
    const sequenceIntervalMs = nodeData?.sequenceIntervalMs ?? 250;
    const stepSequence: SequencerStep[] = nodeData?.stepSequence ?? createDefaultStepSequence();
    const selectedStep = nodeData?.selectedStep ?? 0;
    const currentStep = nodeData?.currentStep ?? -1;
    const isPlaying = nodeData?.isPlaying ?? false;
    const activeStep = stepSequence[selectedStep] ?? stepSequence[0];
    const activeStepMix = activeStep ? getSequencerStepMix(activeStep) : 60;
    const accentStyle = useNodeAccentStyle('stepsequencer');
    const targetOptions = getMathTargetOptionsForNode(node);
    const { mathInputTarget, setMathInputTarget } = useMathInputSelection(id, targetOptions);

    useEffect(() => {
        if (isPlaying) {
            toggleNodePlayback(id, true);
        }
    }, [id, isPlaying, sequenceIntervalMs, sequenceRate, sequenceSync, toggleNodePlayback]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-blue-500 rounded-2xl p-3 shadow-2xl text-white w-[22rem] flex flex-col transition-all hover:shadow-blue-500/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('stepsequencer') : ''
            }`}
        >
            <MathInputHandle
                nodeId={id}
                mathInputTarget={mathInputTarget}
                targetOptions={targetOptions}
                onTargetChange={(target) => setMathInputTarget(id, target)}
            />
            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-blue-500"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-blue-500 hover:text-white hover:border-blue-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] text-center">
                        Sequencer
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                        onClick={async () => {
                            await Tone.start();
                            toggleNodePlayback(id, !isPlaying);
                        }}
                        className={`nodrag rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            isPlaying
                                ? 'border border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/20'
                                : 'bg-blue-500 text-white hover:bg-blue-400'
                        }`}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    <button
                        onClick={() => updateNodeData(id, { sequenceSync: !sequenceSync })}
                        className={`nodrag rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            sequenceSync
                                ? 'bg-blue-500 text-white hover:bg-blue-400'
                                : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                        }`}
                    >
                        {sequenceSync ? 'Tempo Sync' : 'Free Run'}
                    </button>
                </div>

                <div className="mb-3">
                    {sequenceSync ? (
                        <select
                            value={sequenceRate}
                            onChange={(event) => updateNodeData(id, { sequenceRate: event.target.value as typeof sequenceRate })}
                            className="nodrag w-full rounded-lg border border-blue-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-blue-200 outline-none"
                        >
                            {TRANSPORT_RATE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-slate-900 text-blue-200">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Interval
                                </label>
                                <span className="text-[10px] font-mono text-blue-300">{sequenceIntervalMs}ms</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="1200"
                                step="25"
                                value={sequenceIntervalMs}
                                onChange={(event) => updateNodeData(id, { sequenceIntervalMs: Number(event.target.value) })}
                                className="nodrag w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                    {stepSequence.map((step, index) => {
                        const isSelected = selectedStep === index;
                        const isActive = currentStep === index;

                        return (
                            <div
                                key={`${id}-step-${index}`}
                                className={`rounded-xl border p-2 transition-all ${
                                    isSelected
                                        ? 'border-blue-300 bg-slate-950/70 shadow-[0_0_0_1px_rgba(147,197,253,0.12)]'
                                        : 'border-slate-700 bg-slate-900/40'
                                } ${isActive ? 'shadow-[0_0_16px_rgba(59,130,246,0.35)]' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={() => updateNodeData(id, { selectedStep: index })}
                                        className="nodrag text-[10px] font-black uppercase tracking-[0.18em] text-blue-200"
                                    >
                                        {index + 1}
                                    </button>
                                    <button
                                        onClick={() => updateSequencerStep(id, index, { enabled: !step.enabled })}
                                        className={`nodrag rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] ${
                                            step.enabled
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-700 text-slate-300'
                                        }`}
                                    >
                                        {step.enabled ? 'On' : 'Off'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => updateNodeData(id, { selectedStep: index })}
                                    className={`nodrag w-full rounded-lg border px-2 py-3 text-[11px] font-bold transition-all ${
                                        step.enabled
                                            ? 'border-blue-400/30 bg-slate-950/80 text-blue-100 hover:border-blue-300/45'
                                            : 'border-slate-700 bg-slate-900/40 text-slate-500'
                                    }`}
                                >
                                    {step.enabled ? step.note : 'Rest'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {activeStep && (
                    <div className="rounded-2xl border border-blue-500/15 bg-slate-900/40 p-3">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                                Step {selectedStep + 1}
                            </span>
                            <button
                                onClick={() => updateSequencerStep(id, selectedStep, { enabled: !activeStep.enabled })}
                                className={`nodrag rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                                    activeStep.enabled
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-700 text-slate-300'
                                }`}
                            >
                                {activeStep.enabled ? 'Enabled' : 'Rest'}
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Pitch
                                </label>
                                <select
                                    value={activeStep.note}
                                    onChange={(event) => updateSequencerStep(id, selectedStep, { note: event.target.value })}
                                    className="nodrag rounded-lg border border-blue-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-blue-200 outline-none"
                                >
                                    {SONG_NOTE_OPTIONS.map((note) => (
                                        <option key={note} value={note} className="bg-slate-900 text-blue-200">
                                            {note}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Mix
                                    </label>
                                    <span className="text-[10px] font-mono text-blue-300">{activeStepMix}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={activeStepMix}
                                    onChange={(event) => updateSequencerStep(id, selectedStep, { mix: Number(event.target.value) })}
                                    className="nodrag w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-blue-400">
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
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-blue-500"
                />
            )}
        </div>
    );
}
