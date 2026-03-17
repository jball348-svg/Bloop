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
import EngineControl from '@/components/EngineControl';

export default function BloopCanvas() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore();

    // Register our custom node types
    const nodeTypes = useMemo(() => ({
        generator: GeneratorNode,
        effect: EffectNode,
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
            <div className="absolute top-8 left-8 z-10 pointer-events-none">
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                    BLOOP<span className="text-indigo-500">.</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                    Audio Engine <span className="text-indigo-500 font-bold">LIVE</span> <span className="text-slate-600">v0.2</span>
                </p>
            </div>

            <div className="absolute bottom-8 right-8 z-10 pointer-events-none text-right">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-800">
                    Prompt 2: Modular Audio Hookup
                </p>
            </div>
        </main>
    );
}


