import React, { useState } from 'react';
import { gsap, useRevealAnimation } from '../lib/motion';

import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SchoolIcon from '@mui/icons-material/School';
import GrassIcon from '@mui/icons-material/Grass';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaidIcon from '@mui/icons-material/Paid';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import { useBooks, useSettings } from '../hooks/useContent';
import { colors as T } from '../constants/tokens';
import { brand, FIELD_GRADIENT, GRAIN } from '../constants/brand';
import { WHATSAPP_NUMBER } from '../constants/urls';

import { BOOKS, normalizeBook } from '../constants/booksData';
import BooksHero from '../components/ui/BooksHero';
import SectionHead from '../components/ui/SectionHead';
import SectionEyebrow from '../components/ui/SectionEyebrow';
import CheckoutDialog from '../components/ui/CheckoutDialog';

/* Amber #b06e10 holds ~4.1:1 on white — fine for display type and decorative
   accents, not for small text. Small amber text maps to a darker brown that
   clears 4.5:1 on every light surface (#8a5c0e = 5.8:1). */
const textAccent = (c) => (c === T.amber ? '#8a5c0e' : c);

/* ─── DATA ─────────────────────────────────────────────────────────────── */

const PROOFS = [
  { Icon: EditNoteIcon,  title: 'Author-Led',      desc: 'Each book is crafted and personally reviewed by Shweta Kothari, founder of Paavan Setu.',   tone: T.green,  tint: 'rgba(10,92,44,0.08)',   line: T.greenMid },
  { Icon: SchoolIcon,    title: 'School-Adopted',  desc: 'Used as curriculum material in 50+ schools across Gujarat and beyond.',                    tone: T.blue,   tint: 'rgba(23,74,114,0.08)',  line: T.blueMid },
  { Icon: GrassIcon,     title: 'Value-Based',     desc: 'Every book weaves together character-building, cultural roots, and practical life lessons.', tone: '#8a5c0e', tint: 'rgba(176,110,16,0.1)', line: T.amberMid },
  { Icon: ChildCareIcon, title: 'Age-Appropriate', desc: 'Thoughtfully designed for each developmental stage — from early learners to teens.',       tone: T.green,  tint: 'rgba(10,92,44,0.08)',   line: T.greenMid },
];

const BULK_FEATURES = [
  { Icon: InventoryIcon,     label: 'Sample Books' },
  { Icon: PaidIcon,          label: 'Bulk Pricing' },
  { Icon: SchoolIcon,        label: 'Curriculum Support' },
  { Icon: LocalShippingIcon, label: 'Pan-India Delivery' },
];

const ORDER_TRUST = ['Free sample on request', 'Ships across India', '50+ schools trust us'];

/* ─── COMPONENTS ───────────────────────────────────────────────────────── */

/**
 * One book on the shelf.
 *
 * Visual: the cover on the book's own pastel wash with a white tag chip floated
 * over it — the same chip HomeBooks uses, so a cover reads identically wherever
 * it appears. Content: subtitle micro-caps, serif title, a three-line
 * description, the price pair, and the actions pinned to the card's foot so
 * every row of the grid lines its buttons up.
 */
