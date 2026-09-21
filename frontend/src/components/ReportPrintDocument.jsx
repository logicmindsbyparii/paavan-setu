import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { WHATSAPP_NUMBER } from '../constants/urls';

/**
 * Print/PDF document for the stream & engineering-branch selector report.
 *
 * Rendered into a portal outside #root so the app shell (navbar, hero
 * backgrounds, side paddings) never leaks into the printed sheet. The whole
 * document is authored as a print-first stylesheet: on screen it shows inside
 * a paper-white sheet preview with action buttons; in print media the sheet
 * becomes the page itself, buttons disappear, and colored surfaces switch to
 * print-safe ink so they survive browsers that drop background graphics.
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

export default function ReportPrintDocument({
  open,
  onClose,
  onPrint,
  result,
  breakdown,
  maxScore,
  total,
  topStream,
  topPts,
  confidence,
  runnerUp,
  marginPts,
  marginPct,
  decisive,
  aptitude,
  pace,
  interestLeaders,
  meta,
  isEngineering,
  typeName,
  answeredCount,
  questionCount,
  mistakes,
  branchMeta,
  streamMeta,
  metaFor,
  completedAt,
}) {
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

  const completedLabel = completedAt
    ? new Date(completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const gradedRows = aptitude.perSection.filter((s) => s.graded);
  const bestSection = gradedRows.length ? gradedRows.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const worstSection = gradedRows.length > 1 ? gradedRows.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const metaMap = isEngineering ? branchMeta : streamMeta;

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
            <h1 className="rpt-title">{result?.testName || 'Assessment report'}</h1>
            <p className="rpt-sub">
              {completedLabel ? `Completed ${completedLabel}` : 'Personalised assessment report'}
              {answeredCount ? ` · ${answeredCount}/${questionCount || answeredCount} questions answered` : ''}
            </p>
          </div>
          <div className="rpt-header-score">
            <p className="rpt-header-score-label">Recommended {typeName}</p>
            <p className="rpt-header-score-value">{topStream}</p>
            <p className="rpt-header-score-sub">{topPts} pts · {confidence}% of total{pace.avgAll != null ? ` · ${pace.avgAll}s per question` : ''}</p>
          </div>
        </header>

        {/* Verdict summary */}
        <section className="rpt-section">
          {meta && <p className="rpt-fit">{meta.fit}</p>}
          <div className="rpt-chip-row">
            {runnerUp && marginPct != null && (
              <Chip>{decisive ? `Clear margin of ${marginPts} pts over ${runnerUp[0]}` : `Close call: only ${marginPts} pts over ${runnerUp[0]}`}</Chip>
            )}
            {aptitude.pct != null && <Chip>Aptitude {aptitude.right}/{aptitude.total} correct ({aptitude.pct}%)</Chip>}
            {bestSection && <Chip>Strongest section: {bestSection.title} ({bestSection.pct}%)</Chip>}
            {worstSection && worstSection.title !== bestSection?.title && <Chip>Focus area: {worstSection.title} ({worstSection.pct}%)</Chip>}
          </div>
        </section>

        {/* Scores */}
        <section className="rpt-section">
          <h2 className="rpt-h2">All {typeName} scores</h2>
          <div className="rpt-score-list">
            {breakdown.map(([cat, score], i) => {
              const share = total > 0 ? Math.round((score / total) * 100) : 0;
              const m = metaFor(cat);
              return (
                <div key={cat} className={`rpt-score-row ${i === 0 ? 'rpt-score-row-top' : ''}`}>
                  <div className="rpt-score-line">
                    <span className="rpt-score-name">{i + 1}. {cat}</span>
                    <span className="rpt-score-pts">{score} pts · {share}%</span>
                  </div>
                  <Bar pct={Math.round((score / maxScore) * 100)} tone={i === 0 ? 'gold' : 'green'} />
                  {m && <p className="rpt-score-fit">{m.fit}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section-wise table */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Section-wise breakdown</h2>
          <table className="rpt-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>What it measures</th>
                <th className="rpt-right">Your result</th>
              </tr>
            </thead>
            <tbody>
              {interestLeaders.map((s) => {
                const topPct = s.totalPts > 0 ? Math.round((s.leaderPts / s.totalPts) * 100) : 0;
                const avg = pace.perSection.find((p) => p.title === s.title)?.avg;
                return (
                  <tr key={s.title}>
                    <td className="rpt-td-name">{s.title}</td>
                    <td className="rpt-td-muted">Interests &amp; work preferences</td>
                    <td className="rpt-right">
                      Lean: <strong>{s.leader}</strong> ({topPct}%)
                      {avg != null ? ` · ${avg}s avg` : ''}
                    </td>
                  </tr>
                );
              })}
              {gradedRows.map((s) => {
                const avg = pace.perSection.find((p) => p.title === s.title)?.avg;
                return (
                  <tr key={s.title}>
                    <td className="rpt-td-name">{s.title}</td>
                    <td className="rpt-td-muted">Aptitude (graded)</td>
                    <td className="rpt-right">
                      <strong>{s.right}/{s.total}</strong> correct ({s.pct}%)
                      {avg != null ? ` · ${avg}s avg` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Pace */}
        {pace.avgRight != null && pace.avgWrong != null && (
          <section className="rpt-section">
            <h2 className="rpt-h2">How you paced yourself</h2>
            <div className="rpt-stat-grid">
              <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgAll}s</p><p className="rpt-stat-label">Avg per question</p></div>
              <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgRight}s</p><p className="rpt-stat-label">On correct answers</p></div>
              <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgWrong}s</p><p className="rpt-stat-label">On incorrect answers</p></div>
              <div className="rpt-stat"><p className="rpt-stat-value">{Math.floor(pace.totalTime / 60)}m {pace.totalTime % 60}s</p><p className="rpt-stat-label">Total time</p></div>
            </div>
            <p className="rpt-note">
              {pace.avgWrong > pace.avgRight
                ? 'You spent longer on questions you missed — the hard ones held your attention. Reviewing those topics is time well spent.'
                : 'You answered quickly overall, and the misses came fast. A short pause to re-read before marking could lift your accuracy.'}
            </p>
          </section>
        )}

        {/* Careers + subjects */}
        {meta && (
          <section className="rpt-section rpt-two-col">
            <div>
              <h2 className="rpt-h3">Careers in {topStream}</h2>
              <p>{meta.careers}</p>
            </div>
            <div>
              <h2 className="rpt-h3">{isEngineering ? 'Core subjects you will study' : 'Subjects to pick (Class 11–12)'}</h2>
              <p>{meta.subjects}</p>
            </div>
          </section>
        )}

        {/* Next steps */}
        {meta && (
          <section className="rpt-section">
            <h2 className="rpt-h2">Next steps</h2>
            <ol className="rpt-steps">
              <li><strong>Confirm your subjects.</strong> {meta.subjects}</li>
              {worstSection && bestSection && worstSection.title !== bestSection.title ? (
                <li><strong>Strengthen {worstSection.title}.</strong> You scored {worstSection.pct}% here — the lowest of your aptitude sections. Focused practice now pays off in every entrance exam.</li>
              ) : (
                <li><strong>Keep your streak.</strong>{bestSection ? ` You scored ${bestSection.pct}% in ${bestSection.title} — your strongest section. Keep solving to stay sharp.` : ' Keep practising aptitude regularly.'}</li>
              )}
              <li><strong>Explore the careers.</strong> {meta.careers}</li>
              <li><strong>Talk it through.</strong> A counsellor can pressure-test this recommendation against your marks, budget and the colleges you can realistically reach.</li>
            </ol>
          </section>
        )}

        {/* Branch reference */}
        <section className="rpt-section">
          <h2 className="rpt-h2">{isEngineering ? 'Branch reference' : 'Stream typology'}</h2>
          <table className="rpt-table">
            <thead>
              <tr>
                <th className="rpt-w34">{isEngineering ? 'Branch' : 'Stream'}</th>
                <th>Typical careers</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metaMap).map(([cluster, m]) => (
                <tr key={cluster} className={cluster === topStream ? 'rpt-row-hl' : ''}>
                  <td className="rpt-td-name">{cluster}{cluster === topStream ? ' ★' : ''}</td>
                  <td className="rpt-td-muted">{m.careers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Mistakes */}
        {mistakes.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-h2">Review your mistakes ({mistakes.length})</h2>
            <div className="rpt-mistakes">
              {mistakes.map((m) => (
                <div key={m.i} className="rpt-mistake">
                  <p className="rpt-mistake-q">Q{m.i + 1}. {m.question}{m.time != null ? ` — ${m.time}s` : ''}{m.flagged ? ' · flagged' : ''}</p>
                  <p className="rpt-mistake-a">Your answer: {String(m.picked)}</p>
                  {m.explanation && <p className="rpt-mistake-ex">{m.explanation}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA — the printed sheet must carry the contact path too. */}
        <footer className="rpt-footer">
          <div>
            <h2 className="rpt-h3">Talk to a counsellor about your {typeName}</h2>
            <p>
              Your top {typeName} is <strong>{topStream}</strong>
              {runnerUp ? <> followed by <strong>{runnerUp[0]}</strong></> : null}. A one-on-one session turns this report into subject choices and a study roadmap.
            </p>
          </div>
          <a className="rpt-footer-link" href={`https://wa.me/${WHATSAPP_NUMBER}`}>
            <WhatsAppIcon sx={{ fontSize: 16 }} /> wa.me/{WHATSAPP_NUMBER}
          </a>
        </footer>
        <p className="rpt-fineprint">
          Generated by Paavan Setu · {result?.testName || 'Assessment'} · {completedLabel}
        </p>
      </div>
    </div>,
    document.body,
  );
}
