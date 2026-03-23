'use client';

import React, { useMemo, useState } from 'react';

const CONTROLLER_SECTIONS = [
    {
        id: 'performance',
        label: 'Performance',
        tools: [
            { type: 'keys', label: 'Keys', color: 'bg-black border border-white' },
            { type: 'midiin', label: 'MIDI In', color: 'bg-neutral-300 text-slate-950' },
            { type: 'controller', label: 'Arpeggiator', color: 'bg-yellow-500 text-slate-950' },
            { type: 'chord', label: 'Chord', color: 'bg-sky-500' },
        ],
    },
    {
        id: 'sequencing',
        label: 'Sequencing',
        tools: [
            { type: 'pulse', label: 'Pulse', color: 'bg-lime-500 text-slate-950' },
            { type: 'stepsequencer', label: 'Sequencer', color: 'bg-blue-500' },
            { type: 'adsr', label: 'ADSR', color: 'bg-amber-700' },
            { type: 'moodpad', label: 'Mood Pad', color: 'bg-rose-500' },
        ],
    },
] as const;

const ControllerMenu = () => {
    const [activeSection, setActiveSection] = useState<(typeof CONTROLLER_SECTIONS)[number]['id']>('performance');

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const visibleTools = useMemo(
        () => CONTROLLER_SECTIONS.find((section) => section.id === activeSection)?.tools ?? CONTROLLER_SECTIONS[0].tools,
        [activeSection]
    );

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 select-none">
            <div
                className="backdrop-blur border rounded-2xl px-3 py-4 flex flex-col gap-3 shadow-xl min-w-[12rem]"
                style={{
                    backgroundColor: 'var(--control-panel)',
                    borderColor: 'var(--control-panel-border)',
                }}
            >
                <span className="text-[9px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>
                    Controllers
                </span>

                <div className="grid grid-cols-1 gap-2">
                    {CONTROLLER_SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                                activeSection === section.id
                                    ? 'bg-lime-500 text-slate-950 shadow-[0_0_10px_rgba(132,204,22,0.35)]'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 pt-1">
                    {visibleTools.map((tool) => (
                        <div
                            key={tool.type}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold text-white cursor-grab active:cursor-grabbing hover:scale-105 transition-transform text-center ${tool.color}`}
                            draggable={true}
                            onDragStart={(event) => onDragStart(event, tool.type)}
                        >
                            {tool.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ControllerMenu;
