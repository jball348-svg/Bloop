import { create } from 'zustand';
import * as Tone from 'tone';
import { Midi, Note, Scale } from '@tonaljs/tonal';
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
export const AUDIO_INPUT_SECONDARY_HANDLE_ID = 'audio-in-secondary';
export const AUDIO_OUTPUT_HANDLE_ID = 'audio-out';
export const TEMPO_INPUT_HANDLE_ID = 'tempo-in';
export const TEMPO_OUTPUT_HANDLE_ID = 'tempo-out';
export const CONTROL_INPUT_HANDLE_ID = 'control-in';
export const CONTROL_OUTPUT_HANDLE_ID = 'control-out';
export const AUDIO_SIGNAL_COLOR = '#22d3ee';
export const CONTROL_SIGNAL_COLOR = '#39ff14';
export const DRUM_PARTS = ['kick', 'snare', 'hatClosed', 'hatOpen'] as const;
export const DRUM_STEP_COUNT = 16;
export const TRANSPORT_RATE_OPTIONS = [
    { value: '1n', label: '1/1' },
    { value: '2n', label: '1/2' },
    { value: '4n', label: '1/4' },
    { value: '8n', label: '1/8' },
    { value: '16n', label: '1/16' },
] as const;
export const TONAL_SCALE_OPTIONS = [
    'major',
    'minor',
    'dorian',
    'phrygian',
    'lydian',
    'mixolydian',
    'locrian',
    'major pentatonic',
    'minor pentatonic',
    'blues',
    'chromatic',
] as const;
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

export type TransportRate = (typeof TRANSPORT_RATE_OPTIONS)[number]['value'];
export type AudioNodeType =
    | 'generator'
    | 'sampler'
    | 'audioin'
    | 'effect'
    | 'speaker'
    | 'controller'
    | 'midiin'
    | 'tempo'
    | 'drum'
    | 'advanceddrum'
    | 'chord'
    | 'adsr'
    | 'keys'
    | 'unison'
    | 'detune'
    | 'visualiser'
    | 'pulse'
    | 'stepsequencer'
    | 'quantizer'
    | 'moodpad';
export type ConnectionKind = 'audio' | 'tempo' | 'control';
export type WaveShape = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';
export type DrumMode = 'hits' | 'grid';
export type DrumPart = (typeof DRUM_PARTS)[number];
export type DrumPattern = Record<DrumPart, boolean[]>;
export type SequencerStep = {
    enabled: boolean;
    note: string;
    gate: number;
};
export type AdvancedDrumTrackData = {
    label: string;
    steps: number[];
    length: number;
    sampleName?: string;
    sampleDataUrl?: string;
};
export type AppEdgeData = {
    kind?: ConnectionKind;
    originalSource?: string;
    originalTarget?: string;
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
type SamplerChain = {
    player: Tone.Player;
    pitchShift: Tone.PitchShift;
    previewTimeout: ReturnType<typeof setTimeout> | null;
};
type AudioInputChain = {
    input: Tone.UserMedia;
    gain: Tone.Volume;
    meter: Tone.Meter;
};
type AdvancedDrumRack = {
    output: Tone.Gain;
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hat: Tone.MetalSynth;
    clap: Tone.NoiseSynth;
    players: Map<number, Tone.Player>;
    loop: Tone.Loop | null;
    step: number;
};
type ActiveChordVoicing = {
    notes: string[];
    count: number;
};
type ActiveQuantizedNote = {
    note: string;
    count: number;
};
type NodeValueUpdate = {
    waveShape?: WaveShape;
    volume?: number;
    inputGain?: number;
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
    packedName?: string;
};

export type SignalFlowEvent = {
    id: string;
    edgeId: string;
    kind: ConnectionKind;
    color?: string;
    createdAt: number;
    durationMs: number;
};

export type AppNode = Node & {
    data: {
        label: string;
        subType?: string;
        midiDeviceId?: string;
        midiDeviceName?: string;
        midiSupported?: boolean;
        audioInStatus?: 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';
        inputGain?: number;
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
        isPacked?: boolean;
        packedName?: string;
        isPackedVisible?: boolean;
        packGroupId?: string;
        pulseSync?: boolean;
        pulseRate?: TransportRate;
        pulseIntervalMs?: number;
        pulseNote?: string;
        stepSequence?: SequencerStep[];
        selectedStep?: number;
        sequenceSync?: boolean;
        sequenceRate?: TransportRate;
        sequenceIntervalMs?: number;
        bypass?: boolean;
        moodX?: number;
        moodY?: number;
        hasSample?: boolean;
        sampleName?: string;
        sampleDataUrl?: string;
        sampleWaveform?: number[];
        loop?: boolean;
        playbackRate?: number;
        reverse?: boolean;
        pitchShift?: number;
        advancedDrumTracks?: AdvancedDrumTrackData[];
        swing?: number;
        visualiserMode?: 'waveform' | 'spectrum' | 'vu' | 'lissajous';
    };
    type: AudioNodeType;
};

type NoteDispatch = {
    generatorId: string;
    note: string;
};

type RecordingController = {
    recorder: MediaRecorder;
    destination: MediaStreamAudioDestinationNode;
    startedAt: number;
    mimeType: string;
    chunks: BlobPart[];
    timerId: number | ReturnType<typeof setInterval> | null;
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

const getQuantizedNoteKey = (quantizerId: string, sourceNote: string) =>
    `${quantizerId}::${sourceNote}`;

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

export const quantizeNote = (
    note: string,
    root = 'C',
    scaleType = 'major'
) => {
    const sourceMidi = Midi.toMidi(note);
    if (sourceMidi === null) {
        return note;
    }

    const scaleNotes = Scale.get(`${root} ${scaleType}`).notes;
    if (scaleNotes.length === 0) {
        return note;
    }

    const sourceOctave = Math.floor(sourceMidi / 12) - 1;
    let bestMidi: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let octave = sourceOctave - 1; octave <= sourceOctave + 1; octave += 1) {
        scaleNotes.forEach((scaleNote) => {
            const candidateMidi = Midi.toMidi(`${scaleNote}${octave}`);
            if (candidateMidi === null) {
                return;
            }

            const distance = Math.abs(candidateMidi - sourceMidi);
            if (
                distance < bestDistance ||
                (distance === bestDistance && (bestMidi === null || candidateMidi < bestMidi))
            ) {
                bestMidi = candidateMidi;
                bestDistance = distance;
            }
        });
    }

    return bestMidi === null
        ? note
        : Midi.midiToNoteName(bestMidi, { sharps: true });
};

const rememberQuantizedNote = (
    quantizedNotes: Map<string, ActiveQuantizedNote>,
    quantizerId: string,
    sourceNote: string,
    nextNote: string
) => {
    const quantizedKey = getQuantizedNoteKey(quantizerId, sourceNote);
    const existingNote = quantizedNotes.get(quantizedKey);

    if (existingNote) {
        quantizedNotes.set(quantizedKey, {
            ...existingNote,
            count: existingNote.count + 1,
        });
        return existingNote.note;
    }

    quantizedNotes.set(quantizedKey, {
        note: nextNote,
        count: 1,
    });
    return nextNote;
};

const consumeQuantizedNote = (
    quantizedNotes: Map<string, ActiveQuantizedNote>,
    quantizerId: string,
    sourceNote: string,
    fallbackNote: string
) => {
    const quantizedKey = getQuantizedNoteKey(quantizerId, sourceNote);
    const existingNote = quantizedNotes.get(quantizedKey);

    if (!existingNote) {
        return fallbackNote;
    }

    if (existingNote.count <= 1) {
        quantizedNotes.delete(quantizedKey);
    } else {
        quantizedNotes.set(quantizedKey, {
            ...existingNote,
            count: existingNote.count - 1,
        });
    }

    return existingNote.note;
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
    quantizedNotes: Map<string, ActiveQuantizedNote>,
    rememberVoicings: boolean,
    visited = new Set<string>()
): NoteDispatch[] => {
    const dispatches: NoteDispatch[] = [];

    edges
        .filter((edge) => isControlEdge(edge) && edge.source === sourceId)
        .forEach((edge) => {
            const actualTargetId = edge.data?.originalTarget || edge.target;
            const targetNode = nodesById.get(actualTargetId);

            if (!targetNode) {
                return;
            }

            if (targetNode.type === 'generator' || targetNode.type === 'sampler') {
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
                        quantizedNotes,
                        rememberVoicings,
                        visited
                    )
                );
                return;
            }

            if (targetNode.type === 'quantizer') {
                const visitKey = `${sourceId}->${targetNode.id}:${note}`;
                if (visited.has(visitKey)) {
                    return;
                }

                const nextVisited = new Set(visited);
                nextVisited.add(visitKey);

                const quantized = quantizeNote(
                    note,
                    targetNode.data.rootNote ?? 'C',
                    targetNode.data.scaleType ?? 'major'
                );
                const nextNote = targetNode.data.bypass
                    ? note
                    : rememberVoicings
                        ? rememberQuantizedNote(quantizedNotes, targetNode.id, note, quantized)
                        : consumeQuantizedNote(quantizedNotes, targetNode.id, note, quantized);

                dispatches.push(
                    ...collectNoteDispatches(
                        targetNode.id,
                        nextNote,
                        nodesById,
                        edges,
                        chordVoicings,
                        quantizedNotes,
                        rememberVoicings,
                        nextVisited
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
                        quantizedNotes,
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
            .filter((edge) => isControlEdge(edge) && edge.source === currentId)
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
            .filter((edge) => isControlEdge(edge) && edge.source === currentId)
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
                } else if (targetNode.type === 'drum') {
                    const rack = useStore.getState().drumRacks.get(targetNode.id);
                    if (rack) {
                        rack.kick.set({ envelope: { attack, decay, sustain, release } });
                        rack.snare.set({ envelope: { attack, decay, sustain, release } });
                        rack.hatClosed.set({ envelope: { attack, decay, release } });
                        rack.hatOpen.set({ envelope: { attack, decay, release } });
                    }
                } else {
                    // Continue traversing for other node types
                    findDownstreamGenerators(targetNode.id);
                }
            });
    };

    findDownstreamGenerators(adsrId);
};

// Rendered pixel widths/heights per node type (must stay in sync with Tailwind classes)
// GeneratorNode uses w-60 = 240px; most others use w-56 = 224px
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    keys: { w: 288, h: 320 },
    midiin: { w: 256, h: 240 },
    moodpad: { w: 320, h: 416 },
    pulse: { w: 288, h: 280 },
    stepsequencer: { w: 352, h: 420 },
    chord: { w: 224, h: 240 },
    quantizer: { w: 240, h: 272 },
    adsr: { w: 224, h: 340 },
    generator: { w: 240, h: 220 },
    sampler: { w: 320, h: 432 },
    audioin: { w: 256, h: 272 },
    drum: { w: 320, h: 360 },
    advanceddrum: { w: 432, h: 420 },
    effect: { w: 224, h: 260 },
    unison: { w: 224, h: 220 },
    detune: { w: 224, h: 200 },
    visualiser: { w: 288, h: 320 },
    speaker: { w: 224, h: 200 },
    tempo: { w: 256, h: 240 },
};
const DEFAULT_DIMS = { w: 224, h: 220 };
const getDims = (type: string) => NODE_DIMS[type] ?? DEFAULT_DIMS;

