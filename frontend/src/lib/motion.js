/**
 * GSAP helpers.
 *
 * Two problems this file exists to solve:
 *
 * 1. `prefers-reduced-motion` is honoured in CSS (see index.css), but GSAP
 *    animates via JavaScript and ignores that media query entirely. Every entry
 *    animation has to check it explicitly.
 *
 * 2. Cleanup used to be `ScrollTrigger.getAll().forEach(t => t.kill())`, which
 *    kills *every* trigger on the page — including ones belonging to components
 *    that are still mounted. `gsap.context()` reverts only what the callback
 *    created, which is what we actually want.
 */
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** True when the visitor has asked the OS to minimise animation. */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Runs `setup` inside a gsap.context scoped to the returned ref, and reverts it
 * on unmount. Under reduced motion the callback is skipped and every element
 * carrying an entry class is snapped to its final state, so content that starts
 * at `opacity: 0` never stays invisible.
 *
 * @param {(ctx: {gsap: gsap, scope: HTMLElement}) => void} setup
 * @param {Array} [deps] Re-runs the context when these change.
 * @param {string[]} [revealSelectors] Selectors whose elements must be made
 *   visible when animation is suppressed.
 */
export function useRevealAnimation(setup, deps = [], revealSelectors = []) {
  const scope = useRef(null);
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return undefined;

    if (prefersReducedMotion()) {
      revealSelectors
        .flatMap((selector) => Array.from(root.querySelectorAll(selector)))
        .forEach((el) => gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'transform' }));
      return undefined;
    }

    const ctx = gsap.context(() => setupRef.current({ gsap, scope: root }), root);

    // Sections above the fold can be measured before webfonts and images settle,
    // which leaves triggers firing at the wrong scroll offset.
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());

    let resizeObserver;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      cancelAnimationFrame(refresh);
      if (resizeObserver) resizeObserver.disconnect();
      ctx.revert();
    };
    // `deps` is the caller's dependency list, forwarded verbatim.
  }, deps);

  return scope;
}

export { gsap, ScrollTrigger };
