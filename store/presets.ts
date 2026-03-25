import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_INPUT_SECONDARY_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    createDefaultAdvancedDrumTracks,
    createDefaultStepSequence,
    type AppEdge,
    type AppNode,
    type PatchAssetV1,
} from './useStore';

export type PresetCategory =
    | 'Getting Started'
    | 'Rhythmic'
    | 'Ambient'
    | 'Complex Patches'
    | 'Feature Showcases'
    | 'Tutorial Rewards';

export type PresetSource =
    | { type: 'inline' }
    | { type: 'asset'; path: string };

export interface Preset {
    id: string;
    name: string;
    category: PresetCategory;
    description: string;
    rewardLocked?: boolean;
    source?: PresetSource;
    nodes?: AppNode[];
    edges?: AppEdge[];
    masterVolume?: number;
}

export const getPresetPatchAsset = async (preset: Preset): Promise<PatchAssetV1> => {
    if (preset.source?.type === 'asset') {
        const response = await fetch(preset.source.path);
        if (!response.ok) {
            throw new Error(`Failed to load preset asset: ${preset.source.path}`);
        }

        return response.json() as Promise<PatchAssetV1>;
    }

    return {
        version: 1,
        nodes: preset.nodes ?? [],
        edges: preset.edges ?? [],
        masterVolume: preset.masterVolume,
        metadata: {
            title: preset.name,
            description: preset.description,
            presetId: preset.id,
            authoringMode: 'inline',
        },
    };
};

export const PRESET_CATEGORY_ORDER: PresetCategory[] = [
    'Getting Started',
    'Rhythmic',
    'Ambient',
    'Complex Patches',
    'Feature Showcases',
    'Tutorial Rewards',
];

const DEFAULT_LABELS: Record<string, string> = {
    controller: 'Arpeggiator',
    keys: 'Keys',
    midiin: 'MIDI In',
    moodpad: 'Mood Pad',
    pulse: 'Bloop',
    stepsequencer: 'Sequencer',
    chord: 'Chord',
    quantizer: 'Quantizer',
    adsr: 'ADSR',
    generator: 'Oscillator',
    sampler: 'Sampler',
    audioin: 'Audio In',
    drum: 'Drums',
    advanceddrum: 'Advanced Drums',
    eq: 'EQ',
    lfo: 'LFO',
    pattern: 'Pattern',
    effect: 'Effect',
    unison: 'Unison',
    detune: 'Detune',
    visualiser: 'Visualiser',
    speaker: 'Amplifier',
    mixer: 'Mixer',
    tempo: 'Tempo',
    arranger: 'Arranger',
};

const node = (
    id: string,
    type: AppNode['type'],
    x: number,
    y: number,
    data: Partial<AppNode['data']> = {}
): AppNode => ({
    id,
    type,
    position: { x, y },
    data: {
        label: DEFAULT_LABELS[type],
        ...data,
    },
});

const controlEdge = (id: string, source: string, target: string): AppEdge => ({
    id,
    source,
    target,
    sourceHandle: CONTROL_OUTPUT_HANDLE_ID,
    targetHandle: CONTROL_INPUT_HANDLE_ID,
    data: { kind: 'control' },
});

const audioEdge = (
    id: string,
    source: string,
    target: string,
    targetHandle: string = AUDIO_INPUT_HANDLE_ID
): AppEdge => ({
    id,
    source,
    target,
    sourceHandle: AUDIO_OUTPUT_HANDLE_ID,
    targetHandle,
    data: { kind: 'audio' },
});

const createFourOnFloorPattern = () => ({
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    hatOpen: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
});

const sequenceWithNotes = (notes: string[]) =>
    createDefaultStepSequence().map((step, index) => ({
        ...step,
        enabled: index < notes.length,
        note: notes[index] ?? step.note,
        mix: index % 2 === 0 ? 80 : 58,
    }));

