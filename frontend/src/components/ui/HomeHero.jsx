import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { gsap, prefersReducedMotion } from '../../lib/motion';
import { brand, GRAIN } from '../../constants/brand';
import SectionEyebrow from './SectionEyebrow';
import { WHATSAPP_NUMBER } from '../../constants/urls';
import BookCluster3D from './BookCluster3D';

/**
 * Homepage hero — "Duotone Setu".
 *
 * The previous pass fixed a hero that was too dark by making the whole thing
 * cream, and landed on the opposite problem: a brand whose mark is three
 * saturated colours ended up with a hero that had no colour in it at all — just
 * tinted paper and a hairline arc. This version puts the logo's palette back on
 * the page as structure rather than as a tint.
 *
 * 1. BACKGROUND. Two fields, not one wash. Warm ivory on the left where the
 *    reading happens, and a full-bleed green → teal → blue field on the right:
 *    the exact traverse of the arc over the logotype, read left to right. The
 *    boundary between them *is* the setu — one cubic, top edge to bottom edge.
 *
 * 2. BOXES. Still no card, pill, panel or bordered strip anywhere, and the
 *    colour field is a shape rather than a box: it bleeds off three sides, has
 *    no corner radius, and the book covers straddle its edge on purpose so the
 *    boundary never resolves into a rectangle. The stat row lost the hairline
 *    dividers that were the last thing in here still drawing one.
 *
 * 3. TEXT. The heading is two sizes instead of one run-on block — the setup
 *    line small and upright in ink, the payoff word far larger in brand-green
 *    italic, matching the logo's own italic wordmark. Under it, a single filled
 *    gold swash: the double hairline arc it replaces rendered as a scribble at
 *    every real size. The stat labels went from 0.66rem uppercase at 0.14em
 *    tracking — the smallest, weakest type on the page — to sentence case.
 *
 * Colours sampled off logo_final.png: #0a5c2c green, #1a6a9e blue, #e9c85c
 * gold. Contrast: ink on ivory 15.6:1, ash on ivory 7.2:1, green on ivory
 * 8.1:1, ink on the gold CTA 7.9:1, white on the field 5.8:1 at its lightest.
 *
 * Everything animated is a transform, an opacity or a stroke offset, so the
 * entrance never triggers layout, and every motion path has a reduced-motion
 * branch that renders the final state.
 */

/* ─── Brand colours, sampled from the logo ───────────────────────────────────
   These now live in constants/brand.js rather than here. They were private to
   this file, which is why the hero was the only part of the homepage that
   spoke in the logo's palette — the sections below could not reach them. The
   local aliases are kept so the markup below reads unchanged. */
const {
  green: GREEN,
  teal: TEAL,
  blue: BLUE,
  blueDeep: BLUE_DEEP,
  gold: GOLD,
  goldLight: GOLD_LIGHT,
  goldDeep: GOLD_DEEP,
  ivory: IVORY,
  ink: INK,
  ash: ASH,
} = brand;

/* ─── The boundary ─────────────────────────────────────────────────────────
   One cubic, top edge to bottom edge, dividing ivory from the brand field.

   Its leftmost point has to clear the copy at every viewport width. With a
   centred max-width container, a `lg:col-span-6` column's right edge always
   lands at 50% of the viewport — that property is what makes this safe without
   a resize listener. At t=0.5 this curve sits at x=827.5 of 1440, or 57.5%, so
   there is ~7.5% of clear ivory between the last glyph and the colour.

   `preserveAspectRatio="none"` is right here and would have been wrong for the
   version this replaces: that one was strokes, which a non-uniform scale thins
   to a hair. This is a filled region, and stretching it is exactly what keeps
   the field flush to the viewport at every aspect ratio. The single stroke on
   it carries `vector-effect="non-scaling-stroke"`. */
const FIELD_DESKTOP = 'M 1440 0 L 900 0 C 760 240, 810 640, 1010 900 L 1440 900 Z';
const EDGE_DESKTOP = 'M 900 0 C 760 240, 810 640, 1010 900';

