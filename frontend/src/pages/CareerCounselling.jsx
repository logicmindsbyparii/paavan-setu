import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from 'framer-motion';

import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublicIcon from '@mui/icons-material/Public';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import StarsIcon from '@mui/icons-material/Stars';
import GroupsIcon from '@mui/icons-material/Groups';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpeedIcon from '@mui/icons-material/Speed';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { brand, GRAIN } from '../constants/brand';
import { WHATSAPP_NUMBER } from '../constants/urls';

import { Marquee } from '../components/ui/Marquee';

/* ─── DATA ───────────────────────────────────────────────────────────────── */

const OFFER_DATA = [
  {
    id: 'psychometric',
    Icon: AssessmentIcon,
    title: 'Psychometric Assessments',
    desc: 'Scientific tools decoding personality traits, aptitude, and learning styles into actionable clarity.',
    color: '#10b981',
    accentHex: '#34d399',
    badge: 'Evidence-Based',
    details: [
      'Standardized cognitive reasoning & aptitude evaluation',
      'Detailed personality & learning preference report (25+ pages)',
      'Identification of primary strengths and potential blind spots',
      'Direct mapping to high-growth career streams in India',
    ],
    target: 'Ideal for Class 9-12 & College Students',
    actionText: 'Take Psychometric Test',
    actionLink: '/test',
  },
  {
    id: 'one-on-one',
    Icon: GroupsIcon,
    title: 'One-to-One Counselling',
    desc: 'Personalised sessions built around the student’s own aptitude, never a one-size script.',
    color: '#3b82f6',
    accentHex: '#60a5fa',
    badge: '1-on-1 Dedicated',
    details: [
      '60 to 90 minutes of dedicated expert counsellor interaction',
      'Joint session with student & parents to align expectations',
      'In-depth interpretation of assessment & biometric data',
      'Custom written career roadmap provided post-session',
    ],
    target: 'Ideal for Parents & Students seeking personalized clarity',
    actionText: 'Book Counselling Session',
    actionLink: '/contact',
  },
  {
    id: 'dmit',
    Icon: FingerprintIcon,
    title: 'DMIT Assessment',
    desc: 'Biometric fingerprint analysis revealing innate potential and subconscious brain dominance.',
    color: '#f59e0b',
    accentHex: '#fbbf24',
    badge: 'Innate Intelligence',
    details: [
      '10-fingerprint biometric scanning of dermal ridges',
      'Mapping of Multiple Intelligences (Howard Gardner framework)',
      'Subconscious learning style identification (Visual, Auditory, Kinesthetic)',
      'Quotients evaluation: IQ, EQ, AQ (Adversity), CQ (Creativity)',
    ],
    target: 'Ideal for Children, Students, & Adults seeking self-discovery',
    actionText: 'Enquire About DMIT',
    actionLink: '/contact',
  },
  {
    id: 'stream',
    Icon: AutoStoriesIcon,
    title: 'Stream & Subject Selection',
    desc: 'Targeted direction for Class 9–12 students to select streams aligned with future careers.',
    color: '#14b8a6',
    accentHex: '#2dd4bf',
    badge: 'Post-Class 10/12',
    details: [
      'Evaluation between Science (PCM/PCB), Commerce, and Humanities',
      'Subject combination strategy tailored to competitive exams (JEE, NEET, CUET, CLAT)',
      'Early elimination of unsuitable academic tracks',
      'Action plan for Class 11-12 subject performance optimization',
    ],
    target: 'Ideal for Class 9, 10, & 11 Students',
    actionText: 'Get Stream Advice',
    actionLink: '/contact',
  },
  {
    id: 'admissions',
    Icon: StarsIcon,
    title: 'Indian Admissions Guidance',
    desc: 'Strategic clarity on competitive entrance exams, top Indian universities, and eligibility.',
    color: '#6366f1',
    accentHex: '#818cf8',
    badge: 'College Roadmap',
    details: [
      'Unbiased evaluation of government & top private Indian universities',
      'Entrance exam timelines & preparation strategy (CUET, IPMAT, NIDA, NIFT, etc.)',
      'Course suitability & curriculum breakdown',
      'Application strategy & backup college choices',
    ],
    target: 'Ideal for Class 12 & Gap Year Students',
    actionText: 'Enquire Admissions Guidance',
    actionLink: '/contact',
  },
  {
    id: 'insights',
    Icon: PsychologyIcon,
    title: 'Career-Related Insights',
    desc: 'Comprehensive multi-year perspective so long-term goals remain adaptable and focused.',
    color: '#ec4899',
    accentHex: '#f472b6',
    badge: 'Long-term Growth',
    details: [
      'Future of Work trends & emerging industry analysis',
      'Skill gap identification and recommended certifications',
      'Adaptability planning for changing job market dynamics',
      'Continuous mentorship touchpoints',
    ],
    target: 'Ideal for Undergraduates & Young Professionals',
    actionText: 'Connect with Counsellor',
    actionLink: '/contact',
  },
];

