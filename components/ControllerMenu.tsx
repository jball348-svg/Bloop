'use client';

import React from 'react';

const ControllerMenu = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const controllerTools = [
        { type: 'controller', label: 'Arpeggiator', color: 'bg-yellow-500' },
        { type: 'keys', label: 'Keys', color: 'bg-black border border-white' },
        { type: 'chord', label: 'Chord', color: 'bg-sky-500' },
        { type: 'adsr', label: 'ADSR', color: 'bg-amber-700' },
    ];

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 select-none">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-2xl px-2 py-4 flex flex-col gap-3 shadow-xl">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center pb-1">CONTROLLERS</span>
                {controllerTools.map((tool) => (
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

export default ControllerMenu;
