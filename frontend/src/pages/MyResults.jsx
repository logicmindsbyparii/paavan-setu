import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizIcon from '@mui/icons-material/Quiz';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getMyTestResults, getTestBySlug, logApiFailure, isClientError } from '../lib/api';
import { colors } from '../constants/tokens';
import { buildReportModel } from '../lib/reportModel';
import ReportPrintDocument from '../components/ReportPrintDocument';
import CommerceReportPrintDocument from '../components/CommerceReportPrintDocument';
import HumanitiesReportPrintDocument from '../components/HumanitiesReportPrintDocument';
import { buildHumanitiesReportModel } from '../lib/humanitiesReportModel';
import IdealCareerReportPrintDocument from '../components/IdealCareerReportPrintDocument';
import { buildIdealCareerModel } from '../lib/idealCareerModel';
import { financialDomains } from '../constants/reportMeta';

const springConfig = {
  type: "spring",
  stiffness: 120,
  damping: 20
};

const slideUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, ...springConfig },
  }),
};

export default function MyResults() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /* PDF export for past attempts. `printSlot` holds the attempt being printed
     plus everything the print document needs; it lives here (not inside the
     report component) because the on-screen report is never mounted on this
     page — the PDF is built straight from the stored result. */
  const [printSlot, setPrintSlot] = useState(null);
  const [pdfBusySlug, setPdfBusySlug] = useState('');

  const handlePrint = () => {
    // Give React a tick to finish painting the sheet before the dialog opens.
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
    });
  };

  const openPdf = async (result) => {
    if (pdfBusySlug) return;
    const slug = result.testSlug || '';
    setPdfBusySlug(result._id || slug);
    try {
      if (slug === 'commerce-career-selector') {
        // Commerce needs no test doc — everything comes from resultData.
        setPrintSlot({ kind: 'commerce', result, test: null });
      } else if (slug === 'stream-selector-test' || slug === 'engineering-branch-selector') {
        // The section map lives on the test doc; fetch it so the PDF gets
        // section-wise rows. Falls back to the built-in section map on 404.
        let test = null;
        try {
          const data = await getTestBySlug(slug);
          test = data?.data ?? data ?? null;
        } catch { /* fallback sections apply */ }
        setPrintSlot({ kind: 'stream', result, test });
      } else if (slug === 'humanities-career-test') {
        // The humanities model re-slices stored answers by track; the test doc
        // is only needed for question text on the review list. Falls back
        // gracefully (question numbers) on 404.
        let test = null;
        try {
          const data = await getTestBySlug(slug);
          test = data?.data ?? data ?? null;
        } catch { /* review list degrades to question numbers */ }
        setPrintSlot({ kind: 'humanities', result, test });
      } else if (slug === 'ideal-career-test') {
        // Same shape as humanities: the model re-slices stored answers; the
        // test doc only feeds question text for the review list.
        let test = null;
        try {
          const data = await getTestBySlug(slug);
          test = data?.data ?? data ?? null;
        } catch { /* review list degrades to question numbers */ }
        setPrintSlot({ kind: 'ideal', result, test });
      } else {
        // Other scored/profile tests have no bespoke report sheet yet.
        return;
      }
    } finally {
      setPdfBusySlug('');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login', { state: { from: '/my-results' } });
      return;
    }

    const fetchResults = async () => {
      try {
        const data = await getMyTestResults();
        setResults(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        if (isClientError(err)) {
          setError('Your session has expired. Please sign in again to see your results.');
        } else {
          logApiFailure('load my results', err);
          setError(err.message || 'Could not load your results.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-dvh isolate flex flex-col justify-center px-4 bg-[#eef6f0]/60 sm:px-8">
        <div className="w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-10 w-48 mb-12 bg-zinc-200/80 rounded-md"
          />
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0.4, 0.8, 0.4], y: 0 }}
                transition={{
                  y: { ...springConfig, delay: i * 0.05 },
                  opacity: { repeat: Infinity, duration: 1.5, ease: "linear", delay: i * 0.05 }
                }}
                className="h-32 rounded-xl bg-white border border-zinc-200/70"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#eef6f0]/60 px-4 py-16 sm:py-24 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <Link
          to="/test"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 mb-12 active:scale-95"
        >
          <ArrowBackIcon fontSize="small" />
          Back to Assessments
        </Link>

        <div className="mb-12 max-w-[65ch]">
          <h1 className="font-['DM_Serif_Display',Georgia,serif] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-zinc-900 mb-4">
            Assessment History
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed font-['DM_Sans',sans-serif]">
            Review your completed psychometric assessments, performance breakdowns, and primary recommendations.
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          {error ? (
             <motion.div
               initial={prefersReducedMotion ? 'visible' : 'hidden'}
               animate='visible'
               exit='hidden'
               variants={slideUp}
               custom={0}
               className="rounded-xl border border-red-200 bg-red-50 p-8"
             >
               <p className="text-red-600 font-medium">{error}</p>
             </motion.div>
          ) : results.length === 0 ? (
            <motion.div
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate='visible'
              exit='hidden'
              variants={slideUp}
              custom={0}
              className="rounded-xl border border-zinc-200 bg-white p-10 sm:p-14 text-center"
            >
              <QuizIcon sx={{ fontSize: 40, color: colors.amber, opacity: 0.9, mb: 6 }} />
              <h2 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 mb-3">
                No assessments taken yet
              </h2>
              <p className="text-zinc-600 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                Take a psychometric test from the catalog to see your detailed results, scores, and recommendations here.
              </p>
              <Link
                to="/test"
                className="inline-flex items-center justify-center rounded-full bg-[#e9c85c] px-6 py-3 text-sm font-bold text-[#051a0d] transition-[transform,background-color] duration-200 ease-out active:scale-[0.98] hover:bg-[#d9ae3c]"
              >
                Browse Assessments
              </Link>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              {results.map((result, i) => {
                const scores = result.resultData || {};
                const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);

                return (
                  <motion.div
                    key={result._id || i}
                    initial={prefersReducedMotion ? 'visible' : 'hidden'}
                    animate='visible'
                    exit='hidden'
                    variants={slideUp}
                    custom={i}
                    layout
                    className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-zinc-300 hover:bg-[#f6faf7] hover:shadow-sm"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="rounded-sm bg-zinc-900/[0.06] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-zinc-600">
                            Completed
                          </span>
                          <span className="text-sm font-medium text-zinc-500">
                            {new Date(result.completedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 leading-tight">
                          {result.testName}
                        </h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {(result.testSlug === 'stream-selector-test'
                          || result.testSlug === 'engineering-branch-selector'
                          || result.testSlug === 'commerce-career-selector'
                          || result.testSlug === 'humanities-career-test') && (
                          <button
                            type="button"
                            onClick={() => openPdf(result)}
                            disabled={pdfBusySlug === (result._id || result.testSlug)}
                            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 disabled:cursor-wait disabled:opacity-50"
                          >
                            <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                            <span className="hidden sm:inline">{pdfBusySlug === (result._id || result.testSlug) ? 'Preparing…' : 'PDF'}</span>
                          </button>
                        )}
                        <Link
                          to={`/test/${result.testSlug}`}
                          className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95"
                        >
                          <QuizIcon sx={{ fontSize: 16 }} />
                          <span className="hidden sm:inline">Review</span>
                        </Link>
                      </div>
                    </div>

                    {/* Verdict block */}
                    <div className="mb-6 grid sm:grid-cols-2 gap-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          {result.percentage != null ? 'Score & Verdict' : 'Primary Recommendation'}
                        </span>
                        <div className="flex items-center gap-2">
                          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: colors.amber }} />
                          <span className="text-base font-semibold text-zinc-900">
                            {result.percentage != null ? (
                              <>
                                <span className="text-[#8a6a1f]">{result.percentage}%</span>
                                <span className="text-zinc-400 font-normal mx-1.5">({result.score}/{result.maxScore})</span>
                                {result.passed === true && <span className="text-emerald-600">· Passed</span>}
                                {result.passed === false && <span className="text-red-600">· Failed</span>}
                              </>
                            ) : (
                              <span className="text-[#8a6a1f]">{result.topRecommendation}</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {result.timeTaken > 0 && (
                        <div className="flex flex-col sm:items-end">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                            Duration
                          </span>
                          <span className="text-base font-medium text-zinc-700 tabular-nums">
                            {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Score breakdown */}
                    {entries.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">
                          Category Breakdown
                        </span>
                        <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-3 pb-2 sm:pb-0 hide-scrollbar">
                          {entries.map(([cat, score]) => {
                            const isTop = cat === result.topRecommendation;
                            return (
                              <div
                                key={cat}
                                className={`shrink-0 w-40 sm:w-auto flex flex-col justify-between rounded-xl p-3.5 border transition-colors ${
                                  isTop
                                    ? 'bg-[#e9c85c]/[0.18] border-[#d9ae3c]/45'
                                    : 'bg-zinc-50/80 border-zinc-200'
                                }`}
                              >
                                <span className={`text-[0.7rem] font-semibold tracking-wide mb-2 truncate ${isTop ? 'text-[#6b511a]' : 'text-zinc-600'}`} title={cat}>
                                  {cat}
                                </span>
                                <span className={`text-xl tracking-tight tabular-nums font-bold ${
                                  isTop ? 'text-[#8a6a1f]' : 'text-zinc-800'
                                }`}>
                                  {score}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* PDF export dialogs for past attempts. One slot, opened per card. */}
      {printSlot?.kind === 'stream' && (() => {
        const model = buildReportModel(printSlot.result, printSlot.test);
        return (
          <ReportPrintDocument
            open
            onClose={() => setPrintSlot(null)}
            onPrint={handlePrint}
            result={printSlot.result}
            breakdown={model.breakdown}
            maxScore={model.maxScore}
            total={model.total}
            topStream={model.topStream}
            topPts={model.topPts}
            confidence={model.confidence}
            runnerUp={model.runnerUp}
            marginPts={model.marginPts}
            marginPct={model.marginPct}
            decisive={model.decisive}
            aptitude={model.aptitude}
            pace={model.pace}
            interestLeaders={model.interestLeaders}
            meta={model.meta}
            isEngineering={model.isEngineering}
            typeName={model.typeName}
            answeredCount={model.answeredCount}
            questionCount={model.questions.length}
            mistakes={model.mistakes}
            branchMeta={model.branchMeta}
            streamMeta={model.streamMeta}
            metaFor={model.metaFor}
            completedAt={printSlot.result?.completedAt}
          />
        );
      })()}
      {printSlot?.kind === 'humanities' && (() => {
        const model = buildHumanitiesReportModel(printSlot.result, printSlot.test);
        return (
          <HumanitiesReportPrintDocument
            open
            onClose={() => setPrintSlot(null)}
            onPrint={handlePrint}
            result={printSlot.result}
            model={model}
            completedAt={printSlot.result?.completedAt}
          />
        );
      })()}
      {printSlot?.kind === 'ideal' && (() => {
        const model = buildIdealCareerModel(printSlot.result, printSlot.test);
        return (
          <IdealCareerReportPrintDocument
            open
            onClose={() => setPrintSlot(null)}
            onPrint={handlePrint}
            result={printSlot.result}
            model={model}
            completedAt={printSlot.result?.completedAt}
          />
        );
      })()}
      {printSlot?.kind === 'commerce' && (() => {
        const r = printSlot.result;
        const breakdown = Object.entries(r.resultData || {}).sort((a, b) => b[1] - a[1]);
        const maxScore = 12;
        const high = breakdown.filter(([, score]) => score >= 8);
        const medium = breakdown.filter(([, score]) => score >= 4 && score < 8);
        const low = breakdown.filter(([, score]) => score < 4);
        let fin = 0;
        let nonFin = 0;
        breakdown.forEach(([cat, score]) => {
          if (financialDomains.includes(cat)) fin += score; else nonFin += score;
        });
        return (
          <CommerceReportPrintDocument
            open
            onClose={() => setPrintSlot(null)}
            onPrint={handlePrint}
            result={r}
            breakdown={breakdown}
            maxScore={maxScore}
            high={high}
            medium={medium}
            low={low}
            preferredDomain={fin >= nonFin ? 'Financial' : 'Non-Financial'}
            finPoints={fin}
            nonFinPoints={nonFin}
          />
        );
      })()}
    </div>
  );
}
