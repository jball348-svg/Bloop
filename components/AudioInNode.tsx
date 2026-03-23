'use client';

import { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
    AUDIO_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

export default function AudioInNode({ id }: { id: string }) {
    const openAudioInput = useStore((state) => state.openAudioInput);
    const closeAudioInput = useStore((state) => state.closeAudioInput);
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });

    const [level, setLevel] = useState(0);

    const status = nodeData?.audioInStatus ?? 'idle';
    const inputGain = nodeData?.inputGain ?? 75;
    const accentStyle = useNodeAccentStyle('audioin');

    useEffect(() => {
        if (status === 'active') {
            void openAudioInput(id);
        }
    }, [id, openAudioInput, status]);

    useEffect(() => {
        let frame = 0;

        const tick = () => {
            const chain = useStore.getState().audioInputChains.get(id);
            if (chain && status === 'active') {
                const meterValue = chain.meter.getValue();
                const normalized = Array.isArray(meterValue)
                    ? meterValue[0] ?? 0
                    : meterValue;
                setLevel(Math.max(0, Math.min(1, typeof normalized === 'number' ? normalized : 0)));
            } else {
                setLevel(0);
            }

            frame = window.requestAnimationFrame(tick);
        };

        frame = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(frame);
    }, [id, status]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    const statusLabel =
        status === 'active'
            ? 'Live'
            : status === 'requesting'
                ? 'Requesting'
                : status === 'denied'
                    ? 'Denied'
                    : status === 'unsupported'
                        ? 'Unsupported'
                        : status === 'error'
                            ? 'Error'
                            : 'Idle';

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-slate-400 rounded-2xl p-3 shadow-2xl text-white w-64 flex flex-col transition-all hover:shadow-slate-400/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('audioin') : ''
            }`}
        >
            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-slate-300 hover:text-slate-950 hover:border-slate-200 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(148, 163, 184, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                        AUDIO IN
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="slate-400" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-slate-400/20 bg-slate-900/40 px-3 py-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-200">
                            Live Input
                        </div>
                        <div className="text-[10px] text-slate-400">
                            {status === 'active'
                                ? 'Microphone or interface is feeding the signal chain.'
                                : status === 'requesting'
                                    ? 'Waiting for browser microphone permission...'
                                    : status === 'denied'
                                        ? 'Permission was denied. Retry after allowing microphone access.'
                                        : status === 'unsupported'
                                            ? 'Live input is not supported in this browser.'
                                            : status === 'error'
                                                ? 'The microphone could not be opened.'
                                                : 'Enable your microphone or USB interface to process live audio.'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-400/15 bg-slate-900/40 px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Status
                        </span>
                        <span
                            className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                                status === 'active'
                                    ? 'bg-emerald-400 text-slate-950'
                                    : status === 'requesting'
                                        ? 'bg-amber-400 text-slate-950'
                                        : status === 'denied' || status === 'error'
                                            ? 'bg-red-400 text-slate-950'
                                            : 'bg-slate-600 text-slate-100'
                            }`}
                        >
                            {statusLabel}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            if (status === 'active') {
                                closeAudioInput(id);
                                return;
                            }
                            void openAudioInput(id);
                        }}
                        className={`nodrag rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                            status === 'active'
                                ? 'bg-slate-200 text-slate-950 hover:bg-white'
                                : 'bg-slate-400 text-slate-950 hover:bg-slate-300'
                        }`}
                    >
                        {status === 'active' ? 'Disable Microphone' : 'Enable Microphone'}
                    </button>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Input Gain
                            </label>
                            <span className="text-[10px] font-mono font-bold text-slate-200">
                                {inputGain}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={inputGain}
                            onChange={(event) =>
                                updateNodeValue(id, { inputGain: Number.parseFloat(event.target.value) })
                            }
                            className="nodrag w-full h-1 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-slate-300"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Level
                            </label>
                            <span className="text-[10px] font-mono font-bold text-slate-200">
                                {Math.round(level * 100)}%
                            </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                            <div
                                className={`h-full rounded-full transition-[width] duration-75 ${
                                    level > 0.8
                                        ? 'bg-red-400'
                                        : level > 0.45
                                            ? 'bg-amber-300'
                                            : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.max(4, level * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-slate-200">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">routes dry to amp</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-slate-300"
                />
            )}
        </div>
    );
}
