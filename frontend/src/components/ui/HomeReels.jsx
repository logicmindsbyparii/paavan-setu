import React, { useRef } from 'react';
import { gsap, useRevealAnimation } from '../../lib/motion';
import SectionEyebrow from './SectionEyebrow';
import { brand, GRAIN } from '../../constants/brand';

/**
 * Homepage Reels Integration
 * 
 * Premium display of playable Instagram reels. Uses a clean bento-style horizontal layout.
 * We load the official Instagram embed script dynamically.
 */

const REELS = [
  { id: 'C9_ABCDEFG', url: 'https://www.instagram.com/reel/C7-X5zTtcLg/' },
  { id: 'C9_HIJKLMN', url: 'https://www.instagram.com/reel/C8-Y5zTtcLg/' },
  { id: 'C9_OPQRSTU', url: 'https://www.instagram.com/reel/C9-Z5zTtcLg/' },
];

export default function HomeReels({ title = "Stories in Motion", description = "Glimpses of character building, classroom insights, and daily inspiration from our community." }) {
  const containerRef = useRef(null);

  // We use direct iframes for the Instagram reels to prevent Facebook's embed.js 
  // from causing React StrictMode conflicts, Permissions-Policy violations, and console errors.

  const scope = useRevealAnimation(
    () => {
      gsap.fromTo(
        '.hr-card',
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.hr-grid', start: 'top 85%', once: true },
        }
      );
    },
    [],
    ['.hr-card']
  );

  return (
    <section
      ref={scope}
      className="relative px-6 py-24 md:py-32 overflow-hidden"
      style={{ backgroundColor: brand.ivory }}
    >
      {/* Background Layer */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-x-0 top-0 h-64" style={{ background: `linear-gradient(180deg, rgba(233,200,92,0.1) 0%, transparent 100%)` }} />
      </div>

      <div className="mx-auto max-w-7xl" ref={containerRef}>
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 items-end gap-6 md:mb-20 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <SectionEyebrow>Follow Our Journey</SectionEyebrow>
            <h2
              className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.1] tracking-[-0.015em]"
              style={{ color: brand.ink }}
            >
              {title}
            </h2>
          </div>
          <div className="md:col-span-5 flex flex-col md:items-end md:pb-2">
            <p className="text-base leading-[1.75] md:text-lg mb-4 md:text-right" style={{ color: brand.ash }}>
              {description}
            </p>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] transition-transform hover:translate-x-1"
              style={{ color: brand.green }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              @paavansetu
            </a>
          </div>
        </div>

        {/* Reels Grid */}
        <div className="hr-grid flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 scrollbar-hide">
          {REELS.map((reel, i) => (
            <div 
              key={i} 
              className="hr-card relative min-w-[300px] flex-shrink-0 snap-center md:min-w-0 rounded-[2rem] overflow-hidden"
              style={{ 
                boxShadow: '0 20px 40px -15px rgba(15,35,23,0.1)',
                background: '#ffffff'
              }}
            >
              <div className="w-full h-full flex justify-center items-center overflow-hidden bg-white">
                <iframe 
                  src={`${reel.url}embed`}
                  width="100%" 
                  height="480" 
                  frameBorder="0" 
                  scrolling="no" 
                  allowTransparency="true"
                  title={`Instagram Reel ${i}`}
                  style={{ background: '#FFF' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
