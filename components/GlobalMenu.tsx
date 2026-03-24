'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const GlobalMenu = () => {
    const nodes = useStore((state) => state.nodes);
    const isRecording = useStore((state) => state.isRecording);
    const recordingElapsedMs = useStore((state) => state.recordingElapsedMs);
    const recordingError = useStore((state) => state.recordingError);
    const startRecording = useStore((state) => state.startRecording);
    const stopRecording = useStore((state) => state.stopRecording);
    const hasAmplifier = nodes.some((n) => n.type === 'speaker');
    const hasTempo = nodes.some((n) => n.type === 'tempo');
    const hasAudioIn = nodes.some((n) => n.type === 'audioin');
    const hasMidiIn = nodes.some((n) => n.type === 'midiin');

    const onDragStart = (event: React.DragEvent, nodeType: string, disabled: boolean) => {
        if (disabled) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const recordingSeconds = Math.floor(recordingElapsedMs / 1000);
    const recordingMinutes = Math.floor(recordingSeconds / 60);
    const recordingRemainder = recordingSeconds % 60;
    const globalTools = [
        { type: 'tempo', label: 'Tempo', className: 'bg-indigo-500 text-white', isPresent: hasTempo },
        { type: 'speaker', label: 'Amplifier', className: 'bg-emerald-500 text-white', isPresent: hasAmplifier },
        { type: 'midiin', label: 'MIDI In', className: 'bg-neutral-300 text-slate-950', isPresent: hasMidiIn },
        { type: 'audioin', label: 'Audio In', className: 'bg-slate-400 text-slate-950', isPresent: hasAudioIn },
    ];

    return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 select-none">
            <div
                className="backdrop-blur border rounded-2xl px-2 py-4 flex flex-col gap-3 shadow-xl"
                style={{
                    backgroundColor: 'var(--control-panel)',
                    borderColor: 'var(--control-panel-border)',
                }}
            >
                <span className="text-[9px] font-black uppercase tracking-widest text-center pb-1" style={{ color: 'var(--text-muted)' }}>GLOBAL</span>
                {globalTools.map((tool) => (
                    <div
                        key={tool.type}
                        title={tool.isPresent ? `${tool.label} is already on the canvas` : undefined}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all text-center ${
                            tool.isPresent
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                : `${tool.className} cursor-grab active:cursor-grabbing hover:scale-105` 
                        }`}
                        draggable={!tool.isPresent}
                        onDragStart={(e) => onDragStart(e, tool.type, tool.isPresent)}
                    >
                        {tool.label}
                    </div>
                ))}
                <div className="mx-1 h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
                <button
                    onClick={() => {
                        if (isRecording) {
                            void stopRecording();
                            return;
                        }
                        void startRecording();
                    }}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all text-center ${
                        isRecording ? 'bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.35)]' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                    }`}
                >
                    {isRecording
                        ? `Record ${recordingMinutes.toString().padStart(2, '0')}:${recordingRemainder.toString().padStart(2, '0')}`
                        : 'Record'}
                </button>
                {recordingError && (
                    <div
                        className="max-w-[9rem] rounded-xl border px-2 py-2 text-center text-[9px] font-bold uppercase tracking-[0.14em]"
                        style={{
                            borderColor: 'rgba(251, 113, 133, 0.32)',
                            backgroundColor: 'rgba(251, 113, 133, 0.08)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        {recordingError}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalMenu;
