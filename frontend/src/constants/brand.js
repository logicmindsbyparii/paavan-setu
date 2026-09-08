/**
 * Paavan Setu — brand surface palette, sampled from logo_final.png.
 *
 * This is deliberately *not* a second design system alongside `tokens.js`.
 * `tokens.js` holds the product palette used by forms, admin, book cards and
 * every functional surface. This file holds the six colours the homepage hero
 * was built from, which until now lived as private constants inside
 * `HomeHero.jsx` — which is exactly why the hero looked like one site and
 * everything below it looked like another. The sections import from here so the
 * whole page speaks in the logo's own colours.
 *
 * Measured contrast on `ivory` (#fdfaf3):
 *   ink   15.6:1   green 7.8:1   ash 7.2:1        → all safe for body copy
 *   goldDeep 3.5:1                                → large text / graphics only
 *
 * Measured contrast on the field, at its lightest stop (`blue`):
 *   white 5.8:1   white@86% 4.8:1   goldLight 4.7:1 → safe for body copy
 *   gold  3.6:1                                     → large text / graphics only
 *
 * The rule that falls out of those numbers, and that the sections follow: gold
 * is a *graphic*, not a text colour. Eyebrow labels are green on light and
 * goldLight on dark; the sun glyphs, rules and swashes are the gold.
 */
export const brand = {
  /* The arc over the logotype, read left to right. */
  green: '#0a5c2c',
  teal: '#0d5a55', // where the arc's green crosses into its blue
  blue: '#1a6a9e',
  blueDeep: '#0e4870',

  /* The sun. */
  gold: '#e9c85c',
  goldLight: '#f7e6ae',
  goldDeep: '#a8801f',

  /* The paper. */
  ivory: '#fdfaf3',
  ivoryLit: '#fffdf8',
  ivoryDeep: '#f7f0e2',

  /* Type. */
  ink: '#0f2317',
  ash: '#47594c',
};

/**
 * The vertical traverse of the logo's arc, for any full-bleed dark surface.
 * Green at the top shoulder, teal at the crossing, blue at the foot.
 */
export const FIELD_GRADIENT =
  `linear-gradient(158deg, ${brand.green} 0%, ${brand.teal} 38%, ${brand.blue} 76%, ${brand.blueDeep} 100%)`;

/**
 * Warm paper. A gold wash low-left, the way the field's light spills onto the
 * ivory half of the hero — repeating it keeps consecutive light sections from
 * reading as flat unlit slabs.
 */
export const PAPER_GRADIENT =
  `radial-gradient(60% 50% at 8% 92%, rgba(233,200,92,0.18) 0%, rgba(233,200,92,0) 64%),` +
  `linear-gradient(172deg, ${brand.ivoryLit} 0%, ${brand.ivory} 52%, ${brand.ivoryDeep} 100%)`;

/**
 * Paper grain. One tiling feTurbulence tile — enough to stop a full viewport of
 * flat ivory from looking unstyled, at the cost of a 160px raster rather than an
 * image request.
 */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default brand;
