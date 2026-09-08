import React, { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroller({ children }) {
  useEffect(() => {
    let lenis = null;
    let rafId = null;

    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        if (lenis) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
      }

      rafId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis smooth scroller failed to initialize:', e);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (lenis) {
        try {
          lenis.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        lenis = null;
      }
    };
  }, []);

  return <>{children}</>;
}

