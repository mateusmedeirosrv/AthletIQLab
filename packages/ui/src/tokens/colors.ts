export const colors = {
  brand: {
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    accent: '#16A34A',
    accentLight: '#22C55E',
    accentDark: '#15803D',
    danger: '#DC2626',
    dangerLight: '#EF4444',
    warning: '#D97706',
    warningLight: '#F59E0B',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  semantic: {
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    focus: '#2563EB',
  },
} as const

export type Colors = typeof colors
