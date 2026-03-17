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

export const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 3, 5, 7, 10]
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type AudioNodeType = 'generator' | 'effect' | 'speaker';

export type AppNode = Node & {
    data: { 
        label: string; 
        subType?: string; 
        isPlaying?: boolean;
        rootNote?: string;
        scaleType?: keyof typeof SCALES;
    };
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
    updateArpScale: (id: string, root: string, scale: keyof typeof SCALES) => void;
    toggleNodePlayback: (id: string, isPlaying: boolean) => void;
    addNode: (node: AppNode) => void;
    removeNodeAndCleanUp: (id: string) => void;
    rebuildAudioGraph: () => void;
    initializeDefaultNodes: () => void;
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

        set({ edges: nextEdges });
        get().rebuildAudioGraph();
    },

    onEdgeUpdateStart: () => {
        // We could store the old edge here if needed for more complex logic
    },

    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
        set({
            edges: updateEdge(oldEdge, newConnection, get().edges),
        });
        get().rebuildAudioGraph();
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
            if (actualSubType === 'none') {
                 // Ensure entry exists for 'none' but is essentially silent/unconnected
                 // or just remove it from the map if it was there
                 const nextAudioNodes = new Map(audioNodes);
                 nextAudioNodes.delete(id);
                 set({ audioNodes: nextAudioNodes });
                 return;
            }
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
            if (actualSubType === 'none') {
                const nextAudioNodes = new Map(audioNodes);
                nextAudioNodes.delete(id);
                set({ audioNodes: nextAudioNodes });
                return;
            }
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
                node = new Tone.Volume(0); // Fallback
            }
        } else {
            // Speaker / Master Output
            node = new Tone.Volume(0).toDestination();
        }

        const newMap = new Map(get().audioNodes);
        newMap.set(id, node);
        set({ audioNodes: newMap });
    },

    changeNodeSubType: (id: string, mainType: 'generator' | 'effect', subType: string) => {
        const { audioNodes, patterns, nodes } = get();
        
        // 0. Capture state
        const wasPlaying = nodes.find(n => n.id === id)?.data.isPlaying || false;

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
        
        // 3. Update Node State (subType) immediately so visuals reflect it
        set({
            nodes: nodes.map((n) => 
                n.id === id 
                ? { ...n, data: { ...n.data, subType, isPlaying: wasPlaying } } 
                : n
            )
        });

        // 4. Rebuild the graph and re-apply playback
        const handleRebuildAndPlayback = () => {
            get().rebuildAudioGraph();
            if (wasPlaying) {
                get().toggleNodePlayback(id, true);
            }
        };

        const newNode = get().audioNodes.get(id);
        if (newNode instanceof Tone.Reverb) {
            newNode.ready.then(handleRebuildAndPlayback);
        } else {
            handleRebuildAndPlayback();
        }
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
            (node as any).wet.rampTo(value.wet, 0.1);
        }

        if (node instanceof Tone.Volume && typeof value.volume === 'number') {
            if (value.volume === 0 || value.mute) {
                node.volume.rampTo(-Infinity, 0.1);
            } else {
                // Map 1-100 to -30dB to +6dB
                const db = ((value.volume - 1) / 99) * 36 - 30;
                node.volume.rampTo(db, 0.1);
            }
        }

        if ('wet' in node && typeof value.bypass === 'boolean') {
            const wetValue = value.bypass ? 0 : (value.wet ?? 0.5);
            (node as any).wet.rampTo(wetValue, 0.1);
        }

        // New mappings for advanced sliders
        if (node instanceof Tone.Freeverb && typeof value.roomSize === 'number') {
            // roomSize on Freeverb is not a signal-rate param and cannot be ramped
            node.roomSize.value = value.roomSize;
        }

        if (node instanceof Tone.FeedbackDelay && typeof value.delayTime === 'number') {
            node.delayTime.rampTo(value.delayTime, 0.1);
        }

        if (node instanceof Tone.Oscillator && typeof value.frequency === 'number') {
            node.frequency.rampTo(value.frequency, 0.1);
        }

        if (node instanceof Tone.Distortion && typeof value.distortion === 'number') {
            node.distortion = value.distortion;
        }

        if (node instanceof Tone.Phaser && typeof value.frequency === 'number') {
            node.frequency.rampTo(value.frequency, 0.1);
        }

        if (node instanceof Tone.BitCrusher && typeof value.bits === 'number') {
            node.bits.value = value.bits;
        }
    },

    updateArpScale: (id, root, scale) => {
        const { patterns, nodes } = get();
        const pattern = patterns.get(id);
        if (!pattern) return;

        // Calculate notes for Octave 4
        const intervals = SCALES[scale];
        const rootIndex = ROOT_NOTES.indexOf(root);
        const newNotes = intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            const octaveShift = Math.floor((rootIndex + interval) / 12);
            const noteName = ROOT_NOTES[noteIndex];
            return `${noteName}${4 + octaveShift}`;
        });

        pattern.values = newNotes;

        // Update node data
        set({
            nodes: nodes.map(n => n.id === id ? {
                ...n,
                data: { ...n.data, rootNote: root, scaleType: scale }
            } : n)
        });
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

    addNode: (node) => {
        set((state) => ({ nodes: [...state.nodes, node] }));
        // Automatically initialize audio if it has a subtype
        if (node.data.subType && node.data.subType !== 'none') {
             get().initAudioNode(node.id, node.type as any, node.data.subType);
        } else if (node.type === 'speaker') {
             get().initAudioNode(node.id, 'speaker');
        }
    },

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
        const { audioNodes, edges, nodes } = get();

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

        // 3. Ensure Speaker nodes are connected to Destination
        // Because node.disconnect() wipes EVERYTHING, including .toDestination()
        nodes.forEach((node) => {
            if (node.type === 'speaker') {
                const audioNode = audioNodes.get(node.id);
                if (audioNode) {
                    audioNode.toDestination();
                }
            }
        });
    },

    initializeDefaultNodes: () => {
        const { nodes, initAudioNode } = get();
        nodes.forEach((node) => {
            if (node.data.subType && node.data.subType !== 'none') {
                initAudioNode(node.id, node.type as any, node.data.subType);
            } else if (node.type === 'speaker') {
                initAudioNode(node.id, 'speaker');
            }
        });
        get().rebuildAudioGraph();
    },
}));