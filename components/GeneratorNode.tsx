import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
    CONTROL_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    type WaveShape,
    getAdjacencyGlowClasses,
    isAudioEdge,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import NodeMixControl from './NodeMixControl';
import PackedNode from './PackedNode';

const WAVE_SHAPES: WaveShape[] = ['sine', 'square', 'triangle', 'sawtooth', 'noise'];

export default function GeneratorNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        const hasControlIn = edges.some(e => isControlEdge(e) && e.target === id);
        const hasAudioOut = edges.some(e => isAudioEdge(e) && e.source === id);
        return !hasControlIn && !hasAudioOut;
    });

    const waveShape = nodeData?.waveShape || 'sine';
    const [mix, setMix] = useState(80);
    const accentStyle = useNodeAccentStyle('generator');

    const handleWaveShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateNodeValue(id, { waveShape: e.target.value as WaveShape });
    };

    const setMixValue = (value: number) => {
        setMix(value);
        updateNodeValue(id, { mix: value });
    };

    useEffect(() => {
        updateNodeValue(id, { mix: 80 });
    }, [id, updateNodeValue]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-red-500 rounded-2xl p-3 shadow-2xl text-white w-60 flex flex-col transition-all hover:shadow-red-500/20 group relative select-none${
            isAdjacent ? getAdjacencyGlowClasses('generator') : ''
        }`}
        >

            {/* Input handle for MIDI data from Controller */}
            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-yellow-400"
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            className="nodrag relative flex-shrink-0 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-400 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                            style={{ boxShadow: `0 0 6px rgba(239, 68, 68, 0.3)` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNodeAndCleanUp(id);
                            }}
                        >
                            ×
                        </button>
                        <div className="flex-1 text-center text-[10px] font-black uppercase text-red-400 tracking-[0.2em]">Generator</div>
                        <LockButton id={id} isAdjacent={isAdjacent} accentColor="red-500" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <NodeMixControl
                            value={mix}
                            onChange={setMixValue}
                        />

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wave Shape</label>
                            <select
                                value={waveShape}
                                onChange={handleWaveShapeChange}
                                className="nodrag bg-slate-800 text-[10px] text-red-300 border-none outline-none rounded p-1 uppercase font-bold"
                            >
                                {WAVE_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-red-400">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {/* Audio output port at the bottom */}
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={AUDIO_OUTPUT_HANDLE_ID}
                    position={Position.Bottom}
                    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-red-500"
                />
            )}
        </div>
    );
}
