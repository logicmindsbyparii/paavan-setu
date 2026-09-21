import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
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
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: textRef,
    offset: ['top 85%', 'bottom 60%']
  });

  const MotionTag = motion[Tag] || motion.h2;

  return (
    <MotionTag
      id={id}
      ref={textRef}
      className={cn('font-heading font-semibold text-4xl leading-snug text-ink', className)}
    >
      {/* The gap between words is a real text node, not a right margin. A margin
          looks identical but leaves no whitespace in the DOM, so the heading is
          announced — and copied — as one run-on word ("MissionVision"). */}
      {words.map((word, index) => {
        // Calculate the opacity transform for each word individually
        const start = index / words.length;
        const end = start + (1 / words.length);
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
        
        return (
          <React.Fragment key={`${word}-${index}`}>
            <motion.span 
              className="word inline-block"
              style={{ opacity: reducedMotion ? 1 : opacity }}
            >
              {word}
            </motion.span>
            {index < words.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </MotionTag>
  );
};