// Cluster / Locking Helpers
export const getNodeAdjacencyAxis = (
    typeA: AudioNodeType,
    typeB: AudioNodeType
): 'horizontal' | 'vertical' | null => {
    const ab = `${typeA}->${typeB}`;
    const ba = `${typeB}->${typeA}`;
    if (CONTROL_WIRE_PAIRS.has(ab) || CONTROL_WIRE_PAIRS.has(ba)) return 'horizontal';
    if (VALID_AUTO_WIRE_PAIRS.has(ab) || VALID_AUTO_WIRE_PAIRS.has(ba)) return 'vertical';
    return null;
};

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
            const axis = getNodeAdjacencyAxis(currentNode.type, other.type);

            if (axis === 'horizontal') {
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
            } else if (axis === 'vertical') {
                const oDims = getDims(other.type);
                const gapBelow = other.position.y - (currentNode.position.y + cDims.h);
                const gapAbove = currentNode.position.y - (other.position.y + oDims.h);
                const vGap = Math.max(gapBelow, gapAbove);

                const cCentreX = currentNode.position.x + cDims.w / 2;
                const oCentreX = other.position.x + oDims.w / 2;
                const hDist = Math.abs(cCentreX - oCentreX);

                if (vGap >= 0 && vGap <= ADJ_VERT_THRESHOLD && hDist <= ADJ_X_THRESHOLD) {
                    clusterIds.add(other.id);
                    queue.push(other.id);
                }
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
export const ADJ_TOUCH_THRESHOLD = 48;
// Y-centres must be within this many px of each other to count as adjacent
export const ADJ_Y_THRESHOLD = 100;
export const ADJ_VERT_THRESHOLD = 48;  // max vertical gap between stacked audio nodes (px)
export const ADJ_X_THRESHOLD = 100;    // max horizontal centre misalignment for vertical snapping (px)

const AUTO_EDGE_PREFIX = 'auto-';
const DRUM_PAD_HIGHLIGHT_MS = 120;
const drumPadTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const signalFlowTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
let recordingController: RecordingController | null = null;
let onboardingIntroSynth: Tone.PolySynth | null = null;
let onboardingIntroTimeout: ReturnType<typeof setTimeout> | null = null;

const SIGNAL_ORDER: Record<AudioNodeType, number> = {
    tempo: -1,
    controller: 0,
    keys: 0,
    midiin: 0,
    moodpad: 0,
    pulse: 0,
    stepsequencer: 0.25,
    chord: 0.5,
    quantizer: 0.65,
    adsr: 0.75,
    generator: 1,
    sampler: 1,
    audioin: 1,
    drum: 1,
    advanceddrum: 1,
    unison: 1.5,
    detune: 1.5,
    effect: 2,
    visualiser: 2.5,
    speaker: 3,
};

const CONTROL_DOMAIN_TYPES = new Set<AudioNodeType>(['controller', 'keys', 'midiin', 'moodpad', 'pulse', 'stepsequencer', 'chord', 'quantizer', 'adsr']);

export const isControlDomainNodeType = (type?: AudioNodeType | string | null) =>
    Boolean(type) && CONTROL_DOMAIN_TYPES.has(type as AudioNodeType);

export const getAdjacencyGlowClasses = (type?: AudioNodeType | string | null) =>
    isControlDomainNodeType(type)
        ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-[#39ff14] shadow-[0_0_24px_rgba(57,255,20,0.25)]'
        : ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]';

const CONTROL_INPUT_TYPES = new Set<AudioNodeType>(['controller', 'keys', 'stepsequencer', 'chord', 'quantizer', 'adsr', 'generator', 'sampler', 'drum', 'advanceddrum']);
const CONTROL_OUTPUT_TYPES = new Set<AudioNodeType>(['controller', 'keys', 'midiin', 'moodpad', 'pulse', 'stepsequencer', 'chord', 'quantizer', 'adsr']);
const AUDIO_INPUT_TYPES = new Set<AudioNodeType>(['effect', 'unison', 'detune', 'visualiser', 'speaker']);
const AUDIO_OUTPUT_TYPES = new Set<AudioNodeType>(['generator', 'sampler', 'audioin', 'drum', 'advanceddrum', 'effect', 'unison', 'detune', 'visualiser']);

const getClusterSignalEntry = (clusterIds: Set<string>, nodes: AppNode[], kind: ConnectionKind): string | null => {
    const clusterNodes = nodes.filter(n => clusterIds.has(n.id));
    const validTypes = kind === 'control' ? CONTROL_INPUT_TYPES : AUDIO_INPUT_TYPES;
    const candidates = clusterNodes.filter(n => validTypes.has(n.type));
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => (SIGNAL_ORDER[a.type] ?? 99) < (SIGNAL_ORDER[b.type] ?? 99) ? a : b).id;
};

const getClusterSignalExit = (clusterIds: Set<string>, nodes: AppNode[], kind: ConnectionKind): string | null => {
    const clusterNodes = nodes.filter(n => clusterIds.has(n.id));
    const validTypes = kind === 'control' ? CONTROL_OUTPUT_TYPES : AUDIO_OUTPUT_TYPES;
    const candidates = clusterNodes.filter(n => validTypes.has(n.type));
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => (SIGNAL_ORDER[a.type] ?? -1) > (SIGNAL_ORDER[b.type] ?? -1) ? a : b).id;
};

export const VALID_AUTO_WIRE_PAIRS = new Set([
    'controller->quantizer',
    'controller->sampler',
    'midiin->quantizer',
    'midiin->sampler',
    'keys->quantizer',
    'keys->sampler',
    'moodpad->quantizer',
    'moodpad->chord',
    'moodpad->adsr',
    'moodpad->generator',
    'moodpad->sampler',
    'pulse->quantizer',
    'pulse->chord',
    'pulse->adsr',
    'pulse->stepsequencer',
    'pulse->generator',
    'pulse->sampler',
    'pulse->advanceddrum',
    'controller->chord',
    'controller->adsr',
    'controller->generator',
    'midiin->chord',
    'midiin->adsr',
    'midiin->generator',
    'keys->chord',
    'keys->adsr',
    'keys->generator',
    'keys->drum',
    'midiin->drum',
    'chord->sampler',
    'quantizer->chord',
    'quantizer->adsr',
    'quantizer->generator',
    'quantizer->sampler',
    'chord->adsr',
    'chord->generator',
    'adsr->sampler',
    'adsr->chord',
    'adsr->generator',
    'adsr->drum',
    'stepsequencer->quantizer',
    'stepsequencer->chord',
    'stepsequencer->adsr',
    'stepsequencer->generator',
    'stepsequencer->sampler',
    'audioin->unison',
    'audioin->detune',
    'audioin->effect',
    'audioin->visualiser',
    'generator->unison',
    'sampler->unison',
    'generator->detune',
    'sampler->detune',
    'drum->unison',
    'advanceddrum->unison',
    'drum->detune',
    'advanceddrum->detune',
    'unison->effect',
    'detune->effect',
    'unison->unison',
    'unison->detune',
    'detune->unison',
    'detune->detune',
    'generator->effect',
    'sampler->effect',
    'drum->effect',
    'advanceddrum->effect',
    'effect->effect',
    'effect->unison',
    'effect->detune',
    'generator->visualiser',
    'sampler->visualiser',
    'drum->visualiser',
    'advanceddrum->visualiser',
    'effect->visualiser',
    'unison->visualiser',
    'detune->visualiser',
    'visualiser->effect',
    'visualiser->unison',
    'visualiser->detune',
    'visualiser->visualiser',
]);

export const CONTROL_WIRE_PAIRS = new Set([
    'controller->quantizer',
    'controller->sampler',
    'midiin->quantizer',
    'midiin->sampler',
    'keys->quantizer',
    'keys->sampler',
    'moodpad->quantizer',
    'moodpad->chord',
    'moodpad->adsr',
    'moodpad->generator',
    'moodpad->sampler',
    'pulse->quantizer',
    'pulse->chord',
    'pulse->adsr',
    'pulse->stepsequencer',
    'pulse->generator',
    'pulse->sampler',
    'pulse->advanceddrum',
    'controller->chord',
    'controller->adsr',
    'controller->generator',
    'midiin->chord',
    'midiin->adsr',
    'midiin->generator',
    'keys->chord',
    'keys->adsr',
    'keys->generator',
    'keys->drum',
    'midiin->drum',
    'chord->sampler',
    'quantizer->chord',
    'quantizer->adsr',
    'quantizer->generator',
    'quantizer->sampler',
    'chord->adsr',
    'chord->generator',
    'adsr->sampler',
    'adsr->chord',
    'adsr->generator',
    'adsr->drum',
    'stepsequencer->quantizer',
    'stepsequencer->chord',
    'stepsequencer->adsr',
    'stepsequencer->generator',
    'stepsequencer->sampler',
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

const DEFAULT_PULSE_NOTE = 'C4';

const createDefaultDrumPattern = (): DrumPattern => ({
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    hatOpen: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
});

export const createDefaultStepSequence = (): SequencerStep[] => {
    const notes = ['C4', 'D4', 'E4', 'G4'];

    return Array.from({ length: 16 }, (_, index) => ({
        enabled: index < notes.length,
        note: notes[index % notes.length] ?? DEFAULT_PULSE_NOTE,
        gate: 60,
    }));
};

const getLoopIntervalSeconds = (sync: boolean, rate: TransportRate, intervalMs: number) =>
    sync ? rate : Math.max(intervalMs, 50) / 1000;

export const createDefaultAdvancedDrumTracks = (): AdvancedDrumTrackData[] => [
    {
        label: 'Kick',
        length: 16,
        steps: [3, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0],
    },
    {
        label: 'Snare',
        length: 16,
        steps: [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
    },
    {
        label: 'Hat',
        length: 12,
        steps: [2, 0, 2, 0, 2, 1, 2, 0, 2, 0, 2, 1, 2, 0, 2, 0],
    },
    {
        label: 'Clap',
        length: 8,
        steps: [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0],
    },
];

const velocityToGain = (velocity: number) => {
    if (velocity <= 0) {
        return 0;
    }

    if (velocity === 1) {
        return 0.45;
    }

    if (velocity === 2) {
        return 0.72;
    }

    return 1;
};

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

const createAdvancedDrumRack = (): AdvancedDrumRack => {
    const output = new Tone.Gain(0.9);
    const kick = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 8,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
    }).connect(output);
    const snare = new Tone.NoiseSynth({
        noise: { type: 'white', playbackRate: 1.6 },
        envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    }).connect(output);
    const hat = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 26,
        resonance: 3200,
        octaves: 1.5,
        envelope: { attack: 0.001, decay: 0.08, release: 0.03 },
    }).connect(output);
    hat.frequency.value = 260;
    const clap = new Tone.NoiseSynth({
        noise: { type: 'pink', playbackRate: 1.2 },
        envelope: { attack: 0.001, decay: 0.22, sustain: 0 },
    }).connect(output);

    return {
        output,
        kick,
        snare,
        hat,
        clap,
        players: new Map(),
        loop: null,
        step: 0,
    };
};

export const isTempoEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'tempo' ||
    edge.sourceHandle === TEMPO_OUTPUT_HANDLE_ID ||
    edge.targetHandle === TEMPO_INPUT_HANDLE_ID;

export const isControlEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'control' ||
    edge.sourceHandle === CONTROL_OUTPUT_HANDLE_ID ||
    edge.targetHandle === CONTROL_INPUT_HANDLE_ID;

export const isAudioEdge = (edge: Edge<AppEdgeData>) => !isTempoEdge(edge) && !isControlEdge(edge);

const stripLegacyTempoEdges = (edges: AppEdge[]) =>
    edges.filter((edge) => !isTempoEdge(edge));

