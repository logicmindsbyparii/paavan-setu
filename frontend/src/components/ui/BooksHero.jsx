import React, { useEffect } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { motion, useAnimate, stagger, useSpring, useReducedMotion } from 'framer-motion';

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
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom pb-[0.16em] -mb-[0.16em]">
            <motion.span 
              className={`bh-word inline-block will-change-transform ${className}`} 
              style={style}
              initial={{ y: "110%" }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </>
  );
}

export default function BooksHero() {
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();

  // Mouse move parallax springs
  const rotX = useSpring(0, { stiffness: 100, damping: 30 });
  const rotY = useSpring(0, { stiffness: 100, damping: 30 });
  const xOffset = useSpring(0, { stiffness: 100, damping: 30 });
  const yOffset = useSpring(0, { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (reducedMotion) {
      animate([
        [".bh-word", { y: "0%" }, { duration: 0 }],
        [".bh-fade", { opacity: 1, y: 0 }, { duration: 0 }],
        [".bh-card", { opacity: 1, y: 0, rotateX: 0 }, { duration: 0 }],
        [".bh-rule", { pathLength: 1 }, { duration: 0 }]
      ]);
      return;
    }

    const sequence = [
      [".bh-word", { y: ["110%", "0%"] }, { duration: 1.15, delay: stagger(0.045), ease: [0.19, 1, 0.22, 1], at: 0.15 }],
      [".bh-fade", { opacity: [0, 1], y: [26, 0] }, { duration: 0.95, delay: stagger(0.09), ease: [0.19, 1, 0.22, 1], at: 0.45 }],
      [".bh-card", { opacity: [0, 1], y: [80, 0], rotateX: [15, 0] }, { duration: 1.4, delay: stagger(0.1), ease: [0.19, 1, 0.22, 1], at: 0.35 }],
      [".bh-rule", { pathLength: [0, 1] }, { duration: 1.1, ease: "easeInOut", at: 0.95 }]
    ];

    animate(sequence);
  }, [animate, reducedMotion]);

  useEffect(() => {
    const el = scope.current;
    if (!el || reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

    let bounds = el.getBoundingClientRect();
    const measure = () => { bounds = el.getBoundingClientRect(); };

    const onMove = (event) => {
      const nx = (event.clientX - bounds.left) / bounds.width - 0.5;
      const ny = (event.clientY - bounds.top) / bounds.height - 0.5;
      rotY.set(nx * 20);
      rotX.set(-ny * 15);
      xOffset.set(nx * 30);
      yOffset.set(ny * 20);
    };

    const onLeave = () => {
      rotY.set(0);
      rotX.set(0);
      xOffset.set(0);
      yOffset.set(0);
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
  }, [scope, rotY, rotX, xOffset, yOffset, reducedMotion]);

  return (
    <section
      ref={scope}
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
              <MaskedWords text="Our" />{' '}
              <span className="relative inline-block">
                <MaskedWords
                  text="Books"
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(100deg, #f7e6bd 0%, #e8b86d 42%, #96cead 100%)',
                  }}
                />
                <svg aria-hidden="true" viewBox="0 0 300 14" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-1 left-0 h-[0.32em] w-full">
                  <motion.path 
                    className="bh-rule" 
                    d="M2 9C48 3 96 2.5 148 6.5C200 10.5 250 10 298 4" 
                    fill="none" 
                    stroke="#e8b86d" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    opacity="0.85" 
                    initial={{ pathLength: 0 }}
                  />
                </svg>
              </span>
            </h1>

            <motion.p 
              initial={{ opacity: 0, y: 26 }}
              className="bh-fade mt-6 max-w-xl mx-auto lg:mx-0 text-[1.1rem] md:text-[1.2rem] leading-relaxed text-white/70"
            >
              In today's fast-paced environment, children face pressure and distractions from a very young age. While academics build knowledge, <strong style={{ color: '#96cead', fontWeight: 600 }}>values build character</strong> — and both are essential for balanced growth.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 26 }}
              className="bh-fade mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                className="group inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-[1rem] font-semibold text-[#111d11] shadow-[0_14px_40px_-12px_rgba(232,184,109,0.75)] transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(232,184,109,0.9)] hover:-translate-y-1 active:scale-[0.98]"
                style={{ background: 'linear-gradient(120deg, #f7e6bd 0%, #e8b86d 100%)' }}
                onClick={() => document.getElementById('books-collection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Browse Collection
                <ArrowForwardIcon fontSize="inherit" className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-7 flex justify-center mt-12 lg:mt-0" aria-hidden="true">
            <div className="relative w-full max-w-[600px] aspect-[5/4] lg:aspect-[3/2] flex items-center justify-center" style={{ perspective: '1200px' }}>
              <div className="absolute inset-[10%] rounded-full blur-[80px] opacity-40 mix-blend-screen" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(232,184,109,0.42) 0%, rgba(10,79,34,0) 68%)' }} />
              
              {HERO_BOOKS.map((book, i) => (
                <motion.div
                  key={i}
                  className={`bh-card absolute will-change-transform ${book.className}`}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    rotateX: book.depth ? rotX : 0, // Depth influences intensity
                    rotateY: book.depth ? rotY : 0, // In this simple version we skip multiplying depth per axis for ease, 
                    x: book.depth ? xOffset : 0,    // as Framer Motion's useSpring doesn't easily map a single value with different multipliers inline unless we use useTransform
                    y: book.depth ? yOffset : 0,
                  }}
                  initial={{ opacity: 0, y: 80, rotateX: 15 }}
                >
                  <div style={{ animation: book.float }}>
                    <div
                      className="overflow-hidden rounded-xl md:rounded-[18px] ring-1 ring-white/20 shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75)] backface-hidden"
                      style={{ transform: `rotate(${book.tilt}deg)` }}
                    >
                      <img src={book.src} alt="" className="block w-full aspect-[2/3] object-cover" loading="eager" decoding="async" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
