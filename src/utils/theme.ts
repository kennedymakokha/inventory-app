export const Theme: {
    light: AppTheme;
    dark: AppTheme;
    primary: string;
    secondary: string;
    danger: string;
    success: string;
} = {
    light: {
        background: '#F8FAFC', // Pure Frost
        card: '#FFFFFF',
        elevated: '#F1F5F9',
        text: '#0F172A', // Slate 900
        subText: '#64748B', // Slate 500
        border: '#DBEAFE', // Subtle Blue tint
        inputBg: '#FFFFFF',
        placeholder: '#94A3B8',
        chipInactive: '#E2E8F0',
        chipTextInactive: '#475569',
    },

    dark: {

        background: '#0F172A', // Midnight Blue
        card: '#1E293B',       // Slate 800 (Richer blue surface)
        elevated: '#334155',   // Slate 700 (Lighter surface for layering)
        text: '#F1F5F9',       // Cloud White
        subText: '#94A3B8',    // Mist Grey
        border: '#1E3A8A',     // Deep Blue highlight
        inputBg: '#0F172A',    // Matching background for depth
        placeholder: '#475569',
        chipInactive: '#334155',
        chipTextInactive: '#CBD5E1'
    },

   primary: '#6366F1',   // Upgraded Indigo
  secondary: '#020617', // Richer Obsidian
  danger: '#F43F5E',    // Rose Red
  success: '#10B981',
};


// utils/theme.ts

import { lighten, darken, withOpacity } from "./colors";

export const createTheme = (primary: string, secondary: string) => {
    return {
        light: {
            dropzone: '#f1f5f9',
            background: lighten(secondary, 0.95),

            card: "#ffffff",
            elevated: lighten(primary, 0.92),

            text: darken(secondary, 0.8),
            subText: withOpacity(secondary, 0.6),

            border: withOpacity(primary, 0.2),
            inputBg: "#ffffff",

            placeholder: withOpacity(secondary, 0.4),

            chipInactive: lighten(primary, 0.85),
            chipTextInactive: darken(primary, 0.5),
        },

        dark: {
            dropzone: '#1e293b',
            background: darken(secondary, 0.4),
            card: darken(secondary, 0.2),
            elevated: darken(primary, 0.7),

            text: "#f9fafb",
            subText: withOpacity("#ffffff", 0.6),

            border: withOpacity(primary, 0.3),
            inputBg: darken(secondary, 0.1),

            placeholder: withOpacity("#ffffff", 0.4),

            chipInactive: darken(primary, 0.6),
            chipTextInactive: lighten(primary, 0.6),
        },

        primary,
        secondary,
        danger: "#ef4444",
        success: "#22c55e",
    };
};
