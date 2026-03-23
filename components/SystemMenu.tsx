'use client';

import React, { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { PRESETS } from '@/store/presets';

const SystemMenu = () => {
    const { nodes, edges, masterVolume, clearCanvas, loadCanvas, undo, redo, canUndo, canRedo, signalFlowVisible, toggleSignalFlow } = useStore();
    const [showPresets, setShowPresets] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        const data = {
            version: 1,
            nodes,
            edges,
            masterVolume
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patch-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.bloop`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                loadCanvas(data);
            } catch (err) {
                console.error('Failed to load patch:', err);
                alert('Invalid .bloop file');
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = ''; // Reset for same file re-load
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 select-none">
            {showPresets && (
                <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center border-b border-slate-700/50 mb-1">
                        Starter Presets
                    </div>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => {
                                loadCanvas(preset);
                                setShowPresets(false);
                            }}
                            className="px-4 py-2 rounded-xl hover:bg-slate-700 text-[11px] font-medium text-slate-200 text-left transition-colors flex items-center gap-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                            {preset.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 shadow-xl flex items-center gap-3">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">SYSTEM</span>
                
                <button
                    onClick={clearCanvas}
                    className="px-3 py-2 rounded-xl bg-white text-slate-900 text-[10px] font-bold hover:bg-slate-100 active:scale-95 transition-all text-center"
                >
                    New
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-1" />

                <button
                    onClick={handleSave}
                    className="px-3 py-2 rounded-xl bg-slate-700 text-white text-[10px] font-bold hover:bg-slate-600 active:scale-95 transition-all text-center"
                >
                    Save
                </button>

                <button
                    onClick={handleLoadClick}
                    className="px-3 py-2 rounded-xl bg-slate-700 text-white text-[10px] font-bold hover:bg-slate-600 active:scale-95 transition-all text-center"
                >
                    Load
                </button>

                <button
                    onClick={() => setShowPresets(!showPresets)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center ${
                        showPresets 
                            ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                            : 'bg-slate-700 text-white hover:bg-slate-600 active:scale-95'
                    }`}
                >
                    Presets
                </button>

                <button
                    onClick={toggleSignalFlow}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center ${
                        signalFlowVisible
                            ? 'bg-lime-500 text-slate-950 shadow-[0_0_12px_rgba(57,255,20,0.35)]'
                            : 'bg-slate-700 text-white hover:bg-slate-600 active:scale-95'
                    }`}
                >
                    Signal Flow
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-1" />

                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center ${
                        canUndo 
                            ? 'bg-white text-slate-900 hover:bg-slate-100 active:scale-95' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-40'
                    }`}
                >
                    Undo
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center ${
                        canRedo 
                            ? 'bg-white text-slate-900 hover:bg-slate-100 active:scale-95' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-40'
                    }`}
                >
                    Redo
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".bloop"
                className="hidden"
            />
        </div>
    );
};

export default SystemMenu;
