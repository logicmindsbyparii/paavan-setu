import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { Link } from 'react-router-dom';
import ResponsiveRadarChart from './ResponsiveRadarChart';
import ReportPrintDocument from './ReportPrintDocument';
import { WHATSAPP_NUMBER } from '../constants/urls';
import { buildReportModel } from '../lib/reportModel';
import { branchMeta, streamMeta } from '../constants/reportMeta';

const GOLD = '#e9c85c';
const GOLD_INK = '#8a6a1f';

const EASE_KOWALSKI = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, ease: EASE_KOWALSKI } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_KOWALSKI } },
};

function MagneticCard({ children, className = '', style = {} }) {
  return (
    <div
      className={`transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.015] hover:shadow-lg active:scale-[0.99] ${className}`}
      style={{ isolation: 'isolate', ...style }}
    >
      {children}
    </div>
  );
}

export default function StreamSelectorReport({ result, test, prefersReducedMotion }) {
  /* All analytics live in lib/reportModel.js so My Results can build the
     identical PDF for a past attempt without mounting this component. */
  const m = useMemo(() => buildReportModel(result, test), [result, test]);
  const {
    questions, isEngineering, typeName, metaFor,
    breakdown, maxScore, total, topStream, topPts, confidence,
    aptitude, interestLeaders, pace, runnerUp, marginPts, marginPct, decisive,
    interestTop, bestSection, worstSection, mistakes, meta, answeredCount,
  } = m;

  /* Shareable plain-text summary — for the parent/counsellor chat. */
  const [copied, setCopied] = useState(false);
  const copySummary = async () => {
    const lines = [
      `Paavan Setu — ${result?.testName || 'Assessment'} result`,
      `Recommended ${typeName}: ${topStream} (${topPts} pts, ${confidence}% of total)`,
      runnerUp ? `Runner-up: ${runnerUp[0]} (margin: ${marginPts} pts)` : '',
      aptitude.pct != null ? `Aptitude: ${aptitude.right}/${aptitude.total} correct (${aptitude.pct}%)` : '',
      pace.avgAll != null ? `Pace: ${pace.avgAll}s per question` : '',
      `Scores: ${breakdown.map(([c, s]) => `${c} ${s}`).join(' · ')}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable (permissions/insecure context) — silently ignore */ }
  };

  /* Print/PDF: the print document derives everything from the same memoized
     values this screen computed, so the sheet always matches what's on screen. */
  const [printOpen, setPrintOpen] = useState(false);
  const handlePrint = () => {
    // Give React a tick to finish painting the sheet before the dialog opens.
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
    });
  };

  /* In-report quick nav — the report is long; let people jump. */
  const navItems = [
    { id: 'rpt-scores', label: 'Scores' },
    (runnerUp || interestTop || bestSection) ? { id: 'rpt-reading', label: 'Reading your result' } : null,
    { id: 'rpt-sections', label: 'Sections' },
    (pace.avgRight != null && pace.avgWrong != null) ? { id: 'rpt-pace', label: 'Pace' } : null,
    meta ? { id: 'rpt-next', label: 'Next steps' } : null,
    (mistakes.length > 0 || (mistakes.length === 0 && aptitude.total > 0)) ? { id: 'rpt-mistakes', label: 'Review' } : null,
    { id: 'rpt-cta', label: 'Counselling' },
  ].filter(Boolean);

  return (
    <motion.div className="w-full pb-4" variants={containerVariants}
      initial={prefersReducedMotion ? 'visible' : 'hidden'} animate="visible">
      {/* ── Verdict ── */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <span className="inline-block rounded-full border border-[#d9ae3c]/45 bg-[#e9c85c]/20 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#8a6a1f]">
          Recommended {typeName}
        </span>
        <h1 className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-tight text-zinc-900 md:text-6xl" style={{ textWrap: 'balance' }}>
          {topStream}
        </h1>
        {meta && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600">{meta.fit}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
            {topPts} pts · {confidence}% of your total score
          </span>
          {aptitude.pct != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              Aptitude: {aptitude.right}/{aptitude.total} correct ({aptitude.pct}%)
            </span>
          )}
          {result?.timeTaken > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              Completed in {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s · {answeredCount}/{questions.length || answeredCount} answered
            </span>
          )}
          {pace.avgAll != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tabular-nums text-zinc-600">
              Paced at {pace.avgAll}s per question
            </span>
          )}
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600 transition-[transform,color,border-color] duration-150 ease-out hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]"
          >
            {copied ? 'Copied to clipboard' : 'Copy summary'}
          </button>
          <button
            type="button"
            onClick={() => setPrintOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600 transition-[transform,color,border-color] duration-150 ease-out hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]"
          >
            Save as PDF
          </button>
        </div>
        {navItems.length > 1 && (
          <nav aria-label="Report sections" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {navItems.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(n.id)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' }); }}
                className="rounded-full border border-zinc-200 bg-white/50 px-3.5 py-1.5 text-xs font-semibold text-zinc-500 no-underline transition-colors duration-150 hover:border-zinc-300 hover:text-zinc-800"
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </motion.div>

      {/* ── Reading the result ──
          Cross-section insights: margin between the top two, interest-vs-
          performance alignment, strongest and weakest graded sections. */}
      {(runnerUp || interestTop || bestSection) && (
        <motion.div variants={itemVariants} id="rpt-reading" className="mx-auto mb-12 w-full max-w-5xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Reading your result</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">What your answers say when all the sections are read together.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {runnerUp && marginPct != null && (
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Decision clarity</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {decisive ? (
                    <><strong className="text-zinc-800">{topStream}</strong> leads <strong className="text-zinc-800">{runnerUp[0]}</strong> by {marginPts} pts ({marginPct}% of all points) — a clear verdict. Commit with confidence.</>
                  ) : (
                    <>Only {marginPts} pts separate <strong className="text-zinc-800">{topStream}</strong> from <strong className="text-zinc-800">{runnerUp[0]}</strong>. Treat both as viable — subjects, colleges and counselling can break the tie.</>
                  )}
                </p>
              </div>
            )}
            {interestTop && (
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Interests vs performance</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {interestTop.leader === topStream ? (
                    <>Your interest sections leaned <strong className="text-zinc-800">{interestTop.leader}</strong> ({interestTop.pct}% of interest points) — the same branch your overall score favours. Interests and performance agree.</>
                  ) : (
                    <>Your interests leaned <strong className="text-zinc-800">{interestTop.leader}</strong>, while your overall score favours <strong className="text-zinc-800">{topStream}</strong>. Either could fit — worth discussing both.</>
                  )}
                </p>
              </div>
            )}
            {(bestSection || worstSection) && (
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Aptitude profile</p>
                <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-zinc-600">
                  {bestSection && <p>Strongest: <strong className="text-emerald-700">{bestSection.title}</strong> · {bestSection.pct}% correct</p>}
                  {worstSection && worstSection.title !== bestSection?.title && (
                    <p>Focus area: <strong className="text-red-600">{worstSection.title}</strong> · {worstSection.pct}% correct</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Scores ── */}
      <motion.div variants={itemVariants} id="rpt-scores" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Your {typeName} scores</h3>
        <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">
          Ranked by how strongly your answers pointed at each {typeName}. The share shows your score as a slice of all points earned.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {breakdown.map(([cat, score], i) => {
            const share = total > 0 ? Math.round((score / total) * 100) : 0;
            const m = metaFor(cat);
            return (
              <div
                key={cat}
                className={`rounded-2xl border px-5 py-4 ${
                  i === 0
                    ? 'border-[#d9ae3c]/40 bg-gradient-to-br from-[#e9c85c]/[0.18] to-[#e9c85c]/[0.06]'
                    : 'border-zinc-200 bg-white/70'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`font-semibold leading-snug ${i === 0 ? 'text-[#6b511a]' : 'text-zinc-800'}`}>
                    <span className="mr-2 inline-block tabular-nums" style={{ fontSize: '0.72em', color: i === 0 ? GOLD_INK : '#a1a1aa' }}>
                      #{i + 1}
                    </span>
                    {cat}
                  </p>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-500">
                    {score} pts · {share}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((score / maxScore) * 100)}%`, background: i === 0 ? 'linear-gradient(90deg, #d9ae3c, #e9c85c)' : '#34d399' }} />
                </div>
                {m && <p className="mt-2.5 text-xs leading-relaxed text-zinc-500">{m.fit}</p>}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Radar ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-3xl">
        <header className="mb-6 text-center">
          <h3 className="mb-2 text-lg font-semibold uppercase tracking-[0.15em] text-zinc-700">Aptitude Matrix</h3>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
            {isEngineering
              ? 'Your affinity across the five engineering branches.'
              : 'Your inclinations across the 4 streams after Class 10.'}
          </p>
        </header>
        <MagneticCard className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-[2rem] border border-zinc-200 bg-white/70 p-8">
          <ResponsiveRadarChart categories={breakdown} maxScore={maxScore} />
        </MagneticCard>
      </motion.div>

      {/* ── Section-wise detail ── */}
      <motion.div variants={itemVariants} id="rpt-sections" className="mx-auto mb-12 w-full max-w-5xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Section-wise breakdown</h3>
        <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">
          Aptitude sections are graded right or wrong. Interest sections have no wrong answers — they show where your preferences leaned.
        </p>
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70">
          <table className="w-full border-collapse text-left text-sm text-zinc-600">
            <thead className="border-b border-zinc-200 bg-zinc-50/80">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-800">Section</th>
                <th className="px-6 py-4 font-semibold text-zinc-800">What it measures</th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-800">Your result</th>
              </tr>
            </thead>
            <tbody>
              {interestLeaders.map((s) => {
                const topPct = s.totalPts > 0 ? Math.round((s.leaderPts / s.totalPts) * 100) : 0;
                const avg = pace.perSection.find((p) => p.title === s.title)?.avg;
                return (
                  <tr key={s.title} className="border-b border-zinc-100">
                    <td className="px-6 py-4 font-medium text-zinc-700">{s.title}</td>
                    <td className="px-6 py-4 text-zinc-500">Interests &amp; work preferences (no right answers)</td>
                    <td className="px-6 py-4 text-right text-zinc-600">
                      <span className="whitespace-nowrap">Lean: <strong className="text-[#8a6a1f]">{s.leader}</strong> · {topPct}%</span>
                      {s.ranked?.length > 1 && (
                        <span className="mt-1 block text-xs tabular-nums text-zinc-400">then {s.ranked.slice(1).map(([c]) => c).join(', ')}</span>
                      )}
                      {avg != null && (
                        <span className="mt-1 block text-xs tabular-nums text-zinc-400">{avg}s average per question</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {aptitude.perSection.filter((s) => s.graded).map((s) => {
                const avg = pace.perSection.find((p) => p.title === s.title)?.avg;
                return (
                <tr key={s.title} className="border-b border-zinc-100">
                  <td className="px-6 py-4 font-medium text-zinc-700">{s.title}</td>
                  <td className="px-6 py-4 text-zinc-500">Aptitude (graded right / wrong)</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-zinc-200/80 sm:block">
                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${s.pct ?? 0}%`, background: (s.pct ?? 0) >= 60 ? '#34d399' : (s.pct ?? 0) >= 40 ? '#e9c85c' : '#f87171' }} />
                      </div>
                      <span className="whitespace-nowrap tabular-nums text-zinc-600">
                        <strong className="text-[#8a6a1f]">{s.right}/{s.total}</strong> · {s.pct}%
                      </span>
                    </div>
                    {avg != null && (
                      <span className="mt-1 block text-xs tabular-nums text-zinc-400">{avg}s average per question</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Pace analysis ──
          Only rendered when timing data exists. Comparing average time on
          correct vs wrong answers separates rushing from genuine difficulty. */}
      {pace.avgRight != null && pace.avgWrong != null && (
        <motion.div variants={itemVariants} id="rpt-pace" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">How you paced yourself</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500" style={{ textWrap: 'balance' }}>
            {pace.avgWrong > pace.avgRight
              ? 'You spent longer on questions you missed — the hard ones held your attention. Reviewing those topics is time well spent.'
              : 'You answered quickly overall, and the misses came fast. A short pause to re-read before marking could lift your accuracy.'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Avg / question', value: `${pace.avgAll}s` },
              { label: 'On correct', value: `${pace.avgRight}s` },
              { label: 'On incorrect', value: `${pace.avgWrong}s` },
              { label: 'Total time', value: `${Math.floor(pace.totalTime / 60)}m ${pace.totalTime % 60}s` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white/70 px-4 py-4 text-center">
                <p className="text-xl font-bold tabular-nums text-zinc-900">{s.value}</p>
                <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Careers + subjects for the winner ── */}
      {meta && (
        <motion.div variants={itemVariants} className="mx-auto mb-12 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          <MagneticCard className="rounded-3xl border border-zinc-200 bg-white/70 p-6">
            <h4 className="mb-2 text-[1.1rem] font-bold text-[#8a6a1f]">Careers in {topStream}</h4>
            <p className="text-sm leading-relaxed text-zinc-600">{meta.careers}</p>
          </MagneticCard>
          <MagneticCard className="rounded-3xl border border-zinc-200 bg-white/70 p-6">
            <h4 className="mb-2 text-[1.1rem] font-bold text-[#8a6a1f]">
              {isEngineering ? 'Core subjects you will study' : 'Subjects to pick (Class 11–12)'}
            </h4>
            <p className="text-sm leading-relaxed text-zinc-600">{meta.subjects}</p>
          </MagneticCard>
        </motion.div>
      )}

      {/* ── Next steps ──
          A report without a plan is trivia. Four concrete moves, personalised
          by the winner and the weakest aptitude section. */}
      {meta && (
        <motion.div variants={itemVariants} id="rpt-next" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Your next steps</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">Four moves to turn this result into a plan.</p>
          <ol className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70">
            {[
              { n: 1, title: 'Confirm your subjects', body: meta.subjects },
              worstSection && bestSection && worstSection.title !== bestSection.title
                ? { n: 2, title: `Strengthen ${worstSection.title}`, body: `You scored ${worstSection.pct}% here — the lowest of your aptitude sections. Focused practice now pays off in every entrance exam.` }
                : { n: 2, title: 'Keep your streak', body: bestSection ? `You scored ${bestSection.pct}% in ${bestSection.title} — your strongest section. Keep solving to stay sharp.` : 'Keep practising aptitude regularly.' },
              { n: 3, title: 'Explore the careers', body: meta.careers },
              { n: 4, title: 'Talk it through', body: 'A counsellor can pressure-test this recommendation against your marks, budget and the colleges you can realistically reach.' },
            ].map((step) => (
              <li key={step.n} className="flex items-start gap-4 border-b border-zinc-100 px-6 py-4 last:border-b-0">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0a5c2c]/10 text-xs font-bold text-[#0a5c2c]">{step.n}</span>
                <div>
                  <p className="text-sm font-bold text-zinc-800">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* ── All options reference ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-5xl">
        <h3 className="mb-6 text-center text-lg font-semibold uppercase tracking-[0.15em] text-zinc-700">
          {isEngineering ? 'Branch Reference' : 'Stream Typology'}
        </h3>
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70">
          <table className="w-full border-collapse text-left text-sm text-zinc-600">
            <thead className="border-b border-zinc-200 bg-zinc-50/80">
              <tr>
                <th className="w-1/3 px-6 py-4 font-semibold text-zinc-800">{isEngineering ? 'Branch' : 'Stream'}</th>
                <th className="px-6 py-4 font-semibold text-zinc-800">Typical Careers</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(isEngineering ? branchMeta : streamMeta).map(([cluster, m]) => (
                <tr key={cluster} className={cluster === topStream ? 'bg-[#e9c85c]/[0.14]' : undefined}>
                  <td className="px-6 py-4 font-medium leading-relaxed text-zinc-700">{cluster}{cluster === topStream && ' ★'}</td>
                  <td className="px-6 py-4 leading-relaxed text-zinc-500">{m.careers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Mistakes with explanations ── */}
      {mistakes.length > 0 && (
        <motion.div variants={itemVariants} id="rpt-mistakes" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">
            Review Your Mistakes <span className="text-base text-zinc-400">({mistakes.length})</span>
          </h3>
          <div className="divide-y divide-zinc-200/70 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70">
            {mistakes.map((m) => (
              <div key={m.i} className="px-5 py-4 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <p className="mb-1 text-sm font-medium text-zinc-700">Q{m.i + 1}. {m.question}</p>
                  {m.time != null && (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[0.68rem] font-semibold tabular-nums text-zinc-500">
                      {m.time}s
                    </span>
                  )}
                  {m.flagged && (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-amber-700">
                      Flagged
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-red-600">Your answer: {String(m.picked)}</p>
                {m.explanation && (
                  <p className="mt-2 border-l-2 border-[#d9ae3c]/60 pl-3 text-xs leading-relaxed text-zinc-500">{m.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {mistakes.length === 0 && aptitude.total > 0 && (
        <motion.p variants={itemVariants} id="rpt-mistakes" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center text-sm font-semibold text-emerald-700">
          Flawless aptitude sections — {aptitude.right}/{aptitude.total} correct.
        </motion.p>
      )}

      {/* ── Counsellor CTA ── */}
      <motion.div variants={itemVariants} id="rpt-cta" className="relative mx-auto w-full max-w-3xl scroll-mt-28 overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 bg-white/70 px-7 py-10 text-center backdrop-blur-xl md:px-12">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_INK }}>Make it count</p>
        <h3 className="mx-auto mt-3 max-w-xl font-['DM_Serif_Display',Georgia,serif] text-3xl leading-tight text-zinc-900 md:text-4xl" style={{ textWrap: 'balance' }}>
          Talk to a counsellor about <em className="italic" style={{ color: GOLD_INK }}>your {typeName}</em>
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
          Your top {typeName} is <strong className="text-zinc-800">{topStream}</strong>
          {breakdown[1] ? <> followed by <strong className="text-zinc-800">{breakdown[1][0]}</strong></> : null}.
          A one-on-one session turns this report into subject choices and a study roadmap.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just completed the ${result?.testName || typeName + ' selector'} on your website and would like to discuss my results with a counsellor.`)}`}
            target="_blank" rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[#e9c85c] px-8 py-4 text-sm font-bold text-[#051a0d] no-underline transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] sm:w-auto">
            <WhatsAppIcon fontSize="small" aria-hidden="true" /> Discuss on WhatsApp
          </a>
          <Link to="/career-counselling"
            className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white/70 px-8 py-4 text-sm font-semibold text-zinc-700 no-underline transition-colors duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900">
            <PsychologyIcon fontSize="small" aria-hidden="true" /> See How Counselling Works
          </Link>
        </div>
      </motion.div>

      {/* Print/PDF document — portal-rendered above everything. */}
      <ReportPrintDocument
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onPrint={handlePrint}
        result={result}
        breakdown={breakdown}
        maxScore={maxScore}
        total={total}
        topStream={topStream}
        topPts={topPts}
        confidence={confidence}
        runnerUp={runnerUp}
        marginPts={marginPts}
        marginPct={marginPct}
        decisive={decisive}
        aptitude={aptitude}
        pace={pace}
        interestLeaders={interestLeaders}
        meta={meta}
        isEngineering={isEngineering}
        typeName={typeName}
        answeredCount={answeredCount}
        questionCount={questions.length}
        mistakes={mistakes}
        branchMeta={branchMeta}
        streamMeta={streamMeta}
        metaFor={metaFor}
        completedAt={result?.completedAt}
      />
    </motion.div>
  );
}
