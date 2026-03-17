'use client';

import React, { useMemo, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    BackgroundVariant,
    Edge,
} from 'reactflow';
import { useStore } from '@/store/useStore';
import GeneratorNode from '@/components/GeneratorNode';
import EffectNode from '@/components/EffectNode';
import SpeakerNode from '@/components/SpeakerNode';
import EngineControl from '@/components/EngineControl';

export default function BloopCanvas() {
    const { 
        nodes, 
        edges, 
        onNodesChange, 
        onEdgesChange, 
        onConnect,
        onEdgeUpdate: storeOnEdgeUpdate,
        onEdgeUpdateStart: storeOnEdgeUpdateStart,
        onEdgeUpdateEnd: storeOnEdgeUpdateEnd
    } = useStore();

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

    const onEdgeUpdateStart = () => {
        edgeUpdateSuccessful.current = false;
    };

    const onEdgeUpdate = (oldEdge: any, newConnection: any) => {
        edgeUpdateSuccessful.current = true;
        storeOnEdgeUpdate(oldEdge, newConnection);
    };

    const onEdgeUpdateEnd = (_: any, edge: Edge) => {
        if (!edgeUpdateSuccessful.current) {
            onEdgesChange([{ id: edge.id, type: 'remove' }]);
        }
    };

    return (
        <main className="w-screen h-screen relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onEdgeUpdateStart={onEdgeUpdateStart}
                onEdgeUpdateEnd={onEdgeUpdateEnd}
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
                <Controls />
            </ReactFlow>

            <EngineControl />

        </main>
    );
}


