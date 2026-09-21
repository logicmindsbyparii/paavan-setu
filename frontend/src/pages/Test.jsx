import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import QuizIcon from '@mui/icons-material/Quiz';
import CloseIcon from '@mui/icons-material/Close';
import { submitTest, getTestBySlug, getMyTestResults, retakeTest, verifyTestCoupon, abandonTest, logApiFailure, isClientError, resolveTestImage } from "../lib/api";
import { WHATSAPP_NUMBER } from "../constants/urls";
import ResponsiveRadarChart from "../components/ResponsiveRadarChart";
import CommerceReport from "../components/CommerceReport";
import StreamSelectorReport from "../components/StreamSelectorReport";
import HumanitiesReport from "../components/HumanitiesReport";
import IdealCareerReport from "../components/IdealCareerReport";

/* ─── Assessment field · visual world ─────────────────────────────────────
   The catalogue (PsychometricTests + TestsHero) speaks in a deep forest
   field with gold CTAs. This page is where a student actually sits the
   assessment, so it inherits that field: same gradients, same gold, same
   emerald "answered" signal. Everything below is copy of those surfaces so
   the flow out of the catalogue never changes worlds.

   Emil Kowalski redesign — tighter springs, magnetic option cards,
   one composed entrance per surface, press-and-release tactility on CTAs,
   keyboard-first with discoverable shortcuts. Protocol and data layer
   untouched. */

const FIELD_BG =
  'radial-gradient(120% 90% at 85% 15%, rgba(52,211,153,0.08) 0%, transparent 55%),' +
  'radial-gradient(100% 80% at 12% 88%, rgba(232,184,109,0.06) 0%, transparent 60%),' +
  'linear-gradient(162deg, #f8fafc 0%, #f1f5f9 45%, #e2e8f0 100%)';

const EMERALD = '#34d399';
const GOLD = '#e9c85c';
const GOLD_DEEP = '#d9ae3c';
/* Ink-safe golds: pale gold text was tuned for dark surfaces and vanishes on
   the light field this page renders on, so labels use deep gold ink instead. */
const GOLD_INK = '#8a6a1f';
const GOLD_STRONG = '#b8892e';

/* ─── Recommendation interpretation map ───────────────────────────────────── */

const REC_INTERP = {
  Realistic: 'Practical, hands-on, and physically active. You enjoy working with tools, machines, and the natural world.',
  Investigative: 'Analytical, intellectual, and curious. You thrive on solving abstract problems and exploring ideas.',
  Artistic: 'Creative, expressive, and original. You prefer unstructured environments where you can imagine and create.',
  Social: 'Helping, teaching, and healing others. You are drawn to roles where you can support and develop people.',
  Enterprising: 'Persuasive, ambitious, and energetic. You enjoy leading, convincing, and driving results.',
  Conventional: 'Organized, detail-oriented, and reliable. You excel at structured tasks with clear data and procedures.',
};

