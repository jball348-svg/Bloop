'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CAMPAIGN_LEVELS } from '@/store/campaignLevels';

type CampaignState = {
    campaignMode: boolean;
    activeLevelId: string;
    completedLevelIds: string[];
    unlockedRewardIds: string[];
    lastCheckedLevelId: string | null;
    lastCheckPassed: boolean | null;
    enterCampaign: () => void;
    exitCampaign: () => void;
    setActiveLevel: (levelId: string) => void;
    setLastCheckResult: (levelId: string, passed: boolean) => void;
    clearLastCheckResult: () => void;
    completeLevel: (levelId: string, rewardId: string) => boolean;
    goToNextLevel: () => void;
};

const getNextLevelId = (completedLevelIds: string[], currentLevelId?: string) => {
    const currentIndex = currentLevelId
        ? CAMPAIGN_LEVELS.findIndex((level) => level.id === currentLevelId)
        : -1;

    for (let index = Math.max(currentIndex + 1, 0); index < CAMPAIGN_LEVELS.length; index += 1) {
        const candidate = CAMPAIGN_LEVELS[index];
        if (candidate && !completedLevelIds.includes(candidate.id)) {
            return candidate.id;
        }
    }

    const fallback = CAMPAIGN_LEVELS.find((level) => !completedLevelIds.includes(level.id));
    return fallback?.id ?? CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1]?.id ?? 'first-sound';
};

export const useCampaignStore = create<CampaignState>()(
    persist(
        (set, get) => ({
            campaignMode: false,
            activeLevelId: CAMPAIGN_LEVELS[0]?.id ?? 'first-sound',
            completedLevelIds: [],
            unlockedRewardIds: [],
            lastCheckedLevelId: null,
            lastCheckPassed: null,
            enterCampaign: () => set({ campaignMode: true }),
            exitCampaign: () => set({ campaignMode: false, lastCheckedLevelId: null, lastCheckPassed: null }),
            setActiveLevel: (levelId) =>
                set({
                    activeLevelId: levelId,
                    lastCheckedLevelId: null,
                    lastCheckPassed: null,
                }),
            setLastCheckResult: (levelId, passed) =>
                set({
                    lastCheckedLevelId: levelId,
                    lastCheckPassed: passed,
                }),
            clearLastCheckResult: () => set({ lastCheckedLevelId: null, lastCheckPassed: null }),
            completeLevel: (levelId, rewardId) => {
                const alreadyCompleted = get().completedLevelIds.includes(levelId);
                const nextCompletedLevelIds = alreadyCompleted
                    ? get().completedLevelIds
                    : [...get().completedLevelIds, levelId];
                const nextUnlockedRewardIds = get().unlockedRewardIds.includes(rewardId)
                    ? get().unlockedRewardIds
                    : [...get().unlockedRewardIds, rewardId];

                set({
                    completedLevelIds: nextCompletedLevelIds,
                    unlockedRewardIds: nextUnlockedRewardIds,
                    lastCheckedLevelId: levelId,
                    lastCheckPassed: true,
                    activeLevelId: alreadyCompleted
                        ? get().activeLevelId
                        : getNextLevelId(nextCompletedLevelIds, levelId),
                });

                return !alreadyCompleted;
            },
            goToNextLevel: () => {
                const nextLevelId = getNextLevelId(get().completedLevelIds, get().activeLevelId);
                set({
                    activeLevelId: nextLevelId,
                    lastCheckedLevelId: null,
                    lastCheckPassed: null,
                });
            },
        }),
        {
            name: 'bloop-campaign',
            partialize: (state) => ({
                activeLevelId: state.activeLevelId,
                completedLevelIds: state.completedLevelIds,
                unlockedRewardIds: state.unlockedRewardIds,
            }),
        }
    )
);
