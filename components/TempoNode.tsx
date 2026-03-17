import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import {
    DEFAULT_TRANSPORT_BPM,
    MAX_TEMPO_BPM,
    MIN_TEMPO_BPM,
    TEMPO_OUTPUT_HANDLE_ID,
    isTempoEdge,
    useStore,
} from '@/store/useStore';

const clampTempoBpm = (bpm: number) =>
    Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(bpm)));

export default function TempoNode({ id }: { id: string }) {
    const updateTempoBpm = useStore((state) => state.updateTempoBpm);
    const bpm = useStore((state) =>
        state.nodes.find((node) => node.id === id)?.data.bpm ?? DEFAULT_TRANSPORT_BPM
    );
    const hasTempoTargets = useStore((state) =>
        state.edges.some((edge) => isTempoEdge(edge) && edge.source === id)
    );

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
        <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-5 shadow-2xl text-white w-64 min-h-[180px] flex flex-col transition-all hover:shadow-indigo-500/20 group relative">
            <div
                className="absolute inset-0 rounded-2xl overflow-hidden opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'repeating-linear-gradient(135deg, #818cf8 0, #818cf8 1px, transparent 1px, transparent 16px)',
                }}
            />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                            Tempo - BPM
                        </span>
                        <span className="text-4xl font-black text-white tracking-tight">{bpm}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div
                            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                                isBeatActive
                                    ? 'border-indigo-300 bg-indigo-400/20 shadow-[0_0_20px_rgba(129,140,248,0.55)]'
                                    : 'border-indigo-500/30 bg-slate-800'
                            }`}
                        >
                            <div
                                className={`absolute inset-1 rounded-xl border ${
                                    isBeatActive ? 'border-indigo-200/40 animate-ping' : 'border-transparent'
                                }`}
                            />
                            <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-colors ${isBeatActive ? 'text-indigo-200' : 'text-indigo-400'}`}>
                                <path
                                    d="M7 19V5m0 0h8l-2.5 3L15 11H7"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-indigo-400">
                            Beat
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
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
                                className="nodrag w-20 rounded-lg border border-indigo-500/30 bg-slate-800 px-2 py-1 text-right text-sm font-bold text-indigo-300 outline-none transition-colors focus:border-indigo-400"
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

                {!hasTempoTargets && (
                    <div className="mt-4 flex items-center gap-1.5 text-indigo-400 opacity-45">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            <Handle
                type="source"
                id={TEMPO_OUTPUT_HANDLE_ID}
                position={Position.Bottom}
                style={{ left: 20 }}
                className="w-4 h-4 border-4 border-slate-900 !-bottom-2 bg-indigo-500 shadow-[0_0_12px_rgba(129,140,248,0.85)] transition-all hover:scale-125"
            />
        </div>
    );
}
