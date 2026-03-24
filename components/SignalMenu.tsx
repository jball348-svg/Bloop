'use client';

import React from 'react';

const SIGNAL_GROUPS = [
    [
        { type: 'generator', label: 'Generator', className: 'bg-red-500 text-white' },
        { type: 'sampler', label: 'Sampler', className: 'bg-stone-400 text-slate-950' },
        { type: 'drum', label: 'Drum', className: 'bg-orange-500 text-white' },
        { type: 'advanceddrum', label: 'Advanced Drums', className: 'bg-green-500 text-slate-950' },
    ],
    [
        { type: 'effect', label: 'Effect', className: 'bg-fuchsia-500 text-white' },
        { type: 'eq', label: 'EQ', className: 'bg-zinc-400 text-slate-950' },
        { type: 'unison', label: 'Unison', className: 'bg-violet-500 text-white' },
        { type: 'detune', label: 'Detune', className: 'bg-teal-500 text-white' },
    ],
    [
        { type: 'visualiser', label: 'Visualiser', className: 'bg-pink-500 text-white' },
    ],
] as const;

const SignalMenu = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 select-none">
            <div
                className="backdrop-blur border rounded-[1.75rem] px-4 py-3 flex flex-col gap-3 shadow-xl items-center min-w-[36rem]"
                style={{
                    backgroundColor: 'var(--control-panel)',
                    borderColor: 'var(--control-panel-border)',
                }}
            >
                <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>
                        Signals
                    </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    {SIGNAL_GROUPS.map((group, groupIndex) => (
                        <React.Fragment key={`signal-group-${groupIndex}`}>
                            {group.map((tool) => (
                                <div
                                    key={tool.type}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-transform text-center cursor-grab active:cursor-grabbing hover:scale-105 ${tool.className}`}
                                    draggable={true}
                                    onDragStart={(event) => onDragStart(event, tool.type)}
                                >
                                    {tool.label}
                                </div>
                            ))}
                            {groupIndex < SIGNAL_GROUPS.length - 1 && (
                                <div className="mx-1 h-5 w-px" style={{ backgroundColor: 'var(--border-primary)' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SignalMenu;
