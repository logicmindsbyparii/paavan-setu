import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useSpring,
  useTransform,
  useMotionValue,
  useScroll,
  useReducedMotion,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';

import { brand, FIELD_GRADIENT } from '../constants/brand';
import { WHATSAPP_NUMBER } from '../constants/urls';
import founderImage from '../assets/profile2.jpeg';

import BalanceIcon from '@mui/icons-material/Balance';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SchoolIcon from '@mui/icons-material/School';
import GrassIcon from '@mui/icons-material/Grass';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PsychologyIcon from '@mui/icons-material/Psychology';

// ─── DATA ──────────────────────────────────────────────────────────────────
const VALUES = [
  {
    id: 'integrity',
    Icon: BalanceIcon,
    tone: '#0a5c2c',
    title: 'Integrity & Ethics',
    short: 'Transparent, uncompromised guidance dedicated to student growth.',
    desc: "We believe in honest, evidence-based orientation — prioritizing the student's unique personality, aptitude, and long-term well-being above commercial incentives.",
    details: [
      'Zero commercial bias towards specific colleges or streams',
      'Scientifically validated evaluation protocols',
      'Transparent reporting with student & parent joint reviews',
    ],
  },
  {
    id: 'compassion',
    Icon: FavoriteIcon,
    tone: '#d9ae3c',
    title: 'Empathic Understanding',
    short: 'Every student is valued as a unique individual with an inspiring story.',
    desc: 'Adolescence and career decisions carry immense emotional weight. We listen deeply, reduce performance anxiety, and create a safe environment for self-expression.',
    details: [
      'Empathetic listening without judgment or academic pressure',
      'Focus on emotional regulation & stress reduction',
      'Child psychology-backed communication techniques',
    ],
  },
  {
    id: 'excellence',
    Icon: SchoolIcon,
    tone: '#174a72',
    title: 'Pedagogical Excellence',
    short: 'Rigorous research, validated frameworks, and continuous refinement.',
    desc: 'Our workbooks, workshops, and counselling protocols are grounded in global educational standards, cognitive science, and NEP 2020 guidelines.',
    details: [
      'Continuous curriculum research & revision',
      'Integration of Howard Gardner’s Multiple Intelligences',
      'Facilitators with certified global counselling background',
    ],
  },
  {
    id: 'growth',
    Icon: GrassIcon,
    tone: '#0a5c2c',
    title: 'Lifelong Growth Mindset',
    short: 'Empowering students, teachers, and parents to evolve continuously.',
    desc: 'Education is not a one-time exam result; it is a lifelong habit. We equip learners with tools for adaptability, curiosity, and resilience.',
    details: [
      'Reflective journaling & self-assessment workbooks',
      'Quarterly teacher enrichment modules',
      'Focus on adaptability & future-proof skillsets',
    ],
  },
  {
    id: 'collaboration',
    Icon: GroupsIcon,
    tone: '#d9ae3c',
    title: 'Family & School Synergy',
    short: 'Uniting parents, educators, and mentors into one supportive ecosystem.',
    desc: 'True transformation occurs when home and classroom environments align. We serve as a trusted bridge uniting parents and teachers around the child.',
    details: [
      'Joint parent-student alignment sessions',
      'On-site teacher training & classroom tools',
      'Ongoing institutional support and progress tracking',
    ],
  },
  {
    id: 'purpose',
    Icon: LocalFireDepartmentIcon,
    tone: '#174a72',
    title: 'Purpose-Driven Living',
    short: 'Helping young minds discover their intrinsic calling and values.',
    desc: 'Beyond marks and salaries, true success lies in purpose. We guide students to align their career paths with their core values and passion.',
    details: [
      'Value-integrated career mapping frameworks',
      'Character-building modules for secondary classes',
      'Focus on social contribution and ethical leadership',
    ],
  },
];

