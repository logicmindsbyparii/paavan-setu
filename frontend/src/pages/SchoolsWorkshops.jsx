import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from 'framer-motion';

import { brand, FIELD_GRADIENT } from '../constants/brand';
import { WHATSAPP_NUMBER } from '../constants/urls';
import { Marquee } from '../components/ui/Marquee';

import GroupsIcon from '@mui/icons-material/Groups';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TuneIcon from '@mui/icons-material/Tune';
import VerifiedIcon from '@mui/icons-material/Verified';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import PsychologyIcon from '@mui/icons-material/Psychology';

// ─── DATA ──────────────────────────────────────────────────────────────────
const PROGRAMMES = [
  {
    id: 'student-dev',
    Icon: SchoolIcon,
    title: 'Student Development & Leadership',
    duration: '1–2 Hours / Session',
    audience: 'Class 1–12 Students',
    tagline: 'Building emotional intelligence, character strength, and lifelong study habits.',
    desc: 'High-energy, highly interactive workshops focusing on life skills, value education, emotional regulation, and stress management.',
    highlights: [
      'Emotional intelligence & resilience building',
      'Goal-setting & study focus techniques',
      'Value-based reflection workbooks included',
      'Interactive peer group activities & scenario exercises',
    ],
    outcomes: [
      'Increased academic focus & exam anxiety reduction',
      'Clear self-awareness of personal strengths',
      'Enhanced peer empathy & decision-making skills',
    ],
    tone: '#0a5c2c',
    bgTone: 'rgba(10, 92, 44, 0.08)',
    format: 'On-Site Workshop + Workbook Kit',
  },
  {
    id: 'parent-eng',
    Icon: PeopleAltIcon,
    title: 'Parent Engagement & Child Psychology',
    duration: '1.5–2 Hours',
    audience: 'Parents & Guardians',
    tagline: 'Empowering parents with developmental insights and career guidance tools.',
    desc: 'Empathetic guidance on adolescent psychology, digital wellbeing, academic stress support, and non-coercive career orientation.',
    highlights: [
      'Decoding adolescent psychology & mood shifts',
      'Effective academic support without pressure',
      'Navigating modern career paths in India',
      'Strengthening parent-child trust & communication',
    ],
    outcomes: [
      'Reduced family anxiety surrounding board exams',
      'Constructive dialogue on stream & subject choices',
      'Practical tools for screen-time & focus management',
    ],
    tone: '#174a72',
    bgTone: 'rgba(23, 74, 114, 0.08)',
    format: 'Interactive Parent Townhall',
  },
  {
    id: 'teacher-trg',
    Icon: MenuBookIcon,
    title: 'Teacher Empowerment & Pedagogy',
    duration: '2–3 Hours / Half-Day',
    audience: 'Educators & Coordinators',
    tagline: 'Equipping teachers to integrate values seamlessly without expanding lesson prep.',
    desc: 'Professional development workshops focusing on value-integrated pedagogy, inclusive classroom management, and student mentoring.',
    highlights: [
      'Value-integrated teaching methodologies',
      'Classroom management & active engagement tools',
      'Early identification of student distress',
      'Ready-to-use micro-lesson activity cards',
    ],
    outcomes: [
      'Teachers equipped with zero-prep value modules',
      'Improved classroom harmony & student rapport',
      'Enhanced teacher motivation & burnout prevention',
    ],
    tone: '#d9ae3c',
    bgTone: 'rgba(217, 174, 60, 0.1)',
    format: 'Faculty Enrichment Seminar',
  },
  {
    id: 'curr-integ',
    Icon: IntegrationInstructionsIcon,
    title: 'Whole-School Curriculum Integration',
    duration: 'Multi-Month / Annual',
    audience: 'School Management & Institutions',
    tagline: 'A complete institutional ecosystem embedding values into the school culture.',
    desc: 'End-to-end strategic integration mapping value education into your existing academic calendar with workbooks and progress analytics.',
    highlights: [
      'Custom curriculum mapping tailored to CBSE/GSEB/ICSE',
      'Phased institutional rollout & monthly milestones',
      'Dedicated expert facilitator & mentor assigned',
      'Comprehensive annual impact reporting & assessments',
    ],
    outcomes: [
      'Measurable boost in institutional culture & reputation',
      'Complete aligned ecosystem across all grades',
      'Seamless compliance with NEP 2020 holistic goals',
    ],
    tone: '#0a5c2c',
    bgTone: 'rgba(10, 92, 44, 0.08)',
    format: 'Full Academic Year Partnership',
  },
];

