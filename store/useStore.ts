import { create } from 'zustand';
import * as Tone from 'tone';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    OnEdgeUpdateFunc,
    updateEdge,
} from 'reactflow';

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const DEFAULT_TRANSPORT_BPM = 120;
export const DEFAULT_MASTER_VOLUME = 50;
export const MIN_TEMPO_BPM = 40;
export const MAX_TEMPO_BPM = 200;
export const AUDIO_INPUT_HANDLE_ID = 'audio-in';
export const AUDIO_OUTPUT_HANDLE_ID = 'audio-out';
export const TEMPO_INPUT_HANDLE_ID = 'tempo-in';
export const TEMPO_OUTPUT_HANDLE_ID = 'tempo-out';
export const DRUM_PARTS = ['kick', 'snare', 'hatClosed', 'hatOpen'] as const;
export const DRUM_STEP_COUNT = 16;

export type AudioNodeType = 'generator' | 'effect' | 'speaker' | 'controller' | 'tempo' | 'drum';
export type ConnectionKind = 'audio' | 'tempo';
export type WaveShape = 'sine' | 'square' | 'triangle' | 'sawtooth';
export type DrumMode = 'hits' | 'grid';
export type DrumPart = (typeof DRUM_PARTS)[number];
export type DrumPattern = Record<DrumPart, boolean[]>;
type AppEdgeData = {
    kind?: ConnectionKind;
};
type AppEdge = Edge<AppEdgeData>;
type DisposablePattern = {
    stop: () => DisposablePattern;
    dispose: () => void;
};
type DrumRack = {
    output: Tone.Gain;
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hatClosed: Tone.MetalSynth;
    hatOpen: Tone.MetalSynth;
    loop: Tone.Loop | null;
    step: number;
};
type NodeValueUpdate = {
    waveShape?: WaveShape;
    volume?: number;
    mute?: boolean;
    roomSize?: number;
    wet?: number;
    delayTime?: number;
    feedback?: number;
    distortion?: number;
    frequency?: number;
    octaves?: number;
    bits?: number;
};

export type AppNode = Node & {
    data: {
        label: string;
        subType?: string;
        isPlaying?: boolean;
        drumMode?: DrumMode;
        drumPattern?: DrumPattern;
        currentStep?: number;
        rootNote?: string;
        scaleType?: string;
        waveShape?: WaveShape;
        octave?: number;
        bpm?: number;
    };
    type: AudioNodeType;
};

// Rendered pixel widths/heights per node type (must stay in sync with Tailwind classes)
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    generator:  { w: 224, h: 220 },
    drum:       { w: 320, h: 360 },
    effect:     { w: 224, h: 260 },
    speaker:    { w: 224, h: 200 },
    tempo:      { w: 256, h: 240 },
};
const DEFAULT_DIMS = { w: 224, h: 220 };
const getDims = (type: string) => NODE_DIMS[type] ?? DEFAULT_DIMS;

// Gap threshold within which two nodes are considered "adjacent" (snapped)
const ADJ_TOUCH_THRESHOLD = 48;
// Y-centres must be within this many px of each other to count as adjacent
const ADJ_Y_THRESHOLD = 100;

const AUTO_EDGE_PREFIX = 'auto-';
const DRUM_PAD_HIGHLIGHT_MS = 120;
const drumPadTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const SIGNAL_ORDER: Record<AudioNodeType, number> = {
    tempo: -1,
    controller: 0,
    generator: 1,
    drum: 1,
    effect: 2,
    speaker: 3,
};

const VALID_AUTO_WIRE_PAIRS = new Set([
    'controller->generator',
    'generator->effect',
    'drum->effect',
    'effect->effect',
]);

const clampTempoBpm = (bpm: number) =>
    Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(bpm)));

const clampVolumePercent = (volume: number) =>
    Math.min(100, Math.max(0, Math.round(volume)));

const volumePercentToDb = (volume: number) => {
    const nextVolume = clampVolumePercent(volume);

    if (nextVolume === 0) {
        return -Infinity;
    }

    return ((nextVolume - 1) / 99) * 36 - 30;
};

