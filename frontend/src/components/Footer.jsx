import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useSettings } from '../hooks/useContent';
import { SOCIAL, CONTACT, WHATSAPP_MESSAGES, WHATSAPP_BASE, WHATSAPP_NUMBER } from '../constants/urls';
import { brand } from '../constants/brand';
import logo from '../assets/logo_final.png';

const DEFAULT_SETTINGS = {
  'general.tagline': 'Bridging Values with Education',
  'footer.about':
    'Helping students find clarity, confidence, and direction through career counselling, value education, and holistic learning.',
  'footer.copyright': `© ${new Date().getFullYear()} Paavan Setu. All rights reserved.`,
  'contact.phone': CONTACT.phone,
  'contact.email': CONTACT.email,
  'contact.address': CONTACT.address.full.replace(/, /g, ',\n'),
  'contact.whatsapp': WHATSAPP_NUMBER,
  'social.instagram': SOCIAL.instagram,
  'social.facebook': SOCIAL.facebook,
  'social.youtube': '',
};

const EXPLORE_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Career Counselling', path: '/career-counselling' },
  { label: 'Psychometric Tests', path: '/test' },
  { label: 'Books', path: '/books' },
  { label: 'Schools & Workshops', path: '/schools-workshops' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Footer() {
  const { get } = useSettings(DEFAULT_SETTINGS);

  const whatsappNumber = get('contact.whatsapp');
  const whatsappUrl = `${WHATSAPP_BASE}/${whatsappNumber}?text=${encodeURIComponent(
    WHATSAPP_MESSAGES.general
  )}`;

  const socials = [
    { icon: InstagramIcon, href: get('social.instagram'), label: 'Instagram', hover: brand.goldLight },
    { icon: FacebookIcon, href: get('social.facebook'), label: 'Facebook', hover: brand.goldLight },
    { icon: YouTubeIcon, href: get('social.youtube'), label: 'YouTube', hover: brand.goldLight },
    { icon: WhatsAppIcon, href: whatsappUrl, label: 'WhatsApp', hover: brand.goldLight },
  ].filter((s) => s.href);

  const addressLines = String(get('contact.address')).split('\n').filter(Boolean);

  return (
    <footer 
      className="relative text-white overflow-hidden" 
      style={{ backgroundColor: brand.ink }}
    >
      <div className="mx-auto max-w-[88rem] px-6 py-20 md:px-12 lg:py-32">
        <div className="grid gap-16 md:grid-cols-12 md:gap-12 lg:gap-16">
          
          {/* Brand & About */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link to="/" className="inline-block mb-10 group">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                <img src={logo} alt="Paavan Setu Logo" className="h-16 w-auto object-contain" />
              </div>
            </Link>
            
            <h3 
              className="mb-3 text-4xl font-['DM_Serif_Display',Georgia,serif] tracking-wide" 
              style={{ color: brand.ivoryLit }}
            >
              Paavan Setu
            </h3>
            <p 
              className="mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em]" 
              style={{ color: brand.goldLight }}
            >
              {get('general.tagline')}
            </p>
            <p 
              className="mb-10 max-w-sm text-[1.05rem] leading-[1.6]" 
              style={{ color: 'rgba(253,250,243,0.7)' }}
            >
              {get('footer.about')}
            </p>

            <div className="flex gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="group relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-1"
                  style={{ 
                    borderColor: 'rgba(253,250,243,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = s.hover;
                    e.currentTarget.style.backgroundColor = s.hover;
                    e.currentTarget.style.color = brand.ink;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(253,250,243,0.15)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <s.icon sx={{ fontSize: 20 }} className="text-white/80 transition-colors duration-300 group-hover:text-inherit" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-1 hidden md:block"></div>

          {/* Explore */}
          <div className="md:col-span-3">
            <h4 
              className="mb-8 text-[0.75rem] font-bold uppercase tracking-[0.2em]"
              style={{ color: brand.goldLight }}
            >
              Explore
            </h4>
            <ul className="space-y-4">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-4 py-1.5 text-[1.05rem] transition-colors duration-300"
                    style={{ color: 'rgba(253,250,243,0.7)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = brand.ivoryLit;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(253,250,243,0.7)';
                    }}
                  >
                    <span 
                      className="inline-block h-[1px] w-0 bg-current transition-all duration-300 group-hover:w-6" 
                      style={{ backgroundColor: brand.goldLight }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h4 
              className="mb-8 text-[0.75rem] font-bold uppercase tracking-[0.2em]"
              style={{ color: brand.goldLight }}
            >
              Contact
            </h4>
            <ul className="space-y-8">
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(253,250,243,0.05)' }}>
                  <Phone size={16} style={{ color: brand.goldLight }} />
                </div>
                <div>
                  <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(253,250,243,0.6)' }}>Phone</p>
                  <a href={`tel:${String(get('contact.phone')).replace(/[^+\d]/g, '')}`} className="text-[1.05rem] font-medium transition-colors hover:text-white" style={{ color: brand.ivoryLit }}>
                    {get('contact.phone')}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(253,250,243,0.05)' }}>
                  <Mail size={16} style={{ color: brand.goldLight }} />
                </div>
                <div>
                  <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(253,250,243,0.6)' }}>Email</p>
                  <a href={`mailto:${get('contact.email')}`} className="break-all text-[1.05rem] font-medium transition-colors hover:text-white" style={{ color: brand.ivoryLit }}>
                    {get('contact.email')}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(253,250,243,0.05)' }}>
                  <MapPin size={16} style={{ color: brand.goldLight }} />
                </div>
                <div>
                  <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(253,250,243,0.6)' }}>Address</p>
                  <p className="text-[1.05rem] font-medium leading-[1.6]" style={{ color: brand.ivoryLit }}>
                    {addressLines.map((line, i) => (
                      <React.Fragment key={line}>
                        {line}
                        {i < addressLines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="relative border-t" 
        style={{ borderColor: 'rgba(253,250,243,0.08)' }}
      >
        <div className="mx-auto flex max-w-[88rem] flex-col items-center gap-6 px-6 py-10 md:flex-row md:justify-between md:px-12">
          <p className="text-[0.85rem] tracking-wide" style={{ color: 'rgba(253,250,243,0.5)' }}>
            {get('footer.copyright')}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3" aria-label="Legal">
            <Link to="/privacy" className="py-1 text-[0.85rem] tracking-wide transition-colors duration-300 hover:text-white" style={{ color: 'rgba(253,250,243,0.5)' }}>
              Privacy Policy
            </Link>
            <Link to="/terms" className="py-1 text-[0.85rem] tracking-wide transition-colors duration-300 hover:text-white" style={{ color: 'rgba(253,250,243,0.5)' }}>
              Terms of Service
            </Link>
            <Link to="/contact" className="py-1 text-[0.85rem] tracking-wide transition-colors duration-300 hover:text-white" style={{ color: 'rgba(253,250,243,0.5)' }}>
              Contact
            </Link>
          </nav>
          <p className="text-center text-[0.85rem] tracking-wide md:text-right" style={{ color: 'rgba(253,250,243,0.5)' }}>
            Designed and developed by{' '}
            <a 
              href="https://logicmindsbyparii.com/" 
              target="_blank" 
              rel="noreferrer" 
              className="transition-colors duration-300"
              style={{ color: brand.goldLight }}
              onMouseEnter={(e) => e.currentTarget.style.color = brand.ivoryLit}
              onMouseLeave={(e) => e.currentTarget.style.color = brand.goldLight}
            >
              Logic Minds By Parii
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
