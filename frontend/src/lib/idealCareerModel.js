/**
 * Build the full analytics model for an Ideal Career Test (182 Q) result.
 *
 * The stored test bank is flat keyword-scored: interest questions dump points
 * into loose buckets ("General" wins by volume), work values are 1 pt each,
 * and the 45 aptitude questions carry a placeholder answer key. The honest
 * analytics therefore come from re-slicing the *stored per-question answers*
 * into the real test structure — the same data the server scored, re-cut:
 *
 *   Q1–28      Yes/No personality inventory
 *   Q29–52     work-situation interest (Never / May Be / Will love to)
 *   Q53–97     aptitude battery, 45 graded questions in 6 sections
 *   Q98–107    work values ranking (one value per question, in fixed order)
 *   Q108–182   Yes/No interest & motivation check
 *
 * Shared by the on-screen report (IdealCareerReport) and the print/PDF
 * document (IdealCareerReportPrintDocument) — and by My Results, which builds
 * PDFs for past attempts without mounting the on-screen report.
 *
 * Pure function of (result, test): no hooks, no state, so any caller gets the
 * exact same numbers the on-screen report shows.
 */

/* Q98–107 rank these work values, in this order (verified against the bank). */
export const IDEAL_VALUES = [
  'MONEY', 'RESPECT', 'FREEDOM', 'STABILITY', 'VARIETY',
  'LEISURE', 'LEADERSHIP', 'SERVICE', 'INTEREST', 'CHALLENGE',
];

export const valueMeta = {
  MONEY: { label: 'Money', weight: 2, blurb: 'Earning well beyond the basics — negotiating worth and building wealth.' },
  RESPECT: { label: 'Respect', weight: 1, blurb: 'Prestige and standing in the eyes of others.' },
  FREEDOM: { label: 'Freedom', weight: 1, blurb: 'Flexible hours, flexible place, self-directed work.' },
  STABILITY: { label: 'Stability', weight: 1, blurb: 'Job security and a predictable path.' },
  VARIETY: { label: 'Variety', weight: 1, blurb: 'Occupations that expose you to many different activities.' },
  LEISURE: { label: 'Leisure', weight: 1, blurb: 'Generous time off to live life outside work.' },
  LEADERSHIP: { label: 'Leadership', weight: 1, blurb: 'Responsibility for people, decisions and direction.' },
  SERVICE: { label: 'Service', weight: 1, blurb: 'Work that visibly helps people and society.' },
  INTEREST: { label: 'Interest', weight: 1, blurb: 'Working in a field you genuinely enjoy.' },
  CHALLENGE: { label: 'Challenge', weight: 1, blurb: 'Difficult problems that stretch you.' },
};

/* The 6 graded aptitude sections: Q53–97. */
const APT_SECTIONS = [
  { title: 'Visual pattern completion', from: 52, to: 60 },
  { title: 'Word analogies', from: 61, to: 69 },
  { title: 'Verbal aptitude', from: 70, to: 78 },
  { title: 'Quantitative aptitude', from: 79, to: 87 },
  { title: 'Reading comprehension', from: 88, to: 92 },
  { title: 'Sentence completion', from: 93, to: 96 },
];

/* Interest pillars: (from, to] question index spans re-sliced for themes. */
const PILLARS = [
  { title: 'Personality inventory', from: -1, to: 27 },
  { title: 'Work-situation interest', from: 27, to: 51 },
  { title: 'Interest & motivation check', from: 106, to: 181 },
];

/* Personality inventory keywords → the big-five-style lean they mark. */
const TRAIT_PATTERNS = [
  ['E', /part(y|ies)|talkativ|friend|gathering|speaking to more|social|door bell|express your feelings|be liked/i],
  ['C', /plan|schedul|routine|organiz|time management|disciplin|tidy/i],
  ['O', /imagin|creat|curios|new ideas|abstract|philosoph|read(ing)? (books|novels)/i],
  ['A', /team|cooperat|sympath|forgiv|polite|help/i],
  ['ES', /criticize|annoyed|moody|temper|irritat|worry|stress/i],
];
const traitLabels = { E: 'Outgoing Connector', A: 'Team Collaborator', C: 'Organised Planner', ES: 'Frank Realist', O: 'Curious Explorer' };

