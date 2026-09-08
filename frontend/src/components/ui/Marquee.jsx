import React from 'react';
import { cn } from './BentoGrid';

/**
 * Infinite horizontal/vertical ticker.
 *
 * The duplicated copies exist only to make the loop seamless, so they are
 * hidden from assistive tech — a screen reader would otherwise read the same
 * testimonials four times over.
 */
export const Marquee = ({
  className,
  reverse,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}) => {
  return (
    <div
      {...props}
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        // Constant motion is a vestibular trigger; under reduced-motion the
        // track stops and becomes a normal scrollable strip instead.
        'motion-reduce:overflow-x-auto',
        {
          'flex-row': !vertical,
          'flex-col': vertical,
        },
        className
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 ? 'true' : undefined}
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
            'animate-marquee flex-row': !vertical,
            'animate-marquee-vertical flex-col': vertical,
            'group-hover:[animation-play-state:paused]': pauseOnHover,
            // Keyboard users get the same pause as mouse users.
            'group-focus-within:[animation-play-state:paused]': pauseOnHover,
            '[animation-direction:reverse]': reverse,
            'motion-reduce:animate-none': true,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
};
