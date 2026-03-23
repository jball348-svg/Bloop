'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '@/store/usePreferencesStore';

const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export default function ThemeController() {
    const theme = usePreferencesStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
            root.dataset.theme = resolvedTheme;
            root.classList.toggle('light', resolvedTheme === 'light');
        };

        applyTheme();
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, [theme]);

    return null;
}
