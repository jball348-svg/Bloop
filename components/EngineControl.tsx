'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export default function EngineControl() {
    const engineStarted = useStore((state) => state.engineStarted);
    const engineError = useStore((state) => state.engineError);
    const startAudioEngine = useStore((state) => state.startAudioEngine);
    const onboardingSeen = usePreferencesStore((state) => state.onboardingSeen);

    if (!engineStarted && onboardingSeen) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                <div className="rounded-[2rem] border border-indigo-500/35 bg-slate-900/94 p-8 shadow-[0_0_50px_rgba(99,102,241,0.25)] backdrop-blur-md">
                    {engineError && (
                        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                            {engineError}
                        </p>
                    )}
                    <button
                        onClick={() => {
                            void startAudioEngine();
                        }}
                        className="rounded-[1.75rem] bg-indigo-500 px-12 py-6 text-3xl font-black tracking-tight text-white transition-all hover:scale-[1.03] hover:bg-indigo-400 active:scale-[0.98]"
                    >
                        Bloop!
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
