import React from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../../lib/motion';
import { Marquee } from './Marquee';
import { brand, PAPER_GRADIENT, GRAIN } from '../../constants/brand';

/**
 * Homepage testimonials.
 *
 * Redesigned for cinematic scale and fluid GSAP motion. The section breathes with
 * massive vertical padding (`py-32 md:py-48`) and an ultra-wide heading container 
 * to ensure the title never awkwardly wraps into a tall column. 
 *
 * The cards themselves feature sophisticated hover physics, tactile backgrounds using
 * the brand's `PAPER_GRADIENT` and `GRAIN`, and integrated visual accents to elevate 
 * them from standard flat UI boxes into premium components.
 */

function TestimonialCard({ quote, name, role }) {
  const initial = String(name || '?').trim().charAt(0).toUpperCase();

  return (
    <figure
      className="group/tst relative m-0 flex w-[22rem] shrink-0 flex-col rounded-3xl p-8 sm:w-[26rem] overflow-hidden transition-all duration-700 ease-out hover:-translate-y-2 hover:scale-[1.02]"
      style={{
        background: PAPER_GRADIENT,
        boxShadow: '0 8px 30px -6px rgba(15,35,23,0.06), 0 0 0 1px rgba(15,35,23,0.04)',
      }}
    >
      {/* Tactile paper grain overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply" 
        style={{ backgroundImage: GRAIN }} 
      />
      
      {/* Dynamic ambient hover glow */}
      <div 
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[rgba(233,200,92,0)] via-[rgba(233,200,92,0)] to-[rgba(233,200,92,0.18)] opacity-0 transition-opacity duration-700 ease-out group-hover/tst:opacity-100" 
      />

      {/* Elegant quote mark replacing the generic watermark style */}
      <span
        aria-hidden="true"
        className="relative z-10 font-['DM_Serif_Display',Georgia,serif] text-[4rem] leading-[0.4] transition-transform duration-700 ease-out group-hover/tst:-translate-y-1 group-hover/tst:scale-110"
        style={{ color: brand.goldDeep }}
      >
        &ldquo;
      </span>

      <blockquote 
        className="relative z-10 mt-6 flex-1 text-[1.08rem] leading-[1.75] tracking-tight" 
        style={{ color: brand.ink }}
      >
        {quote}
      </blockquote>

      <figcaption 
        className="relative z-10 mt-10 flex items-center gap-4 border-t pt-6 transition-colors duration-700 group-hover/tst:border-[rgba(15,35,23,0.12)]" 
        style={{ borderColor: 'rgba(15,35,23,0.06)' }}
      >
        <div className="relative">
           <span
             aria-hidden="true"
             className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-['DM_Serif_Display',Georgia,serif] text-xl transition-transform duration-700 ease-out group-hover/tst:scale-110"
             style={{ background: brand.green, color: brand.ivoryLit }}
           >
             {initial}
           </span>
           {/* Sophisticated overlapping accent dot */}
           <div 
             className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 transition-transform duration-700 ease-out group-hover/tst:scale-125" 
             style={{ background: brand.gold, borderColor: brand.ivoryLit }} 
           />
        </div>
        <span className="min-w-0">
          <span 
            className="block truncate text-[1.02rem] font-semibold tracking-tight transition-transform duration-700 ease-out group-hover/tst:translate-x-1" 
            style={{ color: brand.ink }}
          >
            {name}
          </span>
          {role && (
            <span 
              className="block truncate text-[0.85rem] font-medium transition-transform duration-700 ease-out group-hover/tst:translate-x-1" 
              style={{ color: brand.ash }}
            >
              {role}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/* The tracks fade out at both edges so a card never gets guillotined by the viewport. */
const EDGE_FADE = {
  WebkitMaskImage: 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
  maskImage: 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
};

export default function HomeTestimonials({ title, testimonials }) {
  const reducedMotion = prefersReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 60 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  if (!testimonials.length) return null;

  // All testimonials live in one row so a single copy of the strip is wider
  // than the viewport (6 cards ≈ 2656px). Splitting into two rows of 3 made
  // each copy ~1312px — narrower than a desktop screen — so two copies sat
  // side by side and every card visibly appeared twice.
  //
  // `repeat` only needs to guarantee the strip is long enough to loop
  // seamlessly (viewport + one copy); it no longer determines what's visible.
  const cards = testimonials.map((t, i) => (
    <TestimonialCard key={`${t.name}-${i}`} quote={t.text} name={t.name} role={t.role} />
  ));

  return (
    <section 
      className="relative w-full max-w-full overflow-x-hidden py-20 md:py-36" 
      aria-labelledby="testimonials-heading"
      style={{ background: brand.ivoryLit }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15% 0px" }}
      >
        <div className="mx-auto mb-20 flex w-full max-w-6xl flex-col items-center px-6 text-center md:mb-32">
          {/* Massive, wide container ensures the heading stays elegant (2-3 lines max) */}
          <motion.h2
            variants={childVariants}
            id="testimonials-heading"
            className="font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] w-full max-w-5xl"
            style={{ color: brand.ink }}
          >
            {title}
          </motion.h2>
        </div>

        <motion.div variants={childVariants} style={EDGE_FADE}>
          <Marquee pauseOnHover repeat={3} className="[--duration:70s] [--gap:2rem] py-4">
            {cards}
          </Marquee>
        </motion.div>
      </motion.div>
    </section>
  );
}