/* Mobile can't take a vertical split — the copy is centred and full-width — so
   the field becomes an organic backdrop behind the book cluster instead. It
   lives inside the stage and bleeds past it, which pins it to the artwork
   rather than to a guessed percentage of a section whose height depends on how
   long the CMS copy runs. */
const FIELD_MOBILE = 'M 0 480 L 0 138 C 96 44, 214 122, 318 26 L 400 4 L 400 480 Z';

/* ─── The sun ──────────────────────────────────────────────────────────────
   The logo's sun is a disc inside a ring of tapered rays. Rebuilt here at 24
   rays so it stays recognisable at hero scale, generated rather than hand-typed
   so the 15° spacing is exact. It goes back behind the book cluster now that
   the cluster sits on saturated colour: pale gold on green reads at a glance,
   and the reason it had to be exiled to the sky before was that gold on cream
   simply did not. */
const SUN_RAYS = Array.from({ length: 24 }, (_, i) => i * 15);

/* Paper grain (imported from constants/brand). At 4% multiply it is enough to
   stop a full viewport of flat ivory from looking unstyled, at the cost of one
   160px raster instead of an image request. It sits under the colour field, so
   it never lands on the saturated half where it would just read as noise. */

/** "2000+ Students Guided" → { value: '2000+', label: 'Students Guided' } */
function splitStat(raw) {
  const match = String(raw).match(/^([\d,]+\s*[%+]*)\s+(.*)$/);
  return match
    ? { value: match[1].replace(/\s+/g, ''), label: match[2] }
    : { value: String(raw), label: '' };
}

/**
 * Renders text as individually masked words. Each word sits in an
 * overflow-hidden box and starts pushed below it, so the entrance reads as the
 * line being uncovered rather than fading in.
 *
 * The mask box is padded and negatively margined by the same amount, otherwise
 * it clips descenders — and the italic accent line has more of them than the
 * upright line does, so the padding is sized for the italic.
 *
 * The gap between words is a real text node rather than a margin: a margin
 * looks identical but makes the heading copy, and read aloud, as one run-on
 * word ("BuildingCharacterThrough").
 */
function MaskedWords({ text, className = '', style }) {
  const words = useMemo(() => String(text ?? '').split(/\s+/).filter(Boolean), [text]);
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom pb-[0.2em] -mb-[0.2em]">
            <span className={`hh-word inline-block will-change-transform ${className}`} style={style}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </>
  );
}

