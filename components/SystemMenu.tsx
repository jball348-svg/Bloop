'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useCampaignStore } from '@/store/campaign';
import { type ThemeMode, usePreferencesStore } from '@/store/usePreferencesStore';
import { getPresetGroups, getPresetPatchAsset, type Preset } from '@/store/presets';
import { type PatchValidationReport, useStore } from '@/store/useStore';

type ActivePanel = 'presets' | 'appearance' | null;

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string }> = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'system', label: 'System' },
];

const panelShellStyle = {
    backgroundColor: 'color-mix(in srgb, var(--control-panel) 96%, transparent)',
    borderColor: 'var(--control-panel-border)',
};

const chromeButtonStyle = {
    backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
    color: 'var(--text-primary)',
};

const subtleButtonStyle = {
    backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
    color: 'var(--text-muted)',
};

const accentButtonStyle = {
    backgroundColor: '#22d3ee',
    color: '#0f172a',
};

type LoadNotice = {
    tone: 'success' | 'warning' | 'error';
    title: string;
    lines: string[];
};

const buildLoadNotice = (label: string, report: PatchValidationReport): LoadNotice => {
    if (report.hasErrors) {
        return {
            tone: 'error',
            title: `${label} loaded with ${report.errorCount} error${report.errorCount === 1 ? '' : 's'}`,
            lines: report.issues.slice(0, 4).map((issue) => issue.message),
        };
    }

    if (report.warningCount > 0) {
        return {
            tone: 'warning',
            title: `${label} loaded with ${report.warningCount} warning${report.warningCount === 1 ? '' : 's'}`,
            lines: report.issues.slice(0, 4).map((issue) => issue.message),
        };
    }

    return {
        tone: 'success',
        title: `${label} loaded cleanly`,
        lines: ['Patch normalized without warnings.'],
    };
};