const STEPS_DATA = [
  {
    stepNum: '01',
    Icon: AssessmentIcon,
    title: 'Biometric & Psychometric Discovery',
    desc: 'Complete scientifically validated evaluations online or via DMIT biometric sampling to capture natural neural strengths.',
    tag: 'Phase 1 · Evaluation',
    metrics: '45-60 Mins',
  },
  {
    stepNum: '02',
    Icon: PsychologyIcon,
    title: 'Deep-Dive Analytical Counselling',
    desc: 'Sit down for a 60–90 minute intensive session where expert counsellors translate metrics into a personalized life narrative.',
    tag: 'Phase 2 · Synthesis',
    metrics: '60-90 Mins Live',
  },
  {
    stepNum: '03',
    Icon: RocketLaunchIcon,
    title: 'Custom Career Master Roadmap',
    desc: 'Receive a structured, written strategic dossier highlighting specific streams, subject combos, target colleges, and backup pathways.',
    tag: 'Phase 3 · Blueprint',
    metrics: 'Comprehensive Report',
  },
  {
    stepNum: '04',
    Icon: SupportAgentIcon,
    title: '30-Day Guidance & Mentorship',
    desc: 'Direct priority WhatsApp support post-session for lingering questions, application queries, and parental alignment.',
    tag: 'Phase 4 · Execution',
    metrics: '30 Days Priority Access',
  },
];

const QUOTES = [
  {
    name: 'Ananya Patel',
    role: 'Parent of Class 10 Student',
    quote: 'For the first time we understood why our daughter thrives in analytical tasks yet resists rote learning. The DMIT report and session reframed how we talk about her future entirely.',
    highlight: 'Decoded innate potential',
    tag: 'Parent Experience',
  },
  {
    name: 'Rohan Shah',
    role: 'Student, Class 12 Science',
    quote: 'I was overwhelmed between engineering specialization choices. The counselling gave me an evidence-backed roadmap that made the next 4 years completely clear.',
    highlight: 'Zero guesswork',
    tag: 'Stream Selection',
  },
  {
    name: 'Meera Desai',
    role: 'Student, Class 11 Humanities',
    quote: 'The psychometric analysis described my cognitive habits better than I could have explained them myself. The guidance was incredibly personal and empowering.',
    highlight: 'Targeted career match',
    tag: 'Personalized Insight',
  },
];

const AUDIENCE = [
  { Icon: SchoolIcon, name: 'Class 9 & 10 Students', desc: 'Build a rock-solid foundation and choose the right academic stream with absolute conviction.', link: '/contact' },
  { Icon: MenuBookIcon, name: 'Class 11 & 12 Students', desc: 'Deep clarity on higher-education courses, entrance exams, and college shortlists across India.', link: '/test' },
  { Icon: GroupsIcon, name: 'Parents & Families', desc: 'Empowering joint sessions to help parents support their child with data-backed confidence.', link: '/contact' },
  { Icon: StarsIcon, name: 'Higher Ed & Admissions', desc: 'Expert, hands-on navigation for Indian admissions, university profiles, and course fit.', link: '/contact' },
  { Icon: PublicIcon, name: 'Pan-India Remote Access', desc: 'High-definition online sessions and remote biometric collection available anywhere in India.', link: '/contact' },
  { Icon: SupportAgentIcon, name: 'Post-Session Mentorship', desc: 'Continuous 30-day WhatsApp follow-up ensuring implementation stays on track.', link: '/contact' },
];

