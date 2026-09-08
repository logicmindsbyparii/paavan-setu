import React, { useRef, useLayoutEffect, useMemo } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { gsap, prefersReducedMotion } from '../../lib/motion';

import bookRamayan from '../../assets/Ramayan2.jpeg';
import bookClassroom from '../../assets/krishna_classroom.jpeg';
import bookHanuman from '../../assets/Hanuman_chalisa2.jpeg';
import bookGanesha from '../../assets/Myfriendganesha2.jpeg';

const HERO_BOOKS = [
  {
    src: bookGanesha,
    className: 'left-[-5%] top-[10%] w-[35%] z-10',
    tilt: -15,
    depth: 0.5,
    float: 'bhFloat 6.5s ease-in-out infinite',
  },
  {
    src: bookClassroom,
    className: 'left-[15%] top-[5%] w-[42%] z-20',
    tilt: -8,
    depth: 0.8,
    float: 'bhFloat 7s ease-in-out infinite 0.5s',
  },
  {
    src: bookRamayan,
    className: 'left-[45%] top-[0%] w-[48%] z-30',
    tilt: 2,
    depth: 1.4,
    float: 'bhFloat 6s ease-in-out infinite 0.2s',
  },
  {
    src: bookHanuman,
    className: 'left-[70%] top-[18%] w-[38%] z-10',
    tilt: 12,
    depth: 0.6,
    float: 'bhFloat 8s ease-in-out infinite 1.2s',
  },
];

function MaskedWords({ text, className = '', style }) {
  const words = useMemo(() => String(text ?? '').split(/\s+/).filter(Boolean), [text]);
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom pb-[0.16em] -mb-[0.16em]">
            <span className={`bh-word opacity-0 inline-block will-change-transform ${className}`} style={style}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </>
  );
}

