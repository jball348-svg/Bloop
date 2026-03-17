import { create } from 'zustand';
import * as Tone from 'tone';
import { Scale } from '@tonaljs/tonal';
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

export type AudioNodeType = 'generator' | 'effect' | 'speaker' | 'controller';

export type AppNode = Node & {
    data: { 
        label: string; 
        subType?: string; 
        isPlaying?: boolean;
        rootNote?: string;
        scaleType?: string;
        waveShape?: string;
    };
    type: AudioNodeType;
};

type AppState = {
    nodes: AppNode[];
    edges: Edge[];
    audioNodes: Map<string, Tone.ToneAudioNode>;
    patterns: Map<string, Tone.Pattern<any>>;
    activeGenerators: Set<string>;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onEdgeUpdate: OnEdgeUpdateFunc;
    onEdgeUpdateStart: (event: React.MouseEvent, edge: Edge) => void;
    onEdgeUpdateEnd: (event: MouseEvent | TouchEvent, edge: Edge) => void;
    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => void;
    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => void;
    removeAudioNode: (id: string) => void;
    updateNodeValue: (id: string, value: any) => void;
    updateArpScale: (id: string, root: string, scale: string) => void;
    triggerNoteOn: (id: string, note: string) => void;
    triggerNoteOff: (id: string, note: string) => void;
    fireNoteOn: (controllerId: string, note: string) => void;
    fireNoteOff: (controllerId: string, note: string) => void;
    toggleNodePlayback: (id: string, isPlaying: boolean) => void;
    addNode: (node: AppNode) => void;
    removeNodeAndCleanUp: (id: string) => void;
    rebuildAudioGraph: () => void;
    initializeDefaultNodes: () => void;
};

