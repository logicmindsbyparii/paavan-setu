/**
 * Paavan Setu — MUI Theme (v2 Premium)
 *
 * Clean, intentional overrides only. No global hover transforms.
 * No excessive shadow array. Pure brand alignment.
 */
import { createTheme } from '@mui/material/styles';
import { colors } from '../constants/tokens';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: colors.green, light: colors.greenLight, dark: colors.greenDark, contrastText: colors.white },
    secondary: { main: colors.blue, light: colors.blueLight, dark: colors.blueDark, contrastText: colors.white },
    background: { default: colors.paper, paper: colors.white },
    text:       { primary: colors.ink, secondary: colors.ash },
    error:      { main: colors.error },
    success:    { main: colors.success },
    divider:    colors.divider,
  },
  typography: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    h1: { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1 },
    h2: { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.15 },
    h3: { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.2 },
    h4: { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, letterSpacing: '-0.005em', lineHeight: 1.25 },
    h5: { fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, letterSpacing: '-0.005em' },
    h6: { fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600 },
    body1: { fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.7, fontSize: '1rem' },
    body2: { fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.6, fontSize: '0.875rem' },
    button: { fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(17,29,17,0.04)',
    '0 2px 8px rgba(17,29,17,0.06)',
    '0 4px 16px rgba(17,29,17,0.08)',
    '0 6px 24px rgba(17,29,17,0.10)',
    '0 8px 32px rgba(17,29,17,0.10)',
    '0 12px 40px rgba(17,29,17,0.12)',
    '0 16px 48px rgba(17,29,17,0.12)',
    '0 20px 56px rgba(17,29,17,0.14)',
    '0 24px 64px rgba(17,29,17,0.14)',
    '0 28px 72px rgba(17,29,17,0.16)',
    '0 32px 80px rgba(17,29,17,0.16)',
    '0 36px 88px rgba(17,29,17,0.18)',
    '0 40px 96px rgba(17,29,17,0.18)',
    '0 44px 104px rgba(17,29,17,0.20)',
    '0 48px 112px rgba(17,29,17,0.20)',
    '0 52px 120px rgba(17,29,17,0.22)',
    '0 56px 128px rgba(17,29,17,0.22)',
    '0 60px 136px rgba(17,29,17,0.24)',
    '0 64px 144px rgba(17,29,17,0.24)',
    '0 68px 152px rgba(17,29,17,0.26)',
    '0 72px 160px rgba(17,29,17,0.26)',
    '0 76px 168px rgba(17,29,17,0.28)',
    '0 80px 176px rgba(17,29,17,0.28)',
    '0 84px 184px rgba(17,29,17,0.30)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        html: { scrollBehavior: 'smooth', overflowX: 'clip' },
        body: { overflowX: 'clip', background: colors.paper },
        h1: { textWrap: 'balance' },
        h2: { textWrap: 'balance' },
        h3: { textWrap: 'balance' },
        p: { textWrap: 'pretty' },
        ':focus-visible': { outline: `2px solid ${colors.green}`, outlineOffset: '2px', borderRadius: '4px' },
        ':focus:not(:focus-visible)': { outline: 'none' },
        '@media (prefers-reduced-motion: reduce)': {
          '*': { animationDuration: '0.01ms !important', animationIterationCount: '1 !important', transitionDuration: '0.01ms !important' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 50, padding: '10px 28px', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 16px rgba(10,79,34,0.25)' } },
        outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, border: `1px solid ${colors.divider}`, boxShadow: '0 2px 8px rgba(17,29,17,0.04)', transition: 'box-shadow 0.3s, border-color 0.3s' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 50, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } },
      },
    },
  },
});

export default theme;
