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
export const MATH_INPUT_HANDLE_ID = 'math';
export const MATH_OUTPUT_HANDLE_ID = 'math-out';
export const MODULATION_OUTPUT_HANDLE_ID = 'mod-out';
export const MODULATION_INPUT_HANDLE_PREFIX = 'mod-in:';
export const AUDIO_SIGNAL_COLOR = '#22d3ee';
export const CONTROL_SIGNAL_COLOR = '#39ff14';
export const MATH_SIGNAL_COLOR = '#8b5cf6';
export const MODULATION_SIGNAL_COLOR = '#bef264';
export const DRUM_PARTS = ['kick', 'snare', 'hatClosed', 'hatOpen'] as const;
export const DRUM_STEP_COUNT = 16;
export const PATTERN_STEPS_PER_BAR = 16;
const SONG_NOTE_OCTAVES = [2, 3, 4, 5, 6] as const;
export const SONG_NOTE_OPTIONS = SONG_NOTE_OCTAVES.flatMap((octave) =>
    ROOT_NOTES.map((note) => `${note}${octave}`)
);
export const PIANO_ROLL_NOTE_OPTIONS = [...SONG_NOTE_OPTIONS].reverse();
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
export const createModulationHandleId = (paramKey: AutomatableParamKey) =>
    `${MODULATION_INPUT_HANDLE_PREFIX}${paramKey}`;
export const getModulationParamFromHandle = (handleId?: string | null): AutomatableParamKey | null => {
    if (!handleId?.startsWith(MODULATION_INPUT_HANDLE_PREFIX)) {
        return null;
    }

    return handleId.slice(MODULATION_INPUT_HANDLE_PREFIX.length) as AutomatableParamKey;
};

export type TransportRate = (typeof TRANSPORT_RATE_OPTIONS)[number]['value'];
export type AudioNodeType =
    | 'generator'
    | 'sampler'
    | 'audioin'
    | 'effect'
    | 'eq'
    | 'speaker'
    | 'mixer'
    | 'controller'
    | 'midiin'
    | 'tempo'
    | 'arranger'
    | 'drum'
    | 'advanceddrum'
    | 'chord'
    | 'adsr'
    | 'keys'
    | 'lfo'
    | 'pattern'
    | 'unison'
    | 'detune'
    | 'visualiser'
    | 'pulse'
    | 'stepsequencer'
    | 'quantizer'
    | 'moodpad';
export type ConnectionKind = 'audio' | 'tempo' | 'control' | 'modulation' | 'math';
export type WaveShape = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';
export type GeneratorMode = 'wave' | 'noise' | 'fm' | 'am';
export type ModulationWaveShape = 'sine' | 'triangle' | 'square' | 'sawtooth';
export type DrumMode = 'hits' | 'grid';
export type DrumPart = (typeof DRUM_PARTS)[number];
export type DrumPattern = Record<DrumPart, boolean[]>;
export type SequencerStep = {
    enabled: boolean;
    note: string;
    mix?: number;
    gate?: number;
};
export type AdvancedDrumTrackData = {
    label: string;
    steps: number[];
    length: number;
    sampleName?: string;
    sampleDataUrl?: string;
};
export type PatternNote = {
    id: string;
    note: string;
    startStep: number;
    lengthSteps: number;
    velocity: number;
};
export type PatternClip = {
    notes: PatternNote[];
    loopBars: number;
    stepsPerBar: number;
};
export type AutomatableParamKey =
    | 'mix'
    | 'playbackRate'
    | 'pitchShift'
    | 'wet'
    | 'roomSize'
    | 'delayTime'
    | 'feedback'
    | 'frequency'
    | 'depth'
    | 'pitch'
    | 'low'
    | 'mid'
    | 'high'
    | 'lowFrequency'
    | 'highFrequency'
    | 'harmonicity'
    | 'modulationIndex'
    | 'volume'
    | 'pan';
export type MixerChannelState = {
    sourceId: string;
    volume: number;
    pan: number;
    muted: boolean;
    solo: boolean;
};
export type AutomationPoint = {
    id: string;
    barOffset: number;
    value: number;
    durationBars?: number;
};
export type AutomationLane = {
    id: string;
    targetNodeId: string;
    targetParam: AutomatableParamKey;
    mode: 'step' | 'ramp';
    points: AutomationPoint[];
};
export type ArrangerScene = {
    id: string;
    name: string;
    startBar: number;
    lengthBars: number;
    patternNodeIds: string[];
    rhythmNodeIds: string[];
    automationLanes: AutomationLane[];
};
export type AppEdgeData = {
    kind?: ConnectionKind;
    originalSource?: string;
    originalTarget?: string;
    targetParam?: AutomatableParamKey;
    mathTarget?: string;
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
type MixerStrip = {
    sourceId: string;
    input: Tone.Gain;
    panVol: Tone.PanVol;
};
type MixerChain = {
    output: Tone.PanVol;
    strips: Map<string, MixerStrip>;
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
    generatorMode?: GeneratorMode;
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
    low?: number;
    mid?: number;
    high?: number;
    lowFrequency?: number;
    highFrequency?: number;
    harmonicity?: number;
    modulationIndex?: number;
    pan?: number;
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
        mathInputTarget?: string;
        isPlaying?: boolean;
        mix?: number;
        wet?: number;
        roomSize?: number;
        delayTime?: number;
        feedback?: number;
        distortion?: number;
        frequency?: number;
        octaves?: number;
        bits?: number;
        depth?: number;
        pitch?: number;
        volume?: number;
        pan?: number;
        drumMode?: DrumMode;
        drumPattern?: DrumPattern;
        currentStep?: number;
        rootNote?: string;
        scaleType?: string;
        arpRate?: number;
        waveShape?: WaveShape;
        generatorMode?: GeneratorMode;
        harmonicity?: number;
        modulationIndex?: number;
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
        eqLow?: number;
        eqMid?: number;
        eqHigh?: number;
        eqLowFrequency?: number;
        eqHighFrequency?: number;
        lfoWaveform?: ModulationWaveShape;
        lfoDepth?: number;
        lfoSync?: boolean;
        lfoRate?: TransportRate;
        lfoHz?: number;
        patternNotes?: PatternNote[];
        patternLoopBars?: number;
        patternStepsPerBar?: number;
        mixerChannels?: MixerChannelState[];
        arrangerScenes?: ArrangerScene[];
        visualiserMode?: 'waveform' | 'spectrum' | 'vu' | 'lissajous';
    };
    type: AudioNodeType;
};

export type PatchAssetMetadata = {
    title?: string;
    description?: string;
    presetId?: string;
    scaffoldId?: string;
    blueprintId?: string;
    planId?: string;
    authoringMode?: 'inline' | 'scaffold' | 'compiled' | 'handmade';
    generatedAt?: string;
    globalKey?: string;
    brainRefs?: string[];
    validationPass?: boolean;
    errorCount?: number;
    warningCount?: number;
    groundedSong?: {
        version: number;
        plan_id: string;
        global_key: string;
        brain_refs: string[];
        validation_pass: boolean;
        error_count: number;
        warning_count: number;
    };
};

export type PatchAssetV1 = {
    version: 1;
    nodes?: AppNode[];
    edges?: AppEdge[];
    masterVolume?: number;
    metadata?: PatchAssetMetadata;
};

export type PatchValidationSeverity = 'warning' | 'error';

export type PatchValidationIssue = {
    severity: PatchValidationSeverity;
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
    sceneId?: string;
};

export type PatchValidationReport = {
    issues: PatchValidationIssue[];
    errorCount: number;
    warningCount: number;
    hasErrors: boolean;
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

type AutomatableParamDefinition = {
    key: AutomatableParamKey;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    supportsModulation?: boolean;
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

type CanvasDimsSource = {
    type: string;
    width?: number | null;
    height?: number | null;
    measured?: {
        width?: number | null;
        height?: number | null;
    };
};

// Fallback rendered pixel widths/heights per node type.
// Runtime dimensions from React Flow take precedence whenever they are available.
export const NODE_CANVAS_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    keys: { w: 288, h: 320 },
    midiin: { w: 256, h: 240 },
    moodpad: { w: 320, h: 416 },
    pulse: { w: 288, h: 280 },
    stepsequencer: { w: 352, h: 420 },
    pattern: { w: 352, h: 280 },
    lfo: { w: 256, h: 280 },
    chord: { w: 224, h: 240 },
    quantizer: { w: 240, h: 272 },
    adsr: { w: 224, h: 340 },
    generator: { w: 240, h: 220 },
    sampler: { w: 320, h: 432 },
    audioin: { w: 256, h: 272 },
    drum: { w: 320, h: 360 },
    advanceddrum: { w: 432, h: 420 },
    effect: { w: 224, h: 260 },
    eq: { w: 256, h: 320 },
    unison: { w: 224, h: 220 },
    detune: { w: 224, h: 200 },
    visualiser: { w: 288, h: 320 },
    speaker: { w: 224, h: 200 },
    mixer: { w: 320, h: 360 },
    tempo: { w: 256, h: 240 },
    arranger: { w: 352, h: 360 },
};
export const DEFAULT_NODE_CANVAS_DIMS = { w: 224, h: 220 };

export const getNodeCanvasDims = (source: CanvasDimsSource | string) => {
    if (typeof source === 'string') {
        return NODE_CANVAS_DIMS[source] ?? DEFAULT_NODE_CANVAS_DIMS;
    }

    const measuredWidth = source.measured?.width ?? source.width;
    const measuredHeight = source.measured?.height ?? source.height;

    if (
        typeof measuredWidth === 'number' &&
        measuredWidth > 0 &&
        typeof measuredHeight === 'number' &&
        measuredHeight > 0
    ) {
        return { w: measuredWidth, h: measuredHeight };
    }

    return NODE_CANVAS_DIMS[source.type] ?? DEFAULT_NODE_CANVAS_DIMS;
};

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

        const cDims = getNodeCanvasDims(currentNode);

        for (const other of allNodes) {
            if (clusterIds.has(other.id)) continue;
            if (other.type === 'tempo' || other.type === 'speaker') continue;

            const oDims = getNodeCanvasDims(other);
            const axis = getNodeAdjacencyAxis(currentNode.type, other.type);

            if (axis === 'horizontal') {
                const gapRight = other.position.x - (currentNode.position.x + cDims.w);
                const gapLeft = currentNode.position.x - (other.position.x + oDims.w);
                const horizGap = Math.max(gapRight, gapLeft);

                const cCentreY = currentNode.position.y + cDims.h / 2;
                const oCentreY = other.position.y + oDims.h / 2;
                const vertDist = Math.abs(cCentreY - oCentreY);

                if (horizGap >= -20 && horizGap <= ADJ_TOUCH_THRESHOLD && vertDist <= ADJ_Y_THRESHOLD) {
                    const leftNode = currentNode.position.x <= other.position.x ? currentNode : other;
                    const rightNode = currentNode.position.x <= other.position.x ? other : currentNode;
                    if (CONTROL_WIRE_PAIRS.has(`${leftNode.type}->${rightNode.type}`)) {
                        clusterIds.add(other.id);
                        queue.push(other.id);
                    }
                }
            } else if (axis === 'vertical') {
                const gapBelow = other.position.y - (currentNode.position.y + cDims.h);
                const gapAbove = currentNode.position.y - (other.position.y + oDims.h);
                const vGap = Math.max(gapBelow, gapAbove);

                const cCentreX = currentNode.position.x + cDims.w / 2;
                const oCentreX = other.position.x + oDims.w / 2;
                const hDist = Math.abs(cCentreX - oCentreX);

                if (vGap >= -20 && vGap <= ADJ_VERT_THRESHOLD && hDist <= ADJ_X_THRESHOLD) {
                    const topNode = currentNode.position.y <= other.position.y ? currentNode : other;
                    const bottomNode = currentNode.position.y <= other.position.y ? other : currentNode;
                    if (VALID_AUTO_WIRE_PAIRS.has(`${topNode.type}->${bottomNode.type}`)) {
                        clusterIds.add(other.id);
                        queue.push(other.id);
                    }
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
    arranger: -0.9,
    controller: 0,
    keys: 0,
    midiin: 0,
    moodpad: 0,
    pulse: 0,
    stepsequencer: 0.25,
    pattern: 0.3,
    lfo: 0.35,
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
    eq: 2,
    visualiser: 2.5,
    mixer: 2.8,
    speaker: 3,
};

const CONTROL_DOMAIN_TYPES = new Set<AudioNodeType>([
    'controller',
    'keys',
    'midiin',
    'moodpad',
    'pulse',
    'stepsequencer',
    'pattern',
    'lfo',
    'chord',
    'quantizer',
    'adsr',
    'arranger',
]);

export const isControlDomainNodeType = (type?: AudioNodeType | string | null) =>
    Boolean(type) && CONTROL_DOMAIN_TYPES.has(type as AudioNodeType);

export const getAdjacencyGlowClasses = (type?: AudioNodeType | string | null) =>
    isControlDomainNodeType(type)
        ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-[#39ff14] shadow-[0_0_24px_rgba(57,255,20,0.25)]'
        : ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]';

const CONTROL_INPUT_TYPES = new Set<AudioNodeType>([
    'controller',
    'keys',
    'stepsequencer',
    'pattern',
    'chord',
    'quantizer',
    'adsr',
    'generator',
    'sampler',
    'drum',
    'advanceddrum',
]);
const CONTROL_OUTPUT_TYPES = new Set<AudioNodeType>([
    'controller',
    'keys',
    'midiin',
    'moodpad',
    'pulse',
    'stepsequencer',
    'pattern',
    'chord',
    'quantizer',
    'adsr',
]);
const AUDIO_INPUT_TYPES = new Set<AudioNodeType>(['effect', 'eq', 'unison', 'detune', 'visualiser', 'speaker', 'mixer']);
const AUDIO_OUTPUT_TYPES = new Set<AudioNodeType>(['generator', 'sampler', 'audioin', 'drum', 'advanceddrum', 'effect', 'eq', 'unison', 'detune', 'visualiser']);

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
    'pattern->quantizer',
    'pattern->chord',
    'pattern->adsr',
    'pattern->generator',
    'pattern->sampler',
    'audioin->unison',
    'audioin->detune',
    'audioin->eq',
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
    'generator->eq',
    'sampler->eq',
    'drum->eq',
    'advanceddrum->eq',
    'audioin->mixer',
    'generator->mixer',
    'sampler->mixer',
    'drum->mixer',
    'advanceddrum->mixer',
    'effect->mixer',
    'eq->mixer',
    'unison->mixer',
    'detune->mixer',
    'visualiser->mixer',
    'unison->effect',
    'detune->effect',
    'eq->effect',
    'effect->eq',
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
    'eq->unison',
    'eq->detune',
    'unison->eq',
    'detune->eq',
    'generator->visualiser',
    'sampler->visualiser',
    'drum->visualiser',
    'advanceddrum->visualiser',
    'effect->visualiser',
    'eq->visualiser',
    'unison->visualiser',
    'detune->visualiser',
    'visualiser->effect',
    'visualiser->eq',
    'visualiser->unison',
    'visualiser->detune',
    'visualiser->visualiser',
    // Newly added controller->advanceddrum matches:
    'controller->advanceddrum',
    'midiin->advanceddrum',
    'keys->advanceddrum',
    'moodpad->advanceddrum',
    'stepsequencer->advanceddrum',
    'pattern->advanceddrum',
    'chord->advanceddrum',
    'quantizer->advanceddrum',
    'adsr->advanceddrum',
    // Newly added controller->drum matches for feature parity:
    'controller->drum',
    'moodpad->drum',
    'pulse->drum',
    'stepsequencer->drum',
    'pattern->drum',
    'quantizer->drum',
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
    'pattern->quantizer',
    'pattern->chord',
    'pattern->adsr',
    'pattern->generator',
    'pattern->sampler',
    // Newly added controller->advanceddrum matches:
    'controller->advanceddrum',
    'midiin->advanceddrum',
    'keys->advanceddrum',
    'moodpad->advanceddrum',
    'stepsequencer->advanceddrum',
    'pattern->advanceddrum',
    'chord->advanceddrum',
    'quantizer->advanceddrum',
    'adsr->advanceddrum',
    // Newly added controller->drum matches for feature parity:
    'controller->drum',
    'moodpad->drum',
    'pulse->drum',
    'stepsequencer->drum',
    'pattern->drum',
    'quantizer->drum',
]);

const clampTempoBpm = (bpm: number) =>
    Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(bpm)));

const clampVolumePercent = (volume: number) =>
    Math.min(100, Math.max(0, Math.round(volume)));

const hasSpeakerNode = (nodes: AppNode[]) =>
    nodes.some((node) => node.type === 'speaker');

const hasMixerNode = (nodes: AppNode[]) =>
    nodes.some((node) => node.type === 'mixer');

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
        mix: 60,
    }));
};

export const getSequencerStepMix = (step: SequencerStep) =>
    clampVolumePercent(step.mix ?? step.gate ?? 60);

