'use client';

import React from 'react';

const CONTROLLER_GROUPS = [
    [
        { type: 'keys', label: 'Keys', className: 'bg-neutral-950 text-white border border-white/70' },
        { type: 'controller', label: 'Arpeggiator', className: 'bg-yellow-500 text-slate-950' },
        { type: 'chord', label: 'Chord', className: 'bg-sky-500 text-white' },
    ],
    [
        { type: 'quantizer', label: 'Quantizer', className: 'bg-purple-500 text-white' },
        { type: 'adsr', label: 'ADSR', className: 'bg-amber-700 text-white' },
        { type: 'stepsequencer', label: 'Sequencer', className: 'bg-blue-500 text-white' },
        { type: 'pattern', label: 'Pattern', className: 'bg-blue-700 text-white' },
        { type: 'lfo', label: 'LFO', className: 'bg-lime-700 text-white' },
        { type: 'moodpad', label: 'Mood Pad', className: 'bg-rose-500 text-white' },
    ],
] as const;

const ControllerMenu = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

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

                <div className="flex flex-col gap-3 pt-1">
                    {CONTROLLER_GROUPS.map((group, groupIndex) => (
                        <div key={`controller-group-${groupIndex}`} className="flex flex-col gap-2">
                            {group.map((tool) => (
                                <div
                                    key={tool.type}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-grab active:cursor-grabbing hover:scale-105 transition-transform text-center ${tool.className}`}
                                    draggable={true}
                                    onDragStart={(event) => onDragStart(event, tool.type)}
                                >
                                    {tool.label}
                                </div>
                            ))}
                            {groupIndex < CONTROLLER_GROUPS.length - 1 && (
                                <div className="mx-1 h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ControllerMenu;
