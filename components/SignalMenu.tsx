'use client';

import React from 'react';

const SignalMenu = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const signalTools = [
        { type: 'generator', label: 'Generator', color: 'bg-red-500' },
        { type: 'effect', label: 'Effect', color: 'bg-fuchsia-500' },
        { type: 'drum', label: 'Drum', color: 'bg-orange-500' },
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 flex flex-row gap-3 shadow-xl items-center">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">SIGNALS</span>
                {signalTools.map((tool) => (
                    <div
                        key={tool.type}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold text-white cursor-grab active:cursor-grabbing hover:scale-105 transition-transform text-center ${tool.color}`}
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

export default SignalMenu;
