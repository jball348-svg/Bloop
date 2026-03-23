import type { CampaignCondition, CampaignLevel } from '@/lib/campaignTypes';
import {
    isAudioEdge,
    isControlEdge,
    type AppEdge,
    type AppNode,
    type AudioNodeType,
    type ConnectionKind,
} from '@/store/useStore';

type TypeMatcher = AudioNodeType | readonly AudioNodeType[];

const normalizeTypes = (types: TypeMatcher) => (Array.isArray(types) ? types : [types]);

const buildReachabilityMap = (edges: AppEdge[], kind: ConnectionKind) => {
    const adjacency = new Map<string, string[]>();

    edges
        .filter((edge) => (kind === 'control' ? isControlEdge(edge) : isAudioEdge(edge)))
        .forEach((edge) => {
            const sourceId = edge.data?.originalSource || edge.source;
            const targetId = edge.data?.originalTarget || edge.target;
            const currentTargets = adjacency.get(sourceId) ?? [];
            currentTargets.push(targetId);
            adjacency.set(sourceId, currentTargets);
        });

    return adjacency;
};

export const hasNodeOfType = (types: TypeMatcher, description: string): CampaignCondition => {
    const allowedTypes = new Set(normalizeTypes(types));
    return {
        description,
        check: (nodes) => nodes.some((node) => allowedTypes.has(node.type)),
    };
};

export const hasNodeMatching = (
    description: string,
    predicate: (node: AppNode) => boolean
): CampaignCondition => ({
    description,
    check: (nodes) => nodes.some(predicate),
});

export const pathExists = (
    sourceTypes: TypeMatcher,
    targetTypes: TypeMatcher,
    kind: ConnectionKind,
    description: string
): CampaignCondition => {
    const sourceSet = new Set(normalizeTypes(sourceTypes));
    const targetSet = new Set(normalizeTypes(targetTypes));

    return {
        description,
        check: (nodes, edges) => {
            const adjacency = buildReachabilityMap(edges, kind);
            const nodesById = new Map(nodes.map((node) => [node.id, node]));
            const queue = nodes
                .filter((node) => sourceSet.has(node.type))
                .map((node) => node.id);
            const visited = new Set(queue);

            while (queue.length > 0) {
                const currentId = queue.shift();
                if (!currentId) {
                    continue;
                }

                const currentNode = nodesById.get(currentId);
                if (currentNode && targetSet.has(currentNode.type)) {
                    return true;
                }

                (adjacency.get(currentId) ?? []).forEach((nextId) => {
                    if (!visited.has(nextId)) {
                        visited.add(nextId);
                        queue.push(nextId);
                    }
                });
            }

            return false;
        },
    };
};

export const evaluateLevel = (level: CampaignLevel, nodes: AppNode[], edges: AppEdge[]) =>
    level.conditions.map((condition) => ({
        description: condition.description,
        passed: condition.check(nodes, edges),
    }));

export const verifyLevel = (level: CampaignLevel, nodes: AppNode[], edges: AppEdge[]) =>
    evaluateLevel(level, nodes, edges).every((result) => result.passed);
