'use client';

import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    BackgroundVariant,
    Connection,
    Edge,
    Node as FlowNode,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import {
    useStore,
    AudioNodeType,
    DEFAULT_TRANSPORT_BPM,
    CONTROL_WIRE_PAIRS,
    getNodeAdjacencyAxis,
    ADJ_TOUCH_THRESHOLD,
    ADJ_Y_THRESHOLD,
    ADJ_VERT_THRESHOLD,
    ADJ_X_THRESHOLD,
    AUDIO_SIGNAL_COLOR,
} from '@/store/useStore';
import GeneratorNode from '@/components/GeneratorNode';
import ControllerNode from '@/components/ControllerNode';
import KeysNode from '@/components/KeysNode';
import ChordNode from '@/components/ChordNode';
import DrumNode from '@/components/DrumNode';
import EffectNode from '@/components/EffectNode';
import UnisonNode from '@/components/UnisonNode';
import DetuneNode from '@/components/DetuneNode';
import VisualiserNode from '@/components/VisualiserNode';
import PulseNode from '@/components/PulseNode';
import StepSequencerNode from '@/components/StepSequencerNode';
import SignalFlowOverlay from '@/components/SignalFlowOverlay';
import QuantizerNode from '@/components/QuantizerNode';
import MoodPadNode from '@/components/MoodPadNode';
import SpeakerNode from '@/components/SpeakerNode';
import TempoNode from '@/components/TempoNode';
import AdsrNode from '@/components/AdsrNode';
import EngineControl from '@/components/EngineControl';
import SignalMenu from '@/components/SignalMenu';
import ControllerMenu from '@/components/ControllerMenu';
import GlobalMenu from '@/components/GlobalMenu';
import SystemMenu from '@/components/SystemMenu';

// Actual rendered widths from Tailwind classes on each component:
//   ControllerNode → w-72 = 288px
//   KeysNode → w-72 = 288px
//   GeneratorNode → w-60 = 240px
//   EffectNode / SpeakerNode / AdsrNode / ChordNode → w-56 = 224px
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    keys:        { w: 288, h: 320 },
    moodpad:     { w: 320, h: 416 },
    pulse:       { w: 288, h: 280 },
    stepsequencer: { w: 352, h: 420 },
    chord:      { w: 224, h: 240 },
    quantizer:  { w: 240, h: 272 },
    adsr:       { w: 224, h: 340 },
    generator:  { w: 240, h: 220 },
    drum:       { w: 320, h: 360 },
    effect:     { w: 224, h: 260 },
    unison:     { w: 224, h: 220 },
    detune:     { w: 224, h: 200 },
    visualiser: { w: 224, h: 220 },
    speaker:    { w: 224, h: 200 },
    tempo:      { w: 256, h: 240 },
};
const DEFAULT_DIMS = { w: 224, h: 220 };
const getDims = (type: string) => NODE_DIMS[type] ?? DEFAULT_DIMS;

const SNAP_GRID = 15;
const snap = (v: number) => Math.round(v / SNAP_GRID) * SNAP_GRID;

