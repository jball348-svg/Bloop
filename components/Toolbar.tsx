'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const Toolbar = () => {
    const nodes = useStore((state) => state.nodes);
    const hasAmplifier = nodes.some((n) => n.type === 'speaker');
    const hasTempo = nodes.some((n) => n.type === 'tempo');

    const onDragStart = (event: React.DragEvent, nodeType: string, disabled: boolean) => {
        if (disabled) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const multiTools = [
        { type: 'controller', label: 'Controller', color: 'bg-yellow-500' },
        { type: 'generator', label: 'Generator', color: 'bg-red-500' },
        { type: 'effect', label: 'Effect', color: 'bg-fuchsia-500' },
        { type: 'drum', label: 'Drum', color: 'bg-orange-500' },
        { type: 'chord', label: 'Chord', color: 'bg-sky-500' },
    ];

    const singletonTools = [
        { type: 'tempo', label: 'Tempo', color: 'bg-indigo-500', isPresent: hasTempo },
        { type: 'speaker', label: 'Amplifier', color: 'bg-emerald-500', isPresent: hasAmplifier },
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {/* Multi-instance section */}
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 flex gap-3 shadow-xl">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest self-center pr-1">Modules</span>
                {multiTools.map((tool) => (
                    <div
                        key={tool.type}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold text-white cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${tool.color}`}
                        draggable={true}
                        onDragStart={(e) => onDragStart(e, tool.type, false)}
                    >
                        {tool.label}
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-600" />

            {/* Singleton section */}
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 flex gap-3 shadow-xl">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest self-center pr-1">Global</span>
                {singletonTools.map((tool) => (
                    <div
                        key={tool.type}
                        title={tool.isPresent ? `${tool.label} is already on the canvas` : undefined}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                            tool.isPresent
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                : `${tool.color} text-white cursor-grab active:cursor-grabbing hover:scale-105` 
                        }`}
                        draggable={!tool.isPresent}
                        onDragStart={(e) => onDragStart(e, tool.type, tool.isPresent)}
                    >
                        {tool.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Toolbar;