export default function BooksHero() {
  const root = useRef(null);
  const stage = useRef(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;

    const words = el.querySelectorAll('.bh-word');
    const fades = el.querySelectorAll('.bh-fade');
    const cards = el.querySelectorAll('.bh-card');
    const rule = el.querySelector('.bh-rule');

    if (prefersReducedMotion()) {
      gsap.set([...words, ...fades, ...cards], { opacity: 1, y: 0, yPercent: 0 });
      if (rule) gsap.set(rule, { strokeDashoffset: 0 });
      return undefined;
    }

    gsap.set(words, { y: 0, yPercent: 110 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.to(words, { yPercent: 0, opacity: 1, duration: 1.15, stagger: 0.045 }, 0.15)
        .fromTo(fades, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.95, stagger: 0.09 }, 0.45)
        .fromTo(cards, { opacity: 0, y: 80, rotationX: 15 }, { opacity: 1, y: 0, rotationX: 0, duration: 1.4, stagger: 0.1 }, 0.35);

      if (rule) {
        const length = rule.getTotalLength();
        gsap.set(rule, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(rule, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.95);
      }
    }, el);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    const stageEl = stage.current;
    if (!el || !stageEl) return undefined;
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return undefined;

    const cards = gsap.utils.toArray('.bh-card', stageEl);
    const setters = cards.map((card) => ({
      depth: Number(card.dataset.depth) || 1,
      rotX: gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' }),
      rotY: gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' }),
      x: gsap.quickTo(card, 'x', { duration: 1.1, ease: 'power3.out' }),
      y: gsap.quickTo(card, 'y', { duration: 1.1, ease: 'power3.out' }),
    }));

    let bounds = el.getBoundingClientRect();
    const measure = () => { bounds = el.getBoundingClientRect(); };

    const onMove = (event) => {
      const nx = (event.clientX - bounds.left) / bounds.width - 0.5;
      const ny = (event.clientY - bounds.top) / bounds.height - 0.5;
      setters.forEach((s) => {
        s.rotY(nx * 20 * s.depth);
        s.rotX(-ny * 15 * s.depth);
        s.x(nx * 30 * s.depth);
        s.y(ny * 20 * s.depth);
      });
    };

    const onLeave = () => {
      setters.forEach((s) => { s.rotY(0); s.rotX(0); s.x(0); s.y(0); });
    };

    el.addEventListener('pointerenter', measure);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', measure);

    return () => {
      el.removeEventListener('pointerenter', measure);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative isolate overflow-hidden min-h-[90svh] lg:min-h-[100svh] flex items-center pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pt-28 lg:pb-24"
      style={{ background: 'linear-gradient(165deg, #051a0d 0%, #08331c 46%, #0b2f4c 100%)' }}
    >
      <style>{`
        @keyframes bhFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>

      {/* ─── Ambient Layers ─── */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[18%] -left-[10%] h-[62vw] w-[62vw] max-h-[820px] max-w-[820px] rounded-full blur-[110px] opacity-[0.5] mix-blend-screen"
          style={{ background: 'radial-gradient(circle, #1c8b4a 0%, rgba(28,139,74,0) 68%)' }}
        />
        <div
          className="absolute top-[6%] -right-[12%] h-[58vw] w-[58vw] max-h-[760px] max-w-[760px] rounded-full blur-[120px] opacity-[0.45] mix-blend-screen"
          style={{ background: 'radial-gradient(circle, #2a7fc4 0%, rgba(42,127,196,0) 68%)' }}
        />
        <div
          className="absolute bottom-[-14%] left-[26%] h-[46vw] w-[46vw] max-h-[600px] max-w-[600px] rounded-full blur-[130px] opacity-[0.3] mix-blend-screen"
          style={{ background: 'radial-gradient(circle, #e8b86d 0%, rgba(232,184,109,0) 70%)' }}
        />

        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#fffdf8]" />
      </div>

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-5 text-center lg:text-left">
            <h1 className="font-['DM_Serif_Display',Georgia,serif] text-white text-[clamp(2.5rem,4.5vw,4.2rem)] leading-[1.06] tracking-[-0.02em]">
              <MaskedWords text="Our" style={{ transform: 'translateY(110%)' }} />{' '}
              <span className="relative inline-block">
                <MaskedWords
                  text="Books"
                  className="bg-clip-text text-transparent"
                  style={{
                    transform: 'translateY(110%)',
                    backgroundImage: 'linear-gradient(100deg, #f7e6bd 0%, #e8b86d 42%, #96cead 100%)',
                  }}
                />
                <svg aria-hidden="true" viewBox="0 0 300 14" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-1 left-0 h-[0.32em] w-full">
                  <path className="bh-rule" d="M2 9C48 3 96 2.5 148 6.5C200 10.5 250 10 298 4" fill="none" stroke="#e8b86d" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                </svg>
              </span>
            </h1>

            <p className="bh-fade opacity-0 mt-6 max-w-xl mx-auto lg:mx-0 text-[1.1rem] md:text-[1.2rem] leading-relaxed text-white/70">
              In today's fast-paced environment, children face pressure and distractions from a very young age. While academics build knowledge, <strong style={{ color: '#96cead', fontWeight: 600 }}>values build character</strong> — and both are essential for balanced growth.
            </p>

            <div className="bh-fade opacity-0 mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                className="group inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-[1rem] font-semibold text-[#111d11] shadow-[0_14px_40px_-12px_rgba(232,184,109,0.75)] transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(232,184,109,0.9)] hover:-translate-y-1 active:scale-[0.98]"
                style={{ background: 'linear-gradient(120deg, #f7e6bd 0%, #e8b86d 100%)' }}
                onClick={() => document.getElementById('books-collection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Browse Collection
                <ArrowForwardIcon fontSize="inherit" className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center mt-12 lg:mt-0" aria-hidden="true">
            <div ref={stage} className="relative w-full max-w-[600px] aspect-[5/4] lg:aspect-[3/2] flex items-center justify-center" style={{ perspective: '1200px' }}>
              <div className="absolute inset-[10%] rounded-full blur-[80px] opacity-40 mix-blend-screen" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(232,184,109,0.42) 0%, rgba(10,79,34,0) 68%)' }} />
              
              {HERO_BOOKS.map((book, i) => (
                <div
                  key={i}
                  data-depth={book.depth}
                  className={`bh-card opacity-0 absolute will-change-transform ${book.className}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div style={{ animation: book.float }}>
                    <div
                      className="overflow-hidden rounded-xl md:rounded-[18px] ring-1 ring-white/20 shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75)] backface-hidden"
                      style={{ transform: `rotate(${book.tilt}deg)` }}
                    >
                      <img src={book.src} alt="" className="block w-full aspect-[2/3] object-cover" loading="eager" decoding="async" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
