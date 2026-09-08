import React from 'react';
import SunGlyph from './SunGlyph';
import { brand } from '../../constants/brand';

/**
 * The label above a section heading: the logo's sun, then a line of tracked
 * micro-caps.
 *
 * Every homepage section opens with this, so the marker above each heading is
 * always the same object at the same size. That repetition is the whole point —
 * before it, each section invented its own centred header and the page read as
 * five unrelated templates stacked up.
 *
 * @param {string} [color] Label colour. Green on paper, `goldLight` on the dark
 *   field — never gold on light, which measures 3.5:1 (see constants/brand.js).
 * @param {string} [glyphColor] Sun colour, if it should differ from the default
 *   deep gold — the dark field wants the pale one.
 */
export default function SectionEyebrow({ children, color = brand.green, glyphColor, className = '' }) {
  return (
    <p className={`flex items-center gap-2.5 ${className}`}>
      <SunGlyph className="h-4 w-4 shrink-0" color={glyphColor || brand.goldDeep} />
      <span
        className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] sm:text-[0.76rem] sm:tracking-[0.2em]"
        style={{ color }}
      >
        {children}
      </span>
    </p>
  );
}
