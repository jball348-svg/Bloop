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
} from '@/store/useStore';
import GeneratorNode from '@/components/GeneratorNode';
import ControllerNode from '@/components/ControllerNode';
import ChordNode from '@/components/ChordNode';
import DrumNode from '@/components/DrumNode';
import EffectNode from '@/components/EffectNode';
import SpeakerNode from '@/components/SpeakerNode';
import TempoNode from '@/components/TempoNode';
import EngineControl from '@/components/EngineControl';
import SignalMenu from '@/components/SignalMenu';
import ControllerMenu from '@/components/ControllerMenu';
import GlobalMenu from '@/components/GlobalMenu';
import SystemMenu from '@/components/SystemMenu';

// Actual rendered widths from Tailwind classes on each component:
//   ControllerNode → w-72 = 288px
//   GeneratorNode / EffectNode / SpeakerNode → w-56 = 224px
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    chord:      { w: 224, h: 240 },
    generator:  { w: 224, h: 220 },
    drum:       { w: 320, h: 360 },
    effect:     { w: 224, h: 260 },
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
    useEffect(() => {
        sanitizeLegacyTempoEdges();
        recalculateAdjacency();
    }, [recalculateAdjacency, sanitizeLegacyTempoEdges]);

    const nodeTypes = useMemo(() => ({
        generator: GeneratorNode,
        controller: ControllerNode,
        chord: ChordNode,
        drum: DrumNode,
        effect: EffectNode,
        speaker: SpeakerNode,
        tempo: TempoNode,
    }), []);

    const defaultEdgeOptions = useMemo(() => ({
        style: { stroke: '#22d3ee', strokeWidth: 2.5, filter: 'drop-shadow(0 0 6px #22d3ee)' },
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
        if (type === 'chord') {
            subType = 'major';
            label = 'Chord';
        }
        if (type === 'generator') {
            subType = 'wave';
            label = 'Oscillator';
        }
        if (type === 'drum') label = 'Drums';
        if (type === 'effect') subType = 'reverb';
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

        // Defer one tick so ReactFlow finishes writing its own snapped position first
        setTimeout(() => {
            const allNodes = useStore.getState().nodes;
            const currentNode = allNodes.find(n => n.id === draggedNode.id);
            if (!currentNode) return;

            const draggedDims = getDims(draggedNode.type ?? currentNode.type);
            let x = currentNode.position.x;
            let y = currentNode.position.y;

            // Store original position to check if there was actual overlap
            const originalX = x;
            const originalY = y;

            // Multi-pass to handle chain reactions (A pushes into B which also overlaps C)
            for (let pass = 0; pass < 10; pass++) {
                let moved = false;

                for (const n of allNodes) {
                    if (n.id === draggedNode.id) continue;

                    const nDims = getDims(n.type);

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

                        // Snap based on where the dragged node's centre is relative to
                        // the obstacle's centre — this gives the intuitive lego-click feel.
                        // If dragged centre is to the RIGHT of obstacle centre → go right.
                        // If dragged centre is to the LEFT  of obstacle centre → go left.
                        const draggedCentreX = x + draggedDims.w / 2;
                        const nCentreX = n.position.x + nDims.w / 2;

                        if (draggedCentreX >= nCentreX) {
                            // Snap dragged node's LEFT edge flush with obstacle's RIGHT edge
                            x = snap(n.position.x + nDims.w);
                        } else {
                            // Snap dragged node's RIGHT edge flush with obstacle's LEFT edge
                            x = snap(n.position.x - draggedDims.w);
                        }

                        // Also align Y so nodes sit on the same row — the lego row feel
                        y = n.position.y;

                        moved = true;
                    }
                }

                if (!moved) break;
            }

            // Only update if position actually changed from original
            if (x !== originalX || y !== originalY) {
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
        <main className="w-screen h-screen relative">
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
                className="bg-slate-950"
                edgesUpdatable={true}
                snapToGrid={true}
                snapGrid={[SNAP_GRID, SNAP_GRID]}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#1e293b"
                />
                <Controls position="bottom-right" showInteractive={false} />
            </ReactFlow>

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
