'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme';

export default function ThemeInitializer() {
  const { currentTheme, setTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme, setTheme]);

  return null;
}
