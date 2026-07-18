import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'forest' | 'ocean' | 'sunset' | 'contrast';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
}

export const themes: Theme[] = [
  { id: 'forest', name: '森林', description: '护眼绿色主题' },
  { id: 'ocean', name: '海洋', description: '深邃蓝色主题' },
  { id: 'sunset', name: '晚霞', description: '温暖琥珀主题' },
  { id: 'contrast', name: '高对比', description: '无障碍访问' },
];

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'forest',
      setTheme: (theme) => {
        set({ currentTheme: theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      name: 'pydoc-theme',
    }
  )
);