export const createDefaultPatternClip = (): PatternClip => ({
    loopBars: 2,
    stepsPerBar: PATTERN_STEPS_PER_BAR,
    notes: [
        { id: crypto.randomUUID(), note: 'C4', startStep: 0, lengthSteps: 4, velocity: 0.85 },
        { id: crypto.randomUUID(), note: 'E4', startStep: 4, lengthSteps: 4, velocity: 0.75 },
        { id: crypto.randomUUID(), note: 'G4', startStep: 8, lengthSteps: 4, velocity: 0.8 },
        { id: crypto.randomUUID(), note: 'B4', startStep: 12, lengthSteps: 4, velocity: 0.7 },
    ],
});

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

export type MathTargetKind = 'number' | 'int' | 'toggle' | 'enum' | 'contextual';
export type MathTargetOption = {
    value: string;
    label: string;
};
export type MathTargetContext = {
    selectedPatternNoteId?: string | null;
    selectedArrangerSceneId?: string | null;
};

type MathTargetDescriptor = {
    id: string;
    label: string;
    kind: MathTargetKind;
};

const MATH_NONE_TARGET = 'none';
const MATH_NONE_OPTION: MathTargetOption = {
    value: MATH_NONE_TARGET,
    label: '— no target —',
};
const GENERATOR_WAVE_OPTIONS: WaveShape[] = ['sine', 'square', 'triangle', 'sawtooth'];
const GENERATOR_MODE_OPTIONS: GeneratorMode[] = ['wave', 'fm', 'am', 'noise'];
const EFFECT_SUBTYPE_OPTIONS = ['reverb', 'delay', 'distortion', 'phaser', 'bitcrusher'] as const;
const LFO_WAVE_OPTIONS: ModulationWaveShape[] = ['sine', 'triangle', 'square', 'sawtooth'];
const SEQUENCER_NOTE_OPTIONS = SONG_NOTE_OPTIONS;
const PULSE_NOTE_OPTIONS = SONG_NOTE_OPTIONS;
const PATTERN_NOTE_OPTIONS = PIANO_ROLL_NOTE_OPTIONS;
const VISUALISER_MODE_OPTIONS = ['waveform', 'spectrum', 'vu', 'lissajous'] as const;
const ADVANCED_DRUM_TRACK_LENGTHS = [4, 8, 12, 16] as const;
const DEFAULT_ARP_RATE_MS = 200;

const asMathOptions = (descriptors: MathTargetDescriptor[]): MathTargetOption[] => [
    MATH_NONE_OPTION,
    ...descriptors.map((descriptor) => ({
        value: descriptor.id,
        label: descriptor.label,
    })),
];

const mapMathRange = (value: number, min: number, max: number) =>
    min + Math.max(0, Math.min(1, value)) * (max - min);

const mapMathIntRange = (value: number, min: number, max: number) =>
    Math.round(mapMathRange(value, min, max));

const mapMathToggle = (value: number) =>
    Math.max(0, Math.min(1, value)) >= 0.5;

const mapMathEnum = <T extends string | number>(value: number, options: readonly T[]) => {
    const safeOptions = options.length > 0 ? options : [0 as T];
    const index = Math.min(
        safeOptions.length - 1,
        Math.floor(Math.max(0, Math.min(1, value)) * safeOptions.length)
    );
    return safeOptions[index] ?? safeOptions[0];
};

const withNoteLabel = (value: string) => value.replace('#', '♯');

export const getMathTargetOptionsForNode = (
    node: Pick<AppNode, 'type' | 'data'> | undefined,
    context: MathTargetContext = {}
): MathTargetOption[] => {
    if (!node) {
        return [MATH_NONE_OPTION];
    }

    const descriptors: MathTargetDescriptor[] = [];

    switch (node.type) {
        case 'generator': {
            const generatorMode = getGeneratorMode(node.data);
            descriptors.push(
                { id: 'mix', label: 'Mix', kind: 'number' },
                { id: 'generatorMode', label: 'Voice Mode', kind: 'enum' }
            );
            if (generatorMode !== 'noise') {
                descriptors.push({ id: 'waveShape', label: 'Wave Shape', kind: 'enum' });
            }
            if (generatorMode === 'fm' || generatorMode === 'am') {
                descriptors.push({ id: 'harmonicity', label: 'Harmonicity', kind: 'number' });
            }
            if (generatorMode === 'fm') {
                descriptors.push({ id: 'modulationIndex', label: 'Mod Index', kind: 'number' });
            }
            break;
        }
        case 'effect': {
            const subType = node.data.subType ?? 'reverb';
            descriptors.push(
                { id: 'wet', label: 'Mix', kind: 'number' },
                { id: 'subType', label: 'Effect Type', kind: 'enum' }
            );
            if (subType === 'reverb') descriptors.push({ id: 'roomSize', label: 'Room Size', kind: 'number' });
            if (subType === 'delay') {
                descriptors.push(
                    { id: 'delayTime', label: 'Delay Time', kind: 'number' },
                    { id: 'feedback', label: 'Feedback', kind: 'number' }
                );
            }
            if (subType === 'distortion') descriptors.push({ id: 'distortion', label: 'Drive', kind: 'number' });
            if (subType === 'phaser') descriptors.push({ id: 'frequency', label: 'Speed', kind: 'number' });
            if (subType === 'bitcrusher') descriptors.push({ id: 'bits', label: 'Bit Depth', kind: 'int' });
            break;
        }
        case 'speaker':
            descriptors.push({ id: 'volume', label: 'Volume', kind: 'number' });
            break;
        case 'controller':
            descriptors.push(
                { id: 'rootNote', label: 'Root', kind: 'enum' },
                { id: 'scaleType', label: 'Scale', kind: 'enum' },
                { id: 'arpRate', label: 'Arp Rate', kind: 'number' }
            );
            break;
        case 'adsr':
            descriptors.push(
                { id: 'attack', label: 'Attack', kind: 'number' },
                { id: 'decay', label: 'Decay', kind: 'number' },
                { id: 'sustain', label: 'Sustain', kind: 'number' },
                { id: 'release', label: 'Release', kind: 'number' }
            );
            break;
        case 'audioin':
            descriptors.push({ id: 'inputGain', label: 'Mix', kind: 'number' });
            break;
        case 'drum':
            descriptors.push(
                { id: 'mix', label: 'Mix', kind: 'number' },
                { id: 'drumMode', label: 'Mode', kind: 'enum' }
            );
            break;
        case 'advanceddrum': {
            descriptors.push(
                { id: 'mix', label: 'Mix', kind: 'number' },
                { id: 'swing', label: 'Swing', kind: 'number' }
            );
            const tracks = node.data.advancedDrumTracks ?? createDefaultAdvancedDrumTracks();
            tracks.forEach((track: AdvancedDrumTrackData, index: number) => {
                descriptors.push({
                    id: `advanceddrum:track:length:${index}`,
                    label: `${track.label} Length`,
                    kind: 'contextual',
                });
            });
            break;
        }
        case 'unison':
            descriptors.push(
                { id: 'wet', label: 'Mix', kind: 'number' },
                { id: 'depth', label: 'Depth', kind: 'number' },
                { id: 'frequency', label: 'Speed', kind: 'number' }
            );
            break;
        case 'detune':
            descriptors.push(
                { id: 'wet', label: 'Mix', kind: 'number' },
                { id: 'pitch', label: 'Pitch', kind: 'number' }
            );
            break;
        case 'eq':
            descriptors.push(
                { id: 'low', label: 'Low', kind: 'number' },
                { id: 'mid', label: 'Mid', kind: 'number' },
                { id: 'high', label: 'High', kind: 'number' },
                { id: 'lowFrequency', label: 'Low Xover', kind: 'number' },
                { id: 'highFrequency', label: 'High Xover', kind: 'number' }
            );
            break;
        case 'sampler':
            descriptors.push(
                { id: 'mix', label: 'Mix', kind: 'number' },
                { id: 'loop', label: 'Loop', kind: 'toggle' },
                { id: 'playbackRate', label: 'Speed', kind: 'number' },
                { id: 'pitchShift', label: 'Pitch', kind: 'int' },
                { id: 'reverse', label: 'Reverse', kind: 'toggle' }
            );
            break;
        case 'tempo':
            descriptors.push({ id: 'bpm', label: 'BPM', kind: 'int' });
            break;
        case 'lfo':
            descriptors.push(
                { id: 'lfoWaveform', label: 'Wave', kind: 'enum' },
                { id: 'lfoSync', label: 'Sync', kind: 'toggle' },
                { id: 'lfoDepth', label: 'Depth', kind: 'number' }
            );
            descriptors.push(
                node.data.lfoSync ?? true
                    ? { id: 'lfoRate', label: 'Rate', kind: 'enum' }
                    : { id: 'lfoHz', label: 'Hz', kind: 'number' }
            );
            break;
        case 'quantizer':
            descriptors.push(
                { id: 'rootNote', label: 'Root', kind: 'enum' },
                { id: 'scaleType', label: 'Scale', kind: 'enum' },
                { id: 'bypass', label: 'Bypass', kind: 'toggle' }
            );
            break;
        case 'keys':
            descriptors.push({ id: 'octave', label: 'Octave', kind: 'int' });
            break;
        case 'chord':
            descriptors.push({ id: 'subType', label: 'Quality', kind: 'enum' });
            break;
        case 'visualiser':
            descriptors.push({ id: 'visualiserMode', label: 'Mode', kind: 'enum' });
            break;
        case 'mixer': {
            descriptors.push(
                { id: 'volume', label: 'Master Volume', kind: 'number' },
                { id: 'pan', label: 'Master Pan', kind: 'number' }
            );
            (node.data.mixerChannels ?? []).forEach((channel: MixerChannelState) => {
                const channelLabel = channel.sourceId;
                descriptors.push(
                    {
                        id: `mixer:channel:volume:${channel.sourceId}`,
                        label: `${channelLabel} Vol`,
                        kind: 'contextual',
                    },
                    {
                        id: `mixer:channel:pan:${channel.sourceId}`,
                        label: `${channelLabel} Pan`,
                        kind: 'contextual',
                    },
                    {
                        id: `mixer:channel:muted:${channel.sourceId}`,
                        label: `${channelLabel} Mute`,
                        kind: 'contextual',
                    },
                    {
                        id: `mixer:channel:solo:${channel.sourceId}`,
                        label: `${channelLabel} Solo`,
                        kind: 'contextual',
                    }
                );
            });
            break;
        }
        case 'pulse':
            descriptors.push(
                { id: 'pulseSync', label: 'Sync', kind: 'toggle' },
                node.data.pulseSync ?? true
                    ? { id: 'pulseRate', label: 'Division', kind: 'enum' }
                    : { id: 'pulseIntervalMs', label: 'Interval', kind: 'number' },
                { id: 'pulseNote', label: 'Trigger Note', kind: 'enum' }
            );
            break;
        case 'moodpad':
            descriptors.push(
                { id: 'moodX', label: 'Mood', kind: 'number' },
                { id: 'moodY', label: 'Register', kind: 'number' }
            );
            break;
        case 'stepsequencer': {
            const selectedStep = node.data.selectedStep ?? 0;
            descriptors.push(
                { id: 'sequenceSync', label: 'Sync', kind: 'toggle' },
                node.data.sequenceSync ?? true
                    ? { id: 'sequenceRate', label: 'Rate', kind: 'enum' }
                    : { id: 'sequenceIntervalMs', label: 'Interval', kind: 'number' },
                { id: 'selectedStep', label: 'Selected Step', kind: 'int' },
                {
                    id: `stepsequencer:step:enabled:${selectedStep}`,
                    label: `Step ${selectedStep + 1} Enabled`,
                    kind: 'contextual',
                },
                {
                    id: `stepsequencer:step:note:${selectedStep}`,
                    label: `Step ${selectedStep + 1} Pitch`,
                    kind: 'contextual',
                },
                {
                    id: `stepsequencer:step:mix:${selectedStep}`,
                    label: `Step ${selectedStep + 1} Mix`,
                    kind: 'contextual',
                }
            );
            break;
        }
        case 'pattern': {
            descriptors.push({ id: 'patternLoopBars', label: 'Loop Bars', kind: 'int' });
            const selectedNoteId = context.selectedPatternNoteId;
            const selectedNote = (node.data.patternNotes ?? []).find((note: PatternNote) => note.id === selectedNoteId);
            if (selectedNote) {
                descriptors.push(
                    {
                        id: `pattern:note:note:${selectedNote.id}`,
                        label: `${withNoteLabel(selectedNote.note)} Pitch`,
                        kind: 'contextual',
                    },
                    {
                        id: `pattern:note:startStep:${selectedNote.id}`,
                        label: `${withNoteLabel(selectedNote.note)} Start`,
                        kind: 'contextual',
                    },
                    {
                        id: `pattern:note:lengthSteps:${selectedNote.id}`,
                        label: `${withNoteLabel(selectedNote.note)} Length`,
                        kind: 'contextual',
                    },
                    {
                        id: `pattern:note:velocity:${selectedNote.id}`,
                        label: `${withNoteLabel(selectedNote.note)} Velocity`,
                        kind: 'contextual',
                    }
                );
            }
            break;
        }
        case 'arranger': {
            const selectedSceneId = context.selectedArrangerSceneId;
            const selectedScene = (node.data.arrangerScenes ?? []).find((scene: ArrangerScene) => scene.id === selectedSceneId);
            if (selectedScene) {
                descriptors.push(
                    {
                        id: `arranger:scene:startBar:${selectedScene.id}`,
                        label: `${selectedScene.name} Start`,
                        kind: 'contextual',
                    },
                    {
                        id: `arranger:scene:lengthBars:${selectedScene.id}`,
                        label: `${selectedScene.name} Length`,
                        kind: 'contextual',
                    }
                );
            }
            break;
        }
        default:
            break;
    }

    return asMathOptions(descriptors);
};

export const getGeneratorMode = (nodeData?: Partial<AppNode['data']>) => {
    if (nodeData?.generatorMode) {
        return nodeData.generatorMode;
    }

    if (nodeData?.waveShape === 'noise') {
        return 'noise';
    }

    return 'wave';
};

const isGeneratorMode = (value?: string): value is GeneratorMode =>
    value === 'wave' || value === 'noise' || value === 'fm' || value === 'am';

const isPatternRuntimeNode = (type: AudioNodeType) =>
    type === 'pulse' ||
    type === 'stepsequencer' ||
    type === 'pattern' ||
    type === 'advanceddrum' ||
    type === 'arranger';

const shouldInitAudioNode = (node: AppNode) =>
    node.type === 'generator' ||
    node.type === 'sampler' ||
    node.type === 'audioin' ||
    node.type === 'drum' ||
    node.type === 'advanceddrum' ||
    node.type === 'effect' ||
    node.type === 'eq' ||
    node.type === 'unison' ||
    node.type === 'detune' ||
    node.type === 'visualiser' ||
    node.type === 'mixer';

const getNodeInitSubType = (node: AppNode) => {
    if (node.type === 'generator') {
        return getGeneratorMode(node.data);
    }

    return node.data.subType && node.data.subType !== 'none'
        ? node.data.subType
        : undefined;
};

export const patternStepToTransportPosition = (step: number, stepsPerBar = PATTERN_STEPS_PER_BAR) => {
    const safeStepsPerBar = Math.max(1, stepsPerBar);
    const bars = Math.floor(step / safeStepsPerBar);
    const stepWithinBar = step % safeStepsPerBar;
    const quarters = Math.floor(stepWithinBar / 4);
    const sixteenths = stepWithinBar % 4;
    return `${bars}:${quarters}:${sixteenths}`;
};

export const patternStepLengthToToneTime = (lengthSteps: number, stepsPerBar = PATTERN_STEPS_PER_BAR) => {
    const safeLength = Math.max(1, lengthSteps);
    const safeStepsPerBar = Math.max(1, stepsPerBar);
    const bars = Math.floor(safeLength / safeStepsPerBar);
    const stepWithinBar = safeLength % safeStepsPerBar;
    const quarters = Math.floor(stepWithinBar / 4);
    const sixteenths = stepWithinBar % 4;
    return `${bars}:${quarters}:${sixteenths}`;
};