const WHY_US = [
  { icon: <EmojiPeopleIcon />, tone: '#0a5c2c', title: 'Goal-Oriented Design', desc: 'Every programme is mapped to measurable student emotional & academic outcomes.' },
  { icon: <MenuBookIcon />, tone: '#174a72', title: 'Curriculum-Aligned', desc: 'Sessions seamlessly complement existing schedules without academic disruption.' },
  { icon: <GroupsIcon />, tone: '#d9ae3c', title: 'School-Wide Ecosystem', desc: 'Holistic alignment uniting students, teachers, and parents in a shared mission.' },
  { icon: <TrendingUpIcon />, tone: '#0a5c2c', title: 'Data-Backed Frameworks', desc: 'Assessments utilize internationally validated psychometric and DMIT principles.' },
  { icon: <SchoolIcon />, tone: '#174a72', title: 'On-Site Facilitation', desc: 'Our senior expert facilitators travel to your campus — zero logistics hassle for you.' },
  { icon: <HandshakeIcon />, tone: '#d9ae3c', title: 'Sustained Post-Workshop Support', desc: 'Includes follow-up digital workbooks and quarterly impact reviews for your faculty.' },
];

const TRUSTED_SCHOOLS = [
  'Podar International School',
  'Delhi Public School',
  'Ryan International School',
  'Dhirubhai Ambani School',
  'Lancers International School',
  'BVIS Surat',
  'Shanti Asian School',
  'Swaminarayan Gurukul',
];

const TESTIMONIALS = [
  {
    quote: "The workshop transformed how our students approach career decisions and emotional resilience. The facilitator was exceptional and the materials were world-class.",
    author: "Rajesh Sharma",
    role: "Principal, Podar International School",
    badge: "Student & Parent Series",
  },
  {
    quote: "Paawan Setu's teacher empowerment session gave our faculty practical tools that required zero extra prep time. The classroom vibe has improved noticeably.",
    author: "Dr. Sunita Patel",
    role: "Academic Director, Delhi Public School",
    badge: "Teacher Training Module",
  },
  {
    quote: "The holistic alignment between parents and school was remarkable. Parents felt understood, and students walked away with clear career direction.",
    author: "Vikram Desai",
    role: "Trustee, Shanti Asian School",
    badge: "Curriculum Integration",
  },
];

const STATS = [
  { num: '20+', label: 'Partner Schools in Gujarat' },
  { num: '2,500+', label: 'Students & Parents Guided' },
  { num: '98%', label: 'Positive School Feedback' },
  { num: '60+', label: 'Workshops Conducted' },
];

