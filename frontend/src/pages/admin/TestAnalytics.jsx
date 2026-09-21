import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  Box, Typography, Card, CardContent, Tooltip, CircularProgress, Grid, Chip,
  TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, IconButton, Skeleton, Tabs, Tab, Divider,
  LinearProgress, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  Assessment, TrendingUp, Mail, BarChart, PieChart, Download, Warning, Info, 
  Search, Clear, Delete, Close as CloseIcon, Visibility, Refresh, PictureAsPdf,
  ExpandMore, ExpandLess
} from '@mui/icons-material';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { adminRequest, adminGetTests, adminGetTestAnalytics, adminGetTestAnalyticsBySlug, logApiFailure, resolveTestImage } from '../../lib/api';
import FormAlerts from '../../components/ui/FormAlerts';

const COLORS = ['#e8b86d', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#f87171', '#4ade80'];

/* ─── CSV export ───────────────────────────────────────────────────────────
   Carries the outcome columns an admin actually reports on — score, verdict,
   attempt status, how far the attempt got — not just the category vector, and
   respects whatever filters are currently applied. */
/* Quotes/escapes a cell, and defuses the leading = + - @ that Excel would
   otherwise run as a formula — a learner's own name is attacker-controlled. */
const csvCell = (value) => {
  let s = String(value == null ? '' : value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

function downloadCsv(rows, filename) {
  if (rows.length === 0) return;
  const header = [
    'User Name', 'User Email', 'Test Name', 'Status', 'Score', 'Max Score',
    'Percentage', 'Passed', 'Top Recommendation', 'Questions Reached',
    'Time Taken', 'Date', 'Category Scores',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    const catScores = Object.entries(r.resultData || {}).map(([k, v]) => `${k}:${v}`).join('; ');
    lines.push([
      r.user?.name || 'Anonymous',
      r.user?.email || '—',
      r.testName || '—',
      r.status === 'abandoned' ? 'Abandoned' : 'Completed',
      r.score ?? '—',
      r.maxScore ?? '—',
      r.percentage ?? '—',
      r.passed === true ? 'Yes' : r.passed === false ? 'No' : '—',
      r.topRecommendation || '—',
      r.lastQuestionIndex != null ? r.lastQuestionIndex + 1 : '—',
      r.timeTaken > 0 ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '—',
      attemptDate(r) ? new Date(attemptDate(r)).toLocaleString('en-IN') : '—',
      catScores,
    ].map(csvCell).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking in the same tick can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ─── Format helpers ─────────────────────────────────────────────────────── */
const formatTime = (sec) => {
  // 0/null means "no data", not "under a minute" — an untimed or unsat test
  // used to report an average of "< 1m".
  if (!sec) return '—';
  if (sec < 60) return '< 1m';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Attempts that were abandoned have no `completedAt`; fall back through the
 *  timestamps that always exist so a row never dates itself 'Invalid Date'. */
const attemptDate = (r) => r?.completedAt || r?.updatedAt || r?.createdAt || null;

const formatRelative = (d) => {
  if (!d) return '—';
  const then = new Date(d).getTime();
  if (Number.isNaN(then)) return '—';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
};

/* ─── Dashboard Skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <Grid container spacing={3} className="mb-6">
      <Grid item xs={12} sm={6} md={3}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px', bgcolor: '#ffffff' }} />
      </Grid>
      {[1,2,3].map(i => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px', bgcolor: '#ffffff' }} />
        </Grid>
      ))}
    </Grid>
  );
}

/* ─── Per-test analytics card ────────────────────────────────────────────── */
function TestCard({ t, isSelected, onClick }) {
  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      sx={{
        bgcolor: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.03)',
        position: 'relative',
        '&:hover': {
          borderColor: '#10b981',
          transform: 'translateY(-3px)',
          bgcolor: '#ffffff',
          boxShadow: '0 12px 30px 0 rgba(0,0,0,0.08)',
        },
        ...(isSelected ? {
          borderColor: '#34d399',
          bgcolor: '#f0fdf4',
        } : {}),
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(52,211,153,0.15)', flexShrink: 0 }}>
          <TrendingUp sx={{ color: '#34d399', fontSize: 24 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.name}
          </Typography>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', mt: 0.25 }}>
            {t.submissions}
          </Typography>
          {/* The submission count is the headline number above, and the dropped
              count is on the line below — this row only carries Avg. */}
          <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mt: 0.2 }}>
            Avg time: {formatTime(t.avgTimeSeconds)}
          </Typography>
          {/* Completion rate is the number that says whether the test holds
              people to the end — abandoned attempts included. */}
          <Typography
            sx={{
              fontSize: '0.7rem', mt: 0.4, fontWeight: 700,
              color: t.completionRate == null
                ? 'rgba(0, 0, 0, 0.35)'
                : t.completionRate >= 80 ? '#34d399' : t.completionRate >= 60 ? '#f5d9a0' : '#f87171',
            }}
          >
            {t.completionRate == null ? 'No attempts yet' : `${t.completionRate}% completion`}
            {t.abandoned > 0 ? ` · ${t.abandoned} dropped` : ''}
          </Typography>
        </Box>
        {isSelected && (
          <Tooltip title="Selected" placement="top">
            <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: '#d1fae5' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>
            </Box>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
function EmptyDashboard() {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Assessment sx={{ color: '#d1d5db', fontSize: 56 }} />
      <Typography variant="h6" sx={{ color: '#6b7280', mt: 2 }}>
        No test data yet
      </Typography>
      <Typography sx={{ color: '#9ca3af', mt: 1 }}>
        Analytics will appear once users complete assessments.
      </Typography>
    </Box>
  );
}

/* Attempt-level review. Beyond the profile radar this surfaces what the attempt
   record already stores and nothing displayed: the verdict, and the per-question
   trail (chosen option, correctness, time, flags) mapped back to the question
   text it came from. */
/* The verdict for one column of the review table. `correct === null` on a
   question that *is* keyed means the attempt predates that question being
   keyed, so "no record" is the honest answer — never a wrong-answer verdict. */
function answerVerdict({ correct, answered, correctText }) {
  const key = correctText ? ` — key: ${correctText}` : '';
  if (correct === true) return { label: 'Yes', color: '#34d399' };
  if (correct == null) return { label: `No record${key}`, color: '#9ca3af' };
  return answered
    ? { label: `No${key}`, color: '#ef4444' }
    : { label: `Skipped${key}`, color: '#9ca3af' };
}

/* ─── Text-based PDF report ────────────────────────────────────────────────
   Built from jsPDF primitives — never a screenshot — so long reports paginate
   cleanly: selectable text, repeated table headers, page numbers, drawn share
   bars, and no canvas pixel limits or mid-row cuts. Every figure is passed in
   from the same memos the screen renders, so screen and file always agree. */

/* helvetica covers WinAnsi only: normalise the punctuation the report uses so
   dashes/quotes render, and strip anything else (e.g. emoji) instead of
   letting it corrupt the layout. */
const pdfClean = (s) => String(s ?? '')
  .replace(/[—–]/g, '-')
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/•/g, '-')
  .replace(/→/g, '->')
  .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
  .trim();

const pdfFile = (s) => pdfClean(s).replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 60) || 'report';

/* Minimal flow layout: cursor `y`, `need(h)` paginates before overflow, footer
   (title + page numbers) is stamped on every page at the end. */
function pdfDoc(title) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const M = 15;
  const W = 210 - M * 2;
  const BOTTOM = 297 - 18;
  let y = M;
  const need = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
  const gap = (h) => { y += h; };
  const footer = (leftLabel) => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setDrawColor(220);
      doc.line(M, 287, 210 - M, 287);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(pdfClean(leftLabel), M, 292);
      doc.text(`Page-${i}`, 210 - M, 292, { align: 'right' });
    }
  };
  return { doc, M, W, BOTTOM, need, gap, footer, getY: () => y, setY: (v) => { y = v; } };
}

function pdfHeading(L, text, size = 13) {
  L.need(12);
  L.doc.setFont('helvetica', 'bold');
  L.doc.setFontSize(size);
  L.doc.setTextColor(17, 24, 39);
  L.doc.text(pdfClean(text), L.M, L.getY() + 6);
  L.setY(L.getY() + 10);
}

function pdfPara(L, text, { size = 10, color = [55, 65, 81], vgap = 2 } = {}) {
  const lines = L.doc.splitTextToSize(pdfClean(text), L.W);
  L.need(lines.length * (size * 0.45) + vgap);
  L.doc.setFont('helvetica', 'normal');
  L.doc.setFontSize(size);
  L.doc.setTextColor(...color);
  L.doc.text(lines, L.M, L.getY() + size * 0.35);
  L.setY(L.getY() + lines.length * (size * 0.45) + vgap);
}

function pdfBullets(L, items) {
  items.forEach(({ head, body }) => {
    const line = head ? `${head}: ${body}` : body;
    const lines = L.doc.splitTextToSize(`- ${pdfClean(line)}`, L.W - 4);
    L.need(lines.length * 4.6 + 1.5);
    L.doc.setFont('helvetica', head ? 'bold' : 'normal');
    L.doc.setFontSize(10);
    L.doc.setTextColor(55, 65, 81);
    L.doc.text(lines, L.M + 4, L.getY() + 3.5);
    L.setY(L.getY() + lines.length * 4.6 + 1.5);
  });
  L.gap(2);
}

/* Simple wrapped table: repeats the header after each page break, draws row
   rules, and never splits a row across pages. `cols` = [{ w, bold, align }]. */
function pdfTable(L, head, rows, cols) {
  const rowH = (cells) => {
    let lines = 1;
    cells.forEach((c, i) => {
      const n = L.doc.splitTextToSize(pdfClean(c), cols[i].w - 3).length;
      if (n > lines) lines = n;
    });
    return Math.max(7, lines * 4.6 + 2.5);
  };
  const drawHead = () => {
    L.need(9);
    L.doc.setFillColor(249, 250, 251);
    L.doc.rect(L.M, L.getY(), L.W, 8, 'F');
    L.doc.setFont('helvetica', 'bold');
    L.doc.setFontSize(8.5);
    L.doc.setTextColor(75, 85, 99);
    let x = L.M;
    head.forEach((h, i) => {
      L.doc.text(pdfClean(h), x + 1.5, L.getY() + 5.5);
      x += cols[i].w;
    });
    L.setY(L.getY() + 8);
  };
  drawHead();
  rows.forEach((cells) => {
    const h = rowH(cells);
    L.need(h);
    let x = L.M;
    L.doc.setFontSize(9);
    L.doc.setTextColor(17, 24, 39);
    cells.forEach((c, i) => {
      L.doc.setFont('helvetica', cols[i].bold ? 'bold' : 'normal');
      const lines = L.doc.splitTextToSize(pdfClean(c), cols[i].w - 3);
      L.doc.text(lines, x + 1.5, L.getY() + 4.5);
      x += cols[i].w;
    });
    L.setY(L.getY() + h);
    L.doc.setDrawColor(243, 244, 246);
    L.doc.line(L.M, L.getY(), L.M + L.W, L.getY());
  });
  L.gap(4);
}

/* Radar (spider) map drawn with primitives: grid rings + spokes, the
   learner's filled polygon, and a dashed cohort-average overlay. Gives the
   printed report the same shape comparison the screen radar shows. Skipped
   when there are too few (or far too many) dimensions to read. */
function pdfRadar(L, items) {
  const pts = items.filter(x => Number.isFinite(Number(x.value)));
  if (pts.length < 3 || pts.length > 24) return;
  const H = 108;
  L.need(H + 8);
  const top = L.getY();
  const cx = L.M + L.W / 2;
  const cy = top + 50;
  const R = 40;
  const maxV = Math.max(1, ...pts.map(x => Math.max(Number(x.value) || 0, Number(x.cohort) || 0)));
  const pos = (frac, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / pts.length;
    return [cx + Math.cos(a) * R * frac, cy + Math.sin(a) * R * frac];
  };
  // Grid rings + spokes
  L.doc.setDrawColor(229, 231, 235);
  L.doc.setLineWidth(0.2);
  [1 / 3, 2 / 3, 1].forEach(f => L.doc.circle(cx, cy, R * f, 'D'));
  pts.forEach((_, i) => {
    const [x, y] = pos(1, i);
    L.doc.line(cx, cy, x, y);
  });
  // Closed polygon path from absolute vertices.
  const poly = (vals, fill, color, dash) => {
    const abs = vals.map((v, i) => pos(Math.max(0, Math.min(1, (Number(v) || 0) / maxV)), i));
    L.doc.setDrawColor(...color);
    if (dash) L.doc.setLineDashPattern([2, 1.5], 0);
    L.doc.setLineWidth(fill ? 0.6 : 0.5);
    if (fill) L.doc.setFillColor(209, 250, 229);
    const [[sx, sy], ...rest] = abs;
    L.doc.moveTo(sx, sy);
    rest.forEach(([x, y]) => L.doc.lineTo(x, y));
    L.doc.close();
    if (fill) L.doc.fillStroke();
    else L.doc.stroke();
    L.doc.setLineDashPattern([], 0);
    L.doc.setLineWidth(0.2);
  };
  poly(pts.map(x => x.value), true, [16, 185, 129]);
  if (pts.some(x => x.cohort != null)) {
    poly(pts.map(x => x.cohort), false, [100, 116, 139], true);
  }
  // Vertex labels
  L.doc.setFont('helvetica', 'normal');
  L.doc.setFontSize(7);
  L.doc.setTextColor(75, 85, 99);
  pts.forEach((x, i) => {
    const [lx, ly] = pos(1.22, i);
    L.doc.text(pdfClean(x.label).slice(0, 16), Math.max(L.M, Math.min(L.M + L.W - 30, lx - 15)), ly + 2);
  });
  // Legend
  const ly = top + 100;
  L.doc.setFillColor(16, 185, 129);
  L.doc.rect(cx - 42, ly - 3, 5, 3.5, 'F');
  L.doc.setFontSize(8);
  L.doc.setTextColor(75, 85, 99);
  L.doc.text('This attempt', cx - 35, ly);
  L.doc.setDrawColor(100, 116, 139);
  L.doc.setLineDashPattern([2, 1.5], 0);
  L.doc.line(cx + 8, ly - 1.5, cx + 15, ly - 1.5);
  L.doc.setLineDashPattern([], 0);
  L.doc.text('Cohort avg', cx + 17, ly);
  L.setY(top + H + 4);
}

/* Horizontal share bar drawn with rects (charts stay on screen; the file gets
   the same numbers with a visual weight). */
function pdfBars(L, items, max) {
  items.forEach(({ label, value, note }) => {
    L.need(11);
    const y = L.getY();
    L.doc.setFont('helvetica', 'bold');
    L.doc.setFontSize(9);
    L.doc.setTextColor(17, 24, 39);
    L.doc.text(pdfClean(label).slice(0, 40), L.M, y + 4);
    const barX = L.M + 62;
    const barW = L.W - 62 - 34;
    const frac = max > 0 ? Math.max(0, Math.min(1, Number(value) / max)) : 0;
    L.doc.setFillColor(243, 244, 246);
    L.doc.rect(barX, y, barW, 5, 'F');
    L.doc.setFillColor(16, 185, 129);
    L.doc.rect(barX, y, barW * frac, 5, 'F');
    L.doc.setFont('helvetica', 'normal');
    L.doc.setTextColor(75, 85, 99);
    L.doc.text(pdfClean(note).slice(0, 30), barX + barW + 2, y + 4);
    L.setY(y + 10);
  });
  L.gap(2);
}

function buildCounsellingPdf(d) {
  const title = `${d.testName} - Counselling Report`;
  const L = pdfDoc(title);
  const { doc } = L;

  // Branded title band (navy) + learner info block, reference-report style.
  doc.setFillColor(17, 34, 64);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(pdfClean(d.testName).slice(0, 55), L.M, 13);
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  let iy = 29;
  [
    `Name: ${d.learner}`,
    `Email: ${d.email}`,
    `Date: ${d.when}`,
    `Test: ${d.testName}  |  Status: ${d.status}  |  Mode: ${d.mode}`,
  ].forEach((line) => {
    doc.setFont('helvetica', 'normal');
    doc.text(pdfClean(line).slice(0, 95), L.M, iy);
    iy += 5.5;
  });
  L.setY(iy + 3);

  // Key outcome
  pdfHeading(L, 'Key Outcome');
  if (d.isScored) {
    pdfPara(L, `Score: ${d.percentage}% (${d.score}/${d.maxScore}) - ${d.passedText}${d.rank ? `  |  Ranked #${d.rank.rank} of ${d.rank.of} completed attempts for this test.` : ''}`);
  } else {
    pdfPara(L, `Top alignment: ${d.topRecommendation}${d.topShare ? ` (${d.topShare})` : ''}`);
  }
  pdfPara(L, `Accuracy: ${d.accuracyLine}  |  Completion: ${d.completionLine}  |  Total time: ${d.timeLine}  |  Flagged: ${d.flaggedCount}`);

  // How to read (reference-style guidance, personalised)
  pdfHeading(L, 'How to read this report');
  pdfPara(L, d.howTo);

  // Talking points
  if (d.insights.length > 0) {
    pdfHeading(L, 'Counsellor Talking Points');
    pdfBullets(L, d.insights.map(i => ({ head: i.title, body: i.text })));
  }

  // Preferred domain (measured only — present only when sections yielded points)
  if (d.domains.length >= 2) {
    pdfHeading(L, `Preferred domain: ${d.domains[0].name}`);
    pdfPara(L, `${d.firstName}'s points fall ${d.domains[0].share}% in ${d.domains[0].name} against ${d.domains.slice(1).map(x => `${x.share}% in ${x.name}`).join(', ')} - the larger share is the preferred domain for this attempt.`);
  }

  // Dimensions (profile) with bars
  if (!d.isScored && d.dimensions.length > 0) {
    pdfHeading(L, 'Interest Dimensions');
    pdfPara(L, 'Share = dimension points as a percentage of this attempt\'s total. Cohort avg is the mean for the same test.', { size: 9, color: [107, 114, 128] });
    const maxRaw = Math.max(...d.dimensions.map(x => x.raw), 1);
    pdfBars(L, d.dimensions.map(x => ({
      label: `#${x.rank} ${x.name}`,
      value: x.raw,
      note: `${x.raw} pts, ${x.share}% [${x.band}]${x.cohortAvg != null ? ` (avg ${x.cohortAvg})` : ''}`,
    })), maxRaw);
    pdfHeading(L, 'Dimension map', 11);
    pdfRadar(L, d.dimensions.map(x => ({ label: x.name, value: x.raw, cohort: x.cohortAvg })));
    const bandLine = ['High', 'Medium', 'Low']
      .map(b => `${b}: ${(d.bands[b] || []).join(', ') || '-'}`)
      .join('  |  ');
    pdfPara(L, `Interest bands (relative to your top dimension): ${bandLine}`, { size: 9 });
    pdfPara(L, `Career reading (this attempt only): strongest alignment ${d.dimensions[0].name} (${d.dimensions[0].share}% share)${d.dimensions.length > 1 ? `; also notable ${d.dimensions[1].name} (${d.dimensions[1].share}%)` : ''}${(d.bands.High || []).length > 0 ? `. Recommend starting from the High band: ${d.bands.High.join(', ')}` : ''}. Map these to career families through your counselling framework - the test measures interest alignment, not ability. Lowest alignment (${d.dimensions[d.dimensions.length - 1].name}) is contrast, not a verdict. Specific job titles are deliberately not listed: this test records dimension alignment only.`, { size: 9 });
  }

  // Sections
  if (d.sections.length > 0) {
    pdfHeading(L, 'Section-wise Performance');
    if (d.isScored) {
      pdfTable(L,
        ['Section', 'Answered', 'Correct', 'Accuracy', 'Avg time'],
        d.sections.map(s => [s.name, `${s.answered}/${s.total}`, String(s.correct), s.accuracy != null ? `${s.accuracy}%` : '-', s.avgTime != null ? `${s.avgTime}s` : '-']),
        [{ w: 70 }, { w: 28 }, { w: 28 }, { w: 28 }, { w: 26 }].map(c => ({ ...c, w: (c.w / 180) * L.W })));
    } else {
      pdfTable(L,
        ['Section', 'Answered', 'Top lean', 'Avg time'],
        d.sections.map(s => [s.name, `${s.answered}/${s.total}`, s.topDim ? `${s.topDim.name} (+${s.topDim.pts})` : '-', s.avgTime != null ? `${s.avgTime}s` : '-']),
        [{ w: 70 }, { w: 28 }, { w: 56 }, { w: 26 }].map(c => ({ ...c, w: (c.w / 180) * L.W })));
    }
  }

  // Scored extras: difficulty + tags
  if (d.isScored && d.difficulty.length > 0) {
    pdfHeading(L, 'Accuracy by Difficulty', 11);
    pdfBullets(L, d.difficulty.map(t => ({ body: `${t.tier}: ${t.text}` })));
  }
  if (d.isScored && d.tags.length > 0) {
    pdfHeading(L, 'Accuracy by Topic', 11);
    pdfBullets(L, d.tags.map(t => ({ body: `${t.name}: ${t.accuracy}% (${t.correct}/${t.total})` })));
  }
  if (d.isScored && d.buckets.length > 0) {
    pdfHeading(L, 'Cohort Score Spread (this attempt marked *)', 11);
    pdfBullets(L, d.buckets.map(b => ({ body: `${b.label}: ${b.count} attempt(s)${b.mine ? '  * YOU' : ''}` })));
  }

  // Questions — full bank order, skips included
  pdfHeading(L, `Question-level Analysis (${d.answeredCount}/${d.totalQuestions} answered)`);
  pdfTable(L,
    ['Q', 'Section', 'Question / response', 'Result', 'Time'],
    d.rows.map(r => [String(r.idx + 1), r.section, `${r.question}\nResponse: ${r.response}`, r.result, r.time]),
    [{ w: 10, bold: true }, { w: 28 }, { w: 96 }, { w: 24 }, { w: 22 }].map(c => ({ ...c, w: (c.w / 180) * L.W })));

  // Behaviour
  pdfHeading(L, 'Attempt Behaviour');
  pdfBullets(L, d.behaviourLines.map(body => ({ body })));
  if (d.posLine) pdfPara(L, d.posLine, { size: 9 });

  pdfHeading(L, 'Suggested Session Flow', 11);
  pdfBullets(L, d.sessionFlow.map(body => ({ body })));

  // Free-text notes written during the session (may be empty).
  if (d.notes) {
    pdfHeading(L, 'Counsellor Notes', 11);
    pdfPara(L, d.notes);
  }

  pdfPara(L, 'Sources: this attempt\'s stored answers, timings and flags; the test bank (sections, difficulty, tags); cohort aggregates for this test. The printed bars and dimension map are drawn from the same numbers as the on-screen charts. Career language reflects measured alignment only.', { size: 8.5, color: [156, 163, 175] });

  L.footer(d.firstName);
  doc.save(d.filename);
}

/* Which section of the bank a question belongs to. Tests without sections run
   in flat mode — every item reports under "General". */
function sectionOf(test, idx) {
  for (const s of (test?.sections || [])) {
    if ((s.questionIndices || []).includes(idx)) return s.title || 'Section';
  }
  return (test?.sections || []).length > 0 ? 'General' : 'General';
}

/* Counsellor report for a single attempt. Tabs keep the density navigable on
   screen; "Download PDF" builds a separate paginated text report from the
   same numbers (never a screenshot). `cohort` carries the per-test aggregates
   and `rank` the learner's standing among completed attempts. */
function ResultDetailsDialog({ open, onClose, result, test, cohort, rank }) {
  const [isExporting, setIsExporting] = useState(false);
  const [tab, setTab] = useState(0);
  const [qFilter, setQFilter] = useState('all');
  const [expandedQ, setExpandedQ] = useState(null);
  const [notes, setNotes] = useState('');
  /* Free-text session notes. In-memory only (no backend field) — clearly
     labelled as such — and passed into the PDF so the downloaded file carries
     what the counsellor wrote during the session. */
  // Reset per-report UI for each new attempt — otherwise the dialog reopens on
  // the previous report's tab, filter and expanded question.
  useEffect(() => { if (open) { setTab(0); setQFilter('all'); setExpandedQ(null); setNotes(''); } }, [open, result?._id]);

  /* Export builds the same numbers the screen shows into a paginated,
     selectable-text PDF (see buildCounsellingPdf) — no screenshot, so long
     reports never clip and pages never cut rows. */
  const handleDownloadPdf = async () => {
    if (!result || isExporting) return;
    try {
      setIsExporting(true);
      // Let the button paint before the synchronous build blocks the thread.
      await new Promise(resolve => setTimeout(resolve, 50));
      const bucketOf = (pct) => {
        const bounds = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100.01]];
        return bounds.findIndex(([lo, hi]) => pct >= lo && pct < hi);
      };
      const myBucket = result.percentage != null ? bucketOf(result.percentage) : -1;
      buildCounsellingPdf({
        testName: test?.name || result.testName || 'Assessment',
        learner: result.user?.name || 'Anonymous',
        firstName,
        email: result.user?.email || 'No email provided',
        when: attemptDate(result) ? new Date(attemptDate(result)).toLocaleString('en-IN') : '-',
        status: result.status === 'abandoned' ? 'Abandoned' : 'Completed',
        mode: isScored ? 'scored' : 'profile',
        isScored,
        percentage: result.percentage,
        score: result.score,
        maxScore: result.maxScore,
        passedText: result.passed === true ? 'Passed' : result.passed === false ? 'Did not pass' : 'No pass mark set',
        rank,
        topRecommendation: result.topRecommendation || 'N/A',
        topShare: !isScored && dimensions.length > 0 ? `${dimensions[0].raw} pts, ${dimensions[0].share}% of total` : null,
        accuracyLine: accuracyPct != null ? `${accuracyPct}% (${correctCount}/${answeredCount} answered)` : 'n/a (profile test)',
        completionLine: completionPct != null ? `${completionPct}% (${answeredCount}/${questions.length})` : '-',
        timeLine: result.timeTaken > 0 ? formatTime(result.timeTaken) : '-',
        flaggedCount,
        howTo: isScored
          ? `${firstName}'s score is correct answers out of keyed questions only - unkeyed items never count for or against. Accuracy (correct of answered) and completion (answered of total) tell different stories: low accuracy with full completion is a preparation signal, while high accuracy with many skips is a time-management signal. Cohort figures compare against other completed attempts of this same test.`
          : `${firstName}, each dimension shows your alignment points, its share of your total, and the cohort average for this test. The band is relative to your own top dimension - High (67% or more of your top score) is a genuine direction to explore first, Medium (33-66%) is worth developing, Low (under 33%) is contrast, not a verdict on ability.`,
        domains: domainTotals,
        bands: bandGroups,
        insights: counselorInsights || [],
        dimensions,
        sections: sectionPerf,
        difficulty: isScored && advancedStats
          ? ['beginner', 'intermediate', 'advanced']
            .map(tier => ({ tier, st: advancedStats.difficultyStats[tier] }))
            .filter(({ st }) => st && st.total > 0)
            .map(({ tier, st }) => ({ tier, text: `${Math.round((st.correct / st.total) * 100)}% (${st.correct}/${st.total})` }))
          : [],
        tags: isScored && advancedStats ? advancedStats.tagChartData.map(t => ({ name: t.name, accuracy: t.accuracy, correct: Math.round((t.accuracy / 100) * t.total), total: t.total })) : [],
        buckets: (cohort?.scoreDistribution || []).map((b, i) => ({ label: b.label, count: b.count, mine: i === myBucket })),
        answeredCount,
        totalQuestions: questions.length,
        rows: questionRows.map(r => ({
          idx: r.idx,
          section: r.section,
          question: r.question || '(no text)',
          response: r.chosen || 'skipped',
          result: isScored ? r.verdict.label : (r.points || '-'),
          time: r.time == null ? '-' : `${r.time}s${r.cohortAvgTime != null ? ` (avg ${r.cohortAvgTime}s)` : ''}`,
        })),
        behaviourLines: [
          test?.timeLimit != null && questions.length > 0
            ? `Time budget: ${test.timeLimit} min (~${Math.round((test.timeLimit * 60) / questions.length)}s per question); used ${result.timeTaken > 0 ? formatTime(result.timeTaken) : 'no time recorded'}.`
            : null,
          `First-half pace: ${behaviour?.firstAvg != null ? `~${behaviour.firstAvg.toFixed(0)}s per question` : 'no timing data'}.`,
          `Second-half pace: ${behaviour?.secondAvg != null ? `~${behaviour.secondAvg.toFixed(0)}s per question` : 'no timing data'}.`,
          isScored ? `Best run of consecutive correct answers: ${behaviour?.bestStreak ?? 0}.` : null,
          `Skipped ${skippedCount}, flagged ${flaggedCount} - review skipped items first, flagged second.`,
          behaviour?.slowQs?.length > 0 ? `Slowest vs cohort: Q${behaviour.slowQs[0].idx + 1} took ${behaviour.slowQs[0].time}s (cohort avg ${behaviour.slowQs[0].cohortAvgTime}s).` : null,
        ].filter(Boolean),
        posLine: behaviour && Object.keys(behaviour.posCounts).length > 0
          ? `Answer positions: ${Object.entries(behaviour.posCounts).sort().map(([p, n]) => `${p}=${n}`).join(', ')}.`
          : null,
        sessionFlow: [
          `Open with the headline (${isScored ? `score ${result.percentage ?? '-'}%` : `top alignment ${result.topRecommendation || '-'}`}) and one genuine strength.`,
          ...(flaggedCount > 0 ? [`Walk through the ${flaggedCount} flagged question(s) - the learner already marked their uncertainty.`] : []),
          ...(skippedCount > 0 ? [`Ask about the ${skippedCount} skipped item(s): time pressure, avoidance, or wording?`] : []),
          'Close with one concrete next step, not five.',
        ],
        notes: notes.trim(),
        filename: `${pdfFile(test?.slug || result.testSlug || 'test')}_${pdfFile(result.user?.name || 'anonymous')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  /* Radar points: this attempt plus the cohort average on the same axes, so
     the shape comparison is visual, not just tabular. */
  const chartData = useMemo(() => {
    const data = Object.entries(result?.resultData || {}).map(([subject, A]) => ({
      subject,
      A,
      cohort: cohort?.categoryScores?.[subject] ?? null,
    }));
    return data.sort((a, b) => b.A - a.A);
  }, [result, cohort]);
  const chartHasCohort = useMemo(
    () => chartData.some(d => d.cohort != null),
    [chartData]);

  const questions = test?.questions || [];
  const isScored = test?.scoringMode === 'scored';
  const cohortQStats = useMemo(() => {
    const map = {};
    (cohort?.perQuestionStats || []).forEach(q => { map[q.index] = q; });
    return map;
  }, [cohort]);

  /* Every item in the bank, in order — skipped questions included. The old
     `.filter(answered || flagged)` silently dropped every question the learner
     never reached, so completion counts and the response table disagreed with
     each other and the PDF showed a "complete" report with holes in it. */
  const questionRows = useMemo(() => {
    const stats = result?.questionStats || {};
    return questions.map((q, idx) => {
        const s = stats[String(idx)] || {};
        const chosenIdx = s.selectedOption;
        const chosen = chosenIdx >= 0 ? q.options?.[chosenIdx] : null;
        const row = {
          idx,
          section: sectionOf(test, idx),
          difficulty: q.difficulty || 'intermediate',
          tags: q.tags || [],
          question: q.question,
          chosen: chosen?.text || null,
          correctText: q.correctOptionIndex != null ? q.options?.[q.correctOptionIndex]?.text : null,
          correct: s.correct,
          points: chosen?.points && Object.keys(chosen.points).length > 0
            ? Object.entries(chosen.points)
              .map(([cat, val]) => `${cat} ${Number(val) > 0 ? '+' : ''}${val}`)
              .join(' · ')
            : null,
          time: s.timeSpentSeconds,
          cohortAvgTime: cohortQStats[idx]?.avgTimeSeconds ?? null,
          flagged: Boolean(s.flagged),
          answered: chosenIdx >= 0,
        };
        return { ...row, verdict: answerVerdict(row) };
      });
  }, [result, questions, test, cohortQStats]);

  const answeredCount = questionRows.filter((r) => r.answered).length;
  const skippedCount = questionRows.length - answeredCount;
  const flaggedCount = questionRows.filter((r) => r.flagged).length;
  const correctCount = questionRows.filter((r) => r.correct === true).length;
  const wrongCount = questionRows.filter((r) => r.answered && r.correct === false).length;
  const slowCount = questionRows.filter((r) =>
    r.time != null && r.cohortAvgTime != null && r.cohortAvgTime >= 5 && r.time >= r.cohortAvgTime * 2).length;

  /* Question-table filter — with long banks a counsellor needs to isolate the
     items worth discussing, not scroll all of them. Counts are live. */
  const visibleRows = useMemo(() => questionRows.filter((r) => {
    switch (qFilter) {
      case 'incorrect': return r.answered && r.correct === false;
      case 'skipped': return !r.answered;
      case 'flagged': return r.flagged;
      case 'slow': return r.time != null && r.cohortAvgTime != null && r.cohortAvgTime >= 5 && r.time >= r.cohortAvgTime * 2;
      default: return true;
    }
  }), [questionRows, qFilter]);

  /* Learner's bucket in the cohort score spread (same boundaries the backend
     uses), so the overview can mark "you are here". */
  const learnerBucket = useMemo(() => {
    if (!isScored || result?.percentage == null || !cohort?.scoreDistribution) return -1;
    const bounds = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100.01]];
    return bounds.findIndex(([lo, hi]) => result.percentage >= lo && result.percentage < hi);
  }, [isScored, result, cohort]);
  const accuracyPct = answeredCount > 0 && isScored
    ? Math.round((correctCount / answeredCount) * 100)
    : null;
  const completionPct = questions.length > 0
    ? Math.round((answeredCount / questions.length) * 100)
    : null;

  const advancedStats = useMemo(() => {
    if (!isScored || questionRows.length === 0) return null;
    
    let totalTimeCorrect = 0;
    let correctCount = 0;
    let totalTimeIncorrect = 0;
    let incorrectCount = 0;
    
    const difficultyStats = { beginner: { correct: 0, total: 0 }, intermediate: { correct: 0, total: 0 }, advanced: { correct: 0, total: 0 } };
    const tagStats = {};

    questionRows.forEach((r) => {
       const q = questions[r.idx];
       if (!q) return;

       const isCorrect = r.correct === true;
       const time = r.time || 0;

       if (r.answered) {
         if (isCorrect) {
           totalTimeCorrect += time;
           correctCount++;
         } else {
           totalTimeIncorrect += time;
           incorrectCount++;
         }
       }

       const diff = q.difficulty || 'intermediate';
       if (difficultyStats[diff]) {
         difficultyStats[diff].total++;
         if (isCorrect) difficultyStats[diff].correct++;
       }

       if (q.tags && q.tags.length > 0) {
         q.tags.forEach(t => {
           if (!tagStats[t]) tagStats[t] = { correct: 0, total: 0 };
           tagStats[t].total++;
           if (isCorrect) tagStats[t].correct++;
         });
       }
    });

    const tagChartData = Object.entries(tagStats).map(([tag, stats]) => ({
      name: tag,
      accuracy: Math.round((stats.correct / stats.total) * 100) || 0,
      total: stats.total
    })).sort((a, b) => b.accuracy - a.accuracy);

    return {
      avgTimeCorrect: correctCount > 0 ? (totalTimeCorrect / correctCount).toFixed(1) : 0,
      avgTimeIncorrect: incorrectCount > 0 ? (totalTimeIncorrect / incorrectCount).toFixed(1) : 0,
      avgTime: (correctCount + incorrectCount) > 0 ? ((totalTimeCorrect + totalTimeIncorrect) / (correctCount + incorrectCount)).toFixed(1) : 0,
      difficultyStats,
      tagChartData
    };
  }, [questionRows, questions, isScored]);

  /* ── Interest / career dimensions (profile tests) ──────────────────────
     Raw points mislead — a 12 in a high-weight bank is not a 12 elsewhere —
     so each dimension is shown with its share of the learner's total, its
     rank, and the cohort average for the same test. `norm` scores every
     dimension against the learner's own top dimension (0-100) and maps to an
     interest band — High ≥67, Medium 33-66, Low <33 — the generic form of the
     High/Medium/Low interest bands counsellors read from. All figures come
     from this attempt's stored resultData plus the cohort aggregates; nothing
     is inferred beyond them. */
  const bandOf = (norm) => (norm >= 66.7 ? 'High' : norm >= 33.3 ? 'Medium' : 'Low');
  const dimensions = useMemo(() => {
    const entries = Object.entries(result?.resultData || {});
    if (entries.length === 0) return [];
    const total = entries.reduce((s, [, v]) => s + (Number(v) || 0), 0);
    const top = Math.max(...entries.map(([, v]) => Number(v) || 0), 0);
    return entries
      .map(([name, raw]) => {
        const value = Number(raw) || 0;
        const cohortAvg = cohort?.categoryScores?.[name] ?? null;
        const norm = top > 0 ? Math.round((value / top) * 1000) / 10 : 0;
        return {
          name,
          raw: value,
          share: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
          norm,
          band: bandOf(norm),
          cohortAvg,
          delta: cohortAvg != null ? Math.round((value - cohortAvg) * 10) / 10 : null,
        };
      })
      .sort((a, b) => b.raw - a.raw)
      .map((d, i) => ({ ...d, rank: i + 1 }));
  }, [result, cohort]);

  const bandGroups = useMemo(() => {
    const g = { High: [], Medium: [], Low: [] };
    dimensions.forEach(d => { g[d.band].push(d.name); });
    return g;
  }, [dimensions]);

  const firstName = (result?.user?.name || 'Learner').trim().split(/\s+/)[0] || 'Learner';

  /* ── Domain totals (generic "preferred domain") ─────────────────────────
     Some banks split into parts (sections) that act as opposing domains —
     e.g. financial vs non-financial halves. When a profile test has 2+
     sections that actually accumulated points, each section's point total is
     a domain score and the leader is the preferred domain. Purely measured:
     no section points, no verdict. */
  /* ── Section-wise performance ──────────────────────────────────────────
     Scored: accuracy per bank section. Profile: responses + dominant
     dimension per section (points belong to dimensions, not sections, so a
     scored-style accuracy would be meaningless there). */
  const sectionPerf = useMemo(() => {
    if (questions.length === 0) return [];
    const map = {};
    questionRows.forEach((r) => {
      if (!map[r.section]) {
        map[r.section] = {
          name: r.section, total: 0, answered: 0, correct: 0,
          timeSum: 0, timeN: 0, dimPoints: {},
        };
      }
      const s = map[r.section];
      s.total++;
      if (r.answered) s.answered++;
      if (r.correct === true) s.correct++;
      if (typeof r.time === 'number' && r.time >= 0) { s.timeSum += r.time; s.timeN++; }
      const q = questions[r.idx];
      const chosenIdx = result?.questionStats?.[String(r.idx)]?.selectedOption;
      const pts = chosenIdx >= 0 ? q?.options?.[chosenIdx]?.points : null;
      Object.entries(pts || {}).forEach(([cat, v]) => {
        s.dimPoints[cat] = (s.dimPoints[cat] || 0) + (Number(v) || 0);
      });
    });
    return Object.values(map).map((s) => {
      const topDim = Object.entries(s.dimPoints).sort((a, b) => b[1] - a[1])[0];
      return {
        ...s,
        accuracy: s.answered > 0 && isScored ? Math.round((s.correct / s.answered) * 100) : null,
        avgTime: s.timeN > 0 ? Math.round((s.timeSum / s.timeN) * 10) / 10 : null,
        topDim: topDim ? { name: topDim[0], pts: topDim[1] } : null,
      };
    });
  }, [questionRows, questions, result, isScored]);

  /* ── Domain totals (generic "preferred domain") ─────────────────────────
     Some banks split into parts (sections) that act as opposing domains —
     e.g. financial vs non-financial halves. When a profile test has 2+
     sections that actually accumulated points, each section's point total is
     a domain score and the leader is the preferred domain. Purely measured:
     no section points, no verdict. */
  const domainTotals = useMemo(() => {
    if (isScored || sectionPerf.length < 2) return [];
    const totals = sectionPerf.map(s => ({
      name: s.name,
      pts: Object.values(s.dimPoints || {}).reduce((a, b) => a + (Number(b) || 0), 0),
    }));
    const grand = totals.reduce((a, b) => a + b.pts, 0);
    if (grand <= 0) return [];
    return totals
      .map(t => ({ ...t, share: Math.round((t.pts / grand) * 1000) / 10 }))
      .sort((a, b) => b.pts - a.pts);
  }, [isScored, sectionPerf]);

  /* ── Answer & pacing patterns ────────────────────────────────────────── */
  const behaviour = useMemo(() => {
    if (questionRows.length === 0) return null;
    const times = questionRows.filter(r => typeof r.time === 'number');
    const avgTime = times.length > 0
      ? times.reduce((s, r) => s + r.time, 0) / times.length : null;
    const half = Math.ceil(questionRows.length / 2);
    const first = questionRows.slice(0, half).filter(r => typeof r.time === 'number');
    const second = questionRows.slice(half).filter(r => typeof r.time === 'number');
    const avg = (arr) => arr.length > 0 ? arr.reduce((s, r) => s + r.time, 0) / arr.length : null;
    const firstAvg = avg(first);
    const secondAvg = avg(second);
    // Longest run of consecutive correct answers (scored tests only).
    let best = 0;
    let run = 0;
    questionRows.forEach((r) => {
      if (r.correct === true) { run++; best = Math.max(best, run); }
      else if (r.answered) run = 0;
    });
    // Option-position distribution (A/B/C/D…) — flags pure guessing shapes.
    const posCounts = {};
    questionRows.forEach((r) => {
      if (!r.answered) return;
      const idx = result?.questionStats?.[String(r.idx)]?.selectedOption;
      const label = idx != null && idx >= 0 ? String.fromCharCode(65 + idx) : '?';
      posCounts[label] = (posCounts[label] || 0) + 1;
    });
    const slowQs = questionRows.filter(r =>
      typeof r.time === 'number' && r.cohortAvgTime != null && r.time >= r.cohortAvgTime * 2 && r.cohortAvgTime >= 5);
    return { avgTime, firstAvg, secondAvg, bestStreak: best, posCounts, slowQs };
  }, [questionRows, result]);

  /* ── Counsellor narrative — every bullet is gated on a measured value ── */
  const counselorInsights = useMemo(() => {
    if (!result || questionRows.length === 0) return null;
    const insights = [];

    if (isScored && advancedStats) {
      if (advancedStats.tagChartData.length >= 2) {
        const topTag = advancedStats.tagChartData[0];
        const bottomTag = advancedStats.tagChartData[advancedStats.tagChartData.length - 1];
        if (topTag.accuracy >= 70) {
          insights.push({ title: 'Top Strength', text: `Strong performance in ${topTag.name} (${topTag.accuracy}% accuracy).`, color: '#10b981' });
        }
        if (bottomTag.accuracy <= 50) {
          insights.push({ title: 'Primary Growth Area', text: `Struggles with ${bottomTag.name} (${bottomTag.accuracy}% accuracy). Recommended focus area for future study.`, color: '#f59e0b' });
        }
      }

      if (sectionPerf.length >= 2) {
        const ranked = [...sectionPerf].filter(s => s.accuracy != null).sort((a, b) => b.accuracy - a.accuracy);
        if (ranked.length >= 2 && ranked[0].accuracy - ranked[ranked.length - 1].accuracy >= 25) {
          insights.push({ title: 'Uneven Across Sections', text: `${ranked[0].name} (${ranked[0].accuracy}%) is well ahead of ${ranked[ranked.length - 1].name} (${ranked[ranked.length - 1].accuracy}%). Start the conversation with the weaker section.`, color: '#8b5cf6' });
        }
      }

      const adv = advancedStats.difficultyStats.advanced;
      const beg = advancedStats.difficultyStats.beginner;
      if (adv && beg && adv.total > 0 && beg.total > 0) {
        const advAcc = adv.correct / adv.total;
        const begAcc = beg.correct / beg.total;
        if (advAcc >= 0.7 && begAcc <= 0.6) {
           insights.push({ title: 'Difficulty Inconsistency', text: 'Handles complex (advanced) problems well, but prone to careless mistakes on foundational (beginner) concepts.', color: '#3b82f6' });
        }
      }

      const avgCorrect = parseFloat(advancedStats.avgTimeCorrect);
      const avgIncorrect = parseFloat(advancedStats.avgTimeIncorrect);
      if (avgCorrect > 0 && avgIncorrect > 0 && avgIncorrect < avgCorrect * 0.5) {
        insights.push({ title: 'Rushing Incorrect Answers', text: 'Tends to spend significantly less time on incorrect answers. Encourage the user to slow down and read questions more carefully when unsure.', color: '#ef4444' });
      }
      if (accuracyPct != null && accuracyPct < 50 && answeredCount > 0) {
        insights.push({ title: 'Low Accuracy', text: `Only ${accuracyPct}% of answered questions were correct (${correctCount}/${answeredCount}). Check whether this was a preparation gap or a test-taking (time-pressure) issue before prescribing study.`, color: '#ef4444' });
      }
      if (skippedCount > 0 && questions.length > 0 && skippedCount / questions.length >= 0.2) {
        insights.push({ title: 'High Skip Rate', text: `${skippedCount} of ${questions.length} questions were left unanswered. Ask whether the learner ran out of time or avoided uncertain items.`, color: '#f59e0b' });
      }
    } else if (!isScored && dimensions.length >= 2) {
      const top = dimensions[0];
      const second = dimensions[1];
      const bottom = dimensions[dimensions.length - 1];
      insights.push({ title: 'Dominant Dimension', text: `${top.name} leads with ${top.raw} pts (${top.share}% of total alignment)${top.delta != null ? `, ${top.delta >= 0 ? '+' : ''}${top.delta} vs the cohort average` : ''}.`, color: '#10b981' });
      if (top.share - second.share <= 5) {
        insights.push({ title: 'Balanced Top Profile', text: `${top.name} and ${second.name} are within ${Math.round((top.share - second.share) * 10) / 10} pts of each other — the learner has more than one genuine direction. Explore both before narrowing.`, color: '#3b82f6' });
      }
      insights.push({ title: 'Least Aligned', text: `${bottom.name} is the lowest dimension (${bottom.raw} pts, ${bottom.share}%). Useful as contrast, not as a verdict — low alignment here does not mean inability.`, color: '#8b5cf6' });
    }

    if (flaggedCount > 0) {
      insights.push({ title: 'Uncertainty Flags', text: `${flaggedCount} question${flaggedCount === 1 ? ' was' : 's were'} flagged as uncertain. These are the highest-value items to review together in the session.`, color: '#a78bfa' });
    }
    if (behaviour?.slowQs?.length > 0) {
      const q = behaviour.slowQs[0];
      insights.push({ title: 'Time Sink', text: `Q${q.idx + 1} took ${q.time}s vs a cohort average of ${q.cohortAvgTime}s. Ask what made it sticky — difficulty, wording, or second-guessing.`, color: '#f59e0b' });
    }

    return insights.length > 0 ? insights : [{ title: 'Note', text: 'Not enough varied data to generate dynamic insights for this attempt.', color: '#6b7280' }];
  }, [result, isScored, advancedStats, dimensions, sectionPerf, questionRows, accuracyPct, correctCount, answeredCount, skippedCount, questions.length, flaggedCount, behaviour]);

  if (!result) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={typeof window !== 'undefined' && window.innerWidth < 600} PaperProps={{
      sx: {
        bgcolor: '#ffffff', color: '#111827', borderRadius: '16px',
        border: '1px solid #f3f4f6'
      }
    }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <Box>
          <Typography component="span" variant="h6" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', color: '#111827', fontWeight: 700 }}>
            Counselling Report
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}>
            {test?.name || result.testName || 'Assessment'} · {questions.length} questions{test?.scoringMode === 'scored' ? ' · scored' : ' · profile'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#6b7280' }}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2, p: { xs: 2, md: 4 } }}>
        {/* --- Header / Learner info (reference-style labelled grid) --- */}
        <Box sx={{ mb: 3, p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
          <Grid container spacing={1.5}>
            {[
              ['Name', result.user?.name || 'Anonymous'],
              ['Email', result.user?.email || 'No email provided'],
              ['Date', attemptDate(result) ? new Date(attemptDate(result)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
              ['Test', test?.name || result.testName || 'Assessment'],
            ].map(([label, value]) => (
              <Grid item xs={6} md={3} key={label}>
                <Typography sx={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {label}
                </Typography>
                <Typography sx={{ color: '#111827', fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-word' }}>
                  {value}
                </Typography>
              </Grid>
            ))}
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Box>
                <Typography sx={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Status
                </Typography>
                <Chip
                  size="small"
                  label={result.status === 'abandoned' ? 'Abandoned' : 'Completed'}
                  sx={{
                    mt: 0.25, fontWeight: 700,
                    bgcolor: result.status === 'abandoned' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                    color: result.status === 'abandoned' ? '#fbbf24' : '#34d399',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* The bank is what turns stored stats into a report. Without it (test
            renamed slug, deleted bank, or tests list still loading) the tabs
            below would render empty with no explanation. */}
        {questions.length === 0 && (
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(251,191,36,0.4)', bgcolor: 'rgba(251,191,36,0.07)', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#92400e' }}>
              The question bank for this test could not be loaded, so question-level detail,
              sections and timing analysis are unavailable. Score, recommendation and cohort
              figures above are still this attempt&apos;s stored values.
            </Typography>
          </Paper>
        )}

        {/* --- Report tabs (the PDF is built separately as paginated text) --- */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3, borderBottom: '1px solid #f3f4f6',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: '#6b7280' },
            '& .Mui-selected': { color: '#111827 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#10b981' },
          }}
        >
          <Tab label="Overview" />
          <Tab label={isScored ? 'Performance' : 'Dimensions & Careers'} />
          <Tab label={`Questions (${answeredCount}/${questions.length})`} />
          <Tab label="Behaviour & Notes" />
        </Tabs>

        {/* ── TAB: Overview ── */}
        {tab === 0 && (
        <Box>
        {/* --- Key outcome --- */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          {result.percentage != null && (
            <Box sx={{ flex: '1 1 200px', p: 3, bgcolor: 'rgba(52, 211, 153, 0.08)', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <Typography sx={{ color: '#6b7280', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>Score</Typography>
              <Typography sx={{ color: '#34d399', fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
                {result.percentage}%
                <Typography component="span" sx={{ fontSize: '1rem', color: '#6b7280', ml: 1 }}>
                  ({result.score}/{result.maxScore})
                </Typography>
              </Typography>
              <Typography sx={{ color: '#111827', fontSize: '0.9rem', mt: 1, fontWeight: 600 }}>
                {result.passed === true ? '✅ Passed Assessment' : result.passed === false ? '❌ Did not pass' : 'No pass mark set'}
              </Typography>
              {rank && (
                <Typography sx={{ color: '#6b7280', fontSize: '0.8rem', mt: 0.5 }}>
                  Ranked #{rank.rank} of {rank.of} completed attempt{rank.of === 1 ? '' : 's'} for this test
                </Typography>
              )}
            </Box>
          )}
          <Box sx={{ flex: '1 1 200px', p: 3, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(232, 184, 109, 0.2)' }}>
            <Typography sx={{ color: '#6b7280', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
              {result.percentage != null ? 'Dominant Category' : 'Top Recommendation'}
            </Typography>
            <Typography sx={{ color: '#111827', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1 }}>
              {result.topRecommendation || 'N/A'}
            </Typography>
            {!isScored && dimensions.length > 0 && (
              <Typography sx={{ color: '#6b7280', fontSize: '0.8rem', mt: 0.5 }}>
                {dimensions[0].raw} pts · {dimensions[0].share}% of total alignment
              </Typography>
            )}
          </Box>
        </Box>

        {/* --- Accuracy · Completion · Pace at a glance --- */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Accuracy', value: accuracyPct != null ? `${accuracyPct}%` : 'n/a', sub: accuracyPct != null ? `${correctCount} correct of ${answeredCount} answered` : 'Profile test — no keyed answers', color: '#111827' },
            { label: 'Completion', value: completionPct != null ? `${completionPct}%` : '—', sub: `${answeredCount}/${questions.length} answered${skippedCount > 0 ? ` · ${skippedCount} skipped` : ''}`, color: '#111827' },
            { label: 'Total Time', value: result.timeTaken > 0 ? formatTime(result.timeTaken) : '—', sub: behaviour?.avgTime != null ? `~${behaviour.avgTime.toFixed(0)}s per question` : (test?.timeLimit ? `Limit: ${test.timeLimit} min` : 'No time data'), color: '#111827' },
            { label: 'Flags', value: String(flaggedCount), sub: flaggedCount > 0 ? 'Marked uncertain — review together' : 'Nothing flagged', color: flaggedCount > 0 ? '#7c3aed' : '#111827' },
          ].map(({ label, value, sub, color }) => (
            <Grid item xs={6} md={3} key={label}>
              <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: '16px !important' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>{label}</Typography>
                  <Typography sx={{ color, fontSize: '1.4rem', fontWeight: 800 }}>{value}</Typography>
                  <Typography sx={{ color: '#9ca3af', fontSize: '0.72rem', mt: 0.25 }}>{sub}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {advancedStats && (
            <>
              <Grid item xs={6} md={3}>
                <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Avg Time / Correct</Typography>
                    <Typography sx={{ color: '#34d399', fontSize: '1.25rem', fontWeight: 700 }}>
                      {advancedStats.avgTimeCorrect}s
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Avg Time / Incorrect</Typography>
                    <Typography sx={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 700 }}>
                      {advancedStats.avgTimeIncorrect}s
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        {/* --- How to read this report (reference-style guidance, personalised) --- */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981', borderRadius: '0 12px 12px 0' }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', mb: 1 }}>
            How to read this report
          </Typography>
          {isScored ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#4b5563' }}>
              {firstName}&apos;s score is correct answers out of keyed questions only — unkeyed items never
              count for or against. Accuracy (correct of answered) and completion (answered of total)
              tell different stories: low accuracy with full completion is a preparation signal, while
              high accuracy with many skips is a time-management signal. Cohort figures compare
              against other completed attempts of this same test.
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: '#4b5563' }}>
              {firstName}, each dimension below shows your alignment points, its share of your total,
              and how it compares with the cohort average for this test. The band is relative to your
              own top dimension — <strong>High</strong> (≥67% of your top score) means a genuine direction
              worth exploring first, <strong>Medium</strong> (33–66%) is worth developing interest in, and{' '}
              <strong>Low</strong> (&lt;33%) is contrast for the conversation, not a verdict on ability.
            </Typography>
          )}
        </Paper>

        {/* --- Preferred domain (reference-style verdict, measured only) --- */}
        {domainTotals.length >= 2 && (
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(232,184,109,0.4)', bgcolor: 'rgba(232,184,109,0.07)', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', mb: 0.5 }}>
              Preferred domain: {domainTotals[0].name}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#4b5563', mb: 1.5 }}>
              {firstName}&apos;s points fall {domainTotals[0].share}% in {domainTotals[0].name} against{' '}
              {domainTotals.slice(1).map(d => `${d.share}% in ${d.name}`).join(', ')} — the larger
              share is the preferred domain for this attempt.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {domainTotals.map((d, i) => (
                <Chip
                  key={d.name}
                  label={`${d.name}: ${d.pts} pts (${d.share}%)`}
                  sx={{
                    fontWeight: 700, fontSize: '0.75rem',
                    bgcolor: i === 0 ? 'rgba(16,185,129,0.18)' : 'rgba(0,0,0,0.05)',
                    color: i === 0 ? '#065f46' : '#4b5563',
                    border: i === 0 ? '1px solid #10b981' : '1px solid transparent',
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* --- Counsellor talking points (data-grounded) --- */}
        {counselorInsights && counselorInsights.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#111827' }}>Counsellor Talking Points</Typography>
            <Grid container spacing={2}>
              {counselorInsights.map((insight, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Box sx={{ p: 2, height: '100%', bgcolor: `${insight.color}15`, borderLeft: `4px solid ${insight.color}`, borderRadius: '0 8px 8px 0' }}>
                    <Typography sx={{ fontWeight: 700, color: insight.color, fontSize: '0.85rem', textTransform: 'uppercase', mb: 0.5 }}>{insight.title}</Typography>
                    <Typography sx={{ color: '#374151', fontSize: '0.9rem' }}>{insight.text}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* --- You vs the cohort spread (scored tests with cohort data) --- */}
        {isScored && learnerBucket >= 0 && (cohort?.scoreDistribution || []).some(b => b.count > 0) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1, color: '#111827' }}>Standing in Cohort</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
              {(cohort.scoreDistribution || []).map((b, i) => {
                const total = cohort.scoreDistribution.reduce((s, x) => s + x.count, 0) || 1;
                const mine = i === learnerBucket;
                return (
                  <Tooltip key={i} title={`${b.label}: ${b.count} attempt(s)${mine ? ' — this learner' : ''}`}>
                    <Box sx={{
                      flex: `${Math.max(b.count, 0.4)} 1 0%`,
                      minWidth: 44, py: 1, textAlign: 'center', borderRadius: 1.5,
                      bgcolor: mine ? 'rgba(16,185,129,0.25)' : 'rgba(0,0,0,0.05)',
                      border: mine ? '2px solid #10b981' : '1px solid transparent',
                    }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: mine ? 800 : 600, color: mine ? '#065f46' : '#4b5563' }}>
                        {b.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#111827' }}>
                        {b.count}{mine ? ' ★' : ''}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
              How completed attempts for this test spread across score bands — ★ marks this learner&apos;s band.
            </Typography>
          </Box>
        )}

        {/* --- Section snapshot (full tables live under the Performance tab) --- */}
        {sectionPerf.length > 1 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#111827' }}>Section Snapshot</Typography>
            <Grid container spacing={2}>
              {sectionPerf.map((s) => (
                <Grid item xs={12} sm={6} md={4} key={s.name}>
                  <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{s.name}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mt: 0.5 }}>
                      {s.answered}/{s.total} answered
                      {s.accuracy != null ? ` · ${s.accuracy}% accuracy` : ''}
                      {s.avgTime != null ? ` · ~${s.avgTime}s/q` : ''}
                    </Typography>
                    {s.accuracy != null && (
                      <LinearProgress
                        variant="determinate"
                        value={s.accuracy}
                        sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: s.accuracy >= 70 ? '#34d399' : s.accuracy >= 40 ? '#fbbf24' : '#f87171' } }}
                      />
                    )}
                    {!isScored && s.topDim && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#4b5563', mt: 1 }}>
                        Leans <strong>{s.topDim.name}</strong> (+{s.topDim.pts} pts)
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        </Box>
        )}

        {/* ── TAB: Performance (scored) / Dimensions & Careers (profile) ── */}
        {(tab === 1) && (
        <Box>
        {!isScored && dimensions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1, color: '#111827' }}>Interest Dimensions</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 2 }}>
              Share = dimension points as a percentage of this attempt&apos;s total. Band is relative
              to your own top dimension (High ≥67%, Medium 33–66%, Low &lt;33%). Cohort avg is the
              mean for the same test across all completed attempts.
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    {['#', 'Dimension', 'Points', 'Share', 'Band', 'Cohort Avg', 'vs Cohort'].map(h => (
                      <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#4b5563' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dimensions.map((d) => (
                    <TableRow key={d.name} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#9ca3af' }}>{d.rank}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#111827' }}>
                        {d.name}
                        {d.rank === 1 && <Chip label="top" size="small" sx={{ ml: 1, height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(52,211,153,0.15)', color: '#059669' }} />}
                      </TableCell>
                      <TableCell sx={{ color: '#111827' }}>{d.raw}</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={Math.min(100, d.share)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>{d.share}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#6b7280', fontSize: '0.8rem' }}>{d.cohortAvg ?? '—'}</TableCell>
                      <TableCell sx={{ borderColor: '#f3f4f6' }}>
                        <Chip
                          label={d.band}
                          size="small"
                          sx={{
                            height: 18, fontSize: '0.62rem', fontWeight: 700,
                            bgcolor: d.band === 'High' ? 'rgba(52,211,153,0.18)' : d.band === 'Medium' ? 'rgba(251,191,36,0.2)' : 'rgba(0,0,0,0.05)',
                            color: d.band === 'High' ? '#065f46' : d.band === 'Medium' ? '#92400e' : '#6b7280',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700, color: d.delta == null ? '#9ca3af' : d.delta >= 0 ? '#059669' : '#dc2626' }}>
                        {d.delta == null ? '—' : `${d.delta >= 0 ? '+' : ''}${d.delta}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(232,184,109,0.35)', bgcolor: 'rgba(232,184,109,0.07)', borderRadius: '12px' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', mb: 0.5 }}>
                Career reading — from this attempt only
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#4b5563' }}>
                Strongest alignment: <strong>{dimensions[0].name}</strong> ({dimensions[0].share}% share)
                {dimensions.length > 1 && (
                  <>; also notable: <strong>{dimensions[1].name}</strong> ({dimensions[1].share}% share)</>
                )}
                . {bandGroups.High.length > 0 && (
                  <>Recommend starting from the High band: <strong>{bandGroups.High.join(', ')}</strong>. </>
                )}
                Map these dimensions to career families using your counselling framework — the
                test measures interest alignment, not ability or job readiness. Lowest alignment
                ({dimensions[dimensions.length - 1].name}, {dimensions[dimensions.length - 1].share}%)
                is contrast for the conversation, not a verdict on capability. Specific job titles
                are deliberately not listed here: this test records dimension alignment only.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* --- Section-wise performance (scored: accuracy · profile: coverage + lean) --- */}
        {sectionPerf.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#111827' }}>
              Section-wise Performance
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    {['Section', 'Answered', isScored ? 'Correct' : 'Top Lean', isScored ? 'Accuracy' : 'Avg Time / Q'].map(h => (
                      <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#4b5563' }}>{h}</TableCell>
                    ))}
                    {isScored && (
                      <TableCell sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#4b5563' }}>Avg Time</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sectionPerf.map((s) => (
                    <TableRow key={s.name} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#111827' }}>{s.name}</TableCell>
                      <TableCell sx={{ color: '#4b5563' }}>{s.answered}/{s.total}</TableCell>
                      <TableCell sx={{ color: '#4b5563' }}>
                        {isScored ? `${s.correct}` : (s.topDim ? `${s.topDim.name} (+${s.topDim.pts})` : '—')}
                      </TableCell>
                      <TableCell sx={{
                        fontWeight: 700,
                        color: s.accuracy == null && isScored ? '#9ca3af' : s.accuracy >= 70 ? '#059669' : s.accuracy >= 40 ? '#d97706' : '#dc2626',
                      }}>
                        {isScored ? (s.accuracy != null ? `${s.accuracy}%` : '—') : (s.avgTime != null ? `${s.avgTime}s` : '—')}
                      </TableCell>
                      {isScored && (
                        <TableCell sx={{ color: '#6b7280' }}>{s.avgTime != null ? `${s.avgTime}s` : '—'}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        {/* --- Advanced Performance Analytics (Scored) --- */}
        {advancedStats && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#111827' }}>Performance Breakdown</Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '12px', height: '100%' }}>
                  <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>Accuracy by Difficulty</Typography>
                  {['beginner', 'intermediate', 'advanced'].map(diff => {
                    const st = advancedStats.difficultyStats[diff];
                    if (!st || st.total === 0) return null;
                    const pct = Math.round((st.correct / st.total) * 100);
                    return (
                      <Box key={diff} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.8rem', textTransform: 'capitalize', fontWeight: 600, color: '#374151' }}>{diff}</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>
                            {pct}% <span style={{ color: '#9ca3af', fontWeight: 400 }}>({st.correct}/{st.total})</span>
                          </Typography>
                        </Box>
                        <Box sx={{ w: '100%', h: 6, bgcolor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171' }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '12px', height: '100%' }}>
                  <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>Accuracy by Subject/Tag</Typography>
                  {advancedStats.tagChartData.length > 0 ? (
                    <Box sx={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={advancedStats.tagChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <ReTooltip 
                            formatter={(val, name, props) => [`${val}% (${props.payload.total} total)`, 'Accuracy']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                            {advancedStats.tagChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.accuracy >= 70 ? '#34d399' : entry.accuracy >= 40 ? '#fbbf24' : '#f87171'} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No tag data available for this test.</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* --- Category Breakdown (Profile) --- */}
        {!isScored && chartData.length > 1 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#111827' }}>Category Profiles</Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="subject" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <ReTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        formatter={(val) => [val, 'Points']}
                      />
                      <Bar dataKey="A" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid stroke="#f3f4f6" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <Radar name="This attempt" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.35} isAnimationActive={false} />
                      {chartHasCohort && (
                        <Radar name="Cohort avg" dataKey="cohort" stroke="#94a3b8" fill="none" strokeDasharray="5 4" isAnimationActive={false} />
                      )}
                      <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
                      <ReTooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(6,30,18,0.95)', border: '1px solid rgba(232,184,109,0.2)',
                          borderRadius: 12, color: '#111827', fontSize: 13, backdropFilter: 'blur(10px)'
                        }}
                        itemStyle={{ color: '#111827' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        </Box>
        )}

        {/* ── TAB: Question-level analysis (every item, including skips) ── */}
        {(tab === 2) && (
        <Box>
        {questionRows.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1, color: '#111827' }}>Question-level Analysis</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 1.5 }}>
              All {questions.length} questions in bank order — including {skippedCount} skipped.
              Cohort avg is the mean time across completed attempts for this test.
              Expand a row to review every option against the key and the cohort&apos;s picks.
            </Typography>
            {/* Isolate what matters in long banks */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }} role="group" aria-label="Filter questions">
              {[
                { key: 'all', label: `All (${questionRows.length})` },
                ...(isScored ? [{ key: 'incorrect', label: `Incorrect (${wrongCount})` }] : []),
                { key: 'skipped', label: `Skipped (${skippedCount})` },
                { key: 'flagged', label: `Flagged (${flaggedCount})` },
                { key: 'slow', label: `Slow vs cohort (${slowCount})` },
              ].map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  clickable
                  onClick={() => setQFilter(key)}
                  sx={{
                    fontWeight: 700, fontSize: '0.72rem',
                    bgcolor: qFilter === key ? '#111827' : 'rgba(0,0,0,0.04)',
                    color: qFilter === key ? '#fff' : '#4b5563',
                    '&:hover': { bgcolor: qFilter === key ? '#374151' : 'rgba(0,0,0,0.08)' },
                  }}
                />
              ))}
              {qFilter !== 'all' && (
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', alignSelf: 'center', ml: 1 }}>
                  Showing {visibleRows.length} of {questionRows.length}
                </Typography>
              )}
            </Box>
            {/* Per-question time vs cohort average — follows the active filter so
                the chart answers the same question the table is asking. */}
            {visibleRows.some(r => typeof r.time === 'number') && (
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '12px', mb: 2 }}>
                <Typography sx={{ color: '#4b5563', fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>
                  Time per Question (yours vs cohort avg){qFilter !== 'all' ? ' — filtered view' : ''}
                </Typography>
                <Box sx={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={visibleRows.map(r => ({
                        q: `Q${r.idx + 1}`,
                        yours: r.time ?? 0,
                        avg: r.cohortAvgTime ?? 0,
                      }))}
                      margin={{ top: 5, right: 10, bottom: 20, left: 30 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="q" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} />
                      <ReTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        formatter={(val, name) => [`${val}s`, name === 'yours' ? 'This attempt' : 'Cohort avg']}
                      />
                      <Bar dataKey="yours" fill="#60a5fa" radius={[3, 3, 0, 0]} maxBarSize={18} name="yours" />
                      <Bar dataKey="avg" fill="#e5e7eb" radius={[3, 3, 0, 0]} maxBarSize={18} name="avg" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            )}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', maxHeight: 480, overflowY: 'auto' }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Q', 'Section', 'Question', 'Response', isScored ? 'Verdict' : 'Points', 'Time'].map(h => (
                      <TableCell key={h} sx={{ bgcolor: 'rgba(249,250,251,1)', color: '#4b5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', color: '#9ca3af', py: 4, borderColor: '#f3f4f6' }}>
                        No questions match this filter.
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleRows.map((row) => {
                    const q = questions[row.idx] || {};
                    const chosenIdx = result?.questionStats?.[String(row.idx)]?.selectedOption;
                    const keyIdx = q.correctOptionIndex;
                    const dist = cohortQStats[row.idx]?.optionDistribution || [];
                    const open = expandedQ === row.idx;
                    return (
                    <React.Fragment key={row.idx}>
                    <TableRow hover sx={!row.answered ? { bgcolor: 'rgba(0,0,0,0.015)' } : {}}>
                      <TableCell sx={{ color: '#111827', fontWeight: 700, fontSize: '0.75rem', borderColor: '#f3f4f6' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedQ(open ? null : row.idx)}
                            aria-label={open ? `Collapse question ${row.idx + 1}` : `Expand question ${row.idx + 1} options`}
                            sx={{ p: 0.25, color: '#6b7280' }}
                          >
                            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </IconButton>
                          {row.idx + 1}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#6b7280', fontSize: '0.7rem', borderColor: '#f3f4f6', whiteSpace: 'nowrap' }}>
                        {row.section}
                      </TableCell>
                      <TableCell sx={{ color: '#4b5563', fontSize: '0.75rem', maxWidth: 280, borderColor: '#f3f4f6', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {row.question}
                        {questions[row.idx]?.imageUrl && (
                          <Box
                            component="img"
                            src={resolveTestImage(questions[row.idx].imageUrl)}
                            alt={`Question ${row.idx + 1} figure`}
                            loading="lazy"
                            sx={{ display: 'block', mt: 0.5, maxHeight: 64, borderRadius: 1, border: '1px solid #e5e7eb' }}
                          />
                        )}
                        {row.flagged && (
                          <Chip label="flagged" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem', bgcolor: 'rgba(167,139,250,0.2)', color: '#6d28d9' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#111827', fontSize: '0.75rem', borderColor: '#f3f4f6', maxWidth: 150, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {row.chosen || <em style={{ color: '#9ca3af' }}>skipped</em>}
                      </TableCell>
                      <TableCell sx={{
                        fontSize: '0.72rem', fontWeight: 700, borderColor: '#f3f4f6',
                        color: isScored ? row.verdict.color : '#b45309',
                      }}>
                        {isScored ? row.verdict.label : (row.points || '—')}
                      </TableCell>
                      <TableCell sx={{ color: '#6b7280', fontSize: '0.72rem', borderColor: '#f3f4f6', whiteSpace: 'nowrap' }}>
                        {row.time == null ? '—' : `${row.time}s`}
                        {row.time != null && row.cohortAvgTime != null && (
                          <Typography component="span" sx={{ display: 'block', fontSize: '0.65rem', color: row.time > row.cohortAvgTime * 1.5 ? '#d97706' : '#9ca3af' }}>
                            avg {row.cohortAvgTime}s
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    {/* Option-level review: every choice against the key and the
                        cohort's picks. `dist` comes from the cohort aggregates;
                        when the cohort is empty the row simply shows key/pick. */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0, borderColor: '#f3f4f6', borderBottom: open ? '1px solid #f3f4f6' : 'none' }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 3, py: 1.5, bgcolor: 'rgba(0,0,0,0.015)' }}>
                            {(q.options || []).length === 0 && (
                              <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>No option data stored for this question.</Typography>
                            )}
                            {(q.options || []).map((opt, oi) => {
                              const isPick = oi === chosenIdx;
                              const isKey = isScored && oi === keyIdx;
                              const pct = dist[oi]?.pct;
                              return (
                                <Box key={oi} sx={{ display: 'flex', alignItems: 'baseline', gap: 1, py: 0.4, flexWrap: 'wrap' }}>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: isKey ? '#059669' : '#6b7280', minWidth: 18 }}>
                                    {String.fromCharCode(65 + oi)}
                                  </Typography>
                                  {opt.imageUrl ? (
                                    <Box
                                      component="img"
                                      src={resolveTestImage(opt.imageUrl)}
                                      alt={`Q${row.idx + 1} option ${String.fromCharCode(65 + oi)}`}
                                      loading="lazy"
                                      sx={{ maxHeight: 56, borderRadius: 1, border: '1px solid #e5e7eb', flex: '0 0 auto' }}
                                    />
                                  ) : null}
                                  <Typography sx={{ fontSize: '0.75rem', color: '#374151', flex: '1 1 200px' }}>
                                    {opt.text || (opt.imageUrl ? '(image option above)' : '—')}
                                  </Typography>
                                  {isPick && (
                                    <Chip label="your pick" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: isKey ? 'rgba(52,211,153,0.2)' : 'rgba(96,165,250,0.2)', color: isKey ? '#065f46' : '#1d4ed8' }} />
                                  )}
                                  {isKey && !isPick && (
                                    <Chip label="key" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(52,211,153,0.2)', color: '#065f46' }} />
                                  )}
                                  {pct != null && (
                                    <Typography sx={{ fontSize: '0.68rem', color: '#9ca3af' }}>{pct}% of cohort</Typography>
                                  )}
                                </Box>
                              );
                            })}
                            {row.tags.length > 0 && (
                              <Typography sx={{ fontSize: '0.68rem', color: '#9ca3af', mt: 0.5 }}>
                                Topics: {row.tags.join(', ')} · Difficulty: {row.difficulty}
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                    </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        </Box>
        )}

        {/* ── TAB: Behaviour, answer patterns & session notes ── */}
        {(tab === 3) && (
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#111827' }}>Attempt Behaviour</Typography>
          {/* Budget vs actual pace — only when the bank sets a limit. */}
          {test?.timeLimit != null && questions.length > 0 && (
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '12px', mb: 2, bgcolor: '#f8fafc' }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#4b5563' }}>
                Time limit: <strong>{test.timeLimit} min</strong> (~{Math.round((test.timeLimit * 60) / questions.length)}s per question budget)
                {' · '}Used: <strong>{result.timeTaken > 0 ? formatTime(result.timeTaken) : '—'}</strong>
                {behaviour?.avgTime != null && result.timeTaken > 0 && (
                  <> (~{behaviour.avgTime.toFixed(0)}s/q actual)</>
                )}
              </Typography>
            </Paper>
          )}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Pace — first half', value: behaviour?.firstAvg != null ? `${behaviour.firstAvg.toFixed(0)}s / q` : '—', sub: 'Mean time per question' },
              { label: 'Pace — second half', value: behaviour?.secondAvg != null ? `${behaviour.secondAvg.toFixed(0)}s / q` : '—', sub: behaviour?.firstAvg != null && behaviour?.secondAvg != null ? (behaviour.secondAvg > behaviour.firstAvg * 1.3 ? 'Slowed down — fatigue or harder items' : behaviour.firstAvg > behaviour.secondAvg * 1.3 ? 'Sped up — rushing or settling in' : 'Steady pace throughout') : 'Mean time per question' },
              { label: 'Best Correct Streak', value: isScored ? String(behaviour?.bestStreak ?? 0) : 'n/a', sub: isScored ? 'Longest run of consecutive correct answers' : 'Profile test — no keyed answers' },
              { label: 'Skipped + Flagged', value: `${skippedCount} + ${flaggedCount}`, sub: 'Skipped items first, flagged second — review order' },
            ].map(({ label, value, sub }) => (
              <Grid item xs={6} md={3} key={label}>
                <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>{label}</Typography>
                    <Typography sx={{ color: '#111827', fontSize: '1.25rem', fontWeight: 800 }}>{value}</Typography>
                    <Typography sx={{ color: '#9ca3af', fontSize: '0.72rem', mt: 0.25 }}>{sub}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {behaviour && Object.keys(behaviour.posCounts).length > 0 && (
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e5e7eb', borderRadius: '12px', mb: 3 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', mb: 0.5 }}>
                Answer-position pattern
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 1.5 }}>
                Which option slot (A, B, C, D…) the learner picked across answered questions.
                A heavy lean on one slot can signal guessing rather than reading.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {Object.entries(behaviour.posCounts).sort().map(([pos, n]) => (
                  <Chip
                    key={pos}
                    label={`${pos}: ${n}`}
                    sx={{ fontWeight: 700, bgcolor: n >= answeredCount * 0.5 && answeredCount >= 4 ? 'rgba(239,68,68,0.12)' : 'rgba(0,0,0,0.04)', color: '#111827' }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e5e7eb', borderRadius: '12px', mb: 3 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', mb: 1 }}>
              Suggested session flow
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5, color: '#4b5563', fontSize: '0.85rem', '& li': { mb: 0.75 } }}>
              <li>Open with the headline ({isScored ? `score ${result.percentage ?? '—'}%` : `top alignment ${result.topRecommendation || '—'}`}) and one genuine strength from the talking points.</li>
              {flaggedCount > 0 && <li>Walk through the {flaggedCount} flagged question{flaggedCount === 1 ? '' : 's'} — the learner already told you where they are unsure.</li>}
              {skippedCount > 0 && <li>Ask about the {skippedCount} skipped item{skippedCount === 1 ? '' : 's'}: time pressure, avoidance, or wording?</li>}
              <li>Close with one concrete next step (a section to practise, or a dimension to explore with real-world exposure) — not five.</li>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e5e7eb', borderRadius: '12px', mb: 3 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', mb: 0.5 }}>
              Counsellor notes
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', mb: 1.5 }}>
              Written during the session. Included in the downloaded PDF — not saved anywhere else.
            </Typography>
            <TextField
              multiline
              minRows={3}
              fullWidth
              placeholder="Observations, agreed next steps, follow-up date…"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
              inputProps={{ maxLength: 2000, 'aria-label': 'Counsellor session notes' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#111827', bgcolor: '#ffffff', borderRadius: '12px',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.25)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
              }}
            />
          </Paper>

          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
            Report sources: this attempt&apos;s stored answers, timings and flags; the test bank
            (sections, difficulty, tags{isScored ? ', answer key' : ''}); cohort aggregates for this test.
            Career language above reflects measured alignment only — map it to occupations through
            your counselling framework, not from this report alone.
          </Typography>
        </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #f3f4f6', p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between', bgcolor: '#f9fafb', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
        <Button onClick={handleDownloadPdf} disabled={isExporting} variant="outlined" startIcon={isExporting ? <CircularProgress size={16} /> : <PictureAsPdf />} sx={{ color: '#10b981', borderColor: '#10b981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' } }}>
          {isExporting ? 'Building PDF...' : 'Download Report (PDF)'}
        </Button>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#111827', color: 'white', '&:hover': { bgcolor: '#374151' } }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}



/* AdminIndex mounts this route with no props, so `initialTests` and
   `initialAnalytics` were dead API — and `analytics` ignored its half of the
   pair anyway. Both panels now start empty and loadDashboard() fills them. */
export default function TestAnalytics() {
  const [tests, setTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [detailAnalytics, setDetailAnalytics] = useState(null);
  const [selectedTest, setSelectedTest] = useState('all');

  const [resultsPage, setResultsPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [allResults, setAllResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  /* A failed detail fetch used to render nothing at all: the panel just
     vanished with no explanation. */
  const [detailError, setDetailError] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // UX & Logic state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, 7d, 30d
  const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc, dateAsc, timeDesc, timeAsc, scoreDesc, scoreAsc
  const [recommendationFilter, setRecommendationFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('completed'); // completed | abandoned | all
  const [viewResult, setViewResult] = useState(null);
  const [deleteResultDialog, setDeleteResultDialog] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  // Starts true: the first render drops the page skeleton, and without this the
  // table painted "No attempts recorded yet" for a frame before the fetch ran.
  const [resultsLoading, setResultsLoading] = useState(true);
  /* A failed results fetch left `allResults` empty, so the table claimed
     "No attempts recorded yet" when the truth was "the request failed". */
  const [resultsError, setResultsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  /* Cache keys include the status filter — a single key per slug meant the
     first filter you opened was cached for all the others. */
  const detailCache = useRef({});
  const resultsCache = useRef({});

  /* Monotonic request ids. Switching test or status fires a second fetch whose
     response can land before the first, which left the panel showing the
     previous selection's data. Only the newest response is allowed to commit. */
  const detailSeq = useRef(0);
  const resultsSeq = useRef(0);

  /* ─── Debounce search ──────────────────────────────────────────────── */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setResultsPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /* ─── Dashboard summary ────────────────────────────────────────────── */
  const loadDashboard = useCallback(async () => {
    try {
      const [testsRes, analyticsRes] = await Promise.all([
        adminGetTests(),
        adminGetTestAnalytics(),
      ]);
      setTests(Array.isArray(testsRes) ? testsRes : testsRes || []);
      setAnalytics(Array.isArray(analyticsRes) ? analyticsRes : analyticsRes ?? null);
      setLastSyncedAt(new Date());
    } catch (err) {
      logApiFailure('load analytics dashboard', err);
      setError('Failed to load analytics data');
    } finally {
      setTestLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  /* ─── Manual refresh ───────────────────────────────────────────────────
     Both caches are write-once, so before this the page could not show
     anything new without a full browser reload. */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // A failed load left "Failed to load analytics data" up permanently, so a
    // later successful refresh still showed the old error.
    setError('');
    resultsCache.current = {};
    detailCache.current = {};
    try {
      await loadDashboard();
      setDetailAnalytics(null);
      await Promise.all([
        fetchDetailRef.current(selectedTest, true),
        fetchResultsRef.current(selectedTest, statusFilter, true),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard, selectedTest, statusFilter]);

  /* ─── Fetch per-test detail analytics ───────────────────────────── */
  const fetchDetail = useCallback(async (slug, force = false) => {
    const seq = ++detailSeq.current;
    setDetailError(false);
    if (slug === 'all') { setDetailAnalytics(null); return; }
    if (!force && detailCache.current[slug]) {
      setDetailAnalytics(detailCache.current[slug]);
      return;
    }

    setDetailLoading(true);
    try {
      const res = await adminGetTestAnalyticsBySlug(slug);
      if (seq !== detailSeq.current) return;   // superseded by a newer selection
      const data = Array.isArray(res) ? res : res ?? null;
      detailCache.current[slug] = data;
      setDetailAnalytics(data);
    } catch (err) {
      if (seq !== detailSeq.current) return;
      logApiFailure('load per-test analytics', err);
      setDetailAnalytics(null);
      setDetailError(true);
    } finally {
      if (seq === detailSeq.current) setDetailLoading(false);
    }
  }, []);

  /* ─── Fetch full results list for the selected test ───────────────
     `status` is passed through to the API, which decides whether abandoned
     telemetry is included. */
  const fetchResults = useCallback(async (slug, status = 'completed', force = false) => {
    const seq = ++resultsSeq.current;
    setResultsError(false);
    const key = `${slug}::${status}`;
    if (!force && resultsCache.current[key]) {
      setAllResults(resultsCache.current[key]);
      setResultsLoading(false);
      return;
    }

    setResultsLoading(true);
    try {
      const url = `/api/admin/test-results${slug !== 'all' ? `/${slug}` : ''}?status=${status}`;
      const res = await adminRequest(url);
      if (seq !== resultsSeq.current) return;   // superseded by a newer filter
      const data = Array.isArray(res) ? res : res?.data || [];
      resultsCache.current[key] = data;
      setAllResults(data);
    } catch (err) {
      if (seq !== resultsSeq.current) return;
      logApiFailure('load test results', err);
      setAllResults([]);
      setResultsError(true);
    } finally {
      if (seq === resultsSeq.current) setResultsLoading(false);
    }
  }, []);

  // Refresh needs the newest callbacks without re-creating itself on every
  // selection change (which would loop through the effect below).
  const fetchDetailRef = useRef(fetchDetail);
  const fetchResultsRef = useRef(fetchResults);
  useEffect(() => {
    fetchDetailRef.current = fetchDetail;
    fetchResultsRef.current = fetchResults;
  });

  /* ─── When test selection or status filter changes, refetch ─────── */
  useEffect(() => {
    if (loading || testLoading) return;
    fetchDetail(selectedTest);
  }, [selectedTest, fetchDetail, loading, testLoading]);

  useEffect(() => {
    if (loading || testLoading) return;
    fetchResults(selectedTest, statusFilter);
  }, [selectedTest, statusFilter, fetchResults, loading, testLoading]);

  /* ─── Handle test selection ──────────────────────────────────────── */
  const handleTestChange = (next) => {
    if (next === selectedTest) return;
    setSelectedTest(next);
    setResultsPage(0);
    setRecommendationFilter(null);
  };

  /* ─── Handle Delete Record ─────────────────────────────────────────
     `deleteResultDialog` holds the row object (the confirmation copy needs
     the learner's name). The dialog's confirm handler used to call a helper
     that merely stored the id back into that same state and returned — the
     DELETE request was never sent, the dialog re-opened with a string instead
     of a row, and every later click read `undefined._id`. One owner for one
     piece of state now: the row in, the request out. */
  const confirmDeleteResult = async () => {
    const row = deleteResultDialog;
    if (!row?._id) return;
    const id = row._id;
    setDeletingId(id);
    try {
      // Options object, not a bare string: the client reads options.method, so
      // passing 'DELETE' silently issued a GET and deleted nothing.
      await adminRequest(`/api/admin/test-results/${id}`, { method: 'DELETE' });

      setAllResults(prev => prev.filter(r => r._id !== id));

      // The same record appears in every cached list that spans tests ('all'
      // and its own slug), so purge it from all of them — not just the
      // currently selected one. Stale caches also kept the deleted attempt in
      // the detail panel's counts and recent-attempts list.
      Object.keys(resultsCache.current).forEach((key) => {
        resultsCache.current[key] = (resultsCache.current[key] || []).filter(r => r._id !== id);
      });
      delete detailCache.current[row.testSlug];
      if (selectedTest !== 'all' && selectedTest === row.testSlug) {
        await fetchDetail(row.testSlug);
      }

      // The summary cards are separate state from the caches, so without this
      // the deleted attempt kept counting toward Total Submissions and the
      // per-test cards.
      await loadDashboard();

      setSuccess('Test result deleted successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      logApiFailure('delete test result', err);
      setError(err?.message || 'Failed to delete test result.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingId(null);
      setDeleteResultDialog(null);
    }
  };

  /* ─── Memoized Data Processing ───────────────────────────────────── */
  const processedResults = useMemo(() => {
    let filtered = [...allResults];

    // 1. Search — result, not just identity: admins look up "Investigative"
    //    or "65" as often as they look up a name.
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(r =>
        (r.user?.name || '').toLowerCase().includes(query) ||
        (r.user?.email || '').toLowerCase().includes(query) ||
        (r.testName || '').toLowerCase().includes(query) ||
        (r.topRecommendation || '').toLowerCase().includes(query) ||
        (r.percentage != null && String(r.percentage).includes(query)) ||
        (r.status === 'abandoned' && 'abandoned'.includes(query))
      );
    }

    // 2. Date Filter — measured against whichever timestamp the attempt has.
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
      if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
      filtered = filtered.filter(r => {
        const d = attemptDate(r);
        return d ? new Date(d) >= cutoff : true;
      });
    }

    // 3. Recommendation Filter
    if (recommendationFilter) {
      filtered = filtered.filter(r => r.topRecommendation === recommendationFilter);
    }

    // 4. Sort
    filtered.sort((a, b) => {
      const dateA = new Date(attemptDate(a) || 0).getTime();
      const dateB = new Date(attemptDate(b) || 0).getTime();
      const timeA = a.timeTaken || 0;
      const timeB = b.timeTaken || 0;
      /* Unscored attempts have no score to rank, so they are pinned to the
         bottom in *both* directions. The old -1 sentinel sank them for
         "High to Low" but put them at the top of "Low to High". */
      const unscoredFirst = (a.percentage == null) - (b.percentage == null);

      switch(sortBy) {
        case 'dateAsc': return dateA - dateB;
        case 'timeDesc': return timeB - timeA;
        case 'timeAsc': return timeA - timeB;
        case 'scoreDesc': return unscoredFirst || (b.percentage - a.percentage);
        case 'scoreAsc': return unscoredFirst || (a.percentage - b.percentage);
        case 'dateDesc':
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [allResults, debouncedSearch, dateRange, recommendationFilter, sortBy]);

  // Deleting the last row of the final page, or tightening a filter, leaves the
  // page pointer past the end — the table then renders empty while the footer
  // says the data is there. Clamp it whenever the data shrinks.
  const lastPage = Math.max(0, Math.ceil(processedResults.length / rowsPerPage) - 1);
  useEffect(() => {
    if (resultsPage > lastPage) setResultsPage(lastPage);
  }, [resultsPage, lastPage]);

  const paginatedResults = useMemo(() => {
    return processedResults.slice(resultsPage * rowsPerPage, (resultsPage + 1) * rowsPerPage);
  }, [processedResults, resultsPage, rowsPerPage]);

  /* Keyed items only. The accuracy card claims to show "only questions with a
     designated correct answer", but it charted every row and turned
     `correctPct === null` (not keyed) into a 0% bar — reading as "everyone
     failed this" and misaligning the per-bar <Cell> colours against the data. */
  const keyedQuestions = useMemo(
    () => (detailAnalytics?.perQuestionStats || []).filter((q) => q.hasCorrectKey),
    [detailAnalytics],
  );

  /* ─── Chart interaction ──────────────────────────────────────────── */
  const handlePieClick = (data) => {
    if (recommendationFilter === data.name) {
      setRecommendationFilter(null);
    } else {
      setRecommendationFilter(data.name);
      setResultsPage(0);
    }
  };

  /* ─── CSV export ─────────────────────────────────────────────────── */
  /* Synchronous: building the blob takes microseconds, so the old 500ms
     setTimeout plus `exportingCsv` flag only ever bought a spinner that could
     not finish painting. */
  const handleExportCsv = () => {
    try {
      const filename = `paavan-test-results-${selectedTest === 'all' ? 'all' : selectedTest}-${new Date().toISOString().slice(0,10)}.csv`;
      downloadCsv(processedResults, filename);
      setSuccess(`Exported ${processedResults.length} rows to CSV`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      logApiFailure('export results CSV', err);
      setError('Failed to export CSV');
    }
  };

  /* ─── Loading states ─────────────────────────────────────────────── */
  if (testLoading) {
    return (
      <Box className="space-y-6">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
            Psychometric Assessment Analytics
          </Typography>
        </Box>
        <DashboardSkeleton />
      </Box>
    );
  }

  /* ─── Main layout ────────────────────────────────────────────────── */
  return (
    <Box className="space-y-6" sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{
            fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)',
            fontWeight: 700, color: '#111827',
          }}>
            Psychometric Assessment Analytics
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
            Overview of all assessment completions, engagement metrics, and per-test performance.
          </Typography>
        </Box>
      </Box>

      <FormAlerts error={error} success={success}
        onDismissError={() => setError('')}
        onDismissSuccess={() => setSuccess('')} />

      {/* ─── Aggregate dashboard ─────────────────────────────── */}
      {analytics && tests.length > 0 ? (
        <Grid container spacing={3} className="mb-6">
          {/* Total submissions card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              bgcolor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.03)',
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.15)' }}>
                  <Assessment sx={{ color: '#111827', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Submissions
                  </Typography>
                  <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', mt: 0.5, fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)' }}>
                    {analytics.totalSubmissions}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Engagement health — how many attempts actually finish */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              bgcolor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.03)',
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(52,211,153,0.15)' }}>
                  <TrendingUp sx={{ color: '#34d399', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Completion Rate
                  </Typography>
                  <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', mt: 0.5, fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)' }}>
                    {analytics.completionRate == null ? '—' : `${analytics.completionRate}%`}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                    {analytics.abandonedAttempts} abandoned mid-test
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Per-test cards */}
          {analytics.tests.map((t) => (
            <Grid item xs={12} sm={6} md={3} key={t.slug}>
              <TestCard
                t={t}
                isSelected={selectedTest === t.slug}
                onClick={() => handleTestChange(t.slug)}
              />
            </Grid>
          ))}
        </Grid>
      ) : analytics ? (
        <EmptyDashboard />
      ) : null}

      {/* ─── Per-test detail analytics ─────────────────────── */}
      {selectedTest !== 'all' && (
        <Box className="mb-6 transition-opacity duration-300">
          {/* Loading skeleton for detail */}
          {detailLoading && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[1,2,3,4].map(i => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Card sx={{ bgcolor: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '16px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ width: '60%', height: 14, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px' }} />
                          <Box sx={{ width: '40%', height: 10, bgcolor: 'rgba(0,0,0,0.02)', mt: 0.5 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {detailError && !detailLoading && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Info sx={{ color: '#d1d5db', fontSize: 40 }} />
              <Typography sx={{ color: '#6b7280', mt: 2 }}>
                {"Couldn't load detailed analytics for this assessment. Use Refresh to try again."}
              </Typography>
            </Box>
          )}

          {detailAnalytics && !detailLoading && (
            <>
              <Typography variant="h6" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827', mb: 3 }}>
                {detailAnalytics.test?.name || selectedTest} — Detailed Analytics
              </Typography>

              {/* Stats row */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { label: 'Completed', value: detailAnalytics.totalSubmissions, icon: Assessment, color: '#111827', bg: 'rgba(232,184,109,0.15)' },
                  { label: 'Unique Users', value: detailAnalytics.totalUsers, icon: Mail, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
                  { label: 'Avg Time', value: formatTime(detailAnalytics.avgTimeSeconds), icon: BarChart, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
                  {
                    label: 'Completion',
                    value: detailAnalytics.completionRate == null ? '—' : `${detailAnalytics.completionRate}%`,
                    icon: TrendingUp,
                    color: '#f472b6',
                    bg: 'rgba(244,114,182,0.15)',
                  },
                  {
                    label: detailAnalytics.test?.scoringMode === 'scored' ? 'Avg Score' : 'Recommendation Types',
                    value: detailAnalytics.test?.scoringMode === 'scored'
                      ? `${detailAnalytics.avgPercentage ?? '—'}%`
                      : Object.keys(detailAnalytics.recommendationBreakdown || {}).length,
                    icon: PieChart,
                    color: '#7c3aed',
                    bg: 'rgba(167,139,250,0.15)',
                  },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <Grid item xs={12} sm={6} md={3} key={label}>
                    <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: bg }}>
                          <Icon sx={{ color, fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {label}
                          </Typography>
                          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
                            {value}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {/* Abandoned attempts. This slot used to hold a second
                    "Completion Rate" card that divided submissions by
                    themselves — arithmetic that can only ever return 100%,
                    which is why every test looked perfectly engaging. The real
                    completion rate is the stat card above. */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(251,191,36,0.15)' }}>
                        <Assessment sx={{ color: '#fbbf24', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Abandoned
                        </Typography>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
                          {detailAnalytics.abandonedCount ?? 0}
                        </Typography>
                        <Typography sx={{ color: '#9ca3af', fontSize: '0.65rem' }}>
                          of {detailAnalytics.totalAttempts ?? detailAnalytics.totalSubmissions} attempts
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                {/* Pass rate */}
                {detailAnalytics.passRate != null && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: detailAnalytics.passRate >= 70 ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)' }}>
                          <TrendingUp sx={{ color: detailAnalytics.passRate >= 70 ? '#34d399' : '#f87171', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Pass Rate
                          </Typography>
                          {/* passRate is passed/scored, so this fraction has to use
                              the scored cohort. Dividing by every submission
                              misreported any test holding unscored attempts. */}
                          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
                            {detailAnalytics.passRate}% ({detailAnalytics.passedCount}/{detailAnalytics.passedCount + detailAnalytics.failedCount})
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>

              {/* Drop-off + per-question analytics */}
              {detailAnalytics.dropOffCurve && detailAnalytics.dropOffCurve.length > 0 && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Drop-off funnel */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h7" sx={{ color: '#111827', fontWeight: 700 }}>
                            Completion Funnel
                          </Typography>
                          {detailAnalytics.biggestDropOff && (
                            <Tooltip title={`Largest drop: Q${detailAnalytics.biggestDropOff.questionIndex + 1} — ${detailAnalytics.biggestDropOff.question.substring(0, 60)}`}>
                              <Warning sx={{ color: '#ef4444', fontSize: 18 }} />
                            </Tooltip>
                          )}
                        </Box>
                        <Box sx={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={detailAnalytics.dropOffCurve.map((pct, i) => ({ question: `Q${i + 1}`, reached: pct }))} margin={{ top: 10, right: 10, bottom: 40, left: 50 }}>
                              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                              <XAxis dataKey="question" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} tickMargin={8} interval="preserveStartEnd" />
                              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} tickMargin={6} tickFormatter={(v) => v + '%'} />
                              <ReTooltip contentStyle={{ backgroundColor: 'rgba(6,30,18,0.95)', border: '1px solid rgba(232,184,109,0.2)', borderRadius: 12, color: '#111827', fontSize: 13, backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#111827' }} formatter={(value) => [`${value}% reached`, 'Users'] } />
                              <Bar dataKey="reached" fill="#e8b86d" radius={[4, 4, 0, 0]} maxBarSize={40} name="Reached" />
                            </ReBarChart>
                          </ResponsiveContainer>
                        </Box>
                        <Typography sx={{ color: '#6b7280', fontSize: '0.72rem', mt: 2, textAlign: 'center' }}>
                          % of users who reached each question (of {detailAnalytics.test?.totalQuestions || detailAnalytics.dropOffCurve.length})
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Per-question accuracy */}
                  {keyedQuestions.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h7" sx={{ color: '#111827', mb: 3, fontWeight: 700 }}>
                            Per-Question Accuracy
                          </Typography>
                          <Box sx={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              {/* Field is correctPct — this chart read `q.accuracy`,
                                  which never existed, so the bars stayed empty. */}
                              <ReBarChart data={keyedQuestions.map((q) => ({
                                question: `Q${q.index + 1}`,
                                accuracy: q.correctPct ?? 0,
                                difficulty: q.difficulty,
                              }))} margin={{ top: 10, right: 10, bottom: 40, left: 50 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="question" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} tickMargin={8} interval="preserveStartEnd" />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} tickMargin={6} tickFormatter={(v) => v + '%'} domain={[0, 100]} />
                                <ReTooltip contentStyle={{ backgroundColor: 'rgba(6,30,18,0.95)', border: '1px solid rgba(232,184,109,0.2)', borderRadius: 12, color: '#111827', fontSize: 13, backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#111827' }} formatter={(value) => [`${value}% correct`, 'Accuracy'] } />
                                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} maxBarSize={40} name="Accuracy">
                                  {keyedQuestions.map((q, i) => (
                                    <Cell key={i} fill={q.difficulty === 'advanced' ? '#f87171' : q.difficulty === 'beginner' ? '#34d399' : '#fbbf24'} />
                                  ))}
                                </Bar>
                              </ReBarChart>
                            </ResponsiveContainer>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'center' }}>
                            {[['beginner','#34d399'], ['intermediate','#fbbf24'], ['advanced','#f87171']].map(([lvl, c]) => (
                              <Box key={lvl} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: c }} />
                                <Typography sx={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'capitalize' }}>{lvl}</Typography>
                              </Box>
                            ))}
                          </Box>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.65rem', mt: 2, textAlign: 'center' }}>
                            Only questions with a designated correct answer are shown.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Item analysis, recommendation pie and category bar. */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Difficulty mix + item-level analysis: where the bank gets hard,
                    which items eat time, and which distractors pull votes.
                    `item` as well as `container`: a bare container is not a grid
                    item, so it escaped the column maths and its negative spacing
                    margins pushed the cards outside the row. */}
                {detailAnalytics.perQuestionStats && detailAnalytics.perQuestionStats.length > 0 && (
                  <Grid item xs={12} container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h7" sx={{ color: '#111827', fontWeight: 700, mb: 2.5, display: 'block' }}>
                            Difficulty Mix vs Accuracy
                          </Typography>
                          {(detailAnalytics.difficultyBreakdown || []).map((tier) => (
                            <Box key={tier.tier} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>
                                  {tier.tier} · {tier.count} q
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>
                                  {tier.accuracyPct == null ? '—' : `${tier.accuracyPct}% correct`}
                                </Typography>
                              </Box>
                              <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#f3f4f6', overflow: 'hidden' }}>
                                <Box sx={{
                                  height: '100%', borderRadius: 3,
                                  width: `${Math.min(100, ((tier.count / (detailAnalytics.test?.totalQuestions || 1)) * 100))}%`,
                                  bgcolor: tier.tier === 'advanced' ? '#f87171' : tier.tier === 'beginner' ? '#34d399' : '#fbbf24',
                                }} />
                              </Box>
                            </Box>
                          ))}
                          <Typography sx={{ color: '#9ca3af', fontSize: '0.68rem', mt: 1 }}>
                            Accuracy needs keyed questions; a timed section shows as the bar filling.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h7" sx={{ color: '#111827', fontWeight: 700, mb: 2 }}>
                            Item Analysis
                          </Typography>
                          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  {['Q', 'Difficulty', 'Answered', 'Correct', 'Avg time', 'Top distractor'].map(h => (
                                    <TableCell key={h} sx={{ color: '#6b7280', fontSize: '0.68rem', fontWeight: 700, borderColor: 'rgba(0, 0, 0, 0.08)', textTransform: 'uppercase' }}>{h}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detailAnalytics.perQuestionStats.map((q) => (
                                  <TableRow key={q.index}>
                                    <TableCell sx={{ color: '#111827', fontSize: '0.75rem', borderColor: '#f3f4f6', fontWeight: 700 }}>Q{q.index + 1}</TableCell>
                                    <TableCell sx={{ borderColor: '#f3f4f6' }}>
                                      <Chip
                                        label={q.difficulty}
                                        size="small"
                                        sx={{
                                          height: 18, fontSize: '0.62rem', fontWeight: 700, textTransform: 'capitalize',
                                          bgcolor: q.difficulty === 'advanced' ? 'rgba(248,113,113,0.15)' : q.difficulty === 'beginner' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                                          color: q.difficulty === 'advanced' ? '#f87171' : q.difficulty === 'beginner' ? '#34d399' : '#fbbf24',
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontSize: '0.72rem', borderColor: '#f3f4f6' }}>
                                      {q.answeredCount}
                                      {q.skippedCount > 0 ? ` (${q.skippedCount} skipped)` : ''}
                                    </TableCell>
                                    <TableCell sx={{
                                      fontSize: '0.72rem', fontWeight: 700, borderColor: '#f3f4f6',
                                      color: q.correctPct == null ? 'rgba(0, 0, 0, 0.35)' : q.correctPct < 40 ? '#f87171' : q.correctPct < 70 ? '#fbbf24' : '#34d399',
                                    }}>
                                      {/* A keyed question nobody has answered yet used to
                                          read "not keyed" here — it has a key, it just has
                                          no data. Only unkeyed items are unkeyed. */}
                                      {!q.hasCorrectKey
                                        ? 'Not keyed'
                                        : q.answeredCount === 0
                                          ? 'No answers'
                                          : `${q.correctPct}% (${q.correctCount}/${q.answeredCount})`}
                                    </TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontSize: '0.72rem', borderColor: '#f3f4f6' }}>
                                      {q.avgTimeSeconds == null ? '—' : `${q.avgTimeSeconds}s`}
                                    </TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontSize: '0.7rem', borderColor: '#f3f4f6', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {/* A distractor out-polling the key is a broken question, not a weak cohort. */}
                                      {q.topDistractor ? `${q.topDistractor.pct}% picked “${String(q.topDistractor.text).substring(0, 34)}”` : '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {detailAnalytics.recommendationBreakdown && Object.keys(detailAnalytics.recommendationBreakdown).length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h7" sx={{ color: '#111827', fontWeight: 700 }}>
                            Recommendation Distribution
                          </Typography>
                          <Tooltip title="Click a segment to filter results">
                            <Info sx={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: 18 }} />
                          </Tooltip>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <Box sx={{ flex: 1, minWidth: 260, height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                {/* Slice colours come from the <Cell> children below,
                                    so the per-row `fill` was dead weight (and an
                                    O(n) indexOf inside a map). */}
                                <Pie
                                  data={Object.entries(detailAnalytics.recommendationBreakdown).map(([name, value]) => ({ name, value }))}
                                  onClick={handlePieClick}
                                  cx="50%" cy="50%" labelLine={false}
                                  innerRadius={55} outerRadius={92} paddingAngle={2}
                                  dataKey="value" nameKey="name"
                                  label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`}
                                  style={{ fontSize: 11, fill: '#6b7280', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  {Object.entries(detailAnalytics.recommendationBreakdown).map((_, i) => (
                                    <Cell 
                                      key={i} 
                                      fill={COLORS[i % COLORS.length]} 
                                      stroke={recommendationFilter === Object.keys(detailAnalytics.recommendationBreakdown)[i] ? '#ffffff' : '#0a2e1d'} 
                                      strokeWidth={recommendationFilter === Object.keys(detailAnalytics.recommendationBreakdown)[i] ? 3 : 2} 
                                    />
                                  ))}
                                </Pie>
                                <ReTooltip
                                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                  contentStyle={{
                                    backgroundColor: 'rgba(6,30,18,0.95)', border: '1px solid rgba(232,184,109,0.2)',
                                    borderRadius: 12, color: '#111827', fontSize: 13, backdropFilter: 'blur(10px)',
                                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                                  }}
                                  itemStyle={{ color: '#111827' }}
                                  formatter={(value) => [
                                    detailAnalytics.totalSubmissions > 0
                                      ? `${value} (${((value / detailAnalytics.totalSubmissions) * 100).toFixed(1)}%)`
                                      : `${value}`,
                                    'Submissions',
                                  ]}
                                />
                              </RePieChart>
                            </ResponsiveContainer>
                          </Box>
                          {/* The recharts <Legend/> sat outside <RePieChart>, where it
                              resolves no chart context and renders null — and the
                              slice labels already print every name and share. */}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Bar chart.
                    A scored test has no category points (its options carry a
                    key, not weights), so "average category scores" charted a
                    row of zeros. Those tests get the score spread instead —
                    the backend has always returned it, nothing rendered it. */}
                {(() => {
                  const isScored = detailAnalytics.test?.scoringMode === 'scored';
                  const rows = isScored
                    ? (detailAnalytics.scoreDistribution || []).map(d => ({ name: d.label, value: d.count }))
                    : Object.entries(detailAnalytics.categoryScores || {}).map(([name, value]) => ({ name, value }));
                  if (rows.length === 0) return null;
                  return (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h7" sx={{ color: '#111827', mb: 3, fontWeight: 700 }}>
                          {isScored ? 'Score Distribution' : 'Average Category Scores'}
                        </Typography>
                        <Box sx={{ height: 260 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={rows} margin={{ top: 10, right: 10, bottom: 40, left: 50 }}>
                              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                              <XAxis
                                dataKey="name" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                                tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} tickMargin={8}
                                interval="preserveStartEnd"
                              />
                              <YAxis
                                tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                                tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.12)' }} tickMargin={6}
                              />
                              <ReTooltip
                                cursor={{ fill: '#6b7280' }}
                                contentStyle={{
                                  backgroundColor: 'rgba(6,30,18,0.95)', border: '1px solid rgba(232,184,109,0.2)',
                                  borderRadius: 12, color: '#111827', fontSize: 13, backdropFilter: 'blur(10px)',
                                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                                }}
                                itemStyle={{ color: '#111827' }}
                                formatter={(value) => [isScored ? `${value} attempts` : `${value} pts`, isScored ? 'Learners' : 'Average Score']}
                              />
                              <Bar dataKey="value" fill="#e8b86d" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </ReBarChart>
                          </ResponsiveContainer>
                        </Box>
                        <Typography sx={{ color: '#6b7280', fontSize: '0.72rem', mt: 2, textAlign: 'center' }}>
                          {/* Sum of the buckets, not every submission: the
                              distribution counts scored attempts only. */}
                          {isScored
                            ? `How ${rows.reduce((sum, r) => sum + r.value, 0)} scored attempt(s) were distributed`
                            : `Average points per category across all ${detailAnalytics.totalSubmissions} submissions`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  );
                })()}
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* ─── Full results table & Filters ──────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700 }}>
                {selectedTest === 'all' ? 'All Test Results' : `Full Results — ${tests.find(t => t.slug === selectedTest)?.name || selectedTest}`}
              </Typography>
              {recommendationFilter && (
                <Chip 
                  label={`Filter: ${recommendationFilter}`} 
                  onDelete={() => setRecommendationFilter(null)}
                  size="small"
                  sx={{ ml: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827', border: '1px solid #6ee7b7', fontWeight: 600 }} 
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Tooltip title={lastSyncedAt ? `Last synced ${formatRelative(lastSyncedAt)}` : 'Reload all analytics data'}>
                <span>
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                    size="small"
                    aria-label="Refresh analytics data"
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.15)', color: '#111827',
                      '&:hover': { borderColor: '#10b981', color: '#111827' },
                      textTransform: 'none', px: 2,
                    }}
                  >
                    {refreshing ? 'Syncing…' : 'Refresh'}
                  </Button>
                </span>
              </Tooltip>
              {processedResults.length > 0 && (
                <Button
                  startIcon={<Download />}
                  onClick={handleExportCsv}
                  size="small"
                  sx={{
                    bgcolor: '#ecfdf5', border: '1px solid #6ee7b7', color: '#111827',
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' },
                    textTransform: 'none', px: 2
                  }}
                >
                  {`Export CSV (${processedResults.length})`}
                </Button>
              )}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: '#6b7280' }}>Filter by Test</InputLabel>
                <Select
                  value={selectedTest}
                  label="Filter by Test"
                  onChange={(e) => handleTestChange(e.target.value)}
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.02)', color: 'var(--color-ink)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                    '& .MuiSvgIcon-root': { color: '#6b7280' }
                  }}
                >
                  <MenuItem value="all">All Tests</MenuItem>
                  {tests.map(t => <MenuItem key={t._id} value={t.slug}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Search & Advanced Filters Row */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Status is the difference between "this test is unpopular" and
                "people open it and leave" — they are different problems. */}
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel sx={{ color: '#6b7280' }}>Attempt Status</InputLabel>
              <Select
                value={statusFilter}
                label="Attempt Status"
                onChange={(e) => {
                  // The recommendation pie is built from completed results only,
                  // so a segment filter carried into another status could only
                  // ever produce an empty table.
                  setStatusFilter(e.target.value);
                  setRecommendationFilter(null);
                  setResultsPage(0);
                }}
                sx={{
                  bgcolor: '#ffffff', color: 'var(--color-ink)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.25)' },
                  '& .MuiSvgIcon-root': { color: '#6b7280' }
                }}
              >
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="abandoned">Abandoned</MenuItem>
                <MenuItem value="all">All attempts</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search name, email, test or result…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1, minWidth: 240,
                '& .MuiOutlinedInput-root': {
                  color: '#111827', bgcolor: '#ffffff', borderRadius: '12px',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.25)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputBase-input::placeholder': { color: '#6b7280', opacity: 1 }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: '#6b7280', fontSize: 20 }} /></InputAdornment>,
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                      <Clear sx={{ color: '#6b7280', fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#6b7280' }}>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => { setDateRange(e.target.value); setResultsPage(0); }}
                sx={{
                  bgcolor: '#ffffff', color: 'var(--color-ink)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.25)' },
                  '& .MuiSvgIcon-root': { color: '#6b7280' }
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: '#6b7280' }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => { setSortBy(e.target.value); setResultsPage(0); }}
                sx={{
                  bgcolor: '#ffffff', color: 'var(--color-ink)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.25)' },
                  '& .MuiSvgIcon-root': { color: '#6b7280' }
                }}
              >
                <MenuItem value="dateDesc">Newest First</MenuItem>
                <MenuItem value="dateAsc">Oldest First</MenuItem>
                <MenuItem value="scoreDesc">Score: High to Low</MenuItem>
                <MenuItem value="scoreAsc">Score: Low to High</MenuItem>
                <MenuItem value="timeDesc">Time: High to Low</MenuItem>
                <MenuItem value="timeAsc">Time: Low to High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Counts live next to the table so the numbers a reader is about to
            act on are never off-screen. */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ color: '#6b7280', fontSize: '0.82rem' }} role="status" aria-live="polite">
            {resultsLoading
              ? 'Loading attempts…'
              : resultsError
                ? 'Attempts unavailable'
                : processedResults.length === allResults.length
                  ? `${processedResults.length} ${processedResults.length === 1 ? 'attempt' : 'attempts'}`
                  : `${processedResults.length} of ${allResults.length} attempts shown`}
            {' · '}
            {statusFilter === 'completed' ? 'Completed' : statusFilter === 'abandoned' ? 'Abandoned' : 'All attempts'}
          </Typography>
          {statusFilter === 'abandoned' && (
            <Typography sx={{ color: 'rgba(251,191,36,0.85)', fontSize: '0.78rem' }}>
              These learners opened the test and left before submitting — the shape of your drop-off.
            </Typography>
          )}
        </Box>

        {resultsLoading ? (
          <Paper elevation={0} sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e5e7eb', borderRadius: '20px', p: 2,
          }} aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px', mb: 1 }} />
            ))}
          </Paper>
        ) : processedResults.length === 0 ? (
          <Paper elevation={0} sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
          }}>
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Info sx={{ color: '#d1d5db', fontSize: 48 }} />
              <Typography sx={{ color: '#6b7280', mt: 2, fontSize: '1.1rem' }}>
                {/* "matching your filters" was shown even with no filters set,
                    which reads as a bug to anyone looking at an empty account. */}
                {resultsError
                  ? "Couldn't load attempts — the request failed. Use Refresh to try again."
                  : (searchQuery || dateRange !== 'all' || recommendationFilter)
                    ? 'No results found matching your filters.'
                    : statusFilter === 'abandoned'
                      ? 'No abandoned attempts — nothing has been left unfinished.'
                      : statusFilter === 'all'
                        ? 'No attempts recorded yet.'
                        : selectedTest === 'all'
                          ? 'No assessment has been completed yet.'
                          : 'No completed attempts for this assessment yet.'}
              </Typography>
              {(searchQuery || dateRange !== 'all' || recommendationFilter) && (
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setDateRange('all');
                    setRecommendationFilter(null);
                    setResultsPage(0);
                  }}
                  sx={{ mt: 2, color: '#111827', textTransform: 'none' }}
                >
                  Clear all filters
                </Button>
              )}
            </Box>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
          }}>
            <Table sx={{ minWidth: 650, '& th': { borderBottom: '1px solid rgba(0,0,0,0.05)', color: '#4b5563', fontWeight: 600 }, '& td': { borderBottom: '1px solid rgba(0,0,0,0.03)', color: '#111827' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Test</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Result</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>When</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedResults.map((row) => (
                  <TableRow key={row._id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Typography sx={{ fontWeight: 600, color: '#111827' }}>{row.user?.name || 'Anonymous User'}</Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>{row.user?.email || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Typography sx={{ color: '#111827', fontWeight: 500 }}>{row.testName}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      {/* A keyed test has a score; a psychometric one has a
                          recommended direction. Showing the category name as
                          "the result" of a scored test told an admin nothing. */}
                      {row.percentage != null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ color: '#111827', fontWeight: 800, fontSize: '0.95rem' }}>{row.percentage}%</Typography>
                          {row.passed != null && (
                            <Chip
                              size="small"
                              label={row.passed ? 'Pass' : 'Fail'}
                              sx={{
                                height: 18, fontSize: '0.62rem', fontWeight: 700,
                                bgcolor: row.passed ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)',
                                color: row.passed ? '#34d399' : '#f87171',
                              }}
                            />
                          )}
                        </Box>
                      ) : row.topRecommendation ? (
                        <Chip label={row.topRecommendation} size="small"
                          sx={{ bgcolor: 'rgba(232,184,109,0.18)', color: '#111827', border: '1px solid rgba(232,184,109,0.35)', fontWeight: 700 }} />
                      ) : '—'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      {row.status === 'abandoned' ? (
                        <Chip
                          size="small"
                          label={row.lastQuestionIndex != null ? `Left at Q${row.lastQuestionIndex + 1}` : 'Abandoned'}
                          sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontWeight: 700 }}
                        />
                      ) : (
                        <Chip size="small" label="Completed"
                          sx={{ bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '0.88rem' }}>
                      {row.timeTaken > 0 ? `${Math.floor(row.timeTaken/60)}m ${row.timeTaken%60}s` : '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '0.88rem' }}>
                      <Tooltip title={attemptDate(row) ? new Date(attemptDate(row)).toLocaleString('en-IN') : ''}>
                        <span>{formatRelative(attemptDate(row))}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => setViewResult(row)}
                        aria-label={`View details for ${row.user?.name || 'anonymous learner'}`}
                        sx={{
                          color: '#60a5fa', bgcolor: 'rgba(96,165,250,0.1)',
                          '&:hover': { bgcolor: 'rgba(96,165,250,0.2)' },
                          textTransform: 'none', borderRadius: '12px'
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Tooltip title="Delete record">
                        {/* A disabled child needs this wrapper, or MUI can't
                            attach its listeners and the tooltip never opens. */}
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteResultDialog(row)}
                            disabled={!row._id || deletingId === row._id}
                            aria-label={`Delete attempt for ${row.user?.name || 'anonymous learner'}`}
                            sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244,63,94,0.15)' } }}
                          >
                            {deletingId === row._id ? <CircularProgress size={16} color="inherit" /> : <Delete fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={processedResults.length}
              page={
                // Clamped: a filter or a delete can leave the pointer past the
                // end for one render, and MUI warns about an out-of-range page.
                Math.min(resultsPage, lastPage)
              }
              SelectProps={{ inputProps: { 'aria-label': 'Rows per page' } }}
              onPageChange={(_, newPage) => setResultsPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setResultsPage(0); }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              sx={{
                color: '#6b7280',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: '#6b7280', fontSize: '0.75rem',
                },
                '& .MuiTablePagination-select': {
                  bgcolor: 'rgba(0,0,0,0.02)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                },
                '& .MuiTablePagination-actions': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            />
          </TableContainer>
        )}
      </Box>

      <ResultDetailsDialog
        open={!!viewResult}
        onClose={() => setViewResult(null)}
        result={viewResult}
        test={tests.find(t => t.slug === viewResult?.testSlug)}
        cohort={detailAnalytics && selectedTest !== 'all' && detailAnalytics.test?.slug === viewResult?.testSlug ? detailAnalytics : null}
        rank={(() => {
          if (!viewResult || viewResult.percentage == null) return null;
          const peers = allResults.filter(r => r.testSlug === viewResult.testSlug && r.percentage != null && r.status !== 'abandoned');
          if (peers.length < 2) return null;
          const sorted = [...peers].sort((a, b) => b.percentage - a.percentage);
          const pos = sorted.findIndex(r => r._id === viewResult._id);
          return pos >= 0 ? { rank: pos + 1, of: sorted.length } : null;
        })()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteResultDialog)}
        onClose={() => setDeleteResultDialog(null)}
        PaperProps={{
          sx: {
            bgcolor: '#ffffff',
            backgroundImage: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: '20px',
            color: '#111827',
            p: 1,
            minWidth: 320
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#f43f5e' }}>
          Delete Test Result
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#111827', fontSize: '0.95rem' }}>
            Are you sure you want to delete the test result for <strong>{deleteResultDialog?.user?.name || 'Anonymous User'}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteResultDialog(null)}
            sx={{ color: '#6b7280', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteResult}
            disabled={deletingId === deleteResultDialog?._id}
            sx={{
              bgcolor: '#f43f5e',
              color: '#ffffff',
              textTransform: 'none',
              '&:hover': { bgcolor: '#e11d48' },
              '&.Mui-disabled': { bgcolor: 'rgba(244,63,94,0.3)', color: '#ffffff' }
            }}
          >
            {deletingId === deleteResultDialog?._id ? <CircularProgress size={16} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
