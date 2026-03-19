import { AppNode, AppEdge } from './useStore';

export interface Preset {
    name: string;
    nodes: AppNode[];
    edges: AppEdge[];
    masterVolume?: number;
}

export const PRESETS: Preset[] = [
    {
        name: "Dreamy Pad",
        masterVolume: 60,
        nodes: [
            {
                id: 'preset-keys-1',
                type: 'keys',
                position: { x: 100, y: 100 },
                data: { label: 'Keys' }
            },
            {
                id: 'preset-adsr-1',
                type: 'adsr',
                position: { x: 450, y: 100 },
                data: { label: 'ADSR', attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.5 }
            },
            {
                id: 'preset-gen-1',
                type: 'generator',
                position: { x: 750, y: 100 },
                data: { label: 'Sine Pad', waveShape: 'sine' }
            },
            {
                id: 'preset-unison-1',
                type: 'unison',
                position: { x: 1050, y: 100 },
                data: { label: 'Unison' }
            },
            {
                id: 'preset-fx-1',
                type: 'effect',
                position: { x: 1350, y: 100 },
                data: { label: 'Reverb', subType: 'reverb' }
            },
            {
                id: 'preset-speaker-1',
                type: 'speaker',
                position: { x: 1650, y: 100 },
                data: { label: 'Master Out' }
            }
        ],
        edges: [
            { id: 'e1', source: 'preset-keys-1', target: 'preset-adsr-1', data: { kind: 'audio' } },
            { id: 'e2', source: 'preset-adsr-1', target: 'preset-gen-1', data: { kind: 'audio' } },
            { id: 'e3', source: 'preset-gen-1', target: 'preset-unison-1', data: { kind: 'audio' } },
            { id: 'e4', source: 'preset-unison-1', target: 'preset-fx-1', data: { kind: 'audio' } },
            { id: 'e5', source: 'preset-fx-1', target: 'preset-speaker-1', data: { kind: 'audio' } }
        ]
    },
    {
        name: "Dubstep Bass",
        masterVolume: 70,
        nodes: [
            {
                id: 'preset-keys-2',
                type: 'keys',
                position: { x: 100, y: 100 },
                data: { label: 'Keys' }
            },
            {
                id: 'preset-adsr-2',
                type: 'adsr',
                position: { x: 450, y: 100 },
                data: { label: 'ADSR', attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
            },
            {
                id: 'preset-gen-2',
                type: 'generator',
                position: { x: 750, y: 100 },
                data: { label: 'Saw Bass', waveShape: 'sawtooth' }
            },
            {
                id: 'preset-fx-dist',
                type: 'effect',
                position: { x: 1050, y: 100 },
                data: { label: 'Distortion', subType: 'distortion' }
            },
            {
                id: 'preset-fx-delay',
                type: 'effect',
                position: { x: 1350, y: 100 },
                data: { label: 'Delay', subType: 'delay' }
            },
            {
                id: 'preset-speaker-2',
                type: 'speaker',
                position: { x: 1650, y: 100 },
                data: { label: 'Master Out' }
            }
        ],
        edges: [
            { id: 'e1', source: 'preset-keys-2', target: 'preset-adsr-2', data: { kind: 'audio' } },
            { id: 'e2', source: 'preset-adsr-2', target: 'preset-gen-2', data: { kind: 'audio' } },
            { id: 'e3', source: 'preset-gen-2', target: 'preset-fx-dist', data: { kind: 'audio' } },
            { id: 'e4', source: 'preset-fx-dist', target: 'preset-fx-delay', data: { kind: 'audio' } },
            { id: 'e5', source: 'preset-fx-delay', target: 'preset-speaker-2', data: { kind: 'audio' } }
        ]
    },
    {
        name: "Basic Beat",
        masterVolume: 80,
        nodes: [
            {
                id: 'preset-drum-1',
                type: 'drum',
                position: { x: 100, y: 100 },
                data: { 
                    label: 'Drums', 
                    drumMode: 'grid', 
                    isPlaying: true,
                    drumPattern: {
                        kick:      [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
                        snare:     [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
                        hatClosed: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                        hatOpen:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                    }
                }
            },
            {
                id: 'preset-fx-reverb-2',
                type: 'effect',
                position: { x: 450, y: 100 },
                data: { label: 'Reverb', subType: 'reverb' }
            },
            {
                id: 'preset-speaker-3',
                type: 'speaker',
                position: { x: 750, y: 100 },
                data: { label: 'Master Out' }
            }
        ],
        edges: [
            { id: 'e1', source: 'preset-drum-1', target: 'preset-fx-reverb-2', data: { kind: 'audio' } },
            { id: 'e2', source: 'preset-fx-reverb-2', target: 'preset-speaker-3', data: { kind: 'audio' } }
        ]
    }
];
