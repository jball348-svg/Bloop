'use client';

import React from 'react';

const SystemMenu = () => {
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 shadow-xl">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest self-center pr-3">SYSTEM</span>
                <div className="px-4 py-2 rounded-xl bg-white text-slate-400 text-[10px] font-bold inline-block">
                    New
                </div>
            </div>
        </div>
    );
};

export default SystemMenu;
