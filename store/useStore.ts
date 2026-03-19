import { create } from 'zustand';
import * as Tone from 'tone';
import { Note } from '@tonaljs/tonal';
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
export const CHORD_QUALITY_OPTIONS = [
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'dominant7', label: 'Dominant 7' },
    { value: 'major7', label: 'Major 7' },
    { value: 'minor7', label: 'Minor 7' },
    { value: 'sus2', label: 'Sus2' },
    { value: 'sus4', label: 'Sus4' },
    { value: 'diminished', label: 'Diminished' },
    { value: 'augmented', label: 'Augmented' },
] as const;
export type ChordQuality = (typeof CHORD_QUALITY_OPTIONS)[number]['value'];
export const DEFAULT_CHORD_QUALITY: ChordQuality = 'major';

export type AudioNodeType = 'generator' | 'effect' | 'speaker' | 'controller' | 'tempo' | 'drum' | 'chord' | 'adsr' | 'keys' | 'unison' | 'detune' | 'visualiser';
export type ConnectionKind = 'audio' | 'tempo';
export type WaveShape = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';
export type DrumMode = 'hits' | 'grid';
export type DrumPart = (typeof DRUM_PARTS)[number];
export type DrumPattern = Record<DrumPart, boolean[]>;
export type AppEdgeData = {
    kind?: ConnectionKind;
};
export type AppEdge = Edge<AppEdgeData>;
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
type ActiveChordVoicing = {
    notes: string[];
    count: number;
};
type NodeValueUpdate = {
    waveShape?: WaveShape;
    volume?: number;
    mix?: number;
    mute?: boolean;
    roomSize?: number;
    wet?: number;
    delayTime?: number;
    feedback?: number;
    distortion?: number;
    frequency?: number;
    octaves?: number;
    bits?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    depth?: number;
    pitch?: number;
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
        attack?: number;
        decay?: number;
        sustain?: number;
        release?: number;
        isLocked?: boolean;
        isEntry?: boolean;
        isExit?: boolean;
    };
    type: AudioNodeType;
};

type NoteDispatch = {
    generatorId: string;
    note: string;
};

const CHORD_INTERVALS: Record<ChordQuality, string[]> = {
    major: ['1P', '3M', '5P'],
    minor: ['1P', '3m', '5P'],
    dominant7: ['1P', '3M', '5P', '7m'],
    major7: ['1P', '3M', '5P', '7M'],
    minor7: ['1P', '3m', '5P', '7m'],
    sus2: ['1P', '2M', '5P'],
    sus4: ['1P', '4P', '5P'],
    diminished: ['1P', '3m', '5d'],
    augmented: ['1P', '3M', '5A'],
};

const getChordVoicingKey = (chordId: string, rootNote: string) =>
    `${chordId}::${rootNote}`;

const buildChordVoicing = (rootNote: string, quality?: string) => {
    const intervals =
        CHORD_INTERVALS[(quality ?? DEFAULT_CHORD_QUALITY) as ChordQuality] ??
        CHORD_INTERVALS[DEFAULT_CHORD_QUALITY];

    const notes = intervals
        .map((interval) => Note.transpose(rootNote, interval))
        .map((note) => (note ? Note.simplify(note) : ''))
        .filter((note): note is string => Boolean(note));

    return notes.length > 0 ? notes : [rootNote];
};

const rememberChordVoicing = (
    chordVoicings: Map<string, ActiveChordVoicing>,
    chordId: string,
    rootNote: string,
    quality?: string
) => {
    const voicingKey = getChordVoicingKey(chordId, rootNote);
    const existingVoicing = chordVoicings.get(voicingKey);

    if (existingVoicing) {
        chordVoicings.set(voicingKey, {
            ...existingVoicing,
            count: existingVoicing.count + 1,
        });
        return existingVoicing.notes;
    }

    const notes = buildChordVoicing(rootNote, quality);
    chordVoicings.set(voicingKey, { notes, count: 1 });
    return notes;
};

const consumeChordVoicing = (
    chordVoicings: Map<string, ActiveChordVoicing>,
    chordId: string,
    rootNote: string,
    quality?: string
) => {
    const voicingKey = getChordVoicingKey(chordId, rootNote);
    const existingVoicing = chordVoicings.get(voicingKey);

    if (!existingVoicing) {
        return buildChordVoicing(rootNote, quality);
    }

    if (existingVoicing.count <= 1) {
        chordVoicings.delete(voicingKey);
    } else {
        chordVoicings.set(voicingKey, {
            ...existingVoicing,
            count: existingVoicing.count - 1,
        });
    }

    return existingVoicing.notes;
};

const incrementGeneratorNoteCount = (
    noteCounts: Map<string, Map<string, number>>,
    generatorId: string,
    note: string
) => {
    const nextNoteCounts = new Map(noteCounts);
    const generatorNotes = new Map(nextNoteCounts.get(generatorId) ?? []);
    generatorNotes.set(note, (generatorNotes.get(note) ?? 0) + 1);
    nextNoteCounts.set(generatorId, generatorNotes);
    return nextNoteCounts;
};

const decrementGeneratorNoteCount = (
    noteCounts: Map<string, Map<string, number>>,
    generatorId: string,
    note: string
) => {
    const nextNoteCounts = new Map(noteCounts);
    const generatorNotes = new Map(nextNoteCounts.get(generatorId) ?? []);
    const nextCount = (generatorNotes.get(note) ?? 0) - 1;

    if (nextCount > 0) {
        generatorNotes.set(note, nextCount);
    } else {
        generatorNotes.delete(note);
    }

    if (generatorNotes.size > 0) {
        nextNoteCounts.set(generatorId, generatorNotes);
    } else {
        nextNoteCounts.delete(generatorId);
    }

    return nextNoteCounts;
};

