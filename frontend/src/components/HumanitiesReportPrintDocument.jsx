import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { WHATSAPP_NUMBER } from '../constants/urls';

/**
 * Print/PDF document for the Humanities Career Test report.
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

export default function HumanitiesReportPrintDocument({ open, onClose, onPrint, result, model, completedAt }) {
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
    tracks, ranked, hasTrackData, topTrack, runnerUp, marginPts, decisive,
    alignment, fitBand, knowledgeQuiz, pace, answeredCount, totalQuestions, mistakes,
  } = model;

  const completedLabel = completedAt
    ? new Date(completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const lensRows = [
    { label: 'Activity pull', key: 'activityPts', graded: false },
    { label: 'Work comfort', key: 'comfortPts', graded: false },
    { label: 'Career knowledge', key: 'knowledge', graded: true },
    { label: 'Personality fit', key: 'personalityPts', graded: false },
  ].map((lens) => {
    const sorted = [...tracks].sort((a, b) => (b[lens.key] - a[lens.key]) || a.name.localeCompare(b.name));
    return { ...lens, top: sorted.slice(0, 3), leader: sorted[0] };
  });

  return createPortal(
    <div className="rpt-root" role="dialog" aria-modal="true" aria-label="Printable report">
      {/* Action bar — screen only, removed from print by .rpt-actions */}
      <div className="rpt-actions">
        <button type="button" onClick={onClose} className="rpt-btn rpt-btn-ghost">
          Close
        </button>
        <div className="rpt-actions-note">
          Tip: enable “Background graphics” in the print dialog for the full design.
        </div>
        <button type="button" onClick={onPrint} className="rpt-btn rpt-btn-primary">
          Save as PDF
        </button>
      </div>

      {/* The sheet. In print media this block IS the page. */}
      <div className="rpt-sheet" id="report-print-sheet">
        {/* Header */}
        <header className="rpt-header">
          <div>
            <p className="rpt-brand">Paavan Setu</p>
            <h1 className="rpt-title">{result?.testName || 'Humanities Career Test report'}</h1>
            <p className="rpt-sub">
              {completedLabel ? `Completed ${completedLabel}` : 'Personalised assessment report'}
              {answeredCount ? ` · ${answeredCount}/${totalQuestions || answeredCount} questions answered` : ''}
            </p>
          </div>
          <div className="rpt-header-score">
            <p className="rpt-header-score-label">Recommended career track</p>
            <p className="rpt-header-score-value">{topTrack?.name ?? '—'}</p>
            <p className="rpt-header-score-sub">
              {hasTrackData ? `Fit ${topTrack.prefPct}% · ${topTrack.knowledge ? 'knows it' : 'knew none of it'}` : ''}
              {pace.avgAll != null ? ` · ${pace.avgAll}s per question` : ''}
            </p>
          </div>
        </header>

        {/* Verdict summary */}
        <section className="rpt-section">
          {topTrack?.meta && <p className="rpt-fit">{topTrack.meta.fit}</p>}
          <div className="rpt-chip-row">
            {fitBand && hasTrackData && <Chip>{fitBand.headline}</Chip>}
            {runnerUp && marginPts != null && <Chip>{decisive ? `Clear margin of ${marginPts} pts over ${runnerUp.name}` : `Close call: ${marginPts} pts over ${runnerUp.name}`}</Chip>}
            {knowledgeQuiz.pct != null && <Chip>Quiz {knowledgeQuiz.right}/{knowledgeQuiz.total} correct ({knowledgeQuiz.pct}%)</Chip>}
          </div>
        </section>

        {/* Career-fit profile */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Career-fit profile — all 19 tracks</h2>
          <div className="rpt-score-list">
            {ranked.map((t, i) => (
              <div key={t.name} className={`rpt-score-row ${i === 0 ? 'rpt-score-row-top' : ''}`}>
                <div className="rpt-score-line">
                  <span className="rpt-score-name">{i + 1}. {t.name}</span>
                  <span className="rpt-score-pts">{t.total} pts · fit {t.prefPct}% · {t.knowledge ? 'knows it' : 'new to you'}</span>
                </div>
                <Bar pct={t.prefPct} tone={i === 0 ? 'gold' : 'green'} />
                {i === 0 && t.meta && <p className="rpt-score-fit">{t.meta.careers}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Four lenses table */}
        <section className="rpt-section">
          <h2 className="rpt-h2">The four lenses</h2>
          <table className="rpt-table">
            <thead>
              <tr>
                <th className="rpt-w34">Lens</th>
                <th>What it measures</th>
                <th className="rpt-right">Leaders</th>
              </tr>
            </thead>
            <tbody>
              {lensRows.map((lens) => (
                <tr key={lens.key}>
                  <td className="rpt-td-name">{lens.label}</td>
                  <td className="rpt-td-muted">
                    {lens.graded
                      ? 'Career-knowledge quiz (graded right / wrong)'
                      : 'Interest & preference (no right answers)'}
                  </td>
                  <td className="rpt-right">
                    {lens.top.map((t) => t.name).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {alignment && hasTrackData && (
            <p className="rpt-note">
              {alignment.agree
                ? `Interest and knowledge agree: your pull and your quiz both point to ${alignment.prefTop}.`
                : alignment.prefKnowAgree
                  ? `Interest and knowledge agree on ${alignment.prefTop}; the composite leans ${topTrack?.name}. Both deserve a look.`
                  : `You gravitated towards ${alignment.prefTop}, but knew ${alignment.knowTop} best. Worth discussing both tracks.`}
            </p>
          )}
        </section>

        {/* Knowledge quiz + pace */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Career-knowledge quiz &amp; pacing</h2>
          <div className="rpt-stat-grid">
            <div className="rpt-stat"><p className="rpt-stat-value">{knowledgeQuiz.total > 0 ? `${knowledgeQuiz.right}/${knowledgeQuiz.total}` : '—'}</p><p className="rpt-stat-label">Quiz correct</p></div>
            <div className="rpt-stat"><p className="rpt-stat-value">{knowledgeQuiz.pct != null ? `${knowledgeQuiz.pct}%` : '—'}</p><p className="rpt-stat-label">Quiz accuracy</p></div>
            <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgAll != null ? `${pace.avgAll}s` : '—'}</p><p className="rpt-stat-label">Avg per question</p></div>
            <div className="rpt-stat"><p className="rpt-stat-value">{Math.floor(pace.totalTime / 60)}m {pace.totalTime % 60}s</p><p className="rpt-stat-label">Total time</p></div>
          </div>
          {pace.avgRight != null && pace.avgWrong != null && (
            <p className="rpt-note">
              {pace.avgWrong > pace.avgRight
                ? 'You spent longer on questions you missed — the hard ones held your attention. Reviewing those is time well spent.'
                : 'You answered quickly overall, and the misses came fast. A short pause to re-read before marking could lift your accuracy.'}
            </p>
          )}
        </section>

        {/* Careers + subjects for the winner */}
        {topTrack?.meta && (
          <section className="rpt-section rpt-two-col">
            <div>
              <h2 className="rpt-h3">Careers in {topTrack.name}</h2>
              <p>{topTrack.meta.careers}</p>
            </div>
            <div>
              <h2 className="rpt-h3">Subjects &amp; pathway</h2>
              <p>{topTrack.meta.subjects}</p>
            </div>
          </section>
        )}

        {/* Next steps */}
        {topTrack?.meta && (
          <section className="rpt-section">
            <h2 className="rpt-h2">Next steps</h2>
            <ol className="rpt-steps">
              <li><strong>Test-drive {topTrack.name}.</strong> Pick one small, real project in this career — interest survives contact with reality or it does not.</li>
              {mistakes.length > 0 ? (
                <li><strong>Close the knowledge gaps.</strong> You missed {mistakes.length} of {knowledgeQuiz.total} quiz questions — the review list names each one.</li>
              ) : (
                <li><strong>Deepen your research.</strong> Read one honest “day in the life” for your top three tracks this week.</li>
              )}
              {runnerUp ? (
                <li><strong>Weigh {runnerUp.name} alongside.</strong> It finished {marginPts} pts behind — if an opportunity for it comes easier, that is a signal worth respecting.</li>
              ) : (
                <li><strong>Map subjects to the track.</strong> {topTrack.meta.subjects}</li>
              )}
              <li><strong>Talk it through.</strong> A counsellor can pressure-test this recommendation against your marks, budget and the colleges you can realistically reach.</li>
            </ol>
          </section>
        )}

        {/* Missed questions */}
        {mistakes.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-h2">Review your missed questions ({mistakes.length})</h2>
            <div className="rpt-mistakes">
              {mistakes.map((m) => (
                <div key={m.i} className="rpt-mistake">
                  <p className="rpt-mistake-q">Q{m.i + 1}. {m.question}{m.time != null ? ` — ${m.time}s` : ''}{m.flagged ? ' · flagged' : ''}</p>
                  <p className="rpt-mistake-a">Your answer: {String(m.picked)}</p>
                  {m.correctText && <p className="rpt-mistake-ex">Correct answer: {m.correctText}</p>}
                  {m.explanation && <p className="rpt-mistake-ex">{m.explanation}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA — the printed sheet must carry the contact path too. */}
        <footer className="rpt-footer">
          <div>
            <h2 className="rpt-h3">Talk to a counsellor about your career track</h2>
            <p>
              Your top track is <strong>{topTrack?.name ?? '—'}</strong>
              {runnerUp ? <> followed by <strong>{runnerUp.name}</strong></> : null}. A one-on-one session turns this report into subject choices and a study roadmap.
            </p>
          </div>
          <a className="rpt-footer-link" href={`https://wa.me/${WHATSAPP_NUMBER}`}>
            <WhatsAppIcon sx={{ fontSize: 16 }} /> wa.me/{WHATSAPP_NUMBER}
          </a>
        </footer>
        <p className="rpt-fineprint">
          Generated by Paavan Setu · {result?.testName || 'Humanities Career Test'} · {completedLabel}
        </p>
      </div>

      {/* End of sheet */}
    </div>,
    document.body,
  );
}
