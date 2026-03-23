'use client';

import React, { useState } from 'react';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export default function EngineControl() {
    const [isStarted, setIsStarted] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const initializeDefaultNodes = useStore((state) => state.initializeDefaultNodes);
    const onboardingSeen = usePreferencesStore((state) => state.onboardingSeen);
    const openOnboarding = usePreferencesStore((state) => state.openOnboarding);
    
    const startEngine = async () => {
        setIsStarting(true);
        setErrorMessage(null);

        try {
            await Tone.start();
            const rawContext = Tone.getContext().rawContext;
            const isAudioRunning = () => Tone.getContext().rawContext.state === 'running';

            for (let attempt = 0; attempt < 3 && !isAudioRunning(); attempt++) {
                await rawContext.resume();
                if (isAudioRunning()) {
                    break;
                }
                await new Promise((resolve) => window.setTimeout(resolve, 200));
            }

            if (!isAudioRunning()) {
                throw new Error('Audio context could not start');
            }

            const transport = Tone.getTransport();
            if (transport.state !== 'started') {
                transport.start();
            }

            initializeDefaultNodes();
            setIsStarted(true);
            if (!onboardingSeen) {
                openOnboarding();
            }
        } catch (error) {
            console.error('Failed to start audio engine:', error);
            setErrorMessage('Audio is busy or blocked right now. Pause other audio and try again.');
        } finally {
            setIsStarting(false);
        }
    };

    if (!isStarted) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                <div className="text-center p-12 bg-slate-900 border-2 border-indigo-500 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.3)] max-w-md flex flex-col items-center">
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Ready to Bloop?</h2>
                    <p className="text-slate-400 mb-8 font-medium">
                        Browsers need a little nudge to start the audio engine. 
                        Click below to wake up the synths.
                    </p>
                    {errorMessage && (
                        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                            {errorMessage}
                        </p>
                    )}
                    <button
                        onClick={startEngine}
                        disabled={isStarting}
                        className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-300 disabled:cursor-wait text-white font-black rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        {isStarting ? 'STARTING...' : 'START AUDIO ENGINE'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
