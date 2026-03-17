'use client';

import React, { useMemo, useRef, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    BackgroundVariant,
    Edge,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import { useStore, AudioNodeType, AppNode } from '@/store/useStore';
import GeneratorNode from '@/components/GeneratorNode';
import ControllerNode from '@/components/ControllerNode';
import EffectNode from '@/components/EffectNode';
import SpeakerNode from '@/components/SpeakerNode';
import EngineControl from '@/components/EngineControl';
import Toolbar from '@/components/Toolbar';

// Node dimensions — must match the Tailwind classes on each node component
// GeneratorNode / EffectNode / SpeakerNode: w-56 = 224px
// ControllerNode: w-72 = 288px
// We use the larger value as a safe upper bound so nothing ever clips
const NODE_W = 288;
const NODE_H = 220; // conservative: nodes are min-h-[160px] but controls add height
const SNAP_GRID = 15; // must match snapGrid prop on ReactFlow

const snapToGrid = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

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

    const { screenToFlowPosition } = useReactFlow();
    const edgeUpdateSuccessful = useRef(true);

    const nodeTypes = useMemo(() => ({
        generator: GeneratorNode,
        controller: ControllerNode,
        effect: EffectNode,
        speaker: SpeakerNode,
    }), []);

    const defaultEdgeOptions = useMemo(() => ({
        style: { stroke: '#22d3ee', strokeWidth: 2.5, filter: 'drop-shadow(0 0 6px #22d3ee)' },
        focusable: false,
    }), []);

    const onEdgeUpdateStart = useCallback(() => {
        edgeUpdateSuccessful.current = false;
    }, []);

    const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: any) => {
        edgeUpdateSuccessful.current = true;
        storeOnEdgeUpdate(oldEdge, newConnection);
    }, [storeOnEdgeUpdate]);

    const onEdgeUpdateEnd = useCallback((_: any, edge: Edge) => {
        if (!edgeUpdateSuccessful.current) {
            onEdgesChange([{ id: edge.id, type: 'remove' }]);
        }
    }, [onEdgesChange]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow') as AudioNodeType;
            if (!type) return;

            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

            let subType = 'none';
            if (type === 'controller') subType = 'arp';
            if (type === 'generator') subType = 'wave';
            if (type === 'effect') subType = 'reverb';

            addNode({
                id: crypto.randomUUID(),
                type,
                position,
                data: { label: '', subType, isPlaying: false },
            });
        },
        [screenToFlowPosition, addNode]
    );

    const onNodeDragStop = useCallback((event: any, draggedNode: any) => {
        // --- Trash bin check ---
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

        const allNodes = useStore.getState().nodes;

        // Start from the node's current dropped position (already grid-snapped by ReactFlow)
        let x = draggedNode.position.x;
        let y = draggedNode.position.y;

        // Run up to 8 passes — each pass resolves any remaining overlap.
        // Multiple passes handle chain-reactions (pushing into a third node).
        for (let pass = 0; pass < 8; pass++) {
            let movedThisPass = false;

            for (const n of allNodes) {
                if (n.id === draggedNode.id) continue;

                // Strict bounding-box overlap test — no padding, so flush = touching = OK
                const overlapX = x < n.position.x + NODE_W && x + NODE_W > n.position.x;
                const overlapY = y < n.position.y + NODE_H && y + NODE_H > n.position.y;

                if (overlapX && overlapY) {
                    // How far do we need to push in each horizontal direction to clear?
                    const distToRight = n.position.x + NODE_W - x; // push dragged node rightward by this
                    const distToLeft  = x + NODE_W - n.position.x; // push dragged node leftward by this

                    if (distToRight <= distToLeft) {
                        // Cheaper to go right — place flush against right edge of blocker
                        x = snapToGrid(n.position.x + NODE_W);
                    } else {
                        // Cheaper to go left — place flush against left edge of blocker
                        x = snapToGrid(n.position.x - NODE_W);
                    }
                    movedThisPass = true;
                }
            }

            // If nothing moved this pass, we're fully resolved
            if (!movedThisPass) break;
        }

        // Only fire a position update if we actually moved the node
        if (x !== draggedNode.position.x || y !== draggedNode.position.y) {
            useStore.getState().onNodesChange([{
                id: draggedNode.id,
                type: 'position',
                position: { x, y },
                dragging: false,
            }]);
        }
    }, [removeNodeAndCleanUp]);

    return (
        <main className="w-screen h-screen relative">
            <Toolbar />
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
                className="absolute bottom-4 right-24 w-16 h-16 bg-red-900/50 border border-red-500 rounded-xl flex items-center justify-center transition-all hover:bg-red-800/60 z-50 pointer-events-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
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
