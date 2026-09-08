import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Brain, Lightbulb } from 'lucide-react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import SectionEyebrow from './SectionEyebrow';
import { brand } from '../../constants/brand';

/* Accent per tone. */
const TONES = {
  green: { ink: brand.green,    tint: 'rgba(10,92,44,0.08)',   glow: 'rgba(10,92,44,0.13)' },
  blue:  { ink: brand.blue,     tint: 'rgba(26,106,158,0.08)', glow: 'rgba(26,106,158,0.13)' },
  amber: { ink: brand.goldDeep, tint: 'rgba(168,128,31,0.11)', glow: 'rgba(233,200,92,0.22)' },
};

const ICONS = { green: Brain, blue: BookOpen, amber: Users };

function ServiceIcon({ tone, dark }) {
  const Icon = ICONS[tone] || Lightbulb;
  const accent = TONES[tone] || TONES.green;
  return (
    <span
      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover/svc:-rotate-6 group-hover/svc:scale-105"
      style={{
        background: dark ? 'rgba(247,230,174,0.16)' : accent.tint,
        color: dark ? brand.goldLight : accent.ink,
      }}
    >
      <Icon size={26} />
    </span>
  );
}

function SunWatermark() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-[0.18]"
    >
      <g style={{ animation: 'hhSunSpin 120s linear infinite', transformOrigin: '100px 100px' }}>
        {Array.from({ length: 24 }, (_, i) => i * 15).map((angle) => (
          <line
            key={angle}
            x1="100"
            y1={angle % 30 === 0 ? 34 : 40}
            x2="100"
            y2={angle % 30 === 0 ? 12 : 20}
            stroke={brand.goldLight}
            strokeOpacity={angle % 30 === 0 ? '0.9' : '0.5'}
            strokeWidth={angle % 30 === 0 ? '3' : '1.6'}
            strokeLinecap="round"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="46" fill={brand.goldLight} opacity="0.35" />
      <circle cx="100" cy="100" r="58" fill="none" stroke={brand.goldLight} strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}

function ServiceCard({ service, index, featured }) {
  const accent = TONES[service.tone] || TONES.green;
  const Wrapper = service.link ? motion.create(Link) : motion.div;
  const ordinal = String(index + 1).padStart(2, '0');

  // Interactive hover glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = featured
    ? useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(247,230,174,0.16) 0%, transparent 80%)`
    : useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, ${accent.glow} 0%, transparent 80%)`;

  return (
    <Wrapper
      variants={{
        hidden: { opacity: 0, y: 44 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
      }}
      onMouseMove={handleMouseMove}
      {...(service.link ? { to: service.link } : {})}
      className={`hm-svc group/svc relative isolate flex flex-col overflow-hidden rounded-[28px]
                  no-underline transition-[transform,box-shadow] duration-500 ease-out
                  ${featured ? 'p-9 sm:p-11' : 'p-8'}
                  ${service.link
                    ? 'hover:-translate-y-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4'
                    : ''}
                  ${service.colSpan || 'md:col-span-6'}`}
      style={{
        background: featured
          ? `linear-gradient(146deg, ${brand.green} 0%, ${brand.teal} 52%, ${brand.blue} 100%)`
          : '#ffffff',
        border: featured ? '1px solid rgba(233,200,92,0.28)' : '1px solid rgba(15,35,23,0.07)',
        boxShadow: featured
          ? '0 30px 60px -30px rgba(10,92,44,0.65)'
          : '0 1px 2px rgba(15,35,23,0.04)',
        outlineColor: featured ? brand.gold : brand.green,
      }}
    >
      {featured && <SunWatermark />}

      {/* Interactive hover glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/svc:opacity-100"
        style={{ background }}
      />

      {/* Ordinal */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-7 top-6 font-['DM_Serif_Display',Georgia,serif] text-[2.6rem] leading-none"
        style={{ color: featured ? 'rgba(247,230,174,0.35)' : accent.ink, opacity: featured ? 1 : 0.16 }}
      >
        {ordinal}
      </span>

      <ServiceIcon tone={service.tone} dark={featured} />

      <h3
        className={`mt-6 font-['DM_Serif_Display',Georgia,serif] leading-tight
                    ${featured ? 'text-[1.9rem] sm:text-[2.3rem]' : 'text-[1.35rem]'}`}
        style={{ color: featured ? '#ffffff' : brand.ink }}
      >
        {service.title}
      </h3>

      <p
        className={`mt-3 leading-relaxed ${featured ? 'max-w-md text-base sm:text-lg' : 'text-[0.95rem]'}`}
        style={{ color: featured ? 'rgba(255,255,255,0.84)' : brand.ash }}
      >
        {service.desc}
      </p>

      {service.link && (
        <span
          className="mt-auto pt-7 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em]"
          style={{ color: featured ? brand.goldLight : brand.green }}
        >
          Learn more
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover/svc:translate-x-1.5"
          />
        </span>
      )}

      {/* Gold hairline wiping in along the bottom edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover/svc:scale-x-100"
        style={{ background: featured ? brand.gold : accent.ink, opacity: featured ? 0.8 : 0.5 }}
      />
    </Wrapper>
  );
}

export default function HomeServices({ title, description, services }) {
  return (
    <section
      className="relative px-6 py-24 md:py-32"
      aria-labelledby="services-heading"
      style={{
        background:
          'radial-gradient(52% 40% at 6% 88%, rgba(233,200,92,0.16) 0%, rgba(233,200,92,0) 64%),' +
          `linear-gradient(180deg, ${brand.ivory} 0%, #ffffff 46%, #ffffff 100%)`,
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:items-end md:gap-12">
          <div className="md:col-span-7">
            <SectionEyebrow>What We Do</SectionEyebrow>
            <h2
              id="services-heading"
              className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.1] tracking-[-0.015em]"
              style={{ color: brand.ink }}
            >
              {title}
            </h2>
          </div>
          <p
            className="text-base leading-[1.75] md:col-span-5 md:pb-2 md:text-lg"
            style={{ color: brand.ash }}
          >
            {description}
          </p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.09 } }
          }}
          className="hm-svc-grid grid grid-cols-1 gap-4 md:auto-rows-[minmax(15.5rem,auto)] md:grid-flow-dense md:grid-cols-12"
        >
          {services.map((svc, i) => (
            <ServiceCard key={svc.title || i} service={svc} index={i} featured={i === 0} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

