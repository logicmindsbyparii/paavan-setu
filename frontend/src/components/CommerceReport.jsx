import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ResponsiveRadarChart from './ResponsiveRadarChart';
import CommerceReportPrintDocument from './CommerceReportPrintDocument';
import { careerClusters, financialDomains } from '../constants/reportMeta';
import { WHATSAPP_NUMBER } from '../constants/urls';

const GOLD_INK = '#8a6a1f';

const EASE_KOWALSKI = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      ease: EASE_KOWALSKI,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE_KOWALSKI },
  },
};

function MagneticCard({ children, className = "" }) {
  return (
    <div
      className={`transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.015] hover:shadow-lg active:scale-[0.99] ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {children}
    </div>
  );
}

export default function CommerceReport({ result, prefersReducedMotion }) {
  const stats = result?.questionStats || {};
  const answers = result?.answers || {};

  const breakdown = useMemo(
    () => Object.entries(result?.resultData || {}).sort((a, b) => b[1] - a[1]),
    [result],
  );
  const maxScore = 12;
  const total = breakdown.reduce((s, [, v]) => s + v, 0);
  const [topCluster, topScore] = breakdown[0] || ['—', 0];
  const topShare = total > 0 ? Math.round((topScore / total) * 100) : 0;

  /* Decision clarity: how far the top cluster sits ahead of the runner-up. */
  const runnerUp = breakdown[1] || null;
  const marginPts = runnerUp ? topScore - runnerUp[1] : null;
  const marginPct = runnerUp && total > 0 ? Math.round((marginPts / total) * 100) : null;
  const decisive = marginPct != null && marginPct >= 10;

  const high = breakdown.filter(([, score]) => score >= 8);
  const medium = breakdown.filter(([, score]) => score >= 4 && score < 8);
  const low = breakdown.filter(([, score]) => score < 4);

  /* Financial vs non-financial axis, with the split as a share of all points. */
  let finPoints = 0;
  let nonFinPoints = 0;
  breakdown.forEach(([cat, score]) => {
    if (financialDomains.includes(cat)) finPoints += score; else nonFinPoints += score;
  });
  const finTotal = finPoints + nonFinPoints;
  const finPct = finTotal > 0 ? Math.round((finPoints / finTotal) * 100) : 0;
  const preferredDomain = finPoints >= nonFinPoints ? 'Financial' : 'Non-Financial';

  /* Breadth: a specialist profile concentrates points in few clusters; a
     generalist spreads them. The primary-tier count is the honest proxy. */
  const breadth = high.length >= 4
    ? { label: 'Wide-ranging profile', body: `Your interests register strongly across ${high.length} clusters. Breadth like this suits interdisciplinary paths — and benefits from a counsellor helping you narrow the field.` }
    : high.length >= 2
      ? { label: 'Balanced profile', body: `Two or three clusters (${high.length}) register strongly. You have a clear lead with real alternatives worth keeping in view.` }
      : { label: 'Focused profile', body: 'Your points concentrate in a single leading cluster. A decisive signal — worth pressure-testing with a counsellor before you commit.' };

  /* ── Pace analysis ──
     Per-question wall-clock time is stored on every attempt. Attribution:
     each question's stored points split its time across the clusters it
     credited, so "where your time went" reflects the questions themselves. */
  const pace = useMemo(() => {
    let totalTime = 0;
    let timedQ = 0;
    const clusterTime = {};
    Object.entries(stats).forEach(([idx, st]) => {
      if (!st) return;
      const t = Number(st?.timeSpentSeconds) || 0;
      totalTime += t;
      timedQ++;
      const pts = answers[idx]?.points || answers[Number(idx)]?.points || {};
      const entries = Object.entries(pts);
      if (!entries.length) return;
      const sum = entries.reduce((s, [, v]) => s + (Number(v) || 0), 0) || entries.length;
      entries.forEach(([c, v]) => {
        clusterTime[c] = (clusterTime[c] || 0) + t * ((Number(v) || 1) / sum);
      });
    });
    const ranked = Object.entries(clusterTime)
      .map(([c, t]) => [c, Math.round(t)])
      .sort((a, b) => b[1] - a[1]);
    return {
      totalTime,
      timedQ,
      avgAll: timedQ ? Math.round(totalTime / timedQ) : null,
      topTime: ranked.slice(0, 3),
      timeLeader: ranked[0]?.[0] || null,
    };
  }, [stats, answers]);

  const answeredCount = Object.keys(answers).length
    || Object.keys(result?.answerDetails || {}).length
    || pace.timedQ;

  /* Shareable plain-text summary — for the parent/counsellor chat. */
  const [copied, setCopied] = useState(false);
  const copySummary = async () => {
    const lines = [
      `Paavan Setu — ${result?.testName || 'Commerce Career Selector'} result`,
      `Dominant axis: ${preferredDomain} (financial ${finPoints} vs non-financial ${nonFinPoints})`,
      `Top cluster: ${topCluster} (${topScore}/12, ${topShare}% of points)`,
      runnerUp ? `Runner-up: ${runnerUp[0]} (${runnerUp[1]}/12)` : '',
      `Primary fits: ${high.length ? high.map(([c]) => c).join(', ') : 'none at 8+ level'}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable (permissions/insecure context) — silently ignore */ }
  };

  /* Print/PDF: the sheet derives everything from the same computed values,
     so the PDF always matches what's on screen. */
  const [printOpen, setPrintOpen] = useState(false);
  const handlePrint = () => {
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
    });
  };

  /* In-report quick nav — the report is long; let people jump. */
  const navItems = [
    { id: 'cpt-scores', label: 'Scores' },
    { id: 'cpt-reading', label: 'Reading your result' },
    { id: 'cpt-tiers', label: 'Tiers' },
    pace.avgAll != null ? { id: 'cpt-pace', label: 'Pace' } : null,
    { id: 'cpt-typology', label: 'Careers' },
    { id: 'cpt-cta', label: 'Counselling' },
  ].filter(Boolean);

  return (
    <motion.div
      className="w-full pb-4"
      variants={containerVariants}
      initial={prefersReducedMotion ? 'visible' : 'hidden'}
      animate="visible"
    >
      {/* ── Intro ── */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <span className="inline-block rounded-full border border-[#d9ae3c]/45 bg-[#e9c85c]/20 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#8a6a1f]">
          Commerce career selector
        </span>
        <h1 className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-[1.1] text-zinc-900 md:text-5xl tracking-tight" style={{ textWrap: 'balance' }}>
          Commerce Career <span className="italic" style={{ color: GOLD_INK }}>Selector</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[1.05rem] text-zinc-600 leading-relaxed" style={{ textWrap: 'balance' }}>
          An analytical breakdown of your aptitudes across both financial and non-financial domains, scientifically customized to highlight your optimal career trajectories.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
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

      {/* ── Verdict ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-3xl text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-zinc-500">Your leading cluster</p>
        <h2 className="mt-3 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-tight text-zinc-900 md:text-5xl" style={{ textWrap: 'balance' }}>
          {topCluster}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          Roles that fit this cluster: <span className="text-zinc-800">{careerClusters[topCluster] || '—'}</span>
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tabular-nums text-zinc-600">
            {topScore}/12 · {topShare}% of your total score
          </span>
          {runnerUp && marginPct != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tabular-nums text-zinc-600">
              {decisive
                ? `Leads ${runnerUp[0]} by ${marginPts} pts`
                : `Only ${marginPts} pts over ${runnerUp[0]}`}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tabular-nums text-zinc-600">
            {preferredDomain} axis · {finPct}% financial
          </span>
          {answeredCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tabular-nums text-zinc-600">
              {answeredCount} questions answered
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Domain radar ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h3 className="mb-2 font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900">Aptitude matrix</h3>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
            Distribution of your natural inclinations across 18 specialized vectors.
          </p>
        </header>

        <MagneticCard className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-[2rem] border border-zinc-200 bg-white/70 p-8">
          <ResponsiveRadarChart categories={breakdown} maxScore={maxScore} />
        </MagneticCard>

        {/* Financial vs non-financial balance — one bar, two segments. */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Financial · {finPoints} pts</span>
            <span>Non-financial · {nonFinPoints} pts</span>
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-zinc-200/80">
            <div className="h-full transition-[width] duration-700" style={{ width: `${finPct}%`, background: 'linear-gradient(90deg, #d9ae3c, #e9c85c)' }} />
            <div className="h-full flex-1" style={{ background: '#34d399' }} />
          </div>
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white/70 px-5 py-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#b8892e' }} />
              <span className="text-sm font-semibold tracking-wide text-zinc-700">
                Dominant axis: {preferredDomain}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── All cluster scores ── */}
      <motion.div variants={itemVariants} id="cpt-scores" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">All cluster scores</h3>
        <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">
          Ranked by how strongly your answers pointed at each cluster, scored out of 12.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {breakdown.map(([cat, score], i) => (
            <div
              key={cat}
              className={`rounded-2xl border px-5 py-4 ${
                i === 0
                  ? 'border-[#d9ae3c]/40 bg-gradient-to-br from-[#e9c85c]/[0.18] to-[#e9c85c]/[0.06]'
                  : 'border-zinc-200 bg-white/70'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className={`truncate font-semibold leading-snug ${i === 0 ? 'text-[#6b511a]' : 'text-zinc-800'}`} title={cat}>
                  <span className="mr-2 inline-block tabular-nums" style={{ fontSize: '0.72em', color: i === 0 ? GOLD_INK : '#a1a1aa' }}>
                    #{i + 1}
                  </span>
                  {cat}
                </p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-500">{score}/12</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                <div className="h-full rounded-full" style={{ width: `${Math.round((score / maxScore) * 100)}%`, background: i === 0 ? 'linear-gradient(90deg, #d9ae3c, #e9c85c)' : '#34d399' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Reading your result ── */}
      <motion.div variants={itemVariants} id="cpt-reading" className="mx-auto mb-12 w-full max-w-5xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Reading your result</h3>
        <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">What your answers say when all the clusters are read together.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {runnerUp && marginPct != null && (
            <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Decision clarity</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {decisive ? (
                  <><strong className="text-zinc-800">{topCluster}</strong> leads <strong className="text-zinc-800">{runnerUp[0]}</strong> by {marginPts} pts ({marginPct}% of all points) — a clear verdict. Commit with confidence.</>
                ) : (
                  <>Only {marginPts} pts separate <strong className="text-zinc-800">{topCluster}</strong> from <strong className="text-zinc-800">{runnerUp[0]}</strong>. Both are viable — explore each before specialising.</>
                )}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Profile breadth</p>
            <p className="mt-2 text-sm font-semibold text-zinc-800">{breadth.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">{breadth.body}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Financial tilt</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              {finPct >= 60 ? (
                <><strong className="text-zinc-800">{finPct}%</strong> of your points sit in financial domains — accounting, banking, analytics and law suit this tilt.</>
              ) : finPct <= 40 ? (
                <><strong className="text-zinc-800">{100 - finPct}%</strong> of your points sit in creative, people and communication domains — the non-financial side of commerce is your home turf.</>
              ) : (
                <>Your points split nearly evenly (<strong className="text-zinc-800">{finPct}% financial</strong>). Hybrid paths — fintech, business analytics, brand management — bridge both.</>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Interest levels ── */}
      <motion.div variants={itemVariants} id="cpt-tiers" className="mx-auto mb-12 w-full max-w-5xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Interest stratification</h3>
        <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">
          Clusters grouped by how strongly they registered — primary fits lead the list.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Primary', desc: 'Strong natural fit', data: high, color: '#059669' },
            { title: 'Secondary', desc: 'Moderate alignment', data: medium, color: '#8a6a1f' },
            { title: 'Tertiary', desc: 'Low inclination', data: low, color: '#dc2626' },
          ].map((level) => (
            <MagneticCard key={level.title} className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white/70 p-6">
              <header className="mb-6 flex items-baseline justify-between border-b border-zinc-200 pb-4">
                <div>
                  <h4 className="text-[1.1rem] font-bold tracking-wide" style={{ color: level.color }}>
                    {level.title}
                  </h4>
                  <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{level.desc}</p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-500">
                  {level.data.length}
                </span>
              </header>
              <ul className="flex-1 space-y-3">
                {level.data.length > 0 ? level.data.map(([cat, score]) => (
                  <li key={cat} className="group flex items-center justify-between text-[0.9rem] font-medium text-zinc-700">
                    <span className="truncate pr-4 transition-colors duration-200 group-hover:text-zinc-900">{cat}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">{score}</span>
                  </li>
                )) : (
                  <li className="text-sm italic text-zinc-400">No clusters in this tier</li>
                )}
              </ul>
            </MagneticCard>
          ))}
        </div>
      </motion.div>

      {/* ── Pace analysis ──
          Only rendered when timing data exists. Time is attributed to
          clusters via each question's stored points. */}
      {pace.avgAll != null && pace.topTime.length > 0 && (
        <motion.div variants={itemVariants} id="cpt-pace" className="mx-auto mb-12 w-full max-w-3xl scroll-mt-28">
          <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Where your time went</h3>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500" style={{ textWrap: 'balance' }}>
            {pace.timeLeader === topCluster
              ? 'You gave the most time to the cluster you scored highest in — your attention followed your interests.'
              : `You lingered longest on ${pace.timeLeader} while ${topCluster} scored highest — curiosity beyond your leading fit, and worth discussing.`}
          </p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-white/70 px-4 py-4 text-center">
              <p className="text-xl font-bold tabular-nums text-zinc-900">{pace.avgAll}s</p>
              <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-zinc-500">Avg per question</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/70 px-4 py-4 text-center">
              <p className="text-xl font-bold tabular-nums text-zinc-900">{Math.floor(pace.totalTime / 60)}m {pace.totalTime % 60}s</p>
              <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-zinc-500">Total time</p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white/70 px-5 py-4">
            <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-900/50">Most time spent on</p>
            <div className="space-y-3">
              {pace.topTime.map(([cat, t]) => {
                const pct = pace.totalTime > 0 ? Math.round((t / pace.totalTime) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-zinc-700" title={cat}>{cat}</span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-500">{pct}% · ~{Math.round(t / 60) || 1}m</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                      <div className="h-full rounded-full bg-[#0a5c2c]/70 transition-[width] duration-700" style={{ width: `${Math.max(3, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Career typology table ── */}
      <motion.div variants={itemVariants} id="cpt-typology" className="mx-auto w-full max-w-5xl scroll-mt-28">
        <h3 className="mb-2 text-center font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900 md:text-3xl">Career typology</h3>
        <p className="mx-auto mb-6 max-w-md text-center text-sm text-zinc-500">
          Every cluster and the roles it opens. Your leading cluster is starred.
        </p>
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70">
          <table className="w-full text-left text-sm text-zinc-600 border-collapse">
            <thead className="border-b border-zinc-200 bg-zinc-50/80">
              <tr>
                <th className="px-6 py-5 font-semibold text-zinc-800 w-1/3 tracking-wide">Cluster</th>
                <th className="px-6 py-5 font-semibold text-zinc-800 tracking-wide">Optimal roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {Object.entries(careerClusters).map(([cluster, options]) => (
                <tr key={cluster} className={`transition-[background-color] duration-150 ease-out hover:bg-[#f6faf7] ${cluster === topCluster ? 'bg-[#e9c85c]/[0.14]' : ''}`}>
                  <td className="px-6 py-4 font-medium text-zinc-700 align-top leading-relaxed">{cluster}{cluster === topCluster && ' ★'}</td>
                  <td className="px-6 py-4 text-zinc-500 align-top leading-relaxed">{options}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Counsellor CTA ── */}
      <motion.div variants={itemVariants} id="cpt-cta" className="relative mx-auto mt-12 w-full max-w-3xl scroll-mt-28 overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 bg-white/70 px-7 py-10 text-center backdrop-blur-xl md:px-12">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_INK }}>Make it count</p>
        <h3 className="mx-auto mt-3 max-w-xl font-['DM_Serif_Display',Georgia,serif] text-3xl leading-tight text-zinc-900 md:text-4xl" style={{ textWrap: 'balance' }}>
          Talk to a counsellor about <em className="italic" style={{ color: GOLD_INK }}>your commerce path</em>
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
          Your dominant axis is <strong className="text-zinc-800">{preferredDomain}</strong>, led by <strong className="text-zinc-800">{topCluster}</strong>
          {runnerUp ? <> followed by <strong className="text-zinc-800">{runnerUp[0]}</strong></> : null}.
          A one-on-one session turns this report into stream choices and a career roadmap.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just completed the ${result?.testName || 'Commerce Career Selector'} on your website and would like to discuss my results with a counsellor.`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[#e9c85c] px-8 py-4 text-sm font-bold text-[#051a0d] no-underline transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            <WhatsAppIcon fontSize="small" aria-hidden="true" /> Discuss on WhatsApp
          </a>
          <Link
            to="/career-counselling"
            className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white/70 px-8 py-4 text-sm font-semibold text-zinc-700 no-underline transition-colors duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
          >
            <PsychologyIcon fontSize="small" aria-hidden="true" /> See How Counselling Works
          </Link>
        </div>
      </motion.div>

      {/* Print/PDF document — portal-rendered above everything. */}
      <CommerceReportPrintDocument
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onPrint={handlePrint}
        result={result}
        breakdown={breakdown}
        maxScore={maxScore}
        high={high}
        medium={medium}
        low={low}
        preferredDomain={preferredDomain}
        finPoints={finPoints}
        nonFinPoints={nonFinPoints}
        pace={pace}
        breadth={breadth}
      />
    </motion.div>
  );
}
