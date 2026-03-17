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
import { useStore, AudioNodeType } from '@/store/useStore';
import GeneratorNode from '@/components/GeneratorNode';
import ControllerNode from '@/components/ControllerNode';
import EffectNode from '@/components/EffectNode';
import SpeakerNode from '@/components/SpeakerNode';
import EngineControl from '@/components/EngineControl';
import Toolbar from '@/components/Toolbar';

// Actual rendered widths from Tailwind classes on each component:
//   ControllerNode  → w-72  = 288px
//   GeneratorNode   → w-56  = 224px
//   EffectNode      → w-56  = 224px
//   SpeakerNode     → w-56  = 224px
// Heights are approximate maximums (expanded state).
const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    generator:  { w: 224, h: 220 },
    effect:     { w: 224, h: 260 },
    speaker:    { w: 224, h: 200 },
};
const DEFAULT_DIMS = { w: 224, h: 220 };

const SNAP_GRID = 15;
const snap = (v: number) => Math.round(v / SNAP_GRID) * SNAP_GRID;

const getDims = (type: string) => NODE_DIMS[type] ?? DEFAULT_DIMS;

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

    const onDrop = useCallback((event: React.DragEvent) => {
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
    }, [screenToFlowPosition, addNode]);

    const onNodeDragStop = useCallback((event: any, draggedNode: any) => {
        // Trash bin check — must run synchronously before the setTimeout
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

        // Defer the overlap correction by one tick so ReactFlow can finish
        // writing its own final snapped position to the store first.
        // Without this, ReactFlow's onNodesChange fires after ours and wins.
        setTimeout(() => {
            const allNodes = useStore.getState().nodes;

            // Use the position now in the store (post-snap) rather than the
            // stale value captured in draggedNode at drag-end time.
            const currentNode = allNodes.find(n => n.id === draggedNode.id);
            if (!currentNode) return;

            const draggedDims = getDims(draggedNode.type);
            let x = currentNode.position.x;
            let y = currentNode.position.y;

            // Multi-pass: each pass resolves all current overlaps.
            // Repeating handles chain reactions (A pushes into B which also overlaps C).
            for (let pass = 0; pass < 10; pass++) {
                let moved = false;

                for (const n of allNodes) {
                    if (n.id === draggedNode.id) continue;

                    const nDims = getDims(n.type);

                    // Strict bounding-box overlap — touching edges (flush) is NOT overlap
                    const overlapX = x < n.position.x + nDims.w && x + draggedDims.w > n.position.x;
                    const overlapY = y < n.position.y + nDims.h && y + draggedDims.h > n.position.y;

                    if (overlapX && overlapY) {
                        // Amount of horizontal penetration in each direction
                        const penRight = n.position.x + nDims.w - x;      // how far dragged must go RIGHT to clear
                        const penLeft  = x + draggedDims.w - n.position.x; // how far dragged must go LEFT to clear

                        if (penRight <= penLeft) {
                            // Less travel going right → place dragged node's LEFT edge flush with obstacle's RIGHT edge
                            x = snap(n.position.x + nDims.w);
                        } else {
                            // Less travel going left → place dragged node's RIGHT edge flush with obstacle's LEFT edge
                            x = snap(n.position.x - draggedDims.w);
                        }
                        moved = true;
                    }
                }

                if (!moved) break;
            }

            if (x !== currentNode.position.x || y !== currentNode.position.y) {
                useStore.getState().onNodesChange([{
                    id: draggedNode.id,
                    type: 'position',
                    position: { x, y },
                    dragging: false,
                }]);
            }
        }, 0);
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
