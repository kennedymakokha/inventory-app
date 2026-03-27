import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../utils/theme';

/* ---------------- COLOR HELPERS ---------------- */
const lightenColor = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) + Math.round(255 * (percent / 100))));
  const g = Math.min(255, (((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100))));
  const b = Math.min(255, ((num & 0x0000ff) + Math.round(255 * (percent / 100))));
  return `rgb(${r}, ${g}, ${b})`;
};

const darkenColor = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amount = Math.round(255 * (percent / 100));

  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);

  return `rgb(${r}, ${g}, ${b})`;
};

/* ---------------- TYPES ---------------- */
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
  primaryDark: string;
  secondary: string;
  success: string;
  danger: string;
  dropzone: string;
};

type ThemeContextType = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  colors: Colors;
  refreshTheme: () => Promise<void>;
  applyThemeDirectly: (primary: string, secondary: string) => void; // 🔥 optional fast path
};

/* ---------------- CONTEXT ---------------- */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setDarkMode] = useState(true);

  const [colors, setColors] = useState<Colors>(() => {
    const base = Theme.light;
    return {
      ...base,
      primary: Theme.primary,
      primaryLight: lightenColor(Theme.primary, 90),
      primaryDark: darkenColor(Theme.primary, 50),
      secondary: Theme.secondary,
      success: Theme.success,
      danger: Theme.danger,
      dropzone: "#f3f4f6"
    };
  });

  /* ---------------- CORE THEME BUILDER ---------------- */
  const buildTheme = (primary: string, secondary: string, dark: boolean): Colors => {
    const base = dark ? Theme.dark : Theme.light;

    return {
      ...base,
      primary,
      primaryLight: lightenColor(primary, 90),
      primaryDark: darkenColor(primary, 50),
      secondary,
      success: Theme.success,
      danger: Theme.danger,
      dropzone: "#f3f4f6"
    };
  };

  /* ---------------- REFRESH FROM STORAGE ---------------- */
  const refreshTheme = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem("primary_color");
      const storedSecondary = await AsyncStorage.getItem("secondary_color");

      const primary = storedPrimary || Theme.primary;
      const secondary = storedSecondary || Theme.secondary;

      const newTheme = buildTheme(primary, secondary, isDarkMode);

      console.log("🎨 Applying theme:", primary);

      setColors(newTheme); // 🔥 triggers UI update instantly

    } catch (e) {
      console.log("❌ Theme load error:", e);
    }
  };

  /* ---------------- DIRECT APPLY (SOCKET FAST PATH) ---------------- */
  const applyThemeDirectly = (primary: string, secondary: string) => {
    const newTheme = buildTheme(primary, secondary, isDarkMode);
    setColors(newTheme);

    // optional persistence
    AsyncStorage.multiSet([
      ["primary_color", primary],
      ["secondary_color", secondary]
    ]);

    console.log("⚡ Theme applied instantly:", primary);
  };

  /* ---------------- HANDLE DARK MODE ---------------- */
  useEffect(() => {
    refreshTheme();
  }, [isDarkMode]);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    refreshTheme();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        setDarkMode,
        colors,
        refreshTheme,
        applyThemeDirectly
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};