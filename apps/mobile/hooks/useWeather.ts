import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type WeatherInfo = {
  tempC: number;
  description: string;
  note: string; // ready-to-use string for the brief
};

const WMO_CODES: Record<number, string> = {
  0: 'ciel dégagé', 1: 'principalement dégagé', 2: 'partiellement nuageux', 3: 'couvert',
  45: 'brouillard', 48: 'brouillard givrant',
  51: 'bruine légère', 53: 'bruine modérée', 55: 'bruine dense',
  61: 'pluie légère', 63: 'pluie modérée', 65: 'pluie forte',
  71: 'neige légère', 73: 'neige modérée', 75: 'neige forte',
  80: 'averses légères', 81: 'averses modérées', 82: 'averses violentes',
  95: 'orage', 96: 'orage avec grêle', 99: 'orage violent',
};

export function useWeather() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchWeather();
  }, []);

  async function fetchWeather() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const { latitude, longitude } = loc.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`,
      );
      const data = await res.json() as {
        current: { temperature_2m: number; weathercode: number };
      };

      const tempC = Math.round(data.current.temperature_2m);
      const description = WMO_CODES[data.current.weathercode] ?? 'temps variable';
      const note = `${tempC}°C, ${description}`;

      setWeather({ tempC, description, note });
    } catch {
      // silently ignore — weather is optional
    } finally {
      setLoading(false);
    }
  }

  return { weather, loading, refetch: fetchWeather };
}