function BloopCanvasInner() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate: storeOnEdgeUpdate,
        addNode,
        removeNodeAndCleanUp,
    } = useStore();
    const validateConnection = useStore((state) => state.isValidConnection);

    const { screenToFlowPosition } = useReactFlow();
    const edgeUpdateSuccessful = useRef(true);

    const recalculateAdjacency = useStore((state) => state.recalculateAdjacency);
    const sanitizeLegacyTempoEdges = useStore((state) => state.sanitizeLegacyTempoEdges);
    const undo = useStore((state) => state.undo);
    const redo = useStore((state) => state.redo);
    
    useEffect(() => {
        sanitizeLegacyTempoEdges();
        recalculateAdjacency();
    }, [recalculateAdjacency, sanitizeLegacyTempoEdges]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Guard against input/select elements
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
                return;
            }

            if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault();
                redo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const nodeTypes = useMemo(() => ({
        generator: GeneratorNode,
        controller: ControllerNode,
        keys: KeysNode,
        chord: ChordNode,
        drum: DrumNode,
        effect: EffectNode,
        unison: UnisonNode,
        detune: DetuneNode,
        visualiser: VisualiserNode,
        quantizer: QuantizerNode,
        moodpad: MoodPadNode,
        pulse: PulseNode,
        stepsequencer: StepSequencerNode,
        speaker: SpeakerNode,
        tempo: TempoNode,
        adsr: AdsrNode,
    }), []);

    const defaultEdgeOptions = useMemo(() => ({
        style: {
            stroke: AUDIO_SIGNAL_COLOR,
            strokeWidth: 2.5,
            filter: `drop-shadow(0 0 6px ${AUDIO_SIGNAL_COLOR})`,
        },
        focusable: false,
    }), []);

    const onEdgeUpdateStart = useCallback(() => {
        edgeUpdateSuccessful.current = false;
    }, []);

    const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeUpdateSuccessful.current = true;
        storeOnEdgeUpdate(oldEdge, newConnection);
    }, [storeOnEdgeUpdate]);

    const onEdgeUpdateEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
        if (!edgeUpdateSuccessful.current) {
            onEdgesChange([{ id: edge.id, type: 'remove' }]);
        }
    }, [onEdgesChange]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow') as AudioNodeType;
        if (!type) return;

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        let subType = 'none';
        let label = '';
        const bpm = DEFAULT_TRANSPORT_BPM;
        if (type === 'controller') subType = 'arp';
        if (type === 'keys') {
            subType = 'keys';
            label = 'Keys';
        }
        if (type === 'moodpad') {
            label = 'Mood Pad';
        }
        if (type === 'pulse') {
            label = 'Pulse';
        }
        if (type === 'stepsequencer') {
            label = 'Sequencer';
        }
        if (type === 'chord') {
            subType = 'major';
            label = 'Chord';
        }
        if (type === 'quantizer') {
            label = 'Quantizer';
        }
        if (type === 'adsr') {
            label = 'ADSR';
        }
        if (type === 'generator') {
            subType = 'wave';
            label = 'Oscillator';
        }
        if (type === 'drum') label = 'Drums';
        if (type === 'effect') subType = 'reverb';
        if (type === 'unison') {
            label = 'Unison';
        }
        if (type === 'detune') {
            label = 'Detune';
        }
        if (type === 'visualiser') {
            label = 'Visualiser';
        }
        if (type === 'speaker') label = 'Master Out';
        if (type === 'tempo') label = 'Tempo';

        addNode({
            id: crypto.randomUUID(),
            type,
            position,
            data: {
                label,
                subType,
                isPlaying: false,
                bpm,
                ...(type === 'adsr' ? { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.5 } : {}),
                ...(type === 'drum' ? { drumMode: 'hits' as const } : {}),
            },
        });

        setTimeout(() => useStore.getState().recalculateAdjacency(), 0);
    }, [screenToFlowPosition, addNode]);

    const onNodeDragStop = useCallback((event: React.MouseEvent, draggedNode: FlowNode) => {
        // Trash bin check — synchronous, before the setTimeout
        const trashBin = document.getElementById('trash-bin');
        if (trashBin) {
            const rect = trashBin.getBoundingClientRect();
            if (
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom
            ) {
                removeNodeAndCleanUp(draggedNode.id);
                return;
            }
        }

        // Capture nodes and position synchronously before the timeout
        const allNodes = useStore.getState().nodes;
        const initialX = draggedNode.position.x;
        const initialY = draggedNode.position.y;

        // Defer one tick so ReactFlow finishes writing its own snapped position first
        setTimeout(() => {
            if (draggedNode.type === 'tempo' || draggedNode.type === 'speaker') {
                useStore.getState().recalculateAdjacency();
                return;
            }
            
            let x = initialX;
            let y = initialY;

            const draggedDims = getDims(draggedNode.type!);

            // Multi-pass to handle chain reactions (A pushes into B which also overlaps C)
            for (let pass = 0; pass < 10; pass++) {
                let moved = false;

                for (const n of allNodes) {
                    if (n.id === draggedNode.id || n.type === 'tempo' || n.type === 'speaker') continue;

                    const nDims = getDims(n.type);
                    const axis = getNodeAdjacencyAxis(
                        draggedNode.type as AudioNodeType,
                        n.type as AudioNodeType
                    );

                    if (axis === 'horizontal') {
                        const gapRight = n.position.x - (x + draggedDims.w);
                        const gapLeft = x - (n.position.x + nDims.w);
                        const horizGap = Math.max(gapRight, gapLeft);
                        const draggedCentreY = y + draggedDims.h / 2;
                        const nCentreY = n.position.y + nDims.h / 2;
                        const vertDist = Math.abs(draggedCentreY - nCentreY);

                        if (horizGap >= 0 && horizGap <= ADJ_TOUCH_THRESHOLD && vertDist <= ADJ_Y_THRESHOLD) {
                            const draggedType = draggedNode.type as AudioNodeType;
                            const nType = n.type as AudioNodeType;
                            const draggedIsUpstream = CONTROL_WIRE_PAIRS.has(`${draggedType}->${nType}`);

                            x = draggedIsUpstream
                                ? snap(n.position.x - draggedDims.w)
                                : snap(n.position.x + nDims.w);
                            y = n.position.y;
                            moved = true;
                            break;
                        }
                    } else if (axis === 'vertical') {
                        const gapBelow = n.position.y - (y + draggedDims.h);
                        const gapAbove = y - (n.position.y + nDims.h);
                        const vertGap = Math.max(gapBelow, gapAbove);
                        const draggedCentreX = x + draggedDims.w / 2;
                        const nCentreX = n.position.x + nDims.w / 2;
                        const horizDist = Math.abs(draggedCentreX - nCentreX);

                        if (vertGap >= 0 && vertGap <= ADJ_VERT_THRESHOLD && horizDist <= ADJ_X_THRESHOLD) {
                            const draggedCentreY = y + draggedDims.h / 2;
                            const nCentreY = n.position.y + nDims.h / 2;
                            y = draggedCentreY >= nCentreY
                                ? snap(n.position.y + nDims.h)
                                : snap(n.position.y - draggedDims.h);
                            x = n.position.x;
                            moved = true;
                            break;
                        }
                    }

                    // Check for actual overlap - nodes must be overlapping, not just close
                    const overlapX = x < n.position.x + nDims.w && x + draggedDims.w > n.position.x;
                    const overlapY = y < n.position.y + nDims.h && y + draggedDims.h > n.position.y;

                    if (overlapX && overlapY) {
                        // Calculate overlap area to ensure there's meaningful overlap
                        const overlapWidth = Math.min(x + draggedDims.w, n.position.x + nDims.w) - Math.max(x, n.position.x);
                        const overlapHeight = Math.min(y + draggedDims.h, n.position.y + nDims.h) - Math.max(y, n.position.y);
                        const overlapArea = overlapWidth * overlapHeight;
                        
                        // Only snap if there's significant overlap (more than just edge touching)
                        const minOverlapArea = 100; // Minimum 10x10 pixels of overlap
                        if (overlapArea < minOverlapArea) continue;

                        if (axis === 'horizontal') {
                            // Use signal flow direction to determine correct left/right placement.
                            const draggedType = draggedNode.type as AudioNodeType;
                            const nType = n.type as AudioNodeType;
                            const draggedIsUpstream = CONTROL_WIRE_PAIRS.has(`${draggedType}->${nType}`);

                            if (draggedIsUpstream) {
                                // Dragged node feeds into n → it belongs to the LEFT of n
                                x = snap(n.position.x - draggedDims.w);
                            } else {
                                // n feeds into dragged node → it belongs to the RIGHT of n
                                x = snap(n.position.x + nDims.w);
                            }

                            // Align Y so nodes sit on the same row
                            y = n.position.y;
                            moved = true;
                        } else if (axis === 'vertical') {
                            // Push up/down, align X (new behavior)
                            const draggedCentreY = y + draggedDims.h / 2;
                            const nCentreY = n.position.y + nDims.h / 2;
                            if (draggedCentreY >= nCentreY) {
                                // Dragged node centre is below obstacle centre → snap below
                                y = snap(n.position.y + nDims.h);
                            } else {
                                // Dragged node centre is above obstacle centre → snap above
                                y = snap(n.position.y - draggedDims.h);
                            }
                            x = n.position.x; // align to same column
                            moved = true;
                        }

                        if (moved) break; // stop checking other stationary nodes — one snap per pass
                    }
                }

                if (!moved) break;
            }

            // Only update if position actually changed from original
            if (x !== initialX || y !== initialY) {
                useStore.getState().onNodesChange([{
                    id: draggedNode.id,
                    type: 'position',
                    position: { x, y },
                    dragging: false,
                }]);
            }

            useStore.getState().recalculateAdjacency();
        }, 0);
    }, [removeNodeAndCleanUp]);

    return (
        <main className="w-screen h-screen relative select-none">
            <SignalMenu />
            <ControllerMenu />
            <GlobalMenu />
            <SystemMenu />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onEdgeUpdateStart={onEdgeUpdateStart}
                onEdgeUpdateEnd={onEdgeUpdateEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                isValidConnection={(connection: Connection) => validateConnection(connection)}
                connectionLineStyle={{ stroke: '#475569', strokeWidth: 2, strokeDasharray: '5 5' }}
                fitView
                fitViewOptions={{ maxZoom: 0.8, padding: 0.2 }}
                className="bg-slate-950"
                edgesUpdatable={true}
                snapToGrid={true}
                snapGrid={[SNAP_GRID, SNAP_GRID]}
                minZoom={0.05}
                translateExtent={[[-100000, -100000], [100000, 100000]]}
                nodeExtent={[[-100000, -100000], [100000, 100000]]}
                autoPanOnNodeDrag={true}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#1e293b"
                />
                <Controls position="bottom-right" showInteractive={false} />
            </ReactFlow>
            <SignalFlowOverlay />

            <div
                id="trash-bin"
                className="absolute bottom-4 right-24 w-16 h-16 bg-cyan-900/50 border border-cyan-400 rounded-xl flex items-center justify-center transition-all hover:bg-cyan-800/60 z-50 pointer-events-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
            </div>

            <EngineControl />
        </main>
    );
}

export default function BloopCanvas() {
    return (
        <ReactFlowProvider>
            <BloopCanvasInner />
        </ReactFlowProvider>
    );
}