const CREDS = [
  {
    title: 'Global Career Counsellor (GCC)',
    issuer: 'UCLA Extension & Univariety',
    desc: 'International certification in career psychology, stream selection, and university guidance.',
  },
  {
    title: 'B.Com (Accountancy & Management)',
    issuer: 'Gujarat University',
    desc: 'Solid foundation in business administration, economic systems, and analytical reasoning.',
  },
  {
    title: 'Journalism & Mass Communication',
    issuer: 'Post-Graduate Studies',
    desc: 'Expertise in clear communication, storytelling, and student engagement methodologies.',
  },
  {
    title: 'Shrimad Bhagavad Gita Course',
    issuer: 'Value Education Studies',
    desc: 'Deep grounding in ancient Indian philosophy, ethics, and mental resilience principles.',
  },
  {
    title: 'Soft Skills & Personality Development',
    issuer: 'Professional Development',
    desc: 'Specialization in student confidence building, public speaking, and interpersonal dynamics.',
  },
  {
    title: 'Student Mental Health & Well-being',
    issuer: 'Higher Education Studies',
    desc: 'Targeted training in identifying adolescent stress, burnout prevention, and emotional support.',
  },
];

const HERO_STATS = [
  { num: '10+', label: 'Years in Education' },
  { num: '200+', label: 'Schools Visited Across Gujarat' },
  { num: '2,500+', label: 'Students & Parents Guided' },
  { num: '20+', label: 'Institutional Partners' },
];

const MILESTONES = [
  {
    year: '2014',
    Icon: MenuBookIcon,
    title: 'Genesis in Educational Content',
    desc: 'Started developing value-based learning workbooks for kindergarten and early primary students in Gujarat.',
  },
  {
    year: '2018',
    Icon: SchoolIcon,
    title: 'Statewide School Outreach',
    desc: 'Expanded directly into classrooms, conducting interactive career and emotional wellness workshops in 100+ schools.',
  },
  {
    year: '2021',
    Icon: PsychologyIcon,
    title: 'Integration of Biometric & DMIT Tools',
    desc: 'Pioneered scientific DMIT and psychometric assessments to provide data-backed career orientation for Class 9-12.',
  },
  {
    year: '2024+',
    Icon: AutoAwesomeIcon,
    title: 'Paawan Setu Ecosystem',
    desc: 'Established comprehensive 360° school integration models, teacher pedagogy modules, and digital guidance tools.',
  },
];

