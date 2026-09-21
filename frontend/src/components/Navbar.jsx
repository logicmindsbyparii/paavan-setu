import React, { useState, useEffect } from 'react';
import { Drawer, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../lib/motion';
import { colors, fonts } from '../constants/tokens';
import logo from '../assets/logo_final.png';

const navLinks = [
{ label: 'Home', path: '/', short: 'Home' },
{ label: 'Career Coaching', path: '/career-counselling', short: 'Coaching' },
{ label: 'Psychometric Test', path: '/test', short: 'Test' },
{ label: 'Books', path: '/books', short: 'Books' },
{ label: 'Schools & Workshops', path: '/schools-workshops', short: 'Schools & Workshops' },
{ label: 'About Us', path: '/about', short: 'About' },
{ label: 'Contact', path: '/contact', short: 'Contact' },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  /* A link is active on its exact route or any nested route beneath it — the
     Psychometric Test item must stay lit while a student is mid-assessment at
     /test/:type. The homepage is the one entry that must not prefix-match
     everything. */
  const isLinkActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const name = localStorage.getItem('userName');
    if (token) {
      setIsLoggedIn(true);
      setUserName(name || 'User');
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll(); // Restored scroll position on load must not show the wrong state.
    // Passive: this listener never calls preventDefault, and telling the browser
    // so keeps scrolling off the main thread.
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const reducedMotion = prefersReducedMotion();

  const logoVariants = {
    hidden: { opacity: 0, x: reducedMotion ? 0 : -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 } },
  };

  const navContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.4,
      },
    },
  };

  const linkVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  // Convert custom motion link component
  const MotionLink = motion.create(Link);

  return (
    <>
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-5 py-2.5 rounded-full transition-all duration-300 w-[calc(100%-2rem)] max-w-6xl ${
          scrolled
            ? 'bg-white/90 shadow-lg border border-black/[0.06]'
            : 'bg-white/70 shadow-md border border-black/[0.04]'
        }`}
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {/* Mobile centering spacer to balance the hamburger icon */}
        <div className="w-[44px] lg:hidden shrink-0" aria-hidden="true" />

        {/* Logo */}
        <MotionLink
          to="/"
          variants={logoVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center shrink-0 z-10 lg:mr-auto"
        >
          <img
            src={logo}
            alt="Paavan SETU"
            className="h-14 sm:h-16 lg:h-16 xl:h-20 w-auto object-contain transition-all duration-300"
          />
        </MotionLink>

        {/* Desktop Nav Links.
            Seven labels plus the logo and CTA do not fit between 768px and
            ~1000px — three of them wrapped onto a second line and broke the
            pill. The inline nav starts at lg; below that the drawer handles it. */}
        <motion.nav 
          aria-label="Primary" 
          className="hidden lg:flex items-center justify-center gap-x-1 flex-1"
          variants={navContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* At 1024-1150px the seven labels plus the CTA run ~70px past the
              pill, clipping the Book Session button; links tighten until xl. */}
          {navLinks.map((link, i) => {
            const isActive = isLinkActive(link.path);
            return (
              <MotionLink
                key={link.path}
                to={link.path}
                variants={linkVariants}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center whitespace-nowrap px-2 py-2.5 rounded-lg text-xs tracking-wide transition-colors duration-200 no-underline xl:px-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-amber/60`}
                style={{ fontFamily: fonts.body, color: isActive ? colors.green : colors.slate }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = colors.green; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = colors.slate; } }}
              >
                {link.short}
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-transform duration-200"
                  style={{
                    width: isActive ? '100%' : '40%',
                    background: isActive ? colors.green : colors.greenLight,
                    transform: isActive
                      ? 'translateX(-50%) scaleX(1)'
                      : 'translateX(-50%) scaleX(0)',
                  }}
                />
              </MotionLink>
            );
          })}
        </motion.nav>

        {/* Desktop CTA / Login */}
        <motion.div 
          className="hidden lg:flex items-center gap-4 shrink-0"
          variants={navContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoggedIn ? (
            <motion.div variants={linkVariants} className="flex items-center gap-4">
              <span className="text-sm font-semibold" style={{ color: colors.ink }}>
                Hi, {userName.split(' ')[0]}
              </span>
              <Link
                to="/my-results"
                className="text-sm font-semibold hover:underline"
                style={{ color: colors.slate }}
              >
                My Results
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold hover:underline"
                style={{ color: colors.slate }}
              >
                Log Out
              </button>
            </motion.div>
          ) : (
            <MotionLink
              variants={linkVariants}
              to="/login"
              className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold no-underline transition-colors duration-200 hover:bg-green/10 hover:underline-offset-2 xl:px-4"
              style={{ color: colors.slate }}
            >
              Log In
            </MotionLink>
          )}
          
          <MotionLink
            variants={linkVariants}
            to="/contact"
            className="inline-flex shrink-0 items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white no-underline transition-colors duration-200 xl:px-6"
            style={{
              fontFamily: fonts.body,
              background: colors.green,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = colors.blue; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = colors.green; }}
          >
            Book Session
          </MotionLink>
        </motion.div>

        {/* Mobile Hamburger */}
        {/* Hidden via sx, not a Tailwind `lg:hidden` class: MUI's emotion styles
            are injected after the Tailwind sheet, so `display: inline-flex` from
            MuiIconButton-root won that cascade and the burger showed on desktop
            alongside the full nav. The 1024px query matches Tailwind's `lg`
            (MUI's own `lg` is 1200px, which would leave a 1024–1199px gap where
            both the inline nav and the burger were visible). */}
        <IconButton
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          sx={{
            color: colors.green,
            width: 44,
            height: 44,
            '@media (min-width:1024px)': { display: 'none' },
          }}
        >
          <MenuIcon />
        </IconButton>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            maxWidth: '85vw',
            background: '#ffffff',
            color: colors.ink,
            boxShadow: '-4px 0 24px rgba(17, 29, 17, 0.1)',
          },
        }}
      >
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Paavan SETU"
              className="h-14 w-auto object-contain"
            />
            <div>
              <div
                className="font-extrabold text-base leading-tight"
                style={{ color: colors.green }}
              >
                Paavan Setu
              </div>
              <div
                className="text-[0.6rem] uppercase tracking-[0.12em] font-semibold"
                style={{ color: colors.ash }}
              >
                Bridging Values with Education
              </div>
            </div>
          </div>
          <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu" sx={{ color: colors.ash, width: 44, height: 44 }}>
            <CloseIcon />
          </IconButton>
        </div>

        <nav
          aria-label="Mobile"
          className="px-3 mt-2 flex flex-col"
        >
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-5 py-3.5 mb-1 rounded-r-lg no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-amber/60 ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}
                style={{
                  fontFamily: fonts.body,
                  color: isActive ? colors.green : colors.slate,
                  background: isActive ? `${colors.green}0a` : 'transparent',
                  borderLeft: isActive
                    ? `3px solid ${colors.green}`
                    : '3px solid transparent',
                }}
              >
                {link.short}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 mt-auto flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              <Link
                to="/my-results"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center w-full py-3.5 rounded-full text-[0.95rem] font-semibold transition-all duration-200 border"
                style={{ color: colors.ink, borderColor: colors.divider }}
              >
                My Results
              </Link>
              <button
                onClick={() => { handleLogout(); setDrawerOpen(false); }}
                className="flex items-center justify-center w-full py-3.5 rounded-full text-[0.95rem] font-semibold transition-all duration-200 border"
                style={{ color: colors.ink, borderColor: colors.divider }}
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center w-full py-3.5 rounded-full text-[0.95rem] font-semibold transition-all duration-200 border"
              style={{ color: colors.ink, borderColor: colors.divider }}
            >
              Log In
            </Link>
          )}

          <Link
            to="/contact"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center w-full py-3.5 rounded-full text-[0.95rem] font-semibold text-white no-underline transition-all duration-200"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: colors.green,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.blue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.green;
            }}
          >
            Book Session
          </Link>
        </div>
      </Drawer>
    </>
  );
}
