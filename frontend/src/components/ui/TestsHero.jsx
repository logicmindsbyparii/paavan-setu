import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import { motion, useSpring, useTransform, useMotionValue, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

const FLOATING_BADGES = [
  { title: 'DMIT Biometric', score: '99.4% Match', color: '#34d399', Icon: AssignmentTurnedInIcon, top: '15%', left: '5%' },
  { title: 'Career Aptitude', score: '5 Core Domains', color: '#60a5fa', Icon: ArticleIcon, top: '65%', left: '10%' },
  { title: 'Personality Vector', score: 'Behavioral Fit', color: '#fbbf24', Icon: PsychologyIcon, top: '25%', right: '5%' },
];

export default function TestsHero() {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 60, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 60, damping: 18 });

  function onMouseMove(e) {
    if (prefersReducedMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      ref={heroRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative w-full overflow-hidden min-h-[92dvh] flex items-center pt-28 pb-16 text-white isolate"
      style={{
        background:
          'radial-gradient(120% 90% at 85% 15%, rgba(52,211,153,0.18) 0%, transparent 55%),' +
          'radial-gradient(100% 80% at 15% 85%, rgba(232,184,109,0.15) 0%, transparent 60%),' +
          'linear-gradient(162deg, #031208 0%, #062b18 45%, #08283e 100%)',
      }}
    >
      {/* ─── AMBIENT ATMOSPHERE ─── */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div
          animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={prefersReducedMotion ? {} : { scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)' }}
        />

        {/* Matrix Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '90px 90px',
            maskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#fdfaf3]" />
      </div>

      {/* ─── FOREGROUND CONTENT ─── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Hero Text */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="lg:col-span-7 text-center lg:text-left"
        >
          <h1 className="font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.6rem,5.5vw,5.2rem)] leading-[1.04] tracking-[-0.02em] text-white">
            Discover Your <br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#f7e6bd] via-[#e8b86d] to-[#34d399]">
              True Cognitive Potential
            </span>
          </h1>

          <p className="mt-7 text-lg sm:text-xl text-white/75 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Scientifically validated psychometric & biometric instruments designed to map innate cognitive traits, learning speeds, and ideal academic pathways.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
            <button
              onClick={() => {
                document.getElementById('pt-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full px-10 py-4 text-base font-bold text-[#051a0d] shadow-[0_16px_40px_-12px_rgba(232,184,109,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-10px_rgba(232,184,109,0.85)] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
              <AutoAwesomeIcon fontSize="small" />
              Explore Assessments
              <ArrowForwardIcon fontSize="small" className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <Link
              to="/career-counselling"
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/40 active:scale-[0.98]"
            >
              <PsychologyIcon fontSize="small" className="text-emerald-400" />
              <span>Talk to a Counsellor</span>
            </Link>
          </div>

          {/* Trust Metrics */}
          <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
            <div>
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-[#f7e6ae]">5+ Core</p>
              <p className="text-xs text-white/60 font-medium mt-1">Specialized Tests</p>
            </div>
            <div>
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-emerald-400">100%</p>
              <p className="text-xs text-white/60 font-medium mt-1">Confidential</p>
            </div>
            <div>
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-sky-400">Instant</p>
              <p className="text-xs text-white/60 font-medium mt-1">Detailed Report</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: 3D Interactive Cards Stage */}
        <div className="lg:col-span-5 relative hidden md:block" style={{ perspective: 1200 }}>
          <motion.div
            style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
            className="relative mx-auto aspect-[4/5] w-full max-w-[420px] select-none"
          >
            {/* Center Hologram Glow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full bg-gradient-to-tr from-emerald-500/30 via-amber-400/30 to-blue-500/30 blur-3xl animate-pulse" />

            {/* Orbit Ring */}
            <motion.div
              animate={prefersReducedMotion ? {} : { rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-[-8%] rounded-full border border-dashed border-emerald-400/30"
            />

            {/* Floating Glass Badges */}
            {FLOATING_BADGES.map((b, i) => {
              const Icon = b.Icon;
              return (
                <motion.div
                  key={b.title}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.2, ease: EASE }}
                  whileHover={{ scale: 1.06, zIndex: 40 }}
                  className="absolute p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[220px]"
                  style={{
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    transform: `translateZ(${(3 - i) * 30}px)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10" style={{ color: b.color }}>
                      <Icon fontSize="small" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white tracking-wide">{b.title}</p>
                      <p className="text-[0.72rem] font-semibold text-[#f7e6ae]">{b.score}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
