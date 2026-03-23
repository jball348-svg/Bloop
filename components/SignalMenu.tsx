'use client';

import React, { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';

const SIGNAL_SECTIONS = [
    {
        id: 'generators',
        label: 'Generators',
        tools: [
            { type: 'generator', label: 'Generator', color: 'bg-red-500', singleton: false },
            { type: 'sampler', label: 'Sampler', color: 'bg-stone-400 text-slate-950', singleton: false },
            { type: 'audioin', label: 'Audio In', color: 'bg-slate-400 text-slate-950', singleton: true },
            { type: 'drum', label: 'Drum', color: 'bg-orange-500', singleton: false },
            { type: 'advanceddrum', label: 'Advanced Drums', color: 'bg-green-500 text-slate-950', singleton: false },
        ],
    },
    {
        id: 'modulators',
        label: 'Modulators',
        tools: [
            { type: 'effect', label: 'Effect', color: 'bg-fuchsia-500', singleton: false },
            { type: 'unison', label: 'Unison', color: 'bg-violet-500', singleton: false },
            { type: 'detune', label: 'Detune', color: 'bg-teal-500', singleton: false },
            { type: 'quantizer', label: 'Quantizer', color: 'bg-purple-500', singleton: false },
        ],
    },
    {
        id: 'visualisers',
        label: 'Visualisers',
        tools: [
            { type: 'visualiser', label: 'Visualiser', color: 'bg-pink-500', singleton: false },
        ],
    },
] as const;

const SignalMenu = () => {
    const nodes = useStore((state) => state.nodes);
    const [activeSection, setActiveSection] = useState<(typeof SIGNAL_SECTIONS)[number]['id']>('generators');

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const visibleTools = useMemo(
        () => SIGNAL_SECTIONS.find((section) => section.id === activeSection)?.tools ?? SIGNAL_SECTIONS[0].tools,
        [activeSection]
    );
    const hasAudioIn = nodes.some((node) => node.type === 'audioin');

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
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {SIGNAL_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                                    activeSection === section.id
                                        ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.35)]'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    {visibleTools.map((tool) => (
                        <div
                            key={tool.type}
                            title={tool.singleton && hasAudioIn ? 'Audio In is already on the canvas' : undefined}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-transform text-center ${
                                tool.singleton && hasAudioIn
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                    : `text-white cursor-grab active:cursor-grabbing hover:scale-105 ${tool.color}`
                            }`}
                            draggable={!(tool.singleton && hasAudioIn)}
                            onDragStart={(event) => {
                                if (tool.singleton && hasAudioIn) {
                                    event.preventDefault();
                                    return;
                                }
                                onDragStart(event, tool.type);
                            }}
                        >
                            {tool.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SignalMenu;