export default function HomeHero({ get, achievements = [] }) {
  const root = useRef(null);
  const magnet = useRef(null);

  const stats = achievements.slice(0, 3).map(splitStat);
  const line1 = get('hero.title.line1');
  const line2 = get('hero.title.line2');

  /* ─── Entrance ─────────────────────────────────────────────────────────── */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;

    const words = el.querySelectorAll('.hh-word');
    const fades = el.querySelectorAll('.hh-fade');
    // Two fields — the desktop one and the in-stage mobile one. Only one is
    // ever displayed, but both must be driven: the hidden one is `display:none`
    // rather than unmounted, so a resize across the lg breakpoint would
    // otherwise reveal a field still parked at opacity 0.
    const fields = el.querySelectorAll('.hh-field');
    const edges = el.querySelectorAll('.hh-edge');
    const swash = el.querySelector('.hh-swash');
    const sun = el.querySelector('.hh-sun');

    // GSAP does not read prefers-reduced-motion, and these elements start
    // hidden — without this branch the hero would render blank.
    if (prefersReducedMotion()) {
      gsap.set([...words, ...fades], { opacity: 1, y: 0, yPercent: 0 });
      gsap.set([...fields], { opacity: 1, xPercent: 0 });
      gsap.set([...edges], { strokeDashoffset: 0, opacity: 1 });
      if (swash) gsap.set(swash, { opacity: 1, scaleX: 1 });
      if (sun) gsap.set(sun, { opacity: 1, scale: 1 });
      return undefined;
    }

    // The words carry an inline `translateY(110%)` so they are already hidden
    // before this effect runs. GSAP resolves that against the computed matrix
    // and records it as ~75 *pixels* with yPercent 0 — so a percentage tween
    // lands on top of a pixel offset that nothing ever clears, and the heading
    // finishes its animation still a full line below its mask. Restating the
    // offset in GSAP's own units, with y zeroed, is what keeps the two in sync.
    gsap.set(words, { y: 0, yPercent: 110 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      // The colour field arrives first, so the hero lays the ground before it
      // puts anything on it. xPercent rather than a clip-path tween: a
      // compositor-only transform, and it reads as the field sliding in from
      // off-screen instead of being wiped into existence where it stands.
      tl.fromTo(
        fields,
        { opacity: 0, xPercent: 12 },
        { opacity: 1, xPercent: 0, duration: 1.5, ease: 'power3.out' },
        0
      )
        .to(words, { yPercent: 0, duration: 1.15, stagger: 0.045 }, 0.25)
        .fromTo(
          fades,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.95, stagger: 0.09 },
          0.55
        )
        .fromTo(
          sun,
          { opacity: 0, scale: 0.82 },
          { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' },
          0.35
        );

      // The gold swash under the accent word, scaled from its left edge so it
      // reads as one pass of a brush laid down left to right.
      if (swash) {
        tl.fromTo(
          swash,
          { opacity: 0, scaleX: 0 },
          { opacity: 1, scaleX: 1, duration: 0.9, ease: 'power2.out' },
          1.05
        );
      }

      // The gold hairline riding the boundary, drawn on over the field's own
      // edge. Measured at runtime so the dash always matches the rendered path
      // length, whatever the viewport does to it.
      edges.forEach((edge) => {
        const length = edge.getTotalLength();
        gsap.set(edge, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
        tl.to(edge, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.3);
      });
    }, el);

    return () => ctx.revert();
  }, []);

  /* ─── Magnetic primary CTA ─────────────────────────────────────────────── */
  useLayoutEffect(() => {
    const btn = magnet.current;
    if (!btn) return undefined;
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    const toX = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const toY = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });

    const onMove = (event) => {
      const rect = btn.getBoundingClientRect();
      toX((event.clientX - rect.left - rect.width / 2) * 0.22);
      toY((event.clientY - rect.top - rect.height / 2) * 0.35);
    };
    const onLeave = () => { toX(0); toY(0); };

    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', onLeave);
    return () => {
      btn.removeEventListener('pointermove', onMove);
      btn.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section
      ref={root}
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden min-h-[100svh] flex items-center
                 pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pt-32 lg:pb-24"
      style={{
        background:
          // A low gold wash under the copy — the field's light spilling onto
          // the paper, which is what stops the ivory half reading as a
          // separate, unlit page sitting next to a lit one.
          'radial-gradient(54% 46% at 10% 90%, rgba(233,200,92,0.32) 0%, rgba(233,200,92,0) 62%),' +
          `linear-gradient(172deg, #fffdf8 0%, ${IVORY} 48%, #f7f0e2 100%)`,
      }}
    >
      {/* ─── Ambient layers (decorative) ─────────────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        {/* Paper grain, under the field. */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
          style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
        />

        {/* The brand field — lg and up. Full-bleed on three sides. */}
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="hidden lg:block absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="hh-field" x1="0" y1="0" x2="0.85" y2="1">
              {/* Green at the top shoulder, teal at the crossing, blue at the
                  foot — the logo's arc rotated onto the vertical. */}
              <stop offset="0%" stopColor={GREEN} />
              <stop offset="38%" stopColor={TEAL} />
              <stop offset="72%" stopColor={BLUE} />
              <stop offset="100%" stopColor={BLUE_DEEP} />
            </linearGradient>
            {/* The sun's light inside the field, behind the book cluster. */}
            <radialGradient id="hh-fieldGlow" cx="0.68" cy="0.28" r="0.6">
              <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.4" />
              <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="hh-field will-change-transform">
            <path d={FIELD_DESKTOP} fill="url(#hh-field)" />
            <path d={FIELD_DESKTOP} fill="url(#hh-fieldGlow)" />
          </g>
          {/* A gold hairline riding the boundary. `non-scaling-stroke` keeps it
              1.5 screen pixels at every aspect ratio despite the stretch. */}
          <path
            className="hh-edge"
            d={EDGE_DESKTOP}
            fill="none"
            stroke={GOLD}
            strokeOpacity="0.6"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        {/* 6/6 rather than the old 7/5: the boundary curve's safe zone is
            derived from a col-span-6 column's right edge landing at exactly 50%
            of the viewport, which only holds for an even split. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 sm:gap-16 lg:gap-8 items-center">

          {/* Left column — always over ivory at lg and up. */}
          <div className="lg:col-span-6 text-center lg:text-left lg:pr-6">
            {/* Eyebrow: the logo's sun and the tagline, left-aligned to the
                type on desktop and centred with it on mobile. Renders only
                when the CMS actually provides a badge, so a blank setting
                never leaves an orphaned glyph. */}
            {get('hero.badge') && (
              <SectionEyebrow className="hh-fade mb-7 justify-center lg:justify-start">
                {get('hero.badge')}
              </SectionEyebrow>
            )}

            {/* Two sizes rather than one block: the setup line stays quiet and
                the payoff word is far larger and carries the brand colour, so
                the eye lands on the word that matters instead of on a slab. */}
            <h1
              id="hero-heading"
              className="mt-6 font-['DM_Serif_Display',Georgia,serif] tracking-[-0.015em]"
              style={{ color: INK }}
            >
              <span className="block text-[clamp(1.9rem,3.5vw,3rem)] leading-[1.14]">
                <MaskedWords text={line1} />
              </span>
              <span className="relative inline-block mt-1 text-[clamp(2.5rem,5.4vw,4.4rem)] leading-[1.06]">
                {/* Solid brand green, italic — the logo sets "Paavan Setu" in an
                    italic serif, so the accent line speaks in the wordmark's own
                    voice rather than in a gradient that was never in the brand. */}
                <MaskedWords
                  text={line2}
                  className="italic"
                  style={{ color: GREEN }}
                />
                {/* One filled, tapered gold swash. A 2-3px stroke across this
                    width renders as a scribble, which is what made the double
                    arc it replaces look accidental rather than drawn. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  className="hh-swash pointer-events-none absolute -bottom-[0.02em] left-0
                             h-[0.24em] w-[103%] -translate-x-[1.5%] origin-left"
                >
                  <path
                    d="M2 11 C 60 2, 150 1, 298 5 C 250 15, 120 19, 2 11 Z"
                    fill={GOLD}
                    fillOpacity="0.9"
                  />
                </svg>
              </span>
            </h1>

            <p
              className="hh-fade mt-7 sm:mt-8 max-w-xl mx-auto lg:mx-0
                         text-base sm:text-lg leading-[1.75]"
              style={{ color: ASH }}
            >
              {get('hero.description')}
            </p>

            {/* CTAs. One filled button and one text link — two equally weighted
                pills read as a pair of boxes and split the click. The fill is
                gold rather than green: it is the logo's third colour, it is the
                only warm thing in the composition, and on the ivory half it
                stays distinct from the green field instead of echoing it. Ink
                on the gold measures 7.9:1, better than the white-on-green it
                replaces. */}
            {/* flex-wrap, and neither label may break. At lg the copy column is
                a half-width col-span-6 with `pr-6` — about 470px at a 1024
                viewport — and the two CTAs plus their gap need ~500px, so both
                labels were breaking mid-phrase inside their own controls
                ("Explore / Programs"). Wrapping the row instead puts the
                WhatsApp link on its own line, which costs a row and keeps both
                labels legible. */}
            <div className="hh-fade mt-9 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap
                            items-center justify-center lg:justify-start gap-5 sm:gap-8">
              <Link
                ref={magnet}
                to={get('hero.ctaPrimaryLink')}
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5
                           whitespace-nowrap
                           rounded-full px-8 py-4 text-[0.95rem] font-semibold no-underline
                           shadow-[0_14px_34px_-14px_rgba(168,128,31,0.85)]
                           transition-shadow duration-300 hover:shadow-[0_20px_44px_-12px_rgba(168,128,31,0.95)]
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4
                           active:scale-[0.98] will-change-transform"
                style={{
                  background: `linear-gradient(128deg, ${GOLD_LIGHT} 0%, ${GOLD} 42%, #d9ae3c 100%)`,
                  color: INK,
                  outlineColor: GREEN,
                }}
              >
                {get('hero.ctaPrimary')}
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3.5 text-[0.95rem] font-semibold
                           whitespace-nowrap no-underline rounded-full py-1 pr-2
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{ color: GREEN, outlineColor: GOLD_DEEP }}
              >
                {/* 44px circle: the icon is the touch target on coarse pointers,
                    so it carries the minimum size on its own. */}
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white
                             shadow-[0_4px_14px_-4px_rgba(10,92,44,0.35)]
                             transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{ border: '1px solid rgba(168,128,31,0.35)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </span>
                <span className="relative">
                  {get('hero.ctaSecondary')}
                  {/* Underline wipes in from the left and out to the right, so
                      the hover has a direction instead of a blink. */}
                  <span
                    className="absolute -bottom-1 left-0 block h-px w-full origin-right scale-x-0
                               bg-current transition-transform duration-300
                               group-hover:origin-left group-hover:scale-x-100"
                  />
                </span>
              </a>
            </div>

            {/* Proof strip. A flex row with a small gold lozenge between entries
                rather than a three-column grid with hairline dividers: the
                dividers were the last box left in the hero, and the fixed
                three-up broke every label onto three lines at 375px. Wrapping
                lets a long label take its own row instead.

                dd before dt, and no sr-only duplicate: the previous markup
                carried the label twice — once in a visually hidden <dt> and
                again in the visible span — so a screen reader announced every
                stat as "Students Guided, 2000+, Students Guided". */}
            {stats.length > 0 && (
              <dl className="hh-fade mt-11 sm:mt-14 flex flex-wrap
                             justify-center lg:justify-start gap-x-9 sm:gap-x-12 gap-y-7">
                {stats.map((stat, i) => (
                  <div key={stat.value + stat.label} className="flex items-center gap-9 sm:gap-12">
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className="hidden sm:inline-block h-1.5 w-1.5 shrink-0 rotate-45"
                        style={{ background: GOLD_DEEP, opacity: 0.6 }}
                      />
                    )}
                    <div className="text-center lg:text-left">
                      <dd
                        className="m-0 font-['DM_Serif_Display',Georgia,serif]
                                   text-[2.1rem] sm:text-[2.6rem] tabular-nums leading-none"
                        style={{ color: GREEN }}
                      >
                        {stat.value}
                      </dd>
                      <dt
                        className="mt-2 text-[0.8rem] sm:text-[0.85rem] leading-snug"
                        style={{ color: ASH }}
                      >
                        {stat.label}
                      </dt>
                    </div>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Right column — the sun and the book cluster.
              Decorative: the covers repeat what the heading and the Books page
              already say, so they carry empty alt text and the stage is hidden
              from assistive tech rather than narrated twice. */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end" aria-hidden="true">
            <div
              className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[520px] aspect-[5/6]"
              style={{ perspective: '1400px' }}
            >
              {/* The brand field — below lg. Anchored to the stage vertically,
                  because the section's height depends on how long the CMS
                  description runs and a percentage offset would drift onto the
                  stat row.

                  Horizontally it is pinned to the viewport, not to the stage.
                  A stage-relative bleed (`-left-[26%] w-[152%]`) works at 375px
                  where the stage is the full column, but from 640px the stage
                  caps at 440px while the viewport keeps growing, so the same
                  percentages left ~50px of ivory down each side and the field
                  resolved into exactly the rectangle this hero is built to
                  avoid. `left-1/2` + a negative viewport margin is the
                  transform-free way to full-bleed out of a centred parent —
                  a centring `-translate-x-1/2` would be overwritten by the
                  `xPercent` entrance tween on this same element.

                  The viewBox runs to 480 rather than 400, with a matching
                  height bump, so the fill continues past the section's bottom
                  padding and gets clipped by its `overflow-hidden` instead of
                  ending on a hard horizontal edge. Both numbers scaled
                  together, so the top curve sits exactly where it did. */}
              <svg
                viewBox="0 0 400 480"
                preserveAspectRatio="none"
                className="hh-field lg:hidden absolute left-1/2 ml-[-50vw] w-screen
                           -top-[6%] h-[142%] will-change-transform"
              >
                <defs>
                  <linearGradient id="hh-fieldM" x1="0" y1="0" x2="0.9" y2="1">
                    <stop offset="0%" stopColor={GREEN} />
                    <stop offset="42%" stopColor={TEAL} />
                    <stop offset="100%" stopColor={BLUE} />
                  </linearGradient>
                  <radialGradient id="hh-fieldGlowM" cx="0.5" cy="0.38" r="0.6">
                    <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path d={FIELD_MOBILE} fill="url(#hh-fieldM)" />
                <path d={FIELD_MOBILE} fill="url(#hh-fieldGlowM)" />
              </svg>

              {/* The logo's sun, rebuilt at hero scale and set behind the books
                  so the covers are lit by the same source as the field. Its
                  rays are the pale gold rather than the deep one: they sit on
                  saturated colour here, not on cream.

                  Positioned with a left offset rather than -translate-x-1/2:
                  the ray ring's spin keyframe writes `transform`, which would
                  drop a centring translate on its first frame. */}
              <div className="hh-sun absolute left-[-15%] top-[-4%] w-[130%] aspect-square">
                <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible">
                  <defs>
                    <radialGradient id="hh-sun-core">
                      <stop offset="0%" stopColor="#fffdf2" />
                      <stop offset="52%" stopColor={GOLD_LIGHT} />
                      <stop offset="100%" stopColor={GOLD} />
                    </radialGradient>
                  </defs>
                  {/* Ray ring, rotating on its own axis. Alternating weights so
                      the fan has the logo's rhythm rather than reading as a
                      clock dial. */}
                  <g style={{ animation: 'hhSunSpin 90s linear infinite', transformOrigin: '100px 100px' }}>
                    {SUN_RAYS.map((angle) => (
                      <line
                        key={angle}
                        x1="100"
                        y1={angle % 30 === 0 ? 34 : 40}
                        x2="100"
                        y2={angle % 30 === 0 ? 12 : 20}
                        stroke={GOLD_LIGHT}
                        strokeOpacity={angle % 30 === 0 ? '0.85' : '0.45'}
                        strokeWidth={angle % 30 === 0 ? '3' : '1.6'}
                        strokeLinecap="round"
                        transform={`rotate(${angle} 100 100)`}
                      />
                    ))}
                  </g>
                  {/* Disc, breathing on a slower cycle than the rays turn, so
                      the two never sync into one motion. */}
                  <circle
                    cx="100" cy="100" r="46"
                    fill="url(#hh-sun-core)"
                    opacity="0.55"
                    style={{ animation: 'hhSunPulse 11s ease-in-out infinite', transformOrigin: '100px 100px' }}
                  />
                  <circle cx="100" cy="100" r="58" fill="none" stroke={GOLD_LIGHT} strokeOpacity="0.35" strokeWidth="1" />
                </svg>
              </div>

              {/* 3D Book Cluster */}
              <BookCluster3D />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
