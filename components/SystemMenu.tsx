'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const SystemMenu = () => {
    const clearCanvas = useStore((state) => state.clearCanvas);
    const undo = useStore((state) => state.undo);
    const redo = useStore((state) => state.redo);
    const canUndo = useStore((state) => state.canUndo);
    const canRedo = useStore((state) => state.canRedo);

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 shadow-xl flex items-center gap-3">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">SYSTEM</span>
                <button
                    onClick={clearCanvas}
                    className="px-3 py-2 rounded-xl bg-white text-slate-900 text-[10px] font-bold hover:bg-slate-100 active:scale-95 transition-all text-center"
                >
                    New
                </button>
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
        </div>
    );
};

export default SystemMenu;