const createDefaultDrumPattern = (): DrumPattern => ({
    kick:      [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare:     [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    hatOpen:   [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
});

const createDrumRack = (): DrumRack => {
    const output = new Tone.Gain(0.9);
    const kick = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 6,
        oscillator: { type: 'sine' },
        envelope: {
            attack: 0.001,
            decay: 0.35,
            sustain: 0,
            release: 0.08,
        },
    }).connect(output);
    const snare = new Tone.NoiseSynth({
        noise: { type: 'white', playbackRate: 1.75 },
        envelope: {
            attack: 0.001,
            decay: 0.14,
            sustain: 0,
            release: 0.03,
        },
    }).connect(output);
    const hatClosed = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 24,
        resonance: 4200,
        octaves: 1.5,
        envelope: {
            attack: 0.001,
            decay: 0.06,
            release: 0.02,
        },
    }).connect(output);
    hatClosed.frequency.value = 260;
    const hatOpen = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 26,
        resonance: 3600,
        octaves: 1.5,
        envelope: {
            attack: 0.001,
            decay: 0.22,
            release: 0.08,
        },
    }).connect(output);
    hatOpen.frequency.value = 220;

    return {
        output,
        kick,
        snare,
        hatClosed,
        hatOpen,
        loop: null,
        step: 0,
    };
};

export const isTempoEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'tempo' ||
    edge.sourceHandle === TEMPO_OUTPUT_HANDLE_ID ||
    edge.targetHandle === TEMPO_INPUT_HANDLE_ID;

export const isAudioEdge = (edge: Edge<AppEdgeData>) => !isTempoEdge(edge);

const stripLegacyTempoEdges = (edges: AppEdge[]) =>
    edges.filter((edge) => !isTempoEdge(edge));

const isValidGraphConnection = (
    connection: Connection,
    nodes: AppNode[],
    edges: Edge<AppEdgeData>[],
    ignoredEdgeId?: string
) => {
    if (!connection.source || !connection.target || connection.source === connection.target) {
        return false;
    }

    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) {
        return false;
    }

    if (sourceNode.type === 'speaker' || targetNode.type === 'speaker') {
        return false;
    }

    if (
        sourceNode.type === 'tempo' ||
        targetNode.type === 'tempo' ||
        connection.sourceHandle === TEMPO_OUTPUT_HANDLE_ID ||
        connection.targetHandle === TEMPO_INPUT_HANDLE_ID ||
        (connection.sourceHandle && connection.sourceHandle !== AUDIO_OUTPUT_HANDLE_ID) ||
        (connection.targetHandle && connection.targetHandle !== AUDIO_INPUT_HANDLE_ID)
    ) {
        return false;
    }

    const pairKey = `${sourceNode.type}->${targetNode.type}`;
    if (!VALID_AUTO_WIRE_PAIRS.has(pairKey)) {
        return false;
    }

    return !edges.some((edge) =>
        edge.id !== ignoredEdgeId &&
        !edge.id.startsWith(AUTO_EDGE_PREFIX) &&
        isAudioEdge(edge) &&
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
    );
};

const getConnectionKind = (
    connection: Connection,
    nodes: AppNode[]
): ConnectionKind | null => {
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) {
        return null;
    }

    return 'audio';
};

const getEdgePresentation = (kind: ConnectionKind) => ({
    style: {
        stroke: '#22d3ee',
        strokeWidth: 2.5,
        filter: 'drop-shadow(0 0 6px #22d3ee)',
    },
    data: { kind },
});

type AppState = {
    nodes: AppNode[];
    edges: AppEdge[];
    audioNodes: Map<string, Tone.ToneAudioNode>;
    masterOutput: Tone.Volume | null;
    masterVolume: number;
    drumRacks: Map<string, DrumRack>;
    patterns: Map<string, DisposablePattern>;
    activeGenerators: Set<string>;
    activeDrumPads: Set<string>;
    adjacentNodeIds: Set<string>;
    autoEdgeIds: Set<string>;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onEdgeUpdate: OnEdgeUpdateFunc;
    onEdgeUpdateStart: (event: React.MouseEvent, edge: Edge) => void;
    onEdgeUpdateEnd: (event: MouseEvent | TouchEvent, edge: Edge) => void;
    ensureMasterOutput: () => Tone.Volume;
    setMasterVolume: (volume: number) => void;
    resetMasterVolume: () => void;
    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => void;
    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => void;
    removeAudioNode: (id: string) => void;
    updateNodeValue: (id: string, value: NodeValueUpdate) => void;
    updateTempoBpm: (id: string, bpm: number) => void;
    updateArpScale: (id: string, root: string, scale: string) => void;
    updateOctave: (id: string, octave: number) => void;
    setDrumMode: (id: string, mode: DrumMode) => void;
    toggleDrumStep: (id: string, part: DrumPart, step: number) => void;
    triggerDrumHit: (id: string, part: DrumPart, time?: number | string) => void;
    triggerNoteOn: (id: string, note: string) => void;
    triggerNoteOff: (id: string, note: string) => void;
    fireNoteOn: (controllerId: string, note: string) => void;
    fireNoteOff: (controllerId: string, note: string) => void;
    toggleNodePlayback: (id: string, isPlaying: boolean) => void;
    addNode: (node: AppNode) => void;
    removeNodeAndCleanUp: (id: string) => void;
    sanitizeLegacyTempoEdges: () => void;
    isValidConnection: (connection: Connection, ignoredEdgeId?: string) => boolean;
    rebuildAudioGraph: () => void;
    initializeDefaultNodes: () => void;
    recalculateAdjacency: () => void;
    autoWireAdjacentNodes: () => void;
};

