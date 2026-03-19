'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const SystemMenu = () => {
    const clearCanvas = useStore((state) => state.clearCanvas);

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 shadow-xl flex items-center gap-3">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">SYSTEM</span>
                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 rounded-xl bg-white text-slate-400 text-[10px] font-bold hover:bg-slate-100 active:scale-95 transition-all"
                >
                    New
                </button>
            </div>
        </div>
    );
};

export default SystemMenu;
