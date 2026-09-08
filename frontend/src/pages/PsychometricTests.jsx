import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useSpring } from 'framer-motion';

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

import { colors } from "../constants/tokens";
import { WHATSAPP_NUMBER } from "../constants/urls";
import TestsHero from "../components/ui/TestsHero";
import { getTests } from "../lib/api";

/* ─── UI CONFIGURATION ───────────────────────────────────────────────────── */

const UI_CONFIG = {
  "ideal-career-test": {
    Icon: PsychologyIcon,
    category: "Aptitude & Career",
    duration: "25 Mins",
    questionsCount: "20 Questions",
    highlights: ["Innate Talent Vectors", "Personality Type Match", "High-Growth Stream Fit"],
    sampleQ: "Which environment energizes you most when solving complex problems?",
  },
  "commerce-script": {
    Icon: AccountBalanceIcon,
    category: "Stream & Subject Selection",
    duration: "20 Mins",
    questionsCount: "15 Questions",
    highlights: ["Financial Acumen", "Business Logic", "CA / CS / Finance Suitability"],
    sampleQ: "How comfortable are you with interpreting market trends and financial data?",
  },
  "stream-test": {
    Icon: TrendingUpIcon,
    category: "Stream & Subject Selection",
    duration: "20 Mins",
    questionsCount: "15 Questions",
    highlights: ["Science vs Commerce vs Arts", "Competitive Exam Fit", "Academic Load Tolerance"],
    sampleQ: "Do you prefer theoretical experimentation or practical business strategy?",
  },
  "engineering-script": {
    Icon: EngineeringIcon,
    category: "Stream & Subject Selection",
    duration: "20 Mins",
    questionsCount: "15 Questions",
    highlights: ["Spatial Visualization", "Mechanical Aptitude", "JEE & Tech Track Readiness"],
    sampleQ: "When looking at a complex mechanism, do you instinctively try to reverse-engineer it?",
  },
  "humanities-script": {
    Icon: AutoStoriesIcon,
    category: "Stream & Subject Selection",
    duration: "20 Mins",
    questionsCount: "15 Questions",
    highlights: ["Linguistic Comprehension", "Social Awareness", "Law & Civil Services Alignment"],
    sampleQ: "Do you enjoy analyzing societal dynamics, history, and expressive communication?",
  },
};