function BookCard({ book, onBuy, whatsappNumber }) {
  const accent = textAccent(book.accentCol);
  const message = `I%27m%20interested%20in%20the%20book%3A%20${encodeURIComponent(book.title)}`;

  return (
    <article
      className="bk-rv-book opacity-0 group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white transition-all duration-500 hover:-translate-y-1.5"
      style={{ boxShadow: '0 0 0 1px rgba(15,35,23,0.05), 0 16px 44px -34px rgba(15,35,23,0.5)' }}
    >
      {/* Tone bloom on hover, low-right. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(70% 60% at 85% 100%, ${book.accentBg} 0%, transparent 70%)` }}
      />
      {/* Gold hairline along the bottom — a direction for the hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: brand.gold, opacity: 0.8 }}
      />

      {/* Cover */}
      <div className="relative m-4 mb-0 overflow-hidden rounded-[1.25rem] sm:m-5 sm:mb-0">
        {/* The pastel wash sits on the frame, not the image: a cover with
            transparency (the Gujarati series) keeps its tone behind it, and a
            missing cover degrades to the wash instead of white. */}
        <div className="aspect-[2/3] w-full overflow-hidden" style={{ backgroundColor: book.accentBg }}>
          <img
            src={book.image}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={book.imageStyle || {}}
          />
        </div>
        {book.tag && (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em]"
            style={{
              background: '#ffffff',
              color: textAccent(book.tagCol || book.accentCol),
              border: `1px solid ${book.tagBorder || book.accentBorder}`,
              boxShadow: '0 6px 16px rgba(15,35,23,0.12)',
            }}
          >
            {book.tag}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 pt-4 sm:p-6 sm:pt-5">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
          {book.subtitle || 'Paavan Setu Publication'}
        </p>
        <h3
          className="mt-1.5 font-['DM_Serif_Display',Georgia,serif] text-[1.5rem] leading-[1.12] tracking-[-0.01em]"
          style={{ color: brand.ink }}
        >
          {book.title}
        </h3>
        <p className="mt-2.5 line-clamp-3 text-[0.92rem] leading-relaxed" style={{ color: brand.ash }}>
          {book.description}
        </p>

        {/* Price pair */}
        <div className="mt-auto flex items-baseline gap-2 pt-5">
          <span
            className="text-[1.4rem] font-bold leading-none tabular-nums"
            style={{ color: brand.ink, fontFamily: "'DM Sans', sans-serif" }}
          >
            ₹{book.price}
          </span>
          {book.listPrice && (
            <span className="text-[1rem] font-medium leading-none line-through opacity-50" style={{ color: brand.ash }}>
              ₹{book.listPrice}
            </span>
          )}
        </div>

        {/* Actions. When the book is purchasable the WhatsApp action collapses
            to a 44px icon target so the two controls share one row even inside
            a two-column card at 640px; otherwise the WhatsApp control takes the
            full width as the primary ask. */}
        {book.purchasable ? (
          <div className="mt-4 flex items-center gap-2.5">
            <button
              onClick={() => onBuy(book)}
              className="h-12 flex-1 rounded-full text-[0.95rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ backgroundColor: brand.ink, color: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = book.accentCol; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = brand.ink; }}
            >
              Buy Now
            </button>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${message}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Order ${book.title} on WhatsApp`}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border transition-all duration-300 hover:-translate-y-0.5"
              style={{ borderColor: 'rgba(15,35,23,0.18)', color: accent }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = book.accentBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <WhatsAppIcon sx={{ fontSize: 21 }} aria-hidden="true" />
            </a>
          </div>
        ) : (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-full border text-[0.95rem] font-semibold no-underline transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ borderColor: 'rgba(15,35,23,0.18)', color: brand.ink }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,35,23,0.18)'; e.currentTarget.style.color = brand.ink; }}
          >
            <WhatsAppIcon sx={{ fontSize: 18 }} aria-hidden="true" />
            Order on WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}

/**
 * The lead book, promoted to a full-width editorial row so the shelf below it
 * (10 − 1 = 9) resolves into a clean 3×3 instead of a trailing orphan card.
 * Same fields, same actions as the grid cards — larger stage.
 */
function LeadCard({ book, onBuy, whatsappNumber }) {
  const accent = textAccent(book.accentCol);
  const message = `I%27m%20interested%20in%20the%20book%3A%20${encodeURIComponent(book.title)}`;

  return (
    <article
      className="bk-rv-book opacity-0 group relative flex flex-col overflow-hidden rounded-[2rem] bg-white transition-all duration-500 hover:-translate-y-1 md:flex-row"
      style={{ boxShadow: '0 0 0 1px rgba(15,35,23,0.05), 0 24px 60px -40px rgba(15,35,23,0.6)' }}
    >
      {/* Cover — fills the row's height on desktop, a 3:4 panel on mobile. */}
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden md:aspect-auto md:w-[42%]" style={{ backgroundColor: book.accentBg }}>
        <img
          src={book.image}
          alt={`Cover of ${book.title}`}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          style={book.imageStyle || {}}
        />
        {book.tag && (
          <span
            className="absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
            style={{
              background: '#ffffff',
              color: textAccent(book.tagCol || book.accentCol),
              border: `1px solid ${book.tagBorder || book.accentBorder}`,
              boxShadow: '0 6px 16px rgba(15,35,23,0.12)',
            }}
          >
            {book.tag}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 lg:p-12">
        <p className="text-[0.74rem] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
          {book.subtitle || 'Paavan Setu Publication'}
        </p>
        <h3
          className="mt-2 font-['DM_Serif_Display',Georgia,serif] text-[clamp(1.9rem,3vw,2.7rem)] leading-[1.1] tracking-[-0.01em]"
          style={{ color: brand.ink }}
        >
          {book.title}
        </h3>
        <p className="mt-4 max-w-2xl text-base leading-[1.8] sm:text-[1.05rem]" style={{ color: brand.ash }}>
          {book.description}
        </p>

        <div className="mt-7 flex items-baseline gap-3">
          <span className="text-[2rem] font-bold leading-none tabular-nums" style={{ color: brand.ink, fontFamily: "'DM Sans', sans-serif" }}>
            ₹{book.price}
          </span>
          {book.listPrice && (
            <span className="text-lg font-medium leading-none line-through opacity-50" style={{ color: brand.ash }}>
              ₹{book.listPrice}
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {book.purchasable && (
            <button
              onClick={() => onBuy(book)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-9 py-4 text-[1rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ backgroundColor: brand.ink, color: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = book.accentCol; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = brand.ink; }}
            >
              Buy Now
            </button>
          )}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-8 py-4 text-[1rem] font-semibold no-underline transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ borderColor: 'rgba(15,35,23,0.18)', color: brand.ink }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,35,23,0.18)'; e.currentTarget.style.color = brand.ink; }}
          >
            <WhatsAppIcon sx={{ fontSize: 18 }} aria-hidden="true" />
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

/* ─── PAGE ─────────────────────────────────────────────────────────────── */

export default function Books() {
  const booksQuery = useBooks(BOOKS);
  const settings = useSettings();
  const books = (booksQuery.data || []).map(normalizeBook);
  const [checkoutBook, setCheckoutBook] = useState(null);

  /* Swapping the bundled fallback for API data remounts every card (the keys
     change from local-N to the database id). Keying the reveal on the list
     identity — not its length — makes GSAP re-run against the new nodes
     instead of animating detached ones. */
  const booksKey = books.map((b) => b.key).join(',');
  const whatsappNumber = settings.get('contact.whatsapp', '916351113766');

  /* Split contexts so independent sections don't flash when API updates booksKey */
  const scopeStatic = useRevealAnimation(
    () => {
      gsap.utils.toArray('.bk-rv').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 34 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: (i % 3) * 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });
    },
    [],
    ['.bk-rv']
  );

  const scopeBooks = useRevealAnimation(
    () => {
      gsap.utils.toArray('.bk-rv-book').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 34 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: (i % 3) * 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });
    },
    [booksKey, booksQuery.loading],
    ['.bk-rv-book']
  );

  return (
    <div ref={scopeStatic} className="w-full max-w-full overflow-x-hidden">
      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <BooksHero />

      {/* ══ WHY OUR BOOKS — paper ═════════════════════════════════════════ */}
      <section
        className="relative isolate overflow-hidden px-6 py-24 md:py-36"
        aria-labelledby="bk-why-heading"
        style={{ backgroundColor: brand.ivoryLit }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(52% 42% at 92% 4%, rgba(233,200,92,0.16) 0%, rgba(233,200,92,0) 62%)' }} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="bk-rv opacity-0">
            <SectionHead
              id="bk-why-heading"
              title="Books that"
              accent="inspire"
              accentColor={T.amber}
              lead="Every title is written, illustrated and reviewed with a single question in mind — will this help a child grow?"
              className="mb-14 md:mb-20"
            />
          </div>

          {/* Broken two-up grid: the even cards drop a row, so the four proofs
              read as an editorial list rather than a uniform tile farm. */}
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:gap-6">
            {PROOFS.map((p, i) => {
              const Icon = p.Icon;
              return (
                <div key={p.title} className={`bk-rv opacity-0 ${i % 2 === 1 ? 'md:mt-16' : ''}`}>
                  <article
                    className="group relative flex min-h-[13rem] items-start gap-6 overflow-hidden rounded-[1.75rem] bg-white p-7 transition-all duration-500 hover:-translate-y-1 sm:items-center sm:p-9"
                    style={{ boxShadow: '0 0 0 1px rgba(15,35,23,0.05), 0 18px 44px -34px rgba(15,35,23,0.5)' }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: p.tint }}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                      style={{ background: p.line, opacity: 0.7 }}
                    />
                    <span
                      className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
                      style={{ backgroundColor: p.tint, color: p.tone }}
                    >
                      <Icon sx={{ fontSize: 28 }} />
                    </span>
                    <div className="relative z-10 min-w-0">
                      <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl leading-tight" style={{ color: brand.ink }}>
                        {p.title}
                      </h3>
                      <p className="mt-2 text-[0.98rem] leading-relaxed" style={{ color: brand.ash }}>
                        {p.desc}
                      </p>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ THE SHELF — full collection ═══════════════════════════════════ */}
      <section
        ref={scopeBooks}
        id="books-collection"
        className="relative isolate overflow-hidden bg-white px-6 py-24 md:py-36"
        aria-labelledby="bk-collection-heading"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(50% 40% at 6% 92%, rgba(233,200,92,0.12) 0%, rgba(233,200,92,0) 62%)' }} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="bk-rv opacity-0">
            <SectionHead
              id="bk-collection-heading"
              title="Browse the"
              accent="collection"
              accentColor={brand.green}
              lead="Each book is available for individual purchase or bulk school orders."
              className="mb-12 md:mb-16"
            />
          </div>

          {/* Skeleton — mirrors the card grid so loading does not shift layout. */}
          {booksQuery.loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((n) => (
                <div key={n} className="animate-pulse overflow-hidden rounded-[1.75rem] bg-white" style={{ boxShadow: '0 0 0 1px rgba(15,35,23,0.05)' }}>
                  <div className="m-5 mb-0 aspect-[2/3] rounded-[1.25rem]" style={{ backgroundColor: brand.ivoryDeep }} />
                  <div className="space-y-3 p-6 pt-5">
                    <div className="h-3 w-1/3 rounded" style={{ backgroundColor: brand.ivoryDeep }} />
                    <div className="h-6 w-2/3 rounded" style={{ backgroundColor: brand.ivoryDeep }} />
                    <div className="h-3 w-full rounded" style={{ backgroundColor: brand.ivoryDeep }} />
                    <div className="h-3 w-4/5 rounded" style={{ backgroundColor: brand.ivoryDeep }} />
                    <div className="h-12 w-full rounded-full" style={{ backgroundColor: brand.ivoryDeep }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!booksQuery.loading && books.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                {books.map((book, i) =>
                  i === 0 ? (
                    /* Full-width lead row, then the shelf: 10 books becomes
                       1 + 3×3 instead of 3×3+1 with a stranded card. */
                    <div key={book.key} className="sm:col-span-2 lg:col-span-3">
                      <LeadCard book={book} onBuy={setCheckoutBook} whatsappNumber={whatsappNumber} />
                    </div>
                  ) : (
                    <BookCard
                      key={book.key}
                      book={book}
                      onBuy={setCheckoutBook}
                      whatsappNumber={whatsappNumber}
                    />
                  )
                )}
              </div>

              {/* Help choosing — the quiet ask under the shelf. */}
              <div className="bk-rv-book opacity-0 mt-16 flex flex-col items-center gap-4 text-center">
                <p className="text-[1.05rem] leading-relaxed" style={{ color: brand.ash }}>
                  Not sure which book fits your child&rsquo;s age?
                </p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I'd like help choosing the right book for my child.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-3 rounded-full py-1 pr-3 text-[0.95rem] font-semibold no-underline transition-colors duration-300"
                  style={{ color: brand.green }}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_14px_-4px_rgba(10,92,44,0.3)] transition-transform duration-300 group-hover:-translate-y-0.5" style={{ border: '1px solid rgba(168,128,31,0.35)' }}>
                    <WhatsAppIcon sx={{ fontSize: 18 }} aria-hidden="true" />
                  </span>
                  Ask us on WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══ SCHOOL ORDERS — the field, entered through a curve ════════════ */}
      <section
        className="relative isolate overflow-hidden px-6 py-24 text-center md:py-36"
        style={{ background: FIELD_GRADIENT }}
        aria-labelledby="bk-bulk-heading"
      >
        {/* Top curve cut out of the white collection above. */}
        <svg aria-hidden="true" viewBox="0 0 1440 110" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-[48px] w-full md:h-[90px]">
          <path d="M0,0 L1440,0 L1440,22 C1090,104 350,-22 0,58 Z" fill="#ffffff" />
          <path d="M1440,22 C1090,104 350,-22 0,58" fill="none" stroke={brand.gold} strokeOpacity="0.5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Warm light from the sun's side. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(58% 46% at 84% 8%, rgba(247,230,174,0.2) 0%, rgba(247,230,174,0) 62%)' }} />

        <div className="bk-rv opacity-0 relative z-10 mx-auto max-w-4xl">
          <h2
            id="bk-bulk-heading"
            className="mt-6 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,5.2vw,4.2rem)] leading-[1.06] tracking-[-0.015em] text-white"
          >
            Bring values to{' '}
            <em className="italic" style={{ color: brand.goldLight }}>your school</em>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.8]" style={{ color: 'rgba(253,250,243,0.78)' }}>
            We partner with educational institutions to provide specialised curriculum
            integration, sample materials, and comprehensive teacher support.
          </p>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {BULK_FEATURES.map((f) => {
              const Icon = f.Icon;
              return (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <Icon sx={{ fontSize: 30, color: brand.goldLight }} />
                  <span className="text-[0.85rem] font-semibold leading-snug text-white/85">{f.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("I'd like to request a sample book for my school.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-9 py-4 text-[1rem] font-semibold no-underline shadow-[0_18px_44px_-14px_rgba(168,128,31,0.8)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_-12px_rgba(233,200,92,0.9)] active:scale-[0.98]"
              style={{ background: `linear-gradient(128deg, ${brand.goldLight} 0%, ${brand.gold} 45%, #d9ae3c 100%)`, color: brand.ink }}
            >
              <WhatsAppIcon sx={{ fontSize: 19 }} aria-hidden="true" />
              Request School Sample
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("I'd like to enquire about bulk book orders.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-9 py-4 text-[1rem] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-1 hover:border-white/60 hover:bg-white/5 active:scale-[0.98]"
              style={{ borderColor: 'rgba(253,250,243,0.35)' }}
            >
              Enquire Bulk Orders
            </a>
          </div>
        </div>
      </section>

      {/* ══ CLOSING CTA — ivory, one ask ══════════════════════════════════ */}
      <section
        className="relative isolate overflow-hidden px-6 py-28 text-center md:py-40"
        aria-labelledby="bk-cta-heading"
        style={{ backgroundColor: brand.ivory }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(54% 46% at 8% 92%, rgba(233,200,92,0.2) 0%, rgba(233,200,92,0) 62%)' }} />
        </div>

        <div className="bk-rv opacity-0 relative z-10 mx-auto flex max-w-2xl flex-col items-center">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: brand.green }}>
            Begin with a book
          </p>
          <h2
            id="bk-cta-heading"
            className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.6rem,5.6vw,4.4rem)] leading-[1.06] tracking-[-0.015em]"
            style={{ color: brand.ink }}
          >
            Ready to{' '}
            <em className="italic" style={{ color: brand.green }}>read?</em>
          </h2>

          {/* Gold swash — one pass of a brush under the italic word. */}
          <svg aria-hidden="true" viewBox="0 0 300 20" preserveAspectRatio="none" className="mt-4 h-[0.3em] w-[min(18rem,64%)]">
            <path d="M2 11 C 60 2, 150 1, 298 5 C 250 15, 120 19, 2 11 Z" fill={brand.gold} fillOpacity="0.85" />
          </svg>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-[1.8]" style={{ color: brand.ash }}>
            Drop us a message and we will share more details, sample pages,
            or arrange a school visit.
          </p>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="group mt-10 inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full px-12 py-5 text-[1.05rem] font-semibold no-underline shadow-[0_16px_40px_-14px_rgba(168,128,31,0.8)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_-12px_rgba(233,200,92,0.95)] active:scale-[0.98]"
            style={{ background: `linear-gradient(128deg, ${brand.goldLight} 0%, ${brand.gold} 45%, #d9ae3c 100%)`, color: '#0f2317' }}
          >
            <WhatsAppIcon sx={{ fontSize: 20 }} aria-hidden="true" />
            Chat on WhatsApp
          </a>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {ORDER_TRUST.map((t) => (
              <div key={t} className="flex items-center gap-2 text-[0.88rem] font-semibold" style={{ color: brand.ash }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 18, color: brand.green }} aria-hidden="true" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CheckoutDialog book={checkoutBook} onClose={() => setCheckoutBook(null)} />
    </div>
  );
}
