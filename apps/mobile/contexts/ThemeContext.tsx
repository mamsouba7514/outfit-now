import { createContext, useContext } from 'react';

import { lightTheme, type AppTheme } from '../hooks/useTheme';

interface ThemeContextValue extends AppTheme {
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({ ...lightTheme, toggle: () => {} });

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
