import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../utils/theme';

// ... (keep your lightenColor and darkenColor functions here)
const lightenColor = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) + Math.round(255 * (percent / 100))));
  const g = Math.min(255, (((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100))));
  const b = Math.min(255, ((num & 0x0000ff) + Math.round(255 * (percent / 100))));
  return `rgb(${r}, ${g}, ${b})`;
};
const darkenColor = (hex: string, percent: number) => {
  // Remove the hash if it exists and parse to an integer
  const num = parseInt(hex.replace('#', ''), 16);

  // Calculate how much to subtract (0-255 based on percentage)
  const amount = Math.round(255 * (percent / 100));

  // Extract R, G, B and subtract the amount, ensuring we don't go below 0
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);

  return `rgb(${r}, ${g}, ${b})`;
};
type Colors = {
  background: string; card: string; elevated: string; text: string;
  subText: string; border: string; inputBg: string; placeholder: string;
  chipInactive: string; chipTextInactive: string; primary: string;
  primaryLight: string; primaryDark: string; secondary: string;
  success: string; danger: string; dropzone: string;
};

type ThemeContextType = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  colors: Colors;
  refreshTheme: () => Promise<void>; // Added this
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setDarkMode] = useState(true);
  const [dynamicPrimary, setDynamicPrimary] = useState(Theme.primary);
  const [dynamicSecondary, setDynamicSecondary] = useState(Theme.secondary);

  const [colors, setColors] = useState<Colors>({
    ...Theme.light,
    primary: Theme.primary,
    primaryLight: lightenColor(Theme.primary, 90),
    primaryDark: darkenColor(Theme.primary, 50),
    secondary: Theme.secondary,
    success: Theme.success,
    danger: Theme.danger,
    dropzone: "#f3f4f6"
  });

  // Function to load colors from Storage
  const loadThemeColors = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem("primary_color");
      const storedSecondary = await AsyncStorage.getItem("secondary_color");

      if (storedPrimary) setDynamicPrimary(storedPrimary);
      if (storedSecondary) setDynamicSecondary(storedSecondary);
    } catch (e) {
      console.log("Error loading theme", e);
    }
  };

  // Initial load
  useEffect(() => {
    loadThemeColors();
  }, []);

  // Update colors whenever DarkMode OR Dynamic colors change
  useEffect(() => {
    const base = isDarkMode ? Theme.dark : Theme.light;
    setColors({
      ...base,
      primary: dynamicPrimary,
      primaryLight: lightenColor(dynamicPrimary, 90),
      primaryDark: darkenColor(dynamicPrimary, 50),
      secondary: dynamicSecondary,
      success: Theme.success,
      danger: Theme.danger,
    });
  }, [isDarkMode, dynamicPrimary, dynamicSecondary]);

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      setDarkMode,
      colors,
      refreshTheme: loadThemeColors // Exposed to trigger updates
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};