import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ResponsiveRadarChart from './ResponsiveRadarChart';
import IdealCareerReportPrintDocument from './IdealCareerReportPrintDocument';
import { WHATSAPP_NUMBER } from '../constants/urls';
import { buildIdealCareerModel } from '../lib/idealCareerModel';

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

function PillarBar({ pct, tone = 'gold' }) {
  const bg = tone === 'green' ? '#0a4f22' : tone === 'red' ? '#c0395a' : '#d9ae3c';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900/10">
      <span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: bg }} />
    </div>
  );
}

export default function IdealCareerReport({ result, test, prefersReducedMotion }) {
  const m = useMemo(() => buildIdealCareerModel(result, test), [result, test]);
  const [copied, setCopied] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const handlePrint = () => {
    requestAnimationFrame(() => { setTimeout(() => window.print(), 50); });
  };

  const copySummary = async () => {
    const lines = [
      `Paavan Setu — ${result?.testName || 'Ideal Career Test'} result`,
      `Profile: ${m.style.headline} (${m.archetype})`,
      m.themeLeader ? `Top interest theme: ${m.themeLeader.name} (${m.themeLeader.pts} pts, ${m.themeShare}% of pull)` : '',
      m.themeClarity ? (m.themeClarity.decisive ? `Decisive: ${m.themeClarity.marginPts} pts ahead of ${m.themeClarity.runnerUp}` : `Close call with ${m.themeClarity.runnerUp} (${m.themeClarity.marginPts} pts)`) : '',
      m.topValues.length ? `Core work values: ${m.topValues.map((v) => v.label).join(', ')}` : '',
      m.aptitude.total ? `Aptitude: ${m.aptitude.right}/${m.aptitude.total} (${m.aptitude.pct}%)` : '',
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  /* In-report quick nav — the report is long; let people jump. */
  const navItems = [
    { id: 'icr-pillars', label: 'Profile' },
    { id: 'icr-themes', label: 'Themes' },
    m.topValues.length ? { id: 'icr-values', label: 'Values' } : null,
    m.aptitude.perSection.length ? { id: 'icr-aptitude', label: 'Aptitude' } : null,
    m.pace.avgAll != null ? { id: 'icr-pace', label: 'Pace' } : null,
    m.mistakes.length ? { id: 'icr-review', label: 'Review' } : null,
    { id: 'icr-cta', label: 'Counselling' },
  ].filter(Boolean);

  return (
    <motion.div className="w-full pb-4" variants={containerVariants} initial={prefersReducedMotion ? 'visible' : 'hidden'} animate="visible">
      {/* ── Hero verdict ── */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <span className="inline-block rounded-full border border-[#d9ae3c]/45 bg-[#e9c85c]/20 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#8a6a1f]">
          Ideal career assessment
        </span>
        <h1 className="mt-5 font-['DM_Serif_Display',Georgia,serif] text-4xl leading-[1.1] tracking-tight text-zinc-900 md:text-5xl" style={{ textWrap: 'balance' }}>
          Your Ideal Career <span className="italic" style={{ color: GOLD_INK }}>Profile</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-zinc-600" style={{ textWrap: 'balance' }}>
          {m.style.body}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" onClick={copySummary} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600 transition-[transform,color,border-color] duration-150 ease-out hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]">
            {copied ? 'Copied to clipboard' : 'Copy summary'}
          </button>
          <button type="button" onClick={() => setPrintOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-zinc-600 transition-[transform,color,border-color] duration-150 ease-out hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]">
            Save as PDF
          </button>
        </div>
        {navItems.length > 1 && (
          <nav aria-label="Report sections" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {navItems.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(n.id)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
                }}
                className="rounded-full border border-zinc-200 bg-white/60 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors duration-150 ease-out hover:border-zinc-300 hover:text-zinc-900"
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </motion.div>

      {/* ── Archetype + radar snapshot ── */}
      <motion.div variants={itemVariants} className="mx-auto mb-12 grid w-full max-w-4xl grid-cols-1 items-stretch gap-4 md:grid-cols-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 px-8 py-10 md:col-span-3 md:px-12" style={{ background: 'linear-gradient(160deg, #fdf8e9 0%, #f9efd4 60%, #f5e9c8 100%)' }}>
          <span className="inline-block rounded-full border border-[#d9ae3c]/45 bg-white/70 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#8a6a1f]">
            Your career archetype
          </span>
          <h2 className="mt-4 font-['DM_Serif_Display',Georgia,serif] text-3xl leading-tight tracking-tight md:text-4xl" style={{ color: '#3d3009' }}>
            {m.archetype}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">{m.traitSentence}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600">
            {m.pullBand} · {m.themeLeader ? `pulled towards ${m.themeLeader.name}` : 'no clear pull yet'}
            {m.themeClarity ? (m.themeClarity.decisive
              ? ` — a decisive ${m.themeClarity.marginPts} pts ahead of ${m.themeClarity.runnerUp}.`
              : ` — close call with ${m.themeClarity.runnerUp} (${m.themeClarity.marginPts} pts). Keep both in view.`)
              : '.'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-zinc-200 bg-white/60 p-5 backdrop-blur-md md:col-span-2">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-zinc-500">Interest radar</span>
          <div className="mt-2 w-full">
            <ResponsiveRadarChart categories={m.themes.slice(0, 6).map((t) => [t.name, t.pts])} maxScore={m.themes[0]?.pts || 10} />
          </div>
        </div>
      </motion.div>

      {/* ── Verdict cards: three pillars ── */}
      <motion.div variants={itemVariants} id="icr-pillars" className="mx-auto mb-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {m.pillars.map((p, i) => (
          <div key={p.title} className="rounded-2xl border border-[#d9ae3c]/30 bg-white/60 p-5 backdrop-blur-md transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.015] hover:shadow-lg">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-zinc-500">{p.title}</span>
              <span className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900">{p.pct}%</span>
            </div>
            <div className="mt-3"><PillarBar pct={p.pct} tone={i === 0 ? 'gold' : 'green'} /></div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">{p.detail}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Interest ↔ aptitude alignment ── */}
      {m.alignment && (
        <motion.div variants={itemVariants} className="mx-auto mb-12 w-full max-w-4xl">
          <div className={`rounded-2xl border px-5 py-4 text-sm leading-relaxed ${m.alignment.agree ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' : 'border-[#e9c85c]/40 bg-[#e9c85c]/[0.10] text-zinc-700'}`}>
            <strong className="font-semibold">Interest ↔ aptitude: </strong>{m.alignment.sentence}
          </div>
        </motion.div>
      )}

      {/* ── Interest themes ── */}
      <motion.div variants={itemVariants} id="icr-themes" className="mx-auto mb-12 w-full max-w-4xl">
        <h2 className="mb-2 font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">Where your interest concentrates</h2>
        <p className="mb-6 max-w-2xl text-sm text-zinc-500">Every interest and work-situation answer was mapped to a career theme and tallied. Strong pull in one or two themes is a direction worth testing; a long spread is a shortlist to narrow.</p>
        {m.hasThemeData ? (
          <div className="space-y-2.5">
            {m.themes.slice(0, 8).map((t, i) => (
              <div key={t.key} className={`rounded-2xl border px-5 py-4 backdrop-blur-md transition-[transform,border-color] duration-300 ease-out hover:scale-[1.01] ${i === 0 ? 'border-[#d9ae3c]/45 bg-[#e9c85c]/[0.12]' : 'border-zinc-200 bg-white/50'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${i === 0 ? 'text-[#6b511a]' : 'text-zinc-700'}`}>{i + 1}. {t.name}</span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-500">{t.pts} pt{t.pts === 1 ? '' : 's'}{i === 0 && m.themeShare != null ? ` · ${m.themeShare}% of pull` : ''}</span>
                </div>
                <div className="mt-2"><PillarBar pct={Math.round((t.pts / Math.max(1, m.themes[0].pts)) * 100)} tone={i === 0 ? 'gold' : 'green'} /></div>
                {i === 0 && <p className="mt-3 text-xs leading-relaxed text-zinc-600">{t.careers}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white/50 px-5 py-6 text-sm text-zinc-500">{m.style.body}</div>
        )}
      </motion.div>

      {/* ── Work values: the full ranking, not just the podium ── */}
      {m.topValues.length > 0 && (
        <motion.div variants={itemVariants} id="icr-values" className="mx-auto mb-12 w-full max-w-4xl">
          <h2 className="mb-2 font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">What you want from a career</h2>
          <p className="mb-6 max-w-2xl text-sm text-zinc-500">Your complete ranking of the ten work values. The ones you marked core are non-negotiables — a career that violates them will chafe no matter how well it pays.</p>
          <div className="space-y-2">
            {m.valuesRanked.map((v, i) => (
              <div key={v.value} className={`rounded-xl border px-4 py-3 transition-colors ${i === 0 ? 'border-[#d9ae3c]/45 bg-[#e9c85c]/[0.12]' : i < 3 ? 'border-zinc-200 bg-white/50' : 'border-zinc-200/70 bg-white/30'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-400">{i + 1}</span>
                  <span className={`text-sm font-semibold ${i === 0 ? 'text-[#6b511a]' : 'text-zinc-700'}`}>{v.label}</span>
                  <span className="flex-1"><PillarBar pct={v.score === 2 ? 100 : v.score === 1 ? 50 : 12} tone={i === 0 ? 'gold' : 'green'} /></span>
                  <span className="w-16 shrink-0 text-right text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">{v.score === 2 ? 'Core' : v.score === 1 ? 'Important' : 'Lower'}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Aptitude battery ── */}
      {m.aptitude.perSection.length > 0 && (
        <motion.div variants={itemVariants} id="icr-aptitude" className="mx-auto mb-12 w-full max-w-4xl">
          <h2 className="mb-2 font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">Aptitude battery</h2>
          <p className="mb-6 max-w-2xl text-sm text-zinc-500">
            {m.aptitude.total
              ? `You answered ${m.aptitude.right} of ${m.aptitude.total} graded questions correctly (${m.aptitude.pct}%).${m.strongestSection ? ` Your strongest section: ${m.strongestSection.title} at ${m.strongestSection.pct}%.` : ''}`
              : 'No graded answers were stored for this attempt.'}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {m.aptitude.perSection.map((s) => (
              <div key={s.title} className="rounded-2xl border border-zinc-200 bg-white/50 px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-700">{s.title}</span>
                  <span className="tabular-nums text-zinc-500">{s.right}/{s.total}</span>
                </div>
                <div className="mt-2"><PillarBar pct={s.pct ?? 0} tone={s.pct >= 60 ? 'green' : s.pct >= 35 ? 'gold' : 'red'} /></div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Pace ── */}
      {m.pace.avgAll != null && (
        <motion.div variants={itemVariants} id="icr-pace" className="mx-auto mb-12 w-full max-w-4xl">
          <h2 className="mb-2 font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">How you moved through it</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white/50 p-4 text-center">
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900">{Math.floor(m.timeTaken / 60)}m {m.timeTaken % 60}s</p>
              <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wider text-zinc-500">Total time</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/50 p-4 text-center">
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900">{m.pace.avgAll}s</p>
              <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wider text-zinc-500">Avg / question</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/50 p-4 text-center">
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900">{m.pace.avgRight != null ? `${m.pace.avgRight}s` : '—'}</p>
              <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wider text-zinc-500">On correct</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/50 p-4 text-center">
              <p className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-zinc-900">{m.pace.avgWrong != null ? `${m.pace.avgWrong}s` : '—'}</p>
              <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wider text-zinc-500">On missed</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {m.pace.perSection.map((s) => (
              <div key={s.title} className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white/40 px-4 py-2.5 text-xs">
                <span className="font-semibold text-zinc-600">{s.title}</span>
                <span className="tabular-nums text-zinc-500">{s.avg}s avg</span>
              </div>
            ))}
          </div>
          {m.pace.avgRight != null && m.pace.avgWrong != null && (
            <p className="mt-4 max-w-2xl text-sm text-zinc-500">
              {m.pace.avgWrong > m.pace.avgRight
                ? 'You spent longer on questions you missed — the hard ones held your attention. Reviewing them below is time well spent.'
                : 'You answered quickly overall and the misses came fast. A short pause to re-read before marking could lift your accuracy.'}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Missed questions ── */}
      {m.mistakes.length > 0 && (
        <motion.div variants={itemVariants} id="icr-review" className="mx-auto mb-12 w-full max-w-4xl">
          <h2 className="mb-2 font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight text-zinc-900 md:text-3xl">Review your missed questions ({m.mistakes.length})</h2>
          <div className="space-y-3">
            {m.mistakes.map((ms) => (
              <div key={ms.i} className="rounded-2xl border border-zinc-200 bg-white/50 px-5 py-4">
                <p className="text-sm font-semibold text-zinc-800">Q{ms.i + 1}. {ms.question}{ms.time != null ? ` — ${ms.time}s` : ''}{ms.flagged ? ' · flagged' : ''}</p>
                <p className="mt-1 text-xs text-zinc-500">Your answer: {String(ms.picked)}{ms.correctText ? ` · Correct answer: ${ms.correctText}` : ''}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Counselling CTA ── */}
      <motion.div variants={itemVariants} id="icr-cta" className="mx-auto mb-4 w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#d9ae3c]/35 px-8 py-10 md:px-12" style={{ background: 'linear-gradient(160deg, #fdf8e9 0%, #f9efd4 60%, #f5e9c8 100%)' }}>
          <h2 className="font-['DM_Serif_Display',Georgia,serif] text-2xl tracking-tight md:text-3xl" style={{ color: '#3d3009' }}>
            Turn this profile into a plan
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
            {m.themeLeader
              ? `Your top theme is ${m.themeLeader.name}${m.topValues.length ? `, and you value ${m.topValues[0].label.toLowerCase()} most` : ''}. A one-on-one session maps that onto subjects, colleges and a realistic roadmap.`
              : 'A one-on-one session maps your interests and aptitude onto subjects, colleges and a realistic roadmap.'}
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I would like to discuss my Ideal Career Test report with a counsellor.')}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[#051a0d] transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)' }}
          >
            <WhatsAppIcon sx={{ fontSize: 18 }} /> Talk to a counsellor
          </a>
        </div>
      </motion.div>

      <IdealCareerReportPrintDocument open={printOpen} onClose={() => setPrintOpen(false)} onPrint={handlePrint} result={result} model={m} completedAt={result?.completedAt} />
    </motion.div>
  );
}
