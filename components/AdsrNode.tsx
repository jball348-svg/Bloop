import { Handle, Position } from 'reactflow';
import {
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    getMathTargetOptionsForNode,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import MathInputHandle, { useMathInputSelection } from './MathInputHandle';
import PackedNode from './PackedNode';

interface AdsrSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    format: (value: number) => string;
}

const AdsrSlider: React.FC<AdsrSliderProps> = ({ label, value, min, max, step, onChange, format }) => {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                <span className="text-[10px] text-amber-600 font-mono">{format(value)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="nodrag w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                style={{
                    background: `linear-gradient(to right, #92400e 0%, #92400e ${((value - min) / (max - min)) * 100}%, #475569 ${((value - min) / (max - min)) * 100}%, #475569 100%)`,
                }}
            />
        </div>
    );
};

interface AdsrDiagramProps {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
}

const AdsrDiagram: React.FC<AdsrDiagramProps> = ({ attack, decay, sustain, release }) => {
    const width = 200;
    const height = 48;
    const padding = 4;
    
    // Normalize values for visualization
    const maxTime = Math.max(attack + decay + 0.2 + release, 1);
    const attackX = (attack / maxTime) * (width - 2 * padding) + padding;
    const decayX = (decay / maxTime) * (width - 2 * padding);
    const holdX = 0.2 / maxTime * (width - 2 * padding); // Fixed 20% hold for visual clarity
    const releaseX = (release / maxTime) * (width - 2 * padding);
    const sustainY = height - padding - (sustain * (height - 2 * padding));
    
    const points = [
        `${padding},${height - padding}`, // Start (bottom left)
        `${attackX},${padding}`, // Attack peak (top)
        `${attackX + decayX},${sustainY}`, // Decay to sustain level
        `${attackX + decayX + holdX},${sustainY}`, // Hold at sustain level
        `${attackX + decayX + holdX + releaseX},${height - padding}`, // Release to bottom
    ].join(' ');
    
    return (
        <svg width={width} height={height} className="w-full">
            <polyline
                points={points}
                fill="none"
                stroke="#92400e"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default function AdsrNode({ id }: { id: string }) {
    const updateNodeValue = useStore((state) => state.updateNodeValue);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });
    
    const node = useStore((state) => state.nodes.find((entry) => entry.id === id));
    const nodeData = node?.data;
    const attack = nodeData?.attack ?? 0.01;
    const decay = nodeData?.decay ?? 0.1;
    const sustain = nodeData?.sustain ?? 0.7;
    const release = nodeData?.release ?? 0.5;
    const accentStyle = useNodeAccentStyle('adsr');
    const targetOptions = getMathTargetOptionsForNode(node);
    const { mathInputTarget, setMathInputTarget } = useMathInputSelection(id, targetOptions);
    
    const handleAttackChange = (value: number) => {
        updateNodeValue(id, { attack: value });
    };
    
    const handleDecayChange = (value: number) => {
        updateNodeValue(id, { decay: value });
    };
    
    const handleSustainChange = (value: number) => {
        updateNodeValue(id, { sustain: value });
    };
    
    const handleReleaseChange = (value: number) => {
        updateNodeValue(id, { release: value });
    };
    
    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-amber-700 rounded-2xl p-3 shadow-2xl text-white w-56 flex flex-col transition-all hover:shadow-amber-700/20 group relative select-none${
            isAdjacent ? getAdjacencyGlowClasses('adsr') : ''
        }`}
        >
            <MathInputHandle
                nodeId={id}
                mathInputTarget={mathInputTarget}
                targetOptions={targetOptions}
                onTargetChange={(target) => setMathInputTarget(id, target)}
            />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-amber-600 hover:text-white hover:border-amber-500 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 6px rgba(146, 64, 14, 0.3)` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] text-center flex-1">
                        ADSR
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="amber-700" />
                </div>

                <div className="flex flex-col gap-3">
                    <AdsrSlider
                        label="Attack"
                        value={attack}
                        min={0.001}
                        max={2}
                        step={0.001}
                        onChange={handleAttackChange}
                        format={(val) => `${val.toFixed(3)}s`}
                    />
                    
                    <AdsrSlider
                        label="Decay"
                        value={decay}
                        min={0.01}
                        max={2}
                        step={0.001}
                        onChange={handleDecayChange}
                        format={(val) => `${val.toFixed(3)}s`}
                    />
                    
                    <AdsrSlider
                        label="Sustain"
                        value={sustain}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={handleSustainChange}
                        format={(val) => `${Math.round(val * 100)}%`}
                    />
                    
                    <AdsrSlider
                        label="Release"
                        value={release}
                        min={0.01}
                        max={4}
                        step={0.001}
                        onChange={handleReleaseChange}
                        format={(val) => `${val.toFixed(3)}s`}
                    />
                    
                    <div className="mt-2">
                        <AdsrDiagram
                            attack={attack}
                            decay={decay}
                            sustain={sustain}
                            release={release}
                        />
                    </div>
                </div>
            </div>

            {isUnconnected && (
                <div className="mt-3 flex items-center gap-1.5 opacity-40 text-amber-600">
                    <div className="flex-1 h-px bg-current" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                    <div className="flex-1 h-px bg-current" />
                </div>
            )}

            {(!nodeData?.isLocked || nodeData?.isEntry) && (
                <Handle
                    type="target"
                    id={CONTROL_INPUT_HANDLE_ID}
                    position={Position.Left}
                    className="w-4 h-4 border-4 border-slate-900 !-left-2 hover:scale-125 transition-all bg-amber-600"
                />
            )}
            
            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={CONTROL_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-amber-600"
                />
            )}
        </div>
    );
}