/** Quiet ambient field, shared by every screen in this page. */
function FieldBackground({ className = "", reducedMotion = false }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-20 ${className}`}
        style={{ background: FIELD_BG }}
      />
      <motion.div
        animate={reducedMotion ? {} : { opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-[15%] -left-[10%] -z-10 h-[55vw] w-[55vw] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={reducedMotion ? {} : { opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-[15%] -right-[15%] -z-10 h-[50vw] w-[50vw] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 70%)' }}
      />
      {/* Faint matrix grid, faded out from the centre, mirroring TestsHero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          maskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(100% 100% at 50% 50%, #000 0%, transparent 80%)',
        }}
      />
      {/* Texture Overlay (subtle noise) */}
      <svg className="pointer-events-none fixed inset-0 z-[-5] h-full w-full opacity-[0.25] mix-blend-overlay">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      {/* Soft fall into the dark footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-b from-transparent to-[#e2e8f0]"
      />
    </>
  );
}

function BackLink() {
  return (
    <Link
      to="/test"
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-zinc-600 no-underline transition-[color,background-color,border-color] duration-200 ease-out hover:border-zinc-300 hover:bg-white hover:text-zinc-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
      style={{ outlineColor: GOLD }}
    >
      <ArrowBackIcon fontSize="small" aria-hidden="true" />
      Back to Tests
    </Link>
  );
}

const EASE_KOWALSKI = [0.16, 1, 0.3, 1];
const SPRING_TIGHT = { type: 'spring', stiffness: 300, damping: 22 };
const SPRING_PISTON = { type: 'spring', stiffness: 360, damping: 28 };

const slideVariants = {
  enter: (direction) => ({
    y: direction > 0 ? 10 : -10,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      y: { type: 'spring', stiffness: 320, damping: 24 },
      opacity: { duration: 0.2 },
      scale: { type: 'spring', stiffness: 380, damping: 26 },
    },
  },
  exit: (direction) => ({
    zIndex: 0,
    y: direction < 0 ? 10 : -10,
    opacity: 0,
    scale: 0.98,
    transition: {
      y: { type: 'spring', stiffness: 320, damping: 24 },
      opacity: { duration: 0.15 },
      scale: { type: 'spring', stiffness: 380, damping: 26 },
    },
  }),
};

const resultVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: EASE_KOWALSKI,
      staggerChildren: 0.05,
    },
  },
};

const resultItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_KOWALSKI,
    },
  },
};

function OptionCard({ opt, index, isSelected, onSelect, onKeyDown }) {
  const btnRef = useRef(null);
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      ref={btnRef}
      type="button"
      onClick={() => onSelect(opt)}
      onKeyDown={onKeyDown}
      aria-pressed={isSelected}
      whileTap={reduceMotion ? {} : { scale: 0.98, transition: { duration: 0.05 } }}
      className={`group flex w-full flex-col gap-4 rounded-2xl border px-6 py-5 md:px-7 md:py-6 text-left transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 active:scale-[0.98] ${
        isSelected
          ? 'border-[#34d399] bg-[#34d399]/10 text-zinc-900 shadow-sm ring-1 ring-[#34d399]/20'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:shadow-sm hover:text-zinc-800'
      }`}
      style={{
        outlineColor: GOLD,
        isolation: 'isolate',
      }}
    >
      <span className="flex w-full items-center gap-5">
      <span
        aria-hidden="true"
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-bold transition-[background-color,border-color,color] duration-200 ease-out sm:h-11 sm:w-11 ${
          isSelected
            ? 'border-[#34d399] bg-[#34d399] text-zinc-900 shadow-sm'
            : 'border-zinc-200 bg-zinc-50 text-zinc-400 group-hover:border-zinc-300 group-hover:text-zinc-600'
        }`}
      >
        {String.fromCharCode(65 + index)}
      </span>
      {opt.text && opt.text.trim() !== '' ? (
        <span className="flex-1 text-[1.02rem] font-medium leading-relaxed sm:text-lg">
          {opt.text}
        </span>
      ) : (
        <span className="flex-1"></span>
      )}
      <CheckCircleIcon
        aria-hidden="true"
        sx={{ fontSize: 26 }}
        className={`shrink-0 transition-[transform,opacity] duration-300 ease-out ${
          isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        style={{ color: EMERALD }}
      />
      </span>
      {opt.imageUrl && (
        <div className="mt-4 flex w-full justify-center overflow-hidden rounded-xl bg-white/95 ring-1 ring-black/5 shadow-md transition-transform duration-500 ease-out group-hover:scale-[1.02]">
          <img
            src={resolveTestImage(opt.imageUrl)}
            alt={`Option ${String.fromCharCode(65 + index)} visual`}
            loading="lazy"
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            className="max-w-full object-scale-down mix-blend-multiply p-2 sm:p-4"
            style={{ maxHeight: '160px' }}
          />
        </div>
      )}
    </motion.button>
  );
}

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

/** Pull this user's attempt for a slug out of a my-results response, tolerating
 *  either a bare array or a `{ data }` envelope. */
function findMyResult(results, slug) {
  const list = Array.isArray(results) ? results : results?.data;
  if (!Array.isArray(list)) return null;
  return list.find(r => r?.testSlug === slug) || null;
}

/** Count answered questions against the live question list. Counting
 *  `Object.keys(answers)` also counted indices left over from a longer version
 *  of the test in a stored autosave, so the runner could call an attempt
 *  complete — and enable Submit — while a real question was still blank. */
function countAnswered(answers, questions) {
  return (questions || []).reduce((n, _q, i) => (answers[i] != null ? n + 1 : n), 0);
}

export default function Test() {
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const BATCH_SIZE = test?.slug === 'stream-selector-test' ? 4 : (['engineering-branch-selector', 'humanities-career-test', 'ideal-career-test'].includes(test?.slug) ? 5 : 1);
const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const [answers, setAnswers] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const slug = path.split('/').pop();
        if (slug) {
          const saved = localStorage.getItem(`paawansetu_test_${slug}`);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch (e) {
      // Corrupt local autosave — recoverable, so a warning rather than a crash.
      console.warn('Discarding unreadable saved answers:', e);
      try { localStorage.removeItem(`paawansetu_test_${window.location.pathname.split('/').pop()}`); } catch { /* ignore */ }
    }
    return {};
  });
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  /* Set when the server refuses a submission because a completed attempt
     already exists. The runner is replaced by the results screen at that
     point, so the explanation has to live there — see the notice in the
     results branch. */
  const [alreadyCompletedNotice, setAlreadyCompletedNotice] = useState('');
  const [retakeError, setRetakeError] = useState('');
  const [testStartTime, setTestStartTime] = useState(null);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  /* The intro gate. `couponVerified` only means the code checked out; the server
     spends it when the attempt is submitted. */
  const [couponVerified, setCouponVerified] = useState(false);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [introMessage, setIntroMessage] = useState('');
  const [testSections, setTestSections] = useState(null); // null = flat mode
  const [passingScore, setPassingScore] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  /* True once the async "have I already completed this?" check on mount has
     resolved. The Begin button stays disabled until this is true, so the user
     can never slip into the runner before the server's view of their history
     is known — which is what produced the 409 on submit in the first place. */
  const [resultsCheckDone, setResultsCheckDone] = useState(false);
  /* Re-renders once a second while the runner is open so the elapsed-time
     readout actually counts up. It used to render from a `Date.now()` captured
     during some unrelated re-render, so it froze between answers. */
  const [nowTick, setNowTick] = useState(() => Date.now());

  const advanceTimer = useRef(null);

  /* ─── Per-question timing ────────────────────────────────────────────────────
     Wall-clock time per item. This is what turns "question 7 loses 30% of
     people" into "question 7 is misread", so it is collected unconditionally
     rather than only for keyed tests. Kept in refs so recording time never
     re-renders the runner mid-question. */
  const questionTimesRef = useRef({});
  const questionEnteredAtRef = useRef(Date.now());
  const lastIndexRef = useRef(0);

  const collectTimings = () => {
    // Flush the time spent on the question still open when submitting/leaving.
    const now = Date.now();
    const openIdx = lastIndexRef.current;
    const openSeconds = Math.max(0, Math.round((now - questionEnteredAtRef.current) / 1000));
    return {
      ...questionTimesRef.current,
      [openIdx]: (questionTimesRef.current[openIdx] || 0) + openSeconds,
    };
  };

  // Check authentication & fetch test data
  useEffect(() => {
    if (!type) return;
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchTest = async () => {
      setLoading(true);
      try {
        const data = await getTestBySlug(type);
        const loadedData = data?.data ?? data ?? null;
        setTest(loadedData);

        if (loadedData) {
          // The clock starts when the learner presses Begin, not when the page
          // loads — otherwise the intro screen silently ate the time limit.
          const limit = loadedData.timeLimit ?? null;
          setTimeLimit(limit);
          setTimeLeft(limit);
          setIntroMessage(loadedData.introMessage || '');
          setTestSections(loadedData.sections && loadedData.sections.length > 0 ? loadedData.sections : null);
          setPassingScore(loadedData.passingScore ?? null);
        } else {
          setResult(null);
          setTestStartTime(null);
          setTimeLimit(null);
          setTimeLeft(null);
        }

        // Check if the user has already completed this test. A failure here used
        // to be swallowed, which is how a learner could be shown a fresh runner
        // for a test they had already finished — and then hit a 409 on submit.
        try {
          const results = await getMyTestResults();
          const existing = findMyResult(results, type);
          if (existing) {
            setResult(existing);
            setSubmitError('');
          }
        } catch (error) {
          if (isClientError(error)) {
            // Signed out mid-session: submitting would only fail too.
            setSubmitError('Your session has expired. Please sign in again to take this assessment.');
          } else {
            logApiFailure('load my test results', error);
          }
        } finally {
          setResultsCheckDone(true);
        }
      } catch (error) {
        // A 404 here is a normal outcome (bad slug, or the test was unpublished).
        if (isClientError(error)) {
          setSubmitError('This assessment is not available right now.');
        } else {
          logApiFailure('load test', error);
          setSubmitError('Failed to load test. Please try again.');
        }
      } finally {
        setLoading(false);
        setResultsCheckDone(true);
      }
    };

    fetchTest();
  }, [navigate, type]);

  /* Submit once, from every path that can end an attempt: the manual button,
     the global countdown, and section expiry. Three copies of this payload is
     how the timing data got left out of some of them before. */
  const submitInFlightRef = useRef(false);
  const performSubmit = async ({ timedOut = false } = {}) => {
    // Nothing to do if a result is already on screen — the countdown and
    // section timers can otherwise keep firing after the results branch has
    // replaced the runner, which produces duplicate 409s and browser console
    // noise for a state the page is not in anymore. The ref covers the window
    // before the first response lands, during which the countdown ticks again
    // every second and a double-click on Submit fires a second POST.
    if (result || submitInFlightRef.current) return;
    // Client-side completeness guard: a manual submit with unanswered items is
    // refused here, so the browser never logs a failed POST for a state we
    // already knew about. (Timed-out auto-submits go through — the server
    // scores whatever was answered.)
    const total = test?.questions?.length ?? 0;
    const done = countAnswered(answers, test?.questions);
    if (!test || total === 0) {
      setSubmitError('This assessment is not available right now.');
      return;
    }
    if (!timedOut && done < total) {
      setSubmitError(`Please answer all ${total} questions before submitting. (${done}/${total})`);
      setShowReview(true);
      return;
    }
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    const elapsed = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : 0;
    try {
      const res = await submitTest({
        testSlug: type,
        testName: test.name,
        answers,
        timeTaken: elapsed,
        questionTimings: collectTimings(),
        timedOut,
        // The server verifies and spends this. Without it the submit is refused.
        couponCode: couponCode.trim(),
      });
      setResult(res?.data ?? res);
      setSubmitError('');
      setConfirmSubmit(false);
      localStorage.removeItem(`paawansetu_test_${type}`);
    } catch (error) {
      setConfirmSubmit(false);

      /* 409: the server already holds a completed attempt for this test. That is
         a state to reconcile, not a crash to log — fetch the attempt that exists
         and show it, so the learner sees their actual result (and the retake
         route) instead of a generic "try again" that can never succeed. */
      if (error?.status === 409) {
        const message = error?.message || 'You have already completed this assessment.';
        setSubmitError(message);
        setAlreadyCompletedNotice(message);
        try {
          const results = await getMyTestResults();
          const existing = findMyResult(results, type);
          if (existing) {
            setResult(existing);
            localStorage.removeItem(`paawansetu_test_${type}`);
          }
        } catch (fetchError) {
          logApiFailure('reconcile completed attempt', fetchError);
        }
        return;
      }

      if (isClientError(error)) {
        // Refused for a reason the server explained (e.g. answers incomplete).
        setSubmitError(error.message || 'This attempt could not be submitted.');
      } else {
        logApiFailure('submit test', error);
        setSubmitError(timedOut
          ? 'Time expired and the test was submitted automatically. Please check your results.'
          : 'Failed to submit test. Please try again.');
      }
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Countdown timer — armed only once the learner has begun.
  useEffect(() => {
    if (showIntro || timeLeft === null || timeLeft <= 0 || result) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev != null ? prev - 1 : prev;
        // Time up — submit immediately, skipping the confirm step. Clamped at
        // zero: the old version kept counting into negatives and re-fired the
        // submit on every tick until the response landed.
        if (next <= 0) {
          performSubmit({ timedOut: true });
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, result, showIntro]);

  // Drives the elapsed-time readout for untimed tests.
  useEffect(() => {
    if (showIntro || result) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [showIntro, result]);

  /* Every question change (tap, auto-advance, passage jump, timer) must start
     the learner at the top of the new card. Without this the scroll position
     carries over, and on long cards like the Q57/Q62 passages the learner
     lands mid-passage seeing text with no question in view. */
  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const changeQuestion = (newIdx) => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (newIdx === currentQuestionIdx) return;

    // Bank the seconds spent on the question being left before moving on.
    const spent = Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000));
    questionTimesRef.current[currentQuestionIdx] =
      (questionTimesRef.current[currentQuestionIdx] || 0) + spent;
    questionEnteredAtRef.current = Date.now();
    lastIndexRef.current = newIdx;

    setPage([newIdx, newIdx > currentQuestionIdx ? 1 : -1]);
    setCurrentQuestionIdx(newIdx);
    scrollToTop();
  };

  const handleOptionSelect = (option, qIdx = currentQuestionIdx) => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }

    if (answers[qIdx]?.text === option.text) {
      const newAnswers = { ...answers };
      delete newAnswers[qIdx];
      setAnswers(newAnswers);
      return;
    }

    const newAnswers = { ...answers, [qIdx]: option };
    setAnswers(newAnswers);

    // Auto advance if the LAST question in the batch is answered
    const isLastInBatch = qIdx === Math.min(test.questions.length - 1, currentQuestionIdx + BATCH_SIZE - 1);
    if (autoAdvance && isLastInBatch && qIdx < test.questions.length - 1) {
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        changeQuestion(currentQuestionIdx + BATCH_SIZE);
      }, 400);
    }
  };

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // Save progress, Keyboard Navigation & Warn Unsaved
  useEffect(() => {
    // Never re-persist an autosave after the attempt is over: the effect also
    // runs when `result` changes, so removing the key on submit re-wrote the
    // old answers straight back and the next visit pre-filled them.
    if (type && !result && Object.keys(answers).length > 0) {
      localStorage.setItem(`paawansetu_test_${type}`, JSON.stringify(answers));
    }

    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0 && !result && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    const handleKeyDown = (e) => {
      if (showReview) return;
      if (e.key === 'ArrowLeft') {
        changeQuestion(Math.max(0, currentQuestionIdx - 1));
      } else if (e.key === 'ArrowRight') {
        changeQuestion(Math.min((test?.questions?.length || 1) - 1, currentQuestionIdx + 1));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [answers, result, isSubmitting, currentQuestionIdx, test, showReview, type]);

  /* ─── Section timers ─────────────────────────────────────────────────────────
     Sections advertise "Verbal Reasoning — 10 min" on the intro screen, but the
     runner used to ignore timeLimitMinutes entirely, so the promise was
     cosmetic. On expiry the runner advances to the next section, or submits if
     this was the last one. */
  const sectionIndexFor = (qIdx) => (testSections
    ? testSections.findIndex(s => (s.questionIndices || []).includes(qIdx))
    : -1);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(null);
  const activeSectionRef = useRef({ idx: -1 });

  useEffect(() => {
    if (showIntro || !testSections || testSections.length === 0 || result) return;
    const idx = sectionIndexFor(currentQuestionIdx);
    if (idx < 0) return;
    const limit = testSections[idx]?.timeLimitMinutes;
    if (!limit) {
      if (activeSectionRef.current.idx !== -1) {
        activeSectionRef.current = { idx: -1 };
        setSectionTimeLeft(null);
      }
      return;
    }
    // Only (re)start when the candidate actually enters a new section.
    if (activeSectionRef.current.idx !== idx) {
      activeSectionRef.current = { idx };
      setSectionTimeLeft(limit * 60);
    }
  }, [currentQuestionIdx, testSections, result, showIntro]);

  useEffect(() => {
    if (showIntro || sectionTimeLeft == null || result) return;
    if (sectionTimeLeft <= 0) {
      const nextSection = testSections?.[activeSectionRef.current.idx + 1];
      const nextIdx = nextSection?.questionIndices?.[0];
      if (nextIdx != null) {
        activeSectionRef.current = { idx: activeSectionRef.current.idx + 1 };
        changeQuestion(nextIdx);
      } else {
        performSubmit({ timedOut: true });
      }
      return;
    }
    const t = setTimeout(() => {
      setSectionTimeLeft(v => (v == null ? v : v - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [sectionTimeLeft, result, showIntro]);

  /* ─── Abandoned-attempt telemetry ──────────────────────────────────────────
     Fired when the learner leaves mid-test without submitting. Without this,
     every stored attempt is a finished one and the drop-off curve is a flat
     100% line — which is exactly what the analytics screen used to show.
     The effect is mounted once and reads live state through a ref, so it fires
     on real departure rather than on every answer change. */
  const leaveStateRef = useRef({});
  useEffect(() => {
    leaveStateRef.current = {
      type, testName: test?.name, answers, currentQuestionIdx, result, isSubmitting, testStartTime,
    };
  });

  useEffect(() => {
    const report = () => {
      const s = leaveStateRef.current || {};
      if (!s.type || s.result || s.isSubmitting) return;
      if (!s.answers || Object.keys(s.answers).length === 0) return;
      abandonTest({
        testSlug: s.type,
        testName: s.testName,
        answers: s.answers,
        lastQuestionIndex: s.currentQuestionIdx,
        timeTaken: s.testStartTime ? Math.floor((Date.now() - s.testStartTime) / 1000) : 0,
      });
    };
    window.addEventListener('beforeunload', report);
    return () => {
      window.removeEventListener('beforeunload', report);
      report();
    };
  }, []);



  const handleSubmit = async () => {
    if (result) return;
    if (!confirmSubmit) {
      setConfirmSubmit(true);
      return;
    }
    await performSubmit();
  };

  const handleRetake = async () => {
    setIsSubmitting(true);
    setRetakeError('');
    const code = couponCode.trim();
    try {
      const res = await retakeTest({ testSlug: type, couponCode: code });
      if (res?.success) {
        setResult(null);
        setSubmitError('');
        setAlreadyCompletedNotice('');
        setAnswers({});
        setCurrentQuestionIdx(0);
        setPage([0, 0]);
        scrollToTop();
        setTestStartTime(Date.now());
        setNowTick(Date.now());
        setTimeLeft(timeLimit);
        /* The code stays in state: the server spends it when the new attempt is
           submitted. Cleared before, it meant a retake could not be submitted
           at all once a coupon became mandatory. */
        setCouponCode(code);
        setCouponVerified(true);
        setCouponApplied(true);
        setCouponError('');
        setRetakeError('');
        /* A fresh run starts fresh clocks. The previous attempt's per-question
           timings otherwise carried over and the autosave pre-filled the new
           attempt with the old answers on the next reload. */
        questionTimesRef.current = {};
        questionEnteredAtRef.current = Date.now();
        lastIndexRef.current = 0;
        activeSectionRef.current = { idx: -1 };
        setSectionTimeLeft(null);
        try { localStorage.removeItem(`paawansetu_test_${type}`); } catch { /* ignore */ }
      } else {
        setRetakeError(res?.message || 'Retake failed. Please try again.');
        setCouponApplied(false);
      }
    } catch (error) {
      // An invalid or spent coupon is an expected refusal; show what the server
      // said instead of logging it as an application failure.
      if (isClientError(error)) {
        setRetakeError(error.message || 'This coupon could not be used.');
      } else {
        logApiFailure('retake test', error);
        setRetakeError('Could not process retake. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Escape closes the review dialog — it covers the runner, and Escape is the
     expected way out of an overlay. */
  useEffect(() => {
    if (!showReview) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowReview(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showReview]);

  /* Verify the coupon before the attempt opens. The server checks and spends the
     same code again on submit — this half exists so a mistyped code is refused
     here rather than after 30 answers. */
  const handleVerifyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim();
    if (!code || verifyingCoupon) return;
    setVerifyingCoupon(true);
    setCouponError('');
    try {
      await verifyTestCoupon(code);
      setCouponCode(code);
      setCouponVerified(true);
    } catch (error) {
      setCouponVerified(false);
      if (isClientError(error)) {
        setCouponError(error.message || 'This coupon could not be used.');
      } else {
        logApiFailure('verify test coupon', error);
        setCouponError('Could not check that coupon. Please try again.');
      }
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const answeredCount = countAnswered(answers, test?.questions);
  const totalQuestions = test?.questions?.length ?? 0;

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 pb-16 pt-28">
        <FieldBackground reducedMotion={prefersReducedMotion} />
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-3xl"
        >
          <div className="rounded-[2rem] border border-zinc-200/60 bg-white/80 px-5 py-8 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:px-8 md:px-12 md:py-12">
            <div className="mb-8">
              <div className="mb-4 h-4 w-40 animate-pulse rounded-full bg-zinc-200/80" />
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-1.5 flex-1 animate-pulse rounded-full bg-zinc-200/80" />
                ))}
              </div>
            </div>
            <div className="mb-10 h-10 w-4/5 animate-pulse rounded-2xl bg-zinc-200/80" />
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-zinc-200/60 bg-zinc-100" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Not found ─── */
  // A test with no items cannot be sat either — bail out here so the runner
  // below can rely on `test.questions[currentQuestionIdx]` existing.
  if (!test || (test.questions || []).length === 0) {
    return (
      <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 text-center">
        <FieldBackground reducedMotion={prefersReducedMotion} />
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto max-w-2xl"
        >
          <div
            className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full border border-zinc-200 bg-zinc-50/80"
            style={{ outline: `1px solid ${GOLD}22`, outlineOffset: '-6px' }}
          >
            <QuizIcon aria-hidden="true" sx={{ fontSize: 44, color: GOLD_DEEP }} />
          </div>
          <h1 className="font-['DM_Serif_Display',Georgia,serif] text-3xl text-zinc-900 md:text-4xl">
            We couldn't find that test
          </h1>
          <p className="mx-auto mb-10 mt-4 max-w-md text-lg text-zinc-900/60">
            The link may be out of date. Pick one from the full list of assessments.
          </p>
          <Link
            to="/test"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold no-underline bg-[#e9c85c] text-[#051a0d] transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            style={{ isolation: 'isolate', willChange: 'transform' }}
          >
            <ArrowBackIcon fontSize="small" aria-hidden="true" />
            Browse all tests
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ─── Intro screen ─── */
  if (showIntro && test && !result) {
    const totalQ = test.questions.length;
    const totalSections = testSections ? testSections.length : 0;
    return (
      <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 text-center">
        <FieldBackground reducedMotion={prefersReducedMotion} />
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto max-w-2xl"
        >
          {/* Test icon + badge */}
          <div className="mb-8 grid h-20 w-20 place-items-center rounded-full border border-zinc-200 bg-zinc-50/80 shadow-lg" style={{ outline: `1px solid ${GOLD}22`, outlineOffset: '-6px' }}>
            <QuizIcon aria-hidden="true" sx={{ fontSize: 38, color: GOLD_DEEP }} />
          </div>

          <motion.div variants={resultItemVariants}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] bg-[#e9c85c]/20 text-[#8a6a1f] border border-[#d9ae3c]/40 mb-5">
              {totalSections > 0 ? `${totalSections} sections · ${totalQ} questions` : `${totalQ} questions`}
            </span>
          </motion.div>

          <motion.h1
            className="font-['DM_Serif_Display',Georgia,serif] text-4xl leading-tight text-zinc-900 md:text-5xl mb-4"
            style={{ textWrap: 'balance' }}
            variants={resultItemVariants}
          >
            {test.name}
          </motion.h1>
          <motion.p
            className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-900/60"
            style={{ textWrap: 'balance' }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE_KOWALSKI }}
          >
            {test.description || 'Test your knowledge across real-world scenarios.'}
          </motion.p>

          {/* Difficulty + structure summary */}
          <motion.div variants={resultItemVariants} className="mb-8 flex flex-wrap items-center justify-center gap-3">
            {test.difficulty && test.difficulty !== 'mixed' && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
                test.difficulty === 'beginner'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : test.difficulty === 'advanced'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                {test.difficulty}
              </span>
            )}
            {timeLimit && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-zinc-200 bg-white/50 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" d="M12 6v6l4 2"/></svg>
                {timeLimit} min
              </span>
            )}
            {test.passingScore > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-zinc-200 bg-white/50 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Pass score: {test.passingScore}%
              </span>
            )}
          </motion.div>

          {/* Progress overview */}
          {totalSections > 0 && (
            <motion.div variants={resultItemVariants} className="mx-auto mb-10 w-full max-w-md">
              <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-zinc-900/50">
                Test Structure
              </h3>
              <div className="flex flex-col gap-2">
                {testSections.map((section, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900/85">
                        Section {i + 1}: {section.title || `Section ${i + 1}`}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-zinc-500">
                        {(section.questionIndices || []).length} questions
                        {section.timeLimitMinutes ? ` · timed ${section.timeLimitMinutes} min` : ''}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-[#d9ae3c]/40 bg-[#e9c85c]/15 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-700">Total: {totalQ} questions</span>
                    {test.timeLimit && (
                      <span className="text-xs font-semibold tabular-nums text-zinc-900/50">
                        {test.timeLimit} min total
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Intro message (warm-up copy written by the admin) */}
          {introMessage && (
            <motion.div
              variants={resultItemVariants}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: EASE_KOWALSKI }}
              className="mx-auto mb-8 max-w-lg rounded-2xl border border-[#e9c85c]/20 bg-[#e9c85c]/[0.04] px-6 py-5 text-left"
            >
              <p className="text-sm leading-relaxed text-zinc-900/75" style={{ textWrap: 'balance' }}>
                {introMessage}
              </p>
            </motion.div>
          )}

          {/* Instructions — collected by the authoring screen, never rendered. */}
          {test.instructions && (
            <motion.div
              variants={resultItemVariants}
              className="mx-auto mb-8 max-w-lg rounded-2xl border border-zinc-200 bg-white/70 px-6 py-5 text-left"
            >
              <h3 className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">
                Instructions
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-900/75">
                {test.instructions}
              </p>
            </motion.div>
          )}

          {/* Retake policy. The time and pass-mark chips in the summary above
              already say the rest — repeating them here was pure noise, and the
              old `test.disableRetake` check never existed on the model, so
              "Retakes allowed" was shown even for single-attempt tests. */}
          <motion.div variants={resultItemVariants} className="mb-8 flex flex-wrap justify-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold ${
              test.allowRetake === false
                ? 'border-zinc-200 bg-white/70 text-zinc-500'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {test.allowRetake === false ? 'Single attempt only' : 'Retakes allowed with a coupon'}
            </span>
          </motion.div>

          {/* Coupon gate. A coupon is what entitles a learner to sit the
              assessment, so it is asked for here — before the clock starts and
              before they have answered anything. */}
          <motion.form
            variants={resultItemVariants}
            onSubmit={handleVerifyCoupon}
            className={`mx-auto mb-8 w-full max-w-md rounded-2xl border px-5 py-5 text-left transition-colors duration-300 ${
              couponVerified ? 'border-emerald-300 bg-emerald-50/80' : 'border-zinc-200 bg-white/70'
            }`}
          >
            <label
              htmlFor="coupon-code"
              className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50"
            >
              Coupon code
            </label>
            <p className="mt-1 text-xs text-zinc-900/45">
              A valid coupon unlocks this assessment.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="coupon-code"
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError('');
                  setCouponVerified(false);
                }}
                placeholder="e.g. PAAVAN2026"
                autoComplete="off"
                spellCheck="false"
                disabled={couponVerified}
                aria-invalid={Boolean(couponError)}
                aria-describedby={couponError ? 'coupon-error' : undefined}
                className="w-full flex-1 rounded-full border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm tracking-wider text-zinc-900 transition-colors placeholder:text-zinc-900/30 focus:border-[#e9c85c] focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={verifyingCoupon || couponVerified || couponCode.trim().length === 0}
                className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-[#051a0d] bg-[#e9c85c] transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                style={{ isolation: 'isolate', willChange: 'transform' }}
              >
                {verifyingCoupon ? 'Checking…' : couponVerified ? 'Applied' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p id="coupon-error" role="alert" className="mt-3 text-xs font-medium text-red-600">
                {couponError}
              </p>
            )}
            {couponVerified && (
              <p role="status" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                Coupon applied — you're good to begin.
              </p>
            )}
          </motion.form>

          {/* Begin CTA */}
          <motion.button
            variants={resultItemVariants}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98, transition: { duration: 0.05 } }}
            onClick={() => { setTestStartTime(Date.now()); setNowTick(Date.now()); setShowIntro(false); scrollToTop(); }}
            disabled={!resultsCheckDone || !couponVerified}
            title={
              !resultsCheckDone
                ? 'Checking your previous attempts…'
                : !couponVerified ? 'Enter a valid coupon code to begin' : undefined
            }
            className="inline-flex items-center justify-center gap-2.5 rounded-full px-10 py-4 text-sm font-bold bg-[#e9c85c] text-[#051a0d] transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ outlineColor: GOLD, isolation: 'isolate', willChange: 'transform' }}
          >
            Begin Assessment
            <ArrowForwardIcon fontSize="small" />
          </motion.button>

          <motion.p
            variants={resultItemVariants}
            className="mt-6 text-xs text-zinc-500"
          >
            You can go back anytime. Your answers are saved as you go.
          </motion.p>
          {!couponVerified && (
            <motion.p variants={resultItemVariants} className="mt-3 text-xs text-zinc-900/45">
              No coupon yet?{' '}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I would like a coupon code to take an assessment on your website.')}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-zinc-700 underline decoration-dotted underline-offset-2"
              >
                Ask us on WhatsApp
              </a>{' '}
              and we'll send you one.
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── Results ─── */
  if (result) {
    const rec = result.topRecommendation;
    // `resultData` is a free-form object: a legacy record or a test whose
    // categories were renamed can come back empty, and every `breakdown[0]`
    // below would then throw on undefined.
    const breakdown = Object.entries(result.resultData || {}).sort((a, b) => b[1] - a[1]);
    const maxScore = Math.max(1, ...breakdown.map(([, score]) => score));

    return (
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pb-20 pt-28 sm:px-6 md:pt-32">
        <FieldBackground reducedMotion={prefersReducedMotion} />
        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <BackLink />
            <span className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 shadow-sm sm:inline-flex">
              {result.testName}
            </span>
          </div>

          {/* Why this screen is here instead of a fresh result: a submission
              was refused because an attempt already exists. Neutral, not an
              error — the outcome below is correct, the learner just needs to
              know their retake was not lost. */}
          {alreadyCompletedNotice && (
            <div
              className="mb-8 rounded-2xl border border-[#e9c85c]/25 bg-[#e9c85c]/[0.07] px-5 py-4 text-sm leading-relaxed text-zinc-700"
              role="status"
            >
              <strong className="font-semibold">Showing your saved result.</strong>{' '}
              {alreadyCompletedNotice}
            </div>
          )}

          {result.testSlug === 'commerce-career-selector' ? (
            <motion.div
              variants={resultVariants}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
            >
              <CommerceReport result={result} prefersReducedMotion={prefersReducedMotion} />

              <motion.div variants={resultItemVariants} className="flex justify-center mt-12">
                <BackLink />
              </motion.div>
            </motion.div>
          ) : result.testSlug === 'stream-selector-test' || result.testSlug === 'engineering-branch-selector' ? (
            <motion.div
              variants={resultVariants}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
            >
              <StreamSelectorReport result={result} test={test} prefersReducedMotion={prefersReducedMotion} />

              <motion.div variants={resultItemVariants} className="flex justify-center mt-12">
                <BackLink />
              </motion.div>
            </motion.div>
          ) : result.testSlug === 'humanities-career-test' ? (
            <motion.div
              variants={resultVariants}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
            >
              <HumanitiesReport result={result} test={test} prefersReducedMotion={prefersReducedMotion} />

              <motion.div variants={resultItemVariants} className="flex justify-center mt-12">
                <BackLink />
              </motion.div>
            </motion.div>
          ) : result.testSlug === 'ideal-career-test' ? (
            <motion.div
              variants={resultVariants}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
            >
              <IdealCareerReport result={result} test={test} prefersReducedMotion={prefersReducedMotion} />

              <motion.div variants={resultItemVariants} className="flex justify-center mt-12">
                <BackLink />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={resultVariants}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
            >
              {/* Heading — one composed moment */}
            <motion.div variants={resultItemVariants} className="mb-10 text-center">
              <h1 className="font-['DM_Serif_Display',Georgia,serif] text-5xl leading-tight tracking-tight text-zinc-900 md:text-6xl">
                Assessment <span className="italic" style={{ color: GOLD_INK }}>Complete</span>
              </h1>
              <motion.p
                className="mx-auto mt-4 max-w-xl text-lg text-zinc-900/65"
                style={{ textWrap: 'balance' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.5, ease: EASE_KOWALSKI }}
              >
                Based on your responses for the{' '}
                <strong className="font-semibold text-zinc-900">{result.testName}</strong>, here is your
                primary recommended path:
              </motion.p>
            </motion.div>

            {/* Time taken */}
            {result.timeTaken > 0 && (
              <motion.div variants={resultItemVariants} className="mb-6 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" d="M12 6v6l4 2"/></svg>
                  Completed in {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                </span>
              </motion.div>
            )}

            {/* Score verdict — only for keyed (scored) tests. Previously the
                result of an auto-scored test was never shown at all. */}
            {result.percentage != null && (
              <motion.div variants={resultItemVariants} className="mb-10 text-center">
                <div
                  className="mx-auto w-full max-w-2xl rounded-[2rem] border px-8 py-8 md:px-10"
                  style={{
                    background: result.passed === false
                      ? 'linear-gradient(160deg, #fdf2f2 0%, #fbe9e9 70%)'
                      : 'linear-gradient(160deg, #ecfdf5 0%, #dcf5e8 70%)',
                    borderColor: result.passed === false ? 'rgba(225,29,72,0.25)' : 'rgba(16,185,129,0.3)',
                  }}
                >
                  <span className="inline-block rounded-full border border-zinc-200/80 bg-white/70 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    Your Score
                  </span>
                  <p className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-5xl text-zinc-900 md:text-6xl">
                    {result.percentage}%
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-600">
                    {result.score} of {result.maxScore} correct
                    {passingScore != null ? ` · pass mark ${passingScore}%` : ''}
                  </p>
                  {result.passed != null && (
                    <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                      result.passed
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {result.passed ? 'Passed' : 'Not passed'}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Primary recommendation — meaningless for a keyed test, where the
                score card above is the verdict. */}
            {result.percentage == null && (
            <motion.div variants={resultItemVariants} className="mb-10 text-center">
              <div
                className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 px-8 py-10 transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_40px_80px_-40px_rgba(138,106,31,0.5)] active:scale-[0.98] md:px-12 md:py-12"
                style={{
                  background: 'linear-gradient(160deg, #fdf8e9 0%, #f9efd4 60%, #f5e9c8 100%)',
                  boxShadow: '0 30px 70px -35px rgba(138,106,31,0.35)',
                }}
              >
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: EASE_KOWALSKI }}
                  className="absolute inset-0 opacity-40"
                  style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.9), transparent 62%)' }}
                />
                <span className="relative inline-block rounded-full border border-[#d9ae3c]/45 bg-white/70 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#8a6a1f]">
                  Primary Recommendation
                </span>
                <motion.h2
                  className="relative mt-5 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl"
                  style={{ color: '#3d3009', textWrap: 'balance' }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.55, ease: EASE_KOWALSKI }}
                >
                  {result.topRecommendation}
                </motion.h2>
                <motion.p
                  className="relative mt-4 max-w-xl text-base leading-relaxed text-zinc-600"
                  style={{ textWrap: 'balance' }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.55, ease: EASE_KOWALSKI }}
                >
                  {REC_INTERP[rec] || `Your primary recommendation is ${rec}. Review the category breakdown below to understand your strengths across different areas.`}
                </motion.p>
              </div>
            </motion.div>
            )}

            {/* Category breakdown */}
            <motion.div variants={resultItemVariants} className="mx-auto mb-10 w-full max-w-3xl">
              <h3 className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">
                Category Breakdown
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {breakdown.map(([cat, score], i) => {
                  const isTop = i === 0;
                  return (
                    <div
                      key={cat}
                      className={`rounded-2xl border px-5 py-4 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] ${
                        isTop
                          ? 'border-[#d9ae3c]/40 bg-[#e9c85c]/[0.10] hover:border-[#d9ae3c]/60'
                          : 'border-white/40 bg-white/60 hover:border-zinc-300 hover:bg-white/80'
                      }`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={`font-semibold leading-snug ${isTop ? 'text-[#6b511a]' : 'text-zinc-800'}`}>
                          {cat}
                        </p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-500">
                          {score} pt{score !== 1 && 's'}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
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

            {/* Radar chart — needs at least three axes to read as a profile;
                a scored test exposes a single category, so it is skipped. */}
            {breakdown.length > 2 && (
            <motion.div variants={resultItemVariants} className="mx-auto mb-10 w-full max-w-2xl">
              <motion.h3
                className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl text-center"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.5, ease: EASE_KOWALSKI }}
              >
                Your Personality Profile
              </motion.h3>
              <div className="mx-auto flex w-full max-w-lg items-center justify-center">
                <ResponsiveRadarChart categories={breakdown} maxScore={maxScore} />
              </div>
            </motion.div>
            )}

            {/* <Where to focus /> */}
            {/* consolidated Where to Focus block (kept) — the amber "Weak areas" duplicate removed */}
            {breakdown.length > 1 && (
              <motion.div variants={resultItemVariants} className="mx-auto mb-10 w-full max-w-3xl">
                <h3 className="mb-4 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">
                  Where to Focus
                </h3>
                <div className="rounded-2xl border border-white/40 bg-white/60 px-6 py-5 shadow-sm backdrop-blur-md transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.01] hover:shadow-md">
                  <p className="mx-auto mb-4 max-w-md text-pretty text-center text-sm text-zinc-600">
                    Strengthening these areas can help build a more balanced profile. Review the explanations below for guidance.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {breakdown.slice(1, 4).map(([topic, score], i) => (
                      <div key={topic} className="rounded-xl border border-zinc-200/60 bg-white/60 px-4 py-3">
                        <div className="flex items-baseline justify-between gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-zinc-800">{topic}</span>
                          <span className="text-xs font-semibold text-[#b8892e] tabular-nums">{score} pts</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-zinc-200/80">
                          <div
                            className="h-full rounded-full transition-[width] duration-700 ease-out"
                            style={{
                              width: `${Math.round((score / maxScore) * 100)}%`,
                              background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Counsellor CTA */}
            <motion.div
              variants={resultItemVariants}
              className="relative mx-auto mb-12 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 bg-white/70 px-7 py-10 text-center backdrop-blur-xl transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.01] hover:shadow-[0_20px_60px_-20px_rgba(217,174,60,0.3)] active:scale-[0.99] md:px-12 md:py-12"
            >
              <motion.p
                className="text-[0.7rem] font-bold uppercase tracking-[0.2em]"
                style={{ color: GOLD_INK }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.4, ease: EASE_KOWALSKI }}
              >
                Make it count
              </motion.p>
              <motion.h3
                className="mx-auto mt-3 max-w-xl font-['DM_Serif_Display',Georgia,serif] text-3xl leading-tight text-zinc-900 md:text-4xl"
                style={{ textWrap: 'balance' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.5, ease: EASE_KOWALSKI }}
              >
                Talk to a counsellor about{' '}
                <em className="italic" style={{ color: GOLD_INK }}>your results</em>
              </motion.h3>
              {/* Interpretation card */}
              {breakdown.length > 0 && (
                <div className="mt-4 max-w-xl rounded-xl border border-zinc-200 bg-white/70 px-5 py-4 text-left">
                  <p className="text-sm text-zinc-700 mb-3">
                    Your top score is in <strong>{breakdown[0][0]}</strong> ({breakdown[0][1]} pts).
                    {' '}The areas below scored lower and may be worth reviewing:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
                    {breakdown.slice(1, 4).map(([topic, score]) => (
                      <li key={topic}><strong>{topic}</strong> ({score} pts)</li>
                    ))}
                  </ul>
                </div>
              )}
              <motion.p
                className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-900/60 md:text-lg"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: EASE_KOWALSKI }}
              >
                A one-on-one session turns this report into a clear roadmap: streams, courses, and
                next steps chosen with clarity instead of guesswork.
              </motion.p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <motion.a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just completed the ${result.testName} on your website and would like to discuss my results with a counsellor.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98, transition: { duration: 0.05 } }}
                  className="inline-flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-8 py-4 text-sm font-bold no-underline bg-[#e9c85c] text-[#051a0d] transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02] sm:w-auto"
                  style={{ isolation: 'isolate', willChange: 'transform' }}
                >
                  <WhatsAppIcon fontSize="small" aria-hidden="true" />
                  Discuss on WhatsApp
                </motion.a>
                <MotionLink
                  to="/career-counselling"
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98, transition: { duration: 0.05 } }}
                  className="group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white/70 px-8 py-4 text-sm font-semibold text-zinc-700 no-underline transition-[border-color,background-color] duration-200 ease-out hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
                >
                  <PsychologyIcon fontSize="small" aria-hidden="true" />
                  See How Counselling Works
                </MotionLink>
              </div>
            </motion.div>

            {/* Answer Review — sibling of the counsellor card, not a child of
                it. Both used to render inside that card's border. */}
            <div>
              {(result.answerDetails && Object.keys(result.answerDetails).length > 0)
                  || (result.answers && Object.keys(result.answers).length > 0) ? (
                <motion.div variants={resultItemVariants} className="mx-auto mb-8 w-full max-w-3xl">
                  <motion.h3
                    className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06, duration: 0.45, ease: EASE_KOWALSKI }}
                  >
                    Your Answers
                  </motion.h3>
                  <div className="rounded-2xl border border-zinc-200 bg-white/70 divide-y divide-zinc-200/70 overflow-hidden">
                    {Object.entries(result.answerDetails || result.answers || {}).map(([idx, val]) => {
                      const qIdx = Number(idx);
                      const q = test?.questions?.[qIdx];
                      const optText = typeof val === 'string' ? val : (val?.text || '—');
                      const letter = q ? String.fromCharCode(65 + q.options.findIndex(o => o.text === optText)) : '—';
                      return (
                        <motion.div
                          key={qIdx}
                          className="px-5 py-4 sm:px-7"
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + Number(idx) * 0.04, duration: 0.4, ease: EASE_KOWALSKI }}
                        >
                          <p className="text-sm font-medium text-zinc-600 mb-1">
                            Q{qIdx + 1}. {q?.question || '—'}
                          </p>
                          <p className="text-sm font-semibold text-zinc-800">
                            {letter !== '—' && letter !== '@' ? <span className="mr-1">({letter})</span> : ''}{optText}
                          </p>
                          {/* Correctness + explanation */}
                          {q && (
                            <div className="mt-2 flex flex-col gap-1">
                              {(result.questionStats?.[qIdx]?.correct === true || result.questionStats?.[qIdx]?.correct === false) && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                                  result.questionStats[qIdx].correct
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                  {result.questionStats[qIdx].correct ? 'Correct' : 'Incorrect'}
                                </span>
                              )}
                              {q.explanation && test?.showExplanations !== false && (
                                <p className="text-xs leading-relaxed text-zinc-600 mt-2 border-l-2 border-[#d9ae3c]/60 pl-3" style={{ textWrap: 'balance' }}>
                                  <span className="inline-flex items-center gap-1 text-[#8a6a1f] font-semibold text-[0.6rem] uppercase tracking-[0.14em] mb-0.5">
                                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"/></svg>
                                    Explanation
                                  </span>
                                  {q.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
                ) : null}
            </div>

            {/* Retake CTA */}
            {result && result.testSlug === type && test?.allowRetake !== false && (
              <motion.div variants={resultItemVariants} className="mx-auto mb-8 w-full max-w-3xl">
                <div className="rounded-2xl border border-[#d9ae3c]/40 bg-[#e9c85c]/[0.14] px-6 py-6 text-center">
                  <p className="text-sm text-zinc-700 mb-4">
                    Didn't get the result you wanted? Use a coupon to retake this assessment.
                  </p>
                  {retakeError && (
                    <p role="alert" className="text-sm text-red-600 mb-3">{retakeError}</p>
                  )}
                  {couponApplied && (
                    <p className="text-xs text-emerald-600 mt-2">Coupon validated — retake reset to question 1.</p>
                  )}
                  {!couponApplied && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponVerified(false);
                          setRetakeError('');
                        }}
                        placeholder="Enter coupon code"
                        aria-label="Coupon code"
                        autoComplete="off"
                        spellCheck="false"
                        className="w-56 rounded-full border border-zinc-200 bg-zinc-50/80 px-4 py-2 text-sm tracking-wider text-zinc-900 transition-[border-color,background-color] duration-200 ease-out placeholder:text-zinc-900/30 focus:border-[#e9c85c] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRetake}
                        disabled={isSubmitting || couponCode.trim().length === 0}
                        className="rounded-full px-6 py-2 text-sm font-bold text-[#051a0d] bg-[#e9c85c] transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                        style={{ isolation: 'isolate', willChange: 'transform' }}
                      >
                        {isSubmitting ? 'Processing...' : 'Retake Test'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div variants={resultItemVariants} className="flex justify-center">
              <BackLink />
            </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Question flow ─── */
  const motionEnabled = !prefersReducedMotion;
  const isCompleted = totalQuestions > 0 && answeredCount === totalQuestions;
  
  // Batch variables
    const currentBatchQs = test.questions.slice(currentQuestionIdx, currentQuestionIdx + BATCH_SIZE);
  const isLastBatch = currentQuestionIdx + BATCH_SIZE >= totalQuestions;
  const totalBatches = Math.ceil(totalQuestions / BATCH_SIZE);
  const currentBatchIdx = Math.floor(currentQuestionIdx / BATCH_SIZE);

  const currentSectionIndex = testSections
    ? testSections.findIndex(s => (s.questionIndices || []).includes(currentQuestionIdx))
    : -1;

  // Render variables for progress bar
  const renderProgressBar = () => {
    if (BATCH_SIZE === 1) {
      return test.questions.map((_, i) => {
        const isAnswered = answers[i] != null;
        const isCurrent = i === currentQuestionIdx;
        let barClass = 'bg-zinc-200';
        if (isCurrent && !isAnswered) {
          barClass = 'animate-pulse bg-[#d9ae3c]/80';
        } else if (isAnswered && !isCurrent) {
          barClass = 'bg-[#34d399]/60 hover:bg-[#34d399]/90';
        } else if (isCurrent) {
          barClass = 'bg-[#d9ae3c]';
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
      });
    } else {
      return Array.from({ length: totalBatches }).map((_, i) => {
        const batchStart = i * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalQuestions);
        const batchQuestions = test.questions.slice(batchStart, batchEnd);
        
        // Batch is considered answered if ALL questions in the batch are answered
        let answeredInBatch = 0;
        for (let j = batchStart; j < batchEnd; j++) {
            if (answers[j] != null) answeredInBatch++;
        }
        const isAnswered = answeredInBatch === (batchEnd - batchStart);
        const isPartiallyAnswered = answeredInBatch > 0 && answeredInBatch < (batchEnd - batchStart);
        const isCurrent = i === currentBatchIdx;
        
        let barClass = 'bg-zinc-200';
        if (isCurrent && !isAnswered) {
          barClass = 'animate-pulse bg-[#d9ae3c]/80';
        } else if (isAnswered && !isCurrent) {
          barClass = 'bg-[#34d399]/60 hover:bg-[#34d399]/90';
        } else if (isPartiallyAnswered && !isCurrent) {
          barClass = 'bg-[#d9ae3c]/40 hover:bg-[#d9ae3c]/70';
        } else if (isCurrent) {
          barClass = 'bg-[#d9ae3c]';
        }
        return (
          <button
            key={i}
            type="button"
            disabled={!isAnswered && !isPartiallyAnswered && !isCurrent}
            onClick={() => (isAnswered || isPartiallyAnswered) && changeQuestion(batchStart)}
            aria-label={`Go to batch ${i + 1}`}
            title={`Review batch ${i + 1}`}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${barClass} ${
              isCurrent ? 'md:h-2' : ''
            } ${(isAnswered || isPartiallyAnswered) ? 'cursor-pointer disabled:cursor-default' : 'cursor-default'}`}
          />
        );
      });
    }
  };

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pt-32">
      <FieldBackground reducedMotion={prefersReducedMotion} />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4 md:gap-5">
        {couponApplied && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            Retake reset — you're back at question 1
          </div>
        )}

        {/* Top bar: leave + which assessment */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink />
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 shadow-sm">
              <AssignmentTurnedInIcon sx={{ fontSize: 16 }} aria-hidden="true" style={{ color: GOLD_STRONG }} />
              <span className="max-w-[180px] truncate sm:max-w-none">{test.name}</span>
            </span>
            {/* Countdown timer — only shown when there's a time limit active */}
            {timeLimit != null && timeLeft != null && timeLeft > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-zinc-200 px-3 py-1 text-xs font-bold tabular-nums text-zinc-700 shadow-sm">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" d="M12 6v6l4 2"/></svg>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* Question card */}
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 ring-1 ring-zinc-200/50 px-5 py-7 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:px-8 md:px-10 md:py-10"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}80, transparent)` }}
          />

          {/* Progress header */}
          <div className="mb-8 md:mb-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Section label when sectioned */}
                {testSections && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-zinc-200 bg-white/50 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    {currentSectionIndex >= 0
                      ? `${testSections[currentSectionIndex].title || `Section ${currentSectionIndex + 1}`} · ${currentSectionIndex + 1}/${testSections.length}`
                      : 'Overview'}
                  </span>
                )}
                {/* Per-section countdown, shown only while a timed section runs */}
                {sectionTimeLeft != null && (
                  <span                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${
                    sectionTimeLeft <= 60
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white/70 border-zinc-200 text-zinc-700'
                  }`}>
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" d="M12 6v6l4 2"/></svg>
                    Section: {Math.floor(sectionTimeLeft / 60)}:{(sectionTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                )}
                <p className="text-sm font-bold text-zinc-800">
                  {BATCH_SIZE > 1 ? 'Questions' : 'Question'}{' '}
                  <span className="tabular-nums">
                    {BATCH_SIZE > 1 
                      ? `${currentQuestionIdx + 1}-${Math.min(currentQuestionIdx + BATCH_SIZE, totalQuestions)}` 
                      : currentQuestionIdx + 1}
                  </span>
                  <span className="font-medium text-zinc-400"> / {totalQuestions}</span>
                </p>
                {/* Difficulty badge for the current question - ONLY if BATCH_SIZE is 1 */}
                {BATCH_SIZE === 1 && currentBatchQs[0]?.difficulty && currentBatchQs[0].difficulty !== 'intermediate' && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
                    currentBatchQs[0].difficulty === 'beginner'
                      ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/20'
                      : 'bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/20'
                  }`}>
                    <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    {currentBatchQs[0].difficulty}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tabular-nums text-zinc-400">
                {answeredCount} of {totalQuestions} answered
              </span>
            </div>

            {/* Timer */}
            {testStartTime && (
              <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-white/70 border border-zinc-200 px-4 py-2">
                <svg className="w-4 h-4 text-[#b8892e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path strokeWidth="2" d="M12 6v6l4 2"/>
                </svg>
                {timeLimit && timeLeft != null && (
                  <>
                    <span className={`text-sm font-semibold tabular-nums ${timeLeft <= 60 ? 'text-red-400' : 'text-zinc-900/70'}`}>
                      {Math.floor(timeLeft / 60)}m {timeLeft % 60}s remaining
                    </span>
                  </>
                ) || (
                  <span className="text-sm font-semibold text-zinc-900/70 tabular-nums">
                    {Math.floor((nowTick - testStartTime) / 60000)}m {Math.floor(((nowTick - testStartTime) % 60000) / 1000)}s elapsed
                  </span>
                )}
              </div>
            )}

            {/* Segmented progress */}
            <div className="flex gap-1.5" role="group" aria-label="Test progress">
              {renderProgressBar()}
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
                y:    { type: "spring", stiffness: 300, damping: 22 },
                opacity: { duration: 0.15 },
                scale: { type: "spring", stiffness: 360, damping: 28 },
              }}
              className={BATCH_SIZE > 1 ? "flex flex-col gap-16 md:gap-20" : ""}
            >
              {currentBatchQs.map((q, localIdx) => {
                const actualIdx = currentQuestionIdx + localIdx;
                // Show scenario if it's the first question in the batch with this scenario,
                // or if the scenario changed from the previous question.
                const showScenario = q.scenario && (localIdx === 0 || currentBatchQs[localIdx - 1].scenario !== q.scenario);
                
                return (
                  <div key={actualIdx} className={BATCH_SIZE > 1 ? "border-b border-zinc-200/50 pb-16 md:pb-20 last:border-0 last:pb-0" : ""}>
                    <motion.div
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: EASE_KOWALSKI, delay: 0.02 + (localIdx * 0.05) }}
                    >
                      {/* Section Break Header */}
                      {testSections && currentSectionIndex >= 0 && testSections[currentSectionIndex].questionIndices[0] === actualIdx && (
                        <div className="mb-10 w-full rounded-2xl bg-white/80 border border-zinc-200/60 ring-1 ring-[#34d399]/25 p-6 sm:p-8 text-center shadow-lg backdrop-blur-md">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                            Section {currentSectionIndex + 1} of {testSections.length}
                          </span>
                          <h3 className="mb-3 font-['DM_Serif_Display',Georgia,serif] text-2xl sm:text-3xl text-zinc-900">
                            {testSections[currentSectionIndex].title}
                          </h3>
                          {testSections[currentSectionIndex].description && (
                            <p className="mx-auto max-w-2xl text-sm sm:text-base text-zinc-900/70 leading-relaxed" style={{ textWrap: 'balance' }}>
                              {testSections[currentSectionIndex].description}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Scenario rendering */}
                      {showScenario && (
                        q.scenario.length > 200 ? (
                          <div className="mx-auto mb-8 w-full max-w-3xl rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md p-5 text-left sm:p-6 shadow-sm">
                            <span className="mb-3 inline-flex items-center gap-1.5 text-[#8a6a1f] font-semibold text-[0.65rem] uppercase tracking-[0.14em]">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"/></svg>
                              Reading passage
                            </span>
                            <p className="text-[0.95rem] leading-relaxed tracking-tight text-zinc-800 whitespace-pre-wrap text-pretty">{q.scenario}</p>
                          </div>
                        ) : (
                          <div className="mx-auto mb-6 max-w-2xl text-sm text-zinc-900/55 leading-relaxed text-pretty" style={{ textAlign: 'center', textWrap: 'balance' }}>
                            <span className="inline-flex items-center gap-1.5 text-[#8a6a1f] font-semibold text-[0.65rem] uppercase tracking-[0.14em] mb-1.5">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"/></svg>
                              Scenario
                            </span>
                            <p>{q.scenario}</p>
                            {(() => {
                              const m = /Q(\d{1,3})/.exec(q.scenario || '');
                              const target = m ? Number(m[1]) : null;
                              return target != null && target >= 1 && target <= totalQuestions ? (
                                <button
                                  type="button"
                                  onClick={() => changeQuestion(Math.floor((target - 1) / BATCH_SIZE) * BATCH_SIZE)}
                                  className="ml-2 mt-2 inline-flex items-center gap-1 rounded-full border border-[#d9ae3c]/50 bg-[#e9c85c]/20 px-3 py-1 text-xs font-bold text-[#6b511a] transition hover:bg-[#e9c85c]/35"
                                >
                                  View passage (Q{target})
                                </button>
                              ) : null;
                            })()}
                          </div>
                        )
                      )}

                      <h2
                        className={`mx-auto mb-10 ${BATCH_SIZE > 1 ? 'max-w-4xl text-left' : 'max-w-[32ch] text-center'} font-['DM_Serif_Display',Georgia,serif] text-[clamp(1.3rem,2.5vw,1.75rem)] tracking-tight leading-[1.3] text-zinc-900`}
                        style={{ textWrap: 'balance' }}
                      >
                        {BATCH_SIZE > 1 && <span className="text-zinc-400 block text-[0.7rem] font-sans font-bold uppercase tracking-[0.2em] mb-3">Question {actualIdx + 1}</span>}
                        {q.question}
                      </h2>
                      {q.imageUrl && (
                        <div className={`mx-auto mb-12 flex w-full max-w-4xl ${BATCH_SIZE > 1 ? 'justify-start' : 'justify-center'} overflow-hidden rounded-2xl bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5`}>
                          <img src={resolveTestImage(q.imageUrl)} alt="Question diagram or table" loading="lazy" onError={(e) => { e.currentTarget.closest('div').style.display = 'none'; }} className="max-w-full object-scale-down mix-blend-multiply p-4 sm:p-6" style={{ maxHeight: '60vh' }} />
                        </div>
                      )}
                    </motion.div>

                    <div className={`mx-auto mb-4 grid w-full gap-4 md:gap-5 ${(q.options || []).some((o) => o.imageUrl) ? 'max-w-3xl grid-cols-1 sm:grid-cols-2' : 'max-w-2xl grid-cols-1'}`} role="group" aria-label={`Answer options for question ${actualIdx + 1}`}>
                      {q.options.map((opt, i) => {
                        const isSelected = answers[actualIdx]?.text === opt.text;
                        const onKeyDown = (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOptionSelect(opt, actualIdx);
                          }
                        };
                        return (
                          <OptionCard
                            key={i}
                            opt={opt}
                            index={i}
                            isSelected={isSelected}
                            onSelect={(opt) => handleOptionSelect(opt, actualIdx)}
                            onKeyDown={onKeyDown}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex gap-2 text-xs text-zinc-900/50">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 text-[#34d399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    {answeredCount} answered
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 text-zinc-900/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" d="M12 6v6l4 2"/></svg>
                    {Math.max(0, totalQuestions - answeredCount)} still unanswered
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-6 py-3 text-sm font-semibold text-zinc-700 transition-[color,background-color,border-color] duration-200 ease-out hover:border-zinc-300 hover:bg-white hover:text-zinc-900 focus-visible:outline focus-visible:outline-2"
                    style={{ outlineColor: GOLD }}
                  >
                    Review Answers
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoAdvance(v => !v)}
                    aria-pressed={autoAdvance}
                    title="Move to the next question automatically after answering"
                    className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-[color,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 ${
                      autoAdvance
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-white/60 text-zinc-600 hover:border-zinc-300 hover:bg-white'
                    }`}
                    style={{ outlineColor: GOLD }}
                  >
                    Auto-advance: {autoAdvance ? 'on' : 'off'}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {isLastBatch && (
            <div className="mx-auto w-full max-w-2xl">
              <div
                className="mt-12 rounded-2xl border border-solid border-[#d9ae3c]/40 bg-[#e9c85c]/[0.14] px-5 py-6 text-center backdrop-blur-md"
                style={{ boxShadow: '0 12px 40px -18px rgba(217,174,60,0.35)' }}
              >
                <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-900/60">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  Review your answers before submitting
                </div>
                <div className="mb-4 flex gap-1.5 justify-center">
                  {renderProgressBar()}
                </div>
                <span className="text-sm font-medium text-zinc-900/70">
                  {answeredCount} of {totalQuestions} answered
                  {test.passingScore > 0 && ' · pass score ' + test.passingScore + '%'}
                </span>
              </div>
            </div>
          )}

          {submitError && (
            <div
              className="mx-auto mb-6 w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 border-t border-zinc-200 pt-6">
            <motion.button
              type="button"
              whileTap={motionEnabled ? { scale: 0.98, transition: { duration: 0.05 } } : {}}
              onClick={() => changeQuestion(Math.max(0, currentQuestionIdx - BATCH_SIZE))}
              disabled={currentQuestionIdx === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/60 px-5 py-3 text-sm font-semibold text-zinc-700 transition-[background-color,border-color,color] duration-200 ease-out hover:border-zinc-300 hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:bg-white/60 disabled:hover:text-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: GOLD, isolation: 'isolate' }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} aria-hidden="true" className="-ml-1" />
              Previous
            </motion.button>

            {isLastBatch ? (
              <motion.button
                type="button"
                whileTap={motionEnabled ? { scale: 0.98, transition: { duration: 0.05 } } : {}}
                onClick={() => setShowReview(true)}
                disabled={!isCompleted || isSubmitting}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 text-sm font-bold bg-[#e9c85c] text-[#051a0d] transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: GOLD, isolation: 'isolate', willChange: 'transform' }}
              >
                Review Answers
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={motionEnabled && currentBatchQs.every((_, i) => answers[currentQuestionIdx + i]) ? { scale: 0.98, transition: { duration: 0.05 } } : {}}
                onClick={() => changeQuestion(Math.min(totalQuestions - 1, currentQuestionIdx + BATCH_SIZE))}
                disabled={!currentBatchQs.every((_, i) => answers[currentQuestionIdx + i])}
                title={!currentBatchQs.every((_, i) => answers[currentQuestionIdx + i]) ? 'Select answers to continue' : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 text-sm font-bold transition-[transform,opacity,background-color,color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  currentBatchQs.every((_, i) => answers[currentQuestionIdx + i]) 
                    ? 'bg-[#e9c85c] text-[#051a0d] hover:scale-[1.02]' 
                    : 'bg-zinc-200/70 text-zinc-400 cursor-not-allowed'
                }`}
                style={{
                  outlineColor: GOLD,
                  isolation: 'isolate', 
                  willChange: 'transform'
                }}
              >
                Next
                <ArrowForwardIcon sx={{ fontSize: 18 }} aria-hidden="true" className="-mr-1" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden live region so screen readers announce the question change */}
      <span className="sr-only" role="status" aria-live="polite">
        {`Question ${currentQuestionIdx + 1} of ${totalQuestions}`}
      </span>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md" onClick={() => setShowReview(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-50/95 backdrop-blur-xl ring-1 ring-zinc-200/50 p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] scrollbar-hide"
          >
            <div className="mb-6 flex items-center justify-between sticky top-0 bg-zinc-50/90 backdrop-blur-md py-4 z-10 -mt-6 -mx-6 px-6 sm:-mx-8 sm:px-8 border-b border-zinc-200/60">
              <h2 id="review-dialog-title" className="font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">Review Responses</h2>
              <button
                type="button"
                onClick={() => setShowReview(false)}
                aria-label="Close review"
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-200/70 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900 transition-[color,background-color] duration-200 ease-out"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="space-y-4 divide-y divide-zinc-200/70 mt-2">
              {test.questions.map((q, idx) => {
                const selected = answers[idx];
                const correct = result?.questionStats?.[idx]?.correct;
                return (
                  <div key={idx} className="py-5 first:pt-2 last:pb-2 flex flex-col sm:flex-row gap-4">
                    <div className="shrink-0 w-12 text-sm font-bold text-zinc-400 pt-1">
                      {String(idx + 1).padStart(2, '0')}.
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-zinc-900/90 mb-3 tracking-tight" style={{ textWrap: 'pretty' }}>{q.question}</p>
                      {q.scenario && (
                        <p className="mb-3 text-xs leading-relaxed text-zinc-900/45">
                          {q.scenario.length > 160 ? `${q.scenario.slice(0, 160)}…` : q.scenario}
                        </p>
                      )}
                      {q.imageUrl && (
                        <img src={resolveTestImage(q.imageUrl)} alt={`Question ${idx + 1} diagram`} loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="mb-3 max-h-40 max-w-full rounded-lg border border-zinc-200 bg-white object-scale-down p-1.5" />
                      )}
                      <div className="flex items-start gap-2 bg-white/60 rounded-xl p-3 border border-zinc-200/60">
                        {selected ? (
                          <>
                            <CheckCircleIcon sx={{ fontSize: 18 }} className="text-[#34d399] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-700 leading-relaxed">
                                {selected.text}
                              </p>
                              {(() => {
                                const optIdx = (q.options || []).findIndex((o) => o.text === selected.text);
                                const optImg = optIdx >= 0 ? q.options[optIdx].imageUrl : null;
                                return optImg ? (
                                  <img src={resolveTestImage(optImg)} alt="Selected option visual" loading="lazy"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    className="mt-2 max-h-20 max-w-full rounded-lg border border-zinc-200 bg-white object-scale-down p-1" />
                                ) : null;
                              })()}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-red-500 italic">
                            — No answer selected —
                          </p>
                        )}
                        {/* Correctness indicator — only for keyed items. `null`
                            means "no right answer" (profile tests), and the
                            old `!== undefined` check painted every one of
                            those answers as Incorrect. */}
                        {correct === false && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-red-600 ml-2">
                            Incorrect
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end sticky bottom-0 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent pt-6 pb-2 -mb-2 -mx-6 px-6 sm:-mx-8 sm:px-8">
              <button
                onClick={() => { setShowReview(false); setConfirmSubmit(false); }}
                className="px-6 py-3.5 rounded-full text-sm font-semibold text-zinc-700 border border-zinc-200 bg-white/70 hover:bg-white hover:border-zinc-300 hover:text-zinc-900 transition-[color,background-color,border-color,transform] duration-200 ease-out active:scale-[0.98]"
              >
                {confirmSubmit ? 'Wait, go back' : 'Return to Test'}
              </button>
              <motion.button
                type="button"
                whileTap={motionEnabled ? { scale: 0.98, transition: { duration: 0.05 } } : {}}
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions || result}
                title={answeredCount < totalQuestions ? `Answer all ${totalQuestions} questions to submit (${answeredCount}/${totalQuestions})` : undefined}
                className={`px-8 py-3.5 rounded-full text-sm font-bold text-white transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
                  confirmSubmit
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#051a0d] hover:bg-[#0a3a1d]'
                }`}
                style={{ isolation: 'isolate', willChange: 'transform' }}
              >
                {isSubmitting ? 'Submitting...' : confirmSubmit ? 'Yes, Submit Test' : 'Finalize & Submit'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

