import type { AppEdge, AppNode } from '@/store/useStore';

export interface CampaignCondition {
    description: string;
    check: (nodes: AppNode[], edges: AppEdge[]) => boolean;
}

export interface CampaignReward {
    type: 'preset' | 'nodeSkin';
    label: string;
    value: string;
    description: string;
    previewColor?: string;
}

export interface CampaignLevel {
    id: string;
    title: string;
    objective: string;
    hint: string;
    conditions: CampaignCondition[];
    reward: CampaignReward;
}
