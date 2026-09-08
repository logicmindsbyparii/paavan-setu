import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import QuizIcon from '@mui/icons-material/Quiz';
import { submitTest, getTestBySlug } from "../lib/api";
import { WHATSAPP_NUMBER } from "../constants/urls";

/* ─── Assessment field · visual world ─────────────────────────────────────
   The catalogue (PsychometricTests + TestsHero) speaks in a deep forest
   field with gold CTAs. This page is where a student actually sits the
   assessment, so it inherits that field: same gradients, same gold, same
   emerald "answered" signal. Everything below is copy of those surfaces so
   the flow out of the catalogue never changes worlds. */

const FIELD_BG =
  'radial-gradient(120% 90% at 85% 15%, rgba(52,211,153,0.14) 0%, transparent 55%),' +
  'radial-gradient(100% 80% at 12% 88%, rgba(232,184,109,0.12) 0%, transparent 60%),' +
  'linear-gradient(162deg, #031208 0%, #062b18 45%, #08283e 100%)';

const GOLD_CTA = 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)';
const EMERALD = '#34d399';
const GOLD = '#e9c85c';
const GOLD_LIGHT = '#f7e6ae';
const GOLD_DEEP = '#d9ae3c';

/** Quiet ambient field, shared by every screen in this page. */
function FieldBackground({ className = "" }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-20 ${className}`}
        style={{ background: FIELD_BG }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[15%] -left-[10%] -z-10 h-[55vw] w-[55vw] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[15%] -right-[15%] -z-10 h-[50vw] w-[50vw] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 70%)' }}
      />
      {/* Faint matrix grid, faded out from the centre, mirroring TestsHero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          maskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
        }}
      />
      {/* Soft fall into the dark footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-b from-transparent to-[#0b2a1a]"
      />
    </>
  );
}

function BackLink() {
  return (
    <Link
      to="/test"
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/70 no-underline transition-all duration-200 hover:border-white/30 hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
      style={{ outlineColor: GOLD }}
    >
      <ArrowBackIcon fontSize="small" aria-hidden="true" />
      Back to Tests
    </Link>
  );
}

const slideVariants = {
  enter: (direction) => ({
    y: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    y: direction < 0 ? 24 : -24,
    opacity: 0,
  }),
};

const resultVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.08,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const resultItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function Test() {
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const advanceTimer = useRef(null);

  // Check authentication & fetch test data
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchTest = async () => {
      try {
        const data = await getTestBySlug(type);
        setTest(data?.data ?? data ?? null);
      } catch (error) {
        console.error("Failed to load test", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [navigate, location.pathname, type]);

  const changeQuestion = (newIdx) => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (newIdx === currentQuestionIdx) return;

    setPage([newIdx, newIdx > currentQuestionIdx ? 1 : -1]);
    setCurrentQuestionIdx(newIdx);
  };

  const handleOptionSelect = (option) => {
    const newAnswers = { ...answers, [currentQuestionIdx]: option };
    setAnswers(newAnswers);

    if (currentQuestionIdx < test.questions.length - 1) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        changeQuestion(currentQuestionIdx + 1);
      }, 400);
    }
  };

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const calculateResults = () => {
    const scores = {};
    test.categories.forEach(cat => scores[cat] = 0);

    Object.values(answers).forEach(option => {
      if (option.points) {
        Object.entries(option.points).forEach(([cat, val]) => {
          if (scores[cat] !== undefined) {
            scores[cat] += val;
          }
        });
      }
    });

    let topRecommendation = test.categories[0];
    let maxScore = scores[topRecommendation];

    for (const [cat, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        topRecommendation = cat;
      }
    }

    return { scores, topRecommendation };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { scores, topRecommendation } = calculateResults();

    try {
      const payload = {
        testSlug: type,
        testName: test.name,
        answers,
        resultData: scores,
        topRecommendation
      };
      const res = await submitTest(payload);
      setResult(res?.data ?? res);
      setSubmitError('');
    } catch (error) {
      console.error("Test submission failed", error);
      setSubmitError('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test?.questions?.length ?? 0;

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 pb-16 pt-28">
        <FieldBackground />
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-[2rem] border border-white/10 bg-[#0a2e1d]/80 px-5 py-8 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-8 md:px-12 md:py-12">
            <div className="mb-8">
              <div className="mb-4 h-4 w-40 animate-pulse rounded-md bg-white/10" />
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-1.5 flex-1 animate-pulse rounded-full bg-white/10" />
                ))}
              </div>
            </div>
            <div className="mb-10 h-10 w-4/5 animate-pulse rounded-xl bg-white/10" />
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/10" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Not found ─── */
  if (!test) {
    return (
      <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 text-center">
        <FieldBackground />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div
            className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-white/[0.04]"
            style={{ outline: `1px solid ${GOLD}22`, outlineOffset: '-6px' }}
          >
            <QuizIcon aria-hidden="true" sx={{ fontSize: 44, color: GOLD_LIGHT }} />
          </div>
          <h1 className="font-['DM_Serif_Display',Georgia,serif] text-3xl text-white md:text-4xl">
            We couldn't find that test
          </h1>
          <p className="mx-auto mb-10 mt-4 max-w-md text-lg text-white/60">
            The link may be out of date. Pick one from the full list of assessments.
          </p>
          <Link
            to="/test"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold no-underline shadow-[0_16px_40px_-12px_rgba(232,184,109,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-10px_rgba(232,184,109,0.85)] active:scale-[0.98]"
            style={{ background: GOLD_CTA, color: '#051a0d' }}
          >
            <ArrowBackIcon fontSize="small" aria-hidden="true" />
            Browse all tests
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = answeredCount === totalQuestions;

  /* ─── Results ─── */
  if (result) {
    const breakdown = Object.entries(result.resultData).sort((a, b) => b[1] - a[1]);
    const maxScore = Math.max(1, ...breakdown.map(([, score]) => score));

    return (
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pb-20 pt-28 sm:px-6 md:pt-32">
        <FieldBackground />
        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <BackLink />
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/60 sm:inline-flex">
              {test.name}
            </span>
          </div>

          <motion.div
            variants={resultVariants}
            initial={prefersReducedMotion ? "visible" : "hidden"}
            animate="visible"
          >
            {/* Heading */}
            <motion.div variants={resultItemVariants} className="mb-12 text-center">
              <h1 className="font-['DM_Serif_Display',Georgia,serif] text-5xl leading-tight text-white md:text-6xl">
                Assessment <span className="italic" style={{ color: GOLD_LIGHT }}>Complete</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/65" style={{ textWrap: 'balance' }}>
                Based on your responses for the{' '}
                <strong className="font-semibold text-white">{test.name}</strong>, here is your
                primary recommended path:
              </p>
            </motion.div>

            {/* Primary recommendation */}
            <motion.div variants={resultItemVariants} className="mb-10 text-center">
              <div
                className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 px-8 py-10 md:px-12 md:py-12"
                style={{
                  background: 'linear-gradient(160deg, #0d3a24 0%, #07281a 60%, #0a2a3a 100%)',
                  boxShadow: '0 40px 90px -40px rgba(0,0,0,0.85)',
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{ background: 'radial-gradient(circle at 50% 0%, rgba(52,211,153,0.5), transparent 62%)' }}
                />
                <span className="relative inline-block rounded-full border border-[#e9c85c]/40 bg-[#e9c85c]/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#f7e6ae]">
                  Primary Recommendation
                </span>
                <h2
                  className="relative mt-5 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-tight md:text-5xl lg:text-6xl"
                  style={{ color: GOLD_LIGHT, textWrap: 'balance' }}
                >
                  {result.topRecommendation}
                </h2>
              </div>
            </motion.div>

            {/* Category breakdown */}
            <motion.div variants={resultItemVariants} className="mx-auto mb-10 w-full max-w-3xl">
              <h3 className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-2xl text-white md:text-3xl">
                Category Breakdown
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {breakdown.map(([cat, score], i) => {
                  const isTop = i === 0;
                  return (
                    <div
                      key={cat}
                      className={`rounded-2xl border px-5 py-4 ${
                        isTop
                          ? 'border-[#e9c85c]/40 bg-[#e9c85c]/[0.06]'
                          : 'border-white/10 bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={`font-semibold leading-snug ${isTop ? 'text-[#f7e6ae]' : 'text-white/90'}`}>
                          {cat}
                        </p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-white/50">
                          {score} pt{score !== 1 && 's'}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${(score / maxScore) * 100}%`,
                            background: isTop
                              ? `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD})`
                              : EMERALD,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Counsellor CTA */}
            <motion.div
              variants={resultItemVariants}
              className="relative mx-auto mb-12 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#e9c85c]/25 bg-white/[0.04] px-7 py-10 text-center backdrop-blur-xl md:px-12 md:py-12"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD_LIGHT}, ${EMERALD})` }} />
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_LIGHT }}>
                Make it count
              </p>
              <h3 className="mx-auto mt-3 max-w-xl font-['DM_Serif_Display',Georgia,serif] text-3xl leading-tight text-white md:text-4xl" style={{ textWrap: 'balance' }}>
                Talk to a counsellor about{' '}
                <em className="italic" style={{ color: GOLD_LIGHT }}>your results</em>
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
                A one-on-one session turns this report into a clear roadmap: streams, courses, and
                next steps chosen with clarity instead of guesswork.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just completed the ${test.name} on your website and would like to discuss my results with a counsellor.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-8 py-4 text-sm font-bold no-underline shadow-[0_14px_34px_-14px_rgba(168,128,31,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-12px_rgba(233,200,92,0.9)] active:scale-[0.98] sm:w-auto"
                  style={{ background: GOLD_CTA, color: '#051a0d' }}
                >
                  <WhatsAppIcon fontSize="small" aria-hidden="true" />
                  Discuss on WhatsApp
                </a>
                <Link
                  to="/career-counselling"
                  className="group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-white/20 bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white no-underline transition-all duration-300 hover:border-white/40 hover:bg-white/[0.08] active:scale-[0.98]"
                >
                  <PsychologyIcon fontSize="small" aria-hidden="true" />
                  See How Counselling Works
                </Link>
              </div>
            </motion.div>

            <motion.div variants={resultItemVariants} className="flex justify-center">
              <BackLink />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Question flow ─── */
  const currentQ = test.questions[currentQuestionIdx];
  const motionEnabled = !prefersReducedMotion;

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pt-32">
      <FieldBackground />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 md:gap-5">
        {/* Top bar: leave + which assessment */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink />
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
            <AssignmentTurnedInIcon sx={{ fontSize: 16 }} aria-hidden="true" style={{ color: GOLD_LIGHT }} />
            <span className="max-w-[180px] truncate sm:max-w-none">{test.name}</span>
          </span>
        </div>

        {/* Question card */}
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a2e1d]/80 px-5 py-7 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:px-8 md:px-10 md:py-10"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}80, transparent)` }}
          />

          {/* Progress header */}
          <div className="mb-8 md:mb-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-white/80">
                Question{' '}
                <span className="tabular-nums">{currentQuestionIdx + 1}</span>
                <span className="font-medium text-white/40"> / {totalQuestions}</span>
              </p>
              <span className="text-xs font-semibold tabular-nums text-white/40">
                {answeredCount} of {totalQuestions} answered
              </span>
            </div>

            {/* Segmented progress · click an answered tick to review */}
            <div className="flex gap-1.5" role="group" aria-label="Test progress">
              {test.questions.map((_, i) => {
                const isAnswered = answers[i] != null;
                const isCurrent = i === currentQuestionIdx;
                let barClass = 'bg-white/10';
                if (isCurrent && !isAnswered) {
                  barClass = 'animate-pulse bg-[#e9c85c]/80';
                } else if (isAnswered && !isCurrent) {
                  barClass = 'bg-[#34d399]/60 hover:bg-[#34d399]/90';
                } else if (isCurrent) {
                  barClass = 'bg-[#e9c85c]';
                }
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!isAnswered}
                    onClick={() => isAnswered && changeQuestion(i)}
                    aria-label={isAnswered ? `Go to question ${i + 1} (answered)` : `Question ${i + 1}`}
                    title={isAnswered ? `Review question ${i + 1}` : undefined}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${barClass} ${
                      isCurrent ? 'md:h-2' : ''
                    } ${isAnswered ? 'cursor-pointer disabled:cursor-default' : 'cursor-default'}`}
                  />
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial={motionEnabled ? "enter" : "center"}
              animate="center"
              exit={motionEnabled ? "exit" : "center"}
              transition={{
                y: { type: "spring", stiffness: 320, damping: 32 },
                opacity: { duration: 0.18 },
              }}
            >
              <h2
                className="mx-auto mb-9 max-w-[30ch] text-center font-['DM_Serif_Display',Georgia,serif] text-[clamp(1.6rem,4.2vw,2.4rem)] leading-[1.2] text-white"
                style={{ textWrap: 'balance' }}
              >
                {currentQ.question}
              </h2>

              <div className="mx-auto mb-9 flex w-full max-w-2xl flex-col gap-3" role="group" aria-label="Answer options">
                {currentQ.options.map((opt, i) => {
                  const isSelected = answers[currentQuestionIdx]?.text === opt.text;
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleOptionSelect(opt)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOptionSelect(opt);
                        }
                      }}
                      aria-pressed={isSelected}
                      className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 active:scale-[0.99] sm:px-5 ${
                        isSelected
                          ? 'border-[#34d399]/80 bg-[#34d399]/10'
                          : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]'
                      }`}
                      style={{ outlineColor: GOLD }}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold transition-all duration-200 sm:h-10 sm:w-10 ${
                          isSelected
                            ? 'border-[#34d399] bg-[#34d399] text-[#04140a]'
                            : 'border-white/15 bg-white/[0.03] text-white/50 group-hover:text-white/85'
                        }`}
                      >
                        {letter}
                      </span>
                      <span
                        className={`flex-1 text-[1.02rem] font-medium leading-snug transition-colors duration-200 sm:text-lg ${
                          isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
                        }`}
                      >
                        {opt.text}
                      </span>
                      <CheckCircleIcon
                        aria-hidden="true"
                        sx={{ fontSize: 26 }}
                        className={`shrink-0 transition-all duration-200 ${
                          isSelected ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ color: EMERALD }}
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {submitError && (
            <div
              className="mx-auto mb-6 w-full max-w-2xl rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-200"
              role="alert"
            >
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => changeQuestion(Math.max(0, currentQuestionIdx - 1))}
              disabled={currentQuestionIdx === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-transparent disabled:hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: GOLD }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} aria-hidden="true" className="-ml-1" />
              Previous
            </button>

            {currentQuestionIdx === totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isCompleted || isSubmitting}
                title={!isCompleted ? 'Please answer all questions before submitting' : undefined}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 text-sm font-bold shadow-[0_16px_40px_-14px_rgba(232,184,109,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-12px_rgba(232,184,109,0.9)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  background: isCompleted ? GOLD_CTA : 'rgba(255,255,255,0.08)',
                  color: isCompleted ? '#051a0d' : 'rgba(255,255,255,0.6)',
                  outlineColor: GOLD,
                }}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : !isCompleted
                    ? `Answer all questions (${answeredCount}/${totalQuestions})`
                    : 'Complete Assessment'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => changeQuestion(Math.min(totalQuestions - 1, currentQuestionIdx + 1))}
                disabled={!answers[currentQuestionIdx]}
                title={!answers[currentQuestionIdx] ? 'Select an answer to continue' : undefined}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 text-sm font-bold shadow-[0_16px_40px_-14px_rgba(232,184,109,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-12px_rgba(232,184,109,0.9)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  background: answers[currentQuestionIdx] ? GOLD_CTA : 'rgba(255,255,255,0.08)',
                  color: answers[currentQuestionIdx] ? '#051a0d' : 'rgba(255,255,255,0.6)',
                  outlineColor: GOLD,
                }}
              >
                Next Step
                <ArrowBackIcon
                  sx={{ fontSize: 18 }}
                  aria-hidden="true"
                  className="-mr-1 rotate-180"
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden live region so screen readers announce the question change */}
      <span className="sr-only" role="status" aria-live="polite">
        {`Question ${currentQuestionIdx + 1} of ${totalQuestions}`}
      </span>
    </div>
  );
}
