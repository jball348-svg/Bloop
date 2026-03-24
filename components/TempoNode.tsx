import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
    DEFAULT_TRANSPORT_BPM,
    getMathTargetOptionsForNode,
    MAX_TEMPO_BPM,
    MIN_TEMPO_BPM,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import MathInputHandle, { useMathInputSelection } from './MathInputHandle';

const clampTempoBpm = (bpm: number) =>
    Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(bpm)));

export default function TempoNode({ id }: { id: string }) {
    const updateTempoBpm = useStore((state) => state.updateTempoBpm);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const node = useStore((state) => state.nodes.find((entry) => entry.id === id));
    const bpm = useStore((state) =>
        state.nodes.find((node) => node.id === id)?.data.bpm ?? DEFAULT_TRANSPORT_BPM
    );
    const accentStyle = useNodeAccentStyle('tempo');
    const targetOptions = getMathTargetOptionsForNode(node);
    const { mathInputTarget, setMathInputTarget } = useMathInputSelection(id, targetOptions);

    const [inputValue, setInputValue] = useState(String(bpm));
    const [isBeatActive, setIsBeatActive] = useState(false);
    const beatTimeoutRef = useRef<number | null>(null);

    const triggerBeatPulse = useCallback(() => {
        setIsBeatActive(true);
        if (beatTimeoutRef.current) {
            window.clearTimeout(beatTimeoutRef.current);
        }
        beatTimeoutRef.current = window.setTimeout(() => {
            setIsBeatActive(false);
        }, 140);
    }, []);

    useEffect(() => {
        setInputValue(String(bpm));
    }, [bpm]);

    useEffect(() => {
        const transport = Tone.getTransport();
        triggerBeatPulse();

        const eventId = transport.scheduleRepeat((time) => {
            Tone.getDraw().schedule(triggerBeatPulse, time);
        }, '4n');

        return () => {
            transport.clear(eventId);
            if (beatTimeoutRef.current) {
                window.clearTimeout(beatTimeoutRef.current);
            }
        };
    }, [triggerBeatPulse]);

    const commitTempo = (nextBpm: number) => {
        const safeBpm = clampTempoBpm(nextBpm);
        updateTempoBpm(id, safeBpm);
        setInputValue(String(safeBpm));
    };

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        commitTempo(Number(event.target.value));
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value.replace(/[^\d]/g, '');
        setInputValue(nextValue);
    };

    const handleInputBlur = () => {
        if (inputValue === '') {
            setInputValue(String(bpm));
            return;
        }

        commitTempo(Number(inputValue));
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }

        if (event.key === 'Escape') {
            setInputValue(String(bpm));
            event.currentTarget.blur();
        }
    };

    return (
        <div
            data-node-accent
            style={accentStyle}
            className="themed-node bg-slate-800 border-2 border-indigo-500 rounded-2xl p-3 shadow-2xl text-white w-64 flex flex-col transition-all hover:shadow-indigo-500/20 group relative select-none"
        >
            <MathInputHandle
                nodeId={id}
                mathInputTarget={mathInputTarget}
                targetOptions={targetOptions}
                onTargetChange={(target) => setMathInputTarget(id, target)}
            />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px rgba(20, 184, 166, 0.3)` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                            Tempo - BPM
                        </span>
                        <span className="text-4xl font-black text-white tracking-tight">{bpm}</span>
                    </div>

                    <div
                        className={`w-2 h-2 rounded-full ml-2 mt-1 flex-shrink-0 transition-colors ${
                            isBeatActive ? 'bg-red-400 animate-pulse' : 'bg-slate-600'
                        }`}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                BPM
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                onKeyDown={handleInputKeyDown}
                                className="nodrag select-text w-20 rounded-lg border border-indigo-500/30 bg-slate-800 px-2 py-1 text-right text-sm font-bold text-indigo-300 outline-none transition-colors focus:border-indigo-400"
                            />
                        </div>
                        <input
                            type="range"
                            min={MIN_TEMPO_BPM}
                            max={MAX_TEMPO_BPM}
                            value={bpm}
                            onChange={handleSliderChange}
                            className="nodrag w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-indigo-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span>{MIN_TEMPO_BPM}</span>
                            <span>{MAX_TEMPO_BPM}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