export const PRESETS: Preset[] = [
    {
        id: 'dreamy-pad',
        name: 'Dreamy Pad',
        category: 'Getting Started',
        description: 'Keys into a warm sine pad with width and reverb.',
        masterVolume: 62,
        nodes: [
            node('dreamy-keys', 'keys', 90, 116),
            node('dreamy-adsr', 'adsr', 410, 106, { attack: 0.45, decay: 0.32, sustain: 0.82, release: 1.8 }),
            node('dreamy-gen', 'generator', 710, 116, { label: 'Sine Pad', waveShape: 'sine' }),
            node('dreamy-unison', 'unison', 1030, 124),
            node('dreamy-fx', 'effect', 1300, 116, { label: 'Reverb', subType: 'reverb' }),
            node('dreamy-visual', 'visualiser', 1560, 76, { visualiserMode: 'waveform' }),
            node('dreamy-speaker', 'speaker', 1560, 292),
        ],
        edges: [
            controlEdge('dreamy-c1', 'dreamy-keys', 'dreamy-adsr'),
            controlEdge('dreamy-c2', 'dreamy-adsr', 'dreamy-gen'),
            audioEdge('dreamy-a1', 'dreamy-gen', 'dreamy-unison'),
            audioEdge('dreamy-a2', 'dreamy-unison', 'dreamy-fx'),
            audioEdge('dreamy-a3', 'dreamy-fx', 'dreamy-visual'),
        ],
    },
    {
        id: 'bright-pluck',
        name: 'Bright Pluck',
        category: 'Getting Started',
        description: 'A quick pluck patch with chord voicing and delay sparkle.',
        masterVolume: 64,
        nodes: [
            node('pluck-keys', 'keys', 96, 116),
            node('pluck-chord', 'chord', 408, 126, { subType: 'major7' }),
            node('pluck-adsr', 'adsr', 690, 106, { attack: 0.01, decay: 0.22, sustain: 0.35, release: 0.18 }),
            node('pluck-gen', 'generator', 980, 116, { label: 'Pluck', waveShape: 'triangle' }),
            node('pluck-delay', 'effect', 1260, 116, { label: 'Delay', subType: 'delay' }),
            node('pluck-speaker', 'speaker', 1540, 116),
        ],
        edges: [
            controlEdge('pluck-c1', 'pluck-keys', 'pluck-chord'),
            controlEdge('pluck-c2', 'pluck-chord', 'pluck-adsr'),
            controlEdge('pluck-c3', 'pluck-adsr', 'pluck-gen'),
            audioEdge('pluck-a1', 'pluck-gen', 'pluck-delay'),
        ],
    },
    {
        id: 'noise-wash',
        name: 'Noise Wash',
        category: 'Getting Started',
        description: 'An airy noise texture controlled by the keyboard through long release.',
        masterVolume: 58,
        nodes: [
            node('wash-keys', 'keys', 92, 122),
            node('wash-adsr', 'adsr', 404, 110, { attack: 0.08, decay: 0.34, sustain: 0.72, release: 2.4 }),
            node('wash-gen', 'generator', 700, 122, { label: 'Noise', waveShape: 'noise' }),
            node('wash-fx', 'effect', 970, 116, { label: 'Reverb', subType: 'reverb' }),
            node('wash-detune', 'detune', 1238, 136),
            node('wash-speaker', 'speaker', 1490, 122),
        ],
        edges: [
            controlEdge('wash-c1', 'wash-keys', 'wash-adsr'),
            controlEdge('wash-c2', 'wash-adsr', 'wash-gen'),
            audioEdge('wash-a1', 'wash-gen', 'wash-fx'),
            audioEdge('wash-a2', 'wash-fx', 'wash-detune'),
        ],
    },
    {
        id: 'basic-beat',
        name: 'Basic Beat',
        category: 'Rhythmic',
        description: 'A simple floor beat with reverb for immediate groove.',
        masterVolume: 74,
        nodes: [
            node('beat-tempo', 'tempo', 72, 76, { bpm: 122 }),
            node('beat-drum', 'drum', 210, 114, { drumMode: 'grid', isPlaying: true, drumPattern: createFourOnFloorPattern() }),
            node('beat-fx', 'effect', 590, 132, { label: 'Reverb', subType: 'reverb' }),
            node('beat-visual', 'visualiser', 860, 88, { visualiserMode: 'spectrum' }),
            node('beat-speaker', 'speaker', 1180, 134),
        ],
        edges: [
            audioEdge('beat-a1', 'beat-drum', 'beat-fx'),
            audioEdge('beat-a2', 'beat-fx', 'beat-visual'),
        ],
    },
    {
        id: 'pulse-parade',
        name: 'Bloop Parade',
        category: 'Rhythmic',
        description: 'Bloop drives a sequenced synth patch with phaser shimmer.',
        masterVolume: 66,
        nodes: [
            node('pulse-tempo', 'tempo', 74, 76, { bpm: 126 }),
            node('pulse-node', 'pulse', 150, 110, { isPlaying: true, pulseRate: '8n', pulseNote: 'C4' }),
            node('pulse-gen', 'generator', 470, 116, { label: 'Bloop Saw', waveShape: 'sawtooth' }),
            node('pulse-fx', 'effect', 756, 112, { label: 'Phaser', subType: 'phaser' }),
            node('pulse-speaker', 'speaker', 1028, 116),
        ],
        edges: [
            controlEdge('pulse-c1', 'pulse-node', 'pulse-gen'),
            audioEdge('pulse-a1', 'pulse-gen', 'pulse-fx'),
        ],
    },
    {
        id: 'sequencer-runner',
        name: 'Sequencer Runner',
        category: 'Rhythmic',
        description: 'Step sequencer into a clean synth line with delay taps.',
        masterVolume: 63,
        nodes: [
            node('seq-tempo', 'tempo', 82, 76, { bpm: 132 }),
            node('seq-step', 'stepsequencer', 162, 86, {
                isPlaying: true,
                sequenceRate: '8n',
                stepSequence: sequenceWithNotes(['C4', 'E4', 'G4', 'B4', 'A4', 'G4', 'E4', 'D4']),
            }),
            node('seq-quant', 'quantizer', 566, 132, { rootNote: 'C', scaleType: 'major', bypass: false }),
            node('seq-gen', 'generator', 846, 132, { label: 'Runner', waveShape: 'square' }),
            node('seq-delay', 'effect', 1126, 124, { label: 'Delay', subType: 'delay' }),
            node('seq-speaker', 'speaker', 1390, 132),
        ],
        edges: [
            controlEdge('seq-c1', 'seq-step', 'seq-quant'),
            controlEdge('seq-c2', 'seq-quant', 'seq-gen'),
            audioEdge('seq-a1', 'seq-gen', 'seq-delay'),
        ],
    },
    {
        id: 'cloud-bloom',
        name: 'Cloud Bloom',
        category: 'Ambient',
        description: 'Mood Pad opens a drifting chord cloud through wide reverb.',
        masterVolume: 56,
        nodes: [
            node('cloud-pad', 'moodpad', 92, 54, { moodX: 0.22, moodY: 0.68 }),
            node('cloud-gen', 'generator', 454, 128, { label: 'Bloom', waveShape: 'triangle' }),
            node('cloud-unison', 'unison', 734, 132),
            node('cloud-fx', 'effect', 1002, 120, { label: 'Reverb', subType: 'reverb' }),
            node('cloud-speaker', 'speaker', 1270, 128),
        ],
        edges: [
            controlEdge('cloud-c1', 'cloud-pad', 'cloud-gen'),
            audioEdge('cloud-a1', 'cloud-gen', 'cloud-unison'),
            audioEdge('cloud-a2', 'cloud-unison', 'cloud-fx'),
        ],
    },
    {
        id: 'glass-cathedral',
        name: 'Glass Cathedral',
        category: 'Ambient',
        description: 'Chord voicing feeds a pure tone cathedral with glossy width.',
        masterVolume: 58,
        nodes: [
            node('glass-keys', 'keys', 90, 114),
            node('glass-chord', 'chord', 406, 126, { subType: 'sus2' }),
            node('glass-gen', 'generator', 692, 116, { label: 'Glass Tone', waveShape: 'sine' }),
            node('glass-unison', 'unison', 974, 126),
            node('glass-reverb', 'effect', 1248, 114, { label: 'Reverb', subType: 'reverb' }),
            node('glass-visual', 'visualiser', 1516, 76, { visualiserMode: 'waveform' }),
            node('glass-speaker', 'speaker', 1516, 292),
        ],
        edges: [
            controlEdge('glass-c1', 'glass-keys', 'glass-chord'),
            controlEdge('glass-c2', 'glass-chord', 'glass-gen'),
            audioEdge('glass-a1', 'glass-gen', 'glass-unison'),
            audioEdge('glass-a2', 'glass-unison', 'glass-reverb'),
            audioEdge('glass-a3', 'glass-reverb', 'glass-visual'),
        ],
    },
    {
        id: 'hush-drift',
        name: 'Hush Drift',
        category: 'Ambient',
        description: 'Soft keys into detune and reverb for a floating wash.',
        masterVolume: 54,
        nodes: [
            node('hush-keys', 'keys', 96, 116),
            node('hush-adsr', 'adsr', 404, 106, { attack: 0.25, decay: 0.34, sustain: 0.72, release: 2.1 }),
            node('hush-gen', 'generator', 694, 116, { label: 'Drift', waveShape: 'sine' }),
            node('hush-detune', 'detune', 964, 136),
            node('hush-fx', 'effect', 1224, 116, { label: 'Reverb', subType: 'reverb' }),
            node('hush-speaker', 'speaker', 1492, 118),
        ],
        edges: [
            controlEdge('hush-c1', 'hush-keys', 'hush-adsr'),
            controlEdge('hush-c2', 'hush-adsr', 'hush-gen'),
            audioEdge('hush-a1', 'hush-gen', 'hush-detune'),
            audioEdge('hush-a2', 'hush-detune', 'hush-fx'),
        ],
    },
    {
        id: 'chord-ladder',
        name: 'Chord Ladder',
        category: 'Complex Patches',
        description: 'Chord and ADSR stack into a wide lead with animated visuals.',
        masterVolume: 64,
        nodes: [
            node('ladder-keys', 'keys', 90, 116),
            node('ladder-chord', 'chord', 392, 126, { subType: 'minor7' }),
            node('ladder-adsr', 'adsr', 668, 106, { attack: 0.04, decay: 0.28, sustain: 0.62, release: 0.8 }),
            node('ladder-gen', 'generator', 954, 116, { label: 'Lead', waveShape: 'sawtooth' }),
            node('ladder-fx', 'effect', 1232, 116, { label: 'Phaser', subType: 'phaser' }),
            node('ladder-visual', 'visualiser', 1498, 76, { visualiserMode: 'vu' }),
            node('ladder-speaker', 'speaker', 1498, 292),
        ],
        edges: [
            controlEdge('ladder-c1', 'ladder-keys', 'ladder-chord'),
            controlEdge('ladder-c2', 'ladder-chord', 'ladder-adsr'),
            controlEdge('ladder-c3', 'ladder-adsr', 'ladder-gen'),
            audioEdge('ladder-a1', 'ladder-gen', 'ladder-fx'),
            audioEdge('ladder-a2', 'ladder-fx', 'ladder-visual'),
        ],
    },
    {
        id: 'quantized-orbit',
        name: 'Quantized Orbit',
        category: 'Complex Patches',
        description: 'A mood-driven orbit snapped into scale before it hits the synth.',
        masterVolume: 60,
        nodes: [
            node('orbit-pad', 'moodpad', 84, 58, { moodX: 0.72, moodY: 0.36 }),
            node('orbit-quant', 'quantizer', 450, 130, { rootNote: 'D', scaleType: 'minor pentatonic', bypass: false }),
            node('orbit-gen', 'generator', 728, 126, { label: 'Orbit', waveShape: 'triangle' }),
            node('orbit-fx', 'effect', 996, 118, { label: 'Delay', subType: 'delay' }),
            node('orbit-speaker', 'speaker', 1264, 126),
        ],
        edges: [
            controlEdge('orbit-c1', 'orbit-pad', 'orbit-quant'),
            controlEdge('orbit-c2', 'orbit-quant', 'orbit-gen'),
            audioEdge('orbit-a1', 'orbit-gen', 'orbit-fx'),
        ],
    },
    {
        id: 'mood-monsoon',
        name: 'Mood Monsoon',
        category: 'Complex Patches',
        description: 'Mood Pad into detuned motion with lush stereo width.',
        masterVolume: 61,
        nodes: [
            node('monsoon-pad', 'moodpad', 84, 58, { moodX: 0.44, moodY: 0.74 }),
            node('monsoon-gen', 'generator', 444, 126, { label: 'Monsoon', waveShape: 'sawtooth' }),
            node('monsoon-unison', 'unison', 724, 126),
            node('monsoon-detune', 'detune', 988, 146),
            node('monsoon-fx', 'effect', 1248, 126, { label: 'Reverb', subType: 'reverb' }),
            node('monsoon-speaker', 'speaker', 1512, 126),
        ],
        edges: [
            controlEdge('monsoon-c1', 'monsoon-pad', 'monsoon-gen'),
            audioEdge('monsoon-a1', 'monsoon-gen', 'monsoon-unison'),
            audioEdge('monsoon-a2', 'monsoon-unison', 'monsoon-detune'),
            audioEdge('monsoon-a3', 'monsoon-detune', 'monsoon-fx'),
        ],
    },
    {
        id: 'visualiser-lab',
        name: 'Visualiser Lab',
        category: 'Feature Showcases',
        description: 'Two generators feed the Visualiser for waveform and XY experiments.',
        masterVolume: 62,
        nodes: [
            node('lab-keys', 'keys', 84, 142),
            node('lab-gen-a', 'generator', 408, 96, { label: 'X Axis', waveShape: 'sine' }),
            node('lab-gen-b', 'generator', 408, 214, { label: 'Y Axis', waveShape: 'triangle' }),
            node('lab-visual', 'visualiser', 742, 86, { visualiserMode: 'lissajous' }),
            node('lab-speaker', 'speaker', 1070, 142),
        ],
        edges: [
            controlEdge('lab-c1', 'lab-keys', 'lab-gen-a'),
            controlEdge('lab-c2', 'lab-keys', 'lab-gen-b'),
            audioEdge('lab-a1', 'lab-gen-a', 'lab-visual'),
            audioEdge('lab-a2', 'lab-gen-b', 'lab-visual', AUDIO_INPUT_SECONDARY_HANDLE_ID),
        ],
    },
    {
        id: 'advanced-drum-lab',
        name: 'Advanced Drum Lab',
        category: 'Feature Showcases',
        description: 'Advanced drums through a spectrum view for instant mix feedback.',
        masterVolume: 72,
        nodes: [
            node('ad-tempo', 'tempo', 72, 78, { bpm: 128 }),
            node('ad-drum', 'advanceddrum', 178, 78, {
                isPlaying: true,
                swing: 0.18,
                advancedDrumTracks: createDefaultAdvancedDrumTracks(),
            }),
            node('ad-visual', 'visualiser', 664, 86, { visualiserMode: 'spectrum' }),
            node('ad-speaker', 'speaker', 992, 142),
        ],
        edges: [audioEdge('ad-a1', 'ad-drum', 'ad-visual')],
    },
    {
        id: 'stacked-motion',
        name: 'Stacked Motion',
        category: 'Feature Showcases',
        description: 'Bloop and sequencer combine for a layered patch with movement everywhere.',
        masterVolume: 65,
        nodes: [
            node('stack-tempo', 'tempo', 66, 66, { bpm: 136 }),
            node('stack-pulse', 'pulse', 150, 86, { isPlaying: true, pulseRate: '8n', pulseNote: 'C4' }),
            node('stack-seq', 'stepsequencer', 150, 286, {
                isPlaying: true,
                sequenceRate: '8n',
                stepSequence: sequenceWithNotes(['C4', 'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4']),
            }),
            node('stack-gen-a', 'generator', 544, 98, { label: 'Bloop Lead', waveShape: 'square' }),
            node('stack-gen-b', 'generator', 544, 304, { label: 'Seq Lead', waveShape: 'triangle' }),
            node('stack-fx', 'effect', 830, 196, { label: 'Delay', subType: 'delay' }),
            node('stack-speaker', 'speaker', 1096, 196),
        ],
        edges: [
            controlEdge('stack-c1', 'stack-pulse', 'stack-gen-a'),
            controlEdge('stack-c2', 'stack-seq', 'stack-gen-b'),
            audioEdge('stack-a1', 'stack-gen-a', 'stack-fx'),
            audioEdge('stack-a2', 'stack-gen-b', 'stack-fx'),
        ],
    },
    {
        id: 'ai-song-scaffold',
        name: 'AI Song Scaffold',
        category: 'Feature Showcases',
        description: 'Stable fixed-id scaffold for AI-authored songs: bass, lead, texture, drums, mixer, arranger, and automation-ready targets.',
        source: { type: 'asset', path: '/patches/ai-song-scaffold.bloop' },
    },
    {
        id: 'showcase-song',
        name: 'AI Showcase Song',
        category: 'Feature Showcases',
        description: 'Featured AI-authored flagship song loaded from the same compiled patch asset you can open as a .bloop file.',
        source: { type: 'asset', path: '/patches/ai-flagship-song.bloop' },
    },
    {
        id: 'cave-echo',
        name: 'Cave Echo',
        category: 'Tutorial Rewards',
        description: 'A roomy reward patch unlocked from the campaign.',
        rewardLocked: true,
        masterVolume: 60,
        nodes: [
            node('cave-keys', 'keys', 92, 120),
            node('cave-gen', 'generator', 414, 120, { label: 'Cave Lead', waveShape: 'triangle' }),
            node('cave-reverb', 'effect', 694, 112, { label: 'Reverb', subType: 'reverb' }),
            node('cave-delay', 'effect', 962, 112, { label: 'Delay', subType: 'delay' }),
            node('cave-speaker', 'speaker', 1230, 120),
        ],
        edges: [
            controlEdge('cave-c1', 'cave-keys', 'cave-gen'),
            audioEdge('cave-a1', 'cave-gen', 'cave-reverb'),
            audioEdge('cave-a2', 'cave-reverb', 'cave-delay'),
        ],
    },
    {
        id: 'late-night',
        name: 'Late Night',
        category: 'Tutorial Rewards',
        description: 'A darker after-hours arp patch unlocked in the campaign.',
        rewardLocked: true,
        masterVolume: 61,
        nodes: [
            node('night-arp', 'controller', 86, 104, { rootNote: 'A', scaleType: 'minor pentatonic' }),
            node('night-adsr', 'adsr', 392, 96, { attack: 0.01, decay: 0.22, sustain: 0.38, release: 0.4 }),
            node('night-gen', 'generator', 684, 108, { label: 'Night Bass', waveShape: 'sawtooth' }),
            node('night-fx', 'effect', 954, 104, { label: 'Distortion', subType: 'distortion' }),
            node('night-speaker', 'speaker', 1218, 108),
        ],
        edges: [
            controlEdge('night-c1', 'night-arp', 'night-adsr'),
            controlEdge('night-c2', 'night-adsr', 'night-gen'),
            audioEdge('night-a1', 'night-gen', 'night-fx'),
        ],
    },
];

export const isPresetUnlocked = (preset: Preset, unlockedPresetIds: string[]) =>
    !preset.rewardLocked || unlockedPresetIds.includes(preset.id);

export const getPresetGroups = (unlockedPresetIds: string[]) =>
    PRESET_CATEGORY_ORDER.map((category) => ({
        category,
        presets: PRESETS.filter((preset) => preset.category === category).map((preset) => ({
            ...preset,
            unlocked: isPresetUnlocked(preset, unlockedPresetIds),
        })),
    })).filter((group) => group.presets.length > 0);
