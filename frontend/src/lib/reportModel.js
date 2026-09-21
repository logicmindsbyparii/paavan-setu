import { branchMeta, streamMeta, FALLBACK_SECTIONS } from '../constants/reportMeta';

export { branchMeta, streamMeta, FALLBACK_SECTIONS };

/**
 * Build the full analytics model for a stream/engineering-branch selector
 * result. Shared by the on-screen report (StreamSelectorReport) and the
 * print/PDF document (ReportPrintDocument) — and by My Results, which builds
 * PDFs for past attempts without mounting the on-screen report.
 *
 * Pure function of (result, test): no hooks, no state, so any caller gets the
 * exact same numbers the on-screen report shows.
 */
export function buildReportModel(result, test) {
  const stats = result?.questionStats || {};
  const answers = result?.answers || {};
  const questions = test?.questions || [];
  const isEngineering = test?.slug === 'engineering-branch-selector'
    || result?.testSlug === 'engineering-branch-selector';
  const typeName = isEngineering ? 'branch' : 'stream';
  const metaFor = (name) => (isEngineering ? branchMeta : streamMeta)[name];

  const sections = (test?.sections?.length)
    ? test.sections.map((s) => {
      const idx = [...(s.questionIndices || [])].sort((a, b) => a - b);
      return { title: s.title, from: idx[0] ?? 0, to: idx[idx.length - 1] ?? 0, indices: idx };
    })
    : FALLBACK_SECTIONS.map((s) => ({ ...s, indices: Array.from({ length: s.to - s.from + 1 }, (_, i) => s.from + i) }));

  const breakdown = Object.entries(result?.resultData || {}).sort((a, b) => b[1] - a[1]);
  const maxScore = Math.max(10, ...breakdown.map((b) => b[1])) + 2;
  const total = breakdown.reduce((s, [, v]) => s + v, 0);
  const [topStream, topPts] = breakdown[0] || ['Undetermined', 0];
  const confidence = total > 0 ? Math.round((topPts / total) * 100) : 0;

  /* A section is graded when the server recorded right/wrong for any of its
     questions — data-driven, works for both tests regardless of titles. */
  let right = 0;
  let totalQ = 0;
  const perSection = sections.map((s) => {
    let r = 0;
    let t = 0;
    s.indices.forEach((i) => {
      const c = stats[String(i)]?.correct;
      if (c === true || c === false) { t++; if (c) r++; }
    });
    right += r;
    totalQ += t;
    return { title: s.title, right: r, total: t, pct: t ? Math.round((r / t) * 100) : null, graded: t > 0 };
  });
  const aptitude = { right, total: totalQ, pct: totalQ ? Math.round((right / totalQ) * 100) : null, perSection };

  const isGraded = (s) => Boolean(aptitude.perSection.find((p) => p.title === s.title)?.graded);

  /* Interest signal: top categories inside the non-graded sections. */
  const interestLeaders = sections.filter((s) => !isGraded(s)).map((s) => {
    const sums = {};
    s.indices.forEach((i) => {
      const pts = answers[String(i)]?.points || answers[i]?.points || {};
      Object.entries(pts).forEach(([c, v]) => { sums[c] = (sums[c] || 0) + (Number(v) || 0); });
    });
    const ranked = Object.entries(sums).sort((a, b) => b[1] - a[1]);
    const totalPts = ranked.reduce((s, [, v]) => s + (Number(v) || 0), 0);
    return { title: s.title, leader: ranked[0]?.[0] || '—', leaderPts: ranked[0]?.[1] || 0, ranked: ranked.slice(0, 3), totalPts };
  });

  /* Pace analysis: seconds per question, correct vs incorrect. */
  let rightTime = 0;
  let wrongTime = 0;
  let gradedRight = 0;
  let gradedWrong = 0;
  let totalTime = 0;
  let timedQ = 0;
  Object.entries(stats).forEach(([, st]) => {
    const t = Number(st?.timeSpentSeconds) || 0;
    totalTime += t;
    if (st && (st.correct === true || st.correct === false)) {
      timedQ++;
      if (st.correct) { gradedRight++; rightTime += t; } else { gradedWrong++; wrongTime += t; }
    }
  });
  const pacePerSection = sections.map((s) => {
    let time = 0;
    let count = 0;
    s.indices.forEach((i) => {
      const st = stats[String(i)];
      if (st) { time += Number(st.timeSpentSeconds) || 0; count++; }
    });
    return { title: s.title, avg: count ? Math.round(time / count) : null };
  });
  const pace = {
    totalTime,
    timedQ,
    avgAll: timedQ ? Math.round(totalTime / timedQ) : null,
    avgRight: gradedRight ? Math.round(rightTime / gradedRight) : null,
    avgWrong: gradedWrong ? Math.round(wrongTime / gradedWrong) : null,
    gradedRight,
    gradedWrong,
    perSection: pacePerSection,
  };

  /* Decision clarity: margin between the top two. */
  const runnerUp = breakdown[1] || null;
  const marginPts = runnerUp ? topPts - runnerUp[1] : null;
  const marginPct = runnerUp && total > 0 ? Math.round((marginPts / total) * 100) : null;
  const decisive = marginPct != null && marginPct >= 10;

  /* Combined interest lean, comparable against the final verdict. */
  const interestSums = {};
  sections.forEach((s) => {
    if (isGraded(s)) return;
    s.indices.forEach((i) => {
      const pts = answers[String(i)]?.points || answers[i]?.points || {};
      Object.entries(pts).forEach(([c, v]) => { interestSums[c] = (interestSums[c] || 0) + (Number(v) || 0); });
    });
  });
  const interestRanked = Object.entries(interestSums).sort((a, b) => b[1] - a[1]);
  const interestTotal = interestRanked.reduce((s, [, v]) => s + (Number(v) || 0), 0);
  const interestTop = interestRanked.length
    ? { leader: interestRanked[0][0], pct: interestTotal ? Math.round((interestRanked[0][1] / interestTotal) * 100) : 0 }
    : null;

  const gradedRows = aptitude.perSection.filter((s) => s.graded);
  const bestSection = gradedRows.length ? gradedRows.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const worstSection = gradedRows.length > 1 ? gradedRows.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;

  /* Mistakes need the question bank for explanations; without a test doc the
     list degrades to question numbers + the stored picked answer. */
  const mistakes = [];
  Object.entries(stats).forEach(([idx, st]) => {
    if (st?.correct === false) {
      const i = Number(idx);
      const q = questions[i];
      const picked = answers[String(i)]?.text ?? answers[i]?.text ?? result?.answerDetails?.[String(i)] ?? '—';
      const time = Number(st?.timeSpentSeconds);
      mistakes.push({
        i,
        question: q?.question || `Question ${i + 1}`,
        picked,
        explanation: q?.explanation || '',
        time: Number.isFinite(time) && time > 0 ? time : null,
        flagged: Boolean(st?.flagged),
      });
    }
  });
  mistakes.sort((a, b) => a.i - b.i);

  const meta = metaFor(topStream) || branchMeta[topStream] || streamMeta[topStream];
  const answeredCount = Object.keys(answers).length || Object.keys(result?.answerDetails || {}).length;

  return {
    stats, answers, questions, isEngineering, typeName, metaFor,
    sections, breakdown, maxScore, total, topStream, topPts, confidence,
    aptitude, interestLeaders, pace, runnerUp, marginPts, marginPct, decisive,
    interestTop, bestSection, worstSection, mistakes, meta, answeredCount,
    branchMeta, streamMeta,
  };
}
