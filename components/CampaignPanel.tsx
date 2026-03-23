'use client';

import { evaluateLevel } from '@/lib/campaignVerifier';
import { CAMPAIGN_LEVELS } from '@/store/campaignLevels';
import { useCampaignStore } from '@/store/campaign';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useStore } from '@/store/useStore';

export default function CampaignPanel() {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const activeLevelId = useCampaignStore((state) => state.activeLevelId);
    const completedLevelIds = useCampaignStore((state) => state.completedLevelIds);
    const lastCheckedLevelId = useCampaignStore((state) => state.lastCheckedLevelId);
    const lastCheckPassed = useCampaignStore((state) => state.lastCheckPassed);
    const setActiveLevel = useCampaignStore((state) => state.setActiveLevel);
    const setLastCheckResult = useCampaignStore((state) => state.setLastCheckResult);
    const completeLevel = useCampaignStore((state) => state.completeLevel);
    const goToNextLevel = useCampaignStore((state) => state.goToNextLevel);
    const exitCampaign = useCampaignStore((state) => state.exitCampaign);
    const unlockPreset = usePreferencesStore((state) => state.unlockPreset);
    const unlockSkin = usePreferencesStore((state) => state.unlockSkin);

    const activeLevel = CAMPAIGN_LEVELS.find((level) => level.id === activeLevelId) ?? CAMPAIGN_LEVELS[0];
    const evaluation = activeLevel ? evaluateLevel(activeLevel, nodes, edges) : [];
    const allConditionsPassed = evaluation.every((result) => result.passed);
    const isCompleted = activeLevel ? completedLevelIds.includes(activeLevel.id) : false;

    const handleCheck = () => {
        if (!activeLevel) {
            return;
        }

        const passed = evaluateLevel(activeLevel, nodes, edges).every((result) => result.passed);
        setLastCheckResult(activeLevel.id, passed);

        if (!passed) {
            return;
        }

        const isFirstCompletion = completeLevel(activeLevel.id, activeLevel.reward.value);
        if (!isFirstCompletion) {
            return;
        }

        if (activeLevel.reward.type === 'preset') {
            unlockPreset(activeLevel.reward.value);
            return;
        }

        unlockSkin(activeLevel.reward.value);
    };

    return (
        <aside
            className="w-[21rem] h-full border-r px-4 py-4 overflow-y-auto"
            style={{
                backgroundColor: 'color-mix(in srgb, var(--surface-primary) 92%, transparent)',
                borderColor: 'var(--border-primary)',
            }}
        >
            <div className="flex flex-col gap-4">
                <div className="rounded-[1.5rem] border p-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                Campaign Mode
                            </div>
                            <h2 className="mt-2 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Beginner Synth Trail
                            </h2>
                        </div>
                        <button
                            onClick={exitCampaign}
                            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 90%, transparent)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            Exit
                        </button>
                    </div>
                    <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                        Keep your current patch, solve small goals, and unlock cosmetic skins plus reward presets as you go.
                    </p>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    {CAMPAIGN_LEVELS.map((level, index) => {
                        const levelCompleted = completedLevelIds.includes(level.id);
                        const levelActive = level.id === activeLevel?.id;
                        return (
                            <button
                                key={level.id}
                                onClick={() => setActiveLevel(level.id)}
                                className="rounded-2xl border px-2 py-2 text-center transition-all"
                                style={{
                                    borderColor: levelActive ? '#22d3ee' : 'var(--border-primary)',
                                    backgroundColor: levelActive
                                        ? 'color-mix(in srgb, #22d3ee 18%, transparent)'
                                        : 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                                    color: levelCompleted ? '#22d3ee' : 'var(--text-primary)',
                                }}
                            >
                                <div className="text-[9px] font-black uppercase tracking-[0.14em]">Lv {index + 1}</div>
                                <div className="mt-1 text-[10px] font-bold">{levelCompleted ? 'Done' : 'Ready'}</div>
                            </button>
                        );
                    })}
                </div>

                {activeLevel && (
                    <div className="rounded-[1.5rem] border p-4" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                            Current Level
                        </div>
                        <h3 className="mt-2 text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {activeLevel.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                            {activeLevel.objective}
                        </p>
                        <p className="mt-3 rounded-2xl px-3 py-2 text-[12px] leading-5" style={{
                            backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                            color: 'var(--text-muted)',
                        }}>
                            Hint: {activeLevel.hint}
                        </p>

                        <div className="mt-4 space-y-2">
                            {evaluation.map((result) => {
                                const hasCheckedThisLevel = lastCheckedLevelId === activeLevel.id || isCompleted;
                                return (
                                    <div
                                        key={result.description}
                                        className="rounded-2xl border px-3 py-2 text-sm"
                                        style={{
                                            borderColor:
                                                hasCheckedThisLevel && result.passed
                                                    ? 'rgba(34, 211, 238, 0.45)'
                                                    : 'var(--border-primary)',
                                            backgroundColor:
                                                hasCheckedThisLevel && result.passed
                                                    ? 'color-mix(in srgb, #22d3ee 14%, transparent)'
                                                    : 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        {hasCheckedThisLevel && result.passed ? '✓ ' : '• '}
                                        {result.description}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleCheck}
                            className="mt-4 w-full rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                            style={{ backgroundColor: '#22d3ee' }}
                        >
                            Check My Patch
                        </button>

                        {lastCheckedLevelId === activeLevel.id && lastCheckPassed === false && !allConditionsPassed && (
                            <div
                                className="mt-3 rounded-2xl border px-3 py-3 text-sm leading-6"
                                style={{
                                    borderColor: 'rgba(251, 113, 133, 0.32)',
                                    backgroundColor: 'rgba(251, 113, 133, 0.08)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Not there yet. Keep the patch you have, tweak the missing steps above, and check again.
                            </div>
                        )}

                        {(isCompleted || (lastCheckedLevelId === activeLevel.id && lastCheckPassed === true)) && (
                            <div
                                className="mt-4 rounded-[1.5rem] border p-4"
                                style={{
                                    borderColor: 'rgba(34, 211, 238, 0.38)',
                                    backgroundColor: 'color-mix(in srgb, #22d3ee 12%, transparent)',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-10 w-10 rounded-2xl border"
                                        style={{
                                            borderColor: activeLevel.reward.previewColor ?? 'rgba(34, 211, 238, 0.38)',
                                            backgroundColor:
                                                activeLevel.reward.previewColor ??
                                                'color-mix(in srgb, #22d3ee 18%, transparent)',
                                        }}
                                    />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                            Reward Unlocked
                                        </div>
                                        <div className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                                            {activeLevel.reward.label}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                                    {activeLevel.reward.description}
                                </p>
                                <button
                                    onClick={goToNextLevel}
                                    className="mt-4 w-full rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em]"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {completedLevelIds.length === CAMPAIGN_LEVELS.length ? 'Replay Levels' : 'Next Level'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
