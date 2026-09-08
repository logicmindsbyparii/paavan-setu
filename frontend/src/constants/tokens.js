/**
 * Paavan Setu — Design Tokens (v2 Premium)
 *
 * Single source of truth for the entire design system.
 * No MUI purple, no secondary orange. Pure brand identity.
 */

// ─── Color Palette ────────────────────────────────────────────────────────────
export const colors = {
  // Brand Greens
  green:      '#0a4f22',
  greenLight: '#c8e8d2',
  greenMid:   '#96cead',
  greenDark:  '#073a18',

  // Brand Blues
  blue:      '#174a72',
  blueLight: '#c4d9ec',
  blueMid:   '#90b8d8',
  blueDark:  '#0e3454',

  // Brand Ambers
  amber:      '#b06e10',
  amberLight: '#f5d9a0',
  amberMid:   '#e8b86d',

  // WhatsApp
  wa:      '#16a34a',
  waLight: '#bbf7d0',
  waMid:   '#6ee7a0',

  // Rose (used for the "For Parents" book accent)
  rose:      '#c0395a',
  roseLight: '#fde8f0',
  roseMid:   '#f5b8cc',

  // Neutrals
  white:       '#ffffff',
  offWhite:    '#fafdf8',
  snow:        '#eef6f0',
  cream:       '#f5ede0',
  parchment:   '#ece5d6',

  // Text
  ink:   '#111d11',
  slate: '#2d4a38',
  ash:   '#4d6357',
  muted: '#7a8f80',

  // Surfaces
  paper:     '#fafdf8',
  card:      '#ffffff',
  cardHover: '#f6faf7',
  divider:   'rgba(10,79,34,0.08)',

  // Semantic
  error:   '#c0395a',
  success: '#16a34a',
};

// The logo-sampled surface palette the homepage is built from lives in
// `constants/brand.js` — see the note at the top of that file for why it is a
// separate export rather than more keys in `colors`.

// ─── Typography ───────────────────────────────────────────────────────────────
export const fonts = {
  heading: "'DM Serif Display', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadows = {
  xs:   '0 1px 2px rgba(17,29,17,0.04)',
  sm:   '0 2px 8px rgba(17,29,17,0.06)',
  md:   '0 4px 16px rgba(17,29,17,0.08)',
  lg:   '0 8px 32px rgba(17,29,17,0.10)',
  xl:   '0 16px 48px rgba(17,29,17,0.12)',
  glow: '0 0 40px rgba(10,79,34,0.15)',
};
