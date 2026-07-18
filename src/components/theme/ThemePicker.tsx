'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useThemeStore, themes, type ThemeId } from '@/stores/theme';

// Visual preview colors for each theme
const themePreview: Record<ThemeId, { primary: string; secondary: string }> = {
  forest: { primary: '#7cb342', secondary: '#aed581' },
  ocean: { primary: '#4fc3f7', secondary: '#81d4fa' },
  sunset: { primary: '#ff8a65', secondary: '#ffab91' },
  contrast: { primary: '#00ff00', secondary: '#00ffff' },
};

export default function ThemePicker() {
  const { currentTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all"
        style={{
          borderColor: 'var(--code-border)',
          background: 'var(--bg-card)',
        }}
        title="切换主题"
      >
        <div className="flex gap-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: themePreview[currentTheme].primary }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: themePreview[currentTheme].secondary }}
          />
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-secondary)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Theme palette */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-full mt-2 right-0 p-2 rounded-lg border shadow-lg z-50 min-w-[220px]"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--code-border)',
            }}
          >
            <div className="space-y-1">
              {themes.map((theme) => {
                const isActive = currentTheme === theme.id;
                const preview = themePreview[theme.id];

                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-left"
                    style={{
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      borderLeft: isActive ? `3px solid ${preview.primary}` : '3px solid transparent',
                    }}
                  >
                    {/* Color preview circles */}
                    <div className="flex gap-1 shrink-0">
                      <div
                        className="w-4 h-4 rounded-full ring-1 ring-white/20"
                        style={{ background: preview.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full ring-1 ring-white/20"
                        style={{ background: preview.secondary }}
                      />
                    </div>

                    {/* Theme info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {theme.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {theme.description}
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="active-theme"
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: preview.primary }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
