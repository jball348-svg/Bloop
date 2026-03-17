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
        octave?: number;
    };
    type: AudioNodeType;
};

// Rendered pixel widths/heights per node type (must stay in sync with Tailwind classes)
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    generator:  { w: 224, h: 220 },
    effect:     { w: 224, h: 260 },
    speaker:    { w: 224, h: 200 },
};
const DEFAULT_DIMS = { w: 224, h: 220 };
const getDims = (type: string) => NODE_DIMS[type] ?? DEFAULT_DIMS;

// Gap threshold within which two nodes are considered "adjacent" (snapped)
const ADJ_TOUCH_THRESHOLD = 48;
// Y-centres must be within this many px of each other to count as adjacent
const ADJ_Y_THRESHOLD = 100;

const AUTO_EDGE_PREFIX = 'auto-';

const SIGNAL_ORDER: Record<AudioNodeType, number> = {
    controller: 0,
    generator: 1,
    effect: 2,
    speaker: 3,
};

const VALID_AUTO_WIRE_PAIRS = new Set([
    'controller->generator',
    'generator->effect',
    'generator->speaker',
    'effect->effect',
    'effect->speaker',
]);

type AppState = {
    nodes: AppNode[];
    edges: Edge[];
    audioNodes: Map<string, Tone.ToneAudioNode>;
    patterns: Map<string, Tone.Pattern<any>>;
    activeGenerators: Set<string>;
    adjacentNodeIds: Set<string>;
    autoEdgeIds: Set<string>;
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
    updateOctave: (id: string, octave: number) => void;
    triggerNoteOn: (id: string, note: string) => void;
    triggerNoteOff: (id: string, note: string) => void;
    fireNoteOn: (controllerId: string, note: string) => void;
    fireNoteOff: (controllerId: string, note: string) => void;
    toggleNodePlayback: (id: string, isPlaying: boolean) => void;
    addNode: (node: AppNode) => void;
    removeNodeAndCleanUp: (id: string) => void;
    rebuildAudioGraph: () => void;
    initializeDefaultNodes: () => void;
    recalculateAdjacency: () => void;
    autoWireAdjacentNodes: () => void;
};

export const useStore = create<AppState>((set: any, get: any) => ({
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
        {
            id: 'auto-node-2-node-3',
            source: 'node-2',
            target: 'node-3',
            hidden: true,
        },
    ],
    audioNodes: new Map(),
    patterns: new Map(),
    activeGenerators: new Set(),
    adjacentNodeIds: new Set(),
    autoEdgeIds: new Set(['auto-node-1-node-2', 'auto-node-2-node-3']),

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
            node = new Tone.PolySynth();
        } else if (type === 'controller') {
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
            ),
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

        if (value.waveShape) {
            if (node instanceof Tone.Oscillator) {
                node.set({ type: value.waveShape });
            } else if (node instanceof Tone.PolySynth) {
                node.set({ oscillator: { type: value.waveShape } });
            }
            const nodes = get().nodes.map((n: AppNode) =>
                n.id === id ? { ...n, data: { ...n.data, waveShape: value.waveShape } } : n
            );
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
        edges.filter((e: Edge) => e.source === controllerId).forEach((edge: Edge) => {
            const targetNode = audioNodes.get(edge.target);
            if (
                targetNode &&
                'triggerAttack' in targetNode &&
                typeof (targetNode as any).triggerAttack === 'function'
            ) {
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
        edges.filter((e: Edge) => e.source === controllerId).forEach((edge: Edge) => {
            const targetNode = audioNodes.get(edge.target);
            if (
                targetNode &&
                'triggerRelease' in targetNode &&
                typeof (targetNode as any).triggerRelease === 'function'
            ) {
                (targetNode as any).triggerRelease(note);
                targetIds.push(edge.target);
            }
        });
        if (targetIds.length > 0) {
            const next = new Set(get().activeGenerators);
            targetIds.forEach(id => next.delete(id));
            set({ activeGenerators: next });
        }
    },

    toggleNodePlayback: (id, isPlaying) => {
        const { audioNodes, nodes } = get();
        const node = audioNodes.get(id);
        if (node instanceof Tone.Oscillator) {
            isPlaying ? node.start() : node.stop();
        }
        set({
            nodes: nodes.map((n: AppNode) =>
                n.id === id ? { ...n, data: { ...n.data, isPlaying } } : n
            ),
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
            nodes: nodes.filter((n: AppNode) => n.id !== id),
            edges: edges.filter((e: Edge) => e.source !== id && e.target !== id),
        });
        get().rebuildAudioGraph();
        get().recalculateAdjacency();
    },

    rebuildAudioGraph: () => {
        const { audioNodes, edges, nodes } = get() as AppState;
        audioNodes.forEach((node: Tone.ToneAudioNode) => node.disconnect());
        // Route ALL edges — including hidden auto-edges — so audio flows through snapped chains
        edges.forEach((edge: Edge) => {
            const sourceInfo = nodes.find((n: AppNode) => n.id === edge.source);
            if (sourceInfo?.type === 'controller') return;
            const sourceNode = audioNodes.get(edge.source);
            const targetNode = audioNodes.get(edge.target);
            if (sourceNode && targetNode) sourceNode.connect(targetNode);
        });
        nodes.forEach((node: AppNode) => {
            if (node.type === 'speaker') {
                const audioNode = audioNodes.get(node.id);
                if (audioNode) audioNode.toDestination();
            }
        });
    },

    initializeDefaultNodes: () => {
        const { nodes } = get();
        nodes.forEach((node: AppNode) => {
            if (node.data.subType && node.data.subType !== 'none') {
                get().initAudioNode(node.id, node.type, node.data.subType);
            } else if (node.type === 'speaker') {
                get().initAudioNode(node.id, 'speaker');
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
        const manualEdges = edges.filter((e: Edge) => !managedIds.has(e.id));

        // Auto-edges are hidden: audio routes through them, no visual wire rendered
        const nextAutoEdges: Edge[] = desiredAutoEdges.map(({ source, target, id }) => ({
            id,
            source,
            target,
            hidden: true, // invisible — connection is implied by the snap/glow, not a cable
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