export const AUTOMATABLE_PARAM_REGISTRY: Partial<Record<AudioNodeType, AutomatableParamDefinition[]>> = {
    generator: [
        { key: 'mix', label: 'Mix', min: 0, max: 100, step: 1, defaultValue: 80 },
        { key: 'harmonicity', label: 'Harmonicity', min: 0.25, max: 8, step: 0.05, defaultValue: 1 },
        { key: 'modulationIndex', label: 'Mod Index', min: 0.5, max: 20, step: 0.1, defaultValue: 4 },
    ],
    sampler: [
        { key: 'mix', label: 'Mix', min: 0, max: 100, step: 1, defaultValue: 80 },
        { key: 'playbackRate', label: 'Speed', min: 0.25, max: 2, step: 0.01, defaultValue: 1 },
        { key: 'pitchShift', label: 'Pitch Shift', min: -12, max: 12, step: 1, defaultValue: 0 },
    ],
    drum: [
        { key: 'mix', label: 'Mix', min: 0, max: 100, step: 1, defaultValue: 80 },
    ],
    advanceddrum: [
        { key: 'mix', label: 'Mix', min: 0, max: 100, step: 1, defaultValue: 80 },
    ],
    effect: [
        { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, defaultValue: 0.5, supportsModulation: true },
        { key: 'roomSize', label: 'Room Size', min: 0, max: 1, step: 0.01, defaultValue: 0.5, supportsModulation: true },
        { key: 'delayTime', label: 'Delay Time', min: 0.05, max: 1.2, step: 0.01, defaultValue: 0.45, supportsModulation: true },
        { key: 'feedback', label: 'Feedback', min: 0, max: 0.95, step: 0.01, defaultValue: 0.4, supportsModulation: true },
        { key: 'frequency', label: 'Frequency', min: 0.1, max: 20, step: 0.1, defaultValue: 4, supportsModulation: true },
    ],
    eq: [
        { key: 'low', label: 'Low', min: -24, max: 24, step: 1, defaultValue: 0, supportsModulation: true },
        { key: 'mid', label: 'Mid', min: -24, max: 24, step: 1, defaultValue: 0, supportsModulation: true },
        { key: 'high', label: 'High', min: -24, max: 24, step: 1, defaultValue: 0, supportsModulation: true },
        { key: 'lowFrequency', label: 'Low Xover', min: 80, max: 1200, step: 5, defaultValue: 320, supportsModulation: true },
        { key: 'highFrequency', label: 'High Xover', min: 1200, max: 8000, step: 10, defaultValue: 2800, supportsModulation: true },
    ],
    unison: [
        { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, defaultValue: 0.5, supportsModulation: true },
        { key: 'frequency', label: 'Rate', min: 0.1, max: 10, step: 0.1, defaultValue: 3.35, supportsModulation: true },
        { key: 'depth', label: 'Depth', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    ],
    detune: [
        { key: 'wet', label: 'Wet', min: 0, max: 1, step: 0.01, defaultValue: 1, supportsModulation: true },
        { key: 'pitch', label: 'Pitch', min: -12, max: 12, step: 0.1, defaultValue: 0 },
    ],
    mixer: [
        { key: 'volume', label: 'Volume', min: 0, max: 100, step: 1, defaultValue: 70 },
        { key: 'pan', label: 'Pan', min: -1, max: 1, step: 0.05, defaultValue: 0 },
    ],
};

export const getAutomatableParamsForNode = (type?: AudioNodeType | null) =>
    type ? AUTOMATABLE_PARAM_REGISTRY[type] ?? [] : [];

const getAutomatableParamDefinition = (type: AudioNodeType, key: AutomatableParamKey) =>
    getAutomatableParamsForNode(type).find((definition) => definition.key === key);

export const getNodeAutomatableValue = (
    nodeData: Partial<AppNode['data']> | undefined,
    paramKey: AutomatableParamKey
) => {
    if (!nodeData) {
        return 0;
    }

    switch (paramKey) {
        case 'mix':
            return nodeData.mix ?? 80;
        case 'playbackRate':
            return nodeData.playbackRate ?? 1;
        case 'pitchShift':
            return nodeData.pitchShift ?? 0;
        case 'wet':
            return nodeData.wet ?? 0.5;
        case 'roomSize':
            return nodeData.roomSize ?? 0.5;
        case 'delayTime':
            return nodeData.delayTime ?? 0.45;
        case 'feedback':
            return nodeData.feedback ?? 0.4;
        case 'frequency':
            return nodeData.frequency ?? 4;
        case 'depth':
            return nodeData.depth ?? 0.7;
        case 'pitch':
            return nodeData.pitch ?? 0;
        case 'low':
            return nodeData.eqLow ?? 0;
        case 'mid':
            return nodeData.eqMid ?? 0;
        case 'high':
            return nodeData.eqHigh ?? 0;
        case 'lowFrequency':
            return nodeData.eqLowFrequency ?? 320;
        case 'highFrequency':
            return nodeData.eqHighFrequency ?? 2800;
        case 'harmonicity':
            return nodeData.harmonicity ?? 1;
        case 'modulationIndex':
            return nodeData.modulationIndex ?? 4;
        case 'volume':
            return nodeData.volume ?? 70;
        case 'pan':
            return nodeData.pan ?? 0;
        default:
            return 0;
    }
};

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

const createGeneratorAudioNode = (nodeData?: Partial<AppNode['data']>) => {
    const generatorMode = getGeneratorMode(nodeData);
    const mix = nodeData?.mix ?? 80;
    const waveShape = nodeData?.waveShape && nodeData.waveShape !== 'noise'
        ? nodeData.waveShape
        : 'sine';

    if (generatorMode === 'noise') {
        const noise = new Tone.Noise({ type: 'white' });
        noise.volume.value = volumePercentToDb(mix);
        return noise;
    }

    if (generatorMode === 'fm') {
        return new Tone.PolySynth(Tone.FMSynth, {
            volume: volumePercentToDb(mix),
            oscillator: { type: waveShape },
            harmonicity: nodeData?.harmonicity ?? 1,
            modulationIndex: nodeData?.modulationIndex ?? 4,
        });
    }

    if (generatorMode === 'am') {
        return new Tone.PolySynth(Tone.AMSynth, {
            volume: volumePercentToDb(mix),
            oscillator: { type: waveShape },
            harmonicity: nodeData?.harmonicity ?? 1,
        });
    }

    return new Tone.PolySynth(Tone.Synth, {
        volume: volumePercentToDb(mix),
        oscillator: { type: waveShape },
    });
};

const disposeMixerChain = (chain: MixerChain) => {
    chain.strips.forEach((strip) => {
        strip.input.disconnect().dispose();
        strip.panVol.disconnect().dispose();
    });
    chain.output.disconnect().dispose();
};

export const isTempoEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'tempo' ||
    edge.sourceHandle === TEMPO_OUTPUT_HANDLE_ID ||
    edge.targetHandle === TEMPO_INPUT_HANDLE_ID;

export const isControlEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'control' ||
    edge.sourceHandle === CONTROL_OUTPUT_HANDLE_ID ||
    edge.targetHandle === CONTROL_INPUT_HANDLE_ID;

export const isModulationEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'modulation' ||
    edge.sourceHandle === MODULATION_OUTPUT_HANDLE_ID ||
    Boolean(getModulationParamFromHandle(edge.targetHandle));

export const isMathEdge = (edge: Edge<AppEdgeData>) =>
    edge.data?.kind === 'math' ||
    edge.sourceHandle === MATH_OUTPUT_HANDLE_ID ||
    edge.targetHandle === MATH_INPUT_HANDLE_ID;

export const isAudioEdge = (edge: Edge<AppEdgeData>) =>
    !isTempoEdge(edge) && !isControlEdge(edge) && !isModulationEdge(edge) && !isMathEdge(edge);

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

    const modulationParam = getModulationParamFromHandle(connection.targetHandle);
    const isModulationConn =
        connection.sourceHandle === MODULATION_OUTPUT_HANDLE_ID &&
        Boolean(modulationParam) &&
        sourceNode.type === 'lfo';

    const isMathConn =
        connection.sourceHandle === MATH_OUTPUT_HANDLE_ID &&
        connection.targetHandle === MATH_INPUT_HANDLE_ID;

    if (isMathConn) {
        return !edges.some((edge) =>
            edge.id !== ignoredEdgeId &&
            edge.source === connection.source &&
            edge.target === connection.target &&
            edge.sourceHandle === connection.sourceHandle &&
            edge.targetHandle === connection.targetHandle
        );
    }

    if (isModulationConn) {
        if (!modulationParam) {
            return false;
        }

        const paramDefinition = getAutomatableParamDefinition(targetNode.type, modulationParam);
        if (!paramDefinition?.supportsModulation) {
            return false;
        }

        return !edges.some((edge) =>
            edge.id !== ignoredEdgeId &&
            edge.source === connection.source &&
            edge.target === connection.target &&
            edge.sourceHandle === connection.sourceHandle &&
            edge.targetHandle === connection.targetHandle
        );
    }

    // Singletons cannot be wired in audio/control domains.
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
    if (connection.sourceHandle === MATH_OUTPUT_HANDLE_ID) return 'math';
    if (connection.sourceHandle === MODULATION_OUTPUT_HANDLE_ID) return 'modulation';
    if (connection.sourceHandle === CONTROL_OUTPUT_HANDLE_ID) return 'control';
    if (connection.sourceHandle === AUDIO_OUTPUT_HANDLE_ID) return 'audio';
    return null;
};