// ─── CONSTELLATION CANVAS BACKDROP (LIGHT THEME) ───────────────────────────
function InteractiveConstellationCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = 42;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.02;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Attraction towards mouse
        const dxMouse = mouseX - node.x;
        const dyMouse = mouseY - node.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 200) {
          node.x += (dxMouse / distMouse) * 0.25;
          node.y += (dyMouse / distMouse) * 0.25;
        }

        // Connections
        for (let j = i + 1; j < nodeCount; j++) {
          const target = nodes[j];
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.22;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = i % 2 === 0 ? `rgba(10, 92, 44, ${alpha})` : `rgba(217, 174, 60, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        const r = node.radius + Math.sin(node.pulse) * 0.6;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(10, 92, 44, 0.45)' : 'rgba(217, 174, 60, 0.65)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = i % 2 === 0 ? 'rgba(10, 92, 44, 0.2)' : 'rgba(217, 174, 60, 0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none opacity-50" />;
}

// ─── CREDENTIAL MODAL ──────────────────────────────────────────────────────
function CredentialModal({ cred, onClose }) {
  if (!cred) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 text-[#111d11] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#111d11] transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon fontSize="small" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a5c2c]/10 text-[#0a5c2c] border border-[#0a5c2c]/20">
            <WorkspacePremiumIcon />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0a5c2c]">{cred.issuer}</span>
            <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#111d11]">{cred.title}</h3>
          </div>
        </div>

        <p className="text-sm text-[#4a5568] leading-relaxed mb-6">
          {cred.desc}
        </p>

        <div className="rounded-2xl bg-[#fdfaf3] p-4 border border-gray-200/80 mb-6">
          <p className="text-xs text-[#0a5c2c] font-semibold flex items-center gap-2 mb-1">
            <AutoAwesomeIcon sx={{ fontSize: 16 }} /> How This Informs Paawan Setu Guidance
          </p>
          <p className="text-xs text-[#4a5568] leading-relaxed">
            Ensures that every counselling session and workbook curriculum is built on validated frameworks, empathetic communication, and deep educational insights.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-full py-3.5 text-xs font-bold uppercase tracking-wider text-[#111d11] shadow-md hover:opacity-95 transition-opacity"
          style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
        >
          Close Credential Details
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function About() {
  const [selectedCred, setSelectedCred] = useState(null);
  const reduceMotion = useReducedMotion();
  const timelineRef = useRef(null);

  // Scroll-progress for the milestones spine: the journey line draws itself
  // as the reader scrolls through it (disabled under reduced motion).
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 0.8', 'end 0.45'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const [journeyYear, setJourneyYear] = useState(MILESTONES[0].year);

  // Journey-year wayfinding: update the tracker as the reader passes milestones.
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(MILESTONES.length - 1, Math.max(0, Math.floor(v * MILESTONES.length)));
    setJourneyYear(MILESTONES[idx].year);
  });

  // Mouse tilt for hero stage
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-6, 6]), { stiffness: 200, damping: 25 });

  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleHeroMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Cursor spotlight on bento cards
  const handleSpotlightMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="overflow-x-hidden w-full bg-[#fffdf8] text-[#111d11] font-['DM_Sans',sans-serif]">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO — Warm Ivory Cinematic Stage (Homepage Visual Identity)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative isolate overflow-hidden min-h-[85svh] flex items-center pt-28 pb-20 sm:pt-32 sm:pb-24"
        style={{
          background:
            'radial-gradient(54% 46% at 10% 90%, rgba(233,200,92,0.32) 0%, rgba(233,200,92,0) 62%),' +
            'linear-gradient(172deg, #fffdf8 0%, #f7f0e2 48%, #ffffff 100%)',
        }}
      >
        {/* Constellation Canvas */}
        <InteractiveConstellationCanvas />

        {/* Ambient background glows */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute -top-[18%] -right-[10%] h-[55vw] w-[55vw] max-h-[720px] max-w-[720px] rounded-full blur-[120px] opacity-35 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #e8b86d 0%, rgba(232,184,109,0) 70%)' }}
          />
          <div
            className="absolute bottom-[-14%] left-[10%] h-[45vw] w-[45vw] max-h-[580px] max-w-[580px] rounded-full blur-[130px] opacity-25 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0a5c2c 0%, rgba(10,92,44,0) 70%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Mission Statement & Typography */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <h1 className="font-['DM_Serif_Display',Georgia,serif] text-[#111d11] text-[clamp(2.5rem,5.5vw,4.4rem)] leading-[1.08] tracking-[-0.02em] mb-6">
                Guiding Students Toward{' '}
                <span className="italic text-[#0a5c2c] relative inline-block">
                  Purpose & Clarity
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 20"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute -bottom-[0.05em] left-0 h-[0.24em] w-[103%] -translate-x-[1.5%]"
                  >
                    <path
                      d="M2 11 C 60 2, 150 1, 298 5 C 250 15, 120 19, 2 11 Z"
                      fill="#e8b86d"
                      fillOpacity="0.9"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-[1.75] text-[#4a5568]">
                Paawan Setu was founded to bridge the gap between academic pressure and genuine character development — empowering students across Gujarat with career direction, emotional resilience, and value-based education.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold text-[#111d11] no-underline shadow-[0_14px_34px_-14px_rgba(168,128,31,0.85)] transition-all duration-300 hover:shadow-[0_20px_44px_-12px_rgba(168,128,31,0.95)] hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
                >
                  Connect With Us
                  <ArrowForwardIcon fontSize="small" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Paawan Setu! I would like to learn more about your story and programmes.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#0a5c2c]/30 bg-white/80 px-8 py-4 text-sm font-semibold text-[#0a5c2c] no-underline shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-[#0a5c2c] hover:text-white hover:border-[#0a5c2c]"
                >
                  <WhatsAppIcon fontSize="small" />
                  Instant WhatsApp Enquiry
                </a>
              </div>
            </motion.div>

            {/* Right Column: 3D Mouse Tilt Interactive Glass Showcase */}
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[420px]">
                <div className="relative overflow-hidden rounded-3xl border border-[#0a5c2c]/15 bg-white/95 p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(10,92,44,0.12)] backdrop-blur-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#e8b86d]/60 shadow-md shrink-0 bg-[#fdfaf3]">
                      <img src={founderImage} alt="Shweta Kothari" className="h-full w-full object-cover object-top" />
                    </div>
                    <div>
                      <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11]">Shweta Kothari</h3>
                      <p className="text-xs text-[#0a5c2c] font-semibold">Founder & Lead Educational Counsellor</p>
                      <p className="text-[0.68rem] text-[#4a5568] mt-0.5">10+ Years in Classroom & Career Guidance</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[#fdfaf3] p-3.5 border border-gray-200/80">
                      <p className="text-xs font-bold text-[#0a5c2c] flex items-center gap-2">
                        <VerifiedIcon sx={{ fontSize: 16 }} /> Global Career Counsellor (GCC)
                      </p>
                      <p className="text-[0.72rem] text-[#4a5568] mt-1">
                        Certified through UCLA Extension & Univariety for stream & career orientation.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#fdfaf3] p-3.5 border border-gray-200/80">
                      <p className="text-xs font-bold text-[#174a72] flex items-center gap-2">
                        <MenuBookIcon sx={{ fontSize: 16 }} /> Curriculum Author & Facilitator
                      </p>
                      <p className="text-[0.72rem] text-[#4a5568] mt-1">
                        Authored value-education books currently taught across multiple Gujarat schools.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Stats Bar */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-gray-200/80 pt-8">
            {HERO_STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                className="text-center sm:text-left"
              >
                <span className="block font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#0a5c2c] tabular-nums">
                  {stat.num}
                </span>
                <span className="mt-1 block text-xs font-medium uppercase tracking-wider text-[#4a5568]">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOUNDER & CREDENTIALS SHOWCASE                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#f9faf7] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="founder-heading">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Founder Portrait Card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl overflow-hidden border border-[#0a5c2c]/15 bg-white p-4 shadow-[0_20px_50px_-15px_rgba(10,92,44,0.1)]">
                <div className="relative rounded-2xl overflow-hidden bg-[#fdfaf3]">
                  <img src={founderImage} alt="Shweta Kothari" className="w-full h-auto max-h-[540px] object-contain block mx-auto" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111d11]/80 via-transparent to-transparent opacity-85" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="inline-block rounded-full bg-[#e8b86d]/30 border border-[#e8b86d]/60 px-3 py-1 text-xs font-bold text-[#f7e6bd] mb-2 backdrop-blur-md">
                      Founder's Vision
                    </span>
                    <h3 className="font-['DM_Serif_Display',Georgia,serif] text-3xl text-white">
                      Shweta Kothari
                    </h3>
                    <p className="text-xs text-white/90 mt-1">
                      Education Counsellor & Values Advocate
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Story & Interactive Credentials */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-6"
            >
              <h2 id="founder-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11]">
                Guiding Students With Purpose & Deep Clarity
              </h2>

              <p className="text-base text-[#4a5568] leading-relaxed">
                Having interacted with over 200 schools across Gujarat, I observed firsthand the immense pressure students face regarding marks, stream choices, and future careers.
              </p>
              <p className="text-base text-[#4a5568] leading-relaxed">
                Paawan Setu was established to combine scientific career assessments (Psychometrics & DMIT) with character-building value education — creating a supportive bridge between students, parents, and educators.
              </p>

              {/* Interactive Credentials Grid */}
              <div className="pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0a5c2c] mb-4 flex items-center gap-2">
                  <WorkspacePremiumIcon fontSize="small" /> Verified Credentials & Expertise (Click to Inspect)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CREDS.map((cred, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCred(cred)}
                      className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#0a5c2c]/40 hover:bg-[#fdfaf3]"
                    >
                      <p className="text-xs font-bold text-[#111d11] flex items-center justify-between">
                        <span>{cred.title}</span>
                        <ArrowForwardIcon sx={{ fontSize: 14, color: '#0a5c2c' }} />
                      </p>
                      <p className="text-[0.68rem] text-[#0a5c2c] mt-1">{cred.issuer}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MISSION & VISION BENTO STAGE                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#fffdf8] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="mission-heading">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 id="mission-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-4">
              Our Driving Purpose & Vision
            </h2>
            <p className="text-base sm:text-lg text-[#4a5568]">
              Re-anchoring modern education with moral clarity, self-awareness, and holistic guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onMouseMove={handleSpotlightMove}
              className="group relative overflow-hidden rounded-3xl border border-[#0a5c2c]/15 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#0a5c2c]/35 hover:shadow-md"
              style={{
                background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(10, 92, 44, 0.08), transparent 40%)',
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a5c2c]/10 text-[#0a5c2c] border border-[#0a5c2c]/20 mb-6">
                <TrackChangesIcon sx={{ fontSize: 32 }} />
              </div>
              <h3 className="font-['DM_Serif_Display',Georgia,serif] text-3xl text-[#111d11] mb-4">Our Mission</h3>
              <p className="text-base text-[#4a5568] leading-relaxed mb-6">
                To bring values, direction, and scientific clarity into education by providing holistic learning solutions that nurture both academic performance and lifelong character strength.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#4a5568]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0a5c2c]" />
                  Character-building value workbooks integrated into school routines
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0a5c2c]" />
                  Scientific psychometric & DMIT biometric career orientation
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0a5c2c]" />
                  Parent-teacher alignment workshops across Gujarat
                </li>
              </ul>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              onMouseMove={handleSpotlightMove}
              className="group relative overflow-hidden rounded-3xl border border-[#174a72]/15 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#174a72]/35 hover:shadow-md"
              style={{
                background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(23, 74, 114, 0.08), transparent 40%)',
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#174a72]/10 text-[#174a72] border border-[#174a72]/20 mb-6">
                <VisibilityIcon sx={{ fontSize: 32 }} />
              </div>
              <h3 className="font-['DM_Serif_Display',Georgia,serif] text-3xl text-[#111d11] mb-4">Our Vision</h3>
              <p className="text-base text-[#4a5568] leading-relaxed mb-6">
                A future where every student makes informed career decisions with confidence, understanding their unique cognitive strengths and life purpose, supported by a value-driven educational ecosystem.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#4a5568]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#174a72]" />
                  Elimination of career anxiety through early self-discovery
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#174a72]" />
                  Whole-school integration mapping NEP 2020 guidelines
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#174a72]" />
                  Empowered educators delivering value-based lessons effortlessly
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MILESTONES TIMELINE - SCROLL-DRAWN JOURNEY STORY                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#f4f8f4] py-20 sm:py-32 border-t border-gray-200/60 overflow-hidden" aria-labelledby="milestones-heading">
        {/* Ambient background glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-[12%] -left-[8%] h-[420px] w-[420px] rounded-full blur-[120px] opacity-25"
            style={{ background: 'radial-gradient(circle, #e8b86d 0%, rgba(232,184,109,0) 70%)' }}
          />
          <div
            className="absolute bottom-[8%] -right-[8%] h-[460px] w-[460px] rounded-full blur-[130px] opacity-20"
            style={{ background: 'radial-gradient(circle, #0a5c2c 0%, rgba(10,92,44,0) 70%)' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Sticky Left Column */}
            <div className="lg:col-span-5">
              <div className="sticky top-32 lg:pr-8">
                <h2 id="milestones-heading" className="font-['DM_Serif_Display',Georgia,serif] text-4xl sm:text-5xl text-[#111d11] mb-6">
                  Our Journey & Evolution
                </h2>
                <p className="text-base sm:text-lg text-[#4a5568] max-w-sm mb-12 lg:mb-20">
                  A decade of dedicated classroom engagement, curriculum authorship, and holistic student guidance.
                </p>

                {/* Big Dynamic Year for Desktop */}
                <div className="hidden lg:block">
                  <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#0a5c2c] mb-3">Current Era</p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={journeyYear}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="font-['DM_Serif_Display',Georgia,serif] text-8xl text-[#0a5c2c] tabular-nums leading-none tracking-tight"
                    >
                      {journeyYear}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Scrolling Right Column - Timeline */}
            <div className="lg:col-span-6 lg:col-start-7 relative" ref={timelineRef}>
              {/* Vertical spine line */}
              <div aria-hidden="true" className="absolute left-6 top-4 bottom-4 w-px bg-[#0a5c2c]/15 hidden sm:block" />
              
              {/* Active spine fill */}
              <motion.div
                aria-hidden="true"
                style={{ scaleY: reduceMotion ? 1 : lineScale, transformOrigin: 'top' }}
                className="absolute left-6 top-4 bottom-4 w-[3px] -translate-x-[1px] bg-gradient-to-b from-[#0a5c2c] via-[#0a5c2c] to-[#e8b86d] hidden sm:block rounded-full"
              />

              <div className="space-y-10 sm:space-y-16">
                {MILESTONES.map((m, i) => {
                  const Icon = m.Icon;
                  return (
                    <motion.div
                      key={i}
                      initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="relative sm:pl-20"
                    >
                      {/* Node on spine */}
                      <div aria-hidden="true" className="absolute left-6 top-8 -translate-x-1/2 -translate-y-1/2 hidden sm:block z-10">
                        <span className="block h-4 w-4 rounded-full bg-white border-4 border-[#0a5c2c] shadow-[0_0_0_4px_rgba(244,248,244,1)]" />
                      </div>

                      <article className="group relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white p-7 sm:p-9 shadow-sm transition-all duration-500 hover:border-[#0a5c2c]/30 hover:shadow-[0_24px_60px_-15px_rgba(10,92,44,0.12)] hover:-translate-y-1">
                        
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#0a5c2c]/15 bg-[#0a5c2c]/5 text-[#0a5c2c] group-hover:bg-[#0a5c2c] group-hover:text-white transition-colors duration-500">
                              <Icon sx={{ fontSize: 26 }} />
                            </span>
                            {/* Year on mobile, hidden on desktop since it's in the sticky left col */}
                            <span className="font-['DM_Serif_Display',Georgia,serif] text-3xl text-[#0a5c2c] tabular-nums lg:hidden">
                              {m.year}
                            </span>
                          </div>
                          
                          {i === MILESTONES.length - 1 && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#0a5c2c]/20 bg-[#0a5c2c]/10 px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#0a5c2c] w-fit sm:mt-1">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#0a5c2c] opacity-75 motion-safe:animate-ping" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0a5c2c]" />
                              </span>
                              Ongoing
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#111d11] mb-3 group-hover:text-[#0a5c2c] transition-colors duration-300">
                          {m.title}
                        </h3>
                        <p className="text-base text-[#4a5568] leading-relaxed">
                          {m.desc}
                        </p>
                      </article>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CORE VALUES BENTO GRID                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#fffdf8] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="values-heading">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 id="values-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-4">
              Our Foundational Core Values
            </h2>
            <p className="text-base sm:text-lg text-[#4a5568]">
              The principles governing every counselling session, school workshop, and published workbook.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.Icon;
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  onMouseMove={handleSpotlightMove}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#0a5c2c]/30 hover:shadow-md"
                  style={{
                    background: `radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${v.tone}0c, transparent 40%)`,
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                    style={{ backgroundColor: `${v.tone}12`, color: v.tone, border: `1px solid ${v.tone}25` }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </div>
                  <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11] mb-2 group-hover:text-[#0a5c2c] transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-sm text-[#4a5568] leading-relaxed mb-4">{v.desc}</p>
                  <ul className="space-y-1.5 border-t border-gray-100 pt-4">
                    {v.details.map((d, j) => (
                      <li key={j} className="text-xs text-[#4a5568] flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: v.tone }} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative isolate overflow-hidden px-6 py-24 text-center sm:py-32"
        style={{ background: FIELD_GRADIENT }}
        aria-labelledby="cta-heading"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 30%, #e8b86d 0%, transparent 60%)' }} />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <h2
            id="cta-heading"
            className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.08] text-white"
          >
            Want to learn more about{' '}
            <span className="italic text-[#f7e6bd]">our work?</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg leading-relaxed text-white/80">
            We welcome conversations with parents, educators, and school management to explore how Paawan Setu can support your students.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full px-9 py-4 text-base font-bold text-[#111d11] no-underline shadow-2xl transition-all duration-300 hover:scale-[1.03]"
              style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
            >
              Get in Touch
              <ArrowForwardIcon fontSize="small" />
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Paawan Setu! I would like to get in touch to discuss workshops or counselling.')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-9 py-4 text-base font-bold text-white no-underline hover:bg-white/20 transition-all"
            >
              <WhatsAppIcon fontSize="small" />
              Chat on WhatsApp Now
            </a>
          </div>
        </div>
      </section>

      {/* Credential Modal */}
      <AnimatePresence>
        {selectedCred && (
          <CredentialModal cred={selectedCred} onClose={() => setSelectedCred(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
