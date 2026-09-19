
const originalTheme = {
  primary: '#33135C',
  primaryDark: '#1E0A3C',
  accent: '#A78BFA',
  surface: '#ffffff',
  background: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  success: '#8B5CF6',
  error: '#EF4444',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  muted: '#F1F5F9',
};


const goldenTheme = {
  primary: '#F9C935',
  primaryDark: '#D4A520',
  accent: '#FCD34D',
  surface: '#ffffff',
  background: '#FFFBEB',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#FDE68A',
  success: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  infoLight: '#FEF3C7',
  muted: '#F1F5F9',
  // Opacity variants
  white60: 'rgba(255,255,255,0.6)',
  white80: 'rgba(255,255,255,0.8)',
  white90: 'rgba(255,255,255,0.9)',
  white20: 'rgba(255,255,255,0.2)',
  white15: 'rgba(255,255,255,0.15)',
  white25: 'rgba(255,255,255,0.25)',
  white40: 'rgba(255,255,255,0.4)',
  white95: 'rgba(255,255,255,0.95)',
  black60: 'rgba(0,0,0,0.6)',
  black45: 'rgba(0,0,0,0.45)',
  black30: 'rgba(0,0,0,0.3)',
  black50: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
};



const CURRENT_THEME = 'golden';

const themes = {
  original: originalTheme,
  golden: goldenTheme,
};

export const Theme = themes[CURRENT_THEME as keyof typeof themes] || themes.original;
