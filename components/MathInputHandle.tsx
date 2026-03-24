'use client';

import { useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { MATH_INPUT_HANDLE_ID, type MathTargetOption, useStore } from '@/store/useStore';

type MathInputHandleProps = {
    nodeId: string;
    mathInputTarget: string;
    targetOptions: MathTargetOption[];
    onTargetChange: (target: string) => void;
};

export const useMathInputSelection = (nodeId: string, targetOptions: MathTargetOption[]) => {
    const mathInputTarget = useStore(
        (state) =>
            state.nodes.find((node) => node.id === nodeId)?.data.mathInputTarget ?? 'none'
    );
    const setMathInputTarget = useStore((state) => state.setMathInputTarget);

    useEffect(() => {
        if (targetOptions.some((option) => option.value === mathInputTarget)) {
            return;
        }

        setMathInputTarget(nodeId, 'none');
    }, [mathInputTarget, nodeId, setMathInputTarget, targetOptions]);

    return { mathInputTarget, setMathInputTarget };
};

export default function MathInputHandle({
    nodeId,
    mathInputTarget,
    targetOptions,
    onTargetChange,
}: MathInputHandleProps) {
    return (
        <>
            <div className="absolute top-3 -left-[9px] z-20 flex h-[18px] w-[18px] items-center justify-center bg-slate-900">
                <Handle
                    type="target"
                    id={MATH_INPUT_HANDLE_ID}
                    position={Position.Left}
                    style={{ position: 'static', transform: 'none', top: 'auto', left: 'auto' }}
                    className="!h-3 !w-3 rounded-full !border-2 !border-slate-900 !bg-violet-500 transition-all hover:scale-125"
                />
            </div>

            {targetOptions.length > 1 && (
                <div className="mb-2 flex items-center gap-1">
                    <label htmlFor={`${nodeId}-math-target`} className="text-[8px] font-black text-violet-400">
                        MATH
                    </label>
                    <select
                        id={`${nodeId}-math-target`}
                        value={mathInputTarget}
                        onChange={(event) => onTargetChange(event.target.value)}
                        className="nodrag max-w-full bg-transparent text-[8px] text-violet-300 outline-none"
                    >
                        {targetOptions.map((option) => (
                            <option key={option.value} value={option.value} className="bg-slate-900 text-violet-200">
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </>
    );
}
