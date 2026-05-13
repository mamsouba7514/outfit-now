import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const THEME_KEY = '@outfit_now_theme';

export const lightTheme = {
  dark: false,
  colors: {
    background: '#ffffff',
    surface: '#f7fffe',
    surfaceAlt: '#f0f4f8',
    card: '#ffffff',
    textPrimary: '#0d1b2a',
    textSecondary: '#4a5568',
    textMuted: '#8a9ab0',
    border: '#e2e8f0',
    borderLight: '#f0f4f8',
    primaryBrand: '#00c4bf',
    inputBg: '#f7fffe',
    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',
    statusBar: 'dark-content' as const,
    overlay: 'rgba(13,27,42,0.04)',
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    background: '#0a0f1e',
    surface: '#111827',
    surfaceAlt: '#1a2332',
    card: '#111827',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#1e293b',
    borderLight: '#1e293b',
    primaryBrand: '#00c4bf',
    inputBg: '#111827',
    tabBar: '#0a0f1e',
    tabBarBorder: '#1e293b',
    statusBar: 'light-content' as const,
    overlay: 'rgba(0,196,191,0.06)',
  },
};

export type AppTheme = {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    primaryBrand: string;
    inputBg: string;
    tabBar: string;
    tabBarBorder: string;
    statusBar: 'dark-content' | 'light-content';
    overlay: string;
  };
};

export function useTheme(): AppTheme & { toggle: () => void } {
  const [theme, setTheme] = useState<AppTheme>(lightTheme);

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'dark') setTheme(darkTheme);
    });
  }, []);

  function toggle() {
    setTheme((current) => {
      const next = current.dark ? lightTheme : darkTheme;
      void AsyncStorage.setItem(THEME_KEY, next.dark ? 'dark' : 'light');
      return next;
    });
  }

  return { ...theme, toggle };
}
