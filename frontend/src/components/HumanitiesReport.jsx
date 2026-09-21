import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { Link } from 'react-router-dom';
import ResponsiveRadarChart from './ResponsiveRadarChart';
import HumanitiesReportPrintDocument from './HumanitiesReportPrintDocument';
import { WHATSAPP_NUMBER } from '../constants/urls';
import { buildHumanitiesReportModel } from '../lib/humanitiesReportModel';

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

export default function HumanitiesReport({ result, test, prefersReducedMotion }) {
  /* All analytics live in lib/humanitiesReportModel.js so My Results can
     build the identical PDF for a past attempt without mounting this component. */
  const m = useMemo(() => buildHumanitiesReportModel(result, test), [result, test]);
  const {
    questions, tracks, ranked, hasTrackData, radarTracks,
    topTrack, runnerUp, marginPts, marginPct, decisive,
    alignment, fitBand, knowledgeQuiz, aptitude, pace,
    answeredCount, totalQuestions, mistakes,
  } = m;

  /* Shareable plain-text summary — for the parent/counsellor chat. */
  const [copied, setCopied] = useState(false);
  const copySummary = async () => {
    const lines = [
      `Paavan Setu — ${result?.testName || 'Assessment'} result`,
      `Recommended career track: ${topTrack?.name ?? '—'} (fit ${topTrack?.prefPct ?? 0}%, knowledge ${topTrack?.knowledgePct ?? 0}%)`,
      runnerUp ? `Runner-up: ${runnerUp.name} (margin: ${marginPts} pts)` : '',
      knowledgeQuiz.pct != null ? `Career-knowledge quiz: ${knowledgeQuiz.right}/${knowledgeQuiz.total} (${knowledgeQuiz.pct}%)` : '',
      pace.avgAll != null ? `Pace: ${pace.avgAll}s per question` : '',
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
    { id: 'rpt-profile', label: 'Career fit' },
    alignment.prefTop ? { id: 'rpt-reading', label: 'Reading your result' } : null,
    { id: 'rpt-lenses', label: 'Four lenses' },
    knowledgeQuiz.total > 0 ? { id: 'rpt-knowledge', label: 'Knowledge quiz' } : null,
    pace.avgRight != null && pace.avgWrong != null ? { id: 'rpt-pace', label: 'Pace' } : null,
    topTrack?.meta ? { id: 'rpt-next', label: 'Next steps' } : null,
    mistakes.length > 0 ? { id: 'rpt-mistakes', label: 'Review' } : null,
    { id: 'rpt-cta', label: 'Counselling' },
  ].filter(Boolean);

  return (
    <motion.div className="w-full pb-4" variants={containerVariants}
      initial={prefersReducedMotion ? 'visible' : 'hidden'} animate="visible">

      {/* ── Verdict ── */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <span className="inline-block rounded-full border border-[#d9ae3c]/45 bg-[#e9c85c]/20 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#8a6a1f]">
          Recommended career track
        </span>
        <h1 className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-tight text-zinc-900 md:text-6xl" style={{ textWrap: 'balance' }}>
          {topTrack?.name ?? 'Result unavailable'}
        </h1>
        {topTrack?.meta && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600">{topTrack.meta.fit}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {hasTrackData && topTrack && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              Fit {topTrack.prefPct}% · knows it {topTrack.knowledgePct}% · {topTrack.total} pts overall
            </span>
          )}
          {knowledgeQuiz.pct != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              Quiz: {knowledgeQuiz.right}/{knowledgeQuiz.total} correct ({knowledgeQuiz.pct}%)
            </span>
          )}
          {result?.timeTaken > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              Completed in {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s · {answeredCount}/{totalQuestions || answeredCount} answered
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
        {fitBand && hasTrackData && (
          <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-zinc-200 bg-white/70 px-5 py-3 text-sm leading-relaxed text-zinc-600">
            <strong className="text-zinc-800">{fitBand.headline}.</strong>{' '}{fitBand.body}
          </p>
        )}
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

      {/* ── Reading the result ── */}
      {(alignment.prefTop || runnerUp) && hasTrackData && (
        <motion.div variants={itemVariants} id="rpt-reading" className="mx-auto mb-12 w-full max-w-5xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Reading your result</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">What your answers say when all four lenses are read together.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {runnerUp && marginPts != null && (
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Decision clarity</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {decisive ? (
                    <><strong className="text-zinc-800">{topTrack.name}</strong> leads <strong className="text-zinc-800">{runnerUp.name}</strong> by {marginPts} pts — a clear verdict. Commit with confidence.</>
                  ) : (
                    <>Only {marginPts} pts separate <strong className="text-zinc-800">{topTrack.name}</strong> from <strong className="text-zinc-800">{runnerUp.name}</strong>. Treat both as viable — a project, shadowing day or counselling session can break the tie.</>
                  )}
                </p>
              </div>
            )}
            {alignment.prefTop && (
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Interest vs knowledge</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {alignment.agree ? (
                    <>The career you gravitated towards (<strong className="text-zinc-800">{alignment.prefTop}</strong>) is also the one you knew best on the quiz — interest and awareness point the same way.</>
                  ) : alignment.prefKnowAgree ? (
                    <>Your interest and your career knowledge agree on <strong className="text-zinc-800">{alignment.prefTop}</strong>, while your composite score leans <strong className="text-zinc-800">{topTrack.name}</strong>. Both deserve a look.</>
                  ) : (
                    <>You gravitated towards <strong className="text-zinc-800">{alignment.prefTop}</strong> but scored highest on knowledge of <strong className="text-zinc-800">{alignment.knowTop}</strong>. Curiosity outranks familiarity — or familiarity is waiting to become interest.</>
                  )}
                </p>
              </div>
            )}
            {knowledgeQuiz.pct != null && (
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Career awareness</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {knowledgeQuiz.pct >= 60
                    ? <>You already know this career landscape well — {knowledgeQuiz.pct}% on the 19-question quiz. Research will come easily.</>
                    : knowledgeQuiz.pct >= 35
                      ? <>A fair grasp of the careers ({knowledgeQuiz.pct}%) — the review list below is your fastest next win.</>
                      : <>The quiz says the career landscape itself is the gap ({knowledgeQuiz.pct}%). Start with the review list — knowing the territory changes every other decision.</>}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Career-fit profile ── */}
      <motion.div variants={itemVariants} id="rpt-profile" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Your career-fit profile</h3>
        <p className="mx-auto mb-6 max-w-lg text-center text-sm text-zinc-500">
          All 19 career tracks, ranked. Each bar pairs how strongly the career pulled you (out of 9 preference points) with whether you already knew it from the quiz.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ranked.map((t, i) => (
            <div
              key={t.name}
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
                  {t.name}
                </p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-500">
                  {t.total} pts
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-[0.62rem] font-bold uppercase tracking-wider text-zinc-400">Pull</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200/80">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.max(2, t.prefPct)}%`, background: i === 0 ? 'linear-gradient(90deg, #d9ae3c, #e9c85c)' : '#34d399' }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[0.68rem] font-semibold tabular-nums text-zinc-500">{t.prefPct}%</span>
                </div>
                {knowledgeQuiz.total > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-[0.62rem] font-bold uppercase tracking-wider text-zinc-400">Know</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200/80">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: t.knowledge ? '100%' : '6%', background: t.knowledge ? '#10b981' : '#f87171' }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[0.68rem] font-semibold tabular-nums text-zinc-500">{t.knowledge ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Radar (top 8 — 19 axes is unreadable) ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-3xl">
        <header className="mb-6 text-center">
          <h3 className="mb-2 text-lg font-semibold uppercase tracking-[0.15em] text-zinc-700">Career Affinity Map</h3>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
            Your eight strongest tracks, drawn from all four lenses of the assessment.
          </p>
        </header>
        {hasTrackData ? (
          <MagneticCard className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-[2rem] border border-zinc-200 bg-white/70 p-8">
            <ResponsiveRadarChart categories={radarTracks} maxScore={Math.max(6, radarTracks[0]?.[1] || 6)} />
          </MagneticCard>
        ) : (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-zinc-200 bg-white/70 p-8 text-center text-sm text-zinc-500">
            No per-question data was stored for this attempt, so the affinity map cannot be drawn.
          </div>
        )}
      </motion.div>

      {/* ── The four lenses, read against the winner ── */}
      <motion.div variants={itemVariants} id="rpt-lenses" className="mx-auto mb-12 w-full max-w-5xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">The four lenses</h3>
        <p className="mx-auto mb-6 max-w-lg text-center text-sm text-zinc-500">
          Every career was probed four ways — what you did, what felt comfortable, what you knew, and who you are.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Activity pull', key: 'activityPts', blurb: 'Which career’s day-to-day tasks sounded like you.', unit: 'pts' },
            { label: 'Work comfort', key: 'comfortPts', blurb: 'Where the working style itself felt natural.', unit: 'pts' },
            { label: 'Career knowledge', key: 'knowledge', blurb: 'Whether you already knew this career when the quiz asked.', unit: 'correct' },
            { label: 'Personality fit', key: 'personalityPts', blurb: 'What your school-life choices said about you.', unit: 'pts' },
          ].map((lens) => {
            const sorted = [...tracks].sort((a, b) => (b[lens.key] - a[lens.key]) || a.name.localeCompare(b.name));
            const top = sorted[0];
            const topMax = top ? top[lens.key] : 0;
            const topThree = sorted.slice(0, 3);
            return (
              <div key={lens.key} className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">{lens.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{lens.blurb}</p>
                {top && topMax > 0 ? (
                  <>
                    <p className="mt-3 text-sm text-zinc-600">
                      Led by <strong className="text-zinc-800">{top.name}</strong>
                      {lens.key === 'knowledge'
                        ? <> · knew it {top.knowledge === 1 ? '' : 'partly — '}{top.knowledge === 1 ? 'yes' : `quiz ${top.knowledgePct}%`}</>
                        : <> · {top[lens.key]} of 3 {lens.unit}</>}
                    </p>
                    <div className="mt-2.5 space-y-1.5">
                      {topThree.map((t) => (
                        <div key={t.name} className="flex items-center gap-2">
                          <span className="w-36 shrink-0 truncate text-xs text-zinc-500" title={t.name}>{t.name}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200/80">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${topMax > 0 ? Math.max(3, Math.round((t[lens.key] / topMax) * 100)) : 0}%`, background: t === top ? 'linear-gradient(90deg, #d9ae3c, #e9c85c)' : '#a7f3d0' }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-right text-[0.68rem] font-semibold tabular-nums text-zinc-500">
                            {lens.key === 'knowledge' ? (t.knowledge ? 'Yes' : 'No') : `${t[lens.key]}/3`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-zinc-400">No data recorded for this lens.</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Career knowledge quiz ── */}
      {knowledgeQuiz.total > 0 && (
        <motion.div variants={itemVariants} id="rpt-knowledge" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Career-knowledge quiz</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">
            19 graded questions tested how well you already know these careers.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Correct', value: `${knowledgeQuiz.right}/${knowledgeQuiz.total}` },
              { label: 'Accuracy', value: `${knowledgeQuiz.pct}%` },
              { label: 'Best-known career', value: (() => { const b = [...knowledgeQuiz.byTrack].sort((a, z) => z.right - a.right)[0]; return b?.right ? b.name.split(' ')[0] : '—'; })() },
              { label: 'Overall pace', value: pace.avgAll != null ? `${pace.avgAll}s/q` : '—' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white/70 px-4 py-4 text-center">
                <p className="text-xl font-bold tabular-nums text-zinc-900">{s.value}</p>
                <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Pace analysis ── */}
      {pace.avgRight != null && pace.avgWrong != null && (
        <motion.div variants={itemVariants} id="rpt-pace" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">How you paced yourself</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500" style={{ textWrap: 'balance' }}>
            {pace.avgWrong > pace.avgRight
              ? 'You spent longer on questions you missed — the hard ones held your attention. Reviewing those is time well spent.'
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
      {topTrack?.meta && (
        <motion.div variants={itemVariants} className="mx-auto mb-12 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          <MagneticCard className="rounded-3xl border border-zinc-200 bg-white/70 p-6">
            <h4 className="mb-2 text-[1.1rem] font-bold text-[#8a6a1f]">Careers in {topTrack.name}</h4>
            <p className="text-sm leading-relaxed text-zinc-600">{topTrack.meta.careers}</p>
          </MagneticCard>
          <MagneticCard className="rounded-3xl border border-zinc-200 bg-white/70 p-6">
            <h4 className="mb-2 text-[1.1rem] font-bold text-[#8a6a1f]">Subjects &amp; pathway</h4>
            <p className="text-sm leading-relaxed text-zinc-600">{topTrack.meta.subjects}</p>
          </MagneticCard>
        </motion.div>
      )}

      {/* ── Next steps ── */}
      {topTrack?.meta && (
        <motion.div variants={itemVariants} id="rpt-next" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Your next steps</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">Four moves to turn this result into a plan.</p>
          <ol className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70">
            {[
              { n: 1, title: `Test-drive ${topTrack.name}`, body: 'Pick one small, real project in this career — write an article, style a friend, plan a trip, tutor a junior. Interest survives contact with reality or it does not.' },
              knowledgeQuiz.total > 0 && mistakes.length > 0
                ? { n: 2, title: 'Close the knowledge gaps', body: `You missed ${mistakes.length} of ${knowledgeQuiz.total} career-knowledge questions. The review list below names each one — ten minutes there sharpens every other choice.` }
                : { n: 2, title: 'Deepen your research', body: 'Read one honest “day in the life” for your top three tracks this week. Knowing the territory changes every decision that follows.' },
              runnerUp
                ? { n: 3, title: `Weigh ${runnerUp.name} alongside`, body: `It finished ${marginPts} pts behind. If a subject or opportunity for it comes easier, that is a signal worth respecting.` }
                : { n: 3, title: 'Map subjects to the track', body: topTrack.meta.subjects },
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

      {/* ── All tracks reference ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-5xl">
        <h3 className="mb-6 text-center text-lg font-semibold uppercase tracking-[0.15em] text-zinc-700">
          Career Track Reference
        </h3>
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70">
          <table className="w-full border-collapse text-left text-sm text-zinc-600">
            <thead className="border-b border-zinc-200 bg-zinc-50/80">
              <tr>
                <th className="w-1/3 px-6 py-4 font-semibold text-zinc-800">Track</th>
                <th className="px-6 py-4 font-semibold text-zinc-800">Typical careers</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t) => (
                <tr key={t.name} className={t === topTrack ? 'bg-[#e9c85c]/[0.14]' : undefined}>
                  <td className="px-6 py-4 font-medium leading-relaxed text-zinc-700">{t.name}{t === topTrack && ' ★'}</td>
                  <td className="px-6 py-4 leading-relaxed text-zinc-500">{t.meta?.careers || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Missed quiz questions ── */}
      {mistakes.length > 0 && (
        <motion.div variants={itemVariants} id="rpt-mistakes" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-6 font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">
            Review your missed questions <span className="text-base text-zinc-400">({mistakes.length})</span>
          </h3>
          <div className="divide-y divide-zinc-200/70 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70">
            {mistakes.map((m) => (
              <div key={m.i} className="px-5 py-4 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <p className="mb-1 text-sm font-medium text-zinc-700">Q{m.i + 1}. {m.question}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.time != null && (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[0.68rem] font-semibold tabular-nums text-zinc-500">
                        {m.time}s
                      </span>
                    )}
                    {m.flagged && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-amber-700">
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-red-600">Your answer: {String(m.picked)}</p>
                {m.correctText && (
                  <p className="mt-0.5 text-sm font-semibold text-emerald-700">Correct answer: {m.correctText}</p>
                )}
                {m.explanation && (
                  <p className="mt-2 border-l-2 border-[#d9ae3c]/60 pl-3 text-xs leading-relaxed text-zinc-500">{m.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {mistakes.length === 0 && knowledgeQuiz.total > 0 && (
        <motion.p variants={itemVariants} id="rpt-mistakes" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center text-sm font-semibold text-emerald-700">
          Flawless career-knowledge quiz — {knowledgeQuiz.right}/{knowledgeQuiz.total} correct.
        </motion.p>
      )}

      {/* ── Counsellor CTA ── */}
      <motion.div variants={itemVariants} id="rpt-cta" className="relative mx-auto w-full max-w-3xl scroll-mt-28 overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 bg-white/70 px-7 py-10 text-center backdrop-blur-xl md:px-12">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_INK }}>Make it count</p>
        <h3 className="mx-auto mt-3 max-w-xl font-['DM_Serif_Display',Georgia,serif] text-3xl leading-tight text-zinc-900 md:text-4xl" style={{ textWrap: 'balance' }}>
          Talk to a counsellor about <em className="italic" style={{ color: GOLD_INK }}>your career track</em>
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
          Your top track is <strong className="text-zinc-800">{topTrack?.name ?? '—'}</strong>
          {runnerUp ? <> followed by <strong className="text-zinc-800">{runnerUp.name}</strong></> : null}.
          A one-on-one session turns this report into subject choices and a study roadmap.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just completed the ${result?.testName || 'Humanities Career Test'} on your website and would like to discuss my results with a counsellor.`)}`}
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
      <HumanitiesReportPrintDocument
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onPrint={handlePrint}
        result={result}
        model={m}
        completedAt={result?.completedAt}
      />
    </motion.div>
  );
}