export const useStore = create<AppState>((set, get) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'controller',
            data: { label: 'Arp Controller', subType: 'arp' },
            position: { x: 60, y: 200 },
        },
        {
            id: 'node-2',
            type: 'generator',
            data: { label: 'Oscillator', subType: 'wave', waveShape: 'sine' },
            position: { x: 348, y: 200 },
        },
        {
            id: 'node-3',
            type: 'speaker',
            data: { label: 'Master Out' },
            position: { x: 572, y: 200 },
        },
    ],
    // Auto-edges start hidden — audio still routes through them, no visible wire
    edges: [
        {
            id: 'auto-node-1-node-2',
            source: 'node-1',
            target: 'node-2',
            hidden: true,
        },
    ],
    audioNodes: new Map(),
    masterOutput: null,
    masterVolume: DEFAULT_MASTER_VOLUME,
    drumRacks: new Map(),
    patterns: new Map(),
    activeGenerators: new Set(),
    activeDrumPads: new Set(),
    adjacentNodeIds: new Set(),
    autoEdgeIds: new Set(['auto-node-1-node-2']),

    ensureMasterOutput: () => {
        const { masterOutput, masterVolume } = get();

        if (masterOutput) {
            return masterOutput;
        }

        const nextMasterOutput = new Tone.Volume(volumePercentToDb(masterVolume)).toDestination();
        set({ masterOutput: nextMasterOutput });
        return nextMasterOutput;
    },

    setMasterVolume: (volume: number) => {
        const nextVolume = clampVolumePercent(volume);
        const masterOutput = get().ensureMasterOutput();
        masterOutput.volume.rampTo(volumePercentToDb(nextVolume), 0.1);
        set({ masterVolume: nextVolume });
    },

    resetMasterVolume: () => {
        get().setMasterVolume(DEFAULT_MASTER_VOLUME);
    },

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const currentEdges = get().edges;
        const nextEdges = stripLegacyTempoEdges(applyEdgeChanges(changes, currentEdges) as AppEdge[]);
        set({ edges: nextEdges });
        get().autoWireAdjacentNodes();
    },

    onEdgeUpdateStart: () => {},

    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
        if (!get().isValidConnection(newConnection, oldEdge.id)) {
            return;
        }

        const kind = getConnectionKind(newConnection, get().nodes);
        if (!kind) {
            return;
        }

        set({
            edges: updateEdge(oldEdge, {
                ...newConnection,
                ...getEdgePresentation(kind),
            }, get().edges),
        });
        get().autoWireAdjacentNodes();
    },

    onEdgeUpdateEnd: () => {},

    onConnect: (connection: Connection) => {
        if (!get().isValidConnection(connection)) {
            return;
        }

        const kind = getConnectionKind(connection, get().nodes);
        if (!kind) {
            return;
        }

        set({
            edges: addEdge({
                ...connection,
                ...getEdgePresentation(kind),
            }, get().edges),
        });
        get().autoWireAdjacentNodes();
    },

    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => {
        const { audioNodes } = get();
        if (audioNodes.has(id)) return;

        let node: Tone.ToneAudioNode | null = null;

        if (type === 'generator') {
            node = new Tone.PolySynth();
        } else if (type === 'drum') {
            const rack = createDrumRack();
            const nextDrumRacks = new Map(get().drumRacks);
            nextDrumRacks.set(id, rack);
            set({ drumRacks: nextDrumRacks });
            node = rack.output;
        } else if (type === 'controller' || type === 'tempo' || type === 'speaker') {
            return;
        } else if (type === 'effect') {
            const actualSubType = subType || 'none';
            if (actualSubType === 'reverb') {
                node = new Tone.Freeverb({ roomSize: 0.5, wet: 0.5 });
            } else if (actualSubType === 'delay') {
                node = new Tone.FeedbackDelay('8n', 0.5);
            } else if (actualSubType === 'distortion') {
                node = new Tone.Distortion(0.5);
            } else if (actualSubType === 'phaser') {
                node = new Tone.Phaser({ frequency: 15, octaves: 5, baseFrequency: 1000 });
            } else if (actualSubType === 'bitcrusher') {
                node = new Tone.BitCrusher(4);
            } else {
                node = new Tone.Volume(0);
            }
        }

        if (node) {
            const newMap = new Map(get().audioNodes);
            newMap.set(id, node);
            set({ audioNodes: newMap });
        }
    },

    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => {
        const { audioNodes, patterns, nodes, edges } = get();
        const wasPlaying = nodes.find((n: AppNode) => n.id === id)?.data.isPlaying || false;

        const oldNode = audioNodes.get(id);
        const oldPattern = patterns.get(id);

        if (oldPattern) {
            oldPattern.stop().dispose();
            const newPatterns = new Map(patterns);
            newPatterns.delete(id);
            set({ patterns: newPatterns });
        }

        if (oldNode) {
            oldNode.disconnect().dispose();
            const newAudioNodes = new Map(audioNodes);
            newAudioNodes.delete(id);
            set({ audioNodes: newAudioNodes });
        }

        get().initAudioNode(id, mainType, subType);

        const nextEdges =
            mainType === 'controller' && subType !== 'arp'
                ? edges.filter((edge: AppEdge) => !(isTempoEdge(edge) && edge.target === id))
                : edges;

        set({
            nodes: nodes.map((n: AppNode) =>
                n.id === id
                    ? { ...n, data: { ...n.data, subType, isPlaying: wasPlaying } }
                    : n
            ),
            edges: nextEdges,
        });

        const handleRebuild = () => {
            get().autoWireAdjacentNodes();
            if (wasPlaying) get().toggleNodePlayback(id, true);
        };

        const newNode = get().audioNodes.get(id);
        if (newNode instanceof Tone.Reverb) {
            newNode.ready.then(handleRebuild);
        } else {
            handleRebuild();
        }
    },

    removeAudioNode: (id: string) => {
        const { audioNodes, drumRacks, patterns, activeDrumPads } = get();
        const pattern = patterns.get(id);
        if (pattern) {
            pattern.stop().dispose();
            const newPatterns = new Map(patterns);
            newPatterns.delete(id);
            set({ patterns: newPatterns });
        }

        const rack = drumRacks.get(id);
        if (rack) {
            rack.loop?.dispose();
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hatClosed.disconnect().dispose();
            rack.hatOpen.disconnect().dispose();

            const nextDrumRacks = new Map(drumRacks);
            nextDrumRacks.delete(id);

            const nextActiveDrumPads = new Set(
                [...activeDrumPads].filter((padKey) => !padKey.startsWith(`${id}:`))
            );

            [...drumPadTimeouts.keys()]
                .filter((padKey) => padKey.startsWith(`${id}:`))
                .forEach((padKey) => {
                    const timeoutId = drumPadTimeouts.get(padKey);
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    drumPadTimeouts.delete(padKey);
                });

            set({
                drumRacks: nextDrumRacks,
                activeDrumPads: nextActiveDrumPads,
            });
        }

        const node = audioNodes.get(id);
        if (node) {
            node.disconnect().dispose();
            const newMap = new Map(audioNodes);
            newMap.delete(id);
            set({ audioNodes: newMap });
        }
    },

    updateNodeValue: (id: string, value: NodeValueUpdate) => {
        const targetNode = get().nodes.find((candidate: AppNode) => candidate.id === id);
        if (targetNode?.type === 'speaker' && typeof value.volume === 'number') {
            get().setMasterVolume(value.volume);
            return;
        }

        const node = get().audioNodes.get(id);
        if (!node) return;

        if (value.waveShape) {
            if (node instanceof Tone.Oscillator) {
                node.set({ type: value.waveShape });
            } else if (node instanceof Tone.PolySynth) {
                node.set({ oscillator: { type: value.waveShape } as never });
            }
            const nodes = get().nodes.map((n: AppNode) =>
                n.id === id ? { ...n, data: { ...n.data, waveShape: value.waveShape } } : n
            );
            set({ nodes });
        }

        if (node instanceof Tone.Volume && typeof value.volume === 'number') {
            node.volume.rampTo(volumePercentToDb(value.volume), 0.1);
        }

        if (node instanceof Tone.Freeverb) {
            if (typeof value.roomSize === 'number') node.roomSize.value = value.roomSize;
            if (typeof value.wet === 'number') node.wet.rampTo(value.wet, 0.1);
        } else if (node instanceof Tone.FeedbackDelay) {
            if (typeof value.delayTime === 'number') node.delayTime.rampTo(value.delayTime, 0.1);
            if (typeof value.feedback === 'number') node.feedback.rampTo(value.feedback, 0.1);
            if (typeof value.wet === 'number') node.wet.rampTo(value.wet, 0.1);
        } else if (node instanceof Tone.Distortion) {
            if (typeof value.distortion === 'number') node.distortion = value.distortion;
            if (typeof value.wet === 'number') node.wet.rampTo(value.wet, 0.1);
        } else if (node instanceof Tone.Phaser) {
            if (typeof value.frequency === 'number') node.frequency.rampTo(value.frequency, 0.1);
            if (typeof value.octaves === 'number') node.octaves = value.octaves;
            if (typeof value.wet === 'number') node.wet.rampTo(value.wet, 0.1);
        } else if (node instanceof Tone.BitCrusher) {
            if (typeof value.bits === 'number') node.bits.value = value.bits;
        }

        if (node instanceof Tone.Oscillator && typeof value.frequency === 'number') {
            node.frequency.rampTo(value.frequency, 0.1);
        }
    },

    updateTempoBpm: (id: string, bpm: number) => {
        const nextBpm = clampTempoBpm(bpm);
        const { nodes } = get();
        const hasTempoNode = nodes.some((node: AppNode) => node.id === id && node.type === 'tempo');

        if (!hasTempoNode) {
            return;
        }

        Tone.getTransport().bpm.rampTo(nextBpm, 0.1);
        set({
            nodes: nodes.map((node: AppNode) =>
                node.id === id
                    ? { ...node, data: { ...node.data, bpm: nextBpm } }
                    : node
            ),
        });
    },

    updateArpScale: (id: string, root: string, scale: string) => {
        const { nodes } = get();
        set({
            nodes: nodes.map((n: AppNode) =>
                n.id === id
                    ? { ...n, data: { ...n.data, rootNote: root, scaleType: scale } }
                    : n
            ),
        });
    },

    updateOctave: (id: string, octave: number) => {
        const { nodes } = get();
        set({
            nodes: nodes.map((n: AppNode) =>
                n.id === id ? { ...n, data: { ...n.data, octave } } : n
            ),
        });
    },

    setDrumMode: (id: string, mode: DrumMode) => {
        const { nodes, drumRacks } = get();
        const currentNode = nodes.find((node: AppNode) => node.id === id && node.type === 'drum');
        if (!currentNode) {
            return;
        }

        const rack = drumRacks.get(id);
        if (rack && currentNode.data.drumMode === 'grid' && mode !== 'grid') {
            rack.loop?.stop(0);
            rack.loop?.cancel(0);
            rack.step = 0;
        }

        set({
            nodes: nodes.map((node: AppNode) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            drumMode: mode,
                            currentStep: -1,
                            isPlaying: mode === 'grid' ? node.data.isPlaying : false,
                        },
                    }
                    : node
            ),
        });
    },

    toggleDrumStep: (id: string, part: DrumPart, step: number) => {
        const { nodes } = get();
        if (step < 0 || step >= DRUM_STEP_COUNT) {
            return;
        }

        set({
            nodes: nodes.map((node: AppNode) => {
                if (node.id !== id || node.type !== 'drum') {
                    return node;
                }

                const pattern = node.data.drumPattern ?? createDefaultDrumPattern();
                const nextPattern: DrumPattern = {
                    kick: [...pattern.kick],
                    snare: [...pattern.snare],
                    hatClosed: [...pattern.hatClosed],
                    hatOpen: [...pattern.hatOpen],
                };
                nextPattern[part][step] = !nextPattern[part][step];

                return {
                    ...node,
                    data: {
                        ...node.data,
                        drumPattern: nextPattern,
                    },
                };
            }),
        });
    },

    triggerDrumHit: (id: string, part: DrumPart, time?: number | string) => {
        const rack = get().drumRacks.get(id);
        if (!rack) {
            return;
        }

        if (part === 'kick') {
            rack.kick.triggerAttackRelease('C1', '8n', time, 0.95);
        } else if (part === 'snare') {
            rack.snare.triggerAttackRelease('16n', time, 0.8);
        } else if (part === 'hatClosed') {
            rack.hatClosed.triggerAttackRelease('C6', '32n', time, 0.45);
        } else if (part === 'hatOpen') {
            rack.hatOpen.triggerAttackRelease('A5', '8n', time, 0.35);
        }

        const padKey = `${id}:${part}`;
        const existingTimeout = drumPadTimeouts.get(padKey);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        set({
            activeDrumPads: new Set([...get().activeDrumPads, padKey]),
        });

        drumPadTimeouts.set(
            padKey,
            setTimeout(() => {
                const nextActiveDrumPads = new Set(get().activeDrumPads);
                nextActiveDrumPads.delete(padKey);
                set({ activeDrumPads: nextActiveDrumPads });
                drumPadTimeouts.delete(padKey);
            }, DRUM_PAD_HIGHLIGHT_MS)
        );
    },

    triggerNoteOn: (id: string, note: string) => {
        const node = get().audioNodes.get(id);
        if (node instanceof Tone.PolySynth) {
            node.triggerAttack(note);
            set({ activeGenerators: new Set([...get().activeGenerators, id]) });
        }
    },

    triggerNoteOff: (id: string, note: string) => {
        const node = get().audioNodes.get(id);
        if (node instanceof Tone.PolySynth) {
            node.triggerRelease(note);
            const next = new Set(get().activeGenerators);
            next.delete(id);
            set({ activeGenerators: next });
        }
    },

    fireNoteOn: (controllerId: string, note: string) => {
        const { edges, audioNodes } = get();
        const targetIds: string[] = [];
        edges.filter((e: AppEdge) => isAudioEdge(e) && e.source === controllerId).forEach((edge: Edge) => {
            const targetNode = audioNodes.get(edge.target);
            if (targetNode instanceof Tone.PolySynth) {
                targetNode.triggerAttack(note);
                targetIds.push(edge.target);
            }
        });
        if (targetIds.length > 0) {
            set({ activeGenerators: new Set([...get().activeGenerators, ...targetIds]) });
        }
    },

    fireNoteOff: (controllerId: string, note: string) => {
        const { edges, audioNodes } = get();
        const targetIds: string[] = [];
        edges.filter((e: AppEdge) => isAudioEdge(e) && e.source === controllerId).forEach((edge: Edge) => {
            const targetNode = audioNodes.get(edge.target);
            if (targetNode instanceof Tone.PolySynth) {
                targetNode.triggerRelease(note);
                targetIds.push(edge.target);
            }
        });
        if (targetIds.length > 0) {
            const next = new Set(get().activeGenerators);
            targetIds.forEach(id => next.delete(id));
            set({ activeGenerators: next });
        }
    },

    toggleNodePlayback: (id: string, isPlaying: boolean) => {
        const { audioNodes, drumRacks, nodes } = get();
        const nodeData = nodes.find((node: AppNode) => node.id === id);
        if (!nodeData) {
            return;
        }

        if (nodeData.type === 'drum') {
            const rack = drumRacks.get(id);
            if (!rack) {
                return;
            }

            const drumPattern = nodeData.data.drumPattern ?? createDefaultDrumPattern();

            if (nodeData.data.drumMode === 'grid' && isPlaying) {
                if (!rack.loop) {
                    rack.loop = new Tone.Loop((time) => {
                        const step = rack.step % DRUM_STEP_COUNT;
                        const currentNode = get().nodes.find((node: AppNode) => node.id === id);
                        const currentPattern = currentNode?.data.drumPattern ?? drumPattern;

                        DRUM_PARTS.forEach((part) => {
                            if (currentPattern[part][step]) {
                                get().triggerDrumHit(id, part, time);
                            }
                        });

                        Tone.getDraw().schedule(() => {
                            set({
                                nodes: get().nodes.map((node: AppNode) =>
                                    node.id === id
                                        ? { ...node, data: { ...node.data, currentStep: step } }
                                        : node
                                ),
                            });
                        }, time);

                        rack.step = (step + 1) % DRUM_STEP_COUNT;
                    }, '16n');
                }

                rack.loop.cancel(0);
                rack.step = 0;
                rack.loop.start(0);
            } else {
                rack.loop?.stop(0);
                rack.loop?.cancel(0);
                rack.step = 0;
            }

            set({
                nodes: nodes.map((node: AppNode) =>
                    node.id === id
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                currentStep: isPlaying ? node.data.currentStep ?? -1 : -1,
                                isPlaying,
                            },
                        }
                        : node
                ),
            });
            return;
        }

        const node = audioNodes.get(id);
        if (node instanceof Tone.Oscillator) {
            if (isPlaying) {
                node.start();
            } else {
                node.stop();
            }
        }
        set({
            nodes: nodes.map((n: AppNode) =>
                n.id === id ? { ...n, data: { ...n.data, isPlaying } } : n
            ),
        });
    },

    addNode: (node: AppNode) => {
        if (
            (node.type === 'tempo' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'tempo')) ||
            (node.type === 'speaker' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'speaker'))
        ) {
            return;
        }

        const nextNode =
            node.type === 'tempo'
                ? {
                    ...node,
                    data: {
                        ...node.data,
                        label: node.data.label || 'Tempo',
                        bpm: clampTempoBpm(node.data.bpm ?? DEFAULT_TRANSPORT_BPM),
                        },
                    }
                : node.type === 'speaker'
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            label: node.data.label || 'Master Out',
                        },
                    }
                : node.type === 'drum'
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            label: node.data.label || 'Drums',
                            drumMode: node.data.drumMode ?? 'hits',
                            drumPattern: node.data.drumPattern ?? createDefaultDrumPattern(),
                            currentStep: node.data.currentStep ?? -1,
                            isPlaying: node.data.isPlaying ?? false,
                        },
                    }
                : node;

        set((state: AppState) => ({ nodes: [...state.nodes, nextNode] }));

        if (nextNode.type === 'tempo') {
            Tone.getTransport().bpm.rampTo(nextNode.data.bpm ?? DEFAULT_TRANSPORT_BPM, 0.1);
            return;
        }

        if (nextNode.type === 'speaker') {
            get().resetMasterVolume();
            return;
        }

        if (nextNode.data.subType && nextNode.data.subType !== 'none') {
            get().initAudioNode(nextNode.id, nextNode.type, nextNode.data.subType);
        } else if (nextNode.type === 'drum') {
            get().initAudioNode(nextNode.id, nextNode.type);
        }

        get().rebuildAudioGraph();
    },

    removeNodeAndCleanUp: (id: string) => {
        const { nodes, edges } = get();
        const removedNode = nodes.find((node: AppNode) => node.id === id);
        get().removeAudioNode(id);
        set({
            nodes: nodes.filter((n: AppNode) => n.id !== id),
            edges: edges.filter((e: AppEdge) => e.source !== id && e.target !== id),
        });
        if (removedNode?.type === 'tempo') {
            Tone.getTransport().bpm.rampTo(DEFAULT_TRANSPORT_BPM, 0.1);
        }
        if (removedNode?.type === 'speaker') {
            get().resetMasterVolume();
        }
        get().recalculateAdjacency();
    },

    sanitizeLegacyTempoEdges: () => {
        const currentEdges = get().edges;
        const nextEdges = stripLegacyTempoEdges(currentEdges);

        if (nextEdges.length === currentEdges.length) {
            return;
        }

        set({ edges: nextEdges });
    },

    isValidConnection: (connection: Connection, ignoredEdgeId?: string) =>
        isValidGraphConnection(connection, get().nodes, get().edges, ignoredEdgeId),

    rebuildAudioGraph: () => {
        const { audioNodes, edges, nodes } = get() as AppState;
        const masterOutput = get().ensureMasterOutput();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const routedSourceIds = new Set<string>();

        audioNodes.forEach((node: Tone.ToneAudioNode) => node.disconnect());
        masterOutput.disconnect();
        masterOutput.toDestination();

        edges
            .filter((edge: AppEdge) => isAudioEdge(edge))
            .forEach((edge: AppEdge) => {
                const sourceInfo = nodesById.get(edge.source);
                const targetInfo = nodesById.get(edge.target);

                if (
                    !sourceInfo ||
                    !targetInfo ||
                    sourceInfo.type === 'controller' ||
                    sourceInfo.type === 'tempo' ||
                    sourceInfo.type === 'speaker' ||
                    targetInfo.type === 'controller' ||
                    targetInfo.type === 'tempo' ||
                    targetInfo.type === 'speaker'
                ) {
                    return;
                }

                const sourceNode = audioNodes.get(edge.source);
                const targetNode = audioNodes.get(edge.target);

                if (sourceNode && targetNode) {
                    sourceNode.connect(targetNode);
                    routedSourceIds.add(edge.source);
                }
            });

        audioNodes.forEach((audioNode: Tone.ToneAudioNode, id: string) => {
            const nodeInfo = nodesById.get(id);

            if (
                !nodeInfo ||
                nodeInfo.type === 'controller' ||
                nodeInfo.type === 'tempo' ||
                nodeInfo.type === 'speaker' ||
                routedSourceIds.has(id)
            ) {
                return;
            }

            audioNode.connect(masterOutput);
        });
    },

    initializeDefaultNodes: () => {
        get().sanitizeLegacyTempoEdges();
        const { nodes } = get();
        get().ensureMasterOutput();
        const tempoNode = nodes.find((node: AppNode) => node.type === 'tempo');
        Tone.getTransport().bpm.value = tempoNode?.data.bpm ?? DEFAULT_TRANSPORT_BPM;
        nodes.forEach((node: AppNode) => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (node.type === 'drum') {
                get().initAudioNode(node.id, 'drum');
            }
        });
        get().rebuildAudioGraph();
    },

    autoWireAdjacentNodes: () => {
        const { nodes, edges, autoEdgeIds } = get() as AppState;

        // All edge IDs we are allowed to remove/replace (auto-managed ones)
        const managedIds = new Set([
            ...autoEdgeIds,
            ...edges
                .filter((e: Edge) => e.id.startsWith(AUTO_EDGE_PREFIX))
                .map((e: Edge) => e.id),
        ]);

        const desiredAutoEdges: Array<{ source: string; target: string; id: string }> = [];

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                if (
                    a.type === 'tempo' ||
                    b.type === 'tempo' ||
                    a.type === 'speaker' ||
                    b.type === 'speaker'
                ) {
                    continue;
                }
                const aDims = getDims(a.type);
                const bDims = getDims(b.type);

                const gapRight = b.position.x - (a.position.x + aDims.w);
                const gapLeft  = a.position.x - (b.position.x + bDims.w);
                const horizGap = Math.max(gapRight, gapLeft);

                const aCentreY = a.position.y + aDims.h / 2;
                const bCentreY = b.position.y + bDims.h / 2;
                const vertDist = Math.abs(aCentreY - bCentreY);

                if (horizGap < 0 || horizGap > ADJ_TOUCH_THRESHOLD || vertDist > ADJ_Y_THRESHOLD) {
                    continue;
                }

                // Determine source/target by signal flow order
                const leftNode  = a.position.x <= b.position.x ? a : b;
                const rightNode = a.position.x <= b.position.x ? b : a;

                let sourceNode = leftNode;
                let targetNode = rightNode;
                if ((SIGNAL_ORDER[leftNode.type] ?? 99) > (SIGNAL_ORDER[rightNode.type] ?? 99)) {
                    sourceNode = rightNode;
                    targetNode = leftNode;
                }

                const pairKey = `${sourceNode.type}->${targetNode.type}`;
                if (!VALID_AUTO_WIRE_PAIRS.has(pairKey)) continue;

                // Don't create an auto-edge if a manual edge already exists for this pair
                const manualExists = edges.some(
                    (e: Edge) =>
                        e.source === sourceNode.id &&
                        e.target === targetNode.id &&
                        !managedIds.has(e.id)
                );
                if (manualExists) continue;

                desiredAutoEdges.push({
                    source: sourceNode.id,
                    target: targetNode.id,
                    id: `${AUTO_EDGE_PREFIX}${sourceNode.id}-${targetNode.id}`,
                });
            }
        }

        const desiredIds = new Set(desiredAutoEdges.map(e => e.id));

        // Keep all manually drawn edges; rebuild the auto set from scratch
        const manualEdges = edges.filter((e: AppEdge) => !managedIds.has(e.id));

        // Auto-edges are hidden: audio routes through them, no visual wire rendered
        const nextAutoEdges: AppEdge[] = desiredAutoEdges.map(({ source, target, id }) => ({
            id,
            source,
            target,
            hidden: true, // invisible — connection is implied by the snap/glow, not a cable
            data: { kind: 'audio' },
        }));

        set({
            edges: [...manualEdges, ...nextAutoEdges],
            autoEdgeIds: desiredIds,
        });

        get().rebuildAudioGraph();
    },

    recalculateAdjacency: () => {
        const { nodes } = get();
        const adjacent = new Set<string>();

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                if (
                    a.type === 'tempo' ||
                    b.type === 'tempo' ||
                    a.type === 'speaker' ||
                    b.type === 'speaker'
                ) {
                    continue;
                }
                const aDims = getDims(a.type);
                const bDims = getDims(b.type);

                const gapRight = b.position.x - (a.position.x + aDims.w);
                const gapLeft  = a.position.x - (b.position.x + bDims.w);
                const horizGap = Math.max(gapRight, gapLeft);

                const aCentreY = a.position.y + aDims.h / 2;
                const bCentreY = b.position.y + bDims.h / 2;
                const vertDist = Math.abs(aCentreY - bCentreY);

                if (horizGap >= 0 && horizGap <= ADJ_TOUCH_THRESHOLD && vertDist <= ADJ_Y_THRESHOLD) {
                    adjacent.add(a.id);
                    adjacent.add(b.id);
                }
            }
        }

        set({ adjacentNodeIds: new Set(adjacent) });
        // Auto-wire runs after adjacency so it sees the fresh adjacent set
        get().autoWireAdjacentNodes();
    },
}));
