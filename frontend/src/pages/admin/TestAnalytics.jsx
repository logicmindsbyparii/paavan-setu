import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Box, Typography, Card, CardContent, Tooltip, CircularProgress, Grid, Chip,
  TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, IconButton, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  Assessment, TrendingUp, Mail, BarChart, PieChart, Download, Warning, Info, 
  Search, Clear, Delete, Close as CloseIcon, Visibility, Refresh, PictureAsPdf
} from '@mui/icons-material';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { adminRequest, adminGetTests, adminGetTestAnalytics, adminGetTestAnalyticsBySlug, logApiFailure } from '../../lib/api';
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

function ResultDetailsDialog({ open, onClose, result, test }) {
  const pdfRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = async () => {
    const element = pdfRef.current;
    if (!element || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${result?.user?.name || 'Anonymous'}_Test_Result.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  // `fullMark` was computed for every row and never read — the radius axis
  // below uses domain={[0, 'auto']}.
  const chartData = useMemo(() => (
    Object.entries(result?.resultData || {}).map(([subject, A]) => ({ subject, A }))
  ), [result]);

  const questions = test?.questions || [];
  /* A scored test has a verdict for every question. A profile test has no right
     answers at all, so a "Correct" column could only ever say "not keyed" — it
     shows the points the chosen option contributed instead, which is what the
     psychometric result is actually built from. */
  const isScored = test?.scoringMode === 'scored';
  const questionRows = useMemo(() => {
    const stats = result?.questionStats || {};
    return questions
      .map((q, idx) => {
        const s = stats[String(idx)] || {};
        const chosenIdx = s.selectedOption;
        const chosen = chosenIdx >= 0 ? q.options?.[chosenIdx] : null;
        const row = {
          idx,
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
          flagged: Boolean(s.flagged),
          answered: chosenIdx >= 0,
        };
        return { ...row, verdict: answerVerdict(row) };
      })
      .filter((row) => row.answered || row.flagged);
  }, [result, questions]);

  const answeredCount = questionRows.filter((r) => r.answered).length;

  if (!result) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{
      sx: {
        bgcolor: '#ffffff', color: '#111827', borderRadius: '16px',
        border: '1px solid #f3f4f6'
      }
    }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        {/* DialogTitle already renders an <h2>; a variant="h6" Typography inside
            it nests <h6> in <h2>, which is invalid and breaks outline reading. */}
        <Typography component="span" variant="h6" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', color: '#111827', fontWeight: 700 }}>
          Result Profile
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#6b7280' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }} ref={pdfRef}>
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'baseline' }}>
          <Typography sx={{ color: '#111827', fontWeight: 600, fontSize: '1.1rem' }}>{result.user?.name || 'Anonymous'}</Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>{result.user?.email || 'No email provided'}</Typography>
          <Chip
            size="small"
            label={result.status === 'abandoned' ? 'Abandoned' : 'Completed'}
            sx={{
              ml: 'auto', fontWeight: 700,
              bgcolor: result.status === 'abandoned' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
              color: result.status === 'abandoned' ? '#fbbf24' : '#34d399',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {result.percentage != null && (
            <Box sx={{ flex: '1 1 200px', p: 2, bgcolor: 'rgba(52, 211, 153, 0.08)', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <Typography sx={{ color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Score</Typography>
              <Typography sx={{ color: '#34d399', fontSize: '1.2rem', fontWeight: 700 }}>
                {result.percentage}% ({result.score}/{result.maxScore})
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.78rem' }}>
                {result.passed === true ? 'Passed' : result.passed === false ? 'Not passed' : 'No pass mark set'}
              </Typography>
            </Box>
          )}
          <Box sx={{ flex: '1 1 200px', p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(232, 184, 109, 0.2)' }}>
            <Typography sx={{ color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
              {result.percentage != null ? 'Categories' : 'Top Recommendation'}
            </Typography>
            <Typography sx={{ color: '#111827', fontSize: '1.2rem', fontWeight: 700 }}>{result.topRecommendation || 'N/A'}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography sx={{ color: '#6b7280', fontSize: '0.82rem' }}>
            Answered {answeredCount}{questions.length ? ` of ${questions.length}` : ''}
            {result.status === 'abandoned' && result.lastQuestionIndex != null
              ? ` · stopped at question ${result.lastQuestionIndex + 1}`
              : ''}
          </Typography>
          {result.timeTaken > 0 && (
            <Typography sx={{ color: '#6b7280', fontSize: '0.82rem' }}>Took {formatTime(result.timeTaken)}</Typography>
          )}
          <Typography sx={{ color: '#6b7280', fontSize: '0.82rem' }}>
            {/* attemptDate can be null, and `new Date(null)` rendered 1/1/1970. */}
            {attemptDate(result) ? new Date(attemptDate(result)).toLocaleString('en-IN') : '—'}
          </Typography>
        </Box>

        {questionRows.length > 0 && (
          <Box sx={{ mb: 3, maxHeight: 340, overflowY: 'auto', border: '1px solid #f3f4f6', borderRadius: '12px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Q', 'Question', 'Answered', isScored ? 'Correct' : 'Points', 'Time'].map(h => (
                    <TableCell key={h} sx={{ bgcolor: 'rgba(0,0,0,0.02)', color: '#111827', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {questionRows.map((row) => (
                  <TableRow key={row.idx}>
                    <TableCell sx={{ color: '#111827', fontWeight: 700, fontSize: '0.75rem', borderColor: '#f3f4f6' }}>{row.idx + 1}</TableCell>
                    <TableCell sx={{ color: '#4b5563', fontSize: '0.75rem', maxWidth: 260, borderColor: '#f3f4f6' }}>
                      {row.question}
                      {row.flagged && (
                        <Chip label="flagged" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem', bgcolor: 'rgba(167,139,250,0.2)', color: '#6d28d9' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#111827', fontSize: '0.75rem', borderColor: '#f3f4f6' }}>
                      {row.chosen || <em style={{ color: 'rgba(239,68,68,1)' }}>skipped</em>}
                    </TableCell>
                    <TableCell sx={{
                      fontSize: '0.72rem', fontWeight: 700, borderColor: '#f3f4f6',
                      color: isScored ? row.verdict.color : '#e8b86d',
                    }}>
                      {isScored ? row.verdict.label : (row.points || '—')}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280', fontSize: '0.72rem', borderColor: '#f3f4f6' }}>
                      {row.time == null ? '—' : `${row.time}s`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {chartData.length > 1 && (
          <Box sx={{ height: 300, width: '100%', mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#f3f4f6" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar name="Score" dataKey="A" stroke="#10b981" fill="#e8b86d" fillOpacity={0.4} isAnimationActive={false} />
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
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #f3f4f6', p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleDownloadPdf} disabled={isExporting} startIcon={isExporting ? <CircularProgress size={16} /> : <PictureAsPdf />} sx={{ color: '#10b981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
          {isExporting ? 'Generating...' : 'Save as PDF'}
        </Button>
        <Button onClick={onClose} sx={{ color: '#111827' }}>Close</Button>
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