const MARQUEE_WORDS = [
  'Psychometric Precision',
  'Evidence Over Impression',
  'One-on-One Mastery',
  'DMIT Neural Mapping',
  'Custom Career Blueprints',
  'Zero-Guesswork Stream Selection',
  'Admissions Clarity',
];

const EASE = [0.16, 1, 0.3, 1];

/* ─── NEURAL NETWORK CANVAS ──────────────────────────────────────────────── */

function InteractiveNeuralCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor((width * height) / 12000), 55);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
      alpha: Math.random() * 0.5 + 0.3,
      color: Math.random() > 0.4 ? '#e9c85c' : '#34d399',
    }));

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.parentElement.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - distMouse / 140) * 0.5;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#e9c85c';
            ctx.globalAlpha = (1 - dist / 110) * 0.18;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

/* ─── KINETIC MASKED LINE ───────────────────────────────────────────────── */

function MaskedLine({ text, className = '', wordClassName = '', delay = 0, animate = 'whileInView', once = true }) {
  const reduce = useReducedMotion();
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const animProps =
    animate === 'whileInView'
      ? { initial: reduce ? false : 'hidden', whileInView: 'visible', viewport: { once, amount: 0.5 } }
      : { initial: reduce ? false : 'hidden', animate: 'visible' };

  return (
    <span className={className}>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom pb-[0.2em] -mb-[0.2em]">
            <motion.span
              className={`inline-block will-change-transform ${wordClassName}`}
              variants={{
                hidden: { y: '120%', opacity: reduce ? 1 : 0.001, rotateX: -30 },
                visible: { y: '0%', opacity: 1, rotateX: 0, transition: { duration: 0.95, ease: EASE, delay: delay + i * 0.045 } },
              }}
              {...animProps}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}

/* ─── SERVICE DETAILS MODAL ──────────────────────────────────────────────── */

function ServiceModal({ service, onClose }) {
  const navigate = useNavigate();

  if (!service) return null;

  const Icon = service.Icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-[#062b18] p-6 sm:p-10 text-white shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <CloseIcon fontSize="small" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-[#f7e6ae]">
              <Icon sx={{ fontSize: 32 }} style={{ color: service.accentHex }} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-[#f7e6ae] border border-white/15">
                {service.badge}
              </span>
              <h3 className="mt-1 font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-white">
                {service.title}
              </h3>
            </div>
          </div>

          <p className="text-base leading-relaxed text-white/80 mb-6">
            {service.desc}
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#f7e6ae] mb-3">Key Features & What's Included</p>
            <div className="space-y-2.5">
              {service.details.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-white/85">
                  <CheckCircleOutlineIcon fontSize="small" className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-semibold text-white/60 mb-8">
            <strong className="text-white">Target Fit:</strong> {service.target}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                onClose();
                navigate(service.actionLink);
              }}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-[#051a0d] shadow-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              {service.actionText}
              <ArrowForwardIcon fontSize="small" />
            </button>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I want to inquire about ${service.title} from Paavan SETU.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              <WhatsAppIcon fontSize="small" className="text-emerald-400" />
              WhatsApp Inquiry
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── HERO SECTION ───────────────────────────────────────────────────────── */

const HERO_STAGE_CARDS = [
  { Icon: FingerprintIcon, title: 'DMIT Neural Profile', desc: 'Decoding 10 brain lobes & innate cognitive strengths.' },
  { Icon: SupportAgentIcon, title: 'Strategic Counselling', desc: 'Translating assessment data into a clear life story.' },
  { Icon: RocketLaunchIcon, title: 'Precision Roadmap', desc: 'Definitive stream, subject, & top college selection.' },
];

function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      ref={ref}
      aria-labelledby="cc-hero-heading"
      className="relative isolate overflow-hidden min-h-[100dvh] flex items-center pt-28 pb-20 sm:pt-36 sm:pb-28"
      style={{
        background:
          'radial-gradient(130% 100% at 85% 15%, rgba(20,184,166,0.18) 0%, transparent 55%),' +
          'radial-gradient(100% 80% at 15% 85%, rgba(233,200,92,0.15) 0%, transparent 60%),' +
          'linear-gradient(162deg, #031208 0%, #062b18 45%, #08283e 100%)',
      }}
    >
      {!reduce && <InteractiveNeuralCanvas />}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={reduce ? {} : { scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -left-[10%] h-[55vw] w-[55vw] max-h-[800px] max-w-[800px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(0,0,0,0) 70%)' }}
        />
        <motion.div
          animate={reduce ? {} : { scale: [1.1, 1, 1.1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] -right-[15%] h-[50vw] w-[50vw] max-h-[750px] max-w-[750px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)' }}
        />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#fdfaf3]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <motion.div style={{ y: contentY, opacity: contentOpacity }} className="lg:col-span-7 text-center lg:text-left">


            <h1 id="cc-hero-heading" className="mt-8 font-['DM_Serif_Display',Georgia,serif] tracking-[-0.02em] text-white">
              <span className="block text-[clamp(2.1rem,4.5vw,3.6rem)] leading-[1.1] text-white/95">
                <MaskedLine text="Most life-defining choices are made on guesswork." animate="animate" delay={0.2} />
              </span>
              <span className="relative mt-3 inline-block text-[clamp(2.7rem,5.8vw,4.8rem)] leading-[1.04]">
                <MaskedLine
                  text="Make yours with certainty."
                  animate="animate"
                  delay={0.5}
                  wordClassName="italic"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7e6ae] via-[#e9c85c] to-[#34d399]"
                />
                <svg aria-hidden="true" viewBox="0 0 320 22" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.12em] left-0 h-[0.18em] w-full opacity-90">
                  <motion.path
                    d="M2 13 C 70 3, 160 2, 318 6 C 260 17, 130 20, 2 13 Z"
                    fill="#e9c85c"
                    initial={reduce ? { opacity: 1 } : { opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 0.95, pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.9, ease: 'easeInOut' }}
                  />
                </svg>
              </span>
            </h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
              className="mx-auto lg:mx-0 mt-7 max-w-xl text-lg sm:text-xl leading-[1.75] text-white/75"
            >
              At Paavan Setu, advanced psychometric evaluation and DMIT biometric analysis meet 1-on-1 expert counselling. Streams, subjects, and university choices are grounded in who you genuinely are.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5"
            >
              <Link
                to="/contact"
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full px-9 py-4 text-[1rem] font-bold text-[#091a10] no-underline shadow-[0_16px_40px_-12px_rgba(233,200,92,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-10px_rgba(233,200,92,0.85)] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
                <AutoAwesomeIcon fontSize="small" />
                Book Assessment Session
                <ArrowForwardIcon fontSize="small" className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3.5 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-[0.98rem] font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/40 active:scale-[0.98]"
              >
                <WhatsAppIcon className="text-emerald-400" fontSize="small" />
                <span>Instant WhatsApp Inquiry</span>
              </a>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="mt-12 grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-lg mx-auto lg:mx-0 text-center lg:text-left"
            >
              <div>
                <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-[#f7e6ae]">99.4%</p>
                <p className="text-xs text-white/60 font-medium mt-1">Accuracy Rating</p>
              </div>
              <div>
                <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-emerald-400">10+ Yrs</p>
                <p className="text-xs text-white/60 font-medium mt-1">Field Experience</p>
              </div>
              <div>
                <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-sky-400">200+</p>
                <p className="text-xs text-white/60 font-medium mt-1">Schools Guided</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: stageY }} className="lg:col-span-5 relative" aria-label="Interactive 3D Stages">
            <HeroInteractiveStage reduce={reduce} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroInteractiveStage({ reduce }) {
  const stage = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 70, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 70, damping: 18 });

  function onMove(e) {
    if (reduce || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={stage}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative mx-auto aspect-[4/5] w-full max-w-[450px] select-none"
      style={{ perspective: 1200 }}
    >
      <motion.div
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute inset-[-10%] rounded-full border border-dashed border-emerald-500/25 opacity-70"
      />
      <motion.div
        animate={reduce ? {} : { rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute inset-[-4%] rounded-full border border-dashed border-amber-400/20 opacity-60"
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-gradient-to-tr from-emerald-500/30 via-amber-400/30 to-blue-500/30 blur-2xl animate-pulse" />

      <motion.div
        className="absolute inset-0 flex flex-col justify-between py-6"
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      >
        {HERO_STAGE_CARDS.map((card, i) => {
          const Icon = card.Icon;
          return (
            <motion.div
              key={card.title}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.5 + i * 0.2 }}
              whileHover={{ scale: 1.04, zIndex: 50, transition: { duration: 0.3 } }}
              className="relative group rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden"
              style={{ transform: `translateZ(${(3 - i) * 25}px)` }}
            >
              <div aria-hidden="true" className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-emerald-500/15 via-transparent to-amber-400/15 pointer-events-none" />

              <div className="flex items-start gap-4 relative z-10">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/20 bg-emerald-950/60 text-[#f7e6ae] shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Icon fontSize="medium" />
                </span>
                <div className="min-w-0">
                  <p className="text-[1.05rem] font-bold text-white tracking-wide">{card.title}</p>
                  <p className="mt-1 text-[0.85rem] leading-snug text-white/70">{card.desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─── KINETIC MARQUEE ────────────────────────────────────────────────────── */

function MethodMarquee() {
  return (
    <section className="relative z-20 -mt-px overflow-hidden border-y border-amber-400/30 bg-[#072413] py-1.5 shadow-md" aria-hidden="true">
      <Marquee pauseOnHover className="[--duration:32s]" repeat={2}>
        {MARQUEE_WORDS.map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-8 whitespace-nowrap pr-8">
            <span className="font-['DM_Serif_Display',Georgia,serif] text-sm sm:text-base italic tracking-wide text-[#f7e6ae] flex items-center gap-2">
              <SparkleDot />
              {word}
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}

function SparkleDot() {
  return (
    <motion.span animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="inline-flex">
      <AutoAwesomeIcon sx={{ fontSize: 16 }} className="text-emerald-400 opacity-80" />
    </motion.span>
  );
}

/* ─── INTERACTIVE RADAR / MIND MAP VISUALIZER ────────────────────────────── */

const VISUALIZER_PRESETS = {
  dmit: {
    label: 'DMIT Biometric Profile',
    tagline: 'Innate Brain Dominance & Subconscious Strengths',
    color: '#34d399',
    scores: [92, 85, 95, 78, 90],
    labels: ['Linguistic', 'Logical-Math', 'Spatial-Visual', 'Interpersonal', 'Intrapersonal'],
    description: 'Maps the distribution of 10 brain lobes to identify inherent cognitive tendencies, learning styles, and natural talent vectors.',
  },
  aptitude: {
    label: 'Psychometric Aptitude',
    tagline: 'Acquired Skills, Reasoning & Problem Solving',
    color: '#60a5fa',
    scores: [88, 94, 82, 91, 86],
    labels: ['Numerical', 'Verbal', 'Abstract', 'Mechanical', 'Spatial'],
    description: 'Evaluates logical speed, spatial visualization, pattern recognition, and conceptual comprehension under standardized parameters.',
  },
  personality: {
    label: 'Personality & Temperament',
    tagline: 'Behavioral Traits & Work Environment Fit',
    color: '#fbbf24',
    scores: [75, 90, 85, 94, 88],
    labels: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Emotional Resilience'],
    description: 'Uncovers core motivation drivers, stress tolerance, collaborative dynamics, and ideal team environment preferences.',
  },
};

function MindMapVisualizer() {
  const [activeTab, setActiveTab] = useState('dmit');
  const preset = VISUALIZER_PRESETS[activeTab];

  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-white text-[#061e12]">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">

          <h2 className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,4.5vw,3.8rem)] leading-[1.08] text-[#061e12]">
            Explore How We Map Your <span className="italic text-[#0a5c2c]">Cognitive Blueprint</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#061e12]/70">
            Select an assessment metric below to visualize how biometric and psychometric algorithms translate raw responses into clear career vectors.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {Object.entries(VISUALIZER_PRESETS).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${
                  activeTab === key
                    ? 'bg-[#0a5c2c] text-white shadow-lg scale-105'
                    : 'bg-[#061e12]/5 text-[#061e12]/70 hover:bg-[#061e12]/10 border border-[#061e12]/10'
                }`}
              >
                {data.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center rounded-3xl border border-[#061e12]/10 bg-[#fcfcfb] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[320px]">
            <RadarChart scores={preset.scores} labels={preset.labels} color={preset.color} />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#061e12]/5 text-[#0a5c2c] border border-[#061e12]/10">
                  {preset.tagline}
                </span>

                <h3 className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#061e12]">
                  {preset.label}
                </h3>

                <p className="text-base sm:text-lg text-[#061e12]/75 leading-relaxed">
                  {preset.description}
                </p>

                <div className="space-y-3 pt-4">
                  {preset.labels.map((lbl, idx) => (
                    <div key={lbl} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold tracking-wide text-[#061e12]/80">
                        <span>{lbl}</span>
                        <span className="font-bold text-[#0a5c2c]">{preset.scores[idx]}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#061e12]/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${preset.scores[idx]}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.08 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function RadarChart({ scores, labels, color }) {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const numPoints = 5;

  const getCoordinates = (values) => {
    return values.map((val, i) => {
      const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
      const r = (val / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
  };

  const polyPoints = getCoordinates(scores).map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative w-[300px] h-[300px] select-none">
      <svg width={size} height={size} className="overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="rgba(6,30,18,0.12)"
            strokeDasharray="4 4"
          />
        ))}

        {Array.from({ length: numPoints }).map((_, i) => {
          const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="rgba(6,30,18,0.15)" strokeWidth="1" />;
        })}

        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          points={polyPoints}
          fill={color}
          fillOpacity="0.4"
          stroke={color}
          strokeWidth="3"
        />

        {getCoordinates(scores).map((pt, i) => (
          <motion.circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="5"
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ─── BENTO AUDIENCE SECTION ─────────────────────────────────────────────── */

function AudienceCard({ item, index, featured }) {
  const Icon = item.Icon;
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  function onMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    glowX.set(((e.clientX - rect.left) / rect.width) * 100);
    glowY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  const spotlight = useMotionTemplate`radial-gradient(400px circle at ${glowX}% ${glowY}%, rgba(233,200,92,0.2) 0%, transparent 70%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMove}
      onClick={() => navigate(item.link || '/contact')}
      whileHover={{ y: -8, scale: 1.015, transition: { duration: 0.3, ease: EASE } }}
      className={`group relative overflow-hidden rounded-[2rem] p-8 sm:p-10 border cursor-pointer transition-all duration-500 ${
        featured
          ? 'bg-gradient-to-br from-[#062b18] via-[#093f24] to-[#08283e] border-amber-400/40 shadow-[0_25px_60px_-20px_rgba(6,43,24,0.6)] lg:col-span-7 lg:row-span-2'
          : 'bg-white border-[#0f2317]/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] lg:col-span-5'
      }`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                featured ? 'bg-amber-400/20 text-[#f7e6ae] border border-amber-400/30' : 'bg-[#062b18]/10 text-[#062b18]'
              }`}
            >
              <Icon sx={{ fontSize: 28 }} />
            </span>
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${featured ? 'bg-white/10 text-white/80' : 'bg-black/5 text-black/60'}`}>
              Target Group 0{index + 1}
            </span>
          </div>

          <h3 className={`mt-6 font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl leading-tight ${featured ? 'text-white' : 'text-[#0f2317]'}`}>
            {item.name}
          </h3>

          <p className={`mt-3 text-base leading-relaxed ${featured ? 'text-white/80' : 'text-[#47594c]'}`}>{item.desc}</p>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs font-bold tracking-wider uppercase group-hover:underline">
          <span className={featured ? 'text-[#f7e6ae]' : 'text-[#062b18]'}>Explore Guidance</span>
          <ArrowForwardIcon fontSize="small" className={`transition-transform duration-300 group-hover:translate-x-2 ${featured ? 'text-[#f7e6ae]' : 'text-[#062b18]'}`} />
        </div>
      </div>
    </motion.div>
  );
}

function Audience() {
  return (
    <section aria-labelledby="cc-audience-heading" className="relative overflow-hidden py-28 md:py-36 bg-[#fdfaf3]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">

          <h2 id="cc-audience-heading" className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,5vw,4rem)] leading-[1.06] text-[#0f2317]">
            Who Benefits Most From Our <span className="italic text-[#062b18]">Framework</span>?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#47594c]">
            Designed for students and parents seeking empirical clarity over subjective opinions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 auto-rows-fr">
          {AUDIENCE.map((item, i) => (
            <AudienceCard key={item.name} item={item} index={i} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES HORIZONTAL / STACK SECTION ────────────────────────────────── */

function ServicesPan({ onSelectService }) {
  return (
    <section className="relative overflow-hidden py-28 md:py-36 bg-gradient-to-b from-[#031208] via-[#062b18] to-[#04160a] text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center mb-20">

          <h2 className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,4.8vw,4rem)] leading-[1.08] text-white">
            Six Specialized Services, <span className="italic text-[#f7e6ae]">One Method</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/75">
            Every offering begins with unbiased biometric & psychometric mapping, culminating in an actionable 1-on-1 strategy session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {OFFER_DATA.map((service, i) => {
            const Icon = service.Icon;
            return (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                onClick={() => onSelectService(service)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/15 bg-white/[0.05] p-8 md:p-10 backdrop-blur-xl shadow-xl cursor-pointer"
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20 transition-opacity duration-500 group-hover:opacity-45 blur-2xl pointer-events-none"
                  style={{ background: service.color }}
                />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <Icon sx={{ fontSize: 30 }} style={{ color: service.accentHex }} />
                    </span>
                    <span className="text-[0.68rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-[#f7e6ae] border border-white/15">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-white group-hover:text-[#f7e6ae] transition-colors duration-300">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/70">
                    {service.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-[#f7e6ae] transition-colors duration-300">
                  <span className="underline group-hover:no-underline font-bold">Learn More & View Details</span>
                  <ArrowForwardIcon fontSize="small" className="transition-transform duration-300 group-hover:translate-x-2" style={{ color: service.accentHex }} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── JOURNEY TIMELINE SECTION ───────────────────────────────────────────── */

function Journey() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const railScale = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  return (
    <section ref={ref} aria-labelledby="cc-journey-heading" className="relative overflow-hidden py-28 md:py-36 bg-[#fdfaf3]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center mb-20">

          <h2 id="cc-journey-heading" className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,4.5vw,3.8rem)] leading-[1.08] text-[#0f2317]">
            Four Steps to <span className="italic text-[#062b18]">Absolute Clarity</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#47594c]">
            A structured, multi-phase journey pairing scientific data with empathetic human mentorship.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div aria-hidden="true" className="absolute left-[36px] md:left-[44px] top-6 bottom-6 w-1 -translate-x-1/2 bg-black/10 rounded-full" />
          <motion.div
            aria-hidden="true"
            style={{ scaleY: railScale }}
            className="absolute left-[36px] md:left-[44px] top-6 bottom-6 w-1 origin-top -translate-x-1/2 bg-gradient-to-b from-[#062b18] via-[#10b981] to-[#e9c85c] rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          />

          <div className="space-y-12">
            {STEPS_DATA.map((step, i) => {
              const Icon = step.Icon;
              return (
                <div key={step.title} className="relative pl-24 md:pl-28">
                  <div className="absolute left-[36px] md:left-[44px] top-8 -translate-x-1/2 z-10">
                    <motion.div
                      whileInView={{ scale: [0.6, 1.2, 1], opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="grid h-12 w-12 place-items-center rounded-full border-4 border-[#062b18] bg-white text-[#062b18] shadow-lg"
                    >
                      <Icon fontSize="small" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative overflow-hidden rounded-3xl border border-[#0f2317]/10 bg-white p-8 md:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#10b981] px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        {step.tag}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <SpeedIcon sx={{ fontSize: 16 }} /> {step.metrics}
                      </span>
                    </div>

                    <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-[#0f2317]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-base leading-relaxed text-[#47594c]">
                      {step.desc}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIAL CAROUSEL (AUTO-ADVANCING) ───────────────────────────────
   Quotes cycle automatically so the section keeps moving without input. The
   clock pauses while the reader is actually engaging — pointer hover, keyboard
   focus, or the section leaving the viewport — and never runs for users who
   have asked the OS to reduce motion. Arrow keys still step manually and the
   dot rail shows where in the cycle the reader is. */

const AUTO_ADVANCE_MS = 7000;

function Feedback() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, { amount: 0.35 });

  const prev = () => setIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  const next = () => setIndex((i) => (i + 1) % QUOTES.length);

  // Auto-advance: only while visible, not paused, and motion is permitted.
  useEffect(() => {
    if (reduce || paused || !sectionInView || QUOTES.length < 2) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused, sectionInView]);

  const q = QUOTES[index];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cc-feedback-heading"
      className="relative overflow-hidden py-28 md:py-36 bg-[#031208] text-white"
    >
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">

          <h2 id="cc-feedback-heading" className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,4.8vw,3.8rem)] leading-[1.08] text-white">
            Transformative <span className="italic text-[#f7e6ae]">Parent & Student</span> Experiences
          </h2>
        </div>

        <div
          className="relative mx-auto max-w-4xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 sm:p-14 backdrop-blur-2xl shadow-2xl">
            <span aria-hidden="true" className="absolute top-4 left-6 font-['DM_Serif_Display',Georgia,serif] text-8xl text-amber-400/20 select-none pointer-events-none">
              “
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                aria-live={paused ? 'polite' : 'off'}
                className="relative z-10 space-y-6"
              >
                <span className="inline-block text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {q.tag}
                </span>

                <blockquote className="font-['DM_Serif_Display',Georgia,serif] text-xl sm:text-2xl md:text-3xl leading-relaxed text-white">
                  "{q.quote}"
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/15">
                  <div>
                    <p className="text-lg font-bold text-[#f7e6ae]">{q.name}</p>
                    <p className="text-xs text-white/70">{q.role}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={prev}
                      aria-label="Previous quote"
                      className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                    >
                      <NavigateBeforeIcon />
                    </button>
                    <button
                      onClick={next}
                      aria-label="Next quote"
                      className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                    >
                      <NavigateNextIcon />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot rail — shows the auto-cycle position and lets readers jump. */}
          <div className="mt-8 flex justify-center gap-2.5">
            {QUOTES.map((quote, i) => (
              <button
                key={quote.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show experience from ${quote.name}`}
                aria-pressed={i === index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-9 bg-[#e9c85c]' : 'w-2 bg-white/25 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA SECTION ──────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-32 md:py-44 bg-gradient-to-br from-[#062b18] via-[#08331c] to-[#0b2f4c] text-white text-center">
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-400/20 text-[#f7e6ae] border border-amber-400/30">
            Begin Your Strategic Pathway
          </span>

          <h2 className="font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.8rem,5.5vw,4.8rem)] leading-[1.05] text-white">
            Ready to Eliminate <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#f7e6ae] to-[#34d399]">Career Ambiguity</span>?
          </h2>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
            Sessions are available by prior appointment in Surat or online across India. Take the first step toward evidence-backed decision making today.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-5">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-10 py-4 text-base font-bold text-[#091a10] no-underline shadow-[0_20px_50px_rgba(233,200,92,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(233,200,92,0.85)] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              <WhatsAppIcon fontSize="small" />
              Book Session via WhatsApp
              <ArrowForwardIcon fontSize="small" className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-9 py-4 text-base font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/40 active:scale-[0.98]"
            >
              Contact Us Page
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */

export default function CareerCounselling() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <div className="w-full max-w-full overflow-x-clip bg-[#fdfaf3]">
      <Hero />
      <MindMapVisualizer />
      <Audience />
      <ServicesPan onSelectService={(service) => setSelectedService(service)} />
      <Journey />
      <Feedback />
      <FinalCta />

      {/* Service Details Modal */}
      <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
    </div>
  );
}