const getEdgePresentation = (kind: ConnectionKind) => {
    if (kind === 'math') {
        return {
            style: {
                stroke: MATH_SIGNAL_COLOR,
                strokeWidth: 2,
                strokeDasharray: '4 2',
                filter: `drop-shadow(0 0 6px ${MATH_SIGNAL_COLOR})`,
            },
            data: { kind },
        };
    }
    if (kind === 'modulation') {
        return {
            style: {
                stroke: MODULATION_SIGNAL_COLOR,
                strokeWidth: 2,
                strokeDasharray: '3 3',
                filter: `drop-shadow(0 0 6px ${MODULATION_SIGNAL_COLOR})`,
            },
            data: { kind },
        };
    }
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

const clamp01 = (value: number, fallback = 0) =>
    Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

const clampSignedUnit = (value: number, fallback = 0) =>
    Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : fallback;

const coerceNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const dedupeIds = (ids: string[] = []) =>
    Array.from(new Set(ids.filter((entry) => typeof entry === 'string' && entry.length > 0)));

const getNearestAdvancedDrumTrackLength = (length: unknown) =>
    ADVANCED_DRUM_TRACK_LENGTHS.reduce((closest, candidate) => {
        const target = typeof length === 'number' && Number.isFinite(length) ? length : 16;
        return Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest;
    }, ADVANCED_DRUM_TRACK_LENGTHS[ADVANCED_DRUM_TRACK_LENGTHS.length - 1]);

const createDefaultArrangerScene = (): ArrangerScene => ({
    id: crypto.randomUUID(),
    name: 'Intro',
    startBar: 0,
    lengthBars: 4,
    patternNodeIds: [],
    rhythmNodeIds: [],
    automationLanes: [],
});

const normalizeAutomationPoint = (
    point: Partial<AutomationPoint> | undefined,
    fallbackId: string,
    sceneLengthBars: number
): AutomationPoint => ({
    id: point?.id ?? fallbackId,
    barOffset: Math.max(0, Math.min(sceneLengthBars, Math.round(coerceNumber(point?.barOffset, 0) * 100) / 100)),
    value: coerceNumber(point?.value, 0),
    durationBars:
        typeof point?.durationBars === 'number' && Number.isFinite(point.durationBars)
            ? Math.max(0, point.durationBars)
            : undefined,
});

const normalizeArrangerScene = (
    scene: Partial<ArrangerScene> | undefined,
    fallbackName: string
): ArrangerScene => {
    const lengthBars = Math.max(1, Math.min(32, Math.round(coerceNumber(scene?.lengthBars, 4))));

    return {
        id: scene?.id ?? crypto.randomUUID(),
        name: scene?.name?.trim() || fallbackName,
        startBar: Math.max(0, Math.round(coerceNumber(scene?.startBar, 0))),
        lengthBars,
        patternNodeIds: dedupeIds(scene?.patternNodeIds),
        rhythmNodeIds: dedupeIds(scene?.rhythmNodeIds),
        automationLanes: (scene?.automationLanes ?? []).map((lane: AutomationLane, laneIndex: number) => ({
            id: lane.id ?? `lane-${laneIndex + 1}`,
            targetNodeId: lane.targetNodeId ?? '',
            targetParam: lane.targetParam ?? 'mix',
            mode: lane.mode === 'step' ? 'step' : 'ramp',
            points: (lane.points ?? []).map((point: AutomationPoint, pointIndex: number) =>
                normalizeAutomationPoint(point, `point-${laneIndex + 1}-${pointIndex + 1}`, lengthBars)
            ),
        })),
    };
};

const normalizePatternClipData = (
    nodeData: Partial<AppNode['data']> | undefined
): PatternClip => {
    const loopBars = Math.max(1, Math.min(16, Math.round(coerceNumber(nodeData?.patternLoopBars, 2))));
    const stepsPerBar = Math.max(1, Math.round(coerceNumber(nodeData?.patternStepsPerBar, PATTERN_STEPS_PER_BAR)));
    const totalSteps = loopBars * stepsPerBar;
    const fallbackNotes = createDefaultPatternClip().notes;
    const rawNotes: PatternNote[] = nodeData?.patternNotes?.length ? nodeData.patternNotes : fallbackNotes;

    const notes = rawNotes.map((note: PatternNote, index: number) => {
        const startStep = Math.max(0, Math.min(totalSteps - 1, Math.round(coerceNumber(note.startStep, index * 4))));
        return {
            id: note.id ?? crypto.randomUUID(),
            note: note.note ?? fallbackNotes[index % fallbackNotes.length]?.note ?? 'C4',
            startStep,
            lengthSteps: Math.max(
                1,
                Math.min(totalSteps - startStep, Math.round(coerceNumber(note.lengthSteps, 1)))
            ),
            velocity: Math.max(0.05, Math.min(1, coerceNumber(note.velocity, 0.75))),
        };
    });

    return {
        notes,
        loopBars,
        stepsPerBar,
    };
};

const normalizePatchNode = (
    node: AppNode,
    masterVolume = DEFAULT_MASTER_VOLUME
): AppNode => {
    const normalizedPatternClip = node.type === 'pattern'
        ? normalizePatternClipData(node.data)
        : null;
    const defaultScene = createDefaultArrangerScene();

    const normalizedNode =
        node.type === 'tempo'
            ? {
                ...node,
                data: {
                    ...node.data,
                    label: node.data.label || 'Tempo',
                    bpm: clampTempoBpm(coerceNumber(node.data.bpm, DEFAULT_TRANSPORT_BPM)),
                },
            }
            : node.type === 'speaker'
                ? {
                    ...node,
                    data: {
                        ...node.data,
                        label: node.data.label || 'Master Out',
                        volume: clampVolumePercent(coerceNumber(node.data.volume, masterVolume)),
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
                            arpRate: Math.max(50, Math.round(coerceNumber(node.data.arpRate, DEFAULT_ARP_RATE_MS))),
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
                                    inputGain: clampVolumePercent(coerceNumber(node.data.inputGain, 75)),
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
                                            generatorMode: node.data.generatorMode ?? getGeneratorMode(node.data),
                                            mix: clampVolumePercent(coerceNumber(node.data.mix, 80)),
                                            harmonicity: coerceNumber(node.data.harmonicity, 1),
                                            modulationIndex: coerceNumber(node.data.modulationIndex, 4),
                                        },
                                    }
                                    : node.type === 'sampler'
                                        ? {
                                            ...node,
                                            data: {
                                                ...node.data,
                                                label: node.data.label || 'Sampler',
                                                hasSample: node.data.hasSample ?? Boolean(node.data.sampleDataUrl),
                                                sampleName: node.data.sampleName ?? '',
                                                sampleDataUrl: node.data.sampleDataUrl,
                                                sampleWaveform: node.data.sampleWaveform ?? [],
                                                loop: node.data.loop ?? false,
                                                playbackRate: Math.max(0.25, Math.min(2, coerceNumber(node.data.playbackRate, 1))),
                                                reverse: node.data.reverse ?? false,
                                                pitchShift: Math.max(-12, Math.min(12, Math.round(coerceNumber(node.data.pitchShift, 0)))),
                                                mix: clampVolumePercent(coerceNumber(node.data.mix, 80)),
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
                                                    mix: clampVolumePercent(coerceNumber(node.data.mix, 80)),
                                                    currentStep: Math.round(coerceNumber(node.data.currentStep, -1)),
                                                    isPlaying: node.data.isPlaying ?? false,
                                                },
                                            }
                                            : node.type === 'advanceddrum'
                                                ? {
                                                    ...node,
                                                    data: {
                                                        ...node.data,
                                                        label: node.data.label || 'Advanced Drums',
                                                        advancedDrumTracks: (node.data.advancedDrumTracks ?? createDefaultAdvancedDrumTracks()).map((track: AdvancedDrumTrackData, index: number) => ({
                                                            label: track.label ?? `Track ${index + 1}`,
                                                            steps: Array.from({ length: DRUM_STEP_COUNT }, (_, stepIndex) =>
                                                                Math.max(0, Math.min(3, Math.round(coerceNumber(track.steps?.[stepIndex], 0))))
                                                            ),
                                                            length: getNearestAdvancedDrumTrackLength(track.length),
                                                            sampleName: track.sampleName,
                                                            sampleDataUrl: track.sampleDataUrl,
                                                        })),
                                                        mix: clampVolumePercent(coerceNumber(node.data.mix, 80)),
                                                        swing: clamp01(coerceNumber(node.data.swing, 0)),
                                                        currentStep: Math.round(coerceNumber(node.data.currentStep, -1)),
                                                        isPlaying: node.data.isPlaying ?? false,
                                                    },
                                                }
                                                : node.type === 'pulse'
                                                    ? {
                                                        ...node,
                                                        data: {
                                                            ...node.data,
                                                            label: node.data.label || 'Bloop',
                                                            pulseSync: node.data.pulseSync ?? true,
                                                            pulseRate: node.data.pulseRate ?? '4n',
                                                            pulseIntervalMs: Math.max(50, Math.round(coerceNumber(node.data.pulseIntervalMs, 500))),
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
                                                                stepSequence: (node.data.stepSequence ?? createDefaultStepSequence()).map((step: SequencerStep, index: number) => ({
                                                                    enabled: step.enabled ?? index < 4,
                                                                    note: step.note ?? createDefaultStepSequence()[index]?.note ?? DEFAULT_PULSE_NOTE,
                                                                    mix: clampVolumePercent(coerceNumber(step.mix ?? step.gate, 60)),
                                                                })),
                                                                selectedStep: Math.max(
                                                                    0,
                                                                    Math.min(
                                                                        (node.data.stepSequence ?? createDefaultStepSequence()).length - 1,
                                                                        Math.round(coerceNumber(node.data.selectedStep, 0))
                                                                    )
                                                                ),
                                                                currentStep: Math.round(coerceNumber(node.data.currentStep, -1)),
                                                                sequenceSync: node.data.sequenceSync ?? true,
                                                                sequenceRate: node.data.sequenceRate ?? '8n',
                                                                sequenceIntervalMs: Math.max(50, Math.round(coerceNumber(node.data.sequenceIntervalMs, 250))),
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
                                                                        moodX: clamp01(coerceNumber(node.data.moodX, 0.35)),
                                                                        moodY: clamp01(coerceNumber(node.data.moodY, 0.55)),
                                                                    },
                                                                }
                                                                : node.type === 'effect'
                                                                    ? {
                                                                        ...node,
                                                                        data: {
                                                                            ...node.data,
                                                                            label: node.data.label || 'Effect',
                                                                            subType: node.data.subType ?? 'reverb',
                                                                            wet: clamp01(coerceNumber(node.data.wet, 0.5)),
                                                                            roomSize: clamp01(coerceNumber(node.data.roomSize, 0.5)),
                                                                            delayTime: Math.max(0.05, Math.min(1.2, coerceNumber(node.data.delayTime, 0.45))),
                                                                            feedback: clamp01(coerceNumber(node.data.feedback, 0.4)),
                                                                            distortion: clamp01(coerceNumber(node.data.distortion, 0.5)),
                                                                            frequency: Math.max(0.1, Math.min(20, coerceNumber(node.data.frequency, 4))),
                                                                            octaves: Math.max(1, Math.round(coerceNumber(node.data.octaves, 5))),
                                                                            bits: Math.max(1, Math.round(coerceNumber(node.data.bits, 4))),
                                                                        },
                                                                    }
                                                                    : node.type === 'eq'
                                                                        ? {
                                                                            ...node,
                                                                            data: {
                                                                                ...node.data,
                                                                                label: node.data.label || 'EQ',
                                                                                eqLow: Math.max(-24, Math.min(24, coerceNumber(node.data.eqLow, 0))),
                                                                                eqMid: Math.max(-24, Math.min(24, coerceNumber(node.data.eqMid, 0))),
                                                                                eqHigh: Math.max(-24, Math.min(24, coerceNumber(node.data.eqHigh, 0))),
                                                                                eqLowFrequency: Math.max(80, Math.min(1200, coerceNumber(node.data.eqLowFrequency, 320))),
                                                                                eqHighFrequency: Math.max(1200, Math.min(8000, coerceNumber(node.data.eqHighFrequency, 2800))),
                                                                            },
                                                                        }
                                                                        : node.type === 'lfo'
                                                                            ? {
                                                                                ...node,
                                                                                data: {
                                                                                    ...node.data,
                                                                                    label: node.data.label || 'LFO',
                                                                                    lfoWaveform: node.data.lfoWaveform ?? 'sine',
                                                                                    lfoDepth: clamp01(coerceNumber(node.data.lfoDepth, 0.35)),
                                                                                    lfoSync: node.data.lfoSync ?? true,
                                                                                    lfoRate: node.data.lfoRate ?? '4n',
                                                                                    lfoHz: Math.max(0.05, Math.min(20, coerceNumber(node.data.lfoHz, 1))),
                                                                                },
                                                                            }
                                                                            : node.type === 'pattern'
                                                                                ? {
                                                                                    ...node,
                                                                                    data: {
                                                                                        ...node.data,
                                                                                        label: node.data.label || 'Pattern',
                                                                                        patternNotes: normalizedPatternClip?.notes ?? createDefaultPatternClip().notes,
                                                                                        patternLoopBars: normalizedPatternClip?.loopBars ?? 2,
                                                                                        patternStepsPerBar: normalizedPatternClip?.stepsPerBar ?? PATTERN_STEPS_PER_BAR,
                                                                                        currentStep: Math.round(coerceNumber(node.data.currentStep, -1)),
                                                                                        isPlaying: node.data.isPlaying ?? false,
                                                                                    },
                                                                                }
                                                                                : node.type === 'unison'
                                                                                    ? {
                                                                                        ...node,
                                                                                        data: {
                                                                                            ...node.data,
                                                                                            label: node.data.label || 'Unison',
                                                                                            wet: clamp01(coerceNumber(node.data.wet, 0.5)),
                                                                                            depth: clamp01(coerceNumber(node.data.depth, 0.7)),
                                                                                            frequency: Math.max(0.1, Math.min(10, coerceNumber(node.data.frequency, 3.35))),
                                                                                        },
                                                                                    }
                                                                                    : node.type === 'detune'
                                                                                        ? {
                                                                                            ...node,
                                                                                            data: {
                                                                                                ...node.data,
                                                                                                label: node.data.label || 'Detune',
                                                                                                wet: clamp01(coerceNumber(node.data.wet, 1)),
                                                                                                pitch: Math.max(-12, Math.min(12, coerceNumber(node.data.pitch, 0))),
                                                                                            },
                                                                                        }
                                                                                        : node.type === 'mixer'
                                                                                            ? {
                                                                                                ...node,
                                                                                                data: {
                                                                                                    ...node.data,
                                                                                                    label: node.data.label || 'Mixer',
                                                                                                    volume: clampVolumePercent(coerceNumber(node.data.volume, 70)),
                                                                                                    pan: clampSignedUnit(coerceNumber(node.data.pan, 0)),
                                                                                                    mixerChannels: (node.data.mixerChannels ?? []).map((channel: MixerChannelState) => ({
                                                                                                        sourceId: channel.sourceId,
                                                                                                        volume: clampVolumePercent(coerceNumber(channel.volume, 70)),
                                                                                                        pan: clampSignedUnit(coerceNumber(channel.pan, 0)),
                                                                                                        muted: channel.muted ?? false,
                                                                                                        solo: channel.solo ?? false,
                                                                                                    })),
                                                                                                },
                                                                                            }
                                                                                            : node.type === 'arranger'
                                                                                                ? {
                                                                                                    ...node,
                                                                                                    data: {
                                                                                                        ...node.data,
                                                                                                        label: node.data.label || 'Arranger',
                                                                                                        arrangerScenes: (node.data.arrangerScenes?.length
                                                                                                            ? node.data.arrangerScenes
                                                                                                            : [defaultScene]
                                                                                                        ).map((scene: ArrangerScene, index: number) =>
                                                                                                            normalizeArrangerScene(scene, `Scene ${index + 1}`)
                                                                                                        ),
                                                                                                        currentStep: Math.round(coerceNumber(node.data.currentStep, -1)),
                                                                                                        isPlaying: node.data.isPlaying ?? false,
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

    return {
        ...normalizedNode,
        data: {
            ...normalizedNode.data,
            mathInputTarget: normalizedNode.data.mathInputTarget ?? MATH_NONE_TARGET,
        },
    };
};

const normalizePatchEdges = (edges: AppEdge[] = [], nodes: AppNode[]) =>
    stripLegacyTempoEdges(
        edges.map((edge) => {
            const kind =
                edge.data?.kind ||
                (edge.sourceHandle === MATH_OUTPUT_HANDLE_ID
                    ? 'math'
                    : edge.sourceHandle === MODULATION_OUTPUT_HANDLE_ID
                        ? 'modulation'
                        : edge.sourceHandle === AUDIO_OUTPUT_HANDLE_ID
                            ? 'audio'
                            : 'control');

            return {
                ...edge,
                ...getEdgePresentation(kind),
                data: {
                    ...edge.data,
                    kind,
                    targetParam:
                        kind === 'modulation'
                            ? edge.data?.targetParam ?? getModulationParamFromHandle(edge.targetHandle) ?? undefined
                            : edge.data?.targetParam,
                    mathTarget:
                        kind === 'math'
                            ? edge.data?.mathTarget ??
                                nodes.find((node) => node.id === edge.target)?.data.mathInputTarget ??
                                MATH_NONE_TARGET
                            : edge.data?.mathTarget,
                },
            };
        })
    );

export const normalizePatchAsset = (
    data: PatchAssetV1 | { nodes?: AppNode[]; edges?: AppEdge[]; masterVolume?: number; metadata?: PatchAssetMetadata }
): PatchAssetV1 => {
    const nodes = (data.nodes ?? []).map((node) =>
        normalizePatchNode(node, clampVolumePercent(coerceNumber(data.masterVolume, DEFAULT_MASTER_VOLUME)))
    );

    return {
        version: 1,
        nodes,
        edges: normalizePatchEdges(data.edges ?? [], nodes),
        masterVolume: clampVolumePercent(coerceNumber(data.masterVolume, DEFAULT_MASTER_VOLUME)),
        metadata: data.metadata,
    };
};

export const getArrangerValidationIssues = (
    arrangerNode: AppNode,
    allNodes: AppNode[]
): PatchValidationIssue[] => {
    if (arrangerNode.type !== 'arranger') {
        return [];
    }

    const issues: PatchValidationIssue[] = [];
    const scenes = (arrangerNode.data.arrangerScenes ?? [])
        .slice()
        .sort((left: ArrangerScene, right: ArrangerScene) => left.startBar - right.startBar);
    const nodesById = new Map(allNodes.map((node: AppNode) => [node.id, node]));

    if (scenes.length === 0) {
        issues.push({
            severity: 'warning',
            code: 'arranger-empty',
            message: 'Arranger has no scenes.',
            nodeId: arrangerNode.id,
        });
        return issues;
    }

    scenes.forEach((scene: ArrangerScene, index: number) => {
        const previousScene = scenes[index - 1];

        if (scene.patternNodeIds.length === 0 && scene.rhythmNodeIds.length === 0) {
            issues.push({
                severity: 'warning',
                code: 'arranger-empty-scene',
                message: `${scene.name} does not trigger any pattern or rhythm nodes.`,
                nodeId: arrangerNode.id,
                sceneId: scene.id,
            });
        }

        if (previousScene) {
            const previousEnd = previousScene.startBar + previousScene.lengthBars;
            if (scene.startBar > previousEnd) {
                issues.push({
                    severity: 'warning',
                    code: 'arranger-gap',
                    message: `${scene.name} starts after a gap in the timeline.`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
            }
            if (scene.startBar < previousEnd) {
                issues.push({
                    severity: 'warning',
                    code: 'arranger-overlap',
                    message: `${scene.name} overlaps the previous scene.`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
            }
        }

        scene.patternNodeIds.forEach((patternNodeId: string) => {
            const patternNode = nodesById.get(patternNodeId);
            if (!patternNode || patternNode.type !== 'pattern') {
                issues.push({
                    severity: 'error',
                    code: 'arranger-missing-pattern',
                    message: `${scene.name} references a missing pattern node (${patternNodeId}).`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
            }
        });

        scene.rhythmNodeIds.forEach((rhythmNodeId: string) => {
            const rhythmNode = nodesById.get(rhythmNodeId);
            if (!rhythmNode || (rhythmNode.type !== 'stepsequencer' && rhythmNode.type !== 'advanceddrum')) {
                issues.push({
                    severity: 'error',
                    code: 'arranger-missing-rhythm',
                    message: `${scene.name} references a missing rhythm node (${rhythmNodeId}).`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
            }
        });

        scene.automationLanes.forEach((lane: AutomationLane) => {
            const targetNode = nodesById.get(lane.targetNodeId);
            if (!targetNode) {
                issues.push({
                    severity: 'error',
                    code: 'arranger-missing-automation-target',
                    message: `${scene.name} targets a missing automation node (${lane.targetNodeId}).`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
                return;
            }

            if (!getAutomatableParamDefinition(targetNode.type, lane.targetParam)) {
                issues.push({
                    severity: 'error',
                    code: 'arranger-invalid-automation-param',
                    message: `${scene.name} targets ${lane.targetParam} on ${targetNode.data.label}, which is not automatable.`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
            }

            if (lane.points.length === 0) {
                issues.push({
                    severity: 'warning',
                    code: 'arranger-empty-automation-lane',
                    message: `${scene.name} has an automation lane with no points.`,
                    nodeId: arrangerNode.id,
                    sceneId: scene.id,
                });
            }

            lane.points.forEach((point: AutomationPoint) => {
                if (point.barOffset < 0 || point.barOffset > scene.lengthBars) {
                    issues.push({
                        severity: 'warning',
                        code: 'arranger-automation-point-range',
                        message: `${scene.name} has an automation point outside the scene length.`,
                        nodeId: arrangerNode.id,
                        sceneId: scene.id,
                    });
                }
            });
        });
    });

    return issues;
};

export const validatePatchAsset = (
    data: PatchAssetV1 | { nodes?: AppNode[]; edges?: AppEdge[]; masterVolume?: number; metadata?: PatchAssetMetadata }
): PatchValidationReport => {
    const asset = normalizePatchAsset(data);
    const nodes = asset.nodes ?? [];
    const edges = asset.edges ?? [];
    const issues: PatchValidationIssue[] = [];
    const nodesById = new Map<string, AppNode>();
    const singletonCounts = new Map<AudioNodeType, number>();

    nodes.forEach((node: AppNode) => {
        if (nodesById.has(node.id)) {
            issues.push({
                severity: 'error',
                code: 'duplicate-node-id',
                message: `Duplicate node id detected: ${node.id}.`,
                nodeId: node.id,
            });
        }
        nodesById.set(node.id, node);

        if (
            node.type === 'tempo' ||
            node.type === 'speaker' ||
            node.type === 'mixer' ||
            node.type === 'arranger' ||
            node.type === 'audioin' ||
            node.type === 'midiin'
        ) {
            singletonCounts.set(node.type, (singletonCounts.get(node.type) ?? 0) + 1);
        }

        if (node.type === 'sampler' && node.data.hasSample && !node.data.sampleDataUrl) {
            issues.push({
                severity: 'warning',
                code: 'sampler-missing-sample',
                message: `${node.data.label} is marked as loaded but has no sample URL.`,
                nodeId: node.id,
            });
        }

        if (node.type === 'advanceddrum') {
            node.data.advancedDrumTracks?.forEach((track: AdvancedDrumTrackData, trackIndex: number) => {
                if (track.sampleName && !track.sampleDataUrl) {
                    issues.push({
                        severity: 'warning',
                        code: 'advanceddrum-missing-sample-url',
                        message: `${node.data.label} track ${trackIndex + 1} names a sample without a URL.`,
                        nodeId: node.id,
                    });
                }
            });
        }

        if (node.type === 'arranger') {
            issues.push(...getArrangerValidationIssues(node, nodes));
        }
    });

    singletonCounts.forEach((count, type) => {
        if (count > 1) {
            issues.push({
                severity: 'warning',
                code: 'duplicate-singleton',
                message: `Patch contains ${count} ${type} nodes even though the UI treats ${type} as a singleton.`,
            });
        }
    });

    edges.forEach((edge: AppEdge) => {
        if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) {
            issues.push({
                severity: 'error',
                code: 'dangling-edge',
                message: `Edge ${edge.id} points at a missing node.`,
                edgeId: edge.id,
            });
        }

        if (edge.data?.kind === 'modulation') {
            const targetNode = nodesById.get(edge.target);
            if (!targetNode || !edge.data.targetParam || !getAutomatableParamDefinition(targetNode.type, edge.data.targetParam)) {
                issues.push({
                    severity: 'error',
                    code: 'invalid-modulation-target',
                    message: `Edge ${edge.id} targets an invalid modulation parameter.`,
                    edgeId: edge.id,
                });
            }
        }

        if (edge.data?.kind === 'math') {
            issues.push({
                severity: 'warning',
                code: 'math-edge-nonshipped',
                message: `Edge ${edge.id} uses math routing, which currently relies on non-shipped sender paths.`,
                edgeId: edge.id,
            });
        }
    });

    const errorCount = issues.filter((issue) => issue.severity === 'error').length;
    const warningCount = issues.length - errorCount;

    return {
        issues,
        errorCount,
        warningCount,
        hasErrors: errorCount > 0,
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
                    : kind === 'math'
                        ? isMathEdge(edge)
                    : kind === 'modulation'
                        ? isModulationEdge(edge)
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
    mixerChains: Map<string, MixerChain>;
    advancedDrumRacks: Map<string, AdvancedDrumRack>;
    lfoBindings: Map<string, Tone.LFO>;
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
    engineStarted: boolean;
    engineError: string | null;
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
    setMathInputTarget: (nodeId: string, targetId: string) => void;
    receiveMathValue: (nodeId: string, normalizedValue: number) => void;
    updateSequencerStep: (id: string, stepIndex: number, step: Partial<SequencerStep>) => void;
    updatePatternData: (id: string, clip: Partial<PatternClip>) => void;
    upsertPatternNote: (id: string, note: PatternNote) => void;
    removePatternNote: (id: string, noteId: string) => void;
    updateMixerChannel: (id: string, sourceId: string, patch: Partial<MixerChannelState>) => void;
    upsertArrangerScene: (id: string, scene: ArrangerScene) => void;
    removeArrangerScene: (id: string, sceneId: string) => void;
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
    startAudioEngine: () => Promise<boolean>;
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
    rebuildModulationGraph: () => void;
    syncMixerChannels: () => void;
    initializeDefaultNodes: () => void;
    clearCanvas: () => void;
    loadCanvas: (data: PatchAssetV1 | { nodes: AppNode[]; edges: AppEdge[]; masterVolume?: number }) => PatchValidationReport;
    recalculateAdjacency: () => void;
    autoWireAdjacentNodes: () => void;
    toggleNodeLock: (id: string) => void;
    saveSnapshot: () => void;
    undo: () => void;
    redo: () => void;
};

const getPatternNoteById = (node: AppNode, noteId: string) =>
    (node.data.patternNotes ?? []).find((note: PatternNote) => note.id === noteId) ?? null;

const getArrangerSceneById = (node: AppNode, sceneId: string) =>
    (node.data.arrangerScenes ?? []).find((scene: ArrangerScene) => scene.id === sceneId) ?? null;

const applyMathTargetValue = (
    store: Pick<
        AppState,
        | 'changeNodeSubType'
        | 'setDrumMode'
        | 'setMasterVolume'
        | 'setMathInputTarget'
        | 'updateArpScale'
        | 'updateMixerChannel'
        | 'updateNodeData'
        | 'updateNodeValue'
        | 'updateOctave'
        | 'updatePatternData'
        | 'updateSamplerSettings'
        | 'updateSequencerStep'
        | 'updateTempoBpm'
        | 'upsertArrangerScene'
        | 'upsertPatternNote'
    >,
    node: AppNode,
    targetId: string,
    normalizedValue: number
) => {
    const safeValue = Math.max(0, Math.min(1, normalizedValue));
    const [targetScope, contextScope, fieldName, entityId] = targetId.split(':');

    if (targetId === 'mix') {
        store.updateNodeValue(node.id, { mix: mapMathIntRange(safeValue, 0, 100) });
        return;
    }

    if (targetId === 'generatorMode') {
        store.updateNodeValue(node.id, {
            generatorMode: mapMathEnum(safeValue, GENERATOR_MODE_OPTIONS),
        });
        return;
    }

    if (targetId === 'waveShape') {
        store.updateNodeValue(node.id, {
            waveShape: mapMathEnum(safeValue, GENERATOR_WAVE_OPTIONS),
        });
        return;
    }

    if (targetId === 'harmonicity') {
        store.updateNodeValue(node.id, { harmonicity: mapMathRange(safeValue, 0.25, 8) });
        return;
    }

    if (targetId === 'modulationIndex') {
        store.updateNodeValue(node.id, { modulationIndex: mapMathRange(safeValue, 0.5, 20) });
        return;
    }

    if (targetId === 'wet') {
        store.updateNodeValue(node.id, { wet: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'subType') {
        const nextSubType =
            node.type === 'effect'
                ? mapMathEnum(safeValue, EFFECT_SUBTYPE_OPTIONS)
                : mapMathEnum(
                    safeValue,
                    CHORD_QUALITY_OPTIONS.map((option) => option.value)
                );
        if (node.data.subType !== nextSubType) {
            store.changeNodeSubType(node.id, node.type, nextSubType);
        }
        return;
    }

    if (targetId === 'roomSize') {
        store.updateNodeValue(node.id, { roomSize: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'delayTime') {
        store.updateNodeValue(node.id, { delayTime: mapMathRange(safeValue, 0.1, 1) });
        return;
    }

    if (targetId === 'feedback') {
        store.updateNodeValue(node.id, { feedback: mapMathRange(safeValue, 0, 0.95) });
        return;
    }

    if (targetId === 'distortion') {
        store.updateNodeValue(node.id, { distortion: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'frequency') {
        const max = node.type === 'unison' ? 10 : 20;
        store.updateNodeValue(node.id, { frequency: mapMathRange(safeValue, 0.1, max) });
        return;
    }

    if (targetId === 'bits') {
        store.updateNodeValue(node.id, { bits: mapMathIntRange(safeValue, 1, 8) });
        return;
    }

    if (targetId === 'volume') {
        const nextVolume = mapMathIntRange(safeValue, 0, 100);
        if (node.type === 'speaker') {
            store.setMasterVolume(nextVolume);
            store.updateNodeData(node.id, { volume: nextVolume });
            return;
        }
        store.updateNodeValue(node.id, { volume: nextVolume });
        return;
    }

    if (targetId === 'rootNote') {
        const nextRoot = mapMathEnum(safeValue, ROOT_NOTES);
        if (node.type === 'controller') {
            store.updateArpScale(node.id, nextRoot, node.data.scaleType ?? 'major pentatonic');
            return;
        }
        store.updateNodeData(node.id, { rootNote: nextRoot });
        return;
    }

    if (targetId === 'scaleType') {
        const scaleOptions = node.type === 'controller'
            ? TONAL_SCALE_OPTIONS
            : TONAL_SCALE_OPTIONS;
        const nextScale = mapMathEnum(safeValue, scaleOptions);
        if (node.type === 'controller') {
            store.updateArpScale(node.id, node.data.rootNote ?? 'C', nextScale);
            return;
        }
        store.updateNodeData(node.id, { scaleType: nextScale });
        return;
    }

    if (targetId === 'arpRate') {
        store.updateNodeData(node.id, { arpRate: mapMathRange(safeValue, 400, 50) });
        return;
    }

    if (targetId === 'attack') {
        store.updateNodeValue(node.id, { attack: mapMathRange(safeValue, 0.001, 2) });
        return;
    }

    if (targetId === 'decay') {
        store.updateNodeValue(node.id, { decay: mapMathRange(safeValue, 0.01, 2) });
        return;
    }

    if (targetId === 'sustain') {
        store.updateNodeValue(node.id, { sustain: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'release') {
        store.updateNodeValue(node.id, { release: mapMathRange(safeValue, 0.01, 4) });
        return;
    }

    if (targetId === 'inputGain') {
        store.updateNodeValue(node.id, { inputGain: mapMathIntRange(safeValue, 0, 100) });
        return;
    }

    if (targetId === 'drumMode') {
        store.setDrumMode(node.id, mapMathEnum(safeValue, ['hits', 'grid'] as const));
        return;
    }

    if (targetId === 'swing') {
        store.updateNodeData(node.id, { swing: mapMathRange(safeValue, 0, 0.6) });
        return;
    }

    if (targetScope === 'advanceddrum' && contextScope === 'track' && fieldName === 'length' && entityId) {
        const trackIndex = Number(entityId);
        const tracks = [...(node.data.advancedDrumTracks ?? createDefaultAdvancedDrumTracks())];
        const track = tracks[trackIndex];
        if (!track) {
            return;
        }
        tracks[trackIndex] = {
            ...track,
            length: mapMathEnum(safeValue, ADVANCED_DRUM_TRACK_LENGTHS),
        };
        store.updateNodeData(node.id, { advancedDrumTracks: tracks });
        return;
    }

    if (targetId === 'depth') {
        store.updateNodeValue(node.id, { depth: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'pitch') {
        store.updateNodeValue(node.id, { pitch: mapMathRange(safeValue, -12, 12) });
        return;
    }

    if (targetId === 'low') {
        store.updateNodeValue(node.id, { low: mapMathRange(safeValue, -24, 24) });
        return;
    }

    if (targetId === 'mid') {
        store.updateNodeValue(node.id, { mid: mapMathRange(safeValue, -24, 24) });
        return;
    }

    if (targetId === 'high') {
        store.updateNodeValue(node.id, { high: mapMathRange(safeValue, -24, 24) });
        return;
    }

    if (targetId === 'lowFrequency') {
        store.updateNodeValue(node.id, { lowFrequency: mapMathRange(safeValue, 80, 1200) });
        return;
    }

    if (targetId === 'highFrequency') {
        store.updateNodeValue(node.id, { highFrequency: mapMathRange(safeValue, 1200, 8000) });
        return;
    }

    if (targetId === 'loop') {
        store.updateSamplerSettings(node.id, { loop: mapMathToggle(safeValue) });
        return;
    }

    if (targetId === 'playbackRate') {
        store.updateSamplerSettings(node.id, { playbackRate: mapMathRange(safeValue, 0.25, 2) });
        return;
    }

    if (targetId === 'pitchShift') {
        store.updateSamplerSettings(node.id, { pitchShift: mapMathIntRange(safeValue, -12, 12) });
        return;
    }

    if (targetId === 'reverse') {
        store.updateSamplerSettings(node.id, { reverse: mapMathToggle(safeValue) });
        return;
    }

    if (targetId === 'bpm') {
        store.updateTempoBpm(node.id, mapMathIntRange(safeValue, MIN_TEMPO_BPM, MAX_TEMPO_BPM));
        return;
    }

    if (targetId === 'lfoWaveform') {
        store.updateNodeData(node.id, { lfoWaveform: mapMathEnum(safeValue, LFO_WAVE_OPTIONS) });
        return;
    }

    if (targetId === 'lfoSync') {
        store.updateNodeData(node.id, { lfoSync: mapMathToggle(safeValue) });
        return;
    }

    if (targetId === 'lfoRate') {
        store.updateNodeData(node.id, { lfoRate: mapMathEnum(safeValue, TRANSPORT_RATE_OPTIONS.map((option) => option.value)) });
        return;
    }

    if (targetId === 'lfoHz') {
        store.updateNodeData(node.id, { lfoHz: mapMathRange(safeValue, 0.1, 12) });
        return;
    }

    if (targetId === 'lfoDepth') {
        store.updateNodeData(node.id, { lfoDepth: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'bypass') {
        store.updateNodeData(node.id, { bypass: mapMathToggle(safeValue) });
        return;
    }

    if (targetId === 'octave') {
        store.updateOctave(node.id, mapMathIntRange(safeValue, 1, 7));
        return;
    }

    if (targetId === 'visualiserMode') {
        store.updateNodeData(node.id, { visualiserMode: mapMathEnum(safeValue, VISUALISER_MODE_OPTIONS) });
        return;
    }

    if (targetId === 'pan') {
        store.updateNodeValue(node.id, { pan: mapMathRange(safeValue, -1, 1) });
        return;
    }

    if (targetId === 'pulseSync') {
        store.updateNodeData(node.id, { pulseSync: mapMathToggle(safeValue) });
        return;
    }

    if (targetId === 'pulseRate') {
        store.updateNodeData(node.id, {
            pulseRate: mapMathEnum(safeValue, TRANSPORT_RATE_OPTIONS.map((option) => option.value)),
        });
        return;
    }

    if (targetId === 'pulseIntervalMs') {
        store.updateNodeData(node.id, { pulseIntervalMs: mapMathIntRange(safeValue, 100, 2000) });
        return;
    }

    if (targetId === 'pulseNote') {
        store.updateNodeData(node.id, { pulseNote: mapMathEnum(safeValue, PULSE_NOTE_OPTIONS) });
        return;
    }

    if (targetId === 'moodX') {
        store.updateNodeData(node.id, { moodX: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'moodY') {
        store.updateNodeData(node.id, { moodY: mapMathRange(safeValue, 0, 1) });
        return;
    }

    if (targetId === 'sequenceSync') {
        store.updateNodeData(node.id, { sequenceSync: mapMathToggle(safeValue) });
        return;
    }

    if (targetId === 'sequenceRate') {
        store.updateNodeData(node.id, {
            sequenceRate: mapMathEnum(safeValue, TRANSPORT_RATE_OPTIONS.map((option) => option.value)),
        });
        return;
    }

    if (targetId === 'sequenceIntervalMs') {
        store.updateNodeData(node.id, { sequenceIntervalMs: mapMathIntRange(safeValue, 100, 1200) });
        return;
    }

    if (targetId === 'selectedStep') {
        const maxStepIndex = Math.max((node.data.stepSequence ?? createDefaultStepSequence()).length - 1, 0);
        store.updateNodeData(node.id, { selectedStep: mapMathIntRange(safeValue, 0, maxStepIndex) });
        return;
    }

    if (targetScope === 'stepsequencer' && contextScope === 'step' && entityId) {
        const stepIndex = Number(entityId);
        if (fieldName === 'enabled') {
            store.updateSequencerStep(node.id, stepIndex, { enabled: mapMathToggle(safeValue) });
            return;
        }
        if (fieldName === 'note') {
            store.updateSequencerStep(node.id, stepIndex, {
                note: mapMathEnum(safeValue, SEQUENCER_NOTE_OPTIONS),
            });
            return;
        }
        if (fieldName === 'mix') {
            store.updateSequencerStep(node.id, stepIndex, {
                mix: mapMathIntRange(safeValue, 10, 100),
            });
            return;
        }
    }

    if (targetId === 'patternLoopBars') {
        store.updatePatternData(node.id, { loopBars: mapMathIntRange(safeValue, 1, 16) });
        return;
    }

    if (targetScope === 'pattern' && contextScope === 'note' && entityId) {
        const targetNote = getPatternNoteById(node, entityId);
        if (!targetNote) {
            return;
        }

        if (fieldName === 'note') {
            store.upsertPatternNote(node.id, {
                ...targetNote,
                note: mapMathEnum(safeValue, PATTERN_NOTE_OPTIONS),
            });
            return;
        }
        if (fieldName === 'startStep') {
            const totalSteps =
                Math.max(1, Math.min(16, node.data.patternLoopBars ?? 2)) *
                Math.max(1, node.data.patternStepsPerBar ?? PATTERN_STEPS_PER_BAR);
            store.upsertPatternNote(node.id, {
                ...targetNote,
                startStep: mapMathIntRange(safeValue, 0, Math.max(0, totalSteps - 1)),
            });
            return;
        }
        if (fieldName === 'lengthSteps') {
            const totalSteps =
                Math.max(1, Math.min(16, node.data.patternLoopBars ?? 2)) *
                Math.max(1, node.data.patternStepsPerBar ?? PATTERN_STEPS_PER_BAR);
            store.upsertPatternNote(node.id, {
                ...targetNote,
                lengthSteps: mapMathIntRange(
                    safeValue,
                    1,
                    Math.max(1, totalSteps - targetNote.startStep)
                ),
            });
            return;
        }
        if (fieldName === 'velocity') {
            store.upsertPatternNote(node.id, {
                ...targetNote,
                velocity: mapMathRange(safeValue, 0.05, 1),
            });
            return;
        }
    }

    if (targetScope === 'mixer' && contextScope === 'channel' && entityId) {
        if (fieldName === 'volume') {
            store.updateMixerChannel(node.id, entityId, { volume: mapMathIntRange(safeValue, 0, 100) });
            return;
        }
        if (fieldName === 'pan') {
            store.updateMixerChannel(node.id, entityId, { pan: mapMathRange(safeValue, -1, 1) });
            return;
        }
        if (fieldName === 'muted') {
            store.updateMixerChannel(node.id, entityId, { muted: mapMathToggle(safeValue) });
            return;
        }
        if (fieldName === 'solo') {
            store.updateMixerChannel(node.id, entityId, { solo: mapMathToggle(safeValue) });
            return;
        }
    }

    if (targetScope === 'arranger' && contextScope === 'scene' && entityId) {
        const scene = getArrangerSceneById(node, entityId);
        if (!scene) {
            return;
        }
        if (fieldName === 'startBar') {
            store.upsertArrangerScene(node.id, {
                ...scene,
                startBar: mapMathIntRange(safeValue, 0, 64),
            });
            return;
        }
        if (fieldName === 'lengthBars') {
            store.upsertArrangerScene(node.id, {
                ...scene,
                lengthBars: mapMathIntRange(safeValue, 1, 32),
            });
        }
    }
};

const getPatternClipFromNode = (node: AppNode): PatternClip => ({
    notes: node.data.patternNotes ?? createDefaultPatternClip().notes,
    loopBars: Math.max(1, Math.min(16, node.data.patternLoopBars ?? 2)),
    stepsPerBar: Math.max(1, node.data.patternStepsPerBar ?? PATTERN_STEPS_PER_BAR),
});

const getDefaultMixerChannelState = (sourceId: string): MixerChannelState => ({
    sourceId,
    volume: 70,
    pan: 0,
    muted: false,
    solo: false,
});

const applyMixerChannelRuntime = (
    strip: MixerStrip,
    channel: MixerChannelState,
    hasSoloChannel: boolean
) => {
    const isAudible = !channel.muted && (!hasSoloChannel || channel.solo);
    strip.input.gain.rampTo(isAudible ? 1 : 0, 0.05);
    strip.panVol.volume.rampTo(
        isAudible ? volumePercentToDb(channel.volume) : -Infinity,
        0.1
    );
    strip.panVol.pan.rampTo(channel.pan, 0.1);
};

const getBarsAsToneTime = (bars: number) => `${Math.max(0, bars)}:0:0`;

const resolveModulationTarget = (
    state: Pick<AppState, 'audioNodes' | 'samplerChains' | 'drumRacks' | 'advancedDrumRacks' | 'mixerChains'>,
    nodeId: string,
    nodeType: AudioNodeType,
    paramKey: AutomatableParamKey
): unknown => {
    if (nodeType === 'effect') {
        const node = state.audioNodes.get(nodeId);
        if (node instanceof Tone.Freeverb) {
            if (paramKey === 'wet') return node.wet;
            if (paramKey === 'roomSize') return node.roomSize;
        }
        if (node instanceof Tone.FeedbackDelay) {
            if (paramKey === 'wet') return node.wet;
            if (paramKey === 'delayTime') return node.delayTime;
            if (paramKey === 'feedback') return node.feedback;
        }
        if (node instanceof Tone.Phaser) {
            if (paramKey === 'wet') return node.wet;
            if (paramKey === 'frequency') return node.frequency;
        }
    }

    if (nodeType === 'eq') {
        const node = state.audioNodes.get(nodeId);
        if (node instanceof Tone.EQ3) {
            if (paramKey === 'low') return node.low;
            if (paramKey === 'mid') return node.mid;
            if (paramKey === 'high') return node.high;
            if (paramKey === 'lowFrequency') return node.lowFrequency;
            if (paramKey === 'highFrequency') return node.highFrequency;
        }
    }

    if (nodeType === 'unison') {
        const node = state.audioNodes.get(nodeId);
        if (node instanceof Tone.Chorus) {
            if (paramKey === 'wet') return node.wet;
            if (paramKey === 'frequency') return node.frequency;
        }
    }

    if (nodeType === 'detune') {
        const node = state.audioNodes.get(nodeId);
        if (node instanceof Tone.PitchShift && paramKey === 'wet') {
            return node.wet;
        }
    }

    if (nodeType === 'mixer') {
        const chain = state.mixerChains.get(nodeId);
        if (chain) {
            if (paramKey === 'volume') return chain.output.volume;
            if (paramKey === 'pan') return chain.output.pan;
        }
    }

    return null;
};

const applyRuntimeAutomatableValue = (
    state: Pick<AppState, 'audioNodes' | 'samplerChains' | 'drumRacks' | 'advancedDrumRacks' | 'mixerChains'>,
    nodeId: string,
    nodeType: AudioNodeType,
    paramKey: AutomatableParamKey,
    value: number,
    rampSeconds = 0.1
) => {
    if (nodeType === 'generator') {
        const node = state.audioNodes.get(nodeId);
        if (node instanceof Tone.PolySynth) {
            if (paramKey === 'mix') {
                node.volume.rampTo(volumePercentToDb(value), rampSeconds);
            } else if (paramKey === 'harmonicity') {
                node.set({ harmonicity: value } as never);
            } else if (paramKey === 'modulationIndex') {
                node.set({ modulationIndex: value } as never);
            }
        } else if (node instanceof Tone.Noise && paramKey === 'mix') {
            node.volume.rampTo(volumePercentToDb(value), rampSeconds);
        }
        return;
    }

    if (nodeType === 'sampler') {
        const chain = state.samplerChains.get(nodeId);
        if (!chain) {
            return;
        }

        if (paramKey === 'mix') {
            chain.player.volume.rampTo(volumePercentToDb(value), rampSeconds);
            return;
        }

        if (paramKey === 'playbackRate') {
            chain.player.playbackRate = Math.max(0.25, Math.min(2, value));
            return;
        }

        if (paramKey === 'pitchShift') {
            chain.pitchShift.pitch = Math.max(-12, Math.min(12, value));
            return;
        }

        return;
    }

    if (nodeType === 'drum' && paramKey === 'mix') {
        state.drumRacks.get(nodeId)?.output.gain.rampTo(value / 100, rampSeconds);
        return;
    }

    if (nodeType === 'advanceddrum' && paramKey === 'mix') {
        state.advancedDrumRacks.get(nodeId)?.output.gain.rampTo(value / 100, rampSeconds);
        return;
    }

    if (nodeType === 'mixer') {
        const chain = state.mixerChains.get(nodeId);
        if (!chain) {
            return;
        }
        if (paramKey === 'volume') {
            chain.output.volume.rampTo(volumePercentToDb(value), rampSeconds);
        } else if (paramKey === 'pan') {
            chain.output.pan.rampTo(value, rampSeconds);
        }
        return;
    }

    const target = resolveModulationTarget(state, nodeId, nodeType, paramKey) as {
        rampTo?: (value: number, rampSeconds?: number) => void;
        setValueAtTime?: (value: number, time: number) => void;
        value?: number;
    } | null;

    if (!target) {
        return;
    }

    if (typeof target.rampTo === 'function') {
        target.rampTo(value, rampSeconds);
        return;
    }

    if (typeof target.setValueAtTime === 'function') {
        target.setValueAtTime(value, Tone.now() + rampSeconds);
        return;
    }

    if ('value' in target) {
        target.value = value;
    }
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
    mixerChains: new Map(),
    advancedDrumRacks: new Map(),
    lfoBindings: new Map(),
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
    engineStarted: false,
    engineError: null,
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
        const isOutputActive = hasSpeakerNode(nodes) || hasMixerNode(nodes);

        if (masterOutput) {
            const targetVolume = isOutputActive ? volumePercentToDb(masterVolume) : -Infinity;
            masterOutput.volume.rampTo(targetVolume, 0.1);
            return masterOutput;
        }

        const nextMasterOutput = new Tone.Volume(
            isOutputActive ? volumePercentToDb(masterVolume) : -Infinity
        ).toDestination();
        set({ masterOutput: nextMasterOutput });
        return nextMasterOutput;
    },

    setMasterVolume: (volume: number) => {
        const nextVolume = clampVolumePercent(volume);
        const masterOutput = get().ensureMasterOutput();
        const isOutputActive = hasSpeakerNode(get().nodes) || hasMixerNode(get().nodes);
        masterOutput.volume.rampTo(isOutputActive ? volumePercentToDb(nextVolume) : -Infinity, 0.1);
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
                        const curDims = getNodeCanvasDims(currentNode);

                        nodes.forEach(n => {
                            if (n.data.isLocked && !lockedCluster.has(n.id)) {
                                const axis = getNodeAdjacencyAxis(currentNode.type, n.type);
                                const nDims = getNodeCanvasDims(n);

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

        const nonRemoveChanges = changes.filter((c) => c.type !== 'remove');
        const removeChanges = changes.filter((c) => c.type === 'remove');

        if (nonRemoveChanges.length > 0) {
            set({
                nodes: applyNodeChanges(nonRemoveChanges, get().nodes) as AppNode[],
            });
        }

        if (removeChanges.length > 0) {
            // V11 AUDIT FIX:
            // Intercept `{ type: 'remove' }` events from React Flow to ensure Tone.js 
            // audio nodes are cleanly disconnected and disposed BEFORE removing them 
            // from the canvas, preventing severe "ghost" audio memory leaks.
            // Group deletions capture everything in a single snapshot instead of multiple.
            get().saveSnapshot();
            removeChanges.forEach(change => {
                if ('id' in change) {
                    get().removeAudioNode(change.id);
                }
            });
            const removedIds = new Set(removeChanges.map((c) => 'id' in c ? c.id : ''));
            const { nodes, edges } = get();
            set({
                nodes: nodes.filter((n: AppNode) => !removedIds.has(n.id)),
                edges: edges.filter((e: AppEdge) => !removedIds.has(e.source) && !removedIds.has(e.target)),
            });
            get().rebuildAudioGraph();
            get().rebuildModulationGraph();
            get().recalculateAdjacency();
        }
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
            edges: get().edges.map((edge) =>
                edge.id === oldEdge.id
                    ? {
                        ...edge,
                        source: newConnection.source ?? edge.source,
                        target: newConnection.target ?? edge.target,
                        sourceHandle: newConnection.sourceHandle ?? edge.sourceHandle ?? null,
                        targetHandle: newConnection.targetHandle ?? edge.targetHandle ?? null,
                        ...getEdgePresentation(kind),
                        data: {
                            kind,
                            targetParam:
                                kind === 'modulation'
                                    ? getModulationParamFromHandle(newConnection.targetHandle)
                                    : undefined,
                            mathTarget:
                                kind === 'math'
                                    ? get().nodes.find((node: AppNode) => node.id === (newConnection.target ?? edge.target))
                                        ?.data.mathInputTarget ?? MATH_NONE_TARGET
                                    : undefined,
                        },
                    }
                    : edge
            ) as AppEdge[],
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
                    targetParam:
                        kind === 'modulation'
                            ? getModulationParamFromHandle(connection.targetHandle)
                            : undefined,
                    mathTarget:
                        kind === 'math'
                            ? targetNode?.data.mathInputTarget ?? MATH_NONE_TARGET
                            : undefined,
                },
            }, edges),
        });
        get().autoWireAdjacentNodes();
    },

    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => {
        const { audioNodes } = get();
        if (audioNodes.has(id)) return;

        let node: Tone.ToneAudioNode | null = null;
        const nodeData = get().nodes.find((entry: AppNode) => entry.id === id)?.data;

        if (type === 'generator') {
            const generatorMode = isGeneratorMode(subType) ? subType : getGeneratorMode(nodeData);
            node = createGeneratorAudioNode({
                ...nodeData,
                generatorMode,
            });
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
            const actualSubType = subType || nodeData?.subType || 'none';
            if (actualSubType === 'reverb') {
                node = new Tone.Freeverb({
                    roomSize: nodeData?.roomSize ?? 0.5,
                    wet: nodeData?.wet ?? 0.5,
                });
            } else if (actualSubType === 'delay') {
                const delay = new Tone.FeedbackDelay(
                    nodeData?.delayTime ?? 0.45,
                    nodeData?.feedback ?? 0.4
                );
                delay.wet.rampTo(nodeData?.wet ?? 0.5, 0.01);
                node = delay;
            } else if (actualSubType === 'distortion') {
                const distortion = new Tone.Distortion(nodeData?.distortion ?? 0.5);
                distortion.wet.rampTo(nodeData?.wet ?? 0.5, 0.01);
                node = distortion;
            } else if (actualSubType === 'phaser') {
                node = new Tone.Phaser({
                    frequency: nodeData?.frequency ?? 4,
                    octaves: nodeData?.octaves ?? 5,
                    baseFrequency: 1000,
                    wet: nodeData?.wet ?? 0.5,
                });
            } else if (actualSubType === 'bitcrusher') {
                const bitCrusher = new Tone.BitCrusher(nodeData?.bits ?? 4);
                bitCrusher.wet.rampTo(nodeData?.wet ?? 0.5, 0.01);
                node = bitCrusher;
            } else {
                node = new Tone.Volume(0);
            }
        } else if (type === 'eq') {
            node = new Tone.EQ3({
                low: nodeData?.eqLow ?? 0,
                mid: nodeData?.eqMid ?? 0,
                high: nodeData?.eqHigh ?? 0,
                lowFrequency: nodeData?.eqLowFrequency ?? 320,
                highFrequency: nodeData?.eqHighFrequency ?? 2800,
            });
        } else if (type === 'unison') {
            node = new Tone.Chorus({
                frequency: nodeData?.frequency ?? 3.35,
                delayTime: 2.5,
                depth: nodeData?.depth ?? 0.7,
                wet: nodeData?.wet ?? 0.5,
            }).start();
        } else if (type === 'detune') {
            node = new Tone.PitchShift({
                pitch: nodeData?.pitch ?? 0,
                wet: nodeData?.wet ?? 1,
            });
        } else if (type === 'visualiser') {
            node = new Tone.Gain(1); // passthrough — analysers are attached in the component
        } else if (type === 'mixer') {
            const output = new Tone.PanVol(
                nodeData?.pan ?? 0,
                volumePercentToDb(nodeData?.volume ?? 70)
            );
            const nextMixerChains = new Map(get().mixerChains);
            nextMixerChains.set(id, {
                output,
                strips: new Map(),
            });
            set({ mixerChains: nextMixerChains });
            node = output;
        } else if (
            type === 'controller' ||
            type === 'midiin' ||
            type === 'tempo' ||
            type === 'speaker' ||
            type === 'arranger' ||
            type === 'chord' ||
            type === 'adsr' ||
            type === 'keys' ||
            type === 'lfo' ||
            type === 'pattern' ||
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

        const {
            audioNodes,
            patterns,
            nodes,
            edges,
            generatorNoteCounts,
            activeGenerators,
            lfoBindings,
            mixerChains,
        } = get();
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

        const oldLfoBindings = [...lfoBindings.entries()].filter(([edgeId]) => edgeId.startsWith(`${id}:`) || edgeId === id);
        if (oldLfoBindings.length > 0) {
            const nextBindings = new Map(lfoBindings);
            oldLfoBindings.forEach(([edgeId, binding]) => {
                try {
                    binding.unsync();
                    binding.stop();
                } catch {
                    // Ignore redundant stop/unsync calls during rebuild.
                }
                binding.disconnect().dispose();
                nextBindings.delete(edgeId);
            });
            set({ lfoBindings: nextBindings });
        }

        const mixerChain = mixerChains.get(id);
        if (mixerChain) {
            const nextMixerChains = new Map(mixerChains);
            disposeMixerChain(mixerChain);
            nextMixerChains.delete(id);
            set({ mixerChains: nextMixerChains });
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
                            ...(mainType === 'generator'
                                ? (
                                    isGeneratorMode(subType)
                                        ? { generatorMode: subType }
                                        : { waveShape: subType as WaveShape }
                                )
                                : { subType }),
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
            mixerChains,
            advancedDrumRacks,
            lfoBindings,
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

        const mixerChain = mixerChains.get(id);
        if (mixerChain) {
            disposeMixerChain(mixerChain);
            const nextMixerChains = new Map(mixerChains);
            nextMixerChains.delete(id);
            set({ mixerChains: nextMixerChains });
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

        const bindingEntries = [...lfoBindings.entries()].filter(([edgeId]) =>
            edgeId === id || edgeId.includes(id)
        );
        if (bindingEntries.length > 0) {
            const nextBindings = new Map(lfoBindings);
            bindingEntries.forEach(([edgeId, binding]) => {
                try {
                    binding.unsync();
                    binding.stop();
                } catch {
                    // Ignore redundant stop/unsync calls during node removal.
                }
                binding.disconnect().dispose();
                nextBindings.delete(edgeId);
            });
            set({ lfoBindings: nextBindings });
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
        if (!targetNode) {
            return;
        }

        const nextData: Partial<AppNode['data']> = {};
        const persistNodeData = () => {
            if (Object.keys(nextData).length === 0) {
                return;
            }

            set({
                nodes: get().nodes.map((node: AppNode) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, ...nextData } }
                        : node
                ),
            });
        };

        if (typeof value.packedName === 'string') {
            nextData.packedName = value.packedName;
        }

        if (typeof value.generatorMode === 'string' && targetNode.type === 'generator') {
            nextData.generatorMode = value.generatorMode;
            persistNodeData();
            if (getGeneratorMode(targetNode.data) !== value.generatorMode) {
                get().changeNodeSubType(id, 'generator', value.generatorMode);
            }
            return;
        }

        if (typeof value.waveShape === 'string' && targetNode.type === 'generator') {
            nextData.waveShape = value.waveShape;

            if (getGeneratorMode(targetNode.data) === 'noise') {
                nextData.generatorMode = 'wave';
                persistNodeData();
                get().changeNodeSubType(id, 'generator', 'wave');
                return;
            }

            const node = get().audioNodes.get(id);
            if (node instanceof Tone.PolySynth) {
                node.set({ oscillator: { type: value.waveShape } as never });
            }
        }

        if (typeof value.volume === 'number') {
            nextData.volume = clampVolumePercent(value.volume);
        }

        if (typeof value.inputGain === 'number') {
            nextData.inputGain = clampVolumePercent(value.inputGain);
        }

        if (typeof value.mix === 'number') {
            nextData.mix = clampVolumePercent(value.mix);
        }

        if (typeof value.wet === 'number') nextData.wet = value.wet;
        if (typeof value.roomSize === 'number') nextData.roomSize = value.roomSize;
        if (typeof value.delayTime === 'number') nextData.delayTime = value.delayTime;
        if (typeof value.feedback === 'number') nextData.feedback = value.feedback;
        if (typeof value.distortion === 'number') nextData.distortion = value.distortion;
        if (typeof value.frequency === 'number') nextData.frequency = value.frequency;
        if (typeof value.octaves === 'number') nextData.octaves = value.octaves;
        if (typeof value.bits === 'number') nextData.bits = value.bits;
        if (typeof value.attack === 'number') nextData.attack = value.attack;
        if (typeof value.decay === 'number') nextData.decay = value.decay;
        if (typeof value.sustain === 'number') nextData.sustain = value.sustain;
        if (typeof value.release === 'number') nextData.release = value.release;
        if (typeof value.depth === 'number') nextData.depth = value.depth;
        if (typeof value.pitch === 'number') nextData.pitch = value.pitch;
        if (typeof value.low === 'number') nextData.eqLow = value.low;
        if (typeof value.mid === 'number') nextData.eqMid = value.mid;
        if (typeof value.high === 'number') nextData.eqHigh = value.high;
        if (typeof value.lowFrequency === 'number') nextData.eqLowFrequency = value.lowFrequency;
        if (typeof value.highFrequency === 'number') nextData.eqHighFrequency = value.highFrequency;
        if (typeof value.harmonicity === 'number') nextData.harmonicity = value.harmonicity;
        if (typeof value.modulationIndex === 'number') nextData.modulationIndex = value.modulationIndex;
        if (typeof value.pan === 'number') nextData.pan = value.pan;

        if (targetNode.type === 'speaker' && typeof value.volume === 'number') {
            persistNodeData();
            get().setMasterVolume(value.volume);
            return;
        }

        if (targetNode.type === 'audioin' && typeof value.inputGain === 'number') {
            const inputNode = get().audioNodes.get(id);
            if (inputNode instanceof Tone.Volume) {
                inputNode.volume.rampTo(volumePercentToDb(nextData.inputGain ?? 75), 0.1);
            }
            persistNodeData();
            return;
        }

        if (targetNode.type === 'adsr') {
            persistNodeData();
            return;
        }

        const {
            audioNodes,
            samplerChains,
            drumRacks,
            advancedDrumRacks,
            mixerChains,
        } = get();
        const node = audioNodes.get(id);

        if (typeof value.mix === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'mix',
                value.mix
            );
        }
        if (typeof value.wet === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'wet',
                value.wet
            );
        }
        if (typeof value.roomSize === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'roomSize',
                value.roomSize
            );
        }
        if (typeof value.delayTime === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'delayTime',
                value.delayTime
            );
        }
        if (typeof value.feedback === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'feedback',
                value.feedback
            );
        }
        if (typeof value.frequency === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'frequency',
                value.frequency
            );
        }
        if (typeof value.depth === 'number' && node instanceof Tone.Chorus) {
            node.depth = value.depth;
        }
        if (typeof value.pitch === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'pitch',
                value.pitch
            );
        }
        if (typeof value.low === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'low',
                value.low
            );
        }
        if (typeof value.mid === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'mid',
                value.mid
            );
        }
        if (typeof value.high === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'high',
                value.high
            );
        }
        if (typeof value.lowFrequency === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'lowFrequency',
                value.lowFrequency
            );
        }
        if (typeof value.highFrequency === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'highFrequency',
                value.highFrequency
            );
        }
        if (typeof value.harmonicity === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'harmonicity',
                value.harmonicity
            );
        }
        if (typeof value.modulationIndex === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'modulationIndex',
                value.modulationIndex
            );
        }
        if (typeof value.volume === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'volume',
                value.volume
            );
        }
        if (typeof value.pan === 'number') {
            applyRuntimeAutomatableValue(
                { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                id,
                targetNode.type,
                'pan',
                value.pan
            );
        }

        if (node instanceof Tone.Distortion && typeof value.distortion === 'number') {
            node.distortion = value.distortion;
        } else if (node instanceof Tone.Phaser && typeof value.octaves === 'number') {
            node.octaves = value.octaves;
        } else if (node instanceof Tone.BitCrusher && typeof value.bits === 'number') {
            node.bits.value = value.bits;
        }

        persistNodeData();

        if (
            get().edges.some((edge) =>
                isModulationEdge(edge) &&
                (
                    edge.source === id ||
                    edge.target === id ||
                    edge.data?.originalSource === id ||
                    edge.data?.originalTarget === id
                )
            )
        ) {
            get().rebuildModulationGraph();
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

        const node = get().nodes.find((candidate: AppNode) => candidate.id === id);
        if (
            node?.type === 'lfo' ||
            get().edges.some((edge) =>
                isModulationEdge(edge) &&
                (
                    edge.source === id ||
                    edge.target === id ||
                    edge.data?.originalSource === id ||
                    edge.data?.originalTarget === id
                )
            )
        ) {
            get().rebuildModulationGraph();
        }
    },

    setMathInputTarget: (nodeId: string, targetId: string) => {
        const nextTargetId = targetId || MATH_NONE_TARGET;
        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            mathInputTarget: nextTargetId,
                        },
                    }
                    : node
            ),
            edges: get().edges.map((edge: AppEdge) =>
                isMathEdge(edge) && (edge.data?.originalTarget || edge.target) === nodeId
                    ? {
                        ...edge,
                        data: {
                            ...edge.data,
                            mathTarget: nextTargetId,
                        },
                    }
                    : edge
            ),
        });
    },

    receiveMathValue: (nodeId: string, normalizedValue: number) => {
        const node = get().nodes.find((candidate: AppNode) => candidate.id === nodeId);
        const targetId = node?.data.mathInputTarget ?? MATH_NONE_TARGET;

        if (!node || targetId === MATH_NONE_TARGET) {
            return;
        }

        applyMathTargetValue(get(), node, targetId, normalizedValue);
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
                    mix:
                        typeof step.mix === 'number' || typeof step.gate === 'number'
                            ? clampVolumePercent(coerceNumber(step.mix ?? step.gate, getSequencerStepMix(currentStep)))
                            : currentStep.mix,
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

    updatePatternData: (id: string, clip: Partial<PatternClip>) => {
        const currentNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'pattern');
        if (!currentNode) {
            return;
        }

        const currentClip = getPatternClipFromNode(currentNode);
        const nextClip = normalizePatternClipData({
            ...currentNode.data,
            patternNotes: clip.notes ?? currentClip.notes,
            patternLoopBars: clip.loopBars ?? currentClip.loopBars,
            patternStepsPerBar: clip.stepsPerBar ?? currentClip.stepsPerBar,
        });

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            patternNotes: nextClip.notes,
                            patternLoopBars: nextClip.loopBars,
                            patternStepsPerBar: nextClip.stepsPerBar,
                        },
                    }
                    : node
            ),
        });

        if (currentNode.data.isPlaying) {
            get().toggleNodePlayback(id, true);
        }
    },

    upsertPatternNote: (id: string, note: PatternNote) => {
        const currentNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'pattern');
        if (!currentNode) {
            return;
        }

        const clip = getPatternClipFromNode(currentNode);
        const existingIndex = clip.notes.findIndex((entry) => entry.id === note.id);
        const nextNotes =
            existingIndex === -1
                ? [...clip.notes, note]
                : clip.notes.map((entry, index) => (index === existingIndex ? note : entry));

        get().updatePatternData(id, { notes: nextNotes });
    },

    removePatternNote: (id: string, noteId: string) => {
        const currentNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'pattern');
        if (!currentNode) {
            return;
        }

        const clip = getPatternClipFromNode(currentNode);
        get().updatePatternData(id, {
            notes: clip.notes.filter((note) => note.id !== noteId),
        });
    },

    updateMixerChannel: (id: string, sourceId: string, patch: Partial<MixerChannelState>) => {
        const mixerNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'mixer');
        if (!mixerNode) {
            return;
        }

        const currentChannels: MixerChannelState[] = mixerNode.data.mixerChannels ?? [];
        const existingChannel = currentChannels.find((channel: MixerChannelState) => channel.sourceId === sourceId)
            ?? getDefaultMixerChannelState(sourceId);
        const nextChannel = {
            ...existingChannel,
            ...patch,
            sourceId,
            volume:
                typeof patch.volume === 'number'
                    ? clampVolumePercent(patch.volume)
                    : existingChannel.volume,
            pan:
                typeof patch.pan === 'number'
                    ? Math.max(-1, Math.min(1, patch.pan))
                    : existingChannel.pan,
        };
        const nextChannels = currentChannels.some((channel) => channel.sourceId === sourceId)
            ? currentChannels.map((channel: MixerChannelState) => (channel.sourceId === sourceId ? nextChannel : channel))
            : [...currentChannels, nextChannel];

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? { ...node, data: { ...node.data, mixerChannels: nextChannels } }
                    : node
            ),
        });
        get().syncMixerChannels();
    },

    upsertArrangerScene: (id: string, scene: ArrangerScene) => {
        const arrangerNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'arranger');
        if (!arrangerNode) {
            return;
        }

        const existingScenes: ArrangerScene[] = arrangerNode.data.arrangerScenes ?? [];
        const normalizedScene = normalizeArrangerScene(scene, scene.name || `Scene ${existingScenes.length + 1}`);
        const nextScenes = existingScenes.some((entry: ArrangerScene) => entry.id === scene.id)
            ? existingScenes.map((entry: ArrangerScene) => (entry.id === scene.id ? normalizedScene : entry))
            : [...existingScenes, normalizedScene];

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? { ...node, data: { ...node.data, arrangerScenes: nextScenes } }
                    : node
            ),
        });

        if (arrangerNode.data.isPlaying) {
            get().toggleNodePlayback(id, true);
        }
    },

    removeArrangerScene: (id: string, sceneId: string) => {
        const arrangerNode = get().nodes.find((node: AppNode) => node.id === id && node.type === 'arranger');
        if (!arrangerNode) {
            return;
        }

        set({
            nodes: get().nodes.map((node: AppNode) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            arrangerScenes: (node.data.arrangerScenes ?? []).filter(
                                (scene: ArrangerScene) => scene.id !== sceneId
                            ),
                        },
                    }
                    : node
            ),
        });

        if (arrangerNode.data.isPlaying) {
            get().toggleNodePlayback(id, true);
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

    startAudioEngine: async () => {
        if (get().engineStarted) {
            return true;
        }

        try {
            set({ engineError: null });
            await Tone.start();
            const rawContext = Tone.getContext().rawContext;
            const isAudioRunning = () => Tone.getContext().rawContext.state === 'running';

            for (let attempt = 0; attempt < 3 && !isAudioRunning(); attempt += 1) {
                await rawContext.resume();
                if (isAudioRunning()) {
                    break;
                }
                await new Promise((resolve) => window.setTimeout(resolve, 200));
            }

            if (!isAudioRunning()) {
                throw new Error('Audio context could not start');
            }

            const transport = Tone.getTransport();
            if (transport.state !== 'started') {
                transport.start();
            }

            get().initializeDefaultNodes();
            set({
                engineStarted: true,
                engineError: null,
            });
            return true;
        } catch (error) {
            console.error('Failed to start audio engine:', error);
            set({
                engineStarted: false,
                engineError: 'Audio is busy or blocked right now. Pause other audio and try again.',
            });
            return false;
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

        const stepMix = getSequencerStepMix(nextStep);
        get().fireNoteOn(id, nextStep.note, Math.max(0.08, stepMix / 100));
        const noteDuration = Math.max(70, intervalMs * 0.55);
        window.setTimeout(() => {
            get().fireNoteOff(id, nextStep.note);
        }, noteDuration);
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

        if (nodeData.type === 'pattern') {
            const existingPattern = patterns.get(id);
            if (existingPattern) {
                existingPattern.stop().dispose();
                const nextPatterns = new Map(patterns);
                nextPatterns.delete(id);
                set({ patterns: nextPatterns });
            }

            if (isPlaying) {
                const clip = getPatternClipFromNode(nodeData);
                const events = clip.notes
                    .slice()
                    .sort((a: PatternNote, b: PatternNote) => a.startStep - b.startStep)
                    .map((note) => ({
                        time: patternStepToTransportPosition(note.startStep, clip.stepsPerBar),
                        note,
                    }));

                const part = new Tone.Part((time, event: { note: PatternNote }) => {
                    const runtimeNodes = get().nodes;
                    const nodesById = new Map(runtimeNodes.map((node: AppNode) => [node.id, node]));
                    const audioNodes = get().audioNodes;
                    const dispatches = collectNoteDispatches(
                        id,
                        event.note.note,
                        nodesById,
                        get().edges,
                        new Map(),
                        new Map(),
                        true
                    );
                    const noteDuration = patternStepLengthToToneTime(
                        event.note.lengthSteps,
                        clip.stepsPerBar
                    );
                    const noteDurationSeconds = Tone.Time(noteDuration).toSeconds();
                    const velocity = Math.max(0.001, Math.min(1, event.note.velocity));

                    applyAdsrEnvelopes(id, nodesById, get().edges, audioNodes);
                    get().emitSignalFlow(id, 'control');

                    dispatches.forEach(({ generatorId, note }) => {
                        const samplerChain = get().samplerChains.get(generatorId);
                        if (samplerChain?.player.loaded) {
                            try {
                                samplerChain.player.stop(time);
                            } catch {
                                // Ignore redundant stop calls when retriggering sequenced samples.
                            }
                            samplerChain.player.start(time);
                            samplerChain.player.stop(
                                (typeof time === 'number' ? time : Tone.Time(time).toSeconds()) + noteDurationSeconds
                            );
                            get().emitSignalFlow(generatorId, 'audio');
                            return;
                        }

                        const targetNode = get().audioNodes.get(generatorId);
                        if (targetNode instanceof Tone.PolySynth) {
                            targetNode.triggerAttackRelease(note, noteDuration, time, velocity);
                            get().emitSignalFlow(generatorId, 'audio');
                        } else if (targetNode instanceof Tone.Noise) {
                            const startTime = typeof time === 'number' ? time : Tone.Time(time).toSeconds();
                            targetNode.start(startTime);
                            targetNode.stop(startTime + noteDurationSeconds);
                            get().emitSignalFlow(generatorId, 'audio');
                        }
                    });

                    Tone.getDraw().schedule(() => {
                        set({
                            nodes: get().nodes.map((node: AppNode) =>
                                node.id === id
                                    ? {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            currentStep: event.note.startStep,
                                        },
                                    }
                                    : node
                            ),
                        });
                    }, time);
                }, events);

                part.loop = true;
                part.loopEnd = `${clip.loopBars}:0:0`;
                part.start(0);

                const nextPatterns = new Map(get().patterns);
                nextPatterns.set(id, part);
                set({ patterns: nextPatterns });
            }

            set({
                nodes: nodes.map((node: AppNode) =>
                    node.id === id
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                isPlaying,
                                currentStep: isPlaying ? node.data.currentStep ?? -1 : -1,
                            },
                        }
                        : node
                ),
            });
            return;
        }

        if (nodeData.type === 'arranger') {
            const existingPattern = patterns.get(id);
            if (existingPattern) {
                existingPattern.stop().dispose();
                const nextPatterns = new Map(patterns);
                nextPatterns.delete(id);
                set({ patterns: nextPatterns });
            }

            if (isPlaying) {
                const scenes: ArrangerScene[] = (nodeData.data.arrangerScenes ?? [])
                    .slice()
                    .sort((a: ArrangerScene, b: ArrangerScene) => a.startBar - b.startBar);
                const loopBars = Math.max(
                    1,
                    ...scenes.map((scene: ArrangerScene) => scene.startBar + Math.max(1, scene.lengthBars))
                );

                const scenePart = new Tone.Part((time, rawScene) => {
                    if (typeof rawScene === 'string') {
                        return;
                    }
                    const scene = rawScene as ArrangerScene;
                    const sceneStart = typeof time === 'number' ? time : Tone.Time(time).toSeconds();

                    Tone.getDraw().schedule(() => {
                        const runtimeNodes = get().nodes;
                        const patternNodeIds = runtimeNodes
                            .filter((node: AppNode) => node.type === 'pattern')
                            .map((node: AppNode) => node.id);
                        const rhythmNodeIds = runtimeNodes
                            .filter((node: AppNode) =>
                                node.type === 'stepsequencer' ||
                                node.type === 'advanceddrum'
                            )
                            .map((node: AppNode) => node.id);

                        patternNodeIds.forEach((patternId) => {
                            get().toggleNodePlayback(patternId, scene.patternNodeIds.includes(patternId));
                        });
                        rhythmNodeIds.forEach((rhythmId) => {
                            get().toggleNodePlayback(rhythmId, scene.rhythmNodeIds.includes(rhythmId));
                        });

                        set({
                            nodes: get().nodes.map((node: AppNode) =>
                                node.id === id
                                    ? {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            currentStep: scene.startBar,
                                        },
                                    }
                                    : node
                            ),
                        });
                    }, time);

                    scene.automationLanes.forEach((lane: AutomationLane) => {
                        const targetNode = get().nodes.find((node: AppNode) => node.id === lane.targetNodeId);
                        if (!targetNode) {
                            return;
                        }

                        const sortedPoints = lane.points
                            .slice()
                            .sort((a: AutomationPoint, b: AutomationPoint) => a.barOffset - b.barOffset);
                        sortedPoints.forEach((point: AutomationPoint, pointIndex: number) => {
                            const absoluteTime = sceneStart + Tone.Time(getBarsAsToneTime(point.barOffset)).toSeconds();
                            const nextPoint = sortedPoints[pointIndex + 1];
                            Tone.getDraw().schedule(() => {
                                applyRuntimeAutomatableValue(
                                    {
                                        audioNodes: get().audioNodes,
                                        samplerChains: get().samplerChains,
                                        drumRacks: get().drumRacks,
                                        advancedDrumRacks: get().advancedDrumRacks,
                                        mixerChains: get().mixerChains,
                                    },
                                    lane.targetNodeId,
                                    targetNode.type,
                                    lane.targetParam,
                                    point.value,
                                    0.05
                                );

                                if (lane.mode === 'ramp' && nextPoint) {
                                    const rampDurationSeconds = Tone.Time(
                                        getBarsAsToneTime(Math.max(0, nextPoint.barOffset - point.barOffset))
                                    ).toSeconds();
                                    applyRuntimeAutomatableValue(
                                        {
                                            audioNodes: get().audioNodes,
                                            samplerChains: get().samplerChains,
                                            drumRacks: get().drumRacks,
                                            advancedDrumRacks: get().advancedDrumRacks,
                                            mixerChains: get().mixerChains,
                                        },
                                        lane.targetNodeId,
                                        targetNode.type,
                                        lane.targetParam,
                                        nextPoint.value,
                                        Math.max(0.05, rampDurationSeconds)
                                    );
                                }
                            }, absoluteTime);
                        });
                    });
                }, scenes.map((scene: ArrangerScene) => [getBarsAsToneTime(scene.startBar), scene]));

                scenePart.loop = true;
                scenePart.loopEnd = getBarsAsToneTime(loopBars);
                scenePart.start(0);

                const nextPatterns = new Map(get().patterns);
                nextPatterns.set(id, scenePart);
                set({ patterns: nextPatterns });
            } else {
                get().nodes
                    .filter((node: AppNode) =>
                        node.type === 'pattern' ||
                        node.type === 'stepsequencer' ||
                        node.type === 'advanceddrum'
                    )
                    .forEach((node: AppNode) => {
                        if (node.data.isPlaying) {
                            get().toggleNodePlayback(node.id, false);
                        }
                    });
            }

            set({
                nodes: nodes.map((node: AppNode) =>
                    node.id === id
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                isPlaying,
                                currentStep: isPlaying ? node.data.currentStep ?? 0 : -1,
                            },
                        }
                        : node
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
            (node.type === 'mixer' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'mixer')) ||
            (node.type === 'arranger' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'arranger')) ||
            (node.type === 'audioin' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'audioin')) ||
            (node.type === 'midiin' && get().nodes.some((existingNode: AppNode) => existingNode.type === 'midiin'))
        ) {
            return;
        }

        const nextNode = normalizePatchNode(node, get().masterVolume);

        const persistedNode: AppNode = {
            ...nextNode,
            data: {
                ...nextNode.data,
                mathInputTarget: nextNode.data.mathInputTarget ?? MATH_NONE_TARGET,
            },
        };

        set((state: AppState) => ({ nodes: [...state.nodes, persistedNode] }));

        if (persistedNode.type === 'tempo') {
            Tone.getTransport().bpm.rampTo(persistedNode.data.bpm ?? DEFAULT_TRANSPORT_BPM, 0.1);
            return;
        }

        if (persistedNode.type === 'speaker') {
            get().resetMasterVolume();
            return;
        }

        if (shouldInitAudioNode(persistedNode)) {
            get().initAudioNode(persistedNode.id, persistedNode.type, getNodeInitSubType(persistedNode));
        }

        if (isPatternRuntimeNode(persistedNode.type) && persistedNode.data.isPlaying) {
            get().toggleNodePlayback(persistedNode.id, true);
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
        get().syncMixerChannels();
        // Mixer strips keep their internal input -> panVol -> output wiring between graph rebuilds.
        // Only edge-driven source connections are rebuilt here; syncMixerChannels owns strip lifecycle.
        masterOutput.disconnect();
        masterOutput.toDestination();
        if (recordingController) {
            masterOutput.connect(recordingController.destination);
        }

        edges
            .filter((edge: AppEdge) => isAudioEdge(edge))
            .forEach((edge: AppEdge) => {
                if (isMathEdge(edge)) {
                    return;
                }

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

                if (sourceNode && targetInfo.type === 'mixer') {
                    const strip = get().mixerChains.get(actualTargetId)?.strips.get(actualSourceId);
                    if (strip) {
                        sourceNode.connect(strip.input);
                        routedSourceIds.add(actualSourceId);
                    }
                    return;
                }

                if (sourceNode && targetNode) {
                    sourceNode.connect(targetNode);
                    routedSourceIds.add(actualSourceId);
                }
            });

        if (hasSpeakerNode(nodes) || hasMixerNode(nodes)) {
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

        get().rebuildModulationGraph();
    },

    rebuildModulationGraph: () => {
        const {
            edges,
            nodes,
            audioNodes,
            samplerChains,
            drumRacks,
            advancedDrumRacks,
            mixerChains,
            lfoBindings,
        } = get();
        const nextBindings = new Map<string, Tone.LFO>();
        const nodesById = new Map(nodes.map((node: AppNode) => [node.id, node]));

        lfoBindings.forEach((binding) => {
            try {
                binding.unsync();
                binding.stop();
            } catch {
                // Ignore redundant stop/unsync calls while rebuilding modulation.
            }
            binding.disconnect().dispose();
        });

        edges
            .filter((edge: AppEdge) => isModulationEdge(edge))
            .forEach((edge: AppEdge) => {
                const sourceId = edge.data?.originalSource || edge.source;
                const targetId = edge.data?.originalTarget || edge.target;
                const sourceNode = nodesById.get(sourceId);
                const targetNode = nodesById.get(targetId);
                const targetParam =
                    edge.data?.targetParam ?? getModulationParamFromHandle(edge.targetHandle);

                if (!sourceNode || !targetNode || sourceNode.type !== 'lfo' || !targetParam) {
                    return;
                }

                const definition = getAutomatableParamDefinition(targetNode.type, targetParam);
                if (!definition?.supportsModulation) {
                    return;
                }

                const modulationTarget = resolveModulationTarget(
                    { audioNodes, samplerChains, drumRacks, advancedDrumRacks, mixerChains },
                    targetId,
                    targetNode.type,
                    targetParam
                );
                if (!modulationTarget) {
                    return;
                }

                const baseValue = getNodeAutomatableValue(targetNode.data, targetParam);
                const depth = Math.max(0, Math.min(1, sourceNode.data.lfoDepth ?? 0.35));
                const halfSpan = ((definition.max - definition.min) * depth) / 2;
                const min = Math.max(definition.min, baseValue - halfSpan);
                const max = Math.min(definition.max, baseValue + halfSpan);
                const lfo = new Tone.LFO({
                    type: sourceNode.data.lfoWaveform ?? 'sine',
                    frequency: sourceNode.data.lfoSync
                        ? sourceNode.data.lfoRate ?? '4n'
                        : sourceNode.data.lfoHz ?? 1,
                    min,
                    max,
                    amplitude: 1,
                });

                if (sourceNode.data.lfoSync ?? true) {
                    lfo.sync().start(0);
                } else {
                    lfo.start();
                }

                lfo.connect(modulationTarget as never);
                nextBindings.set(edge.id, lfo);
            });

        set({ lfoBindings: nextBindings });
    },

    syncMixerChannels: () => {
        const { nodes, edges, mixerChains, audioNodes } = get();
        let didUpdateNodes = false;
        const nextNodes = nodes.map((node: AppNode) => {
            if (node.type !== 'mixer') {
                return node;
            }

            const chain = mixerChains.get(node.id);
            if (!chain) {
                return node;
            }

            const incomingSourceIds = Array.from(
                new Set(
                    edges
                        .filter((edge: AppEdge) => isAudioEdge(edge))
                        .filter((edge: AppEdge) => (edge.data?.originalTarget || edge.target) === node.id)
                        .map((edge: AppEdge) => edge.data?.originalSource || edge.source)
                        .filter((sourceId): sourceId is string => Boolean(sourceId && audioNodes.has(sourceId)))
                )
            );

            const currentChannels: MixerChannelState[] = node.data.mixerChannels ?? [];
            const nextChannels = incomingSourceIds.map((sourceId) =>
                currentChannels.find((channel: MixerChannelState) => channel.sourceId === sourceId) ??
                getDefaultMixerChannelState(sourceId)
            );

            chain.output.volume.rampTo(volumePercentToDb(node.data.volume ?? 70), 0.1);
            chain.output.pan.rampTo(node.data.pan ?? 0, 0.1);

            chain.strips.forEach((strip, sourceId) => {
                if (incomingSourceIds.includes(sourceId)) {
                    return;
                }
                strip.input.disconnect().dispose();
                strip.panVol.disconnect().dispose();
                chain.strips.delete(sourceId);
            });

            nextChannels.forEach((channel) => {
                let strip = chain.strips.get(channel.sourceId);
                if (!strip) {
                    const input = new Tone.Gain(1);
                    const panVol = new Tone.PanVol(channel.pan, volumePercentToDb(channel.volume));
                    input.connect(panVol);
                    panVol.connect(chain.output);
                    strip = { sourceId: channel.sourceId, input, panVol };
                    chain.strips.set(channel.sourceId, strip);
                }
            });

            const hasSoloChannel = nextChannels.some((channel: MixerChannelState) => channel.solo);
            nextChannels.forEach((channel: MixerChannelState) => {
                const strip = chain.strips.get(channel.sourceId);
                if (strip) {
                    applyMixerChannelRuntime(strip, channel, hasSoloChannel);
                }
            });

            const currentSignature = JSON.stringify(currentChannels);
            const nextSignature = JSON.stringify(nextChannels);
            if (currentSignature !== nextSignature) {
                didUpdateNodes = true;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        mixerChannels: nextChannels,
                    },
                };
            }

            return node;
        });

        if (didUpdateNodes) {
            set({ nodes: nextNodes });
        }
    },

    initializeDefaultNodes: () => {
        get().sanitizeLegacyTempoEdges();
        const { nodes } = get();
        get().ensureMasterOutput();
        const tempoNode = nodes.find((node: AppNode) => node.type === 'tempo');
        Tone.getTransport().bpm.value = tempoNode?.data.bpm ?? DEFAULT_TRANSPORT_BPM;
        nodes.forEach((node: AppNode) => {
            if (shouldInitAudioNode(node)) {
                get().initAudioNode(node.id, node.type, getNodeInitSubType(node));
            }
        });
        get().rebuildAudioGraph();
        nodes
            .filter((node: AppNode) => isPatternRuntimeNode(node.type) && node.data.isPlaying)
            .forEach((node: AppNode) => get().toggleNodePlayback(node.id, true));
    },

    clearCanvas: () => {
        const {
            audioNodes,
            audioInputChains,
            drumRacks,
            samplerChains,
            mixerChains,
            advancedDrumRacks,
            lfoBindings,
            patterns,
            masterOutput,
        } = get();

        if (get().isRecording) {
            void get().stopRecording();
        }

        signalFlowTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        signalFlowTimeouts.clear();

        drumPadTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        drumPadTimeouts.clear();

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

        mixerChains.forEach((chain) => {
            disposeMixerChain(chain);
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

        lfoBindings.forEach((binding) => {
            try {
                binding.unsync();
                binding.stop();
            } catch {
                // Ignore redundant stop calls while clearing the canvas.
            }
            binding.disconnect().dispose();
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
            mixerChains: new Map(),
            advancedDrumRacks: new Map(),
            lfoBindings: new Map(),
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
        const normalizedAsset = normalizePatchAsset(data);
        const report = validatePatchAsset(normalizedAsset);
        get().clearCanvas();

        const {
            nodes = [],
            edges = [],
            masterVolume,
        } = normalizedAsset;

        set({
            nodes,
            edges,
            masterVolume: masterVolume ?? DEFAULT_MASTER_VOLUME,
        });

        // Apply master volume if speaker exists
        if (hasSpeakerNode(nodes)) {
            get().setMasterVolume(masterVolume ?? DEFAULT_MASTER_VOLUME);
        }

        // Reinitialize all audio nodes
        nodes.forEach((node) => {
            if (shouldInitAudioNode(node)) {
                get().initAudioNode(node.id, node.type, getNodeInitSubType(node));
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
            .filter((node: AppNode) => isPatternRuntimeNode(node.type) && node.data.isPlaying)
            .forEach((node: AppNode) => get().toggleNodePlayback(node.id, true));

        return report;
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
                const aDims = getNodeCanvasDims(a);
                const bDims = getNodeCanvasDims(b);

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
                    if (horizGap < -20 || horizGap > ADJ_TOUCH_THRESHOLD || vertDist > ADJ_Y_THRESHOLD) continue;
                } else {
                    // Vertical check (audio domain)
                    if (vertGap < -20 || vertGap > ADJ_VERT_THRESHOLD || horizDist > ADJ_X_THRESHOLD) continue;
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
                const aDims = getNodeCanvasDims(a);
                const bDims = getNodeCanvasDims(b);

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
                    if (horizGap < -20 || horizGap > ADJ_TOUCH_THRESHOLD || vertDist > ADJ_Y_THRESHOLD) continue;
                    const leftNode = a.position.x <= b.position.x ? a : b;
                    const rightNode = a.position.x <= b.position.x ? b : a;
                    if (!CONTROL_WIRE_PAIRS.has(`${leftNode.type}->${rightNode.type}`)) continue;
                } else {
                    // vertical
                    if (vertGap < -20 || vertGap > ADJ_VERT_THRESHOLD || horizDist > ADJ_X_THRESHOLD) continue;
                    const topNode = a.position.y <= b.position.y ? a : b;
                    const bottomNode = a.position.y <= b.position.y ? b : a;
                    if (!VALID_AUTO_WIRE_PAIRS.has(`${topNode.type}->${bottomNode.type}`)) continue;
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
        const clusterIds = getClusterNodeIds(id, nodes);

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
        const {
            audioNodes,
            audioInputChains,
            drumRacks,
            samplerChains,
            mixerChains,
            advancedDrumRacks,
            lfoBindings,
            patterns,
        } = get();

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

        mixerChains.forEach((chain) => {
            disposeMixerChain(chain);
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

        lfoBindings.forEach((binding) => {
            try {
                binding.unsync();
                binding.stop();
            } catch {
                // Ignore redundant stop calls during undo re-sync.
            }
            binding.disconnect().dispose();
        });

        // Clear audio state
        set({
            audioNodes: new Map(),
            audioInputChains: new Map(),
            drumRacks: new Map(),
            samplerChains: new Map(),
            mixerChains: new Map(),
            advancedDrumRacks: new Map(),
            lfoBindings: new Map(),
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
            if (shouldInitAudioNode(node)) {
                get().initAudioNode(node.id, node.type, getNodeInitSubType(node));
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
            .filter((node) => isPatternRuntimeNode(node.type) && node.data.isPlaying)
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
        const {
            audioNodes,
            audioInputChains,
            drumRacks,
            samplerChains,
            mixerChains,
            advancedDrumRacks,
            lfoBindings,
            patterns,
        } = get();

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

        mixerChains.forEach((chain) => {
            disposeMixerChain(chain);
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

        lfoBindings.forEach((binding) => {
            try {
                binding.unsync();
                binding.stop();
            } catch {
                // Ignore redundant stop calls during redo re-sync.
            }
            binding.disconnect().dispose();
        });

        // Clear audio state
        set({
            audioNodes: new Map(),
            audioInputChains: new Map(),
            drumRacks: new Map(),
            samplerChains: new Map(),
            mixerChains: new Map(),
            advancedDrumRacks: new Map(),
            lfoBindings: new Map(),
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
            if (shouldInitAudioNode(node)) {
                get().initAudioNode(node.id, node.type, getNodeInitSubType(node));
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
            .filter((node) => isPatternRuntimeNode(node.type) && node.data.isPlaying)
            .forEach((node) => get().toggleNodePlayback(node.id, true));
    },
}));
