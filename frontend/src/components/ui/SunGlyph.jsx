import React from 'react';
import { brand } from '../../constants/brand';

/**
 * The logo's sunburst — a disc inside a ring of tapered rays — at eyebrow scale.
 *
 * Lifted out of `HomeHero` so the sections below the fold can carry the same
 * mark. It is the one piece of brand shorthand small enough to sit beside a
 * line of type, which is what makes it the section marker instead of the
 * hairline rule it replaces.
 *
 * Always decorative: every caller pairs it with a visible text label, so a
 * second accessible name here would just make the label read twice.
 *
 * @param {string} [color] Ray/disc fill. Gold is a graphic colour, never a text
 *   colour — `goldDeep` on ivory measures 3.5:1, fine for a mark and not for a
 *   label. Callers on the dark field pass `goldLight`.
 */
export default function SunGlyph({ className = '', color = brand.goldDeep }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none">
      <circle cx="12" cy="12" r="4.2" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="12"
          y1="6.6"
          x2="12"
          y2="3"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  );
}
