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
import EffectNode from '@/components/EffectNode';
import SpeakerNode from '@/components/SpeakerNode';
import EngineControl from '@/components/EngineControl';
import Toolbar from '@/components/Toolbar';

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

    // Register our custom node types
    const nodeTypes = useMemo(() => ({
        generator: GeneratorNode,
        effect: EffectNode,
        speaker: SpeakerNode,
    }), []);

    const defaultEdgeOptions = useMemo(() => ({
        style: { stroke: '#94a3b8', strokeWidth: 2 },
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

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: crypto.randomUUID(),
                type,
                position,
                data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)}` },
            };

            addNode(newNode);
        },
        [screenToFlowPosition, addNode]
    );

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: any) => {
        const trashBin = document.getElementById('trash-bin');
        if (trashBin) {
            const rect = trashBin.getBoundingClientRect();
            if (
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom
            ) {
                removeNodeAndCleanUp(node.id);
            }
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
                fitView
                className="bg-slate-950"
                edgesUpdatable={true}
                snapToGrid={true}
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