/* Career themes: first matching keyword wins the question's point. Order
   matters — specific stems before generic ones. */
const THEME_PATTERNS = [
  ['finance', /stock exchange|bank|finance|financial|money transaction|inflation|interest rates|exchange rates|account/i],
  ['culinary', /food and cooking|culinary|chef|guests/i],
  ['service', /counsell|stress|empath|reassur|distressed|sick|patient|volunt/i],
  ['media', /news|broadcast|journal|cover any recent|happening around|anchor/i],
  ['fashion', /fashionable|dresses and jewels/i],
  ['arts', /stage|expressive|actor|danc|sing|poet|theatre|story/i],
  ['creative', /creative|conceptualiz|video|audio|photograph|advert|colors shapes|artistic|imaginative/i],
  ['heritage', /ancient world|museum|artifact|heritage|archaeolog/i],
  ['environment', /mountains|forests|rivers|weather|wildlife|environment|nature/i],
  ['political', /election|public opinion|politic|govt|government|public service/i],
  ['language', /languages|translate|interpret them/i],
  ['teaching', /share his knowledge|teach|mentor|monitoring and evaluation/i],
  ['library', /books|library|archiv/i],
  ['leadership', /leadership|team|responsible|commanding|lead/i],
  ['sports', /exercises regularly|ground|sport|fitness/i],
  ['travel', /travel destination|tourism/i],
  ['logistics', /logistics|tickets, hotels|event/i],
  ['stem', /research|laboratory|math|formula|scientif|experiment|analyz|logical mind/i],
  ['technology', /computer|software|program|technology|digital/i],
  ['commerce', /sales|market|brand|customer|trade|business/i],
  ['law', /legal|court|justice|advocate|\blaw\b/i],
];

export const themeMeta = {
  finance: { label: 'Finance & Banking', careers: 'Chartered accountancy, investment banking, financial analysis, actuarial science, fintech.' },
  service: { label: 'Helping & Counselling', careers: 'Psychology, counselling, social work, medicine & nursing, HR welfare roles.' },
  media: { label: 'Media & Journalism', careers: 'Journalism, content strategy, broadcast production, public relations, digital media.' },
  creative: { label: 'Design & Creative', careers: 'Graphic/UX design, advertising, film & video, creative direction, animation.' },
  heritage: { label: 'Heritage & History', careers: 'Archaeology, museology, history research, conservation, cultural tourism.' },
  environment: { label: 'Environment & Nature', careers: 'Environmental science, forestry, sustainability consulting, wildlife research, geology.' },
  political: { label: 'Government & Policy', careers: 'Civil services, public policy, law & governance, political analysis, development sector.' },
  stem: { label: 'Science & Research', careers: 'Pure/applied sciences, data science, engineering research, biotech, mathematics.' },
  technology: { label: 'Technology & IT', careers: 'Software engineering, AI/ML, cybersecurity, product management, IT services.' },
  commerce: { label: 'Business & Sales', careers: 'Marketing, sales & business development, entrepreneurship, retail management, MBA routes.' },
  language: { label: 'Languages', careers: 'Translation & interpretation, linguistics, foreign-language careers, localisation.' },
  teaching: { label: 'Teaching & Training', careers: 'School/university teaching, instructional design, corporate training, edtech.' },
  law: { label: 'Law & Justice', careers: 'Litigation, corporate law, judiciary, legal research, compliance.' },
  culinary: { label: 'Hospitality & Culinary', careers: 'Chef & culinary arts, hotel management, food technology, restaurant entrepreneurship.' },
  travel: { label: 'Travel & Tourism', careers: 'Tour operations, travel curation, airline & hospitality careers, destination management.' },
  logistics: { label: 'Events & Logistics', careers: 'Event management, supply chain, operations, wedding & conference planning.' },
  sports: { label: 'Sports & Fitness', careers: 'Sports science, coaching, physiotherapy, fitness entrepreneurship, sports management.' },
  leadership: { label: 'Leadership & Management', careers: 'Management roles, project leadership, family business, administrative services.' },
  library: { label: 'Library & Archives', careers: 'Librarianship, archival science, information management, documentation.' },
  arts: { label: 'Arts & Performance', careers: 'Performing arts, writing & literature, fine arts, theatre, music production.' },
  fashion: { label: 'Fashion & Styling', careers: 'Fashion design, styling, textile design, jewellery design, merchandising.' },
};

