'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const Toolbar = () => {
    const hasTempoNode = useStore((state) => state.nodes.some((node) => node.type === 'tempo'));

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const tools = [
        { type: 'controller', label: 'Controller', color: 'bg-yellow-500' },
        { type: 'generator', label: 'Oscillator', color: 'bg-red-500' },
        { type: 'drum', label: 'Drums', color: 'bg-orange-500' },
        { type: 'effect', label: 'Effect', color: 'bg-fuchsia-500' },
        { type: 'speaker', label: 'Speaker', color: 'bg-emerald-500' },
        ...(!hasTempoNode ? [{ type: 'tempo', label: 'Tempo', color: 'bg-indigo-500' }] : []),
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-6 py-3 flex gap-4 shadow-xl">
                {tools.map((tool) => (
                    <div
                        key={tool.type}
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${tool.color}`}
                        draggable={true}
                        onDragStart={(e) => onDragStart(e, tool.type)}
                    >
                        {tool.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Toolbar;
