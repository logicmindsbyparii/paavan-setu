import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { WHATSAPP_NUMBER } from '../constants/urls';

/**
 * Print/PDF document for the Ideal Career Test report.
 *
 * Rendered into a portal outside #root so the app shell never leaks into the
 * printed sheet. Reuses the rpt-* print stylesheet authored for
 * ReportPrintDocument: on screen it previews as a paper sheet with actions;
 * in print media the sheet becomes the page and accents go ink-only.
 */

function Bar({ pct, tone = 'green' }) {
  const bg = tone === 'gold' ? '#d9ae3c' : tone === 'red' ? '#c0395a' : '#0a4f22';
  return (
    <div className="rpt-bar">
      <span style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: bg }} />
    </div>
  );
}

function Chip({ children }) {
  return <span className="rpt-chip">{children}</span>;
}

export default function IdealCareerReportPrintDocument({ open, onClose, onPrint, result, model, completedAt }) {
  /* Lock background scroll while the preview is open, and close on Escape.
     The `rpt-printing` class marks the print flow so the @media print block
     can hide #root — Ctrl+P outside this dialog still prints the normal page. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('rpt-printing');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('rpt-printing');
    };
  }, [open, onClose]);

  if (!open) return null;

  const {
    style, archetype, traitSentence, pillars, themes, hasThemeData, themeLeader,
    themeShare, themeClarity, valuesRanked, topValues, aptitude, strongestSection,
    alignment, pace, mistakes, answeredCount, totalQuestions, timeTaken, careersLine,
  } = model;

  const completedLabel = completedAt
    ? new Date(completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return createPortal(
    <div className="rpt-root" role="dialog" aria-modal="true" aria-label="Printable report">
      {/* Action bar — screen only, removed from print by .rpt-actions */}
      <div className="rpt-actions">
        <button type="button" onClick={onClose} className="rpt-btn rpt-btn-ghost">Close</button>
        <div className="rpt-actions-note">
          Tip: enable “Background graphics” in the print dialog for the full design.
        </div>
        <button type="button" onClick={onPrint} className="rpt-btn rpt-btn-primary">Save as PDF</button>
      </div>

      {/* The sheet. In print media this block IS the page. */}
      <div className="rpt-sheet" id="report-print-sheet">
        {/* Header */}
        <header className="rpt-header">
          <div>
            <p className="rpt-brand">Paavan Setu</p>
            <h1 className="rpt-title">{result?.testName || 'Ideal Career Test'} report</h1>
            <p className="rpt-sub">
              {completedLabel ? `Completed ${completedLabel}` : 'Personalised assessment report'}
              {answeredCount ? ` · ${answeredCount}/${totalQuestions || answeredCount} questions answered` : ''}
            </p>
          </div>
          <div className="rpt-header-score">
            <p className="rpt-header-score-label">Career profile</p>
            <p className="rpt-header-score-value">{hasThemeData ? themeLeader.name : '—'}</p>
            <p className="rpt-header-score-sub">
              {archetype}
              {aptitude.total ? ` · aptitude ${aptitude.pct}%` : ''}
              {pace.avgAll != null ? ` · ${pace.avgAll}s per question` : ''}
            </p>
          </div>

          {/* Archetype summary — merges into the verdict block on narrow sheets */}
          <section className="rpt-section rpt-two-col">
            <div>
              <h2 className="rpt-h3">Career archetype</h2>
              <p>{archetype}. {traitSentence}</p>
            </div>
            <div>
              <h2 className="rpt-h3">Reading your profile</h2>
              <p>{style.body}{themeClarity ? (themeClarity.decisive
                ? ` Your top theme sits a decisive ${themeClarity.marginPts} pts ahead of ${themeClarity.runnerUp}.`
                : ` Close call: only ${themeClarity.marginPts} pts separate ${themeLeader?.name} from ${themeClarity.runnerUp} — weigh both.`)
                : ''}</p>
            </div>
          </section>
        </header>

        {/* Verdict summary */}
        <section className="rpt-section">
          <p className="rpt-fit">{style.headline} · {archetype}</p>
          <p className="rpt-note">{style.body}</p>
          <div className="rpt-chip-row">
            {careersLine && <Chip>{careersLine}</Chip>}
            {alignment && <Chip>{alignment.sentence}</Chip>}
            {topValues.length > 0 && <Chip>Core values: {topValues.map((v) => v.label).join(' · ')}</Chip>}
            {strongestSection && <Chip>Strongest aptitude: {strongestSection.title} ({strongestSection.pct}%)</Chip>}
            <Chip>{Math.floor((timeTaken || 0) / 60)}m {(timeTaken || 0) % 60}s total · {pace.avgAll != null ? `${pace.avgAll}s/question` : 'no pacing data'}</Chip>
          </div>
        </section>

        {/* Three pillars */}
        <section className="rpt-section">
          <h2 className="rpt-h2">The three pillars</h2>
          <div className="rpt-score-list">
            {pillars.map((p, i) => (
              <div key={p.title} className={`rpt-score-row ${i === 0 ? 'rpt-score-row-top' : ''}`}>
                <div className="rpt-score-line">
                  <span className="rpt-score-name">{p.title}</span>
                  <span className="rpt-score-pts">{p.pct}% · {p.detail}</span>
                </div>
                <Bar pct={p.pct} tone={i === 0 ? 'gold' : 'green'} />
              </div>
            ))}
          </div>
        </section>

        {/* Interest themes */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Where your interest concentrates</h2>
          {hasThemeData ? (
            <div className="rpt-score-list">
              {themes.slice(0, 8).map((t, i) => (
                <div key={t.key} className={`rpt-score-row ${i === 0 ? 'rpt-score-row-top' : ''}`}>
                  <div className="rpt-score-line">
                    <span className="rpt-score-name">{i + 1}. {t.name}</span>
                    <span className="rpt-score-pts">{t.pts} pt{t.pts === 1 ? '' : 's'}{i === 0 && themeShare != null ? ` · ${themeShare}% of pull` : ''}</span>
                  </div>
                  <Bar pct={Math.round((t.pts / Math.max(1, themes[0].pts)) * 100)} tone={i === 0 ? 'gold' : 'green'} />
                  {i === 0 && <p className="rpt-score-fit">{t.careers}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="rpt-note">No per-question answers were stored for this attempt, so the interest profile could not be rebuilt.</p>
          )}
        </section>

        {/* Work values — full ranking */}
        {valuesRanked.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-h2">What you want from a career</h2>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th className="rpt-w34">Value</th>
                  <th>What it means</th>
                  <th className="rpt-right">Your rank</th>
                </tr>
              </thead>
              <tbody>
                {valuesRanked.map((v, i) => (
                  <tr key={v.value}>
                    <td className="rpt-td-name">{i + 1}. {v.label}</td>
                    <td className="rpt-td-muted">{v.blurb}</td>
                    <td className="rpt-right">{v.score === 2 ? 'Core' : v.score === 1 ? 'Important' : 'Lower'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Aptitude + pace */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Aptitude battery &amp; pacing</h2>
          {aptitude.perSection.length > 0 ? (
            <div className="rpt-score-list">
              {aptitude.perSection.map((s) => (
                <div key={s.title} className="rpt-score-row">
                  <div className="rpt-score-line">
                    <span className="rpt-score-name">{s.title}</span>
                    <span className="rpt-score-pts">{s.right}/{s.total} · {s.pct}%</span>
                  </div>
                  <Bar pct={s.pct ?? 0} tone={s.pct >= 60 ? 'green' : s.pct >= 35 ? 'gold' : 'red'} />
                </div>
              ))}
            </div>
          ) : (
            <p className="rpt-note">No graded answers were stored for this attempt.</p>
          )}
          <div className="rpt-stat-grid">
            <div className="rpt-stat"><p className="rpt-stat-value">{aptitude.pct != null ? `${aptitude.pct}%` : '—'}</p><p className="rpt-stat-label">Aptitude accuracy</p></div>
            <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgAll != null ? `${pace.avgAll}s` : '—'}</p><p className="rpt-stat-label">Avg per question</p></div>
            <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgRight != null ? `${pace.avgRight}s` : '—'}</p><p className="rpt-stat-label">On correct</p></div>
            <div className="rpt-stat"><p className="rpt-stat-value">{Math.floor((timeTaken || 0) / 60)}m {(timeTaken || 0) % 60}s</p><p className="rpt-stat-label">Total time</p></div>
          </div>
        </section>

        {/* Next steps */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Next steps</h2>
          <ol className="rpt-steps">
            {themeLeader && (
              <li><strong>Test-drive {themeLeader.name}.</strong> Pick one small, real project in this field — interest survives contact with reality or it does not.</li>
            )}
            {topValues.length > 0 && (
              <li><strong>Filter careers by your values.</strong> {topValues.map((v) => v.label).join(', ')} {topValues.length > 1 ? 'are' : 'is'} non-negotiable — a path that violates them will chafe no matter the pay.</li>
            )}
            {mistakes.length > 0 ? (
              <li><strong>Close the aptitude gaps.</strong> You missed {mistakes.length} graded questions — the review list below names each one.</li>
            ) : (
              <li><strong>Sharpen your strongest section.</strong> {strongestSection ? `${strongestSection.title} is your lead — push it from good to outstanding.` : 'Build consistent practice across all aptitude sections.'}</li>
            )}
            <li><strong>Talk it through.</strong> A counsellor can pressure-test this profile against your marks, budget and the colleges you can realistically reach.</li>
          </ol>
        </section>

        {/* Missed questions */}
        {mistakes.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-h2">Review your missed questions ({mistakes.length})</h2>
            <div className="rpt-mistakes">
              {mistakes.map((ms) => (
                <div key={ms.i} className="rpt-mistake">
                  <p className="rpt-mistake-q">Q{ms.i + 1}. {ms.question}{ms.time != null ? ` — ${ms.time}s` : ''}{ms.flagged ? ' · flagged' : ''}</p>
                  <p className="rpt-mistake-a">Your answer: {String(ms.picked)}</p>
                  {ms.correctText && <p className="rpt-mistake-ex">Correct answer: {ms.correctText}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA — the printed sheet must carry the contact path too. */}
        <footer className="rpt-footer">
          <div>
            <h2 className="rpt-h3">Talk to a counsellor about your profile</h2>
            <p>
              {themeLeader
                ? <>Your interest centre of gravity is <strong>{themeLeader.name}</strong>{topValues.length ? <> and you value <strong>{topValues[0].label.toLowerCase()}</strong></> : null}. A one-on-one session turns this report into subject choices and a study roadmap.</>
                : 'A one-on-one session turns this report into subject choices and a study roadmap.'}
            </p>
          </div>
          <a className="rpt-footer-link" href={`https://wa.me/${WHATSAPP_NUMBER}`}>
            <WhatsAppIcon sx={{ fontSize: 16 }} /> wa.me/{WHATSAPP_NUMBER}
          </a>
        </footer>
        <p className="rpt-fineprint">
          Generated by Paavan Setu · {result?.testName || 'Ideal Career Test'} · {completedLabel}
        </p>
      </div>

      {/* End of sheet */}
    </div>,
    document.body,
  );
}
