// Original Theme (Default - Purple)
export const originalTheme = {
  name: 'original' as const,
  primary: '#33135C',          // Exact Dark Purple
  primaryDark: '#1E0A3C',      // Deeper Purple for gradients
  accent: '#A78BFA',           // Soft Violet / Lavender accent
  surface: '#ffffff',          // White
  background: '#F8FAFC',       // Clean light slate background
  textPrimary: '#020202ff',    // Dark slate text
  textSecondary: '#475569',     // Medium slate text
  border: '#E2E8F0',           // Light slate border
  success: '#8B5CF6',          // Vibrant Violet
  error: '#EF4444',            // Red
  info: '#3B82F6',             // Blue
  infoLight: '#EFF6FF',        // Light Blue Background
  muted: '#F1F5F9',            // Light Grey Background
  
  // Dynamic Header & Component Theme Tokens
  headerText: '#ffffff',
  headerTextSecondary: 'rgba(255, 255, 255, 0.7)',
  headerIcon: '#ffffff',
  headerIconBg: 'rgba(255, 255, 255, 0.2)',
  timePillBg: '#F1F5F9',
  timePillText: '#000000',
  homeBanner: require('../assets/Header.png'),
};

// Golden Theme
export const goldenTheme = {
  name: 'golden' as const,
  primary: '#F9C935',          // Golden Yellow
  primaryDark: '#D4A520',      // Darker Golden
  accent: '#FCD34D',           // Light Yellow accent
  surface: '#ffffff',
  background: '#FFFBEB',       // Light yellow background
  textPrimary: '#000000ff',
  textSecondary: '#475569',
  border: '#FDE68A',
  success: '#F59E0B',          // Amber/Gold
  error: '#EF4444',
  info: '#3B82F6',
  infoLight: '#FEF3C7',
  muted: '#F1F5F9',
  
  // Dynamic Header & Component Theme Tokens
  headerText: '#000000',
  headerTextSecondary: 'rgba(0, 0, 0, 0.7)',
  headerIcon: '#000000',
  headerIconBg: '#F9C935',
  timePillBg: '#F1F5F9',
  timePillText: '#000000',
  homeBanner: require('../assets/Home.png'),
};

export type ThemeMode = 'original' | 'golden';

export interface ThemeType {
  name: ThemeMode;
  primary: string;
  primaryDark: string;
  accent: string;
  surface: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  info: string;
  infoLight: string;
  muted: string;
  headerText: string;
  headerTextSecondary: string;
  headerIcon: string;
  headerIconBg: string;
  timePillBg: string;
  timePillText: string;
  homeBanner: any;
}

export const themes: Record<ThemeMode, ThemeType> = {
  original: originalTheme,
  golden: goldenTheme,
};

let currentActiveMode: ThemeMode = 'golden';

export const setCurrentTheme = (mode: ThemeMode) => {
  currentActiveMode = mode;
};

export const getCurrentThemeMode = (): ThemeMode => currentActiveMode;

// Dynamic Proxy: Reads live directly from whichever theme is active
export const Theme: ThemeType = new Proxy({} as ThemeType, {
  get(_target, prop: string | symbol) {
    const active = themes[currentActiveMode] || goldenTheme;
    return (active as any)[prop];
  },
  set(_target, prop: string | symbol, value: any) {
    const active = themes[currentActiveMode] || goldenTheme;
    (active as any)[prop] = value;
    return true;
  },
});
