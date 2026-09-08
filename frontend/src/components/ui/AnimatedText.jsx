import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/motion';
import { cn } from './BentoGrid';

/**
 * Heading that fades in word by word as it scrolls into view.
 *
 * Renders a real heading element so the text still lands in the document
 * outline — `as` lets the caller pick the right level for its section.
 */
export const AnimatedText = ({ text, className, id, as: Tag = 'h2' }) => {
  const textRef = useRef(null);
  const words = useMemo(() => String(text ?? '').split(/\s+/).filter(Boolean), [text]);

  useLayoutEffect(() => {
    const root = textRef.current;
    if (!root) return undefined;

    const targets = root.querySelectorAll('.word');
    if (!targets.length) return undefined;

    // GSAP does not observe prefers-reduced-motion, and the words start at
    // opacity 0.1 — without this they would stay unreadable.
    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1 });
      return undefined;
    }

    // Scoped to this element: reverting the context kills only the triggers
    // created here, unlike ScrollTrigger.getAll().kill() which used to wipe out
    // every other animation on the page.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top 85%',
            end: 'bottom 60%',
            scrub: true,
          },
        }
      );
    }, root);

    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refresh);
      ctx.revert();
    };
  }, [words]);

  return (
    <Tag
      id={id}
      ref={textRef}
      className={cn('font-heading font-semibold text-4xl leading-snug text-ink', className)}
    >
      {/* The gap between words is a real text node, not a right margin. A margin
          looks identical but leaves no whitespace in the DOM, so the heading is
          announced — and copied — as one run-on word ("MissionVision"). */}
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span className="word inline-block">{word}</span>
          {index < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
};
