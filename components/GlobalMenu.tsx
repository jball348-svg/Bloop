'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const GlobalMenu = () => {
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

    const globalTools = [
        { type: 'tempo', label: 'Tempo', color: 'bg-indigo-500', isPresent: hasTempo },
        { type: 'speaker', label: 'Amplifier', color: 'bg-emerald-500', isPresent: hasAmplifier },
    ];

    return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-2xl px-2 py-4 flex flex-col gap-3 shadow-xl">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest self-center pb-1">GLOBAL</span>
                {globalTools.map((tool) => (
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

export default GlobalMenu;
