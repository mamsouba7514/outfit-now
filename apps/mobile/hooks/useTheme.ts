import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

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

export type AppTheme = typeof lightTheme;

function parseISO(s: string): Date {
  return new Date(s);
}

function isDarkNow(sunrise: Date, sunset: Date): boolean {
  const now = new Date();
  return now < sunrise || now > sunset;
}

export function useTheme(): AppTheme & { toggle: () => void } {
  const [theme, setTheme] = useState<AppTheme>(lightTheme);
  const sunriseRef = useRef<Date | null>(null);
  const sunsetRef = useRef<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function applyTime() {
    if (!sunriseRef.current || !sunsetRef.current) return;
    setTheme(isDarkNow(sunriseRef.current, sunsetRef.current) ? darkTheme : lightTheme);
  }

  useEffect(() => {
    void fetchSunTimes();
    timerRef.current = setInterval(applyTime, 60_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function fetchSunTimes() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const { latitude, longitude } = loc.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&timezone=auto&forecast_days=1`,
      );
      const data = (await res.json()) as { daily: { sunrise: string[]; sunset: string[] } };
      sunriseRef.current = parseISO(data.daily.sunrise[0]);
      sunsetRef.current = parseISO(data.daily.sunset[0]);
      applyTime();
    } catch {
      // fallback: dark 20h-7h
      const now = new Date();
      const hour = now.getHours();
      setTheme(hour >= 20 || hour < 7 ? darkTheme : lightTheme);
    }
  }

  function toggle() {
    setTheme((t) => (t.dark ? lightTheme : darkTheme));
  }

  return { ...theme, toggle };
}