export const useStore = create<AppState>((set: any, get: any) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'controller',
            data: { label: 'Arp Controller', subType: 'arp' },
            position: { x: 100, y: 200 },
        },
        {
            id: 'node-2',
            type: 'generator',
            data: { label: 'Oscillator', subType: 'wave', waveShape: 'sine' },
            position: { x: 400, y: 200 },
        },
        {
            id: 'node-3',
            type: 'speaker',
            data: { label: 'Master Out' },
            position: { x: 700, y: 200 },
        },
    ],
    edges: [],
    audioNodes: new Map(),
    patterns: new Map(),
    activeGenerators: new Set(),

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const currentEdges = get().edges;
        const nextEdges = applyEdgeChanges(changes, currentEdges);

        set({ edges: nextEdges });
        get().rebuildAudioGraph();
    },

    onEdgeUpdateStart: () => {},

    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
        set({
            edges: updateEdge(oldEdge, newConnection, get().edges),
        });
        get().rebuildAudioGraph();
    },

    onEdgeUpdateEnd: () => {},

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
        get().rebuildAudioGraph();
    },

    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => {
        const { audioNodes } = get();
        if (audioNodes.has(id)) return;

        let node: Tone.ToneAudioNode | null = null;

        if (type === 'generator') {
            const actualSubType = subType || 'none';
            // Generators are now PolySynths to handle MIDI data
            const synth = new Tone.PolySynth();
            node = synth;
        } else if (type === 'controller') {
            // Controllers don't have audio nodes
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
        } else if (type === 'speaker') {
            node = new Tone.Volume(0).toDestination();
        }

        if (node) {
            const newMap = new Map(get().audioNodes);
            newMap.set(id, node);
            set({ audioNodes: newMap });
        }
    },

    changeNodeSubType: (id: string, mainType: AudioNodeType, subType: string) => {
        const { audioNodes, patterns, nodes } = get();
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
        
        set({
            nodes: nodes.map((n: AppNode) => 
                n.id === id 
                ? { ...n, data: { ...n.data, subType, isPlaying: wasPlaying } } 
                : n
            )
        });

        const handleRebuild = () => {
            get().rebuildAudioGraph();
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
        const { audioNodes, patterns } = get();
        const pattern = patterns.get(id);
        if (pattern) {
            pattern.stop().dispose();
            const newPatterns = new Map(patterns);
            newPatterns.delete(id);
            set({ patterns: newPatterns });
        }

        const node = audioNodes.get(id);
        if (node) {
            node.disconnect().dispose();
            const newMap = new Map(audioNodes);
            newMap.delete(id);
            set({ audioNodes: newMap });
        }
    },

    updateNodeValue: (id: string, value: any) => {
        const node = get().audioNodes.get(id);
        if (!node) return;

        // WaveShape logic
        if (value.waveShape) {
            if (node instanceof Tone.Oscillator) {
                node.set({ type: value.waveShape });
            } else if (node instanceof Tone.PolySynth) {
                node.set({ oscillator: { type: value.waveShape } });
            }
            const nodes = get().nodes.map((n: AppNode) => n.id === id ? { ...n, data: { ...n.data, waveShape: value.waveShape } } : n);
            set({ nodes });
        }


        if (node instanceof Tone.Volume && typeof value.volume === 'number') {
            if (value.volume === 0 || value.mute) {
                node.volume.rampTo(-Infinity, 0.1);
            } else {
                const db = ((value.volume - 1) / 99) * 36 - 30;
                node.volume.rampTo(db, 0.1);
            }
        }

        // Effect parameter mapping - only apply params that the effect supports
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

        // Generic wet parameter handling for bypass toggle
        if ('wet' in node && typeof value.wet === 'number' && !(node instanceof Tone.Freeverb || node instanceof Tone.FeedbackDelay || node instanceof Tone.Distortion || node instanceof Tone.Phaser)) {
            (node as any).wet.rampTo(value.wet, 0.1);
        }

        
        if (node instanceof Tone.Oscillator && typeof value.frequency === 'number') {
            node.frequency.rampTo(value.frequency, 0.1);
        }
    },

    updateArpScale: (id: string, root: string, scale: string) => {
        const { nodes } = get();
        set({
            nodes: nodes.map((n: AppNode) => n.id === id ? {
                ...n,
                data: { ...n.data, rootNote: root, scaleType: scale }
            } : n)
        });
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
            const newActiveGenerators = new Set(get().activeGenerators);
            newActiveGenerators.delete(id);
            set({ activeGenerators: newActiveGenerators });
        }
    },

    fireNoteOn: (controllerId: string, note: string) => {
        const { edges, audioNodes } = get();
        const targetIds: string[] = [];
        edges.filter(e => e.source === controllerId).forEach(edge => {
            const targetNode = audioNodes.get(edge.target);
            if (targetNode && 'triggerAttack' in targetNode && typeof (targetNode as any).triggerAttack === 'function') {
                (targetNode as any).triggerAttack(note);
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
        edges.filter(e => e.source === controllerId).forEach(edge => {
            const targetNode = audioNodes.get(edge.target);
            if (targetNode && 'triggerRelease' in targetNode && typeof (targetNode as any).triggerRelease === 'function') {
                (targetNode as any).triggerRelease(note);
                targetIds.push(edge.target);
            }
        });
        if (targetIds.length > 0) {
            const newActiveGenerators = new Set(get().activeGenerators);
            targetIds.forEach(id => newActiveGenerators.delete(id));
            set({ activeGenerators: newActiveGenerators });
        }
    },

    toggleNodePlayback: (id, isPlaying) => {
        const { audioNodes, nodes } = get();
        const node = audioNodes.get(id);
        if (node instanceof Tone.Oscillator) {
            isPlaying ? node.start() : node.stop();
        }
        set({
            nodes: nodes.map((n: AppNode) => n.id === id ? { ...n, data: { ...n.data, isPlaying } } : n)
        });
    },

    addNode: (node: AppNode) => {
        set((state: AppState) => ({ nodes: [...state.nodes, node] }));
        if (node.data.subType && node.data.subType !== 'none') {
            get().initAudioNode(node.id, node.type, node.data.subType);
        } else if (node.type === 'speaker') {
            get().initAudioNode(node.id, 'speaker');
        }
    },

    removeNodeAndCleanUp: (id: string) => {
        const { nodes, edges } = get();
        get().removeAudioNode(id);
        set({
            nodes: nodes.filter(n => n.id !== id),
            edges: edges.filter(e => e.source !== id && e.target !== id)
        });
        get().rebuildAudioGraph();
    },

    rebuildAudioGraph: () => {
        const { audioNodes, edges, nodes } = get();
        audioNodes.forEach(node => node.disconnect());
        edges.forEach(edge => {
            const sourceInfo = nodes.find(n => n.id === edge.source);
            if (sourceInfo?.type === 'controller') return;
            const sourceNode = audioNodes.get(edge.source);
            const targetNode = audioNodes.get(edge.target);
            if (sourceNode && targetNode) sourceNode.connect(targetNode);
        });
        nodes.forEach(node => {
            if (node.type === 'speaker') {
                const audioNode = audioNodes.get(node.id);
                if (audioNode) audioNode.toDestination();
            }
        });
    },

    initializeDefaultNodes: () => {
        const { nodes } = get();
        nodes.forEach(node => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (node.type === 'speaker') {
                get().initAudioNode(node.id, 'speaker');
            }
        });
        get().rebuildAudioGraph();
    },
}));