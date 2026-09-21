import { HUMANITIES_TRACKS, LENSES, humanitiesMeta } from '../constants/humanitiesMeta';

export { HUMANITIES_TRACKS, LENSES, humanitiesMeta };

/**
 * Build the full analytics model for a Humanities Career Test result.
 * Shared by the on-screen report (HumanitiesReport) and the print/PDF
 * document (HumanitiesReportPrintDocument) — and by My Results, which builds
 * PDFs for past attempts without mounting the on-screen report.
 *
 * The bank is a strict grid: 19 career tracks × 4 lenses (Activity, Comfort,
 * Career Knowledge quiz, Personality), with track = questionIndex % 19 and
 * the blocks at 0–18 / 19–37 / 38–56 / 57–75. Every option scores into the
 * single "Humanities" resultData category, so the per-track profile is
 * derived here from the stored per-question answers — the same server-scored
 * weights, re-sliced by track.
 *
 * Pure function of (result, test): no hooks, no state, so any caller gets the
 * exact same numbers the on-screen report shows.
 */
export function buildHumanitiesReportModel(result, test) {
  const stats = result?.questionStats || {};
  const answers = result?.answers || {};
  const questions = test?.questions || [];
  const trackCount = HUMANITIES_TRACKS.length; // 19

  /* ── Per-track points, per lens ─────────────────────────────────────────
     Preference lenses award 3/1/0 per question; the knowledge quiz awards 3
     only for a correct pick, so its points ÷ 3 is the correct-answer count. */
  const lensTrackPts = LENSES.map(() => HUMANITIES_TRACKS.map(() => 0));

  Object.entries(answers).forEach(([idxStr, a]) => {
    const i = Number(idxStr);
    if (!Number.isFinite(i) || !a) return;
    const pts = a.points || {};
    const sum = Object.values(pts).reduce((s, v) => s + (Number(v) || 0), 0);
    if (!sum) return;
    const lens = LENSES.findIndex((l) => i >= l.from && i <= l.to);
    if (lens >= 0) lensTrackPts[lens][i % trackCount] += sum;
  });

  const [activityPts, comfortPts, knowledgePts, personalityPts] = lensTrackPts;

  /* Composite strength per track, an integer 0–100 index:
     - pull · the three preference lenses (3/1/0 each; one question per lens
       per track → 0–9 raw)
     - know · the graded career-knowledge quiz (one keyed question per track,
       0 or 1 correct)
     Pull counts double (wanting a career matters more than knowing its trivia)
     and the two are averaged into the headline ranking. */
  const tracks = HUMANITIES_TRACKS.map((name, t) => {
    const pref = activityPts[t] + comfortPts[t] + personalityPts[t]; // 0–9
    const knowledge = knowledgePts[t] / 3; // 0 or 1
    const total = Math.round((((pref / 9) * 2 + knowledge) / 3) * 100); // 0–100
    const meta = humanitiesMeta[name];
    return {
      name,
      meta,
      pref,
      prefPct: Math.round((pref / 9) * 100),
      knowledge,
      knowledgePct: Math.round(knowledge * 100),
      total,
      activityPts: activityPts[t],
      comfortPts: comfortPts[t],
      personalityPts: personalityPts[t],
    };
  });

  const ranked = [...tracks].sort((a, b) =>
    (b.total - a.total) || (b.pref - a.pref) || a.name.localeCompare(b.name));
  const hasTrackData = ranked.some((t) => t.total > 0);

  /* Without stored answers every track totals 0 and the alphabetical
     tie-break would crown a bogus winner — suppress the verdict instead. */
  const topTrack = hasTrackData ? ranked[0] : null;
  const runnerUp = hasTrackData ? (ranked[1] || null) : null;
  const marginPts = runnerUp ? Math.round((topTrack.total - runnerUp.total) * 10) / 10 : null;
  const marginPct = runnerUp && topTrack.total > 0
    ? Math.round(((topTrack.total - runnerUp.total) / topTrack.total) * 100)
    : null;
  const decisive = marginPct != null && marginPct >= 8;

  /* ── Career-knowledge quiz ──────────────────────────────────────────────── */
  let kRight = 0;
  let kTotal = 0;
  const kByTrack = HUMANITIES_TRACKS.map(() => ({ right: 0, total: 0 }));
  Object.entries(stats).forEach(([idxStr, st]) => {
    if (st?.correct !== true && st?.correct !== false) return;
    const i = Number(idxStr);
    const t = i % trackCount;
    kTotal++;
    kByTrack[t].total++;
    if (st.correct) { kRight++; kByTrack[t].right++; }
  });
  const knowledgeQuiz = {
    right: kRight,
    total: kTotal,
    pct: kTotal ? Math.round((kRight / kTotal) * 100) : null,
    byTrack: kByTrack.map((b, t) => ({
      name: HUMANITIES_TRACKS[t],
      right: b.right,
      total: b.total,
      pct: b.total ? Math.round((b.right / b.total) * 100) : null,
    })),
  };

  /* Do you like it AND know it? Ranks the signals independently. */
  const prefRanked = hasTrackData ? [...tracks].sort((a, b) => (b.pref - a.pref) || a.name.localeCompare(b.name)) : [];
  const knowRanked = kTotal > 0 ? [...tracks].sort((a, b) => (b.knowledge - a.knowledge) || a.name.localeCompare(b.name)) : [];
  const prefTop = prefRanked[0];
  const knowTop = knowRanked[0];
  const alignment = {
    prefTop: prefTop?.name,
    knowTop: knowTop?.name,
    agree: Boolean(prefTop && knowTop && prefTop.name === knowTop.name && topTrack && prefTop.name === topTrack.name),
    prefKnowAgree: Boolean(prefTop && knowTop && prefTop.name === knowTop.name),
  };

  /* How strong is the #1 pull? Bands turn the number into honest language. */
  const prefPct = topTrack?.prefPct ?? 0;
  const fitBand = !hasTrackData
    ? { key: 'none', headline: 'Not enough data', body: 'This attempt stored no per-question answers, so the track profile could not be rebuilt.' }
    : prefPct >= 89
      ? { key: 'strong', headline: 'Strong match', body: 'You picked the strongest option for this career in all three preference lenses — every point of pull you expressed pointed here.' }
      : prefPct >= 56
        ? { key: 'clear', headline: 'Clear match', body: `A clear majority of your pull (${prefPct}% of the 9 available points) pointed here, ahead of every other track. Worth testing through a project or shadowing.` }
        : { key: 'exploratory', headline: 'Emerging match', body: `Your pull is spread across several careers (${prefPct}% for the leader). Treat this as a shortlist to explore, not a verdict.` };

  /* Data-driven aptitude totals (any graded question, matching reportModel). */
  let aRight = 0;
  let aTotal = 0;
  Object.values(stats).forEach((st) => {
    if (st?.correct === true || st?.correct === false) { aTotal++; if (st.correct) aRight++; }
  });
  const aptitude = { right: aRight, total: aTotal, pct: aTotal ? Math.round((aRight / aTotal) * 100) : null };

  /* ── Pace: overall and per lens ─────────────────────────────────────────── */
  let rightTime = 0; let wrongTime = 0; let gradedRight = 0; let gradedWrong = 0;
  let totalTime = 0; let timedQ = 0;
  Object.values(stats).forEach((st) => {
    const t = Number(st?.timeSpentSeconds) || 0;
    totalTime += t;
    if (st && (st.correct === true || st.correct === false)) {
      timedQ++;
      if (st.correct) { gradedRight++; rightTime += t; } else { gradedWrong++; wrongTime += t; }
    }
  });
  const pacePerLens = LENSES.map((l) => {
    let time = 0; let count = 0;
    for (let i = l.from; i <= l.to; i++) {
      const st = stats[String(i)];
      if (st) { time += Number(st.timeSpentSeconds) || 0; count++; }
    }
    return { title: l.title, avg: count ? Math.round(time / count) : null };
  });
  const pace = {
    totalTime,
    timedQ,
    avgAll: timedQ ? Math.round(totalTime / timedQ) : null,
    avgRight: gradedRight ? Math.round(rightTime / gradedRight) : null,
    avgWrong: gradedWrong ? Math.round(wrongTime / gradedWrong) : null,
    gradedRight,
    gradedWrong,
    perLens: pacePerLens,
  };

  /* ── Missed quiz questions, with the right answer for review ───────────── */
  const mistakes = [];
  Object.entries(stats).forEach(([idxStr, st]) => {
    if (st?.correct !== false) return;
    const i = Number(idxStr);
    const q = questions[i];
    const picked = answers[String(i)]?.text ?? answers[i]?.text ?? result?.answerDetails?.[String(i)] ?? '—';
    const correctText = q?.options?.[q.correctOptionIndex]?.text;
    const time = Number(st?.timeSpentSeconds);
    mistakes.push({
      i,
      question: q?.question || `Question ${i + 1}`,
      picked,
      correctText: correctText || null,
      explanation: q?.explanation || '',
      time: Number.isFinite(time) && time > 0 ? time : null,
      flagged: Boolean(st?.flagged),
    });
  });
  mistakes.sort((a, b) => a.i - b.i);

  const answeredCount = Object.keys(answers).length || Object.keys(result?.answerDetails || {}).length;
  const totalQuestions = questions.length || 76;

  /* Top 8 for the radar — a 19-axis radar is unreadable. */
  const radarTracks = ranked.slice(0, 8).map((t) => [t.name, t.total]);

  return {
    questions, answers, stats,
    tracks, ranked, hasTrackData, radarTracks,
    topTrack, runnerUp, marginPts, marginPct, decisive,
    alignment, fitBand,
    knowledgeQuiz, aptitude, pace,
    answeredCount, totalQuestions, mistakes,
    lenses: LENSES, meta: humanitiesMeta,
  };
}