/* Pacing spans — coarse enough to read at a glance. */
const SECTION_SPANS = [
  { title: 'Personality inventory', from: 0, to: 27 },
  { title: 'Work situations', from: 28, to: 51 },
  { title: 'Aptitude battery', from: 52, to: 96 },
  { title: 'Work values', from: 97, to: 106 },
  { title: 'Interest & motivation check', from: 107, to: 181 },
];

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);

export function buildIdealCareerModel(result, test) {
  const answers = result?.answers || {};
  const stats = result?.questionStats || {};
  const questions = test?.questions || [];

  /* ── Interest themes across both interest pillars ─────────────────────── */
  const themePts = {};
  let interestMax = 0;
  PILLARS.forEach((p) => {
    for (let i = p.from + 1; i <= p.to; i++) {
      const pts = answers[String(i)]?.points || answers[i]?.points || {};
      const text = questions[i]?.question || '';
      Object.keys(pts).forEach((k) => { interestMax += 1; });
      const hit = THEME_PATTERNS.find(([, re]) => re.test(text));
      if (hit) themePts[hit[0]] = (themePts[hit[0]] || 0) + 1;
    }
  });
  // A stored keyword point that names a theme directly (future reseed) counts too.
  Object.entries(answers).forEach(([idxStr, a]) => {
    const i = Number(idxStr);
    if (i < 107 || i > 181) return;
    Object.keys(a?.points || {}).forEach((k) => {
      if (themeMeta[k] && questions[i]?.question) {
        const hit = THEME_PATTERNS.find(([, re]) => re.test(questions[i].question));
        if (hit && hit[0] !== k) themePts[k] = (themePts[k] || 0) + 1;
      }
    });
  });
  const themes = Object.entries(themePts)
    .map(([key, pts]) => ({ key, name: themeMeta[key].label, pts, careers: themeMeta[key].careers }))
    .sort((a, b) => (b.pts - a.pts) || a.name.localeCompare(b.name));
  const hasThemeData = themes.some((t) => t.pts > 0);
  const interestTotal = themes.reduce((s, t) => s + t.pts, 0);
  const themeLeader = hasThemeData ? themes[0] : null;
  const themeShare = pct(themeLeader?.pts || 0, interestTotal);

  /* Decision clarity: how far theme #1 sits ahead of theme #2. */
  const runnerUpTheme = hasThemeData ? (themes[1] || null) : null;
  const themeMarginPts = runnerUpTheme ? themeLeader.pts - runnerUpTheme.pts : null;
  const themeClarity = !hasThemeData ? null : {
    decisive: themeMarginPts != null && themeMarginPts >= 3,
    marginPts: themeMarginPts,
    runnerUp: runnerUpTheme?.name || null,
  };

  /* ── Work values (Q98–107): 2 pts = core, 1 = important, 0 = less ─────── */
  const valueScores = IDEAL_VALUES.map((v, j) => {
    const idx = 97 + j;
    const pts = answers[String(idx)]?.points || answers[idx]?.points || {};
    // The bank stores these points under the title-case label ('Freedom'),
    // not the uppercase value code ('FREEDOM') — accept both.
    const label = valueMeta[v].label;
    const score = Number(pts[v] ?? pts[label]) || 0;
    return { value: v, label, blurb: valueMeta[v].blurb, weight: valueMeta[v].weight, score };
  });
  const topValues = [...valueScores]
    .sort((a, b) => (b.score - a.score) || (b.weight - a.weight) || IDEAL_VALUES.indexOf(a.value) - IDEAL_VALUES.indexOf(b.value))
    .filter((v) => v.score > 0)
    .slice(0, 3);
  const valuesPts = valueScores.reduce((s, v) => s + v.score, 0);
  /* Each value scores 0/1/2, so the honest ceiling is weight × 2 — using the
     bare weight let an all-core answer sheet push pull past 100%. */
  const valuesMax = valueScores.reduce((s, v) => s + v.weight * 2, 0);
  const valuesRanked = [...valueScores].sort((a, b) =>
    (b.score - a.score) || (b.weight - a.weight) || IDEAL_VALUES.indexOf(a.value) - IDEAL_VALUES.indexOf(b.value));

  /* ── Personality lean from the Yes/No inventory (Q1–28) ─────────────────
     Only an actual "Yes" asserts the trait — matching the item text alone
     gave every attempt the same lean regardless of how they answered. */
  const traitCounts = { E: 0, A: 0, C: 0, ES: 0, O: 0 };
  let traitQs = 0;
  let traitYes = 0;
  for (let i = 0; i <= 27; i++) {
    const text = questions[i]?.question || '';
    if (!text) continue;
    const hit = TRAIT_PATTERNS.find(([, re]) => re.test(text));
    if (!hit) continue;
    traitQs += 1;
    const said = String(answers[String(i)]?.text || answers[i]?.text || '').trim().toLowerCase();
    if (said === 'yes' || said === 'true') { traitCounts[hit[0]] += 1; traitYes += 1; }
  }
  const traitRanked = Object.entries(traitCounts).sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
  const keyTrait = traitYes > 0 ? traitRanked[0][0] : null;
  const keyTraitCount = keyTrait ? traitCounts[keyTrait] : 0;
  const archetype = keyTrait ? `The ${traitLabels[keyTrait]}` : 'The Explorer';
  const traitSentence = keyTrait
    ? `You said “Yes” to ${keyTraitCount} of ${traitQs} statements that mark the ${traitLabels[keyTrait]} pattern.`
    : 'Too few “Yes” answers to read a personality lean — treat the interest themes as the primary signal.';

  /* ── Aptitude battery (Q53–97, graded) ────────────────────────────────── */
  let aRight = 0; let aTotal = 0;
  const perSection = APT_SECTIONS.map((s) => {
    let right = 0; let total = 0;
    for (let i = s.from; i <= s.to; i++) {
      const c = stats[String(i)]?.correct;
      if (c === true || c === false) { total++; if (c) right++; }
    }
    aRight += right; aTotal += total;
    return { title: s.title, right, total, pct: pct(right, total) };
  }).filter((s) => s.total > 0);
  const aptitude = { right: aRight, total: aTotal, pct: pct(aRight, aTotal), perSection };
  const strongestSection = [...perSection].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1))[0] || null;

  /* Interest ↔ aptitude alignment: does the pull point where the skill is? */
  const alignment = themeLeader && strongestSection ? {
    theme: themeLeader.name,
    section: strongestSection.title,
    agree: strongestSection.pct >= 55,
    sentence: strongestSection.pct >= 55
      ? `Your pull towards ${themeLeader.name} is backed by your strongest tested skill — ${strongestSection.title} (${strongestSection.pct}%). That combination is worth taking seriously.`
      : `Your interest leans ${themeLeader.name}, while your tested strength today is ${strongestSection.title} (${strongestSection.pct}%). Interest can be trained up to aptitude — plan for that gap.`,
  } : null;

  /* ── Pace ─────────────────────────────────────────────────────────────── */
  let totalTime = 0; let timedQ = 0;
  let rightTime = 0; let wrongTime = 0; let gradedRight = 0; let gradedWrong = 0;
  Object.values(stats).forEach((st) => {
    const t = Number(st?.timeSpentSeconds) || 0;
    totalTime += t;
    if (st && (st.correct === true || st.correct === false)) {
      timedQ++;
      if (st.correct) { gradedRight++; rightTime += t; } else { gradedWrong++; wrongTime += t; }
    }
  });
  const pacePerSection = SECTION_SPANS.map((s) => {
    let time = 0; let count = 0;
    for (let i = s.from; i <= s.to; i++) {
      const st = stats[String(i)];
      if (st) { time += Number(st.timeSpentSeconds) || 0; count++; }
    }
    return { title: s.title, avg: count ? Math.round(time / count) : null };
  }).filter((s) => s.avg != null);
  const pace = {
    totalTime,
    timedQ,
    avgAll: timedQ ? Math.round(totalTime / timedQ) : null,
    avgRight: gradedRight ? Math.round(rightTime / gradedRight) : null,
    avgWrong: gradedWrong ? Math.round(wrongTime / gradedWrong) : null,
    perSection: pacePerSection,
  };

  /* ── Three-pillar verdict ────────────────────────────────────────────────
     pull  · interest + values points expressed
     head  · graded aptitude accuracy
     check · interest-check accuracy (only rendered when those questions
     carry an answer key — the current bank keys Q53–97 only, so absent
     data never shows a fake 0%). */
  const maxInterest = Math.max(1, interestMax);
  const pull = Math.round(((interestTotal / maxInterest) * 0.7 + (valuesPts / Math.max(1, valuesMax)) * 0.3) * 100);
  let quizRight = 0; let quizTotal = 0;
  for (let i = 107; i <= 181; i++) {
    const c = stats[String(i)]?.correct;
    if (c === true || c === false) { quizTotal++; if (c) quizRight++; }
  }
  const quizPct = pct(quizRight, quizTotal);
  const scores = { pull, aptitudePct: aptitude.pct ?? 0, quizPct: quizPct ?? 0 };

  const style = !hasThemeData
    ? { key: 'none', headline: 'Not enough data', body: 'This attempt stored no per-question answers, so the profile could not be rebuilt.' }
    : scores.aptitudePct >= 55 && (quizTotal === 0 || (quizPct ?? 0) >= 55)
      ? { key: 'head', headline: 'Head-led profile', body: 'Your interests and your aptitude point the same way — you are drawn to work you are demonstrably good at. Lean in.' }
      : scores.aptitudePct < 40 || (quizTotal > 0 && (quizPct ?? 100) < 40)
        ? { key: 'heart', headline: 'Heart-led profile', body: 'Your interests run ahead of your tested aptitude today. That is not a verdict — it is a training plan: build the skills your pull deserves.' }
        : { key: 'mixed', headline: 'Balanced profile', body: 'Interest and aptitude are close. Your shortlist should weigh both — and pressure-test the leader with real exposure.' };

  const pullBand = pull >= 70
    ? 'Strong, focused pull'
    : pull >= 45
      ? 'Clear pull with breadth'
      : 'Exploratory pull';

  const pillars = [
    { title: 'Interest pull', detail: `${interestTotal} of ~${maxInterest} interest points across ${themes.length || 0} themes`, pct: pull },
    { title: 'Aptitude', detail: aptitude.total ? `${aptitude.right}/${aptitude.total} graded questions correct` : 'No graded answers stored', pct: scores.aptitudePct },
    // Only renders when those questions carry an answer key (see above).
    ...(quizTotal > 0 ? [{ title: 'Motivation check', detail: `${quizRight}/${quizTotal} interest-check questions correct`, pct: quizPct }] : []),
  ];

  /* ── Missed graded questions for the review list ───────────────────────── */
  const mistakes = [];
  Object.entries(stats).forEach(([idxStr, st]) => {
    if (st?.correct !== false) return;
    const i = Number(idxStr);
    const q = questions[i];
    mistakes.push({
      i,
      question: q?.question || `Question ${i + 1}`,
      picked: q?.options?.[st.selectedOption]?.text ?? '—',
      correctText: q?.correctOptionIndex != null ? q?.options?.[q.correctOptionIndex]?.text : undefined,
      time: st.timeSpentSeconds ?? undefined,
      flagged: st.flagged,
    });
  });

  const answeredCount = Object.keys(answers).length
    || Object.keys(result?.answerDetails || {}).length
    || pace.timedQ;
  const totalQuestions = questions.length || 182;

  /* Deterministic narrative variants — same result, same sentence. */
  const pick = (list) => list[(
    (result?.testSlug || '').length + (result?.topRecommendation || '').length + aRight + interestTotal
  ) % list.length];
  const careersLine = themeLeader ? pick([
    `Where your pull points: ${themeLeader.name}. ${themeLeader.careers}`,
    `Your interest centre of gravity is ${themeLeader.name}. ${themeLeader.careers}`,
  ]) : null;

  return {
    themes, hasThemeData, themeLeader, themeShare, interestTotal, themeClarity, runnerUpTheme,
    valueScores, valuesRanked, topValues, valuesPts, valuesMax,
    traitCounts, traitQs, traitYes, keyTrait, keyTraitCount,
    keyTraitLabel: keyTrait ? traitLabels[keyTrait] : null,
    archetype, traitSentence,
    aptitude, strongestSection, alignment,
    quiz: { right: quizRight, total: quizTotal, pct: quizPct },
    pace, pillars, scores, style, pullBand, careersLine,
    mistakes, answeredCount, totalQuestions,
    timeTaken: result?.timeTaken || pace.totalTime,
  };
}
