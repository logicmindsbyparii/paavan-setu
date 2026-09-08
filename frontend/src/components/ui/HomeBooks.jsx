import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionEyebrow from './SectionEyebrow';
import CheckoutDialog from './CheckoutDialog';

import { useBooks, useSettings } from '../../hooks/useContent';
import { BOOKS, normalizeBook } from '../../constants/booksData';
import { brand, GRAIN } from '../../constants/brand';
import { colors as T } from '../../constants/tokens';

const textAccent = (c) => (c === T.amber ? '#8a5c0e' : c);

function FeaturedRow({ book, index, onBuy, whatsappNumber }) {
  const accent = textAccent(book.accentCol);
  const message = `I%27m%20interested%20in%20the%20book%3A%20${encodeURIComponent(book.title)}`;
  const flip = index % 2 === 1;
  const ordinal = String(index + 1).padStart(2, '0');

  return (
    <div className="hb-row group/row grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14 lg:gap-20">
      {/* ── Cover ── */}
      <div className={`relative ${flip ? 'md:order-2' : ''} md:col-span-6`}>
        <motion.div
          aria-hidden="true"
          animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.08, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-5 -top-5 hidden h-40 w-40 rounded-[2.5rem] opacity-70 sm:block origin-center"
          style={{ backgroundColor: book.accentBg }}
        />
        <div
          className="relative overflow-hidden rounded-[2rem]"
          style={{ boxShadow: '0 0 0 1px rgba(233,200,92,0.4), 0 30px 70px -36px rgba(15,35,23,0.55)' }}
        >
          <div className="aspect-[4/5] w-full overflow-hidden" style={{ backgroundColor: book.accentBg }}>
            <img
              src={book.image}
              alt={`Cover of ${book.title}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/row:scale-[1.04]"
              style={book.imageStyle || {}}
            />
          </div>
          {book.tag && (
            <span
              className="absolute left-5 top-5 rounded-full px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
              style={{
                background: '#ffffff',
                color: textAccent(book.tagCol || book.accentCol),
                border: `1px solid ${book.tagBorder || book.accentBorder}`,
                boxShadow: '0 8px 18px rgba(15,35,23,0.14)',
              }}
            >
              {book.tag}
            </span>
          )}
        </div>
      </div>

      {/* ── Copy ── */}
      <div className={`relative md:col-span-6 ${flip ? 'md:order-1' : ''}`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 right-2 select-none font-['DM_Serif_Display',Georgia,serif] text-[6rem] leading-none opacity-[0.08] md:-top-14 md:text-[8rem]"
          style={{ color: accent }}
        >
          {ordinal}
        </span>

        <p
          className="text-[0.72rem] font-bold uppercase tracking-[0.16em]"
          style={{ color: accent, fontFamily: "'DM Sans', sans-serif" }}
        >
          {book.subtitle || 'Paavan Setu Publication'}
        </p>

        <h3
          className="mt-3 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.1rem,3.6vw,3.2rem)] leading-[1.08] tracking-[-0.015em]"
          style={{ color: brand.ink }}
        >
          {book.title}
        </h3>

        <p className="mt-5 max-w-xl text-base leading-[1.8] sm:text-[1.08rem]" style={{ color: brand.ash }}>
          {book.description}
        </p>

        <div className="mt-7 flex items-baseline gap-3">
          <span className="text-[1.9rem] font-bold leading-none tabular-nums" style={{ color: brand.ink, fontFamily: "'DM Sans', sans-serif" }}>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {book.purchasable ? 'Ask on WhatsApp' : 'Order on WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomeBooks() {
  const booksQuery = useBooks(BOOKS);
  const settings = useSettings();
  const allBooks = (booksQuery.data || []).map(normalizeBook);
  const featured = allBooks.slice(0, 4);
  const [checkoutBook, setCheckoutBook] = useState(null);

  const whatsappNumber = settings.get('contact.whatsapp', '916351113766');

  if (featured.length === 0) return null;

  const revealVariants = {
    hidden: { opacity: 0, y: 46 },
    visible: (i = 0) => ({
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.9,
        delay: (i % 2) * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <section
      className="hb-section relative isolate overflow-hidden px-6 py-24 md:py-36"
      aria-labelledby="home-books-heading"
      style={{ backgroundColor: '#fffdf8' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(50% 42% at 10% 90%, rgba(233,200,92,0.14) 0%, rgba(233,200,92,0) 64%)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div 
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-12%" }}
          variants={revealVariants}
          className="mb-16 grid grid-cols-1 items-end gap-6 md:mb-24 md:grid-cols-12 md:gap-10"
        >
          <div className="md:col-span-7">
            <h2
              id="home-books-heading"
              className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,4.6vw,3.8rem)] leading-[1.06] tracking-[-0.015em]"
              style={{ color: brand.ink }}
            >
              Wisdom for{' '}
              <em className="italic" style={{ color: brand.green }}>young minds.</em>
            </h2>
          </div>
          <div className="md:col-span-5 md:pb-2">
            <p className="text-base leading-[1.75] sm:text-lg" style={{ color: brand.ash }}>
              A curated selection of value-education books — written for children,
              used in classrooms, and loved at home.
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-20 md:gap-28 lg:gap-32">
          {featured.map((book, i) => (
            <motion.div 
              key={book.key} 
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-12%" }}
              variants={revealVariants}
            >
              <FeaturedRow
                book={book}
                index={i}
                onBuy={setCheckoutBook}
                whatsappNumber={whatsappNumber}
              />
            </motion.div>
          ))}
        </div>

        <motion.div 
          custom={featured.length + 1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-12%" }}
          variants={revealVariants}
          className="mt-20 flex justify-center md:mt-28"
        >
          <Link
            to="/books"
            className="group inline-flex items-center gap-2.5 px-3 py-2 text-[1.05rem] font-semibold no-underline transition-colors duration-300"
            style={{ color: brand.green }}
          >
            View the complete collection
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </motion.div>
      </div>

      <CheckoutDialog book={checkoutBook} onClose={() => setCheckoutBook(null)} />
    </section>
  );
}
