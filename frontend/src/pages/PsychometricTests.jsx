import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useSpring, useReducedMotion } from 'framer-motion';

import PsychologyIcon from "@mui/icons-material/Psychology";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import EngineeringIcon from "@mui/icons-material/Engineering";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentIcon from "@mui/icons-material/Assignment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TimerIcon from "@mui/icons-material/Timer";
import QuizIcon from "@mui/icons-material/Quiz";
import SearchIcon from "@mui/icons-material/Search";

import { colors } from "../constants/tokens";
import { WHATSAPP_NUMBER } from "../constants/urls";
import TestsHero from "../components/ui/TestsHero";
import { getTests, logApiFailure } from "../lib/api";

/* ─── UI CONFIGURATION ───────────────────────────────────────────────────── */

/* Presentation is per-slug; FACTS come from the API.
   This map used to hold duration and question counts for slugs that do not
   exist in the database ("commerce-script", "stream-test", …), so every card
   fell through to invented defaults — a 30-item inventory advertised itself as
   "15 Questions" — and the category filter matched nothing at all. */
const ICON_BY_SLUG = {
  "holland-code-career-test": PsychologyIcon,
  "engineering-branch-selector": EngineeringIcon,
  "logical-reasoning-aptitude": TrendingUpIcon,
  "career-stream-selector": TrendingUpIcon,
  "commerce-stream-selector": AccountBalanceIcon,
  "humanities-stream-selector": AutoStoriesIcon,
  "stream-selector-test": TrendingUpIcon,
  "commerce-career-selector": AccountBalanceIcon,
};

const CATEGORY_BY_SLUG = {
  "holland-code-career-test": "Aptitude & Career",
  "engineering-branch-selector": "Stream & Subject Selection",
  "logical-reasoning-aptitude": "Aptitude & Career",
  "stream-selector-test": "Stream & Subject Selection",
  "commerce-career-selector": "Stream & Subject Selection",
  "career-stream-selector": "Stream & Subject Selection",
  "commerce-stream-selector": "Stream & Subject Selection",
  "humanities-stream-selector": "Stream & Subject Selection",
};

const CATEGORIES = ["All Assessments", "Stream & Subject Selection", "Aptitude & Career"];

/** Everything the card and preview need, derived from the test itself. */
const deriveMeta = (test) => {
  if (!test) return { category: "Assessment", duration: "Untimed", questionsCount: "—", highlights: [], sampleQ: "" };
  const count = test.questionsCount ?? (Array.isArray(test.questions) ? test.questions.length : null);
  const dimensions = (test.categories || []).slice(0, 3);
  const highlights = [
    ...dimensions,
    test.scoringMode === 'scored' ? 'Scored feedback' : 'Personalised profile',
  ].slice(0, 4);
  return {
    category: CATEGORY_BY_SLUG[test.slug] || "Aptitude & Career",
    duration: test.timeLimit ? `${test.timeLimit} Mins` : 'Untimed',
    questionsCount: count ? `${count} Questions` : '—',
    highlights,
    sampleQ: test.sampleQuestion || '',
  };
};

const getBentoStyle = (index) => {
  const pattern = index % 5;
  if (pattern === 0) return { colSpan: "md:col-span-7" };
  if (pattern === 1) return { colSpan: "md:col-span-5" };
  if (pattern === 2) return { colSpan: "md:col-span-4" };
  if (pattern === 3) return { colSpan: "md:col-span-4" };
  return { colSpan: "md:col-span-4" };
};

/* ─── TEST PREVIEW MODAL ─────────────────────────────────────────────────── */

