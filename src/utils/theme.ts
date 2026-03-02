// utils/theme.ts

export type AppTheme = {
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
};

export const Theme: {
    light: AppTheme;
    dark: AppTheme;
    primary: string;
    danger: string;
    success: string;
} = {
    light: {
        background: '#f1f5f9',
        card: '#ffffff',
        elevated: '#f8fafc',
        text: '#0f172a',
        subText: '#64748b',
        border: '#e2e8f0',
        inputBg: '#ffffff',
        placeholder: '#94a3b8',
        chipInactive: '#e2e8f0',
        chipTextInactive: '#475569',
    },

    dark: {
        background: '#0b1120',       // deeper base
        card: '#111827',             // main surface
        elevated: '#1f2937',         // raised surface
        text: '#f9fafb',             // soft white
        subText: '#9ca3af',          // muted gray
        border: '#1f2937',
        inputBg: '#1f2937',
        placeholder: '#6b7280',
        chipInactive: '#1f2937',
        chipTextInactive: '#d1d5db',
    },

    primary: '#3b82f6',
    danger: '#ef4444',
    success: '#22c55e',
};