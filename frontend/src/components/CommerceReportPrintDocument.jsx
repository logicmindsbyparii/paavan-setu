import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { WHATSAPP_NUMBER } from '../constants/urls';
import { careerClusters } from '../constants/reportMeta';

/**
 * Print/PDF document for the Commerce Career Selector report.
 *
 * Mirrors ReportPrintDocument (stream/engineering selector) but authored for
 * the commerce data shape: 18 career clusters, primary/secondary/tertiary
 * tiers, and the financial vs non-financial dominant axis. Reuses the same
 * rpt-* print stylesheet, so the printed sheet looks identical in brand.
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

export default function CommerceReportPrintDocument({
  open,
  onClose,
  onPrint,
  result,
  breakdown,
  maxScore,
  high,
  medium,
  low,
  preferredDomain,
  finPoints,
  nonFinPoints,
  pace,
  breadth,
}) {
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

  const [topCluster, topScore] = breakdown[0] || ['—', 0];
  const totalPts = breakdown.reduce((s, [, v]) => s + v, 0);
  const topShare = totalPts > 0 ? Math.round((topScore / totalPts) * 100) : 0;
  const completedLabel = result?.completedAt
    ? new Date(result.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const tiers = [
    { title: 'Primary', desc: 'Strong natural fit', data: high },
    { title: 'Secondary', desc: 'Moderate alignment', data: medium },
    { title: 'Tertiary', desc: 'Low inclination', data: low },
  ];

  return createPortal(
    <div className="rpt-root" role="dialog" aria-modal="true" aria-label="Printable report">
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

      <div className="rpt-sheet" id="commerce-report-print-sheet">
        <header className="rpt-header">
          <div>
            <p className="rpt-brand">Paavan Setu</p>
            <h1 className="rpt-title">{result?.testName || 'Commerce Career Selector'}</h1>
            <p className="rpt-sub">
              {completedLabel ? `Completed ${completedLabel}` : 'Personalised assessment report'}
              {result?.timeTaken > 0 ? ` · ${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : ''}
            </p>
          </div>
          <div className="rpt-header-score">
            <p className="rpt-header-score-label">Dominant axis</p>
            <p className="rpt-header-score-value">{preferredDomain}</p>
            <p className="rpt-header-score-sub">Top cluster: {topCluster} ({topShare}% of points)</p>
          </div>
        </header>

        {/* Verdict summary */}
        <section className="rpt-section">
          <p className="rpt-fit">
            {finPoints >= nonFinPoints
              ? `Your aptitudes lean towards the financial side of commerce — ${finPoints} of your ${finPoints + nonFinPoints} cluster points came from financial domains (vs ${nonFinPoints} non-financial).`
              : `Your aptitudes lean towards the non-financial side of commerce — ${nonFinPoints} of your ${finPoints + nonFinPoints} cluster points came from creative, people and communication domains (vs ${finPoints} financial).`}
          </p>
          <div className="rpt-chip-row">
            <Chip>Strongest cluster: {topCluster} · {topScore}/12</Chip>
            <Chip>Primary fits: {high.length} clusters</Chip>
            <Chip>Financial {finPoints} · Non-financial {nonFinPoints}</Chip>
            {breadth && <Chip>{breadth.label}</Chip>}
          </div>
        </section>

        {/* Reading the result */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Reading your result</h2>
          <div className="rpt-two-col">
            <div>
              <h2 className="rpt-h3">Profile breadth</h2>
              <p>{breadth ? breadth.body : ''}</p>
            </div>
            <div>
              <h2 className="rpt-h3">Financial tilt</h2>
              <p>
                {finPoints + nonFinPoints > 0
                  ? `${Math.round((finPoints / (finPoints + nonFinPoints)) * 100)}% of your points sit in financial domains. ${finPoints >= nonFinPoints ? 'Accounting, banking, analytics and law suit this tilt.' : 'The creative, people and communication side of commerce is your home turf.'}`
                  : ''}
              </p>
            </div>
          </div>
        </section>

        {/* All cluster scores */}
        <section className="rpt-section">
          <h2 className="rpt-h2">All cluster scores</h2>
          <div className="rpt-score-list">
            {breakdown.map(([cat, score], i) => (
              <div key={cat} className={`rpt-score-row ${i === 0 ? 'rpt-score-row-top' : ''}`}>
                <div className="rpt-score-line">
                  <span className="rpt-score-name">{i + 1}. {cat}</span>
                  <span className="rpt-score-pts">{score}/12</span>
                </div>
                <Bar pct={Math.round((score / maxScore) * 100)} tone={i === 0 ? 'gold' : 'green'} />
              </div>
            ))}
          </div>
        </section>

        {/* Pace */}
        {pace?.avgAll != null && pace?.topTime?.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-h2">Where your time went</h2>
            <div className="rpt-stat-grid">
              <div className="rpt-stat"><p className="rpt-stat-value">{pace.avgAll}s</p><p className="rpt-stat-label">Avg per question</p></div>
              <div className="rpt-stat"><p className="rpt-stat-value">{Math.floor(pace.totalTime / 60)}m {pace.totalTime % 60}s</p><p className="rpt-stat-label">Total time</p></div>
              <div className="rpt-stat"><p className="rpt-stat-value">{pace.topTime.length}</p><p className="rpt-stat-label">Clusters tracked</p></div>
              <div className="rpt-stat"><p className="rpt-stat-value">{pace.timeLeader === topCluster ? 'Matched' : 'Split'}</p><p className="rpt-stat-label">Time vs score</p></div>
            </div>
            <p className="rpt-note">
              {pace.timeLeader === topCluster
                ? `You gave the most time to ${topCluster} — your attention followed your interests.`
                : `You lingered longest on ${pace.timeLeader} while ${topCluster} scored highest — curiosity beyond your leading fit.`}
            </p>
          </section>
        )}

        {/* Interest tiers */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Interest stratification</h2>
          <table className="rpt-table">
            <thead>
              <tr>
                <th className="rpt-w34">Tier</th>
                <th>Clusters (score out of 12)</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.title}>
                  <td className="rpt-td-name">
                    {t.title}
                    <span className="rpt-td-muted" style={{ display: 'block', fontSize: 11 }}>{t.desc}</span>
                  </td>
                  <td className="rpt-td-muted">
                    {t.data.length > 0
                      ? t.data.map(([cat, score]) => `${cat} (${score})`).join(' · ')
                      : 'No clusters in this tier'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Career typology */}
        <section className="rpt-section">
          <h2 className="rpt-h2">Career typology</h2>
          <table className="rpt-table">
            <thead>
              <tr>
                <th className="rpt-w34">Cluster</th>
                <th>Optimal roles</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(careerClusters).map(([cluster, roles]) => (
                <tr key={cluster} className={cluster === topCluster ? 'rpt-row-hl' : ''}>
                  <td className="rpt-td-name">{cluster}{cluster === topCluster ? ' ★' : ''}</td>
                  <td className="rpt-td-muted">{roles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <footer className="rpt-footer">
          <div>
            <h2 className="rpt-h3">Talk to a counsellor about your commerce path</h2>
            <p>
              Your dominant axis is <strong>{preferredDomain}</strong>, led by <strong>{topCluster}</strong>
              {breakdown[1] ? <> followed by <strong>{breakdown[1][0]}</strong></> : null}. A one-on-one session turns this report into stream choices and a career roadmap.
            </p>
          </div>
          <a className="rpt-footer-link" href={`https://wa.me/${WHATSAPP_NUMBER}`}>
            <WhatsAppIcon sx={{ fontSize: 16 }} /> wa.me/{WHATSAPP_NUMBER}
          </a>
        </footer>
        <p className="rpt-fineprint">
          Generated by Paavan Setu · {result?.testName || 'Commerce Career Selector'} · {completedLabel}
        </p>
      </div>
    </div>,
    document.body,
  );
}
