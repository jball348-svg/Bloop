'use client';

import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    type MixerChannelState,
    getMathTargetOptionsForNode,
    getAdjacencyGlowClasses,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import MathInputHandle, { useMathInputSelection } from './MathInputHandle';
import PackedNode from './PackedNode';

export default function MixerNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const updateMixerChannel = useStore((state) => state.updateMixerChannel);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const node = useStore((state) => state.nodes.find((entry) => entry.id === id));
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && edge.target === id);
    });
    const accentStyle = useNodeAccentStyle('mixer');

    const channels: MixerChannelState[] = node?.data.mixerChannels ?? [];
    const masterVolume = node?.data.volume ?? 70;
    const masterPan = node?.data.pan ?? 0;
    const targetOptions = getMathTargetOptionsForNode(node);
    const { mathInputTarget, setMathInputTarget } = useMathInputSelection(id, targetOptions);

    if (node?.data.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node relative w-80 select-none rounded-2xl border-2 border-emerald-500 bg-slate-800 p-3 text-white shadow-2xl transition-all hover:shadow-emerald-500/20 ${
                isAdjacent ? getAdjacencyGlowClasses('mixer') : ''
            }`}
        >
            <MathInputHandle
                nodeId={id}
                mathInputTarget={mathInputTarget}
                targetOptions={targetOptions}
                onTargetChange={(target) => setMathInputTarget(id, target)}
            />
            <Handle
                type="target"
                id={AUDIO_INPUT_HANDLE_ID}
                position={Position.Top}
                className="h-4 w-4 border-4 border-slate-900 !-top-2 bg-emerald-500 transition-all hover:scale-125"
            />

            <div className="relative z-10 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                    <button
                        className="nodrag relative z-20 mr-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/90 text-[8px] text-slate-400 backdrop-blur-sm transition-all hover:scale-110 hover:border-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                        style={{ boxShadow: '0 0 6px rgba(16, 185, 129, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                        Mixer
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="emerald-500" />
                </div>

                <div className="mb-3 rounded-2xl border border-emerald-500/15 bg-slate-900/40 p-3">
                    <div className="mb-3 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Master Bus
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Volume
                                </label>
                                <span className="text-[10px] font-mono font-bold text-emerald-300">
                                    {masterVolume}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={masterVolume}
                                onChange={(event) => updateNodeValue(id, { volume: Number(event.target.value) })}
                                className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                style={{ accentColor: 'var(--node-accent)' }}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Pan
                                </label>
                                <span className="text-[10px] font-mono font-bold text-emerald-300">
                                    {masterPan.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.05"
                                value={masterPan}
                                onChange={(event) => updateNodeValue(id, { pan: Number(event.target.value) })}
                                className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                style={{ accentColor: 'var(--node-accent)' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/15 bg-slate-900/40 p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Channels
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">
                            {channels.length}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {channels.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-emerald-500/20 px-3 py-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                Patch audio nodes into the mixer
                            </div>
                        ) : (
                            channels.map((channel: MixerChannelState) => {
                                const sourceLabel =
                                    useStore
                                        .getState()
                                        .nodes.find((entry) => entry.id === channel.sourceId)?.data.label ??
                                    channel.sourceId;

                                return (
                                    <div
                                        key={`${id}-${channel.sourceId}`}
                                        className="rounded-xl border border-emerald-500/15 bg-slate-950/60 p-3"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                                                {sourceLabel}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() =>
                                                        updateMixerChannel(id, channel.sourceId, {
                                                            muted: !channel.muted,
                                                        })
                                                    }
                                                    className={`nodrag rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${
                                                        channel.muted
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-slate-700 text-slate-300'
                                                    }`}
                                                >
                                                    Mute
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        updateMixerChannel(id, channel.sourceId, {
                                                            solo: !channel.solo,
                                                        })
                                                    }
                                                    className={`nodrag rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${
                                                        channel.solo
                                                            ? 'bg-emerald-500 text-slate-950'
                                                            : 'bg-slate-700 text-slate-300'
                                                    }`}
                                                >
                                                    Solo
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                        Vol
                                                    </label>
                                                    <span className="text-[9px] font-mono font-bold text-emerald-300">
                                                        {channel.volume}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={channel.volume}
                                                    onChange={(event) =>
                                                        updateMixerChannel(id, channel.sourceId, {
                                                            volume: Number(event.target.value),
                                                        })
                                                    }
                                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                                    style={{ accentColor: 'var(--node-accent)' }}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                        Pan
                                                    </label>
                                                    <span className="text-[9px] font-mono font-bold text-emerald-300">
                                                        {channel.pan.toFixed(2)}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-1"
                                                    max="1"
                                                    step="0.05"
                                                    value={channel.pan}
                                                    onChange={(event) =>
                                                        updateMixerChannel(id, channel.sourceId, {
                                                            pan: Number(event.target.value),
                                                        })
                                                    }
                                                    className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
                                                    style={{ accentColor: 'var(--node-accent)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-emerald-300">
                        <div className="h-px flex-1 bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">waiting for audio</span>
                        <div className="h-px flex-1 bg-current" />
                    </div>
                )}
            </div>
        </div>
    );
}
