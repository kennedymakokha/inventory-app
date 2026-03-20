// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../utils/theme';

// Simple function to generate a lighter shade of a hex color
const lightenColor = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) + Math.round(255 * (percent / 100))));
  const g = Math.min(255, (((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100))));
  const b = Math.min(255, ((num & 0x0000ff) + Math.round(255 * (percent / 100))));
  return `rgb(${r}, ${g}, ${b})`;
};

type Colors = {
  background: string;
  card: string;
  elevated: string;
  text: string;
  subText: string;
  border: string;
  inputBg: string;
  placeholder: string;
  chipInactive: string;
  chipTextInactive: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  success: string;
  danger: string;
};

type ThemeContextType = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  colors: Colors;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setDarkMode: () => {},
  colors: {
    ...Theme.light,
    primary: Theme.primary,
    primaryLight: lightenColor(Theme.primary, 40),
    secondary: Theme.secondary,
    success: Theme.success,
    danger: Theme.danger,
  },
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setDarkMode] = useState(false);
  const [colors, setColors] = useState<Colors>({
    ...Theme.light,
    primary: Theme.primary,
    primaryLight: lightenColor(Theme.primary, 40),
    secondary: Theme.secondary,
    success: Theme.success,
    danger: Theme.danger,
  });

  useEffect(() => {
    const base = isDarkMode ? Theme.dark : Theme.light;
    setColors({
      ...base,
      primary: Theme.primary,
      primaryLight: lightenColor(Theme.primary, 40),
      secondary: Theme.secondary,
      success: Theme.success,
      danger: Theme.danger,
    });
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);