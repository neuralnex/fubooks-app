/**
 * FUBOOKS theme — exact hex values per the provided design spec.
 * Light and dark mode color tokens, plus shared spacing/radius/typography scales.
 */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  // Derived/utility tokens not in the spec table but needed for real UI work:
  overlay: string;
  disabled: string;
}

export const lightTheme: ThemeColors = {
  primary: '#6C4CF1', // Deep Purple
  primaryHover: '#5A3EE0',
  secondary: '#2563EB', // Royal Blue
  background: '#FAFAFC', // Soft White
  surface: '#FFFFFF', // Pure White
  textPrimary: '#111827', // Rich Black
  textSecondary: '#6B7280', // Gray
  border: '#E5E7EB', // Light Gray
  success: '#10B981',
  error: '#EF4444',
  overlay: 'rgba(17, 24, 39, 0.5)',
  disabled: '#D1D5DB',
};

export const darkTheme: ThemeColors = {
  primary: '#8B5CF6', // Bright Purple
  primaryHover: '#7C3AED',
  secondary: '#60A5FA', // Sky Blue
  background: '#0B0F19', // Deep Black
  surface: '#161B22', // Dark Gray
  textPrimary: '#F9FAFB', // White
  textSecondary: '#9CA3AF', // Gray
  border: '#2D3748', // Dark Border
  success: '#34D399',
  error: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.6)',
  disabled: '#374151',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
};

export type ThemeMode = 'light' | 'dark';
