import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { prefersReducedMotion } from '../../lib/motion';
import { brand, GRAIN } from '../../constants/brand';
import { WHATSAPP_NUMBER } from '../../constants/urls';

const MotionLink = motion.create(Link);

export default function HomeCta({ title, description, ctaLabel, ctaLink, whatsappLabel }) {
  const containerRef = useRef(null);
  const reducedMotion = prefersReducedMotion();

  // Scroll for ambient parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Scroll for description scrub
  const { scrollYProgress: descScroll } = useScroll({
    target: containerRef,
    offset: ["start 90%", "start 60%"]
  });

  // Parallax
  const ambientY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const ambientRotate = useTransform(scrollYProgress, [0, 1], [0, 5]);

  // Scrub
  const descOpacity = useTransform(descScroll, [0, 1], [0.15, 1]);
  const descY = useTransform(descScroll, [0, 1], [20, 0]);

  // Variants
  const wordVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 60, rotateX: reducedMotion ? 0 : -40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const titleVariants = {
    hidden: { opacity: 1 }, // container itself doesn't need to fade
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.9, y: reducedMotion ? 0 : 30 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 1.2, 
        ease: [0.175, 0.885, 0.32, 1.275] // elastic-like ease
      }
    }
  };

  const btnContainerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const displayTitle = title || "Ready to Begin?";
  
  // Split title into words to animate them
  const words = displayTitle.split(' ');

  return (
    <section
      ref={containerRef}
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden px-6 py-20 md:py-36 flex items-center justify-center min-h-[60vh]"
      style={{
        backgroundColor: brand.ivory,
      }}
    >
      {/* ── BACKGROUND GRAIN ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
      />

      {/* ── AMBIENT PARALLAX ORBS ── */}
      <motion.div 
        style={{ y: ambientY, rotate: ambientRotate, background: `radial-gradient(circle, ${brand.goldLight} 0%, transparent 70%)` }}
        className="pointer-events-none absolute -bottom-[10%] left-[10%] -z-10 h-[50vw] w-[50vw] rounded-full opacity-40 blur-[120px] md:blur-[160px]" 
      />
      <motion.div 
        style={{ y: ambientY, rotate: ambientRotate, background: `radial-gradient(circle, ${brand.green} 0%, transparent 70%)` }}
        className="pointer-events-none absolute top-[20%] right-[10%] -z-10 h-[40vw] w-[40vw] rounded-full opacity-[0.15] blur-[100px] md:blur-[140px]" 
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        
        {/* ── CINEMATIC HEADLINE ── */}
        <motion.h2
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-15% 0px" }}
          id="cta-heading"
          className="w-full font-['DM_Serif_Display',Georgia,serif] text-[clamp(3.8rem,8vw,8.5rem)] leading-[1.05] tracking-[-0.02em] [perspective:1000px]"
          style={{ color: brand.ink }}
        >
          {words.map((word, i) => (
            <React.Fragment key={i}>
              <motion.span variants={wordVariants} className="inline-block origin-bottom">{word}</motion.span>
              {i !== words.length - 1 && ' '}
            </React.Fragment>
          ))}
        </motion.h2>

        {/* ── SCRUBBING DESCRIPTION ── */}
        <motion.p
          style={{ opacity: reducedMotion ? 1 : descOpacity, y: reducedMotion ? 0 : descY, color: brand.ash }}
          className="mt-10 md:mt-16 max-w-2xl text-[1.15rem] md:text-[1.35rem] leading-[1.8] font-medium"
        >
          {description}
        </motion.p>

        {/* ── BUTTONS ── */}
        <motion.div 
          variants={btnContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          className="mt-14 md:mt-24 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10"
        >
          <MotionLink
            variants={buttonVariants}
            to={ctaLink || '/contact'}
            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-12 py-5 text-[1.1rem] font-semibold no-underline shadow-[0_16px_40px_-12px_rgba(168,128,31,0.65)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-10px_rgba(168,128,31,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.97]"
            style={{
              background: brand.gold,
              color: brand.ink,
              outlineColor: brand.green,
            }}
          >
            {/* Shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full ease-in-out" />
            <span className="relative z-10">{ctaLabel}</span>
            <ArrowRight size={20} className="relative z-10 transition-transform duration-500 ease-out group-hover:translate-x-1.5" />
          </MotionLink>

          <motion.a
            variants={buttonVariants}
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-4 rounded-full px-8 py-4 text-[1.1rem] font-semibold no-underline transition-all duration-500 hover:bg-black/5 hover:-translate-y-1.5"
            style={{ color: brand.green }}
          >
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_20px_-4px_rgba(10,92,44,0.2)] transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_8px_25px_-4px_rgba(10,92,44,0.3)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </span>
            <span className="relative">
              {whatsappLabel}
              <span className="absolute -bottom-1 left-0 block h-[2px] w-full origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
            </span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