function TestPreviewModal({ test, onClose, onStart }) {
  // Escape closes the preview; while it is open the page behind should not scroll.
  useEffect(() => {
    if (!test) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [test, onClose]);

  if (!test) return null;

  const meta = deriveMeta(test);
  const Icon = ICON_BY_SLUG[test.slug] || AssignmentIcon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#061e12]/45 backdrop-blur-sm"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={test?.name || 'Assessment preview'}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 text-zinc-900 shadow-[0_32px_80px_-24px_rgba(10,79,34,0.28)] sm:p-10"
        >
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="absolute top-6 right-6 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition-transform duration-150 ease-out hover:scale-[1.05] hover:bg-zinc-200 hover:text-zinc-800 active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
          >
            <CloseIcon fontSize="small" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-900/10 bg-[#eef6f0] text-[#0a5c2c] shadow-sm">
              <Icon sx={{ fontSize: 32 }} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#0a5c2c]/[0.06] text-[#0a5c2c] border border-[#0a5c2c]/15">
                {meta.category || "Standardized Assessment"}
              </span>
              <h3 className="mt-1 font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-[#061e12] tracking-tight">
                {test.name}
              </h3>
            </div>
          </div>

          <p className="text-base leading-relaxed text-zinc-600 mb-6" style={{ textWrap: 'pretty' }}>
            {test.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f6faf7] border border-emerald-900/[0.06]">
              <TimerIcon className="text-[#0a5c2c]" sx={{ fontSize: 22 }} />
              <div>
                <p className="text-xs text-zinc-500 font-medium">Time required</p>
                <p className="text-sm font-bold tabular-nums text-zinc-900">{meta.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f6faf7] border border-emerald-900/[0.06]">
              <QuizIcon className="text-[#8a6a1f]" sx={{ fontSize: 22 }} />
              <div>
                <p className="text-xs text-zinc-500 font-medium">Questions</p>
                <p className="text-sm font-bold tabular-nums text-zinc-900">{meta.questionsCount}</p>
              </div>
            </div>
          </div>

          {meta.highlights && (
            <div className="rounded-2xl border border-emerald-900/[0.06] bg-[#f6faf7] p-5 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#8a6a1f] mb-3">Key outcomes & insights</p>
              <div className="space-y-2">
                {meta.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-zinc-700">
                    <CheckCircleOutlineIcon fontSize="small" className="text-[#0a5c2c] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta.sampleQ && (
            <div className="p-4 rounded-2xl bg-[#eef6f0] border border-emerald-900/10 mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0a5c2c] mb-1">Sample question</p>
              <p className="text-sm italic text-zinc-700">"{meta.sampleQ}"</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                onClose();
                onStart(test.slug);
              }}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-bold text-[#051a0d] shadow-[0_12px_28px_-10px_rgba(217,174,60,0.7)] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              Start Assessment Now
              <ArrowForwardIcon fontSize="small" />
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-4 text-sm font-semibold text-zinc-600 transition-[transform,background-color,color] duration-150 ease-out hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
            >
              Close preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── BENTO CARD COMPONENT ───────────────────────────────────────────────── */

const BentoTestCard = React.forwardRef(({ test, index, onStart, onPreview }, ref) => {
  const reduceMotion = useReducedMotion();
  const custom = deriveMeta(test);
  const Icon = ICON_BY_SLUG[test.slug] || AssignmentIcon;
  const { colSpan } = getBentoStyle(index);

  const cardRef = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  function onMouseMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mouseX.set(x);
    mouseY.set(y);
    glowX.set(x * 100);
    glowY.set(y * 100);
  }

  const setRefs = (node) => {
    cardRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const spotlight = useMotionTemplate`radial-gradient(500px circle at ${glowX}% ${glowY}%, rgba(10,92,44,0.06) 0%, transparent 70%)`;
  const isFeatured = index === 0;

  return (
    <motion.div
      ref={setRefs}
      onMouseMove={onMouseMove}
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
      animate={reduceMotion
        ? { opacity: 1 }
        // Staggered cascade on mount (30-80ms per card); hover/exit keep their
        // own undelayed transition from the `transition` prop below.
        : { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26, delay: Math.min(index * 0.06, 0.3) } }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: 'easeOut' } }}
      whileHover={reduceMotion ? {} : { y: -5 }}
      whileTap={reduceMotion ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[2.25rem] border p-7 text-left transition-[box-shadow,border-color,background-color] duration-300 ease-out md:p-9 ${colSpan} cursor-pointer active:scale-[0.98] ${
        isFeatured
          ? 'border-[#d9ae3c]/50 bg-gradient-to-br from-white via-[#fffdf5] to-[#fdf8ec] shadow-[0_24px_55px_-28px_rgba(138,106,31,0.28)]'
          : 'border-emerald-900/[0.08] bg-white shadow-[0_20px_45px_-30px_rgba(10,79,34,0.35)]'
      } hover:shadow-[0_32px_70px_-30px_rgba(10,79,34,0.4)] hover:border-emerald-900/20`}
    >
      {/* Gold/Green accent bar on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: 'linear-gradient(90deg, #0a5c2c 0%, #e8b86d 100%)' }}
      />

      {/* Interactive Cursor Spotlight */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
      />

      {/* Subtle Background Wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-70"          style={{
            background: isFeatured
              ? 'radial-gradient(circle, rgba(232,184,109,0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(10,92,44,0.08) 0%, transparent 70%)',
          }}
      />

      {/* Top Section */}
      <div className="relative z-10 flex flex-col">
        {/* Header Row: Icon, Category Badge & Featured Tag */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-900/10 bg-[#eef6f0] text-[#0a5c2c] shadow-sm transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3">
              <Icon sx={{ fontSize: 28 }} />
            </span>
            <span className="rounded-full border border-[#0a5c2c]/15 bg-[#0a5c2c]/[0.05] px-3.5 py-1 text-[0.72rem] font-bold uppercase tracking-widest text-[#0a5c2c]">
              {custom.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isFeatured && (
              <span className="rounded-full border border-[#d9ae3c]/40 bg-[#e9c85c]/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#8a6a1f] shadow-sm">
                Featured
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full border border-emerald-900/[0.08] bg-[#f6faf7] px-3 py-1 text-xs font-semibold tabular-nums text-zinc-600">
              <TimerIcon sx={{ fontSize: 15 }} className="text-[#0a5c2c]" />
              {custom.duration}
            </span>
            {test.difficulty && test.difficulty !== 'mixed' && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider border ${
                test.difficulty === 'beginner'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : test.difficulty === 'advanced'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                {test.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mb-3 font-['DM_Serif_Display',Georgia,serif] text-2xl leading-tight text-[#061e12] tracking-tight transition-colors duration-200 ease-out group-hover:text-[#0a5c2c] sm:text-3xl md:text-4xl">
          {test.name}
        </h3>

        <p className="text-sm sm:text-base leading-relaxed text-zinc-600 line-clamp-3" style={{ textWrap: 'pretty' }}>
          {test.description}
        </p>

        {/* Key Outcome Highlights */}
        {custom.highlights && custom.highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {custom.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-900/[0.07] bg-[#f6faf7] px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 15 }} className="text-[#0a5c2c]" />
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Row: Quick Preview & Primary Action */}
      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-emerald-900/[0.08] pt-5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(test);
          }}
          className="inline-flex items-center gap-1.5 rounded-full py-2 -my-2 pr-2 text-xs font-semibold text-zinc-500 transition-colors duration-150 ease-out hover:text-[#0a5c2c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
        >
          <VisibilityIcon sx={{ fontSize: 16 }} className="text-[#8a6a1f]" />
          Quick preview
        </button>

        <button
          onClick={() => onStart(test.slug)}
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#051a0d] shadow-[0_10px_24px_-10px_rgba(217,174,60,0.7)] transition-[transform,box-shadow] duration-150 ease-out group-hover:scale-[1.03] group-hover:shadow-[0_14px_30px_-10px_rgba(217,174,60,0.8)] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
          style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
        >
          Start Assessment <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    </motion.div>
  );
});

/* ─── MAIN CATALOG COMPONENT ─────────────────────────────────────────────── */

export default function PsychometricTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Assessments");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewTest, setPreviewTest] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await getTests();
        setTests(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        // The catalogue renders an error state for this, so it is handled; only
        // unexpected faults (5xx, network) are worth a console entry.
        logApiFailure('load test catalogue', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const processedTests = useMemo(() => {
    let result = [...tests];

    // Filter by Category
    if (selectedCategory !== "All Assessments") {
      result = result.filter(t => deriveMeta(t).category === selectedCategory);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tests, selectedCategory, searchTerm]);

  return (
    <div className="min-h-dvh bg-[#04140a] overflow-x-hidden">
      {/* ─── HERO ─── */}
      <TestsHero />

      {/* ─── ASSESSMENT CATALOG SECTION ─── */}
      <section id="pt-grid" className="relative z-10 px-6 py-24 md:py-36 bg-white">
        {/* Subtle Decorative Ambient Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-40 right-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(232,184,109,0.15) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-10 left-10 h-96 w-96 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(10,92,44,0.1) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto mb-14 max-w-7xl text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#061e12]/5 text-[#0a5c2c] border border-[#061e12]/10 mb-4">
            Assessments
          </span>

          <h2 className="font-['DM_Serif_Display',Georgia,serif] text-[clamp(2.4rem,4.5vw,4rem)] leading-[1.08] text-[#061e12] mb-4">
            Select Your <span className="italic text-[#0a5c2c]">Assessment</span>
          </h2>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#061e12]/70">
            Choose a standardized psychometric instrument below to unlock evidence-backed clarity for your academic and professional path.
          </p>

          {/* Interactive Category Filter Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const count = cat === "All Assessments"
                ? tests.length
                : tests.filter((t) => deriveMeta(t).category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-[background-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c] ${
                    isActive
                      ? 'bg-[#0a5c2c] text-white shadow-[0_10px_24px_-10px_rgba(10,92,44,0.6)] scale-[1.04]'
                      : 'bg-[#061e12]/5 text-[#061e12]/70 border border-[#061e12]/10 hover:bg-[#061e12]/10'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {cat}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.7rem] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#061e12]/10 text-[#061e12]/60'
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="text-[#061e12]/40 transition-colors group-focus-within:text-[#0a5c2c]" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assessments by name or description..."
                className="w-full bg-[#061e12]/5 border border-[#061e12]/10 text-[#061e12] rounded-full pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:bg-white focus:border-[#0a5c2c]/40 focus:ring-4 focus:ring-[#0a5c2c]/10 placeholder:text-[#061e12]/40"
              />
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto">
          {loading ? (
            <>
              <div className="md:col-span-7 rounded-3xl border border-emerald-900/[0.06] bg-[#f6faf7] animate-pulse min-h-[26rem]" />
              <div className="md:col-span-5 rounded-3xl border border-emerald-900/[0.06] bg-[#f6faf7] animate-pulse min-h-[26rem]" />
              <div className="md:col-span-4 rounded-3xl border border-emerald-900/[0.06] bg-[#f6faf7] animate-pulse min-h-[26rem]" />
              <div className="md:col-span-4 rounded-3xl border border-emerald-900/[0.06] bg-[#f6faf7] animate-pulse min-h-[26rem]" />
              <div className="md:col-span-4 rounded-3xl border border-emerald-900/[0.06] bg-[#f6faf7] animate-pulse min-h-[26rem]" />
            </>
          ) : error || tests.length === 0 ? (
            /* This block sits inside the white catalogue section — white text on
               white made the error state invisible. */
            <div className="col-span-1 md:col-span-12 text-center py-20 bg-[#061e12]/5 rounded-3xl border border-[#061e12]/10">
              <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#061e12] mb-3">
                Unable to load assessments
              </h3>
              <p className="text-[#061e12]/60 mb-6">Check your network connection or backend server status.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-full font-bold text-[#071d12] bg-gradient-to-r from-[#e8b86d] to-[#d9ae3c] shadow-[0_10px_24px_-10px_rgba(217,174,60,0.7)] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
              >
                Retry loading
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {processedTests.length === 0 ? (
                <div className="col-span-1 md:col-span-12 text-center py-20 bg-[#061e12]/5 rounded-3xl border border-[#061e12]/10">
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#061e12]/5 text-[#061e12]/40">
                    <SearchIcon fontSize="large" />
                  </div>
                  <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#061e12] mb-3">
                    No matching assessments
                  </h3>
                  <p className="text-[#061e12]/60 mb-6">Try adjusting your filters or search term.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All Assessments");
                    }}
                    className="px-6 py-2.5 rounded-full font-bold text-white bg-[#0a5c2c] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : processedTests.map((test, index) => (
                <BentoTestCard
                  key={test.slug}
                  test={test}
                  index={index}
                  onStart={(slug) => navigate(`/test/${slug}`)}
                  onPreview={(testObj) => setPreviewTest(testObj)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-28 md:py-36 px-6 text-center bg-white">
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-black/5 bg-[#fcfcfb] p-10 md:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
            <h2 className="font-['DM_Serif_Display',Georgia,serif] text-3xl md:text-5xl text-[#061e12] mb-4">
              Need Help Choosing the <span className="italic text-[#0a5c2c]">Right Assessment</span>?
            </h2>
            <p className="text-base sm:text-lg text-[#061e12]/70 max-w-xl mx-auto mb-8">
              Speak directly with an expert counsellor to map out which psychometric test aligns with your goals.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need help selecting the right psychometric test on Paavan SETU.')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-full px-9 py-4 text-base font-bold text-[#051a0d] shadow-[0_14px_32px_-12px_rgba(217,174,60,0.7)] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5c2c]"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              <PsychologyIcon fontSize="small" /> Talk to a counsellor
            </a>
          </div>
        </div>
      </section>

      {/* Preview Modal */}
      <TestPreviewModal
        test={previewTest}
        onClose={() => setPreviewTest(null)}
        onStart={(slug) => navigate(`/test/${slug}`)}
      />
    </div>
  );
}