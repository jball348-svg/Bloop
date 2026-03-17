'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    BackgroundVariant,
} from 'reactflow';
import { useStore } from '@/store/useStore';
import GeneratorNode from '@/components/GeneratorNode';
import EffectNode from '@/components/EffectNode';
import SpeakerNode from '@/components/SpeakerNode';
import EngineControl from '@/components/EngineControl';

export default function BloopCanvas() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore();

    // Register our custom node types
    const nodeTypes = useMemo(() => ({
        generator: GeneratorNode,
        effect: EffectNode,
        speaker: SpeakerNode,
    }), []);

    return (
        <main className="w-screen h-screen relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-slate-950"
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

            {/* Overlay UI elements */}
            <div className="absolute top-8 left-8 z-10">
                <img src="/bloop_logo.jpg" alt="Bloop Logo" className="w-32" />
            </div>
        </main>
    );
}


