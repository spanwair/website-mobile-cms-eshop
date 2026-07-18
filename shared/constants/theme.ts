export const colors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  subtle: '#F1F3F5',
  border: '#E9ECEF',
  borderStrong: '#DEE2E6',
  text: '#212529',
  textMuted: '#6C757D',
  textPlaceholder: '#ADB5BD',
  accent: '#4F46E5',
  accentHover: '#4338CA',
  accentSecondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  bg: '#FFFFFF',
  bgCard: '#F8F9FA',
  primary: '#4F46E5',
  danger: '#EF4444',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
};

export const typography = {
  display:  { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  heading:  { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  title:    { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body:     { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption:  { fontSize: 13, fontWeight: '500' as const },
  micro:    { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