// ─── PARTICLE CANVAS BACKDROP (LIGHT THEME) ────────────────────────────────
function InteractiveWorkshopCanvas() {
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

    const nodeCount = 36;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
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

        // Mouse attraction
        const dxMouse = mouseX - node.x;
        const dyMouse = mouseY - node.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 180) {
          node.x += (dxMouse / distMouse) * 0.2;
          node.y += (dyMouse / distMouse) * 0.2;
        }

        // Draw connections
        for (let j = i + 1; j < nodeCount; j++) {
          const target = nodes[j];
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.2;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = i % 2 === 0 ? `rgba(10, 92, 44, ${alpha})` : `rgba(217, 174, 60, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Node render
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

// ─── PROGRAMME DETAIL MODAL ────────────────────────────────────────────────
function ProgrammeModal({ programme, onClose }) {
  if (!programme) return null;

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
        className="relative w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 text-[#111d11] shadow-2xl"
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
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: `${programme.tone}15`, color: programme.tone, border: `1px solid ${programme.tone}30` }}
          >
            <programme.Icon fontSize="medium" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0a5c2c]">{programme.audience}</span>
            <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#111d11]">{programme.title}</h3>
          </div>
        </div>

        <p className="text-sm text-[#4a5568] leading-relaxed mb-6">
          {programme.desc}
        </p>

        <div className="space-y-4">
          <div className="rounded-2xl bg-[#fdfaf3] p-4 border border-gray-200/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0a5c2c] block mb-2">Curriculum Highlights</span>
            <ul className="space-y-1.5 text-xs text-[#4a5568]">
              {programme.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0a5c2c]" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-200/80">
            <div>
              <span className="text-xs text-[#4a5568] block">Session Format</span>
              <span className="text-xs font-bold text-[#111d11]">{programme.format}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#4a5568] block">Typical Duration</span>
              <span className="text-xs font-bold text-[#0a5c2c]">{programme.duration}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/contact"
            onClick={onClose}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-xs font-bold text-[#111d11] no-underline shadow-md"
            style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
          >
            Request Official Proposal
            <ArrowForwardIcon fontSize="small" />
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Paawan Setu! We are interested in the ${programme.title} workshop for our school.`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#0a5c2c]/30 bg-[#0a5c2c]/10 py-3.5 px-6 text-xs font-bold text-[#0a5c2c] hover:bg-[#0a5c2c] hover:text-white transition-all no-underline"
          >
            <WhatsAppIcon fontSize="small" /> Instant WhatsApp Query
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── WORKSHOP PLANNER WIDGET ───────────────────────────────────────────────
function WorkshopPlannerWidget() {
  const [targetAudience, setTargetAudience] = useState('students');
  const [studentCount, setStudentCount] = useState(250);
  const [includeDMIT, setIncludeDMIT] = useState(true);
  const [includeWorkbooks, setIncludeWorkbooks] = useState(true);

  // Dynamic calculations
  const estimatedSessions = Math.ceil(studentCount / 75);
  const durationHours = estimatedSessions * 1.5;
  const facilitatorsNeeded = studentCount > 400 ? 3 : 2;

  const getPresetTitle = () => {
    switch (targetAudience) {
      case 'students':
        return 'Student Empowerment & Values Drive';
      case 'parents':
        return 'Parenting & Career Synergy Series';
      case 'teachers':
        return 'Faculty Pedagogy & Mentorship Intensive';
      case 'ecosystem':
        return 'Whole-School Holistic Ecosystem';
      default:
        return 'Custom Workshop Programme';
    }
  };

  const whatsappMessage = `Hello Paawan Setu! We are interested in configuring a workshop program for our school:
• Programme: ${getPresetTitle()}
• Target Audience: ${targetAudience.toUpperCase()}
• Estimated Participants: ${studentCount}
• Include DMIT Screening: ${includeDMIT ? 'Yes' : 'No'}
• Include Reflection Workbooks: ${includeWorkbooks ? 'Yes' : 'No'}
• Estimated Sessions: ${estimatedSessions} (${durationHours} hrs total)
Please provide dates and official quotation.`;

  return (
    <div className="relative rounded-3xl border border-emerald-900/15 bg-gradient-to-br from-[#082b19] via-[#071f14] to-[#0b2f4c] p-6 sm:p-10 backdrop-blur-xl shadow-2xl text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e8b86d]/40 bg-[#e8b86d]/10 px-3.5 py-1 text-xs font-semibold text-[#f5d9a0] mb-3">
            <TuneIcon sx={{ fontSize: 14 }} /> Interactive School Workshop Configurator
          </div>
          <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-white">
            Build Your Customized School Programme
          </h3>
        </div>
        <div className="text-left md:text-right shrink-0">
          <span className="text-xs font-medium uppercase tracking-wider text-white/50 block">Estimated Duration</span>
          <span className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#f7e6bd]">{durationHours} Hours</span>
          <span className="text-xs text-white/60 block">({estimatedSessions} Interactive Sessions)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Audience Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
              1. Select Primary Target Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'students', label: 'Students', sub: 'Class 1-12' },
                { id: 'parents', label: 'Parents', sub: 'Psychology' },
                { id: 'teachers', label: 'Teachers', sub: 'Pedagogy' },
                { id: 'ecosystem', label: 'Entire School', sub: '360° Plan' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTargetAudience(tab.id)}
                  className={`rounded-2xl p-3 text-left transition-all ${
                    targetAudience === tab.id
                      ? 'bg-gradient-to-r from-[#f7e6bd] to-[#e8b86d] text-[#111d11] font-semibold shadow-lg'
                      : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs sm:text-sm font-bold leading-tight">{tab.label}</p>
                  <p className={`text-[0.68rem] mt-0.5 ${targetAudience === tab.id ? 'text-[#111d11]/80' : 'text-white/50'}`}>
                    {tab.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Student / Participant Count Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                2. Estimated Number of Participants
              </label>
              <span className="text-sm font-bold text-[#e8b86d] bg-white/10 px-3 py-1 rounded-full">
                {studentCount} {targetAudience === 'teachers' ? 'Teachers' : 'Participants'}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-white/20 appearance-none cursor-pointer accent-[#e8b86d]
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e8b86d] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#e8b86d] [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-[0.68rem] text-white/40 mt-1">
              <span>50</span>
              <span>250</span>
              <span>500</span>
              <span>1,000+</span>
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
              3. Enhanced Modules & Materials
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setIncludeDMIT(!includeDMIT)}
                className={`flex items-center gap-3 rounded-xl p-3.5 border cursor-pointer transition-all ${
                  includeDMIT ? 'border-[#e8b86d] bg-[#e8b86d]/15 text-white' : 'border-white/10 bg-white/5 text-white/60'
                }`}
              >
                <input type="checkbox" checked={includeDMIT} onChange={() => {}} className="hidden" />
                <PsychologyIcon sx={{ fontSize: 20, color: includeDMIT ? '#e8b86d' : 'inherit' }} />
                <div>
                  <p className="text-xs font-bold">DMIT Biometric Screening</p>
                  <p className="text-[0.68rem] opacity-70">Aptitude & brain dominance mapping</p>
                </div>
              </label>

              <label
                onClick={() => setIncludeWorkbooks(!includeWorkbooks)}
                className={`flex items-center gap-3 rounded-xl p-3.5 border cursor-pointer transition-all ${
                  includeWorkbooks ? 'border-[#96cead] bg-[#96cead]/15 text-white' : 'border-white/10 bg-white/5 text-white/60'
                }`}
              >
                <input type="checkbox" checked={includeWorkbooks} onChange={() => {}} className="hidden" />
                <AutoStoriesIcon sx={{ fontSize: 20, color: includeWorkbooks ? '#96cead' : 'inherit' }} />
                <div>
                  <p className="text-xs font-bold">Physical Value Workbooks</p>
                  <p className="text-[0.68rem] opacity-70">Take-home activity kits for every child</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Summary Card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-white/[0.05] border border-white/10 p-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#e8b86d] mb-4">
              Configured Programme Overview
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Selected Framework</span>
                <span className="text-sm font-semibold text-white">{getPresetTitle()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Facilitation Team</span>
                <span className="text-sm font-semibold text-[#f7e6bd]">{facilitatorsNeeded} Senior Mentors</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Workbooks Allocated</span>
                <span className="text-sm font-semibold text-white">{includeWorkbooks ? `${studentCount} Kits` : 'Digital Only'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/70">Follow-up Mentoring</span>
                <span className="text-sm font-semibold text-[#e8b86d]">Included (30-day window)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 space-y-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-sm font-bold text-[#111d11] no-underline transition-all duration-300 hover:shadow-[0_10px_30px_rgba(232,184,109,0.5)]"
              style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
            >
              <WhatsAppIcon fontSize="small" /> Book This Plan on WhatsApp
            </a>
            <Link
              to="/contact"
              className="w-full flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 py-3 px-6 text-xs font-semibold text-white/80 no-underline hover:bg-white/15 transition-colors"
            >
              Schedule Official Campus Meeting
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function SchoolsWorkshops() {
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialPaused, setTestimonialPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const testimonialSectionRef = useRef(null);
  const testimonialInView = useInView(testimonialSectionRef, { amount: 0.35 });

  // Auto-advance testimonials: only while visible, not paused, and motion permitted.
  useEffect(() => {
    if (reduceMotion || testimonialPaused || !testimonialInView || TESTIMONIALS.length < 2) return undefined;
    const id = window.setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [reduceMotion, testimonialPaused, testimonialInView]);

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
        {/* Particle Canvas */}
        <InteractiveWorkshopCanvas />

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

            {/* Left Column: Heading + Call-to-actions */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <h1 className="font-['DM_Serif_Display',Georgia,serif] text-[#111d11] text-[clamp(2.5rem,5.5vw,4.4rem)] leading-[1.08] tracking-[-0.02em] mb-6">
                Transforming Schools Through{' '}
                <span className="italic text-[#0a5c2c] relative inline-block">
                  Value Education
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
                </span>{' '}
                & Guidance
              </h1>

              <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-[1.75] text-[#4a5568]">
                On-site interactive workshops designed for students, parents, and teachers — driving academic focus, emotional resilience, and lifelong character.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold text-[#111d11] no-underline shadow-[0_14px_34px_-14px_rgba(168,128,31,0.85)] transition-all duration-300 hover:shadow-[0_20px_44px_-12px_rgba(168,128,31,0.95)] hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
                >
                  <CalendarTodayIcon fontSize="small" />
                  Schedule a School Workshop
                  <ArrowForwardIcon fontSize="small" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Paawan Setu! I would like to enquire about conducting workshops at our school.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#0a5c2c]/30 bg-white/80 px-8 py-4 text-sm font-semibold text-[#0a5c2c] no-underline shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-[#0a5c2c] hover:text-white hover:border-[#0a5c2c]"
                >
                  <WhatsAppIcon fontSize="small" />
                  Instant WhatsApp Enquiry
                </a>
              </div>
            </motion.div>

            {/* Right Column: 3D Mouse Tilt Interactive Card Stack */}
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[420px] space-y-3.5">
                {PROGRAMMES.slice(0, 3).map((prog) => {
                  const Icon = prog.Icon;
                  return (
                    <motion.div
                      key={prog.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => setSelectedProgramme(prog)}
                      className="group cursor-pointer rounded-2xl border border-[#0a5c2c]/15 bg-white/95 p-5 shadow-[0_10px_30px_-10px_rgba(10,92,44,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-[#0a5c2c]/35 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${prog.tone}15`, color: prog.tone, border: `1px solid ${prog.tone}30` }}
                          >
                            <Icon sx={{ fontSize: 24 }} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#111d11] group-hover:text-[#0a5c2c] transition-colors">
                              {prog.title}
                            </h4>
                            <p className="text-xs text-[#4a5568] mt-0.5">
                              {prog.audience} · {prog.duration}
                            </p>
                          </div>
                        </div>
                        <ArrowForwardIcon fontSize="small" className="text-[#0a5c2c]/40 group-hover:text-[#0a5c2c] group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  );
                })}

                <div className="rounded-2xl border border-[#d9ae3c]/30 bg-[#fdfaf3] p-4 text-center">
                  <p className="text-xs font-semibold text-[#0a5c2c] flex items-center justify-center gap-2">
                    <AutoAwesomeIcon sx={{ fontSize: 16, color: '#d9ae3c' }} /> Custom Curriculum Mapping Available for All Boards
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Stats Bar */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-gray-200/80 pt-8">
            {STATS.map((stat, i) => (
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
      {/* PROGRAMMES BENTO GRID                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#f9faf7] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="programmes-heading">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 id="programmes-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-4">
              Comprehensive Workshop Modules
            </h2>
            <p className="text-base sm:text-lg text-[#4a5568]">
              Designed for every stakeholder in a student's journey — from classroom engagement to parental alignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROGRAMMES.map((prog, i) => {
              const Icon = prog.Icon;
              return (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  onMouseMove={handleSpotlightMove}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#0a5c2c]/35 hover:shadow-md"
                  style={{
                    background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${prog.tone}0c, transparent 40%)`,
                  }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${prog.tone}12`, color: prog.tone, border: `1px solid ${prog.tone}25` }}
                    >
                      <Icon sx={{ fontSize: 32 }} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 border border-gray-200/80 px-3 py-1 text-xs font-semibold text-[#4a5568]">
                        {prog.duration}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#111d11] mb-2 group-hover:text-[#0a5c2c] transition-colors">
                    {prog.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#0a5c2c] mb-4">{prog.audience}</p>
                  <p className="text-sm text-[#4a5568] leading-relaxed mb-6">{prog.desc}</p>

                  <ul className="space-y-2 mb-8">
                    {prog.highlights.slice(0, 3).map((h, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs sm:text-sm text-[#4a5568]">
                        <CheckCircleOutlineIcon sx={{ fontSize: 18, color: prog.tone, mt: 0.1, flexShrink: 0 }} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setSelectedProgramme(prog)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#0a5c2c]/30 bg-[#0a5c2c]/10 py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#0a5c2c] hover:bg-[#0a5c2c] hover:text-white transition-all"
                  >
                    Explore Full Curriculum & Details
                    <ArrowForwardIcon fontSize="small" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* WORKSHOP PLANNER WIDGET SECTION                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#fffdf8] py-20 sm:py-28 overflow-hidden border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <WorkshopPlannerWidget />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* WHY SCHOOLS CHOOSE US                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#f9faf7] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="why-us-heading">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 id="why-us-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-4">
              Why Leading Schools Choose Paawan Setu
            </h2>
            <p className="text-base sm:text-lg text-[#4a5568]">
              Built around measurable student growth, curriculum alignment, and zero hassle for school management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_US.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#0a5c2c]/30 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                  style={{ backgroundColor: `${item.tone}12`, color: item.tone, border: `1px solid ${item.tone}25` }}
                >
                  {item.icon}
                </div>
                <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#4a5568] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TRUSTED SCHOOLS & TESTIMONIAL STAGE                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section ref={testimonialSectionRef} className="relative bg-[#fffdf8] py-20 sm:py-28 overflow-hidden border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-4 text-center">
            Trusted by Schools Across Gujarat
          </h2>
        </div>

        {/* Infinite Marquee Ticker */}
        <div className="mb-20">
          <Marquee pauseOnHover className="py-4">
            {TRUSTED_SCHOOLS.map((school, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-full border border-gray-200/90 bg-white px-6 py-3 shadow-sm whitespace-nowrap text-sm font-semibold text-[#111d11]"
              >
                <SchoolIcon sx={{ fontSize: 20, color: '#0a5c2c' }} />
                <span>{school}</span>
              </div>
            ))}
          </Marquee>
        </div>

        {/* Testimonial Interactive Switcher (auto-advancing) */}
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="relative rounded-3xl border border-gray-200/80 bg-white p-8 sm:p-12 shadow-[0_20px_50px_-15px_rgba(10,92,44,0.06)] text-center"
            onMouseEnter={() => setTestimonialPaused(true)}
            onMouseLeave={() => setTestimonialPaused(false)}
            onFocusCapture={() => setTestimonialPaused(true)}
            onBlurCapture={() => setTestimonialPaused(false)}
          >
            <FormatQuoteIcon sx={{ fontSize: 64, color: 'rgba(10, 92, 44, 0.15)', mb: 2 }} />

            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <blockquote className="font-['DM_Serif_Display',Georgia,serif] text-xl sm:text-3xl text-[#111d11] leading-relaxed mb-8">
                  "{TESTIMONIALS[testimonialIndex].quote}"
                </blockquote>

                <p className="text-lg font-bold text-[#0a5c2c]">{TESTIMONIALS[testimonialIndex].author}</p>
                <p className="text-xs uppercase tracking-wider text-[#4a5568] mt-1">{TESTIMONIALS[testimonialIndex].role}</p>
                <span className="inline-block mt-3 rounded-full bg-[#0a5c2c]/10 border border-[#0a5c2c]/20 px-3.5 py-1 text-[0.68rem] font-semibold text-[#0a5c2c]">
                  {TESTIMONIALS[testimonialIndex].badge}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setTestimonialIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#111d11] hover:bg-gray-200 transition-colors"
                aria-label="Previous testimonial"
              >
                <NavigateBeforeIcon />
              </button>
              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialIndex(idx)}
                    className="group flex h-11 items-center px-1.5"
                    aria-label={`Go to testimonial ${idx + 1}`}
                    aria-pressed={idx === testimonialIndex}
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        idx === testimonialIndex ? 'w-8 bg-[#0a5c2c]' : 'w-2 bg-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setTestimonialIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#111d11] hover:bg-gray-200 transition-colors"
                aria-label="Next testimonial"
              >
                <NavigateNextIcon />
              </button>
            </div>
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
            Bring these transformative programmes to{' '}
            <span className="italic text-[#f7e6bd]">your school</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg leading-relaxed text-white/80">
            Custom schedules, board curriculum mapping, and on-site facilitation available across Gujarat.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Paawan Setu! I would like to schedule a workshop consultation for our school.')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full px-9 py-4 text-base font-bold text-[#111d11] no-underline shadow-2xl transition-all duration-300 hover:scale-[1.03]"
              style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
            >
              <WhatsAppIcon fontSize="small" />
              Chat on WhatsApp Now
            </a>
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-9 py-4 text-base font-bold text-white no-underline hover:bg-white/20 transition-all"
            >
              <CalendarTodayIcon fontSize="small" />
              Schedule Official Campus Meeting
            </Link>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProgramme && (
          <ProgrammeModal programme={selectedProgramme} onClose={() => setSelectedProgramme(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
