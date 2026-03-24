import { useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import {
    AUDIO_OUTPUT_HANDLE_ID,
    CONTROL_INPUT_HANDLE_ID,
    DRUM_STEP_COUNT,
    type DrumMode,
    type DrumPart,
    getAdjacencyGlowClasses,
    isAudioEdge,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import NodeMixControl from './NodeMixControl';
import PackedNode from './PackedNode';

const DRUM_PART_CONFIG: Array<{ part: DrumPart; label: string; key: string }> = [
    { part: 'kick', label: 'Kick', key: 'A' },
    { part: 'snare', label: 'Snare', key: 'S' },
    { part: 'hatClosed', label: 'Hi-Hat', key: 'D' },
    { part: 'hatOpen', label: 'Open Hat', key: 'F' },
];

const KEYBOARD_MAP: Record<string, DrumPart> = {
    a: 'kick',
    s: 'snare',
    d: 'hatClosed',
    f: 'hatOpen',
};

const STEPS = Array.from({ length: DRUM_STEP_COUNT }, (_, index) => index);

export default function DrumNode({ id }: { id: string }) {
    const setDrumMode = useStore((state) => state.setDrumMode);
    const toggleDrumStep = useStore((state) => state.toggleDrumStep);
    const triggerDrumHit = useStore((state) => state.triggerDrumHit);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const activeDrumPads = useStore((state) => state.activeDrumPads);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        const hasControlIn = edges.some(e => isControlEdge(e) && e.target === id);
        const hasAudioOut = edges.some(e => isAudioEdge(e) && e.source === id);
        return !hasControlIn && !hasAudioOut;
    });

    const drumMode = nodeData?.drumMode ?? 'hits';
    const drumPattern = nodeData?.drumPattern;
    const isPlaying = nodeData?.isPlaying ?? false;
    const currentStep = nodeData?.currentStep ?? -1;
    const accentStyle = useNodeAccentStyle('drum');
    const mix = nodeData?.mix ?? 80;

    useEffect(() => {
        if (drumMode !== 'hits') {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            const target = event.target as HTMLElement | null;
            if (
                target?.isContentEditable ||
                target?.tagName === 'INPUT' ||
                target?.tagName === 'SELECT' ||
                target?.tagName === 'TEXTAREA'
            ) {
                return;
            }

            const part = KEYBOARD_MAP[event.key.toLowerCase()];
            if (!part) {
                return;
            }

            event.preventDefault();
            void Tone.start();
            triggerDrumHit(id, part);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [drumMode, id, triggerDrumHit]);

    const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setDrumMode(id, event.target.value as DrumMode);
    };

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-orange-500 rounded-2xl p-3 shadow-2xl text-white w-80 flex flex-col transition-all hover:shadow-orange-500/20 group relative select-none${
            isAdjacent ? getAdjacencyGlowClasses('drum') : ''
        }`}
        >

            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-yellow-400"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-orange-500 hover:text-white hover:border-orange-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px rgba(249, 115, 22, 0.3)` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 flex flex-col gap-2 text-center">
                        <span className="text-[10px] font-black uppercase text-orange-400 tracking-[0.2em]">
                            Drums
                        </span>
                        <div className="rounded-xl border border-orange-500/15 bg-slate-900/40 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-orange-200/80">
                            Legacy node. New patches should use Advanced Drums.
                        </div>
                        <select
                            value={drumMode}
                            onChange={handleModeChange}
                            className="nodrag bg-orange-500/10 text-[11px] font-black uppercase text-orange-300 tracking-[0.18em] border-none outline-none rounded-lg px-2 py-1.5 mx-auto"
                        >
                            <option value="hits" className="bg-slate-900 text-orange-300">Hits</option>
                            <option value="grid" className="bg-slate-900 text-orange-300">Grid</option>
                        </select>
                        <div className="flex justify-center">
                            <LockButton id={id} isAdjacent={isAdjacent} accentColor="orange-500" />
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {drumMode === 'grid' && (
                            <button
                                onClick={async () => {
                                    await Tone.start();
                                    toggleNodePlayback(id, !isPlaying);
                                }}
                                className={`nodrag rounded-xl px-4 py-2 text-xs font-black transition-all ${
                                    isPlaying
                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30'
                                        : 'bg-orange-500 text-slate-950 hover:bg-orange-400'
                                }`}
                            >
                                {isPlaying ? 'STOP' : 'PLAY'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <NodeMixControl
                        value={mix}
                        onChange={(value) => updateNodeValue(id, { mix: value })}
                    />
                </div>

                {drumMode === 'hits' && (
                    <div className="flex flex-1 flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            {DRUM_PART_CONFIG.map(({ part, label, key }) => {
                                const isActive = activeDrumPads.has(`${id}:${part}`);

                                return (
                                    <button
                                        key={part}
                                        onClick={async () => {
                                            await Tone.start();
                                            triggerDrumHit(id, part);
                                        }}
                                        className={`nodrag rounded-2xl border px-4 py-4 text-left transition-all ${
                                            isActive
                                                ? 'border-orange-300 bg-orange-400/20 shadow-[0_0_18px_rgba(251,146,60,0.35)]'
                                                : 'border-orange-500/20 bg-slate-800/80 hover:border-orange-400/40 hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-white">{label}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                    Manual Trigger
                                                </span>
                                            </div>
                                            <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                                                isActive ? 'bg-orange-400 text-slate-950' : 'bg-slate-700 text-orange-300'
                                            }`}>
                                                {key}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rounded-xl border border-orange-500/15 bg-slate-800/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Keyboard: A / S / D / F
                        </div>
                    </div>
                )}

                {drumMode === 'grid' && (
                    <div className="flex flex-1 flex-col gap-2">
                        <div className="grid grid-cols-[56px_repeat(16,minmax(0,1fr))] gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            <div />
                            {STEPS.map((step) => (
                                <div key={step} className={`text-center ${currentStep === step ? 'text-orange-300' : ''} ${step % 2 !== 0 ? 'mt-2' : ''}`}>
                                    {step + 1}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {DRUM_PART_CONFIG.map(({ part, label }) => (
                                <div
                                    key={part}
                                    className="grid grid-cols-[56px_repeat(16,minmax(0,1fr))] gap-1 items-center"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                        {label}
                                    </span>

                                    {STEPS.map((step) => {
                                        const isStepEnabled = drumPattern?.[part]?.[step] ?? false;
                                        const isPlayheadStep = currentStep === step;

                                        return (
                                            <button
                                                key={`${part}-${step}`}
                                                onClick={() => toggleDrumStep(id, part, step)}
                                                className={`nodrag aspect-square rounded-md border transition-all ${
                                                    isStepEnabled
                                                        ? 'bg-orange-400 border-orange-300 text-slate-950'
                                                        : 'bg-slate-800 border-slate-700 hover:border-orange-500/40'
                                                } ${
                                                    isPlayheadStep
                                                        ? 'shadow-[0_0_0_2px_rgba(253,186,116,0.55)]'
                                                        : ''
                                                }`}
                                                aria-label={`${label} step ${step + 1}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                    </div>
                )}
                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-orange-500">
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
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 bg-orange-500 hover:scale-125 transition-all"
                />
            )}
        </div>
    );
}