const collectNoteDispatches = (
    sourceId: string,
    note: string,
    nodesById: Map<string, AppNode>,
    edges: AppEdge[],
    chordVoicings: Map<string, ActiveChordVoicing>,
    rememberVoicings: boolean,
    visited = new Set<string>()
): NoteDispatch[] => {
    const dispatches: NoteDispatch[] = [];

    edges
        .filter((edge) => isAudioEdge(edge) && edge.source === sourceId)
        .forEach((edge) => {
            const targetNode = nodesById.get(edge.target);

            if (!targetNode) {
                return;
            }

            if (targetNode.type === 'generator') {
                dispatches.push({ generatorId: targetNode.id, note });
                return;
            }

            if (targetNode.type === 'adsr') {
                // ADSR nodes pass through notes without transformation
                dispatches.push(
                    ...collectNoteDispatches(
                        targetNode.id,
                        note,
                        nodesById,
                        edges,
                        chordVoicings,
                        rememberVoicings,
                        visited
                    )
                );
                return;
            }

            if (targetNode.type !== 'chord') {
                return;
            }

            const visitKey = `${sourceId}->${targetNode.id}:${note}`;
            if (visited.has(visitKey)) {
                return;
            }

            const nextVisited = new Set(visited);
            nextVisited.add(visitKey);

            const voicing = rememberVoicings
                ? rememberChordVoicing(chordVoicings, targetNode.id, note, targetNode.data.subType)
                : consumeChordVoicing(chordVoicings, targetNode.id, note, targetNode.data.subType);

            voicing.forEach((voicedNote) => {
                dispatches.push(
                    ...collectNoteDispatches(
                        targetNode.id,
                        voicedNote,
                        nodesById,
                        edges,
                        chordVoicings,
                        rememberVoicings,
                        nextVisited
                    )
                );
            });
        });

    return dispatches;
};

const applyAdsrEnvelopes = (
    sourceId: string,
    nodesById: Map<string, AppNode>,
    edges: AppEdge[],
    audioNodes: Map<string, Tone.ToneAudioNode>
) => {
    // Find all ADSR nodes downstream from the source
    const visitedAdsrNodes = new Set<string>();

    const findAdsrNodes = (currentId: string) => {
        edges
            .filter((edge) => isAudioEdge(edge) && edge.source === currentId)
            .forEach((edge) => {
                const targetNode = nodesById.get(edge.target);
                if (!targetNode || visitedAdsrNodes.has(targetNode.id)) {
                    return;
                }

                if (targetNode.type === 'adsr') {
                    visitedAdsrNodes.add(targetNode.id);
                    // Apply this ADSR's envelope to all downstream generators
                    applyAdsrToDownstreamGenerators(targetNode.id, nodesById, edges, audioNodes);
                }

                // Continue traversing
                findAdsrNodes(targetNode.id);
            });
    };

    findAdsrNodes(sourceId);
};

const applyAdsrToDownstreamGenerators = (
    adsrId: string,
    nodesById: Map<string, AppNode>,
    edges: AppEdge[],
    audioNodes: Map<string, Tone.ToneAudioNode>
) => {
    const adsrNode = nodesById.get(adsrId);
    if (!adsrNode || adsrNode.type !== 'adsr') {
        return;
    }

    const { attack = 0.01, decay = 0.1, sustain = 0.7, release = 0.5 } = adsrNode.data;

    // Find all downstream generators
    const visited = new Set<string>();
    const findDownstreamGenerators = (currentId: string) => {
        edges
            .filter((edge) => isAudioEdge(edge) && edge.source === currentId)
            .forEach((edge) => {
                const targetNode = nodesById.get(edge.target);
                if (!targetNode || visited.has(targetNode.id)) {
                    return;
                }

                visited.add(targetNode.id);

                if (targetNode.type === 'generator') {
                    const synth = audioNodes.get(targetNode.id);
                    if (synth instanceof Tone.PolySynth) {
                        synth.set({
                            envelope: {
                                attack,
                                decay,
                                sustain,
                                release
                            }
                        });
                    }
                    // Note: Tone.Noise instances don't support envelope settings
                    // They will be controlled by start/stop for amplitude gating
                } else {
                    // Continue traversing for other node types
                    findDownstreamGenerators(targetNode.id);
                }
            });
    };

    findDownstreamGenerators(adsrId);
};

// Rendered pixel widths/heights per node type (must stay in sync with Tailwind classes)
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    keys: { w: 288, h: 320 },
    chord: { w: 224, h: 240 },
    adsr: { w: 224, h: 340 },
    generator: { w: 224, h: 220 },
    drum: { w: 320, h: 360 },
    effect: { w: 224, h: 260 },
    unison: { w: 224, h: 220 },
    detune: { w: 224, h: 200 },
    visualiser: { w: 256, h: 280 },
    speaker: { w: 224, h: 200 },
    tempo: { w: 256, h: 240 },
};
const DEFAULT_DIMS = { w: 224, h: 220 };
const getDims = (type: string) => NODE_DIMS[type] ?? DEFAULT_DIMS;

