'use client';

import { useMemo, useState } from 'react';
import * as Tone from 'tone';
import {
    type ArrangerScene,
    type AutomationLane,
    type AutomationPoint,
    getAdjacencyGlowClasses,
    getAutomatableParamsForNode,
    getNodeAutomatableValue,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

const createScene = (): ArrangerScene => ({
    id: crypto.randomUUID(),
    name: 'Section',
    startBar: 0,
    lengthBars: 4,
    patternNodeIds: [],
    rhythmNodeIds: [],
    automationLanes: [],
});

const createPoint = (value: number): AutomationPoint => ({
    id: crypto.randomUUID(),
    barOffset: 0,
    value,
});

export default function ArrangerNode({ id }: { id: string }) {
    const upsertArrangerScene = useStore((state) => state.upsertArrangerScene);
    const removeArrangerScene = useStore((state) => state.removeArrangerScene);
    const toggleNodePlayback = useStore((state) => state.toggleNodePlayback);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodes = useStore((state) => state.nodes);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const accentStyle = useNodeAccentStyle('arranger');
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

    const scenes: ArrangerScene[] = nodeData?.arrangerScenes ?? [];
    const isPlaying = nodeData?.isPlaying ?? false;
    const currentBar = nodeData?.currentStep ?? -1;

    const selectedScene = scenes.find((scene: ArrangerScene) => scene.id === selectedSceneId) ?? scenes[0] ?? null;
    const patternNodes = useMemo(
        () => nodes.filter((node) => node.type === 'pattern'),
        [nodes]
    );
    const rhythmNodes = useMemo(
        () => nodes.filter((node) => node.type === 'stepsequencer' || node.type === 'advanceddrum'),
        [nodes]
    );
    const automatableNodes = useMemo(
        () => nodes.filter((node) => getAutomatableParamsForNode(node.type).length > 0),
        [nodes]
    );

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    const patchScene = (patch: Partial<ArrangerScene>) => {
        if (!selectedScene) {
            return;
        }
        upsertArrangerScene(id, { ...selectedScene, ...patch });
    };

    const patchLane = (laneId: string, patch: Partial<AutomationLane>) => {
        if (!selectedScene) {
            return;
        }
        patchScene({
            automationLanes: selectedScene.automationLanes.map((lane: AutomationLane) =>
                lane.id === laneId ? { ...lane, ...patch } : lane
            ),
        });
    };

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node relative w-[22rem] select-none rounded-2xl border-2 border-indigo-700 bg-slate-800 p-3 text-white shadow-2xl transition-all hover:shadow-indigo-700/20 ${
                isAdjacent ? getAdjacencyGlowClasses('arranger') : ''
            }`}
        >
            <div className="relative z-10 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                    <button
                        className="nodrag relative z-20 mr-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/90 text-[8px] text-slate-400 backdrop-blur-sm transition-all hover:scale-110 hover:border-indigo-400 hover:bg-indigo-500 hover:text-white"
                        style={{ boxShadow: '0 0 6px rgba(67, 56, 202, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                        Arranger
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="indigo-700" />
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                        onClick={async () => {
                            await Tone.start();
                            toggleNodePlayback(id, !isPlaying);
                        }}
                        className={`nodrag rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            isPlaying
                                ? 'border border-indigo-400/35 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15'
                                : 'bg-indigo-700 text-white hover:bg-indigo-600'
                        }`}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    <div className="rounded-xl border border-indigo-500/20 bg-slate-900/40 px-3 py-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Current Bar
                        </div>
                        <div className="mt-1 text-sm font-black text-indigo-200">
                            {currentBar < 0 ? 'Idle' : currentBar + 1}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-indigo-500/15 bg-slate-900/40 p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Sections
                        </div>
                        <button
                            onClick={() => {
                                const nextScene = createScene();
                                upsertArrangerScene(id, {
                                    ...nextScene,
                                    startBar: scenes.length * 4,
                                    name: `Scene ${scenes.length + 1}`,
                                });
                                setSelectedSceneId(nextScene.id);
                            }}
                            className="nodrag rounded-full bg-indigo-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white"
                        >
                            Add Scene
                        </button>
                    </div>

                    <div className="space-y-2">
                        {scenes.map((scene: ArrangerScene) => (
                            <button
                                key={scene.id}
                                onClick={() => setSelectedSceneId(scene.id)}
                                className={`nodrag flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                                    scene.id === selectedScene?.id
                                        ? 'border-indigo-300 bg-indigo-500/15'
                                        : 'border-indigo-500/15 bg-slate-950/60'
                                }`}
                            >
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                                        {scene.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Bar {scene.startBar + 1} • {scene.lengthBars} bars
                                    </div>
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                                    {scene.patternNodeIds.length} pat / {scene.rhythmNodeIds.length} rhy
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedScene && (
                    <div className="mt-3 rounded-2xl border border-indigo-500/15 bg-slate-900/40 p-3">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300">
                                Edit Section
                            </div>
                            <button
                                onClick={() => {
                                    removeArrangerScene(id, selectedScene.id);
                                    setSelectedSceneId(null);
                                }}
                                className="nodrag rounded-full bg-rose-500 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white"
                            >
                                Delete
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Name</label>
                                <input
                                    type="text"
                                    value={selectedScene.name}
                                    onChange={(event) => patchScene({ name: event.target.value })}
                                    className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-indigo-200 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Start Bar</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={selectedScene.startBar}
                                    onChange={(event) => patchScene({ startBar: Number(event.target.value) })}
                                    className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-indigo-200 outline-none"
                                />
                            </div>
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Length</label>
                                    <span className="text-[10px] font-mono font-bold text-indigo-300">
                                        {selectedScene.lengthBars} bars
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="16"
                                    step="1"
                                    value={selectedScene.lengthBars}
                                    onChange={(event) => patchScene({ lengthBars: Number(event.target.value) })}
                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                    style={{ accentColor: 'var(--node-accent)' }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                    Patterns
                                </div>
                                <div className="space-y-2">
                                    {patternNodes.map((patternNode) => (
                                        <label
                                            key={patternNode.id}
                                            className="flex items-center gap-2 rounded-lg border border-indigo-500/10 bg-slate-950/60 px-2 py-2 text-[10px] font-bold text-indigo-100"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedScene.patternNodeIds.includes(patternNode.id)}
                                                onChange={() => {
                                                    const nextPatternIds = selectedScene.patternNodeIds.includes(patternNode.id)
                                                        ? selectedScene.patternNodeIds.filter((entry: string) => entry !== patternNode.id)
                                                        : [...selectedScene.patternNodeIds, patternNode.id];
                                                    patchScene({ patternNodeIds: nextPatternIds });
                                                }}
                                            />
                                            <span>{patternNode.data.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                    Rhythm
                                </div>
                                <div className="space-y-2">
                                    {rhythmNodes.map((rhythmNode) => (
                                        <label
                                            key={rhythmNode.id}
                                            className="flex items-center gap-2 rounded-lg border border-indigo-500/10 bg-slate-950/60 px-2 py-2 text-[10px] font-bold text-indigo-100"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedScene.rhythmNodeIds.includes(rhythmNode.id)}
                                                onChange={() => {
                                                    const nextRhythmIds = selectedScene.rhythmNodeIds.includes(rhythmNode.id)
                                                        ? selectedScene.rhythmNodeIds.filter((entry: string) => entry !== rhythmNode.id)
                                                        : [...selectedScene.rhythmNodeIds, rhythmNode.id];
                                                    patchScene({ rhythmNodeIds: nextRhythmIds });
                                                }}
                                            />
                                            <span>{rhythmNode.data.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-indigo-500/12 bg-slate-950/40 p-3">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                    Automation
                                </div>
                                <button
                                    onClick={() => {
                                        const firstTarget = automatableNodes[0];
                                        const firstParam = firstTarget
                                            ? getAutomatableParamsForNode(firstTarget.type)[0]
                                            : null;
                                        if (!firstTarget || !firstParam) {
                                            return;
                                        }
                                        patchScene({
                                            automationLanes: [
                                                ...selectedScene.automationLanes,
                                                {
                                                    id: crypto.randomUUID(),
                                                    targetNodeId: firstTarget.id,
                                                    targetParam: firstParam.key,
                                                    mode: 'ramp',
                                                    points: [createPoint(getNodeAutomatableValue(firstTarget.data, firstParam.key))],
                                                },
                                            ],
                                        });
                                    }}
                                    className="nodrag rounded-full bg-indigo-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white"
                                >
                                    Add Lane
                                </button>
                            </div>

                            <div className="space-y-3">
                                {selectedScene.automationLanes.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-indigo-500/20 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                        Add a lane for EQ, FX, synth, or mixer moves
                                    </div>
                                ) : (
                                    selectedScene.automationLanes.map((lane: AutomationLane) => {
                                        const targetNode = nodes.find((node) => node.id === lane.targetNodeId);
                                        const paramOptions = targetNode
                                            ? getAutomatableParamsForNode(targetNode.type)
                                            : [];

                                        return (
                                            <div key={lane.id} className="rounded-xl border border-indigo-500/12 bg-slate-950/60 p-3">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                                                        Lane
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            patchScene({
                                                                automationLanes: selectedScene.automationLanes.filter((entry: AutomationLane) => entry.id !== lane.id),
                                                            })
                                                        }
                                                        className="nodrag rounded-full bg-slate-700 px-3 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-slate-200"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <select
                                                        value={lane.targetNodeId}
                                                        onChange={(event) => {
                                                            const nextTarget = nodes.find((node) => node.id === event.target.value);
                                                            const nextParam = nextTarget ? getAutomatableParamsForNode(nextTarget.type)[0] : null;
                                                            patchLane(lane.id, {
                                                                targetNodeId: event.target.value,
                                                                targetParam: nextParam?.key ?? lane.targetParam,
                                                            });
                                                        }}
                                                        className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[10px] font-bold text-indigo-200 outline-none"
                                                    >
                                                        {automatableNodes.map((target) => (
                                                            <option key={target.id} value={target.id} className="bg-slate-900 text-indigo-200">
                                                                {target.data.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={lane.targetParam}
                                                        onChange={(event) =>
                                                            patchLane(lane.id, {
                                                                targetParam: event.target.value as AutomationLane['targetParam'],
                                                            })
                                                        }
                                                        className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[10px] font-bold text-indigo-200 outline-none"
                                                    >
                                                        {paramOptions.map((option) => (
                                                            <option key={option.key} value={option.key} className="bg-slate-900 text-indigo-200">
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={lane.mode}
                                                        onChange={(event) =>
                                                            patchLane(lane.id, {
                                                                mode: event.target.value as AutomationLane['mode'],
                                                            })
                                                        }
                                                        className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[10px] font-bold text-indigo-200 outline-none"
                                                    >
                                                        <option value="ramp" className="bg-slate-900 text-indigo-200">Ramp</option>
                                                        <option value="step" className="bg-slate-900 text-indigo-200">Step</option>
                                                    </select>
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    {lane.points.map((point: AutomationPoint) => (
                                                        <div key={point.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.25"
                                                                value={point.barOffset}
                                                                onChange={(event) =>
                                                                    patchLane(lane.id, {
                                                                        points: lane.points.map((entry: AutomationPoint) =>
                                                                            entry.id === point.id
                                                                                ? { ...entry, barOffset: Number(event.target.value) }
                                                                                : entry
                                                                        ),
                                                                    })
                                                                }
                                                                className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[10px] font-bold text-indigo-200 outline-none"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={point.value}
                                                                onChange={(event) =>
                                                                    patchLane(lane.id, {
                                                                        points: lane.points.map((entry: AutomationPoint) =>
                                                                            entry.id === point.id
                                                                                ? { ...entry, value: Number(event.target.value) }
                                                                                : entry
                                                                        ),
                                                                    })
                                                                }
                                                                className="nodrag rounded-lg border border-indigo-500/20 bg-slate-900/60 px-2 py-2 text-[10px] font-bold text-indigo-200 outline-none"
                                                            />
                                                            <button
                                                                onClick={() =>
                                                                    patchLane(lane.id, {
                                                                        points: lane.points.filter((entry: AutomationPoint) => entry.id !== point.id),
                                                                    })
                                                                }
                                                                className="nodrag rounded-lg bg-slate-700 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-200"
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        patchLane(lane.id, {
                                                            points: [
                                                                ...lane.points,
                                                                createPoint(
                                                                    getNodeAutomatableValue(targetNode?.data, lane.targetParam)
                                                                ),
                                                            ],
                                                        })
                                                    }
                                                    className="nodrag mt-3 rounded-full bg-indigo-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white"
                                                >
                                                    Add Point
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
