import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type WeatherInfo = {
  tempC: number;
  description: string;
  note: string;
  emoji: string;
};

export type DailyForecast = {
  date: string;
  dayLabel: string;
  tempMax: number;
  tempMin: number;
  description: string;
  emoji: string;
};

const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Ciel dégagé', emoji: '☀️' },
  1: { label: 'Principalement dégagé', emoji: '🌤️' },
  2: { label: 'Partiellement nuageux', emoji: '⛅' },
  3: { label: 'Couvert', emoji: '☁️' },
  45: { label: 'Brouillard', emoji: '🌫️' },
  48: { label: 'Brouillard givrant', emoji: '🌫️' },
  51: { label: 'Bruine légère', emoji: '🌦️' },
  53: { label: 'Bruine modérée', emoji: '🌦️' },
  55: { label: 'Bruine dense', emoji: '🌧️' },
  61: { label: 'Pluie légère', emoji: '🌧️' },
  63: { label: 'Pluie modérée', emoji: '🌧️' },
  65: { label: 'Pluie forte', emoji: '🌧️' },
  71: { label: 'Neige légère', emoji: '🌨️' },
  73: { label: 'Neige modérée', emoji: '❄️' },
  75: { label: 'Neige forte', emoji: '❄️' },
  80: { label: 'Averses légères', emoji: '🌦️' },
  81: { label: 'Averses modérées', emoji: '🌧️' },
  82: { label: 'Averses violentes', emoji: '⛈️' },
  95: { label: 'Orage', emoji: '⛈️' },
  96: { label: 'Orage avec grêle', emoji: '⛈️' },
  99: { label: 'Orage violent', emoji: '⛈️' },
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function wmo(code: number) {
  return WMO_CODES[code] ?? { label: 'Temps variable', emoji: '🌡️' };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchWeather();
  }, []);

  async function fetchWeather() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const { latitude, longitude } = loc.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,weathercode` +
          `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
          `&timezone=auto&forecast_days=7`,
      );
      const data = (await res.json()) as {
        current: { temperature_2m: number; weathercode: number };
        daily: {
          time: string[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          weathercode: number[];
        };
      };

      const tempC = Math.round(data.current.temperature_2m);
      const { label, emoji } = wmo(data.current.weathercode);
      setWeather({ tempC, description: label, note: `${tempC}°C, ${label}`, emoji });

      const forecasts: DailyForecast[] = data.daily.time.map((dateStr, i) => {
        const d = new Date(dateStr);
        const { label: dl, emoji: de } = wmo(data.daily.weathercode[i]);
        return {
          date: dateStr,
          dayLabel: i === 0 ? 'Auj.' : DAY_LABELS[d.getDay()],
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          description: dl,
          emoji: de,
        };
      });
      setDaily(forecasts);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  return { weather, daily, loading, refetch: fetchWeather };
}