// Cluster / Locking Helpers
const getClusterNodeIds = (startNodeId: string, allNodes: AppNode[]) => {
    const clusterIds = new Set<string>();
    const queue = [startNodeId];
    clusterIds.add(startNodeId);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentNode = allNodes.find(n => n.id === currentId);
        if (!currentNode) continue;

        const cDims = getDims(currentNode.type);

        for (const other of allNodes) {
            if (clusterIds.has(other.id)) continue;
            if (other.type === 'tempo' || other.type === 'speaker') continue;

            const oDims = getDims(other.type);
            const gapRight = other.position.x - (currentNode.position.x + cDims.w);
            const gapLeft = currentNode.position.x - (other.position.x + oDims.w);
            const horizGap = Math.max(gapRight, gapLeft);

            const cCentreY = currentNode.position.y + cDims.h / 2;
            const oCentreY = other.position.y + oDims.h / 2;
            const vertDist = Math.abs(cCentreY - oCentreY);

            if (horizGap >= 0 && horizGap <= ADJ_TOUCH_THRESHOLD && vertDist <= ADJ_Y_THRESHOLD) {
                clusterIds.add(other.id);
                queue.push(other.id);
            }
        }
    }
    return clusterIds;
};

const getClusterBoundaries = (clusterIds: Set<string>, allNodes: AppNode[]) => {
    if (clusterIds.size === 0) return { entryId: null, exitId: null };

    const clusterNodes = allNodes.filter(n => clusterIds.has(n.id));

    // Sort by signal order, then x, then y
    clusterNodes.sort((a, b) => {
        const orderA = SIGNAL_ORDER[a.type] ?? 99;
        const orderB = SIGNAL_ORDER[b.type] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        if (a.position.x !== b.position.x) return a.position.x - b.position.x;
        return a.position.y - b.position.y;
    });

    return {
        entryId: clusterNodes[0].id,
        exitId: clusterNodes[clusterNodes.length - 1].id,
    };
};

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
    keys: 0,
    chord: 0.5,
    adsr: 0.75,
    generator: 1,
    drum: 1,
    unison: 1.5,
    detune: 1.5,
    effect: 2,
    visualiser: 2.5,
    speaker: 3,
};

const VALID_AUTO_WIRE_PAIRS = new Set([
    'controller->chord',
    'controller->adsr',
    'controller->generator',
    'keys->chord',
    'keys->adsr',
    'keys->generator',
    'keys->drum',
    'chord->adsr',
    'chord->generator',
    'adsr->chord',
    'adsr->generator',
    'adsr->drum',
    'generator->unison',
    'generator->detune',
    'drum->unison',
    'drum->detune',
    'unison->effect',
    'detune->effect',
    'unison->unison',
    'unison->detune',
    'detune->unison',
    'detune->detune',
    'generator->effect',
    'drum->effect',
    'effect->effect',
    'generator->visualiser',
    'drum->visualiser',
    'effect->visualiser',
    'unison->visualiser',
    'detune->visualiser',
    'visualiser->effect',
    'visualiser->visualiser',
]);

const clampTempoBpm = (bpm: number) =>
    Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(bpm)));

const clampVolumePercent = (volume: number) =>
    Math.min(100, Math.max(0, Math.round(volume)));

const hasSpeakerNode = (nodes: AppNode[]) =>
    nodes.some((node) => node.type === 'speaker');

const getGeneratorWaveShape = (nodes: AppNode[], id: string) =>
    nodes.find((node) => node.id === id && node.type === 'generator')?.data.waveShape ?? 'sine';

const volumePercentToDb = (volume: number) => {
    const nextVolume = clampVolumePercent(volume);

    if (nextVolume === 0) {
        return -Infinity;
    }

    return ((nextVolume - 1) / 99) * 36 - 30;
};