const CATEGORIES = ["All Assessments", "Stream & Subject Selection", "Aptitude & Career"];

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
  if (!test) return null;

  const meta = UI_CONFIG[test.slug] || {};
  const Icon = meta.Icon || AssignmentIcon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-[#062b18] p-6 sm:p-10 text-white shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <CloseIcon fontSize="small" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-[#f7e6ae]">
              <Icon sx={{ fontSize: 32 }} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-[#f7e6ae] border border-white/15">
                {meta.category || "Standardized Assessment"}
              </span>
              <h3 className="mt-1 font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-white">
                {test.name}
              </h3>
            </div>
          </div>

          <p className="text-base leading-relaxed text-white/80 mb-6">
            {test.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <TimerIcon className="text-emerald-400" />
              <div>
                <p className="text-xs text-white/60 font-medium">Time Required</p>
                <p className="text-sm font-bold text-white">{meta.duration || "20 Mins"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <QuizIcon className="text-amber-300" />
              <div>
                <p className="text-xs text-white/60 font-medium">Questions</p>
                <p className="text-sm font-bold text-white">{meta.questionsCount || "15 Questions"}</p>
              </div>
            </div>
          </div>

          {meta.highlights && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#f7e6ae] mb-3">Key Outcomes & Insights</p>
              <div className="space-y-2">
                {meta.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-white/85">
                    <CheckCircleOutlineIcon fontSize="small" className="text-emerald-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta.sampleQ && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Sample Evaluation Question</p>
              <p className="text-sm italic text-white/90">"{meta.sampleQ}"</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                onClose();
                onStart(test.slug);
              }}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-bold text-[#051a0d] shadow-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              Start Assessment Now
              <ArrowForwardIcon fontSize="small" />
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── BENTO CARD COMPONENT ───────────────────────────────────────────────── */

const BentoTestCard = React.forwardRef(({ test, index, onStart, onPreview }, ref) => {
  const custom = UI_CONFIG[test.slug] || {};
  const Icon = custom.Icon || AssignmentIcon;
  const { colSpan } = getBentoStyle(index);

  const cardRef = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  function onMouseMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mouseX.set(x);
    mouseY.set(y);
    glowX.set(x * 100);
    glowY.set(y * 100);

    rotateX.set((y - 0.5) * -10);
    rotateY.set((x - 0.5) * 10);
  }

  function onMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
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
      onMouseLeave={onMouseLeave}
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4 }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[2.25rem] border p-7 text-left transition-all duration-500 md:p-9 ${colSpan} cursor-pointer ${
        isFeatured
          ? 'border-[#e8b86d]/40 bg-gradient-to-br from-[#061e12] to-[#0a2e1d] shadow-[0_24px_55px_-22px_rgba(232,184,109,0.25)]'
          : 'border-white/10 bg-[#061e12] shadow-[0_20px_45px_-22px_rgba(0,0,0,0.5)]'
      } hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] hover:border-white/20 backdrop-blur-xl`}
    >
      {/* Gold/Green accent bar on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: 'linear-gradient(90deg, #0a5c2c 0%, #e8b86d 50%, #174a72 100%)' }}
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
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{
          background: isFeatured
            ? 'radial-gradient(circle, rgba(232,184,109,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(10,92,44,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Top Section */}
      <div className="relative z-10 flex flex-col">
        {/* Header Row: Icon, Category Badge & Featured Tag */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-13 w-13 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#e8b86d] shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Icon sx={{ fontSize: 28 }} />
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[0.72rem] font-bold uppercase tracking-widest text-[#e8b86d]">
              {custom.category || "Assessment"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isFeatured && (
              <span className="rounded-full border border-[#e8b86d]/40 bg-[#e8b86d]/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#e8b86d] shadow-sm">
                ⭐ Featured
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
              <TimerIcon sx={{ fontSize: 15 }} className="text-[#e8b86d]" />
              {custom.duration || '20 Mins'}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mb-3 font-['DM_Serif_Display',Georgia,serif] text-2xl leading-tight text-white transition-colors duration-300 group-hover:text-[#e8b86d] sm:text-3xl md:text-3.5xl">
          {test.name}
        </h3>

        <p className="text-sm sm:text-base leading-relaxed text-white/70 line-clamp-3">
          {test.description}
        </p>

        {/* Key Outcome Highlights */}
        {custom.highlights && custom.highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {custom.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90"
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 15 }} className="text-emerald-400" />
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Row: Quick Preview & Primary Action */}
      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(test);
          }}
          className="inline-flex items-center gap-1.5 py-2 -my-2 text-xs font-semibold text-white/60 transition-colors hover:text-[#e8b86d]"
        >
          <VisibilityIcon sx={{ fontSize: 16 }} className="text-[#e8b86d]" />
          Quick Preview
        </button>

        <button
          onClick={() => onStart(test.slug)}
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#051a0d] shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg active:scale-98"
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
  const [previewTest, setPreviewTest] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await getTests();
        setTests(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    if (selectedCategory === "All Assessments") return true;
    const cat = UI_CONFIG[t.slug]?.category;
    return cat === selectedCategory;
  });

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
                : tests.filter((t) => UI_CONFIG[t.slug]?.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-[#0a5c2c] text-white shadow-lg scale-105'
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
        </div>

        {/* Bento Grid Layout */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto">
          {loading ? (
            <>
              <div className="md:col-span-7 rounded-3xl bg-white/5 animate-pulse min-h-[26rem]" />
              <div className="md:col-span-5 rounded-3xl bg-white/5 animate-pulse min-h-[26rem]" />
              <div className="md:col-span-4 rounded-3xl bg-white/5 animate-pulse min-h-[26rem]" />
              <div className="md:col-span-4 rounded-3xl bg-white/5 animate-pulse min-h-[26rem]" />
              <div className="md:col-span-4 rounded-3xl bg-white/5 animate-pulse min-h-[26rem]" />
            </>
          ) : error || tests.length === 0 ? (
            <div className="col-span-1 md:col-span-12 text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-white mb-3">
                Unable to load assessments
              </h3>
              <p className="text-white/60 mb-6">Check your network connection or backend server status.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-full font-bold text-[#071d12] bg-gradient-to-r from-[#e8b86d] to-[#d9ae3c] shadow-md"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTests.map((test, index) => (
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
              className="inline-flex items-center justify-center gap-3 rounded-full px-9 py-4 text-base font-bold text-[#051a0d] shadow-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
            >
              <PsychologyIcon fontSize="small" /> Talk to a Counsellor
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