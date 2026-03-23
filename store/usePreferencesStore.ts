'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AudioNodeType } from '@/store/useStore';
import { buildNodeAccentStyle, CAMPAIGN_SKINS, CORE_ACCENT_PALETTE, DEFAULT_NODE_ACCENTS } from '@/lib/nodePalette';

export type ThemeMode = 'dark' | 'light' | 'system';

type PreferencesState = {
    theme: ThemeMode;
    onboardingSeen: boolean;
    onboardingOpen: boolean;
    nodeColorOverrides: Partial<Record<AudioNodeType, string>>;
    unlockedPresetIds: string[];
    unlockedSkinIds: string[];
    setTheme: (theme: ThemeMode) => void;
    setNodeColorOverride: (type: AudioNodeType, color: string) => void;
    resetNodeColorOverride: (type: AudioNodeType) => void;
    openOnboarding: () => void;
    closeOnboarding: () => void;
    completeOnboarding: () => void;
    reopenOnboarding: () => void;
    unlockPreset: (presetId: string) => void;
    unlockSkin: (skinId: string) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            theme: 'dark',
            onboardingSeen: false,
            onboardingOpen: false,
            nodeColorOverrides: {},
            unlockedPresetIds: [],
            unlockedSkinIds: [],
            setTheme: (theme) => set({ theme }),
            setNodeColorOverride: (type, color) =>
                set((state) => ({
                    nodeColorOverrides: {
                        ...state.nodeColorOverrides,
                        [type]: color,
                    },
                })),
            resetNodeColorOverride: (type) =>
                set((state) => {
                    const nextOverrides = { ...state.nodeColorOverrides };
                    delete nextOverrides[type];
                    return { nodeColorOverrides: nextOverrides };
                }),
            openOnboarding: () => set({ onboardingOpen: true }),
            closeOnboarding: () => set({ onboardingOpen: false }),
            completeOnboarding: () => set({ onboardingSeen: true, onboardingOpen: false }),
            reopenOnboarding: () => set({ onboardingOpen: true }),
            unlockPreset: (presetId) =>
                set((state) => ({
                    unlockedPresetIds: state.unlockedPresetIds.includes(presetId)
                        ? state.unlockedPresetIds
                        : [...state.unlockedPresetIds, presetId],
                })),
            unlockSkin: (skinId) =>
                set((state) => ({
                    unlockedSkinIds: state.unlockedSkinIds.includes(skinId)
                        ? state.unlockedSkinIds
                        : [...state.unlockedSkinIds, skinId],
                })),
        }),
        {
            name: 'bloop-preferences',
            storage:
                typeof window === 'undefined'
                    ? undefined
                    : createJSONStorage(() => window.localStorage),
            partialize: (state) => ({
                theme: state.theme,
                onboardingSeen: state.onboardingSeen,
                nodeColorOverrides: state.nodeColorOverrides,
                unlockedPresetIds: state.unlockedPresetIds,
                unlockedSkinIds: state.unlockedSkinIds,
            }),
        }
    )
);

export const useNodeAccent = (type: AudioNodeType) =>
    usePreferencesStore((state) => state.nodeColorOverrides[type] ?? DEFAULT_NODE_ACCENTS[type]);

export const useNodeAccentStyle = (type: AudioNodeType) => {
    const accent = useNodeAccent(type);
    return buildNodeAccentStyle(accent);
};

export const getUnlockedSkinPalette = (unlockedSkinIds: string[]) =>
    unlockedSkinIds
        .map((skinId) => CAMPAIGN_SKINS[skinId as keyof typeof CAMPAIGN_SKINS])
        .filter((skin): skin is (typeof CAMPAIGN_SKINS)[keyof typeof CAMPAIGN_SKINS] => Boolean(skin));

export const getAvailableAccentPalette = (unlockedSkinIds: string[]) => [
    ...CORE_ACCENT_PALETTE,
    ...getUnlockedSkinPalette(unlockedSkinIds),
];