const SystemMenu = () => {
    const {
        nodes,
        edges,
        masterVolume,
        clearCanvas,
        loadCanvas,
        undo,
        redo,
        canUndo,
        canRedo,
        signalFlowVisible,
        toggleSignalFlow,
    } = useStore();
    const theme = usePreferencesStore((state) => state.theme);
    const setTheme = usePreferencesStore((state) => state.setTheme);
    const unlockedPresetIds = usePreferencesStore((state) => state.unlockedPresetIds);
    const reopenOnboarding = usePreferencesStore((state) => state.reopenOnboarding);
    const campaignMode = useCampaignStore((state) => state.campaignMode);
    const enterCampaign = useCampaignStore((state) => state.enterCampaign);
    const exitCampaign = useCampaignStore((state) => state.exitCampaign);
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [loadNotice, setLoadNotice] = useState<LoadNotice | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const presetGroups = useMemo(() => getPresetGroups(unlockedPresetIds), [unlockedPresetIds]);

    const applyPatchLoad = (label: string, asset: Parameters<typeof loadCanvas>[0]) => {
        const report = loadCanvas(asset);
        setLoadNotice(buildLoadNotice(label, report));
        return report;
    };

    const handlePresetLoad = async (preset: Preset) => {
        try {
            const asset = await getPresetPatchAsset(preset);
            applyPatchLoad(preset.name, asset);
            setActivePanel(null);
        } catch (error) {
            console.error('Failed to load preset:', error);
            setLoadNotice({
                tone: 'error',
                title: `Could not load ${preset.name}`,
                lines: ['Preset asset fetch failed. Check the shipped patch path and try again.'],
            });
        }
    };

    const handleSave = () => {
        const data = {
            version: 1,
            nodes,
            edges,
            masterVolume,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patch-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.bloop`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            try {
                const content = readerEvent.target?.result as string;
                const data = JSON.parse(content);
                applyPatchLoad(file.name, data);
            } catch (error) {
                console.error('Failed to load patch:', error);
                setLoadNotice({
                    tone: 'error',
                    title: `Could not load ${file.name}`,
                    lines: ['Invalid .bloop file.'],
                });
            }
        };
        reader.readAsText(file);
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 select-none">
            {loadNotice && (
                <div
                    className="w-[28rem] rounded-[1.5rem] border px-4 py-3 shadow-2xl"
                    style={{
                        ...panelShellStyle,
                        borderColor:
                            loadNotice.tone === 'error'
                                ? 'rgba(248, 113, 113, 0.45)'
                                : loadNotice.tone === 'warning'
                                    ? 'rgba(251, 191, 36, 0.45)'
                                    : 'rgba(34, 211, 238, 0.35)',
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div
                                className="text-[10px] font-black uppercase tracking-[0.18em]"
                                style={{
                                    color:
                                        loadNotice.tone === 'error'
                                            ? '#fecaca'
                                            : loadNotice.tone === 'warning'
                                                ? '#fde68a'
                                                : '#67e8f9',
                                }}
                            >
                                {loadNotice.title}
                            </div>
                            <div className="mt-2 space-y-1">
                                {loadNotice.lines.map((line) => (
                                    <div
                                        key={line}
                                        className="text-[11px] leading-5"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setLoadNotice(null)}
                            className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                            style={subtleButtonStyle}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {activePanel === 'presets' && (
                <div className="mb-2 max-h-[60vh] w-[28rem] overflow-y-auto rounded-[1.75rem] border p-3 shadow-2xl" style={panelShellStyle}>
                    <div className="mb-3 px-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                        Presets Library
                    </div>
                    <div className="space-y-3">
                        {presetGroups.map((group) => (
                            <div key={group.category} className="rounded-2xl border p-2" style={{ borderColor: 'var(--border-primary)' }}>
                                <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                    {group.category}
                                </div>
                                <div className="space-y-1">
                                    {group.presets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            disabled={!preset.unlocked}
                                            onClick={() => {
                                                if (!preset.unlocked) return;
                                                void handlePresetLoad(preset);
                                            }}
                                            className="w-full rounded-2xl border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55"
                                            style={{
                                                borderColor: preset.unlocked ? 'var(--border-primary)' : 'rgba(148, 163, 184, 0.18)',
                                                backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-[12px] font-black" style={{ color: 'var(--text-primary)' }}>
                                                        {preset.name}
                                                    </div>
                                                    <div className="text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>
                                                        {preset.description}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: preset.unlocked ? '#22d3ee' : 'var(--text-muted)' }}>
                                                    {preset.unlocked ? 'Load' : 'Locked'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activePanel === 'appearance' && (
                <div className="mb-2 w-[22rem] rounded-[1.75rem] border p-3 shadow-2xl" style={panelShellStyle}>
                    <div className="mb-3 px-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                        Appearance
                    </div>

                    <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                            Theme
                        </div>
                        <div className="mt-3 flex gap-2">
                            {THEME_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setTheme(option.id)}
                                    className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all"
                                    style={theme === option.id ? accentButtonStyle : subtleButtonStyle}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 rounded-2xl border px-3 py-3 text-[11px] leading-5" style={{
                            borderColor: 'var(--border-primary)',
                            backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                            color: 'var(--text-muted)',
                        }}>
                            Keep it simple: choose the theme that feels best and Bloop will restyle the whole canvas.
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-full border px-4 py-2 shadow-xl flex items-center gap-3" style={panelShellStyle}>
                <span className="text-[9px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>
                    System
                </span>

                <button onClick={clearCanvas} className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center" style={chromeButtonStyle}>
                    New
                </button>

                <button onClick={handleSave} className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center" style={chromeButtonStyle}>
                    Save
                </button>

                <button onClick={handleLoadClick} className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center" style={chromeButtonStyle}>
                    Load
                </button>

                <div className="w-px h-4" style={{ backgroundColor: 'var(--border-primary)' }} />

                <button
                    onClick={() => setActivePanel((current) => (current === 'presets' ? null : 'presets'))}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center"
                    style={activePanel === 'presets' ? accentButtonStyle : chromeButtonStyle}
                >
                    Presets
                </button>

                <button
                    onClick={toggleSignalFlow}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center"
                    style={
                        signalFlowVisible
                            ? { backgroundColor: '#39ff14', color: '#020617', boxShadow: '0 0 12px rgba(57,255,20,0.25)' }
                            : chromeButtonStyle
                    }
                >
                    Flow
                </button>

                <div className="w-px h-4" style={{ backgroundColor: 'var(--border-primary)' }} />

                <button
                    onClick={() => setActivePanel((current) => (current === 'appearance' ? null : 'appearance'))}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center"
                    style={activePanel === 'appearance' ? accentButtonStyle : chromeButtonStyle}
                >
                    Appearance
                </button>

                <button onClick={reopenOnboarding} className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center" style={chromeButtonStyle}>
                    Intro
                </button>

                <button
                    onClick={() => {
                        if (campaignMode) {
                            exitCampaign();
                            return;
                        }
                        enterCampaign();
                    }}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center"
                    style={campaignMode ? { backgroundColor: '#22d3ee', color: '#0f172a' } : chromeButtonStyle}
                >
                    {campaignMode ? 'Exit Tutorial' : 'Tutorial'}
                </button>

                <div className="w-px h-4" style={{ backgroundColor: 'var(--border-primary)' }} />

                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center disabled:cursor-not-allowed"
                    style={canUndo ? chromeButtonStyle : subtleButtonStyle}
                >
                    Undo
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-center disabled:cursor-not-allowed"
                    style={canRedo ? chromeButtonStyle : subtleButtonStyle}
                >
                    Redo
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".bloop"
                className="hidden"
            />
        </div>
    );
};

export default SystemMenu;
