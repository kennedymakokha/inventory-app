export const Theme: {
    light: AppTheme;
    dark: AppTheme;
    primary: string;
    secondary: string;
    danger: string;
    success: string;
} = {
    light: {
        background: '#f1f5f9',
        card: '#ffffff',
        elevated: '#f8fafc',

        // add slight blue influence
        text: '#0f172a',
        subText: '#64748b',

        border: '#dbeafe', // 👈 subtle blue tint
        inputBg: '#ffffff',

        placeholder: '#94a3b8',

        chipInactive: '#e2e8f0',
        chipTextInactive: '#475569',
    },

    dark: {
        background: '#0b1120',

        // mix in secondary (black) + primary (blue tone)
        card: '#0f172a',       // 👈 slightly bluer than before
        elevated: '#1e293b',   // 👈 richer surface with blue tint

        text: '#f9fafb',
        subText: '#9ca3af',

        border: '#1e3a8a',     // 👈 deep blue border hint
        inputBg: '#1f2937',

        placeholder: '#6b7280',

        chipInactive: '#1e293b',
        chipTextInactive: '#d1d5db',
    },

    primary: '#3b82f6',
    secondary: '#020617', // 👈 upgraded from pure black → richer black
    danger: '#ef4444',
    success: '#22c55e',
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
