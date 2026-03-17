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

export type AudioNodeType = 'generator' | 'effect' | 'speaker';

export type AppNode = Node & {
    data: { label: string };
    type: AudioNodeType;
};

type AppState = {
    nodes: AppNode[];
    edges: Edge[];
    audioNodes: Map<string, Tone.ToneAudioNode>;
    patterns: Map<string, Tone.Pattern<any>>;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onEdgeUpdate: OnEdgeUpdateFunc;
    onEdgeUpdateStart: (event: React.MouseEvent, edge: Edge) => void;
    onEdgeUpdateEnd: (event: MouseEvent | TouchEvent, edge: Edge) => void;
    initAudioNode: (id: string, type: AudioNodeType) => void;
    removeAudioNode: (id: string) => void;
    updateNodeValue: (id: string, value: any) => void;
    addNode: (node: AppNode) => void;
};

export const useStore = create<AppState>((set, get) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'generator',
            data: { label: 'Chaos Spark' },
            position: { x: 100, y: 200 },
        },
        {
            id: 'node-2',
            type: 'effect',
            data: { label: 'Wash Reverb' },
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

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const currentEdges = get().edges;
        const nextEdges = applyEdgeChanges(changes, currentEdges);

        // Handle audio disconnection when edges are removed
        changes.forEach((change) => {
            if (change.type === 'remove') {
                const edge = currentEdges.find((e) => e.id === change.id);
                if (edge) {
                    const sourceAudio = get().audioNodes.get(edge.source);
                    const targetAudio = get().audioNodes.get(edge.target);
                    if (sourceAudio && targetAudio) {
                        sourceAudio.disconnect(targetAudio);
                    }
                }
            }
        });

        set({ edges: nextEdges });
    },

    onEdgeUpdateStart: () => {
        // We could store the old edge here if needed for more complex logic
    },

    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
        // Disconnect old
        const sourceAudio = get().audioNodes.get(oldEdge.source);
        const targetAudio = get().audioNodes.get(oldEdge.target);
        if (sourceAudio && targetAudio) {
            sourceAudio.disconnect(targetAudio);
        }

        // Connect new
        const newSourceAudio = get().audioNodes.get(newConnection.source || '');
        const newTargetAudio = get().audioNodes.get(newConnection.target || '');
        if (newSourceAudio && newTargetAudio) {
            newSourceAudio.connect(newTargetAudio);
        }

        set({
            edges: updateEdge(oldEdge, newConnection, get().edges),
        });
    },

    onEdgeUpdateEnd: (_, edge) => {
        // Find if this edge still exists in the state
        const exists = get().edges.find((e) => e.id === edge.id);
        
        // If it doesn't exist, it means it was dropped in the void or removed.
        // But React Flow doesn't automatically remove it if onEdgeUpdate isn't called.
        // Actually, if we want to support "disconnecting" by dragging into the void, 
        // we can check if onEdgeUpdate was called. 
        // For now, let's just make sure it's removed if it wasn't re-connected.
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });

        const sourceAudio = get().audioNodes.get(connection.source || '');
        const targetAudio = get().audioNodes.get(connection.target || '');

        if (sourceAudio && targetAudio) {
            sourceAudio.connect(targetAudio);
        }
    },

    initAudioNode: (id, type) => {
        const { audioNodes } = get();
        if (audioNodes.has(id)) return;

        let node: Tone.ToneAudioNode;

        if (type === 'generator') {
            const synth = new Tone.PolySynth();
            const notes = ['C4', 'Eb4', 'F4', 'G4', 'Bb4'];
            
            // Arpeggiator logic
            const pattern = new Tone.Pattern((time, note) => {
                synth.triggerAttackRelease(note, '8n', time);
            }, notes, 'random');
            
            pattern.interval = '8n';
            pattern.start(0);
            
            const { patterns } = get();
            const newPatterns = new Map(patterns);
            newPatterns.set(id, pattern);
            set({ patterns: newPatterns });

            node = synth;
        } else if (type === 'effect') {
            node = new Tone.Reverb({ decay: 4, wet: 0.5 });
        } else {
            // Speaker / Master Output
            node = new Tone.Volume(0).toDestination();
        }

        const newMap = new Map(audioNodes);
        newMap.set(id, node);
        set({ audioNodes: newMap });
    },

    removeAudioNode: (id) => {
        const { audioNodes, patterns } = get();
        
        // Dispose of pattern if it exists
        const pattern = patterns.get(id);
        if (pattern) {
            pattern.stop();
            pattern.dispose();
            const newPatterns = new Map(patterns);
            newPatterns.delete(id);
            set({ patterns: newPatterns });
        }

        const node = audioNodes.get(id);
        if (node) {
            node.disconnect();
            node.dispose();
            const newMap = new Map(audioNodes);
            newMap.delete(id);
            set({ audioNodes: newMap });
        }
    },

    updateNodeValue: (id, value) => {
        const node = get().audioNodes.get(id);
        if (!node) return;

        if ('wet' in node && typeof value.wet === 'number') {
            (node as Tone.Reverb).wet.value = value.wet;
        }

        if (node instanceof Tone.Volume && typeof value.volume === 'number') {
            // Map 0-100 to -60dB to +6dB
            // 0 -> -60dB, 100 -> +6dB
            const db = (value.volume / 100) * 66 - 60;
            node.volume.value = db;
        }
    },

    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
}));