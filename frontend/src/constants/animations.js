/**
 * Paavan Setu — Shared CSS Keyframes & Utility Classes
 * 
 * This file replaces the duplicated CSS arrays in every page component.
 * Import and inject via <style>{SHARED_CSS}</style> once in App.jsx,
 * or use individual classes as needed.
 */

// Fonts are loaded from public/index.html with <link rel="preconnect"> so the
// browser can start fetching them during HTML parse. There used to be a second
// @import here for Playfair Display — a render-blocking request, discovered late
// because it lived inside a JS string, for a face nothing on the site uses
// (headings are DM Serif Display).

// ─── Base Reset ───────────────────────────────────────────────────────────────
const BASE_RESET = `*,*::before,*::after{box-sizing:border-box;}`;

// ─── Keyframe Animations ──────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes floatA {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    33% { transform: translate(12px,-18px) rotate(3deg); }
    66% { transform: translate(-8px,10px) rotate(-2deg); }
  }
  @keyframes floatB {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    33% { transform: translate(-14px,10px) rotate(-4deg); }
    66% { transform: translate(10px,-12px) rotate(2deg); }
  }
  @keyframes floatC {
    0%,100% { transform: translate(0,0); }
    50% { transform: translate(8px,-14px); }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulseRing {
    0%,100% { transform: scale(1); opacity: 0.45; }
    50% { transform: scale(1.08); opacity: 0.2; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerBar {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
  @keyframes shimmerBtn {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes twinkle {
    0%,100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
  @keyframes countTick {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Dot Grid Patterns ────────────────────────────────────────────────────────
const DOT_GRIDS = `
  .dot-grid-green {
    background-image: radial-gradient(circle, rgba(10,79,34,0.15) 1.5px, transparent 1.5px);
    background-size: 24px 24px;
  }
  .dot-grid-blue {
    background-image: radial-gradient(circle, rgba(23,74,114,0.12) 1.5px, transparent 1.5px);
    background-size: 20px 20px;
  }
`;

// ─── Wave Divider Styles ──────────────────────────────────────────────────────
const WAVE_STYLES = `
  .wave-divider {
    line-height: 0;
    overflow: hidden;
  }
  .wave-divider svg {
    display: block;
    width: 100%;
  }
`;

// ─── Card Hover Effects ───────────────────────────────────────────────────────
const CARD_HOVERS = `
  .card-hover {
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.3s;
  }
  .card-hover:hover {
    transform: translateY(-8px) rotate(-0.3deg);
    box-shadow: 0 24px 48px rgba(10,79,34,0.16) !important;
  }
  .card-hover::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #0a4f22, #174a72);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
    z-index: 2;
  }
  .card-hover:hover::before {
    transform: scaleX(1);
  }
`;

// ─── Icon Hover ───────────────────────────────────────────────────────────────
const ICON_HOVER = `
  .icon-hover {
    transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1);
    display: inline-flex;
  }
  .icon-hover-parent:hover .icon-hover {
    transform: scale(1.14) rotate(-6deg);
  }
`;

// ─── Page Font Family ─────────────────────────────────────────────────────────
const PAGE_FONT = `
  .page-root { font-family: 'DM Sans', sans-serif; }
`;

// ─── Export Combined CSS String ────────────────────────────────────────────────
export const SHARED_CSS = [
  BASE_RESET,
  PAGE_FONT,
  KEYFRAMES,
  DOT_GRIDS,
  WAVE_STYLES,
  CARD_HOVERS,
  ICON_HOVER,
].join('\n');

// ─── Export Individual Pieces ──────────────────────────────────────────────────
export {
  BASE_RESET,
  KEYFRAMES,
  DOT_GRIDS,
  WAVE_STYLES,
  CARD_HOVERS,
  ICON_HOVER,
  PAGE_FONT,
};
