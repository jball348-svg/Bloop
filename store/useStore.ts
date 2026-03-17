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
} from 'reactflow';

export type AudioNodeType = 'generator' | 'effect';

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
    initAudioNode: (id: string, type: AudioNodeType) => void;
    removeAudioNode: (id: string) => void;
    updateNodeValue: (id: string, value: any) => void;
};

export const useStore = create<AppState>((set, get) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'generator',
            data: { label: 'Chaos Spark' },
            position: { x: 250, y: 150 },
        },
        {
            id: 'node-2',
            type: 'effect',
            data: { label: 'Wash Reverb' },
            position: { x: 500, y: 300 },
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
                        // If it's a generator, ensure it still routes to destination if nothing else is attached
                        // (Actually, better to connect to destination by default in init and let connections override)
                    }
                }
            }
        });

        set({ edges: nextEdges });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });

        const sourceAudio = get().audioNodes.get(connection.source || '');
        const targetAudio = get().audioNodes.get(connection.target || '');

        if (sourceAudio && targetAudio) {
            sourceAudio.connect(targetAudio);
            targetAudio.toDestination();
        }
    },

    initAudioNode: (id, type) => {
        const { audioNodes } = get();
        if (audioNodes.has(id)) return;

        let node: Tone.ToneAudioNode;

        if (type === 'generator') {
            const synth = new Tone.PolySynth().toDestination();
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
        } else {
            node = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination();
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
        if (node && 'wet' in node && typeof value.wet === 'number') {
            (node as Tone.Reverb).wet.value = value.wet;
        }
    },
}));