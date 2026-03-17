'use client';

import React, { useState } from 'react';
import * as Tone from 'tone';

export default function EngineControl() {
    const [isStarted, setIsStarted] = useState(false);

    const startEngine = async () => {
        await Tone.start();
        setIsStarted(true);
        console.log('Audio engine started');
    };

    if (!isStarted) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                <div className="text-center p-12 bg-slate-900 border-2 border-indigo-500 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.3)] max-w-md">
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Ready to Bloop?</h2>
                    <p className="text-slate-400 mb-8 font-medium">
                        Browsers need a little nudge to start the audio engine. 
                        Click below to wake up the synths.
                    </p>
                    <button
                        onClick={startEngine}
                        className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        START AUDIO ENGINE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-8 right-8 z-10 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Engine Active</span>
            </div>
        </div>
    );
}
