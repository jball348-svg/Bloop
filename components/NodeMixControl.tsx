'use client';

import React from 'react';

type NodeMixControlProps = {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    bypassed?: boolean;
    onToggleBypass?: () => void;
    label?: string;
};

export default function NodeMixControl({
    value,
    onChange,
    disabled = false,
    bypassed = false,
    onToggleBypass,
    label = 'Mix',
}: NodeMixControlProps) {
    return (
        <div
            className="rounded-xl border px-3 py-3"
            style={{
                borderColor: 'var(--node-accent-border)',
                backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
            }}
        >
            <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        {label}
                    </label>
                    {onToggleBypass && (
                        <button
                            onClick={onToggleBypass}
                            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors"
                            style={
                                bypassed
                                    ? {
                                          backgroundColor: 'var(--node-accent)',
                                          color: 'var(--node-accent-contrast)',
                                      }
                                    : {
                                          backgroundColor: 'color-mix(in srgb, var(--node-accent) 16%, transparent)',
                                          border: '1px solid var(--node-accent-border)',
                                          color: 'var(--node-accent-text)',
                                      }
                            }
                        >
                            {bypassed ? 'Bypassed' : 'Bypass'}
                        </button>
                    )}
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--node-accent-text)' }}>
                    {bypassed ? 0 : value}%
                </span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                disabled={disabled || bypassed}
                onChange={(event) => onChange(Number(event.target.value))}
                className="nodrag mt-3 h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ accentColor: 'var(--node-accent)' }}
            />
        </div>
    );
}
