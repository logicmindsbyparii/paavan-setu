import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../../lib/motion';
import { brand, GRAIN } from '../../constants/brand';
import SectionEyebrow from './SectionEyebrow';

/**
 * Shared layout for legal pages (Privacy, Terms).
 *
 * Sits on the same ivory paper the About and Contact pages open with — the
 * policy used to render as bare MUI prose on flat snow, the only public page
 * with no brand voice at all. Content remains one reading column; the heading
 * gets the page's usual treatment (eyebrow, serif title, gold swash) so the
 * route announces itself like every other inner page.
 *
 * @param {string} title   Page heading
 * @param {Array}  sections Array of { title: string, body: string[] }
 */
export default function LegalPage({ title, sections }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      gsap.set('.legal-anim', { opacity: 1, y: 0 });
      return undefined;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.legal-anim',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative isolate overflow-hidden"
      style={{
        background:
          'radial-gradient(54% 46% at 8% 92%, rgba(233,200,92,0.22) 0%, rgba(233,200,92,0) 62%),' +
          `linear-gradient(172deg, ${brand.ivoryLit} 0%, ${brand.ivory} 52%, ${brand.ivoryDeep} 100%)`,
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        {/* Header */}
        <header className="legal-anim text-center">
          <SectionEyebrow className="justify-center">The fine print</SectionEyebrow>

          <h1
            className="mt-6 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.08] tracking-[-0.015em]"
            style={{ color: brand.ink }}
          >
            {title}
          </h1>

          {/* Gold swash — one pass of a brush under the wordmark's italic. */}
          <svg aria-hidden="true" viewBox="0 0 300 20" preserveAspectRatio="none" className="mx-auto mt-5 h-[0.3em] w-[min(16rem,64%)]">
            <path d="M2 11 C 60 2, 150 1, 298 5 C 250 15, 120 19, 2 11 Z" fill={brand.gold} fillOpacity="0.85" />
          </svg>

          <p className="mt-7 text-sm font-medium tracking-wide" style={{ color: brand.ash }}>
            Last updated:{' '}
            {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
          </p>
        </header>

        {/* Body */}
        <div className="mt-14 space-y-12 md:mt-16">
          {sections.map((sec, i) => (
            <section key={sec.title || i} aria-labelledby={`legal-sec-${i}`} className="legal-anim">
              <div className="flex items-center gap-4">
                {/* Hairline + section index, the editorial detail legal pages
                    usually skip. */}
                <span
                  aria-hidden="true"
                  className="h-px w-8 shrink-0"
                  style={{ background: `linear-gradient(90deg, ${brand.goldDeep}, transparent)` }}
                />
                <span
                  className="text-[0.62rem] font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#8a5c0e' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h2
                id={`legal-sec-${i}`}
                className="mt-3 font-['DM_Serif_Display',Georgia,serif] text-[1.6rem] leading-snug sm:text-3xl"
                style={{ color: brand.green }}
              >
                {sec.title}
              </h2>
              <div className="mt-4 space-y-4">
                {sec.body.map((p, j) => (
                  <p key={j} className="text-[1.02rem] leading-[1.85]" style={{ color: brand.ash }}>
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Quiet return path — legal pages are a dead end otherwise. */}
        <div className="legal-anim mt-16 flex items-center justify-center gap-3 border-t pt-8" style={{ borderColor: 'rgba(168,128,31,0.25)' }}>
          <span className="h-px w-12" style={{ background: 'rgba(168,128,31,0.35)' }} />
          <Link
            to="/"
            className="px-3 py-2 text-sm font-semibold no-underline transition-colors duration-300"
            style={{ color: brand.green }}
            onMouseEnter={(e) => { e.currentTarget.style.color = brand.blue; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = brand.green; }}
          >
            Back to Home
          </Link>
          <span className="h-px w-12" style={{ background: 'rgba(168,128,31,0.35)' }} />
        </div>
      </div>
    </div>
  );
}
