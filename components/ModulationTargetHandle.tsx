'use client';

import { Handle, Position } from 'reactflow';
import {
    createModulationHandleId,
    type AutomatableParamKey,
} from '@/store/useStore';

type ModulationTargetHandleProps = {
    paramKey: AutomatableParamKey;
    top: number | string;
};

export default function ModulationTargetHandle({
    paramKey,
    top,
}: ModulationTargetHandleProps) {
    return (
        <Handle
            type="target"
            id={createModulationHandleId(paramKey)}
            position={Position.Right}
            style={{ top }}
            className="h-3 w-3 border-2 border-slate-950 !-right-1.5 bg-lime-500 transition-all hover:scale-125"
        />
    );
}
