'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

const ONBOARDING_STEPS = [
    {
        title: 'Drop Your First Nodes',
        description:
            'Drag colourful blocks from the menus onto the canvas. Start with Keys or Arpeggiator on the left and a Generator from the top.',
        media: '/onboarding/drag-nodes.svg',
    },
    {
        title: 'Connect Control To Sound',
        description:
            'Pull a cable from a controller into a generator, then route the sound through effects or a Visualiser. Bloop keeps the flow readable from left to right and top to bottom.',
        media: '/onboarding/connect-flow.svg',
    },
    {
        title: 'Shape The Feeling',
        description:
            'Use ADSR, effects, and colour-coded modules to nudge the patch toward soft, sharp, bright, or strange. Small slider changes are enough to hear a different mood.',
        media: '/onboarding/shape-sound.svg',
    },
    {
        title: 'Play And Watch It Move',
        description:
            'Hit play on rhythm tools, tap Keys, or use MIDI input to drive the patch. The Visualiser lets you watch the sound breathe while you tweak it.',
        media: '/onboarding/play-and-watch.svg',
    },
    {
        title: 'Pack, Save, And Explore',
        description:
            'Lock snapped groups into a macro patch, save your favourite ideas, and use presets when you want a quick starting point. You can reopen this guide from System any time.',
        media: '/onboarding/pack-and-save.svg',
    },
] as const;

function OnboardingDialog() {
    const completeOnboarding = usePreferencesStore((state) => state.completeOnboarding);
    const closeOnboarding = usePreferencesStore((state) => state.closeOnboarding);
    const [stepIndex, setStepIndex] = useState(0);

    const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
    const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

    return (
        <div
            className="absolute inset-0 z-[60] flex items-center justify-center px-6 py-10"
            style={{ backgroundColor: 'color-mix(in srgb, var(--background) 82%, transparent)' }}
        >
            <div
                className="w-full max-w-5xl rounded-[2rem] border shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--surface-primary)',
                    borderColor: 'var(--border-primary)',
                    boxShadow: '0 35px 90px -45px rgba(15, 23, 42, 0.8)',
                }}
            >
                <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
                    <div
                        className="p-5 md:p-6"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)' }}
                    >
                        <Image
                            src={step.media}
                            alt={step.title}
                            width={1280}
                            height={720}
                            className="h-full min-h-[18rem] w-full rounded-[1.5rem] border object-cover"
                            style={{ borderColor: 'var(--border-primary)' }}
                        />
                    </div>

                    <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between gap-3">
                                <span
                                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 88%, transparent)',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    Quick Start {stepIndex + 1}/{ONBOARDING_STEPS.length}
                                </span>
                                <button
                                    onClick={closeOnboarding}
                                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-opacity hover:opacity-80"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Close
                                </button>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    {step.title}
                                </h2>
                                <p className="max-w-md text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                                    {step.description}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {ONBOARDING_STEPS.map((item, index) => (
                                    <button
                                        key={item.title}
                                        onClick={() => setStepIndex(index)}
                                        className="h-2.5 flex-1 rounded-full transition-all"
                                        style={{
                                            backgroundColor:
                                                index === stepIndex
                                                    ? '#22d3ee'
                                                    : 'color-mix(in srgb, var(--surface-tertiary) 90%, transparent)',
                                        }}
                                        aria-label={`Go to step ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <div
                                className="rounded-[1.25rem] border p-4 text-sm leading-6"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 86%, transparent)',
                                    borderColor: 'var(--border-primary)',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                The intro melody will stop when you close this guide. Reopen it any time from the System menu.
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                                onClick={completeOnboarding}
                                className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-opacity hover:opacity-80"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 86%, transparent)',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                Skip Intro
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                                    disabled={stepIndex === 0}
                                    className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all disabled:cursor-not-allowed disabled:opacity-35"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 86%, transparent)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => {
                                        if (isLastStep) {
                                            completeOnboarding();
                                            return;
                                        }
                                        setStepIndex((current) => Math.min(ONBOARDING_STEPS.length - 1, current + 1));
                                    }}
                                    className="rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ backgroundColor: '#22d3ee' }}
                                >
                                    {isLastStep ? 'Start Blooping' : 'Next'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingModal() {
    const onboardingOpen = usePreferencesStore((state) => state.onboardingOpen);
    const playOnboardingIntro = useStore((state) => state.playOnboardingIntro);
    const stopOnboardingIntro = useStore((state) => state.stopOnboardingIntro);

    useEffect(() => {
        if (!onboardingOpen) {
            stopOnboardingIntro();
            return;
        }

        playOnboardingIntro();

        return () => {
            stopOnboardingIntro();
        };
    }, [onboardingOpen, playOnboardingIntro, stopOnboardingIntro]);

    if (!onboardingOpen) {
        return null;
    }

    return <OnboardingDialog key="onboarding-open" />;
}
