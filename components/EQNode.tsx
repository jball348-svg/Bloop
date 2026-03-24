'use client';

import { Handle, Position } from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isAudioEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import ModulationTargetHandle from './ModulationTargetHandle';
import PackedNode from './PackedNode';

type SliderRowProps = {
    label: string;
    valueLabel: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
};

const SliderRow = ({
    label,
    valueLabel,
    value,
    min,
    max,
    step,
    onChange,
}: SliderRowProps) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                {label}
            </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--node-accent-text)' }}>
                {valueLabel}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="nodrag h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
            style={{ accentColor: 'var(--node-accent)' }}
        />
    </div>
);

export default function EQNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isAudioEdge(edge) && (edge.source === id || edge.target === id));
    });
    const accentStyle = useNodeAccentStyle('eq');

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    const low = nodeData?.eqLow ?? 0;
    const mid = nodeData?.eqMid ?? 0;
    const high = nodeData?.eqHigh ?? 0;
    const lowFrequency = nodeData?.eqLowFrequency ?? 320;
    const highFrequency = nodeData?.eqHighFrequency ?? 2800;

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node relative w-64 select-none rounded-2xl border-2 border-zinc-400 bg-slate-800 p-3 text-white shadow-2xl transition-all hover:shadow-zinc-400/20 ${
                isAdjacent ? getAdjacencyGlowClasses('eq') : ''
            }`}
        >
            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={AUDIO_INPUT_HANDLE_ID}
                    position={Position.Top}
                    className="h-4 w-4 border-4 border-slate-900 !-top-2 bg-zinc-400 transition-all hover:scale-125"
                />
            )}

            <ModulationTargetHandle paramKey="low" top={86} />
            <ModulationTargetHandle paramKey="mid" top={132} />
            <ModulationTargetHandle paramKey="high" top={178} />
            <ModulationTargetHandle paramKey="lowFrequency" top={224} />
            <ModulationTargetHandle paramKey="highFrequency" top={270} />

            <div className="relative z-10 flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                    <button
                        className="nodrag relative z-20 mr-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/90 text-[8px] text-slate-400 backdrop-blur-sm transition-all hover:scale-110 hover:border-zinc-300 hover:bg-zinc-400 hover:text-slate-950"
                        style={{ boxShadow: '0 0 6px rgba(161, 161, 170, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                        EQ3
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="zinc-400" />
                </div>

                <div
                    className="rounded-2xl border px-3 py-3"
                    style={{
                        borderColor: 'var(--node-accent-border)',
                        backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                    }}
                >
                    <div className="mb-3 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                        Tone Sculpting
                    </div>
                    <div className="space-y-3">
                        <SliderRow
                            label="Low"
                            valueLabel={`${low > 0 ? '+' : ''}${Math.round(low)} dB`}
                            value={low}
                            min={-24}
                            max={24}
                            step={1}
                            onChange={(value) => updateNodeValue(id, { low: value })}
                        />
                        <SliderRow
                            label="Mid"
                            valueLabel={`${mid > 0 ? '+' : ''}${Math.round(mid)} dB`}
                            value={mid}
                            min={-24}
                            max={24}
                            step={1}
                            onChange={(value) => updateNodeValue(id, { mid: value })}
                        />
                        <SliderRow
                            label="High"
                            valueLabel={`${high > 0 ? '+' : ''}${Math.round(high)} dB`}
                            value={high}
                            min={-24}
                            max={24}
                            step={1}
                            onChange={(value) => updateNodeValue(id, { high: value })}
                        />
                        <SliderRow
                            label="Low Xover"
                            valueLabel={`${Math.round(lowFrequency)} Hz`}
                            value={lowFrequency}
                            min={80}
                            max={1200}
                            step={5}
                            onChange={(value) => updateNodeValue(id, { lowFrequency: value })}
                        />
                        <SliderRow
                            label="High Xover"
                            valueLabel={`${Math.round(highFrequency)} Hz`}
                            value={highFrequency}
                            min={1200}
                            max={8000}
                            step={10}
                            onChange={(value) => updateNodeValue(id, { highFrequency: value })}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-lime-300/85">
                    <span>Mod Ready</span>
                    <span>Right-edge targets</span>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-zinc-300">
                        <div className="h-px flex-1 bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="h-px flex-1 bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="h-4 w-4 border-4 border-slate-900 !-bottom-2 bg-zinc-400 transition-all hover:scale-125"
                />
            )}
        </div>
    );
}
