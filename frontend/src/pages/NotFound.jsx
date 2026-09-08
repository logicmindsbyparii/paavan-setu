import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { colors } from '../constants/tokens';
import HomeIcon from '@mui/icons-material/Home';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function NotFound() {
  const scopeRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      gsap.set('.nf-anim', { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.nf-anim',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={scopeRef}
      className="min-h-dvh flex items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: colors.snow }}
    >
      {/* Subtle background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 30%, ${colors.greenMid}20, transparent 50%), radial-gradient(circle at 80% 70%, ${colors.blueMid}20, transparent 50%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center max-w-lg">
        <p
          className="nf-anim font-['DM_Serif_Display',Georgia,serif] font-bold leading-none"
          style={{
            fontSize: 'clamp(5rem, 15vw, 9rem)',
            background: `linear-gradient(135deg, ${colors.green}, ${colors.blue})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          aria-hidden="true"
        >
          404
        </p>

        <h1
          className="nf-anim font-['DM_Serif_Display',Georgia,serif] text-2xl md:text-3xl mb-4"
          style={{ color: colors.ink }}
        >
          The page you&apos;re looking for isn&apos;t here
        </h1>

        <p
          className="nf-anim text-base md:text-lg mb-10 leading-relaxed"
          style={{ color: colors.ash }}
        >
          It may have moved, been renamed, or never existed. Let&apos;s guide you back.
        </p>

        <div className="nf-anim flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
            style={{ backgroundColor: colors.green }}
          >
            <HomeIcon fontSize="small" />
            Back to Home
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold border-2 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
            style={{ borderColor: colors.green, color: colors.green }}
          >
            Contact Us
            <ArrowForwardIcon fontSize="small" />
          </Link>
        </div>
      </div>
    </div>
  );
}
