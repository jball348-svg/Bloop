'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
    getBezierPath,
    Position,
    useViewport,
} from 'reactflow';
import {
    AUDIO_INPUT_HANDLE_ID,
    AUDIO_OUTPUT_HANDLE_ID,
    AUDIO_SIGNAL_COLOR,
    CONTROL_INPUT_HANDLE_ID,
    CONTROL_OUTPUT_HANDLE_ID,
    CONTROL_SIGNAL_COLOR,
    type AppNode,
    useStore,
} from '@/store/useStore';

const NODE_DIMS: Record<string, { w: number; h: number }> = {
    controller: { w: 288, h: 320 },
    keys: { w: 288, h: 320 },
    moodpad: { w: 320, h: 416 },
    pulse: { w: 288, h: 280 },
    stepsequencer: { w: 352, h: 420 },
    chord: { w: 224, h: 240 },
    quantizer: { w: 240, h: 272 },
    adsr: { w: 224, h: 340 },
    generator: { w: 240, h: 220 },
    drum: { w: 320, h: 360 },
    effect: { w: 224, h: 260 },
    unison: { w: 224, h: 220 },
    detune: { w: 224, h: 200 },
    visualiser: { w: 224, h: 220 },
    speaker: { w: 224, h: 200 },
    tempo: { w: 256, h: 240 },
};

const getDims = (type: string) => NODE_DIMS[type] ?? { w: 224, h: 220 };

const getHandlePosition = (node: AppNode, handleId: string | null | undefined) => {
    const dims = getDims(node.type);

    switch (handleId) {
        case CONTROL_OUTPUT_HANDLE_ID:
            return {
                x: node.position.x + dims.w,
                y: node.position.y + dims.h / 2,
                position: Position.Right,
            };
        case CONTROL_INPUT_HANDLE_ID:
            return {
                x: node.position.x,
                y: node.position.y + dims.h / 2,
                position: Position.Left,
            };
        case AUDIO_OUTPUT_HANDLE_ID:
            return {
                x: node.position.x + dims.w / 2,
                y: node.position.y + dims.h,
                position: Position.Bottom,
            };
        case AUDIO_INPUT_HANDLE_ID:
        default:
            return {
                x: node.position.x + dims.w / 2,
                y: node.position.y,
                position: Position.Top,
            };
    }
};

export default function SignalFlowOverlay() {
    const signalFlowVisible = useStore((state) => state.signalFlowVisible);
    const signalFlowEvents = useStore((state) => state.signalFlowEvents);
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const setSignalFlowVisible = useStore((state) => state.setSignalFlowVisible);
    const { x, y, zoom } = useViewport();
    const slowFramesRef = useRef(0);
    const rafRef = useRef<number>(0);

    const nodesById = useMemo(
        () => new Map(nodes.map((node) => [node.id, node])),
        [nodes]
    );

    useEffect(() => {
        if (!signalFlowVisible || signalFlowEvents.length === 0) {
            return;
        }

        let lastFrame = performance.now();
        const measure = (timestamp: number) => {
            const delta = timestamp - lastFrame;
            lastFrame = timestamp;

            if (delta > 50) {
                slowFramesRef.current += 1;
            } else {
                slowFramesRef.current = 0;
            }

            if (slowFramesRef.current >= 10) {
                console.warn('Signal Flow mode disabled automatically due to low frame rate.');
                setSignalFlowVisible(false);
                return;
            }

            rafRef.current = requestAnimationFrame(measure);
        };

        rafRef.current = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(rafRef.current);
    }, [signalFlowEvents.length, signalFlowVisible, setSignalFlowVisible]);

    if (!signalFlowVisible || signalFlowEvents.length === 0) {
        return null;
    }

    return (
        <svg className="pointer-events-none absolute inset-0 z-[5] overflow-visible">
            <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
                {signalFlowEvents.map((event) => {
                    const edge = edges.find((candidate) => candidate.id === event.edgeId && !candidate.hidden);
                    if (!edge) {
                        return null;
                    }

                    const sourceNode = nodesById.get(edge.source);
                    const targetNode = nodesById.get(edge.target);
                    if (!sourceNode || !targetNode) {
                        return null;
                    }

                    const sourceHandle = getHandlePosition(sourceNode, edge.sourceHandle);
                    const targetHandle = getHandlePosition(targetNode, edge.targetHandle);
                    const [path] = getBezierPath({
                        sourceX: sourceHandle.x,
                        sourceY: sourceHandle.y,
                        sourcePosition: sourceHandle.position,
                        targetX: targetHandle.x,
                        targetY: targetHandle.y,
                        targetPosition: targetHandle.position,
                    });
                    const color =
                        event.color ??
                        (event.kind === 'audio' ? AUDIO_SIGNAL_COLOR : CONTROL_SIGNAL_COLOR);

                    return (
                        <circle
                            key={event.id}
                            r={5}
                            fill={color}
                            opacity={0.95}
                            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                        >
                            <animateMotion dur={`${event.durationMs}ms`} path={path} rotate="auto" />
                        </circle>
                    );
                })}
            </g>
        </svg>
    );
}
