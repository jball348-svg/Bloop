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
    data: { label: string; subType?: string; isPlaying?: boolean };
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
    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => void;
    changeNodeSubType: (id: string, mainType: 'generator' | 'effect', subType: string) => void;
    removeAudioNode: (id: string) => void;
    updateNodeValue: (id: string, value: any) => void;
    toggleNodePlayback: (id: string, isPlaying: boolean) => void;
    addNode: (node: AppNode) => void;
    removeNodeAndCleanUp: (id: string) => void;
    rebuildAudioGraph: () => void;
};

export const useStore = create<AppState>((set, get) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'generator',
            data: { label: 'Chaos Spark', subType: 'arp' },
            position: { x: 100, y: 200 },
        },
        {
            id: 'node-2',
            type: 'effect',
            data: { label: 'Wash Reverb', subType: 'reverb' },
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
        get().rebuildAudioGraph();
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

        get().rebuildAudioGraph();
    },

    initAudioNode: (id: string, type: AudioNodeType, subType?: string) => {
        const { audioNodes } = get();
        if (audioNodes.has(id)) return;

        let node: Tone.ToneAudioNode;

        if (type === 'generator') {
            const actualSubType = subType || 'none';
            if (actualSubType === 'none') return;
            if (actualSubType === 'arp') {
                const synth = new Tone.PolySynth();
                const notes = ['C4', 'Eb4', 'F4', 'G4', 'Bb4'];
                
                // Arpeggiator logic
                const pattern = new Tone.Pattern((time, note) => {
                    synth.triggerAttackRelease(note, '8n', time);
                }, notes, 'random');
                
                pattern.interval = '8n';
                
                const { patterns } = get();
                const newPatterns = new Map(patterns);
                newPatterns.set(id, pattern);
                set({ patterns: newPatterns });

                node = synth;
            } else {
                // 'wave'
                node = new Tone.Oscillator('C4', 'sine');
            }
        } else if (type === 'effect') {
            const actualSubType = subType || 'none';
            if (actualSubType === 'none') return;
            if (actualSubType === 'reverb') {
                node = new Tone.Reverb({ decay: 4, wet: 0.5 });
            } else {
                // 'delay'
                node = new Tone.FeedbackDelay('8n', 0.5);
            }
        } else {
            // Speaker / Master Output
            node = new Tone.Volume(0).toDestination();
        }

        const newMap = new Map(audioNodes);
        newMap.set(id, node);
        set({ audioNodes: newMap });
    },

    changeNodeSubType: (id: string, mainType: 'generator' | 'effect', subType: string) => {
        const { audioNodes, patterns, edges, nodes } = get();
        
        // 1. Dispose old node
        const oldNode = audioNodes.get(id);
        const oldPattern = patterns.get(id);
        
        if (oldPattern) {
            oldPattern.stop();
            oldPattern.dispose();
            const newPatterns = new Map(patterns);
            newPatterns.delete(id);
            set({ patterns: newPatterns });
        }
        
        if (oldNode) {
            oldNode.disconnect();
            oldNode.dispose();
            const newAudioNodes = new Map(audioNodes);
            newAudioNodes.delete(id);
            set({ audioNodes: newAudioNodes });
        }

        // 2. Instantiate new node
        get().initAudioNode(id, mainType, subType);
        
        // 3. Rebuild the graph (replaces surgical reconnection)
        const newNode = get().audioNodes.get(id);
        if (newNode instanceof Tone.Reverb) {
            newNode.ready.then(() => get().rebuildAudioGraph());
        } else {
            get().rebuildAudioGraph();
        }

        // 4. Update Node State (subType)
        set({
            nodes: nodes.map((n) => 
                n.id === id 
                ? { ...n, data: { ...n.data, subType, isPlaying: false } } 
                : n
            )
        });
    },

    removeAudioNode: (id: string) => {
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

    updateNodeValue: (id: string, value: any) => {
        const node = get().audioNodes.get(id);
        if (!node) return;

        if ('wet' in node && typeof value.wet === 'number') {
            (node as any).wet.value = value.wet;
        }

        if (node instanceof Tone.Volume && typeof value.volume === 'number') {
            if (value.volume === 0 || value.mute) {
                node.volume.value = -Infinity;
            } else {
                // Map 1-100 to -30dB to +6dB
                const db = ((value.volume - 1) / 99) * 36 - 30;
                node.volume.value = db;
            }
        }

        if ('wet' in node && typeof value.bypass === 'boolean') {
            (node as any).wet.value = value.bypass ? 0 : (value.wet ?? 0.5);
        }
    },

    toggleNodePlayback: (id, isPlaying) => {
        const { patterns, audioNodes, nodes } = get();
        const pattern = patterns.get(id);
        const node = audioNodes.get(id);

        if (pattern) {
            if (isPlaying) {
                pattern.start(0);
            } else {
                pattern.stop();
            }
        } else if (node instanceof Tone.Oscillator) {
            if (isPlaying) {
                node.start();
            } else {
                node.stop();
            }
        }

        // Update store state
        set({
            nodes: nodes.map((n) =>
                n.id === id
                    ? { ...n, data: { ...n.data, isPlaying } }
                    : n
            )
        });
    },

    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

    removeNodeAndCleanUp: (id) => {
        const { removeAudioNode, nodes, edges } = get();
        
        // 1. Kill the audio
        removeAudioNode(id);
        
        // 2. Remove the node
        const nextNodes = nodes.filter((node) => node.id !== id);
        
        // 3. Remove connected edges
        const nextEdges = edges.filter((edge) => edge.source !== id && edge.target !== id);
        
        set({ nodes: nextNodes, edges: nextEdges });
        get().rebuildAudioGraph();
    },

    rebuildAudioGraph: () => {
        const { audioNodes, edges } = get();

        // 1. Unplug Everything
        audioNodes.forEach((node) => {
            node.disconnect();
        });

        // 2. Re-plug Based on Visuals
        edges.forEach((edge) => {
            const sourceNode = audioNodes.get(edge.source);
            const targetNode = audioNodes.get(edge.target);

            if (sourceNode && targetNode) {
                sourceNode.connect(targetNode);
            }
        });
    },
}));