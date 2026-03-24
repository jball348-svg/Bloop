'use client';

import React from 'react';

export default function BloopLauncher() {
    const onDragStart = (event: React.DragEvent) => {
        event.dataTransfer.setData('application/reactflow', 'pulse');
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="absolute left-4 top-4 z-20 select-none">
            <div
                className="rounded-[1.6rem] border px-3 py-3 shadow-xl backdrop-blur"
                style={{
                    backgroundColor: 'var(--control-panel)',
                    borderColor: 'var(--control-panel-border)',
                }}
            >
                <div
                    className="mb-2 text-[9px] font-black uppercase tracking-[0.2em]"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Bloop
                </div>
                <div
                    draggable={true}
                    onDragStart={onDragStart}
                    className="cursor-grab rounded-full bg-lime-500 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 transition-transform hover:scale-105 active:cursor-grabbing"
                >
                    Bloop
                </div>
            </div>
        </div>
    );
}
