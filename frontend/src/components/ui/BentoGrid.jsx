import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        // `auto-rows-min` on mobile lets a single-column card size to its content;
        // a fixed 20rem row clipped longer descriptions on narrow screens.
        'grid w-full auto-rows-min md:auto-rows-[20rem] grid-cols-1 md:grid-cols-12 gap-3 max-w-7xl mx-auto',
        // `grid-flow-dense` backfills the gaps left by the tall feature tile.
        'grid-flow-dense',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * @param {'light'|'dark'} [tone] Surface brightness. Drives text colour so a card
 *   sitting on a dark gradient does not render near-black copy on near-black paint.
 * @param {string} [href] Renders the card as a link when the tile is navigable.
 */
export const BentoCard = ({
  className,
  title,
  description,
  header,
  icon,
  children,
  style,
  tone = 'light',
  href,
  ...rest
}) => {
  const dark = tone === 'dark';
  const Wrapper = href ? Link : 'div';

  return (
    <Wrapper
      {...(href ? { to: href } : {})}
      className={cn(
        'row-span-1 rounded-3xl group/bento transition duration-500 ease-out p-4',
        'border border-black/[0.04] justify-between flex flex-col space-y-4 overflow-hidden relative',
        'no-underline',
        dark ? 'text-white' : 'bg-white text-ink',
        href &&
          'cursor-pointer hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green',
        className
      )}
      style={style}
      {...rest}
    >
      {/* Hover wash — light on light surfaces, a white veil on dark ones. */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover/bento:opacity-100 transition duration-500 pointer-events-none',
          dark
            ? 'bg-gradient-to-t from-white/10 to-transparent'
            : 'bg-gradient-to-t from-black/[0.04] to-transparent'
        )}
        aria-hidden="true"
      />
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-500 z-10">
        {icon}
        <div className={cn('font-heading text-lg font-semibold mb-2', icon && 'mt-3')}>
          {title}
        </div>
        {/* text-ash lands at 4.47:1 on the blue tint — just under AA — so light
            cards use the darker slate for body copy. */}
        <div className={cn('font-body text-sm leading-relaxed', dark ? 'text-white/85' : 'text-slate')}>
          {description}
        </div>
        {children}
      </div>
    </Wrapper>
  );
};