const isValidGraphConnection = (
    connection: Connection,
    nodes: AppNode[],
    edges: Edge<AppEdgeData>[],
    ignoredEdgeId?: string
) => {
    // Basic sanity
    if (!connection.source || !connection.target || connection.source === connection.target) {
        return false;
    }

    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) {
        return false;
    }

    // Singletons cannot be wired
    if (sourceNode.type === 'speaker' || targetNode.type === 'speaker') {
        return false;
    }
    if (sourceNode.type === 'tempo' || targetNode.type === 'tempo') {
        return false;
    }

    // Strict domain matching — control-out MUST connect to control-in, audio-out MUST connect to audio-in
    const isControlConn = connection.sourceHandle === CONTROL_OUTPUT_HANDLE_ID && connection.targetHandle === CONTROL_INPUT_HANDLE_ID;
    const isAudioConn =
        connection.sourceHandle === AUDIO_OUTPUT_HANDLE_ID &&
        (connection.targetHandle === AUDIO_INPUT_HANDLE_ID ||
            connection.targetHandle === AUDIO_INPUT_SECONDARY_HANDLE_ID);

    if (!isControlConn && !isAudioConn) {
        return false; // Cross-domain attempt: reject
    }

    // Semantic node-type check (musical sense)
    const pairKey = `${sourceNode.type}->${targetNode.type}`;
    if (!VALID_AUTO_WIRE_PAIRS.has(pairKey)) {
        return false;
    }

    // Duplicate prevention
    return !edges.some((edge) =>
        edge.id !== ignoredEdgeId &&
        !edge.id.startsWith(AUTO_EDGE_PREFIX) &&
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
    );
};

const getConnectionKind = (
    connection: {
        sourceHandle?: string | null;
        targetHandle?: string | null;
    }
): ConnectionKind | null => {
    if (connection.sourceHandle === CONTROL_OUTPUT_HANDLE_ID) return 'control';
    if (connection.sourceHandle === AUDIO_OUTPUT_HANDLE_ID) return 'audio';
    return null;
};

const getEdgePresentation = (kind: ConnectionKind) => {
    if (kind === 'control') {
        return {
            style: {
                stroke: CONTROL_SIGNAL_COLOR,
                strokeWidth: 2,
                strokeDasharray: '6 4',
                filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.6))',
            },
            data: { kind },
        };
    }
    // Audio — existing cyan style
    return {
        style: {
            stroke: AUDIO_SIGNAL_COLOR,
            strokeWidth: 2.5,
            filter: `drop-shadow(0 0 6px ${AUDIO_SIGNAL_COLOR})`,
        },
        data: { kind },
    };
};

const collectReachableEdgeIds = (
    sourceId: string,
    kind: ConnectionKind,
    edges: AppEdge[],
    visited = new Set<string>()
): string[] => {
    const nextEdgeIds: string[] = [];

    edges
        .filter((edge) => edge.source === sourceId)
        .filter((edge) =>
            kind === 'control'
                ? isControlEdge(edge)
                : kind === 'audio'
                    ? isAudioEdge(edge)
                    : isTempoEdge(edge)
        )
        .forEach((edge) => {
            const visitKey = `${edge.id}:${sourceId}:${kind}`;
            if (visited.has(visitKey)) {
                return;
            }

            const nextVisited = new Set(visited);
            nextVisited.add(visitKey);

            if (!edge.hidden) {
                nextEdgeIds.push(edge.id);
            }

            nextEdgeIds.push(...collectReachableEdgeIds(edge.target, kind, edges, nextVisited));
        });

    return nextEdgeIds;
};

