import type { CSSProperties } from 'react';
import type { AudioNodeType } from '@/store/useStore';

export const DEFAULT_NODE_ACCENTS: Record<AudioNodeType, string> = {
    controller: '#eab308',
    keys: '#f8fafc',
    midiin: '#d4d4d4',
    moodpad: '#f43f5e',
    pulse: '#84cc16',
    stepsequencer: '#3b82f6',
    pattern: '#1d4ed8',
    lfo: '#65a30d',
    chord: '#38bdf8',
    quantizer: '#a855f7',
    adsr: '#d97706',
    generator: '#ef4444',
    sampler: '#a8a29e',
    audioin: '#94a3b8',
    drum: '#f97316',
    advanceddrum: '#22c55e',
    effect: '#d946ef',
    eq: '#a1a1aa',
    unison: '#8b5cf6',
    detune: '#14b8a6',
    visualiser: '#ec4899',
    speaker: '#10b981',
    mixer: '#10b981',
    tempo: '#6366f1',
    arranger: '#4338ca',
};

export const CORE_ACCENT_PALETTE = [
    { id: 'sun', label: 'Sun', color: '#f59e0b' },
    { id: 'ember', label: 'Ember', color: '#ef4444' },
    { id: 'melon', label: 'Melon', color: '#fb7185' },
    { id: 'lime', label: 'Lime', color: '#84cc16' },
    { id: 'mint', label: 'Mint', color: '#34d399' },
    { id: 'sea', label: 'Sea', color: '#2dd4bf' },
    { id: 'sky', label: 'Sky', color: '#38bdf8' },
    { id: 'cobalt', label: 'Cobalt', color: '#3b82f6' },
    { id: 'iris', label: 'Iris', color: '#8b5cf6' },
    { id: 'violet', label: 'Violet', color: '#a855f7' },
    { id: 'orchid', label: 'Orchid', color: '#d946ef' },
    { id: 'rose', label: 'Rose', color: '#f43f5e' },
] as const;

export const CAMPAIGN_SKINS = {
    aurora: { id: 'aurora', label: 'Aurora', color: '#67e8f9' },
    neon: { id: 'neon', label: 'Neon', color: '#39ff14' },
    signal: { id: 'signal', label: 'Signal', color: '#fb7185' },
} as const;

export const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#', '');
    const normalized =
        sanitized.length === 3
            ? sanitized
                .split('')
                .map((part) => `${part}${part}`)
                .join('')
            : sanitized;
    const value = Number.parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getRelativeLuminance = (hex: string) => {
    const sanitized = hex.replace('#', '');
    const normalized =
        sanitized.length === 3
            ? sanitized
                .split('')
                .map((part) => `${part}${part}`)
                .join('')
            : sanitized;
    const value = Number.parseInt(normalized, 16);
    const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
        const normalizedChannel = channel / 255;
        return normalizedChannel <= 0.03928
            ? normalizedChannel / 12.92
            : ((normalizedChannel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

export const getReadableTextColor = (hex: string) =>
    getRelativeLuminance(hex) > 0.5 ? '#0f172a' : '#f8fafc';

export const buildNodeAccentStyle = (accent: string): CSSProperties & Record<string, string> => ({
    '--node-accent': accent,
    '--node-accent-soft': hexToRgba(accent, 0.16),
    '--node-accent-border': hexToRgba(accent, 0.32),
    '--node-accent-strong': accent,
    '--node-accent-text': accent,
    '--node-accent-contrast': getReadableTextColor(accent),
});