const createDefaultDrumPattern = (): DrumPattern => ({
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    hatOpen: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
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
    activeChordVoicings: Map<string, ActiveChordVoicing>;
    generatorNoteCounts: Map<string, Map<string, number>>;
    activeGenerators: Set<string>;
    activeDrumPads: Set<string>;
    adjacentNodeIds: Set<string>;
    autoEdgeIds: Set<string>;
    past: Array<{ nodes: AppNode[]; edges: Edge[] }>;
    future: Array<{ nodes: AppNode[]; edges: Edge[] }>;
    canUndo: boolean;
    canRedo: boolean;
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
    clearCanvas: () => void;
    loadCanvas: (data: { nodes: AppNode[]; edges: AppEdge[]; masterVolume?: number }) => void;
    recalculateAdjacency: () => void;
    autoWireAdjacentNodes: () => void;
    toggleNodeLock: (id: string) => void;
    saveSnapshot: () => void;
    undo: () => void;
    redo: () => void;
};

export const useStore = create<AppState>((set, get) => ({
    nodes: [],
    edges: [],
    audioNodes: new Map(),
    masterOutput: null,
    masterVolume: DEFAULT_MASTER_VOLUME,
    drumRacks: new Map(),
    patterns: new Map(),
    activeChordVoicings: new Map(),
    generatorNoteCounts: new Map(),
    activeGenerators: new Set(),
    activeDrumPads: new Set(),
    adjacentNodeIds: new Set(),
    autoEdgeIds: new Set(),
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    ensureMasterOutput: () => {
        const { masterOutput, masterVolume, nodes } = get();

        if (masterOutput) {
            // Update volume based on speaker presence when master output already exists
            const targetVolume = hasSpeakerNode(nodes) ? volumePercentToDb(masterVolume) : -Infinity;
            masterOutput.volume.rampTo(targetVolume, 0.1);
            return masterOutput;
        }

        const nextMasterOutput = new Tone.Volume(
            hasSpeakerNode(nodes) ? volumePercentToDb(masterVolume) : -Infinity
        ).toDestination();
        set({ masterOutput: nextMasterOutput });
        return nextMasterOutput;
    },

    setMasterVolume: (volume: number) => {
        const nextVolume = clampVolumePercent(volume);
        const masterOutput = get().ensureMasterOutput();
        const isSpeakerActive = hasSpeakerNode(get().nodes);
        masterOutput.volume.rampTo(isSpeakerActive ? volumePercentToDb(nextVolume) : -Infinity, 0.1);
        set({ masterVolume: nextVolume });
    },

    resetMasterVolume: () => {
        get().setMasterVolume(DEFAULT_MASTER_VOLUME);
    },

    onNodesChange: (changes: NodeChange[]) => {
        const { nodes } = get();

        // Find position changes that are drags
        const positionChanges = changes.filter(
            (c): c is { id: string; type: 'position'; position: { x: number; y: number }; dragging?: boolean } =>
                c.type === 'position' && !!c.dragging
        );

        if (positionChanges.length === 1) {
            const change = positionChanges[0];
            const draggedNode = nodes.find(n => n.id === change.id);

            if (draggedNode?.data.isLocked) {
                const currentPos = draggedNode.position;
                const nextPos = change.position;
                const dx = nextPos.x - currentPos.x;
                const dy = nextPos.y - currentPos.y;

                if (dx !== 0 || dy !== 0) {
                    // Find all nodes in the same locked cluster
                    const lockedCluster = new Set<string>();
                    const queue = [draggedNode.id];
                    lockedCluster.add(draggedNode.id);

                    while (queue.length > 0) {
                        const currentId = queue.shift()!;
                        const currentNode = nodes.find(n => n.id === currentId)!;
                        const curDims = getDims(currentNode.type);

                        nodes.forEach(n => {
                            if (n.data.isLocked && !lockedCluster.has(n.id)) {
                                const nDims = getDims(n.type);

                                // Distance check (same as recalculateAdjacency)
                                const gapRight = n.position.x - (currentNode.position.x + curDims.w);
                                const gapLeft = currentNode.position.x - (n.position.x + nDims.w);
                                const horizGap = Math.max(gapRight, gapLeft);

                                const curCentreY = currentNode.position.y + curDims.h / 2;
                                const nCentreY = n.position.y + nDims.h / 2;
                                const vertDist = Math.abs(curCentreY - nCentreY);

                                if (horizGap >= 0 && horizGap <= ADJ_TOUCH_THRESHOLD && vertDist <= ADJ_Y_THRESHOLD) {
                                    lockedCluster.add(n.id);
                                    queue.push(n.id);
                                }
                            }
                        });
                    }

                    if (lockedCluster.size > 1) {
                        // Apply movement to all nodes in cluster
                        const allNodes = get().nodes;
                        const nextNodes = allNodes.map(n => {
                            if (lockedCluster.has(n.id)) {
                                if (n.id === change.id) {
                                    return { ...n, position: change.position };
                                }
                                return {
                                    ...n,
                                    position: {
                                        x: n.position.x + dx,
                                        y: n.position.y + dy
                                    }
                                };
                            }
                            return n;
                        });
                        set({ nodes: nextNodes });
                        return;
                    }
                }
            }
        }

        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const currentEdges = get().edges;
        const nextEdges = stripLegacyTempoEdges(applyEdgeChanges(changes, currentEdges) as AppEdge[]);

        // Only snapshot for remove-type changes
        const hasRemoveChange = changes.some(change => change.type === 'remove');
        if (hasRemoveChange) {
            get().saveSnapshot();
        }

        set({ edges: nextEdges });
        get().autoWireAdjacentNodes();
    },

    onEdgeUpdateStart: () => { },

    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
        if (!get().isValidConnection(newConnection, oldEdge.id)) {
            return;
        }

        get().saveSnapshot();

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

    onEdgeUpdateEnd: () => { },

    onConnect: (connection: Connection) => {
        if (!get().isValidConnection(connection)) {
            return;
        }

        get().saveSnapshot();

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
            const waveShape = (subType as WaveShape) || getGeneratorWaveShape(get().nodes, id);
            if (waveShape === 'noise') {
                node = new Tone.Noise({ type: 'white' });
            } else {
                const generator = new Tone.PolySynth();
                generator.set({ oscillator: { type: waveShape } as never });
                node = generator;
            }
        } else if (type === 'drum') {
            const rack = createDrumRack();
            const nextDrumRacks = new Map(get().drumRacks);
            nextDrumRacks.set(id, rack);
            set({ drumRacks: nextDrumRacks });
            node = rack.output;
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
        } else if (type === 'unison') {
            node = new Tone.Chorus({ frequency: 3, delayTime: 2.5, depth: 0.7, wet: 0 }).start();
        } else if (type === 'detune') {
            node = new Tone.PitchShift({ pitch: 0, wet: 1 });
        } else if (type === 'visualiser') {
            node = new Tone.Gain(1); // passthrough — analysers are attached in the component
        } else if (type === 'controller' || type === 'tempo' || type === 'speaker' || type === 'chord' || type === 'adsr' || type === 'keys') {
            return;
        }

        if (node) {
            const newMap = new Map(get().audioNodes);
            newMap.set(id, node);
            set({ audioNodes: newMap });
        }
    },

    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => {
        get().saveSnapshot();

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
                    ? {
                        ...n,
                        data: {
                            ...n.data,
                            ...(mainType === 'generator' ? { waveShape: subType } : { subType }),
                            isPlaying: wasPlaying
                        }
                    }
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
        const {
            audioNodes,
            drumRacks,
            patterns,
            activeChordVoicings,
            generatorNoteCounts,
            activeGenerators,
            activeDrumPads,
        } = get();
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

        const nextChordVoicings = new Map(activeChordVoicings);
        [...nextChordVoicings.keys()]
            .filter((voicingKey) => voicingKey.startsWith(`${id}::`))
            .forEach((voicingKey) => nextChordVoicings.delete(voicingKey));

        const nextGeneratorNoteCounts = new Map(generatorNoteCounts);
        nextGeneratorNoteCounts.delete(id);

        const nextActiveGenerators = new Set(activeGenerators);
        nextActiveGenerators.delete(id);

        set({
            activeChordVoicings: nextChordVoicings,
            generatorNoteCounts: nextGeneratorNoteCounts,
            activeGenerators: nextActiveGenerators,
        });

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

        // Handle ADSR nodes (no audio node, just store parameters)
        if (targetNode?.type === 'adsr') {
            const nodes = get().nodes.map((n: AppNode) => {
                if (n.id === id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            ...(typeof value.attack === 'number' && { attack: value.attack }),
                            ...(typeof value.decay === 'number' && { decay: value.decay }),
                            ...(typeof value.sustain === 'number' && { sustain: value.sustain }),
                            ...(typeof value.release === 'number' && { release: value.release }),
                        }
                    };
                }
                return n;
            });
            set({ nodes });
            return;
        }

        const node = get().audioNodes.get(id);
        if (!node) return;

        if (value.waveShape) {
            const currentNode = get().nodes.find((n: AppNode) => n.id === id);
            const currentWaveShape = currentNode?.data.waveShape ?? 'sine';

            // Check if we're switching between noise and non-noise waveforms
            const isSwitchingToNoise = value.waveShape === 'noise' && currentWaveShape !== 'noise';
            const isSwitchingFromNoise = currentWaveShape === 'noise' && value.waveShape !== 'noise';

            if (isSwitchingToNoise || isSwitchingFromNoise) {
                // Switching between noise and oscillator types requires changeNodeSubType
                // changeNodeSubType will handle updating the node data, so return early
                get().changeNodeSubType(id, 'generator', value.waveShape);
                return;
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

        if (node instanceof Tone.PolySynth && typeof value.mix === 'number') {
            if (value.mix === 0) {
                node.volume.rampTo(-Infinity, 0.1);
            } else {
                const db = ((value.mix - 1) / 99) * 36 - 30;
                node.volume.rampTo(db, 0.1);
            }
        }

        // Handle noise mix - Tone.Noise has a volume property
        if (node instanceof Tone.Noise && typeof value.mix === 'number') {
            if (value.mix === 0) {
                node.volume.rampTo(-Infinity, 0.1);
            } else {
                const db = ((value.mix - 1) / 99) * 36 - 30;
                node.volume.rampTo(db, 0.1);
            }
        }

        // Handle drum mix - drum rack output is a Gain node
        if (node instanceof Tone.Gain && typeof value.mix === 'number') {
            const { drumRacks } = get();
            const isDrumOutput = Array.from(drumRacks.values()).some(rack => rack.output === node);

            if (isDrumOutput) {
                if (value.mix === 0) {
                    node.gain.rampTo(0, 0.1);
                } else {
                    node.gain.rampTo(value.mix / 100, 0.1);
                }
            }
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
        } else if (node instanceof Tone.Chorus) {
            if (typeof value.depth === 'number') node.depth = value.depth;
            if (typeof value.frequency === 'number') node.frequency.rampTo(value.frequency, 0.1);
            if (typeof value.wet === 'number') node.wet.rampTo(value.wet, 0.1);
        } else if (node instanceof Tone.PitchShift) {
            if (typeof value.pitch === 'number') node.pitch = value.pitch;
            if (typeof value.wet === 'number') node.wet.rampTo(value.wet, 0.1);
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
            const nextGeneratorNoteCounts = incrementGeneratorNoteCount(
                get().generatorNoteCounts,
                id,
                note
            );
            set({
                generatorNoteCounts: nextGeneratorNoteCounts,
                activeGenerators: new Set(nextGeneratorNoteCounts.keys()),
            });
        } else if (node instanceof Tone.Noise) {
            node.start();
            set({
                activeGenerators: new Set([...get().activeGenerators, id]),
            });
        }
    },

    triggerNoteOff: (id: string, note: string) => {
        const node = get().audioNodes.get(id);
        if (node instanceof Tone.PolySynth) {
            node.triggerRelease(note);
            const nextGeneratorNoteCounts = decrementGeneratorNoteCount(
                get().generatorNoteCounts,
                id,
                note
            );
            set({
                generatorNoteCounts: nextGeneratorNoteCounts,
                activeGenerators: new Set(nextGeneratorNoteCounts.keys()),
            });
        } else if (node instanceof Tone.Noise) {
            node.stop();
            const nextActiveGenerators = new Set(get().activeGenerators);
            nextActiveGenerators.delete(id);
            set({
                activeGenerators: nextActiveGenerators,
            });
        }
    },

    fireNoteOn: (controllerId: string, note: string) => {
        const { edges, nodes, audioNodes, activeChordVoicings, generatorNoteCounts } = get();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const nextChordVoicings = new Map(activeChordVoicings);

        // Apply ADSR envelopes to downstream generators before triggering notes
        applyAdsrEnvelopes(controllerId, nodesById, edges, audioNodes);

        const dispatches = collectNoteDispatches(
            controllerId,
            note,
            nodesById,
            edges,
            nextChordVoicings,
            true
        );

        let nextGeneratorNoteCounts = generatorNoteCounts;
        dispatches.forEach(({ generatorId, note: voicedNote }) => {
            const targetNode = audioNodes.get(generatorId);
            if (targetNode instanceof Tone.PolySynth) {
                targetNode.triggerAttack(voicedNote);
                nextGeneratorNoteCounts = incrementGeneratorNoteCount(
                    nextGeneratorNoteCounts,
                    generatorId,
                    voicedNote
                );
            } else if (targetNode instanceof Tone.Noise) {
                // Only start if not already active to avoid "Start time must be strictly greater than previous start time" error
                if (!get().activeGenerators.has(generatorId)) {
                    targetNode.start();
                }
                // For noise, we don't track note counts since noise has no pitch
                // Just add to active generators for UI feedback
                const nextActiveGenerators = new Set(get().activeGenerators);
                nextActiveGenerators.add(generatorId);
                set({ activeGenerators: nextActiveGenerators });
            }
        });

        set({
            activeChordVoicings: nextChordVoicings,
            generatorNoteCounts: nextGeneratorNoteCounts,
            activeGenerators: new Set(nextGeneratorNoteCounts.keys()),
        });
    },

    fireNoteOff: (controllerId: string, note: string) => {
        const { edges, nodes, audioNodes, activeChordVoicings, generatorNoteCounts } = get();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const nextChordVoicings = new Map(activeChordVoicings);
        const dispatches = collectNoteDispatches(
            controllerId,
            note,
            nodesById,
            edges,
            nextChordVoicings,
            false
        );

        let nextGeneratorNoteCounts = generatorNoteCounts;
        dispatches.forEach(({ generatorId, note: voicedNote }) => {
            const targetNode = audioNodes.get(generatorId);
            if (targetNode instanceof Tone.PolySynth) {
                targetNode.triggerRelease(voicedNote);
                nextGeneratorNoteCounts = decrementGeneratorNoteCount(
                    nextGeneratorNoteCounts,
                    generatorId,
                    voicedNote
                );
            } else if (targetNode instanceof Tone.Noise) {
                targetNode.stop();
                // Remove from active generators for UI feedback
                const nextActiveGenerators = new Set(get().activeGenerators);
                nextActiveGenerators.delete(generatorId);
                set({ activeGenerators: nextActiveGenerators });
            }
        });

        set({
            activeChordVoicings: nextChordVoicings,
            generatorNoteCounts: nextGeneratorNoteCounts,
            activeGenerators: new Set(nextGeneratorNoteCounts.keys()),
        });
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
        get().saveSnapshot();

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
                    : node.type === 'chord'
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                label: node.data.label || 'Chord',
                                subType: node.data.subType ?? DEFAULT_CHORD_QUALITY,
                            },
                        }
                        : node.type === 'generator'
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    label: node.data.label || 'Oscillator',
                                    waveShape: node.data.waveShape ?? 'sine',
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

        if (nextNode.type === 'generator') {
            get().initAudioNode(nextNode.id, nextNode.type, nextNode.data.waveShape);
        } else if (nextNode.data.subType && nextNode.data.subType !== 'none') {
            get().initAudioNode(nextNode.id, nextNode.type, nextNode.data.subType);
        } else if (nextNode.type === 'drum' || nextNode.type === 'unison' || nextNode.type === 'detune' || nextNode.type === 'visualiser') {
            get().initAudioNode(nextNode.id, nextNode.type);
        }

        get().rebuildAudioGraph();
    },

    removeNodeAndCleanUp: (id: string) => {
        get().saveSnapshot();

        const { nodes, edges } = get();
        const removedNode = nodes.find((node: AppNode) => node.id === id);

        if (removedNode?.type === 'chord') {
            const { audioNodes, activeChordVoicings, generatorNoteCounts } = get();
            const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
            const nextChordVoicings = new Map(activeChordVoicings);
            let nextGeneratorNoteCounts = generatorNoteCounts;

            [...activeChordVoicings.entries()]
                .filter(([voicingKey]) => voicingKey.startsWith(`${id}::`))
                .forEach(([voicingKey, voicing]) => {
                    for (let iteration = 0; iteration < voicing.count; iteration++) {
                        voicing.notes.forEach((voicedNote) => {
                            const dispatches = collectNoteDispatches(
                                id,
                                voicedNote,
                                nodesById,
                                edges,
                                nextChordVoicings,
                                false
                            );

                            dispatches.forEach(({ generatorId, note }) => {
                                const targetNode = audioNodes.get(generatorId);
                                if (targetNode instanceof Tone.PolySynth) {
                                    targetNode.triggerRelease(note);
                                    nextGeneratorNoteCounts = decrementGeneratorNoteCount(
                                        nextGeneratorNoteCounts,
                                        generatorId,
                                        note
                                    );
                                }
                            });
                        });
                    }

                    nextChordVoicings.delete(voicingKey);
                });

            set({
                activeChordVoicings: nextChordVoicings,
                generatorNoteCounts: nextGeneratorNoteCounts,
                activeGenerators: new Set(nextGeneratorNoteCounts.keys()),
            });
        }

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
                    sourceInfo.type === 'chord' ||
                    sourceInfo.type === 'tempo' ||
                    sourceInfo.type === 'speaker' ||
                    targetInfo.type === 'controller' ||
                    targetInfo.type === 'chord' ||
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

        // Only connect audio nodes to master output if speaker node is present
        if (hasSpeakerNode(nodes)) {
            audioNodes.forEach((audioNode: Tone.ToneAudioNode, id: string) => {
                const nodeInfo = nodesById.get(id);

                if (
                    !nodeInfo ||
                    nodeInfo.type === 'controller' ||
                    nodeInfo.type === 'chord' ||
                    nodeInfo.type === 'tempo' ||
                    nodeInfo.type === 'speaker' ||
                    routedSourceIds.has(id)
                ) {
                    return;
                }

                audioNode.connect(masterOutput);
            });
        }
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
            } else if (node.type === 'drum' || node.type === 'unison' || node.type === 'detune' || node.type === 'visualiser') {
                get().initAudioNode(node.id, node.type);
            }
        });
        get().rebuildAudioGraph();
    },

    clearCanvas: () => {
        const { nodes, audioNodes, drumRacks, patterns, masterOutput } = get();

        // Stop and dispose all patterns (arpeggiators etc.)
        patterns.forEach((pattern) => {
            pattern.stop().dispose();
        });

        // Dispose all drum racks
        drumRacks.forEach((rack) => {
            rack.loop?.dispose();
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hatClosed.disconnect().dispose();
            rack.hatOpen.disconnect().dispose();
        });

        // Dispose all audio nodes
        audioNodes.forEach((node) => {
            node.disconnect().dispose();
        });

        // Dispose master output
        if (masterOutput) {
            masterOutput.disconnect().dispose();
        }

        set({
            nodes: [],
            edges: [],
            audioNodes: new Map(),
            drumRacks: new Map(),
            patterns: new Map(),
            activeChordVoicings: new Map(),
            generatorNoteCounts: new Map(),
            activeGenerators: new Set(),
            activeDrumPads: new Set(),
            adjacentNodeIds: new Set(),
            autoEdgeIds: new Set(),
            masterOutput: null,
        });
    },

    loadCanvas: (data) => {
        get().saveSnapshot();
        get().clearCanvas();

        const { nodes, edges, masterVolume } = data;

        set({
            nodes: nodes || [],
            edges: edges || [],
            masterVolume: masterVolume ?? DEFAULT_MASTER_VOLUME,
        });

        // Apply master volume if speaker exists
        if (hasSpeakerNode(nodes)) {
            get().setMasterVolume(masterVolume ?? DEFAULT_MASTER_VOLUME);
        }

        // Reinitialize all audio nodes
        nodes.forEach((node) => {
            if (node.type === 'generator') {
                get().initAudioNode(node.id, node.type, node.data.waveShape);
            } else if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (node.type === 'drum' || node.type === 'unison' || node.type === 'detune' || node.type === 'visualiser') {
                get().initAudioNode(node.id, node.type);
            }

            // For tempo nodes, ensure global transport is synced
            if (node.type === 'tempo' && node.data.bpm) {
                Tone.getTransport().bpm.rampTo(node.data.bpm, 0.1);
            }
        });

        get().rebuildAudioGraph();
        get().recalculateAdjacency();
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
                if (a.type === 'tempo' || b.type === 'tempo' || a.type === 'speaker' || b.type === 'speaker') {
                    continue;
                }
                const aDims = getDims(a.type);
                const bDims = getDims(b.type);

                const gapRight = b.position.x - (a.position.x + aDims.w);
                const gapLeft = a.position.x - (b.position.x + bDims.w);
                const horizGap = Math.max(gapRight, gapLeft);

                const aCentreY = a.position.y + aDims.h / 2;
                const bCentreY = b.position.y + bDims.h / 2;
                const vertDist = Math.abs(aCentreY - bCentreY);

                if (horizGap < 0 || horizGap > ADJ_TOUCH_THRESHOLD || vertDist > ADJ_Y_THRESHOLD) {
                    continue;
                }

                // Determine source/target by signal flow order
                const leftNode = a.position.x <= b.position.x ? a : b;
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
                if (a.type === 'tempo' || b.type === 'tempo' || a.type === 'speaker' || b.type === 'speaker') {
                    continue;
                }
                const aDims = getDims(a.type);
                const bDims = getDims(b.type);

                const gapRight = b.position.x - (a.position.x + aDims.w);
                const gapLeft = a.position.x - (b.position.x + bDims.w);
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

    toggleNodeLock: (id: string) => {
        const { nodes } = get();
        const startNode = nodes.find(n => n.id === id);
        if (!startNode) return;

        const nextLocked = !startNode.data.isLocked;

        // Find all nodes in the same snapped cluster
        const clusterIds = new Set<string>();
        const queue = [id];
        clusterIds.add(id);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const currentNode = nodes.find(n => n.id === currentId);
            if (!currentNode) continue;

            const cDims = getDims(currentNode.type);

            for (const other of nodes) {
                if (clusterIds.has(other.id)) continue;
                if (other.type === 'tempo' || other.type === 'speaker') continue;

                const oDims = getDims(other.type);
                const gapRight = other.position.x - (currentNode.position.x + cDims.w);
                const gapLeft = currentNode.position.x - (other.position.x + oDims.w);
                const horizGap = Math.max(gapRight, gapLeft);

                const cCentreY = currentNode.position.y + cDims.h / 2;
                const oCentreY = other.position.y + oDims.h / 2;
                const vertDist = Math.abs(cCentreY - oCentreY);

                if (horizGap >= 0 && horizGap <= ADJ_TOUCH_THRESHOLD && vertDist <= ADJ_Y_THRESHOLD) {
                    clusterIds.add(other.id);
                    queue.push(other.id);
                }
            }
        }

        set({
            nodes: nodes.map(node => {
                if (!clusterIds.has(node.id)) return node;

                const { entryId, exitId } = getClusterBoundaries(clusterIds, nodes);

                return {
                    ...node,
                    data: {
                        ...node.data,
                        isLocked: nextLocked,
                        isEntry: nextLocked ? node.id === entryId : undefined,
                        isExit: nextLocked ? node.id === exitId : undefined,
                    }
                };
            }),
            edges: get().edges.map(edge => {
                // If both source and target are in the same locked cluster, hide the edge
                if (nextLocked && clusterIds.has(edge.source) && clusterIds.has(edge.target)) {
                    return { ...edge, hidden: true };
                }
                // If unlocking, show manual edges again (auto-edges stay hidden anyway)
                if (!nextLocked && clusterIds.has(edge.source) && clusterIds.has(edge.target)) {
                    const isAuto = edge.id.startsWith(AUTO_EDGE_PREFIX) || get().autoEdgeIds.has(edge.id);
                    return { ...edge, hidden: isAuto };
                }
                return edge;
            })
        });
    },

    saveSnapshot: () => {
        const { nodes, edges, past } = get();
        const snapshot = { nodes: [...nodes], edges: [...edges] };
        const nextPast = [...past.slice(-49), snapshot]; // Keep last 50 entries
        set({
            past: nextPast,
            future: [],
            canUndo: nextPast.length > 0,
            canRedo: false,
        });
    },

    undo: () => {
        const { past, future, nodes, edges } = get();
        if (past.length === 0) return;

        const currentSnapshot = { nodes: [...nodes], edges: [...edges] };
        const previousSnapshot = past[past.length - 1];

        if (!previousSnapshot) return;

        // Push current state to future
        const nextFuture = [...future, currentSnapshot];
        const nextPast = past.slice(0, -1);

        // Restore previous state
        set({
            nodes: previousSnapshot.nodes,
            edges: previousSnapshot.edges,
            past: nextPast,
            future: nextFuture,
            canUndo: nextPast.length > 0,
            canRedo: true,
        });

        // Re-sync audio: dispose all current audio nodes, then reinitialize
        const { audioNodes, drumRacks, patterns } = get();

        // Dispose all audio nodes
        audioNodes.forEach((node) => {
            node.disconnect().dispose();
        });

        // Dispose all drum racks
        drumRacks.forEach((rack) => {
            rack.loop?.dispose();
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hatClosed.disconnect().dispose();
            rack.hatOpen.disconnect().dispose();
        });

        // Dispose all patterns
        patterns.forEach((pattern) => {
            pattern.stop().dispose();
        });

        // Clear audio state
        set({
            audioNodes: new Map(),
            drumRacks: new Map(),
            patterns: new Map(),
            activeChordVoicings: new Map(),
            generatorNoteCounts: new Map(),
            activeGenerators: new Set(),
            activeDrumPads: new Set(),
        });

        // Reinitialize audio nodes for restored state
        previousSnapshot.nodes.forEach((node) => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (node.type === 'drum') {
                get().initAudioNode(node.id, node.type);
            }
        });

        // Rebuild audio graph and recalculate adjacency
        get().rebuildAudioGraph();
        get().recalculateAdjacency();
    },

    redo: () => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;

        const currentSnapshot = { nodes: [...nodes], edges: [...edges] };
        const nextSnapshot = future[future.length - 1];

        if (!nextSnapshot) return;

        // Push current state to past
        const nextPast = [...past, currentSnapshot].slice(-50); // Keep last 50 entries
        const nextFuture = future.slice(0, -1);

        // Restore next state
        set({
            nodes: nextSnapshot.nodes,
            edges: nextSnapshot.edges,
            past: nextPast,
            future: nextFuture,
            canUndo: true,
            canRedo: nextFuture.length > 0,
        });

        // Re-sync audio: dispose all current audio nodes, then reinitialize
        const { audioNodes, drumRacks, patterns } = get();

        // Dispose all audio nodes
        audioNodes.forEach((node) => {
            node.disconnect().dispose();
        });

        // Dispose all drum racks
        drumRacks.forEach((rack) => {
            rack.loop?.dispose();
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hatClosed.disconnect().dispose();
            rack.hatOpen.disconnect().dispose();
        });

        // Dispose all patterns
        patterns.forEach((pattern) => {
            pattern.stop().dispose();
        });

        // Clear audio state
        set({
            audioNodes: new Map(),
            drumRacks: new Map(),
            patterns: new Map(),
            activeChordVoicings: new Map(),
            generatorNoteCounts: new Map(),
            activeGenerators: new Set(),
            activeDrumPads: new Set(),
        });

        // Reinitialize audio nodes for restored state
        nextSnapshot.nodes.forEach((node) => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (node.type === 'drum') {
                get().initAudioNode(node.id, node.type);
            }
        });

        // Rebuild audio graph and recalculate adjacency
        get().rebuildAudioGraph();
        get().recalculateAdjacency();
    },
}));