type AppState = {
    nodes: AppNode[];
    edges: AppEdge[];
    audioNodes: Map<string, Tone.ToneAudioNode>;
    masterOutput: Tone.Volume | null;
    masterVolume: number;
    audioInputChains: Map<string, AudioInputChain>;
    drumRacks: Map<string, DrumRack>;
    samplerChains: Map<string, SamplerChain>;
    advancedDrumRacks: Map<string, AdvancedDrumRack>;
    patterns: Map<string, DisposablePattern>;
    activeChordVoicings: Map<string, ActiveChordVoicing>;
    activeQuantizedNotes: Map<string, ActiveQuantizedNote>;
    generatorNoteCounts: Map<string, Map<string, number>>;
    activeGenerators: Set<string>;
    activeDrumPads: Set<string>;
    adjacentNodeIds: Set<string>;
    autoEdgeIds: Set<string>;
    signalFlowVisible: boolean;
    signalFlowEvents: SignalFlowEvent[];
    isRecording: boolean;
    recordingElapsedMs: number;
    recordingMimeType: string | null;
    recordingError: string | null;
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
    openAudioInput: (id: string) => Promise<void>;
    closeAudioInput: (id: string) => void;
    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => void;
    removeAudioNode: (id: string) => void;
    updateNodeValue: (id: string, value: NodeValueUpdate) => void;
    updateNodeData: (id: string, data: Partial<AppNode['data']>) => void;
    updateSequencerStep: (id: string, stepIndex: number, step: Partial<SequencerStep>) => void;
    updateTempoBpm: (id: string, bpm: number) => void;
    updateArpScale: (id: string, root: string, scale: string) => void;
    updateOctave: (id: string, octave: number) => void;
    loadSample: (
        nodeId: string,
        audioBuffer: AudioBuffer,
        options?: { sampleName?: string; sampleDataUrl?: string; waveform?: number[] }
    ) => void;
    updateSamplerSettings: (
        id: string,
        settings: Partial<Pick<AppNode['data'], 'loop' | 'playbackRate' | 'reverse' | 'pitchShift'>>
    ) => void;
    loadAdvancedDrumTrackSample: (
        nodeId: string,
        trackIndex: number,
        audioBuffer: AudioBuffer,
        options?: { sampleName?: string; sampleDataUrl?: string }
    ) => void;
    setDrumMode: (id: string, mode: DrumMode) => void;
    toggleDrumStep: (id: string, part: DrumPart, step: number) => void;
    triggerDrumHit: (id: string, part: DrumPart, time?: number | string) => void;
    triggerNoteOn: (id: string, note: string, velocity?: number) => void;
    triggerNoteOff: (id: string, note: string) => void;
    firePulse: (pulseId: string, intervalMs?: number) => void;
    advanceSequencerStep: (id: string, intervalMs?: number) => void;
    advanceAdvancedDrumStep: (id: string, time?: number) => void;
    toggleSignalFlow: () => void;
    setSignalFlowVisible: (visible: boolean) => void;
    emitSignalFlow: (sourceId: string, kind: ConnectionKind, color?: string) => void;
    clearSignalFlowEvent: (eventId: string) => void;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    playOnboardingIntro: () => void;
    stopOnboardingIntro: () => void;
    fireNoteOn: (controllerId: string, note: string, velocity?: number) => void;
    fireNoteOff: (controllerId: string, note: string) => void;
    packGroup: (id: string) => void;
    unpackGroup: (id: string) => void;
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
    audioInputChains: new Map(),
    drumRacks: new Map(),
    samplerChains: new Map(),
    advancedDrumRacks: new Map(),
    patterns: new Map(),
    activeChordVoicings: new Map(),
    activeQuantizedNotes: new Map(),
    generatorNoteCounts: new Map(),
    activeGenerators: new Set(),
    activeDrumPads: new Set(),
    adjacentNodeIds: new Set(),
    autoEdgeIds: new Set(),
    signalFlowVisible: false,
    signalFlowEvents: [],
    isRecording: false,
    recordingElapsedMs: 0,
    recordingMimeType: null,
    recordingError: null,
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
                                const axis = getNodeAdjacencyAxis(currentNode.type, n.type);
                                const nDims = getDims(n.type);

                                if (axis === 'horizontal') {
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
                                } else if (axis === 'vertical') {
                                    const gapBelow = n.position.y - (currentNode.position.y + curDims.h);
                                    const gapAbove = currentNode.position.y - (n.position.y + nDims.h);
                                    const vGap = Math.max(gapBelow, gapAbove);

                                    const cCentreX = currentNode.position.x + curDims.w / 2;
                                    const nCentreX = n.position.x + nDims.w / 2;
                                    const hDist = Math.abs(cCentreX - nCentreX);

                                    if (vGap >= 0 && vGap <= ADJ_VERT_THRESHOLD && hDist <= ADJ_X_THRESHOLD) {
                                        lockedCluster.add(n.id);
                                        queue.push(n.id);
                                    }
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

        const kind = getConnectionKind(newConnection);
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

        const { nodes, edges } = get();
        const kind = getConnectionKind(connection);
        if (!kind) {
            return;
        }

        let originalSource: string | undefined;
        let originalTarget: string | undefined;

        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        if (sourceNode?.data.isPacked) {
            const clusterIds = new Set(nodes.filter(n => n.data.packGroupId === sourceNode.data.packGroupId).map(n => n.id));
            originalSource = getClusterSignalExit(clusterIds, nodes, kind) || undefined;
        }

        if (targetNode?.data.isPacked) {
            const clusterIds = new Set(nodes.filter(n => n.data.packGroupId === targetNode.data.packGroupId).map(n => n.id));
            originalTarget = getClusterSignalEntry(clusterIds, nodes, kind) || undefined;
        }

        set({
            edges: addEdge({
                ...connection,
                ...getEdgePresentation(kind),
                data: {
                    kind,
                    originalSource,
                    originalTarget,
                },
            }, edges),
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
        } else if (type === 'sampler') {
            const player = new Tone.Player({ autostart: false, loop: false, playbackRate: 1, reverse: false });
            const pitchShift = new Tone.PitchShift({ pitch: 0, wet: 1 });
            player.connect(pitchShift);

            const nextSamplerChains = new Map(get().samplerChains);
            nextSamplerChains.set(id, {
                player,
                pitchShift,
                previewTimeout: null,
            });
            set({ samplerChains: nextSamplerChains });
            node = pitchShift;
        } else if (type === 'audioin') {
            const input = new Tone.UserMedia();
            const gain = new Tone.Volume(
                volumePercentToDb(get().nodes.find((entry: AppNode) => entry.id === id)?.data.inputGain ?? 75)
            );
            const meter = new Tone.Meter({ normalRange: true, smoothing: 0.82 });
            input.connect(gain);
            gain.connect(meter);

            const nextAudioInputChains = new Map(get().audioInputChains);
            nextAudioInputChains.set(id, {
                input,
                gain,
                meter,
            });
            set({ audioInputChains: nextAudioInputChains });
            node = gain;
        } else if (type === 'drum') {
            const rack = createDrumRack();
            const nextDrumRacks = new Map(get().drumRacks);
            nextDrumRacks.set(id, rack);
            set({ drumRacks: nextDrumRacks });
            node = rack.output;
        } else if (type === 'advanceddrum') {
            const rack = createAdvancedDrumRack();
            const nextAdvancedDrumRacks = new Map(get().advancedDrumRacks);
            nextAdvancedDrumRacks.set(id, rack);
            set({ advancedDrumRacks: nextAdvancedDrumRacks });
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
        } else if (
            type === 'controller' ||
            type === 'midiin' ||
            type === 'tempo' ||
            type === 'speaker' ||
            type === 'chord' ||
            type === 'adsr' ||
            type === 'keys' ||
            type === 'moodpad' ||
            type === 'pulse' ||
            type === 'stepsequencer' ||
            type === 'quantizer'
        ) {
            return;
        }

        if (node) {
            const newMap = new Map(get().audioNodes);
            newMap.set(id, node);
            set({ audioNodes: newMap });
        }
    },

    openAudioInput: async (id: string) => {
        const node = get().nodes.find((entry: AppNode) => entry.id === id && entry.type === 'audioin');
        const chain = get().audioInputChains.get(id);
        if (!node || !chain) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            get().updateNodeData(id, { audioInStatus: 'unsupported' });
            return;
        }

        if (node.data.audioInStatus === 'active') {
            return;
        }

        get().updateNodeData(id, { audioInStatus: 'requesting' });

        try {
            await Tone.start();
            await chain.input.open();
            chain.gain.volume.rampTo(volumePercentToDb(node.data.inputGain ?? 75), 0.1);
            get().updateNodeData(id, { audioInStatus: 'active' });
        } catch (error) {
            const nextStatus =
                error instanceof DOMException && error.name === 'NotAllowedError'
                    ? 'denied'
                    : 'error';
            console.error('Failed to open audio input', error);
            get().updateNodeData(id, { audioInStatus: nextStatus });
        }
    },

    closeAudioInput: (id: string) => {
        const chain = get().audioInputChains.get(id);
        if (!chain) {
            return;
        }

        try {
            chain.input.close();
        } catch (error) {
            console.error('Failed to close audio input', error);
        }

        get().updateNodeData(id, { audioInStatus: 'idle' });
    },

    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => {
        get().saveSnapshot();

        const { audioNodes, patterns, nodes, edges, generatorNoteCounts, activeGenerators } = get();
        const wasPlaying = nodes.find((n: AppNode) => n.id === id)?.data.isPlaying || false;

        const oldNode = audioNodes.get(id);
        const oldPattern = patterns.get(id);

        if (mainType === 'generator') {
            const nextGeneratorNoteCounts = new Map(generatorNoteCounts);
            const nextActiveGenerators = new Set(activeGenerators);

            if (oldNode instanceof Tone.PolySynth) {
                const heldNotes = [...(nextGeneratorNoteCounts.get(id)?.keys() ?? [])];
                heldNotes.forEach((note) => oldNode.triggerRelease(note));
            } else if (oldNode instanceof Tone.Noise) {
                try {
                    oldNode.stop();
                } catch {
                    // Tone.Noise may already be stopped when rapidly swapping wave shapes.
                }
            }

            nextGeneratorNoteCounts.delete(id);
            nextActiveGenerators.delete(id);
            set({
                generatorNoteCounts: nextGeneratorNoteCounts,
                activeGenerators: nextActiveGenerators,
            });
        }

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
            audioInputChains,
            drumRacks,
            samplerChains,
            advancedDrumRacks,
            patterns,
            activeChordVoicings,
            activeQuantizedNotes,
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

        const samplerChain = samplerChains.get(id);
        if (samplerChain) {
            if (samplerChain.previewTimeout) {
                clearTimeout(samplerChain.previewTimeout);
            }
            try {
                samplerChain.player.stop();
            } catch {
                // Ignore redundant stop calls when sampler preview is already idle.
            }
            samplerChain.player.disconnect().dispose();

            const nextSamplerChains = new Map(samplerChains);
            nextSamplerChains.delete(id);
            set({ samplerChains: nextSamplerChains });
        }

        const audioInputChain = audioInputChains.get(id);
        if (audioInputChain) {
            try {
                audioInputChain.input.close();
            } catch {
                // Ignore close failures during node removal.
            }
            audioInputChain.input.disconnect();
            audioInputChain.input.dispose();
            audioInputChain.meter.disconnect();
            audioInputChain.meter.dispose();

            const nextAudioInputChains = new Map(audioInputChains);
            nextAudioInputChains.delete(id);
            set({ audioInputChains: nextAudioInputChains });
        }

        const advancedRack = advancedDrumRacks.get(id);
        if (advancedRack) {
            advancedRack.loop?.dispose();
            advancedRack.players.forEach((player) => {
                try {
                    player.stop();
                } catch {
                    // Ignore redundant stop calls when deleting the drum machine.
                }
                player.disconnect().dispose();
            });
            advancedRack.kick.disconnect().dispose();
            advancedRack.snare.disconnect().dispose();
            advancedRack.hat.disconnect().dispose();
            advancedRack.clap.disconnect().dispose();

            const nextAdvancedDrumRacks = new Map(advancedDrumRacks);
            nextAdvancedDrumRacks.delete(id);
            set({ advancedDrumRacks: nextAdvancedDrumRacks });
        }

        const nextChordVoicings = new Map(activeChordVoicings);
        [...nextChordVoicings.keys()]
            .filter((voicingKey) => voicingKey.startsWith(`${id}::`))
            .forEach((voicingKey) => nextChordVoicings.delete(voicingKey));

        const nextQuantizedNotes = new Map(activeQuantizedNotes);
        [...nextQuantizedNotes.keys()]
            .filter((quantizedKey) => quantizedKey.startsWith(`${id}::`))
            .forEach((quantizedKey) => nextQuantizedNotes.delete(quantizedKey));

        const nextGeneratorNoteCounts = new Map(generatorNoteCounts);
        nextGeneratorNoteCounts.delete(id);

        const nextActiveGenerators = new Set(activeGenerators);
        nextActiveGenerators.delete(id);

        set({
            activeChordVoicings: nextChordVoicings,
            activeQuantizedNotes: nextQuantizedNotes,
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
        if (typeof value.packedName === 'string') {
            set({
                nodes: get().nodes.map((node: AppNode) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, packedName: value.packedName } }
                        : node
                ),
            });
        }

        if (targetNode?.type === 'speaker' && typeof value.volume === 'number') {
            get().setMasterVolume(value.volume);
            return;
        }

        if (targetNode?.type === 'audioin' && typeof value.inputGain === 'number') {
            const nextInputGain = clampVolumePercent(value.inputGain);
            const inputNode = get().audioNodes.get(id);
            if (inputNode instanceof Tone.Volume) {
                inputNode.volume.rampTo(volumePercentToDb(nextInputGain), 0.1);
            }
            set({
                nodes: get().nodes.map((node: AppNode) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, inputGain: nextInputGain } }
                        : node
                ),
            });
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
            const { drumRacks, advancedDrumRacks } = get();
            const isDrumOutput =
                Array.from(drumRacks.values()).some(rack => rack.output === node) ||
                Array.from(advancedDrumRacks.values()).some(rack => rack.output === node);

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

    updateNodeData: (id: string, data: Partial<AppNode['data']>) => {
        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            ...data,
                        },
                    }
                    : node
            ),
        });
    },

    updateSequencerStep: (id: string, stepIndex: number, step: Partial<SequencerStep>) => {
        set({
            nodes: get().nodes.map((node: AppNode) => {
                if (node.id !== id || node.type !== 'stepsequencer') {
                    return node;
                }

                const stepSequence = [...(node.data.stepSequence ?? createDefaultStepSequence())];
                const currentStep = stepSequence[stepIndex];
                if (!currentStep) {
                    return node;
                }

                stepSequence[stepIndex] = {
                    ...currentStep,
                    ...step,
                };

                return {
                    ...node,
                    data: {
                        ...node.data,
                        stepSequence,
                    },
                };
            }),
        });
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

    loadSample: (nodeId: string, audioBuffer: AudioBuffer, options) => {
        const chain = get().samplerChains.get(nodeId);
        if (!chain) {
            return;
        }

        chain.player.buffer = new Tone.ToneAudioBuffer(audioBuffer);

        const currentNode = get().nodes.find((node: AppNode) => node.id === nodeId);
        chain.player.loop = currentNode?.data.loop ?? false;
        chain.player.reverse = currentNode?.data.reverse ?? false;
        chain.player.playbackRate = currentNode?.data.playbackRate ?? 1;
        chain.pitchShift.pitch = currentNode?.data.pitchShift ?? 0;

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            hasSample: true,
                            sampleName: options?.sampleName ?? node.data.sampleName ?? 'Loaded Sample',
                            sampleDataUrl: options?.sampleDataUrl ?? node.data.sampleDataUrl,
                            sampleWaveform: options?.waveform ?? node.data.sampleWaveform ?? [],
                        },
                    }
                    : node
            ),
        });
    },

    updateSamplerSettings: (id: string, settings) => {
        const chain = get().samplerChains.get(id);
        if (!chain) {
            return;
        }

        if (typeof settings.loop === 'boolean') {
            chain.player.loop = settings.loop;
        }
        if (typeof settings.playbackRate === 'number') {
            chain.player.playbackRate = settings.playbackRate;
        }
        if (typeof settings.reverse === 'boolean') {
            chain.player.reverse = settings.reverse;
        }
        if (typeof settings.pitchShift === 'number') {
            chain.pitchShift.pitch = settings.pitchShift;
        }

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            ...(typeof settings.loop === 'boolean' ? { loop: settings.loop } : {}),
                            ...(typeof settings.playbackRate === 'number' ? { playbackRate: settings.playbackRate } : {}),
                            ...(typeof settings.reverse === 'boolean' ? { reverse: settings.reverse } : {}),
                            ...(typeof settings.pitchShift === 'number' ? { pitchShift: settings.pitchShift } : {}),
                        },
                    }
                    : node
            ),
        });
    },

    loadAdvancedDrumTrackSample: (nodeId: string, trackIndex: number, audioBuffer: AudioBuffer, options) => {
        const rack = get().advancedDrumRacks.get(nodeId);
        if (!rack) {
            return;
        }

        const existingPlayer = rack.players.get(trackIndex);
        if (existingPlayer) {
            try {
                existingPlayer.stop();
            } catch {
                // Ignore redundant stop calls when replacing a track sample.
            }
            existingPlayer.disconnect().dispose();
        }

        const player = new Tone.Player({ autostart: false, loop: false, playbackRate: 1, reverse: false }).connect(rack.output);
        player.buffer = new Tone.ToneAudioBuffer(audioBuffer);
        rack.players.set(trackIndex, player);

        set({
            nodes: get().nodes.map((node: AppNode) => {
                if (node.id !== nodeId || node.type !== 'advanceddrum') {
                    return node;
                }

                const tracks = [...(node.data.advancedDrumTracks ?? createDefaultAdvancedDrumTracks())];
                const currentTrack = tracks[trackIndex];
                if (!currentTrack) {
                    return node;
                }

                tracks[trackIndex] = {
                    ...currentTrack,
                    sampleName: options?.sampleName ?? currentTrack.sampleName ?? `Track ${trackIndex + 1}`,
                    sampleDataUrl: options?.sampleDataUrl ?? currentTrack.sampleDataUrl,
                };

                return {
                    ...node,
                    data: {
                        ...node.data,
                        advancedDrumTracks: tracks,
                    },
                };
            }),
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

        get().emitSignalFlow(id, 'audio');

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

    triggerNoteOn: (id: string, note: string, velocity = 1) => {
        const samplerChain = get().samplerChains.get(id);
        if (samplerChain?.player.loaded) {
            try {
                samplerChain.player.stop();
            } catch {
                // Ignore redundant stop calls when retriggering the sampler.
            }
            samplerChain.player.start();
            set({
                activeGenerators: new Set([...get().activeGenerators, id]),
            });
            get().emitSignalFlow(id, 'audio');
            return;
        }

        const node = get().audioNodes.get(id);
        if (node instanceof Tone.PolySynth) {
            node.triggerAttack(note, undefined, Math.max(0.001, Math.min(1, velocity)));
            const nextGeneratorNoteCounts = incrementGeneratorNoteCount(
                get().generatorNoteCounts,
                id,
                note
            );
            set({
                generatorNoteCounts: nextGeneratorNoteCounts,
                activeGenerators: new Set(nextGeneratorNoteCounts.keys()),
            });
            get().emitSignalFlow(id, 'audio');
        } else if (node instanceof Tone.Noise) {
            node.start();
            set({
                activeGenerators: new Set([...get().activeGenerators, id]),
            });
            get().emitSignalFlow(id, 'audio');
        }
    },

    triggerNoteOff: (id: string, note: string) => {
        const samplerChain = get().samplerChains.get(id);
        if (samplerChain?.player.loaded) {
            if (samplerChain.player.loop) {
                samplerChain.player.stop();
            }
            const nextActiveGenerators = new Set(get().activeGenerators);
            nextActiveGenerators.delete(id);
            set({
                activeGenerators: nextActiveGenerators,
            });
            return;
        }

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

    clearSignalFlowEvent: (eventId: string) => {
        const timeoutId = signalFlowTimeouts.get(eventId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            signalFlowTimeouts.delete(eventId);
        }

        set({
            signalFlowEvents: get().signalFlowEvents.filter((event) => event.id !== eventId),
        });
    },

    setSignalFlowVisible: (visible: boolean) => {
        if (!visible) {
            signalFlowTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
            signalFlowTimeouts.clear();
        }

        set({
            signalFlowVisible: visible,
            signalFlowEvents: visible ? get().signalFlowEvents : [],
        });
    },

    toggleSignalFlow: () => {
        get().setSignalFlowVisible(!get().signalFlowVisible);
    },

    emitSignalFlow: (sourceId: string, kind: ConnectionKind, color?: string) => {
        if (!get().signalFlowVisible) {
            return;
        }

        const edgeIds = collectReachableEdgeIds(sourceId, kind, get().edges);
        if (edgeIds.length === 0) {
            return;
        }

        const now = performance.now();
        const nextEvents = edgeIds.map((edgeId) => {
            const eventId = `${edgeId}-${now}-${Math.random().toString(16).slice(2)}`;
            const event: SignalFlowEvent = {
                id: eventId,
                edgeId,
                kind,
                color,
                createdAt: now,
                durationMs: kind === 'audio' ? 900 : 700,
            };

            signalFlowTimeouts.set(
                eventId,
                setTimeout(() => {
                    get().clearSignalFlowEvent(eventId);
                }, event.durationMs)
            );

            return event;
        });

        set({
            signalFlowEvents: [...get().signalFlowEvents, ...nextEvents],
        });
    },

    startRecording: async () => {
        if (get().isRecording) {
            return;
        }

        if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
            set({
                recordingError: 'Recording is not supported in this browser.',
                recordingMimeType: null,
            });
            return;
        }

        const preferredMimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'video/webm;codecs=opus',
            'video/webm',
        ];
        const mimeType =
            preferredMimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? '';

        try {
            await Tone.start();
            const masterOutput = get().ensureMasterOutput();
            const rawContext = Tone.getContext().rawContext as AudioContext;
            const destination = rawContext.createMediaStreamDestination();
            masterOutput.connect(destination);

            const recorder = mimeType
                ? new MediaRecorder(destination.stream, { mimeType })
                : new MediaRecorder(destination.stream);
            const chunks: BlobPart[] = [];
            const startedAt = performance.now();
            const timerId = window.setInterval(() => {
                set({ recordingElapsedMs: performance.now() - startedAt });
            }, 200);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                if (recordingController?.timerId) {
                    window.clearInterval(recordingController.timerId);
                }

                const finishedController = recordingController;
                recordingController = null;

                const recordingBlob = new Blob(
                    chunks,
                    {
                        type:
                            finishedController?.mimeType ||
                            recorder.mimeType ||
                            'audio/webm',
                    }
                );
                const extension = (finishedController?.mimeType || recorder.mimeType).includes('mp4')
                    ? 'm4a'
                    : 'webm';
                const url = URL.createObjectURL(recordingBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `bloop-recording-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.${extension}`;
                link.click();
                URL.revokeObjectURL(url);

                set({
                    isRecording: false,
                    recordingElapsedMs: 0,
                    recordingMimeType: null,
                    recordingError: null,
                });
                get().rebuildAudioGraph();
            };

            recorder.start();
            recordingController = {
                recorder,
                destination,
                startedAt,
                mimeType: mimeType || recorder.mimeType || 'audio/webm',
                chunks,
                timerId,
            };
            set({
                isRecording: true,
                recordingElapsedMs: 0,
                recordingMimeType: mimeType || recorder.mimeType || 'audio/webm',
                recordingError: null,
            });
        } catch (error) {
            console.error('Failed to start recording', error);
            set({
                isRecording: false,
                recordingElapsedMs: 0,
                recordingMimeType: null,
                recordingError: 'Could not start recording.',
            });
        }
    },

    stopRecording: async () => {
        if (!recordingController) {
            return;
        }

        if (recordingController.timerId) {
            window.clearInterval(recordingController.timerId);
            recordingController.timerId = null;
        }

        set({
            recordingElapsedMs: performance.now() - recordingController.startedAt,
        });

        if (recordingController.recorder.state !== 'inactive') {
            recordingController.recorder.stop();
        }
    },

    playOnboardingIntro: () => {
        get().stopOnboardingIntro();

        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.02,
                decay: 0.2,
                sustain: 0.35,
                release: 0.8,
            },
            volume: -14,
        }).connect(get().ensureMasterOutput());
        const now = Tone.now() + 0.05;
        const notes = [
            { note: 'C4', offset: 0, duration: '8n', velocity: 0.38 },
            { note: 'E4', offset: 0.22, duration: '8n', velocity: 0.32 },
            { note: 'G4', offset: 0.48, duration: '8n', velocity: 0.34 },
            { note: 'A4', offset: 0.78, duration: '4n', velocity: 0.3 },
            { note: 'G4', offset: 1.25, duration: '8n', velocity: 0.24 },
            { note: 'E4', offset: 1.52, duration: '4n', velocity: 0.2 },
        ];

        notes.forEach(({ note, offset, duration, velocity }) => {
            synth.triggerAttackRelease(note, duration, now + offset, velocity);
        });

        onboardingIntroSynth = synth;
        onboardingIntroTimeout = setTimeout(() => {
            get().stopOnboardingIntro();
        }, 3200);
    },

    stopOnboardingIntro: () => {
        if (onboardingIntroTimeout) {
            clearTimeout(onboardingIntroTimeout);
            onboardingIntroTimeout = null;
        }

        if (onboardingIntroSynth) {
            onboardingIntroSynth.disconnect().dispose();
            onboardingIntroSynth = null;
        }
    },

    firePulse: (pulseId: string, intervalMs = 125) => {
        const { edges, nodes } = get();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const pulseNode = nodesById.get(pulseId);
        if (!pulseNode) {
            return;
        }

        const note = pulseNode.data.pulseNote ?? DEFAULT_PULSE_NOTE;
        const gateDuration = Math.min(Math.max(intervalMs * 0.4, 80), 240);

        get().fireNoteOn(pulseId, note);
        window.setTimeout(() => {
            get().fireNoteOff(pulseId, note);
        }, gateDuration);

        edges
            .filter((edge) => isControlEdge(edge) && edge.source === pulseId)
            .forEach((edge) => {
                const targetId = edge.data?.originalTarget || edge.target;
                const targetNode = nodesById.get(targetId);
                if (!targetNode) {
                    return;
                }

                if (targetNode.type === 'stepsequencer') {
                    get().advanceSequencerStep(targetNode.id, intervalMs);
                }

                if (targetNode.type === 'advanceddrum') {
                    get().advanceAdvancedDrumStep(targetNode.id);
                }
            });
    },

    advanceAdvancedDrumStep: (id: string, time?: number) => {
        const rack = get().advancedDrumRacks.get(id);
        const currentNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'advanceddrum');
        if (!rack || !currentNode) {
            return;
        }

        const tracks: AdvancedDrumTrackData[] =
            currentNode.data.advancedDrumTracks ?? createDefaultAdvancedDrumTracks();
        const nextStep = ((currentNode.data.currentStep ?? -1) + 1) % DRUM_STEP_COUNT;
        const swing = currentNode.data.swing ?? 0;
        const baseTime = typeof time === 'number' ? time : Tone.now();
        let firedTrack = false;

        tracks.forEach((track, trackIndex) => {
            const trackLength = Math.max(1, Math.min(DRUM_STEP_COUNT, track.length));
            const velocity = track.steps[nextStep % trackLength] ?? 0;
            if (velocity <= 0) {
                return;
            }

            const scheduledTime =
                baseTime +
                (nextStep % 2 === 1 ? Tone.Time('16n').toSeconds() * 0.5 * swing : 0);
            const gain = velocityToGain(velocity);
            const customPlayer = rack.players.get(trackIndex);

            if (customPlayer?.loaded) {
                customPlayer.volume.value = Tone.gainToDb(Math.max(gain, 0.001));
                customPlayer.start(scheduledTime);
            } else if (trackIndex === 0) {
                rack.kick.triggerAttackRelease('C1', '8n', scheduledTime, gain);
            } else if (trackIndex === 1) {
                rack.snare.triggerAttackRelease('16n', scheduledTime, gain);
            } else if (trackIndex === 2) {
                rack.hat.triggerAttackRelease('C6', '32n', scheduledTime, gain);
            } else {
                rack.clap.triggerAttackRelease('16n', scheduledTime, gain);
            }

            firedTrack = true;
        });

        if (firedTrack) {
            get().emitSignalFlow(id, 'audio');
        }

        rack.step = nextStep;

        const updateStep = () => {
            set({
                nodes: get().nodes.map((node: AppNode) =>
                    node.id === id
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                currentStep: nextStep,
                            },
                        }
                        : node
                ),
            });
        };

        if (typeof time === 'number') {
            Tone.getDraw().schedule(updateStep, time);
        } else {
            updateStep();
        }
    },

    advanceSequencerStep: (id: string, intervalMs = 250) => {
        const currentNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'stepsequencer');
        if (!currentNode) {
            return;
        }

        const stepSequence = currentNode.data.stepSequence ?? createDefaultStepSequence();
        if (stepSequence.length === 0) {
            return;
        }

        const nextStepIndex = ((currentNode.data.currentStep ?? -1) + 1) % stepSequence.length;
        const nextStep = stepSequence[nextStepIndex];

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            currentStep: nextStepIndex,
                        },
                    }
                    : node
            ),
        });

        if (!nextStep?.enabled) {
            return;
        }

        get().fireNoteOn(id, nextStep.note);
        const gateDuration = Math.max(60, intervalMs * (nextStep.gate / 100));
        window.setTimeout(() => {
            get().fireNoteOff(id, nextStep.note);
        }, gateDuration);
    },

    fireNoteOn: (controllerId: string, note: string, velocity = 1) => {
        const { edges, nodes, audioNodes, activeChordVoicings, activeQuantizedNotes, generatorNoteCounts, activeGenerators } = get();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const nextChordVoicings = new Map(activeChordVoicings);
        const nextQuantizedNotes = new Map(activeQuantizedNotes);
        const sourceNode = nodesById.get(controllerId);
        const controlColor = sourceNode?.data.isPackedVisible ? '#d946ef' : undefined;

        get().emitSignalFlow(controllerId, 'control', controlColor);

        // Apply ADSR envelopes to downstream generators before triggering notes
        applyAdsrEnvelopes(controllerId, nodesById, edges, audioNodes);

        const dispatches = collectNoteDispatches(
            controllerId,
            note,
            nodesById,
            edges,
            nextChordVoicings,
            nextQuantizedNotes,
            true
        );

        let nextGeneratorNoteCounts = generatorNoteCounts;
        const nextActiveGenerators = new Set(activeGenerators);
        dispatches.forEach(({ generatorId, note: voicedNote }) => {
            const samplerChain = get().samplerChains.get(generatorId);
            if (samplerChain?.player.loaded) {
                try {
                    samplerChain.player.stop();
                } catch {
                    // Ignore redundant stop calls when retriggering the sampler.
                }
                samplerChain.player.start();
                nextActiveGenerators.add(generatorId);
                get().emitSignalFlow(generatorId, 'audio');
                return;
            }

            const targetNode = audioNodes.get(generatorId);
            if (targetNode instanceof Tone.PolySynth) {
                targetNode.triggerAttack(voicedNote, undefined, Math.max(0.001, Math.min(1, velocity)));
                nextGeneratorNoteCounts = incrementGeneratorNoteCount(
                    nextGeneratorNoteCounts,
                    generatorId,
                    voicedNote
                );
                nextActiveGenerators.add(generatorId);
                get().emitSignalFlow(generatorId, 'audio');
            } else if (targetNode instanceof Tone.Noise) {
                if (nextActiveGenerators.has(generatorId)) {
                    try {
                        targetNode.stop();
                    } catch {
                        // Ignore redundant stop calls when rapidly retriggering noise.
                    }
                }
                targetNode.start();
                nextActiveGenerators.add(generatorId);
                get().emitSignalFlow(generatorId, 'audio');
            }
        });

        nextGeneratorNoteCounts.forEach((_, generatorId) => {
            nextActiveGenerators.add(generatorId);
        });

        set({
            activeChordVoicings: nextChordVoicings,
            activeQuantizedNotes: nextQuantizedNotes,
            generatorNoteCounts: nextGeneratorNoteCounts,
            activeGenerators: nextActiveGenerators,
        });
    },

    fireNoteOff: (controllerId: string, note: string) => {
        const { edges, nodes, audioNodes, activeChordVoicings, activeQuantizedNotes, generatorNoteCounts, activeGenerators } = get();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const nextChordVoicings = new Map(activeChordVoicings);
        const nextQuantizedNotes = new Map(activeQuantizedNotes);
        const dispatches = collectNoteDispatches(
            controllerId,
            note,
            nodesById,
            edges,
            nextChordVoicings,
            nextQuantizedNotes,
            false
        );

        let nextGeneratorNoteCounts = generatorNoteCounts;
        const nextActiveGenerators = new Set(activeGenerators);
        dispatches.forEach(({ generatorId, note: voicedNote }) => {
            const samplerChain = get().samplerChains.get(generatorId);
            if (samplerChain?.player.loaded) {
                if (samplerChain.player.loop) {
                    samplerChain.player.stop();
                }
                nextActiveGenerators.delete(generatorId);
                return;
            }

            const targetNode = audioNodes.get(generatorId);
            if (targetNode instanceof Tone.PolySynth) {
                targetNode.triggerRelease(voicedNote);
                nextGeneratorNoteCounts = decrementGeneratorNoteCount(
                    nextGeneratorNoteCounts,
                    generatorId,
                    voicedNote
                );
                if (!nextGeneratorNoteCounts.has(generatorId)) {
                    nextActiveGenerators.delete(generatorId);
                }
            } else if (targetNode instanceof Tone.Noise) {
                targetNode.stop();
                nextActiveGenerators.delete(generatorId);
            }
        });

        nextGeneratorNoteCounts.forEach((_, generatorId) => {
            nextActiveGenerators.add(generatorId);
        });

        set({
            activeChordVoicings: nextChordVoicings,
            activeQuantizedNotes: nextQuantizedNotes,
            generatorNoteCounts: nextGeneratorNoteCounts,
            activeGenerators: nextActiveGenerators,
        });
    },

    toggleNodePlayback: (id: string, isPlaying: boolean) => {
        const { audioNodes, drumRacks, samplerChains, advancedDrumRacks, nodes, patterns } = get();
        const nodeData = nodes.find((node: AppNode) => node.id === id);
        if (!nodeData) {
            return;
        }

        if (nodeData.type === 'sampler') {
            const chain = samplerChains.get(id);
            if (!chain?.player.loaded) {
                return;
            }

            if (chain.previewTimeout) {
                clearTimeout(chain.previewTimeout);
                chain.previewTimeout = null;
            }

            if (isPlaying) {
                try {
                    chain.player.stop();
                } catch {
                    // Ignore redundant stop calls when preview is already idle.
                }
                chain.player.start();

                if (!chain.player.loop) {
                    chain.previewTimeout = setTimeout(() => {
                        const nextActiveGenerators = new Set(get().activeGenerators);
                        nextActiveGenerators.delete(id);
                        set({
                            activeGenerators: nextActiveGenerators,
                            nodes: get().nodes.map((node: AppNode) =>
                                node.id === id
                                    ? { ...node, data: { ...node.data, isPlaying: false } }
                                    : node
                            ),
                        });
                    }, (chain.player.buffer.duration / Math.max(chain.player.playbackRate, 0.25)) * 1000);
                }

                set({
                    activeGenerators: new Set([...get().activeGenerators, id]),
                });
            } else {
                try {
                    chain.player.stop();
                } catch {
                    // Ignore redundant stop calls when preview is already idle.
                }

                const nextActiveGenerators = new Set(get().activeGenerators);
                nextActiveGenerators.delete(id);
                set({ activeGenerators: nextActiveGenerators });
            }

            set({
                nodes: nodes.map((node: AppNode) =>
                    node.id === id ? { ...node, data: { ...node.data, isPlaying } } : node
                ),
            });
            return;
        }

        if (nodeData.type === 'pulse' || nodeData.type === 'stepsequencer') {
            const existingPattern = patterns.get(id);
            if (existingPattern) {
                existingPattern.stop().dispose();
                const nextPatterns = new Map(patterns);
                nextPatterns.delete(id);
                set({ patterns: nextPatterns });
            }

            if (isPlaying) {
                const interval = getLoopIntervalSeconds(
                    nodeData.type === 'pulse'
                        ? nodeData.data.pulseSync ?? true
                        : nodeData.data.sequenceSync ?? true,
                    nodeData.type === 'pulse'
                        ? nodeData.data.pulseRate ?? '4n'
                        : nodeData.data.sequenceRate ?? '8n',
                    nodeData.type === 'pulse'
                        ? nodeData.data.pulseIntervalMs ?? 500
                        : nodeData.data.sequenceIntervalMs ?? 250
                );
                const intervalMs =
                    typeof interval === 'number'
                        ? interval * 1000
                        : Tone.Time(interval).toMilliseconds();

                const loop = new Tone.Loop(() => {
                    if (nodeData.type === 'pulse') {
                        get().firePulse(id, Math.max(intervalMs, 50));
                    } else {
                        get().advanceSequencerStep(id, Math.max(intervalMs, 50));
                    }
                }, interval);

                loop.start(0);
                const nextPatterns = new Map(get().patterns);
                nextPatterns.set(id, loop);
                set({ patterns: nextPatterns });
            }

            set({
                nodes: nodes.map((node: AppNode) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, isPlaying, currentStep: isPlaying ? node.data.currentStep ?? -1 : node.data.currentStep } }
                        : node
                ),
            });
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

        if (nodeData.type === 'advanceddrum') {
            const rack = advancedDrumRacks.get(id);
            if (!rack) {
                return;
            }

            if (isPlaying) {
                if (!rack.loop) {
                    rack.loop = new Tone.Loop((time) => {
                        get().advanceAdvancedDrumStep(id, time);
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
            (node.type === 'speaker' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'speaker')) ||
            (node.type === 'audioin' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'audioin'))
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
                        : node.type === 'controller'
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    label: node.data.label || 'Arpeggiator',
                                    rootNote: node.data.rootNote ?? 'C',
                                    scaleType: node.data.scaleType ?? 'major pentatonic',
                                    isPlaying: node.data.isPlaying ?? false,
                                },
                            }
                        : node.type === 'midiin'
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    label: node.data.label || 'MIDI In',
                                    midiSupported:
                                        node.data.midiSupported ??
                                        (typeof navigator !== 'undefined' &&
                                            typeof navigator.requestMIDIAccess === 'function'),
                                },
                            }
                            : node.type === 'audioin'
                                ? {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        label: node.data.label || 'Audio In',
                                        audioInStatus:
                                            node.data.audioInStatus ??
                                            (typeof navigator !== 'undefined' &&
                                            typeof navigator.mediaDevices?.getUserMedia === 'function'
                                                ? 'idle'
                                                : 'unsupported'),
                                        inputGain: node.data.inputGain ?? 75,
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
                            : node.type === 'sampler'
                                ? {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        label: node.data.label || 'Sampler',
                                        hasSample: node.data.hasSample ?? false,
                                        sampleName: node.data.sampleName ?? '',
                                        sampleDataUrl: node.data.sampleDataUrl,
                                        sampleWaveform: node.data.sampleWaveform ?? [],
                                        loop: node.data.loop ?? false,
                                        playbackRate: node.data.playbackRate ?? 1,
                                        reverse: node.data.reverse ?? false,
                                        pitchShift: node.data.pitchShift ?? 0,
                                        isPlaying: node.data.isPlaying ?? false,
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
                                : node.type === 'advanceddrum'
                                    ? {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            label: node.data.label || 'Advanced Drums',
                                            advancedDrumTracks: node.data.advancedDrumTracks ?? createDefaultAdvancedDrumTracks(),
                                            swing: node.data.swing ?? 0,
                                            currentStep: node.data.currentStep ?? -1,
                                            isPlaying: node.data.isPlaying ?? false,
                                        },
                                    }
                                : node.type === 'pulse'
                                    ? {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            label: node.data.label || 'Pulse',
                                            pulseSync: node.data.pulseSync ?? true,
                                            pulseRate: node.data.pulseRate ?? '4n',
                                            pulseIntervalMs: node.data.pulseIntervalMs ?? 500,
                                            pulseNote: node.data.pulseNote ?? DEFAULT_PULSE_NOTE,
                                            isPlaying: node.data.isPlaying ?? false,
                                        },
                                    }
                                    : node.type === 'stepsequencer'
                                        ? {
                                            ...node,
                                            data: {
                                                ...node.data,
                                                label: node.data.label || 'Sequencer',
                                                stepSequence: node.data.stepSequence ?? createDefaultStepSequence(),
                                                selectedStep: node.data.selectedStep ?? 0,
                                                currentStep: node.data.currentStep ?? -1,
                                                sequenceSync: node.data.sequenceSync ?? true,
                                                sequenceRate: node.data.sequenceRate ?? '8n',
                                                sequenceIntervalMs: node.data.sequenceIntervalMs ?? 250,
                                                isPlaying: node.data.isPlaying ?? false,
                                            },
                                        }
                                        : node.type === 'quantizer'
                                            ? {
                                                ...node,
                                                data: {
                                                    ...node.data,
                                                    label: node.data.label || 'Quantizer',
                                                    rootNote: node.data.rootNote ?? 'C',
                                                    scaleType: node.data.scaleType ?? 'major',
                                                    bypass: node.data.bypass ?? false,
                                                },
                                            }
                                            : node.type === 'moodpad'
                                                ? {
                                                    ...node,
                                                    data: {
                                                        ...node.data,
                                                        label: node.data.label || 'Mood Pad',
                                                        moodX: node.data.moodX ?? 0.35,
                                                        moodY: node.data.moodY ?? 0.55,
                                                    },
                                                }
                                                : node.type === 'visualiser'
                                                    ? {
                                                        ...node,
                                                        data: {
                                                            ...node.data,
                                                            label: node.data.label || 'Visualiser',
                                                            visualiserMode: node.data.visualiserMode ?? 'waveform',
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
        } else if (
            nextNode.type === 'sampler' ||
            nextNode.type === 'audioin' ||
            nextNode.type === 'drum' ||
            nextNode.type === 'advanceddrum' ||
            nextNode.type === 'unison' ||
            nextNode.type === 'detune' ||
            nextNode.type === 'visualiser'
        ) {
            get().initAudioNode(nextNode.id, nextNode.type);
        }

        if (
            (nextNode.type === 'pulse' ||
                nextNode.type === 'stepsequencer' ||
                nextNode.type === 'advanceddrum') &&
            nextNode.data.isPlaying
        ) {
            get().toggleNodePlayback(nextNode.id, true);
        }

        get().rebuildAudioGraph();
    },

    removeNodeAndCleanUp: (id: string) => {
        get().saveSnapshot();

        const { nodes, edges } = get();
        const removedNode = nodes.find((node: AppNode) => node.id === id);

        if (removedNode?.type === 'chord' || removedNode?.type === 'quantizer') {
            const { audioNodes, activeChordVoicings, activeQuantizedNotes, generatorNoteCounts } = get();
            const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
            const nextChordVoicings = new Map(activeChordVoicings);
            const nextQuantizedNotes = new Map(activeQuantizedNotes);
            let nextGeneratorNoteCounts = generatorNoteCounts;

            if (removedNode.type === 'chord') {
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
                                    nextQuantizedNotes,
                                    false
                                );

                                dispatches.forEach(({ generatorId, note }) => {
                                    const samplerChain = get().samplerChains.get(generatorId);
                                    if (samplerChain?.player.loaded) {
                                        if (samplerChain.player.loop) {
                                            samplerChain.player.stop();
                                        }
                                        return;
                                    }

                                    const targetNode = audioNodes.get(generatorId);
                                    if (targetNode instanceof Tone.PolySynth) {
                                        targetNode.triggerRelease(note);
                                        nextGeneratorNoteCounts = decrementGeneratorNoteCount(
                                            nextGeneratorNoteCounts,
                                            generatorId,
                                            note
                                        );
                                    } else if (targetNode instanceof Tone.Noise) {
                                        targetNode.stop();
                                    }
                                });
                            });
                        }

                        nextChordVoicings.delete(voicingKey);
                    });
            }

            if (removedNode.type === 'quantizer') {
                [...activeQuantizedNotes.entries()]
                    .filter(([quantizedKey]) => quantizedKey.startsWith(`${id}::`))
                    .forEach(([quantizedKey, quantizedNote]) => {
                        for (let iteration = 0; iteration < quantizedNote.count; iteration++) {
                            const dispatches = collectNoteDispatches(
                                id,
                                quantizedNote.note,
                                nodesById,
                                edges,
                                nextChordVoicings,
                                nextQuantizedNotes,
                                false
                            );

                            dispatches.forEach(({ generatorId, note }) => {
                                const samplerChain = get().samplerChains.get(generatorId);
                                if (samplerChain?.player.loaded) {
                                    if (samplerChain.player.loop) {
                                        samplerChain.player.stop();
                                    }
                                    return;
                                }

                                const targetNode = audioNodes.get(generatorId);
                                if (targetNode instanceof Tone.PolySynth) {
                                    targetNode.triggerRelease(note);
                                    nextGeneratorNoteCounts = decrementGeneratorNoteCount(
                                        nextGeneratorNoteCounts,
                                        generatorId,
                                        note
                                    );
                                } else if (targetNode instanceof Tone.Noise) {
                                    targetNode.stop();
                                }
                            });
                        }

                        nextQuantizedNotes.delete(quantizedKey);
                    });
            }

            set({
                activeChordVoicings: nextChordVoicings,
                activeQuantizedNotes: nextQuantizedNotes,
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
        const { audioNodes, audioInputChains, edges, nodes } = get() as AppState;
        const masterOutput = get().ensureMasterOutput();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));
        const routedSourceIds = new Set<string>();

        audioNodes.forEach((node: Tone.ToneAudioNode) => node.disconnect());
        masterOutput.disconnect();
        masterOutput.toDestination();
        if (recordingController) {
            masterOutput.connect(recordingController.destination);
        }

        edges
            .filter((edge: AppEdge) => isAudioEdge(edge))
            .forEach((edge: AppEdge) => {
                const sourceInfo = nodesById.get(edge.source);
                const targetInfo = nodesById.get(edge.target);

                if (
                    !sourceInfo ||
                    !targetInfo ||
                    edge.targetHandle === AUDIO_INPUT_SECONDARY_HANDLE_ID ||
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

                const actualSourceId = edge.data?.originalSource || edge.source;
                const actualTargetId = edge.data?.originalTarget || edge.target;
                const sourceNode = audioNodes.get(actualSourceId);
                const targetNode = audioNodes.get(actualTargetId);

                if (sourceNode && targetNode) {
                    sourceNode.connect(targetNode);
                    routedSourceIds.add(actualSourceId);
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

        audioInputChains.forEach((chain) => {
            chain.gain.connect(chain.meter);
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
            } else if (
                node.type === 'audioin' ||
                node.type === 'drum' ||
                node.type === 'unison' ||
                node.type === 'detune' ||
                node.type === 'visualiser'
            ) {
                get().initAudioNode(node.id, node.type);
            }
        });
        get().rebuildAudioGraph();
        nodes
            .filter((node: AppNode) => (node.type === 'pulse' || node.type === 'stepsequencer') && node.data.isPlaying)
            .forEach((node: AppNode) => get().toggleNodePlayback(node.id, true));
    },

    clearCanvas: () => {
        const { audioNodes, audioInputChains, drumRacks, samplerChains, advancedDrumRacks, patterns, masterOutput } = get();

        if (get().isRecording) {
            void get().stopRecording();
        }

        signalFlowTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        signalFlowTimeouts.clear();

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

        samplerChains.forEach((chain) => {
            if (chain.previewTimeout) {
                clearTimeout(chain.previewTimeout);
            }
            try {
                chain.player.stop();
            } catch {
                // Ignore redundant stop calls when clearing the canvas.
            }
            chain.player.disconnect().dispose();
        });

        advancedDrumRacks.forEach((rack) => {
            rack.loop?.dispose();
            rack.players.forEach((player) => {
                try {
                    player.stop();
                } catch {
                    // Ignore redundant stop calls when clearing the canvas.
                }
                player.disconnect().dispose();
            });
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hat.disconnect().dispose();
            rack.clap.disconnect().dispose();
        });

        audioInputChains.forEach((chain) => {
            try {
                chain.input.close();
            } catch {
                // Ignore close failures during full canvas cleanup.
            }
            chain.input.disconnect();
            chain.input.dispose();
            chain.meter.disconnect();
            chain.meter.dispose();
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
            audioInputChains: new Map(),
            drumRacks: new Map(),
            samplerChains: new Map(),
            advancedDrumRacks: new Map(),
            patterns: new Map(),
            activeChordVoicings: new Map(),
            activeQuantizedNotes: new Map(),
            generatorNoteCounts: new Map(),
            activeGenerators: new Set(),
            activeDrumPads: new Set(),
            adjacentNodeIds: new Set(),
            autoEdgeIds: new Set(),
            signalFlowEvents: [],
            masterOutput: null,
            isRecording: false,
            recordingElapsedMs: 0,
            recordingMimeType: null,
            recordingError: null,
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
            } else if (
                node.type === 'sampler' ||
                node.type === 'audioin' ||
                node.type === 'drum' ||
                node.type === 'advanceddrum' ||
                node.type === 'unison' ||
                node.type === 'detune' ||
                node.type === 'visualiser'
            ) {
                get().initAudioNode(node.id, node.type);
            }

            // For tempo nodes, ensure global transport is synced
            if (node.type === 'tempo' && node.data.bpm) {
                Tone.getTransport().bpm.rampTo(node.data.bpm, 0.1);
            }
        });

        nodes.forEach((node) => {
            if (node.type === 'sampler' && node.data.sampleDataUrl) {
                const chain = get().samplerChains.get(node.id);
                if (chain) {
                    void chain.player.load(node.data.sampleDataUrl).then(() => {
                        chain.player.loop = node.data.loop ?? false;
                        chain.player.playbackRate = node.data.playbackRate ?? 1;
                        chain.player.reverse = node.data.reverse ?? false;
                        chain.pitchShift.pitch = node.data.pitchShift ?? 0;
                    }).catch((error) => {
                        console.error('Failed to restore sampler sample', error);
                    });
                }
            }

            if (node.type === 'advanceddrum' && node.data.advancedDrumTracks) {
                const rack = get().advancedDrumRacks.get(node.id);
                const tracks: AdvancedDrumTrackData[] = node.data.advancedDrumTracks;
                tracks.forEach((track, trackIndex) => {
                    if (!track.sampleDataUrl || !rack) {
                        return;
                    }

                    const player = new Tone.Player({ autostart: false, loop: false }).connect(rack.output);
                    rack.players.set(trackIndex, player);
                    void player.load(track.sampleDataUrl).catch((error) => {
                        console.error('Failed to restore advanced drum sample', error);
                    });
                });
            }
        });

        get().rebuildAudioGraph();
        get().recalculateAdjacency();
        nodes
            .filter((node: AppNode) => (node.type === 'pulse' || node.type === 'stepsequencer' || node.type === 'advanceddrum') && node.data.isPlaying)
            .forEach((node: AppNode) => get().toggleNodePlayback(node.id, true));
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

        const desiredAutoEdges: Array<{ source: string; target: string; sourceHandle: string; targetHandle: string; kind: ConnectionKind; id: string }> = [];

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

                // Vertical gap metrics
                const gapBelow = b.position.y - (a.position.y + aDims.h);
                const gapAbove = a.position.y - (b.position.y + bDims.h);
                const vertGap = Math.max(gapBelow, gapAbove);

                const aCentreX = a.position.x + aDims.w / 2;
                const bCentreX = b.position.x + bDims.w / 2;
                const horizDist = Math.abs(aCentreX - bCentreX);

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

                const isControlPair = CONTROL_WIRE_PAIRS.has(pairKey);

                if (isControlPair) {
                    // Horizontal check
                    if (horizGap < 0 || horizGap > ADJ_TOUCH_THRESHOLD || vertDist > ADJ_Y_THRESHOLD) continue;
                } else {
                    // Vertical check (audio domain)
                    if (vertGap < 0 || vertGap > ADJ_VERT_THRESHOLD || horizDist > ADJ_X_THRESHOLD) continue;
                }

                const kind = isControlPair ? 'control' : 'audio';
                const sourceHandle = isControlPair ? CONTROL_OUTPUT_HANDLE_ID : AUDIO_OUTPUT_HANDLE_ID;
                const targetHandle = isControlPair ? CONTROL_INPUT_HANDLE_ID : AUDIO_INPUT_HANDLE_ID;

                // Don't create an auto-edge if a manual edge already exists for this pair
                const manualExists = edges.some(
                    (e: Edge) =>
                        e.source === sourceNode.id &&
                        e.target === targetNode.id &&
                        e.sourceHandle === sourceHandle &&
                        e.targetHandle === targetHandle &&
                        !managedIds.has(e.id)
                );
                if (manualExists) continue;

                desiredAutoEdges.push({
                    source: sourceNode.id,
                    target: targetNode.id,
                    sourceHandle,
                    targetHandle,
                    kind,
                    id: `${AUTO_EDGE_PREFIX}${sourceNode.id}-${targetNode.id}`,
                });
            }
        }

        const desiredIds = new Set(desiredAutoEdges.map(e => e.id));

        // Keep all manually drawn edges; rebuild the auto set from scratch
        const manualEdges = edges.filter((e: AppEdge) => !managedIds.has(e.id));

        // Auto-edges are hidden: audio/control routes through them, no visual wire rendered
        const nextAutoEdges: AppEdge[] = desiredAutoEdges.map(({ source, target, sourceHandle, targetHandle, kind, id }) => ({
            id,
            source,
            target,
            sourceHandle,
            targetHandle,
            hidden: true, // invisible — connection is implied by the snap/glow, not a cable
            data: { kind },
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

                const gapBelow = b.position.y - (a.position.y + aDims.h);
                const gapAbove = a.position.y - (b.position.y + bDims.h);
                const vertGap = Math.max(gapBelow, gapAbove);

                const aCentreX = a.position.x + aDims.w / 2;
                const bCentreX = b.position.x + bDims.w / 2;
                const horizDist = Math.abs(aCentreX - bCentreX);

                const axis = getNodeAdjacencyAxis(a.type, b.type);
                if (axis === null) continue;

                if (axis === 'horizontal') {
                    if (horizGap < 0 || horizGap > ADJ_TOUCH_THRESHOLD || vertDist > ADJ_Y_THRESHOLD) continue;
                } else {
                    // vertical
                    if (vertGap < 0 || vertGap > ADJ_VERT_THRESHOLD || horizDist > ADJ_X_THRESHOLD) continue;
                }

                adjacent.add(a.id);
                adjacent.add(b.id);
            }
        }

        set({ adjacentNodeIds: new Set(adjacent) });
        // Auto-wire runs after adjacency so it sees the fresh adjacent set
        get().autoWireAdjacentNodes();
    },

    packGroup: (id: string) => {
        const { nodes, edges } = get();
        const startNode = nodes.find(n => n.id === id);
        if (!startNode || !startNode.data.isLocked) return;

        get().saveSnapshot();

        const clusterIds = getClusterNodeIds(id, nodes);
        const { entryId } = getClusterBoundaries(clusterIds, nodes);
        if (!entryId) return;

        const packGroupId = entryId;

        set({
            nodes: nodes.map(node => {
                if (!clusterIds.has(node.id)) return node;
                const isVisible = node.id === entryId;
                return {
                    ...node,
                    hidden: !isVisible,
                    data: {
                        ...node.data,
                        isPacked: true,
                        isPackedVisible: isVisible,
                        packGroupId,
                        packedName: isVisible ? (node.data.packedName || 'Packed Patch') : node.data.packedName,
                    }
                };
            }),
            edges: edges.map(edge => {
                const isInternal = clusterIds.has(edge.source) && clusterIds.has(edge.target);
                
                if (isInternal) {
                    return { ...edge, hidden: true };
                }

                const isSourceIn = clusterIds.has(edge.source);
                const isTargetIn = clusterIds.has(edge.target);

                if (isSourceIn || isTargetIn) {
                    const kind = edge.data?.kind || getConnectionKind(edge) || 'audio';
                    const newSource = isSourceIn ? entryId : edge.source;
                    const newTarget = isTargetIn ? entryId : edge.target;
                    
                    return {
                        ...edge,
                        source: newSource,
                        target: newTarget,
                        data: {
                            ...edge.data,
                            kind,
                            originalSource: isSourceIn ? (edge.data?.originalSource || edge.source) : edge.data?.originalSource,
                            originalTarget: isTargetIn ? (edge.data?.originalTarget || edge.target) : edge.data?.originalTarget
                        }
                    };
                }

                return edge;
            })
        });

        get().rebuildAudioGraph();
    },

    unpackGroup: (id: string) => {
        const { nodes, edges } = get();
        const startNode = nodes.find(n => n.id === id);
        if (!startNode || !startNode.data.isPacked) return;

        get().saveSnapshot();

        const packGroupId = startNode.data.packGroupId;
        const clusterIds = new Set(nodes.filter(n => n.data.packGroupId === packGroupId).map(n => n.id));

        set({
            nodes: nodes.map(node => {
                if (!clusterIds.has(node.id)) return node;
                return {
                    ...node,
                    hidden: false,
                    data: {
                        ...node.data,
                        isPacked: false,
                        isPackedVisible: false,
                        packGroupId: undefined,
                    }
                };
            }),
            edges: edges.map(edge => {
                const wasSourceRedirected = edge.data?.originalSource && edge.source === packGroupId;
                const wasTargetRedirected = edge.data?.originalTarget && edge.target === packGroupId;

                if (wasSourceRedirected || wasTargetRedirected) {
                    return {
                        ...edge,
                        source: edge.data?.originalSource || edge.source,
                        target: edge.data?.originalTarget || edge.target,
                        data: {
                            ...edge.data,
                            originalSource: undefined,
                            originalTarget: undefined
                        }
                    };
                }

                // Restore visibility for internal edges (auto-edges stay hidden by recalculateAdjacency if needed)
                if (clusterIds.has(edge.source) && clusterIds.has(edge.target)) {
                     const isAuto = edge.id.startsWith(AUTO_EDGE_PREFIX) || get().autoEdgeIds.has(edge.id);
                     return { ...edge, hidden: isAuto };
                }

                return edge;
            })
        });

        get().rebuildAudioGraph();
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
                const axis = getNodeAdjacencyAxis(currentNode.type, other.type);

                if (axis === 'horizontal') {
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
                } else if (axis === 'vertical') {
                    const gapBelow = other.position.y - (currentNode.position.y + cDims.h);
                    const gapAbove = currentNode.position.y - (other.position.y + oDims.h);
                    const vGap = Math.max(gapBelow, gapAbove);

                    const cCentreX = currentNode.position.x + cDims.w / 2;
                    const oCentreX = other.position.x + oDims.w / 2;
                    const hDist = Math.abs(cCentreX - oCentreX);

                    if (vGap >= 0 && vGap <= ADJ_VERT_THRESHOLD && hDist <= ADJ_X_THRESHOLD) {
                        clusterIds.add(other.id);
                        queue.push(other.id);
                    }
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

        if (get().isRecording) {
            void get().stopRecording();
        }

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
        const { audioNodes, audioInputChains, drumRacks, samplerChains, advancedDrumRacks, patterns } = get();

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

        samplerChains.forEach((chain) => {
            if (chain.previewTimeout) {
                clearTimeout(chain.previewTimeout);
            }
            try {
                chain.player.stop();
            } catch {
                // Ignore redundant stop calls during undo re-sync.
            }
            chain.player.disconnect().dispose();
        });

        advancedDrumRacks.forEach((rack) => {
            rack.loop?.dispose();
            rack.players.forEach((player) => {
                try {
                    player.stop();
                } catch {
                    // Ignore redundant stop calls during undo re-sync.
                }
                player.disconnect().dispose();
            });
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hat.disconnect().dispose();
            rack.clap.disconnect().dispose();
        });

        audioInputChains.forEach((chain) => {
            try {
                chain.input.close();
            } catch {
                // Ignore close failures during undo re-sync.
            }
            chain.input.disconnect();
            chain.input.dispose();
            chain.meter.disconnect();
            chain.meter.dispose();
        });

        // Dispose all patterns
        patterns.forEach((pattern) => {
            pattern.stop().dispose();
        });

        // Clear audio state
        set({
            audioNodes: new Map(),
            audioInputChains: new Map(),
            drumRacks: new Map(),
            samplerChains: new Map(),
            advancedDrumRacks: new Map(),
            patterns: new Map(),
            activeChordVoicings: new Map(),
            activeQuantizedNotes: new Map(),
            generatorNoteCounts: new Map(),
            activeGenerators: new Set(),
            activeDrumPads: new Set(),
            signalFlowEvents: [],
        });

        // Reinitialize audio nodes for restored state
        previousSnapshot.nodes.forEach((node) => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (
                node.type === 'sampler' ||
                node.type === 'audioin' ||
                node.type === 'drum' ||
                node.type === 'advanceddrum' ||
                node.type === 'unison' ||
                node.type === 'detune' ||
                node.type === 'visualiser'
            ) {
                get().initAudioNode(node.id, node.type);
            }
        });

        previousSnapshot.nodes.forEach((node) => {
            if (node.type === 'sampler' && node.data.sampleDataUrl) {
                const chain = get().samplerChains.get(node.id);
                if (chain) {
                    void chain.player.load(node.data.sampleDataUrl).then(() => {
                        chain.player.loop = node.data.loop ?? false;
                        chain.player.playbackRate = node.data.playbackRate ?? 1;
                        chain.player.reverse = node.data.reverse ?? false;
                        chain.pitchShift.pitch = node.data.pitchShift ?? 0;
                    }).catch((error) => {
                        console.error('Failed to restore sampler sample', error);
                    });
                }
            }

            if (node.type === 'advanceddrum' && node.data.advancedDrumTracks) {
                const rack = get().advancedDrumRacks.get(node.id);
                const tracks: AdvancedDrumTrackData[] = node.data.advancedDrumTracks;
                tracks.forEach((track, trackIndex) => {
                    if (!track.sampleDataUrl || !rack) {
                        return;
                    }

                    const player = new Tone.Player({ autostart: false, loop: false }).connect(rack.output);
                    rack.players.set(trackIndex, player);
                    void player.load(track.sampleDataUrl).catch((error) => {
                        console.error('Failed to restore advanced drum sample', error);
                    });
                });
            }
        });

        // Rebuild audio graph and recalculate adjacency
        get().rebuildAudioGraph();
        get().recalculateAdjacency();
        previousSnapshot.nodes
            .filter((node) => (node.type === 'pulse' || node.type === 'stepsequencer' || node.type === 'advanceddrum') && node.data.isPlaying)
            .forEach((node) => get().toggleNodePlayback(node.id, true));
    },

    redo: () => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;

        if (get().isRecording) {
            void get().stopRecording();
        }

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
        const { audioNodes, audioInputChains, drumRacks, samplerChains, advancedDrumRacks, patterns } = get();

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

        samplerChains.forEach((chain) => {
            if (chain.previewTimeout) {
                clearTimeout(chain.previewTimeout);
            }
            try {
                chain.player.stop();
            } catch {
                // Ignore redundant stop calls during redo re-sync.
            }
            chain.player.disconnect().dispose();
        });

        advancedDrumRacks.forEach((rack) => {
            rack.loop?.dispose();
            rack.players.forEach((player) => {
                try {
                    player.stop();
                } catch {
                    // Ignore redundant stop calls during redo re-sync.
                }
                player.disconnect().dispose();
            });
            rack.kick.disconnect().dispose();
            rack.snare.disconnect().dispose();
            rack.hat.disconnect().dispose();
            rack.clap.disconnect().dispose();
        });

        audioInputChains.forEach((chain) => {
            try {
                chain.input.close();
            } catch {
                // Ignore close failures during redo re-sync.
            }
            chain.input.disconnect();
            chain.input.dispose();
            chain.meter.disconnect();
            chain.meter.dispose();
        });

        // Dispose all patterns
        patterns.forEach((pattern) => {
            pattern.stop().dispose();
        });

        // Clear audio state
        set({
            audioNodes: new Map(),
            audioInputChains: new Map(),
            drumRacks: new Map(),
            samplerChains: new Map(),
            advancedDrumRacks: new Map(),
            patterns: new Map(),
            activeChordVoicings: new Map(),
            activeQuantizedNotes: new Map(),
            generatorNoteCounts: new Map(),
            activeGenerators: new Set(),
            activeDrumPads: new Set(),
            signalFlowEvents: [],
        });

        // Reinitialize audio nodes for restored state
        nextSnapshot.nodes.forEach((node) => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (
                node.type === 'sampler' ||
                node.type === 'audioin' ||
                node.type === 'drum' ||
                node.type === 'advanceddrum' ||
                node.type === 'unison' ||
                node.type === 'detune' ||
                node.type === 'visualiser'
            ) {
                get().initAudioNode(node.id, node.type);
            }
        });

        nextSnapshot.nodes.forEach((node) => {
            if (node.type === 'sampler' && node.data.sampleDataUrl) {
                const chain = get().samplerChains.get(node.id);
                if (chain) {
                    void chain.player.load(node.data.sampleDataUrl).then(() => {
                        chain.player.loop = node.data.loop ?? false;
                        chain.player.playbackRate = node.data.playbackRate ?? 1;
                        chain.player.reverse = node.data.reverse ?? false;
                        chain.pitchShift.pitch = node.data.pitchShift ?? 0;
                    }).catch((error) => {
                        console.error('Failed to restore sampler sample', error);
                    });
                }
            }

            if (node.type === 'advanceddrum' && node.data.advancedDrumTracks) {
                const rack = get().advancedDrumRacks.get(node.id);
                const tracks: AdvancedDrumTrackData[] = node.data.advancedDrumTracks;
                tracks.forEach((track, trackIndex) => {
                    if (!track.sampleDataUrl || !rack) {
                        return;
                    }

                    const player = new Tone.Player({ autostart: false, loop: false }).connect(rack.output);
                    rack.players.set(trackIndex, player);
                    void player.load(track.sampleDataUrl).catch((error) => {
                        console.error('Failed to restore advanced drum sample', error);
                    });
                });
            }
        });

        // Rebuild audio graph and recalculate adjacency
        get().rebuildAudioGraph();
        get().recalculateAdjacency();
        nextSnapshot.nodes
            .filter((node) => (node.type === 'pulse' || node.type === 'stepsequencer' || node.type === 'advanceddrum') && node.data.isPlaying)
            .forEach((node) => get().toggleNodePlayback(node.id, true));
    },
}));
