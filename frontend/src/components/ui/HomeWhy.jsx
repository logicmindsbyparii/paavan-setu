import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';
import SectionEyebrow from './SectionEyebrow';
import { brand, FIELD_GRADIENT } from '../../constants/brand';
import classroomImage from '../../assets/krishna_classroom.jpeg';
import mentorImage from '../../assets/krishna_pathsala2.webp';

const EDGE_TOP = 'M0,0 L1440,0 L1440,22 C1090,104 350,-22 0,58 Z';
const EDGE_TOP_LINE = 'M1440,22 C1090,104 350,-22 0,58';
const EDGE_BOTTOM = 'M0,110 L1440,110 L1440,52 C1090,-24 350,102 0,26 Z';
const EDGE_BOTTOM_LINE = 'M1440,52 C1090,-24 350,102 0,26';

function ScrubWords({ text, progress }) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  return words.map((word, i) => {
    const start = i / words.length;
    const end = start + (1 / words.length);
    const opacity = useTransform(progress, [start, end], [0.18, 1]);
    return (
      <React.Fragment key={`${word}-${i}`}>
        <motion.span style={{ opacity }} className="inline-block">{word}</motion.span>
        {i < words.length - 1 ? ' ' : null}
      </React.Fragment>
    );
  });
}

function splitStat(raw) {
  const match = String(raw).match(/^([\d,]+\s*[%+]*)\s+(.*)$/);
  return match
    ? { value: match[1].replace(/\s+/g, ''), label: match[2] }
    : { value: String(raw), label: '' };
}

function Stat({ value, label }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const numericValue = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
  const suffix = String(value).replace(/[\d,]/g, '').trim();

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      if (ref.current) ref.current.textContent = value;
      return;
    }
    
    if (isInView) {
      const controls = animate(0, numericValue, {
        duration: 2,
        ease: "easeOut",
        onUpdate(val) {
          if (ref.current) ref.current.textContent = Math.round(val) + suffix;
        }
      });
      return () => controls.stop();
    }
  }, [isInView, numericValue, suffix, value]);

  return (
    <div className="text-center sm:text-left">
      <dd
        ref={ref}
        aria-hidden="true"
        className="m-0 font-['DM_Serif_Display',Georgia,serif] text-[2.4rem] leading-none tabular-nums sm:text-[3rem]"
        style={{ color: brand.goldLight }}
      >
        {Number.isFinite(numericValue) ? '0' : value}
      </dd>
      <dt className="mt-3 text-[0.85rem] leading-snug" style={{ color: 'rgba(255,255,255,0.82)' }}>
        {label}
      </dt>
      <span className="sr-only">{value} {label}</span>
    </div>
  );
}

export default function HomeWhy({ title, description, achievements }) {
  const stats = achievements.map(splitStat);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "center 55%"]
  });

  const imgRef1 = useRef(null);
  const { scrollYProgress: imgProgress1 } = useScroll({
    target: imgRef1,
    offset: ["start 95%", "center 65%"]
  });
  const imgScale1 = useTransform(imgProgress1, [0, 1], [0.92, 1]);
  const imgOpacity1 = useTransform(imgProgress1, [0, 1], [0.4, 1]);

  const imgRef2 = useRef(null);
  const { scrollYProgress: imgProgress2 } = useScroll({
    target: imgRef2,
    offset: ["start 95%", "center 65%"]
  });
  const imgScale2 = useTransform(imgProgress2, [0, 1], [0.92, 1]);
  const imgOpacity2 = useTransform(imgProgress2, [0, 1], [0.4, 1]);

  return (
    <section
      ref={containerRef}
      aria-labelledby="why-heading"
      className="relative isolate overflow-hidden px-6 pb-32 pt-32 md:pb-44 md:pt-44"
      style={{
        background:
          'radial-gradient(58% 44% at 78% 18%, rgba(247,230,174,0.16) 0%, rgba(247,230,174,0) 62%),' +
          FIELD_GRADIENT,
      }}
    >
      {/* ─── Curved edges ────────────────────────────────────────────────── */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 h-[54px] w-full md:h-[100px]"
      >
        <path d={EDGE_TOP} fill="#ffffff" />
        <path
          d={EDGE_TOP_LINE}
          fill="none"
          stroke={brand.gold}
          strokeOpacity="0.55"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[54px] w-full md:h-[100px]"
      >
        <path d={EDGE_BOTTOM} fill="#ffffff" />
        <path
          d={EDGE_BOTTOM_LINE}
          fill="none"
          stroke={brand.gold}
          strokeOpacity="0.55"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Argument */}
          <div className="lg:col-span-6">
            <h2
              id="why-heading"
              className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.1rem,4.2vw,3.3rem)] leading-[1.12] tracking-[-0.015em] text-white"
            >
              <ScrubWords text={title} progress={scrollYProgress} />
            </h2>

            <p className="mt-7 max-w-xl text-base leading-[1.8] sm:text-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <ScrubWords text={description} progress={scrollYProgress} />
            </p>
          </div>

          <div className="relative h-[340px] w-full sm:h-[440px] lg:col-span-6 lg:h-[560px]">
            <motion.img
              ref={imgRef1}
              animate={{ y: [0, -12, 0], rotate: [0, 1, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              style={{
                scale: imgScale1,
                opacity: imgOpacity1,
                boxShadow: '0 0 0 1px rgba(233,200,92,0.5), 0 34px 64px -26px rgba(4,32,18,0.75)'
              }}
              className="absolute right-0 top-0 h-[74%] w-[84%] rounded-[24px] object-cover"
              src={classroomImage}
              alt="Illustration from Krishnaa's Classroom, one of our value-education books"
              loading="lazy"
              decoding="async"
            />
            <motion.img
              ref={imgRef2}
              animate={{ y: [0, 10, 0], rotate: [0, -1, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              style={{
                scale: imgScale2,
                opacity: imgOpacity2,
                boxShadow: '0 0 0 1px rgba(233,200,92,0.6), 0 34px 64px -22px rgba(4,32,18,0.85)'
              }}
              className="absolute bottom-0 left-0 z-10 h-[56%] w-[62%] rounded-[24px] object-cover"
              src={mentorImage}
              alt="Illustration from Krishna's Pathshala, part of our Gujarati book series"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {stats.length > 0 && (
          <dl className="mt-20 flex flex-wrap justify-center gap-x-10 gap-y-10 border-t pt-14 sm:justify-start sm:gap-x-14 md:mt-24"
              style={{ borderColor: 'rgba(233,200,92,0.28)' }}>
            {stats.map((stat, i) => (
              <div key={`${stat.value}-${stat.label}`} className="flex items-center gap-10 sm:gap-14">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-1.5 w-1.5 shrink-0 rotate-45 sm:block"
                    style={{ background: brand.gold, opacity: 0.7 }}
                  />
                )}
                <Stat value={stat.value} label={stat.label} />
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
