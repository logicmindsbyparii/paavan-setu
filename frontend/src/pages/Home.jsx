import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useContent';
import { getTestimonials } from '../lib/api';
import HomeHero from '../components/ui/HomeHero';
import HomeWhy from '../components/ui/HomeWhy';
import HomeBooks from '../components/ui/HomeBooks';
import HomeTestimonials from '../components/ui/HomeTestimonials';
import HomeCta from '../components/ui/HomeCta';

/**
 * Homepage.
 *
 * This file is now composition and data only — every section owns its own
 * markup, palette and GSAP context. That split exists because the page's
 * problem was never any single section: it was that all five were declared in
 * one 400-line render, each reaching for whatever heading size and background
 * seemed right at the time, and the result read as five templates stacked up.
 */

/* ─── DEFAULT FALLBACK CONTENT ───────────────────────────────────────────── */

const DEFAULT_SETTINGS = {
  'hero.badge': 'Bridging Values with Education',
  'hero.title.line1': 'Building Character Through',
  'hero.title.line2': 'Education',
  'hero.description':
    'Nurturing minds and building character across generations. We combine academic excellence with value-based learning to create well-rounded individuals ready for a meaningful future.',
  'hero.ctaPrimary': 'Explore Programs',
  'hero.ctaPrimaryLink': '/schools-workshops',
  'hero.ctaSecondary': 'Contact via WhatsApp',
  'services.title': 'Guidance that meets a student where they are',
  'services.description':
    'Comprehensive solutions designed to help students discover their true potential and build a strong foundation for the future.',
  'services.items': JSON.stringify([
    { title: 'Career Counselling', desc: 'Personalised one-on-one sessions using psychometric tools.', link: '/career-counselling', colSpan: 'md:col-span-6 md:row-span-2', bg: 'bg-brand-green-light', tone: 'green' },
    { title: 'Value Books', desc: 'Thoughtfully authored books bridging academics with life values.', link: '/books', colSpan: 'md:col-span-3', bg: 'bg-brand-blue-light', tone: 'blue' },
    { title: 'Schools & Workshops', desc: 'Interactive workshops instilling discipline and empathy.', link: '/schools-workshops', colSpan: 'md:col-span-3', bg: 'bg-brand-amber-light', tone: 'amber' },
    { title: 'DMIT Assessment', desc: "Understand a student's innate strengths.", link: '/about', colSpan: 'md:col-span-6', bg: 'bg-brand-green-light', tone: 'green' },
  ]),
  'homepage.whyTitle': 'Why Choose Paavan Setu for your future?',
  'homepage.whyDescription':
    'At Paavan Setu, we believe that true education goes beyond textbooks. We combine academic excellence with value-based learning to create well-rounded individuals ready to make a positive impact on society.',
  'homepage.achievements': JSON.stringify([
    '2000+ Students Guided',
    '20+ Partner Schools',
    '10 Published Books',
    '98% Satisfaction Rate',
  ]),
  'homepage.testimonials': JSON.stringify([
    { name: 'Riya Sharma', role: 'Student', text: 'The counselling session changed my perspective completely.' },
    { name: 'Anil Mehta', role: 'Parent', text: 'Paavan SETU helped my son discover his passion for design.' },
    { name: 'Priya Patel', role: 'Teacher', text: 'The school workshop was engaging, practical and truly impactful.' },
    { name: 'Raj Kumar', role: 'Student', text: 'Amazing psychometric tools.' },
    { name: 'Sneha Gupta', role: 'Parent', text: 'Highly recommend their value education books.' },
  ]),
  'testimonials.title': 'Trusted by Parents & Students',
  'cta.title': 'Ready to Begin?',
  'cta.description':
    'Book a personalised career counselling session today and take the first step towards a meaningful, confident future.',
  'cta.button': 'Book a Session',
  'cta.buttonLink': '/contact',
};

const FALLBACKS = {
  services: JSON.parse(DEFAULT_SETTINGS['services.items']),
  testimonials: JSON.parse(DEFAULT_SETTINGS['homepage.testimonials']),
  achievements: JSON.parse(DEFAULT_SETTINGS['homepage.achievements']),
};

function parseJson(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) || (parsed && typeof parsed === 'object') ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/* ─── HOME COMPONENT ──────────────────────────────────────────────────────── */
export default function Home() {
  const { get } = useSettings(DEFAULT_SETTINGS);
  const [dynamicTestimonials, setDynamicTestimonials] = useState([]);

  useEffect(() => {
    getTestimonials()
      .then((data) => {
        const testims = Array.isArray(data) ? data : data?.data ?? [];
        setDynamicTestimonials(testims.filter((t) => t.isActive));
      })
      .catch((err) => console.error('Failed to load testimonials:', err));
  }, []);

  const services = parseJson(get('services.items'), FALLBACKS.services);
  const staticTestimonials = parseJson(get('homepage.testimonials'), FALLBACKS.testimonials);
  const achievements = parseJson(get('homepage.achievements'), FALLBACKS.achievements);

  const displayTestimonials =
    dynamicTestimonials.length > 0 ? dynamicTestimonials : staticTestimonials;

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white">
      <HomeHero get={get} achievements={achievements} />

      <HomeBooks />

      <HomeWhy
        title={get('homepage.whyTitle')}
        description={get('homepage.whyDescription')}
        achievements={achievements}
      />

      <HomeTestimonials title={get('testimonials.title')} testimonials={displayTestimonials} />

      <HomeCta
        title={get('cta.title')}
        description={get('cta.description')}
        ctaLabel={get('cta.button')}
        ctaLink={get('cta.buttonLink')}
        whatsappLabel={get('hero.ctaSecondary')}
      />
    </div>
  );
}
