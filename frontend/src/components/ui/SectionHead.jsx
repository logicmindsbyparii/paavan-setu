import React from 'react';
import SectionEyebrow from './SectionEyebrow';
import { brand } from '../../constants/brand';

/**
 * Section header in the brand's voice, shared by every inner page so they stop
 * inventing their own centred pill-labels and pastel headers.
 *
 * The anatomy is the homepage's: the logo's sun + tracked micro-caps above, a
 * DM Serif Display heading below, and — when an `accent` word is given — that
 * word set in italic brand green, the way the logo sets "Paavan Setu". No
 * gradient text, no pill, no hairline rules either side.
 *
 * @param {string}   eyebrow        Micro-caps label above the heading.
 * @param {string}   title          Heading text before the accent word.
 * @param {string}   [accent]       Optional trailing word, italic + coloured.
 * @param {string}   [accentColor]  Colour for the accent word (brand.green).
 * @param {string}   [lead]         Optional supporting paragraph.
 * @param {'left'|'center'} [align]
 * @param {string}   [size]         Pass a `text-[clamp(...)]` to override, or
 *                                  'default' / 'lg' presets.
 * @param {'h1'|'h2'|'h3'} [as]
 */
export default function SectionHead({
  eyebrow,
  eyebrowColor = brand.green,
  glyphColor,
  title,
  accent,
  accentColor = brand.green,
  lead,
  align = 'center',
  size = 'default',
  as: Tag = 'h2',
  id,
  className = '',
  eyebrowClassName = '',
}) {
  const preset =
    size === 'lg'
      ? 'text-[clamp(2.6rem,5.2vw,4.4rem)] leading-[1.06]'
      : 'text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.1]';

  return (
    <div
      className={`${
        align === 'center'
          ? 'flex flex-col items-center text-center'
          : 'flex flex-col items-start text-left'
      } ${className}`}
    >
      {eyebrow ? (
        <SectionEyebrow
          color={eyebrowColor}
          glyphColor={glyphColor}
          className={`${align === 'center' ? 'justify-center' : ''} ${eyebrowClassName}`}
        >
          {eyebrow}
        </SectionEyebrow>
      ) : null}

      <Tag
        id={id}
        className={`mt-4 font-['DM_Serif_Display',Georgia,serif] font-normal tracking-[-0.015em] ${preset}`}
        style={{ color: brand.ink }}
      >
        {title}
        {accent ? (
          <>
            {' '}
            <em className="italic" style={{ color: accentColor }}>
              {accent}
            </em>
          </>
        ) : null}
      </Tag>

      {lead ? (
        <p
          className={`mt-5 max-w-2xl text-base leading-[1.75] sm:text-lg ${
            align === 'center' ? 'mx-auto' : ''
          }`}
          style={{ color: brand.ash }}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
