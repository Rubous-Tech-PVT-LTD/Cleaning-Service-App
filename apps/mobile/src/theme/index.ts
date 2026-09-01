// Original Theme (Default)
const originalTheme = {
  primary: '#33135C',      // Exact Dark Purple
  primaryDark: '#1E0A3C',  // Deeper Purple for gradients
  accent: '#A78BFA',       // Soft Violet / Lavender accent
  surface: '#ffffff',      // White
  background: '#F8FAFC',   // Clean light slate background
  textPrimary: '#0F172A',  // Dark slate text
  textSecondary: '#475569', // Medium slate text
  border: '#E2E8F0',       // Light slate border
  success: '#8B5CF6',      // Vibrant Violet
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue
  infoLight: '#EFF6FF',    // Light Blue Background
  muted: '#F1F5F9',        // Light Grey Background
};

// Golden Theme
const goldenTheme = {
  primary: '#F9C935',      // Golden Yellow
  primaryDark: '#D4A520',  // Darker Golden
  accent: '#FCD34D',       // Light Yellow accent
  surface: '#ffffff',
  background: '#FFFBEB',   // Light yellow background
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#FDE68A',
  success: '#F59E0B',      // Amber/Gold
  error: '#EF4444',
  info: '#3B82F6',
  infoLight: '#FEF3C7',
  muted: '#F1F5F9',
};

// Set this to switch themes temporarily
// Options: 'original', 'golden'
const CURRENT_THEME = 'golden'; // Change this to switch themes

const themes = {
  original: originalTheme,
  golden: goldenTheme,
};

export const Theme = themes[CURRENT_THEME as keyof typeof themes] || themes.original;
