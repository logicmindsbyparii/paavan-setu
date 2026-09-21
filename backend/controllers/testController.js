const TestResult = require('../models/TestResult');
const Test = require('../models/Test');
const Coupon = require('../models/Coupon');

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

/* ─── Coupons ──────────────────────────────────────────────────────────────────
   A coupon is what entitles a learner to sit an assessment. It is checked when
   they unlock the test (so a bad code is refused before they answer anything)
   and consumed when the attempt is actually submitted, so an abandoned run does
   not burn it. One shared validator, because the three call sites used to carry
   three copies of the same rules — with different status codes. */
async function findUsableCoupon(rawCode) {
  const code = String(rawCode || '').toUpperCase().trim();
  if (!code) {
    return { error: { status: 400, message: 'Coupon code is required' } };
  }
  const coupon = await Coupon.findOne({ code });
  if (!coupon) {
    return { error: { status: 400, message: 'Invalid coupon code' } };
  }
  if (!coupon.isActive) {
    return { error: { status: 400, message: 'This coupon is no longer active' } };
  }
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { error: { status: 400, message: 'This coupon has expired' } };
  }
  if (coupon.usedCount >= coupon.maxUsage) {
    return { error: { status: 400, message: 'This coupon has reached its usage limit' } };
  }
  return { coupon };
}

/** Spend one use of a coupon. The usage check and the increment happen in a
 *  single atomic update — two learners submitting the last use of the same
 *  coupon must not both be let through, which the old read-then-write could. */
async function consumeCoupon(rawCode) {
  const check = await findUsableCoupon(rawCode);
  if (check.error) return check;

  const coupon = await Coupon.findOneAndUpdate(
    { code: check.coupon.code, isActive: true, $expr: { $lt: ['$usedCount', '$maxUsage'] } },
    { $inc: { usedCount: 1 } },
    { new: true },
  );
  if (!coupon) {
    return { error: { status: 400, message: 'This coupon has reached its usage limit' } };
  }
  // The pre-save hook deactivates a coupon once it is spent; $inc bypasses it.
  if (coupon.usedCount >= coupon.maxUsage && coupon.isActive) {
    coupon.isActive = false;
    await coupon.save();
  }
  return { coupon };
}

/** POST /api/tests/verify-coupon — validate without spending.
 *  Lets the intro screen refuse a bad code before the learner answers 30
 *  questions, while the real gate stays on submit. */
exports.verifyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body || {};
    const check = await findUsableCoupon(couponCode);
    if (check.error) {
      return res.status(check.error.status).json({ success: false, message: check.error.message });
    }
    res.json({ success: true, data: { code: check.coupon.code } });
  } catch (error) {
    next(error);
  }
};

/** Derive per-question stats from submitted answers and the live question bank.
 *  `correct` is true when the selected option's index matches the question's
 *  designated correct option (questions may optionally carry `correctOptionIndex`).
 *  When a question has no `correctOptionIndex` the stat marks `correct: null`
 *  (used for psychometric / personality tests where there is no right answer).
 *  Answers arrive as option objects but a plain option-text string is tolerated
 *  and matched the same way. */
function buildQuestionStats(answers, questions, questionTimings = {}, flagged = {}) {
  const stats = {};
  const answerEntries = Object.entries(answers);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const selected = answerEntries.find(([idx]) => Number(idx) === i);
    const selectedText = selected
      ? (typeof selected[1] === 'object' && selected[1] !== null ? selected[1].text : selected[1])
      : undefined;
    const selectedOptIdx = typeof selectedText === 'string'
      ? q.options.findIndex(o => o.text === selectedText)
      : -1;
    let correct = null;
    if (q.correctOptionIndex != null) {
      // Unanswered items on a keyed test are wrong, not "unknown" — otherwise a
      // blank-run submission would score the same as an honest attempt.
      correct = selectedOptIdx === q.correctOptionIndex;
    }
    const rawTime = questionTimings[String(i)] ?? questionTimings[i];
    const timeSpent = Number(rawTime);
    stats[String(i)] = {
      selectedOption: selectedOptIdx,
      timeSpentSeconds: Number.isFinite(timeSpent) && timeSpent >= 0 ? Math.round(timeSpent) : null,
      correct,
      flagged: Boolean(flagged[String(i)] ?? flagged[i]),
    };
  }
  return stats;
}

/** Keyed-test outcome. `maxScore` counts only keyed questions, so a bank with a
 *  few unscored items does not punish the candidate for them. */
function computeScoredOutcome(test, questionStats) {
  if (test.scoringMode !== 'scored') {
    return { score: null, maxScore: null, percentage: null, passed: null };
  }
  const keyed = (test.questions || []).filter(q => q.correctOptionIndex != null);
  const maxScore = keyed.length;
  let score = 0;
  (test.questions || []).forEach((q, i) => {
    if (q.correctOptionIndex == null) return;
    if (questionStats[String(i)]?.correct === true) score++;
  });
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : null;
  const passed = test.passingScore != null && percentage != null
    ? percentage >= test.passingScore
    : null;
  return { score, maxScore, percentage, passed };
}

/** Section sanity check shared by create and update. Returns a human-readable
 *  problem, or null when the sections are sound. Both callers used to `throw`
 *  from inside the request handler, which surfaced as a 500 for what is always
 *  a client mistake — and updateTest skipped the range check entirely. */
function sectionValidationError(sections, questionCount) {
  const seen = new Set();
  for (let si = 0; si < sections.length; si++) {
    const s = sections[si];
    if (!s.title) return `Section ${si + 1} must have a title`;
    for (const idx of (s.questionIndices || [])) {
      if (idx < 0 || idx >= questionCount) {
        return `Section "${s.title}" references question index ${idx} which is out of range`;
      }
      if (seen.has(idx)) return `Section "${s.title}" duplicates question index ${idx}`;
      seen.add(idx);
    }
  }
  return null;
}

/** Difficulty mix of a question bank — drives the "is this test balanced?"
 *  insight on both the authoring screen and the analytics screen. */
function difficultyMix(questions) {
  const mix = { beginner: 0, intermediate: 0, advanced: 0 };
  (questions || []).forEach(q => {
    const tier = mix[q.difficulty] !== undefined ? q.difficulty : 'intermediate';
    mix[tier]++;
  });
  return mix;
}

/** Aggregate drop-off: for each question index, how many attempts had answered
 *  at least that many questions (i.e. reached that question). Works for
 *  finalised and abandoned attempts alike, which is what makes the curve show
 *  real drop-off instead of the 100% a completed-only cohort always produced. */
function dropOffCurve(attempts, totalQuestions) {
  const curve = new Array(totalQuestions).fill(0);
  for (const a of attempts) {
    const answers = a.answers || {};
    let reached = 0;
    for (let i = 0; i < totalQuestions; i++) {
      if (answers[i] != null) reached = i + 1;
    }
    // An abandoned attempt also carries the furthest point it navigated to.
    if (a.lastQuestionIndex != null) reached = Math.max(reached, Number(a.lastQuestionIndex) + 1);
    for (let i = 0; i < Math.min(reached, totalQuestions); i++) curve[i]++;
  }
  return curve;
}

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

/* Listing payload: everything the catalogue needs to describe a test honestly
   (item count, a real sample question, scoring mode) without shipping the whole
   question bank to every visitor. The catalogue previously had no counts at all
   and displayed invented ones. */
exports.getPublicTests = async (req, res, next) => {
  try {
    const tests = await Test.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $project: {
          slug: 1,
          name: 1,
          description: 1,
          instructions: 1,
          introMessage: 1,
          categories: 1,
          sections: 1,
          difficulty: 1,
          timeLimit: 1,
          passingScore: 1,
          scoringMode: 1,
          allowRetake: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          questionsCount: { $size: { $ifNull: ['$questions', []] } },
          sampleQuestion: { $arrayElemAt: ['$questions.question', 0] },
        },
      },
      { $sort: { createdAt: 1 } },
    ]);
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

/* `isActive: false` is how a test is unpublished, and the catalogue already
   filters those out. Serving one by direct slug let a learner sit an assessment
   the admin had taken offline, so the same filter applies here. */
exports.getTestBySlug = async (req, res, next) => {
  try {
    const test = await Test.findOne({ slug: req.params.slug, isActive: { $ne: false } }).lean();
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    /* The answer key never leaves the server. This endpoint is public to any
       signed-in learner, and shipping `correctOptionIndex` let anyone read the
       keys for a scored assessment out of the network tab. Grading uses the
       server-side document, and the runner only needs text/points/scenario. */
    test.questions = (test.questions || []).map(
      ({ correctOptionIndex, ...question }) => question,
    );
    res.json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// ─── USER TEST TAKING ─────────────────────────────────────────────────────────

exports.submitTest = async (req, res, next) => {
  try {
    const { testSlug, testName, answers, timeTaken, questionTimings, flagged, timedOut, couponCode } = req.body;

    if (!testSlug || !answers) {
      return res.status(400).json({ success: false, message: 'Incomplete test data' });
    }

    // Fetch the live test document to recompute scores server-side
    const test = await Test.findOne({ slug: testSlug });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    // Defence in depth: the runner cannot load an unpublished test, but the
    // endpoint stays open to anything that POSTs to it directly.
    if (test.isActive === false) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // The display name is not an identity field: an admin rename between page
    // load and submit used to 400 an otherwise valid attempt. The slug is the
    // identity; the stored name is always authoritative.
    // (The client-submitted `testName` is accepted but ignored.)
    void testName;
    const effectiveTestName = test.name;

    // Block a second *completed* attempt; an abandoned attempt is the same
    // sitting resumed, so it is finalised in place instead of duplicated
    // (the {user, testSlug} index allows only one record either way).
    const existing = await TestResult.findOne({ user: req.userId, testSlug });
    if (existing && existing.status === 'completed') {
      return res.status(409).json({
        success: false,
        message: 'You have already completed this assessment. You cannot retake it.',
      });
    }

    // Recompute scores server-side
    const scores = {};
    test.categories.forEach(cat => scores[cat] = 0);

    const normalizedAnswers = {};
    const answerDetails = {};
    let answeredCount = 0;

    for (const [qIdx, option] of Object.entries(answers)) {
      const idx = Number(qIdx);
      // Any recorded selection counts as answered — including a "Neutral"-style
      // option that carries no category points (it simply scores zero).
      // Requiring `option.points` here 400'd complete attempts whenever the
      // learner picked a zero-weight option.
      const selected = typeof option === 'string' && option
        ? { text: option, points: {} }
        : option;
      if (selected && typeof selected === 'object' && typeof selected.text === 'string') {
        // Weights come from the stored question, never from the request body.
        // Taking `selected.points` on trust let a client write any profile score
        // it liked — and the analytics screen summed those same stored numbers.
        const serverOption = (test.questions[idx]?.options || []).find(o => o.text === selected.text);
        const points = serverOption?.points || {};
        normalizedAnswers[idx] = { text: selected.text, points };
        answerDetails[String(idx)] = selected.text;
        answeredCount++;
        for (const [cat, val] of Object.entries(points)) {
          if (scores[cat] !== undefined) {
            scores[cat] += Number(val) || 0;
          }
        }
      }
    }

    // Validate completeness. A timed-out auto-submit scores whatever was
    // answered — the attempt is over by definition, so refusing it with a 400
    // would strand the learner with no result at all.
    const totalQuestions = test.questions.length;
    if (!timedOut && answeredCount < totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Please answer all ${totalQuestions} questions before submitting. (${answeredCount}/${totalQuestions})`,
      });
    }

    // The coupon is the entitlement to sit this assessment, so it is spent here
    // and not before: an attempt that is never submitted costs the learner
    // nothing. Checked after every "this submission is invalid" branch, so a
    // rejected submit can't burn a use either.
    const couponCheck = await consumeCoupon(couponCode);
    if (couponCheck.error) {
      return res.status(couponCheck.error.status).json({
        success: false,
        message: couponCheck.error.message,
      });
    }

    // Compute top recommendation (server-side tie-break matches client logic)
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    let computedTop = ranked.length > 0 ? ranked[0][0] : (test.categories[0] || 'N/A');
    const maxScore = ranked.length > 0 ? ranked[0][1] : 0;
    if (ranked.length >= 2 && ranked[0][1] === ranked[1][1]) {
      const firstDesc = typeof ranked[0][0] === 'string' ? String(ranked[0][0]).length : 0;
      const secondDesc = typeof ranked[1][0] === 'string' ? String(ranked[1][0]).length : 0;
      if (secondDesc > firstDesc) computedTop = ranked[1][0];
    }

    // Build payload — server-computed resultData only
    const answersMap = {};
    Object.entries(normalizedAnswers).forEach(([idx, opt]) => {
      answersMap[String(idx)] = opt;
    });

    const resultDataMap = {};
    for (const [cat, val] of Object.entries(scores)) {
      resultDataMap[cat] = Number(val) || 0;
    }

    const questionStats = buildQuestionStats(answers, test.questions, questionTimings, flagged);
    const outcome = computeScoredOutcome(test, questionStats);
    const elapsed = timeTaken || 0;
    // A timed-out partial only reached as far as it answered — claiming the
    // full length would flatten the drop-off curve the analytics screen draws.
    const furthestAnswered = Object.keys(normalizedAnswers).reduce(
      (max, k) => Math.max(max, Number(k)), -1,
    );
    const attemptFields = {
      user: req.userId,
      testSlug,
      testName: effectiveTestName,
      answers: answersMap,
      answerDetails,
      resultData: resultDataMap,
      topRecommendation: computedTop,
      timeTaken: elapsed,
      completedAt: new Date(),
      startedAt: new Date(Date.now() - elapsed * 1000),
      status: 'completed',
      questionStats,
      ...outcome,
      lastQuestionIndex: Math.max(0, furthestAnswered),
    };

    // Resuming an abandoned attempt reuses the record rather than inserting.
    const testResult = existing
      ? await TestResult.findByIdAndUpdate(existing._id, attemptFields, { new: true })
      : await TestResult.create(attemptFields);

    res.status(existing ? 200 : 201).json({
      success: true,
      data: {
        _id: testResult._id,
        testSlug: testResult.testSlug,
        testName: testResult.testName,
        topRecommendation: testResult.topRecommendation,
        resultData: testResult.resultData,
        timeTaken: testResult.timeTaken,
        completedAt: testResult.completedAt,
        answers: testResult.answers,
        answerDetails: testResult.answerDetails,
        questionStats: testResult.questionStats,
        score: testResult.score,
        maxScore: testResult.maxScore,
        percentage: testResult.percentage,
        passed: testResult.passed,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already completed this assessment.',
      });
    }
    next(error);
  }
};

/* ─── ABANDONED ATTEMPTS ───────────────────────────────────────────────────────
   Drop-off is only measurable if the attempts that never finished are stored.
   The client beacons here when a user closes the tab mid-test; one record per
   {user, testSlug} is kept, and a later final submit upgrades it in place.
   Deliberately forgiving: analytics telemetry must never block the runner. */
exports.abandonTest = async (req, res, next) => {
  try {
    const { testSlug, answers, lastQuestionIndex, timeTaken } = req.body;
    if (!testSlug) {
      return res.status(400).json({ success: false, message: 'Test slug is required' });
    }

    // Unknown slugs used to be accepted verbatim, so any authenticated client
    // could inflate the global abandonment counts and litter the collection with
    // rows no per-test view would ever show.
    const test = await Test.findOne({ slug: testSlug }).select('name');
    if (!test) {
      return res.json({ success: true, data: { recorded: false, reason: 'unknown-test' } });
    }

    const existing = await TestResult.findOne({ user: req.userId, testSlug });
    if (existing && existing.status === 'completed') {
      return res.json({ success: true, data: { recorded: false, reason: 'already-completed' } });
    }

    const answersMap = {};
    Object.entries(answers || {}).forEach(([idx, opt]) => {
      if (opt && typeof opt === 'object') answersMap[String(Number(idx))] = opt;
    });

    const depth = Object.keys(answersMap).reduce((max, idx) => Math.max(max, Number(idx) + 1), 0);
    const furthest = Math.max(depth - 1, Number(lastQuestionIndex) || 0);

    const fields = {
      user: req.userId,
      testSlug,
      testName: (existing && existing.testName) || req.body.testName || testSlug,
      answers: answersMap,
      timeTaken: timeTaken || 0,
      status: 'abandoned',
      lastQuestionIndex: Math.max(0, furthest),
      topRecommendation: (existing && existing.topRecommendation) ? existing.topRecommendation : 'N/A',
    };

    const record = existing
      ? await TestResult.findByIdAndUpdate(existing._id, fields, { new: true })
      : await TestResult.create(fields);

    res.json({ success: true, data: { recorded: true, id: record._id } });
  } catch (error) {
    next(error);
  }
};

// ─── RETAKE ────────────────────────────────────────────────────────────────────
// Delete a previous result so the user can retake (requires valid coupon).

exports.retakeTest = async (req, res, next) => {
  try {
    const { testSlug, couponCode } = req.body;

    if (!testSlug || !couponCode) {
      return res.status(400).json({ success: false, message: 'Test slug and coupon code are required' });
    }

    // The coupon unlocks the reset but is *not* spent here — it is spent when
    // the new attempt is submitted, so a retake that is never finished costs
    // nothing and the learner needs only one coupon per attempt.
    const couponCheck = await findUsableCoupon(couponCode);
    if (couponCheck.error) {
      return res.status(couponCheck.error.status).json({
        success: false,
        message: couponCheck.error.message,
      });
    }

    // The test document owns the retake policy; both fields were collected by
    // the authoring screen but never read here, so every test behaved as
    // "retake allowed after exactly 10 minutes".
    const test = await Test.findOne({ slug: testSlug });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    if (test.allowRetake === false) {
      return res.status(400).json({ success: false, message: 'Retakes are not allowed for this assessment' });
    }

    // Check if user has a previous result for this test
    const existing = await TestResult.findOne({ user: req.userId, testSlug });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'No previous attempt found for this test' });
    }

    const cooldownMin = Number(test.retakeCooldownMin) >= 0 ? Number(test.retakeCooldownMin) : 10;
    if (existing.completedAt && Date.now() - existing.completedAt.getTime() < cooldownMin * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: cooldownMin > 0
          ? `Please wait ${cooldownMin} minute${cooldownMin === 1 ? '' : 's'} before retaking`
          : 'Please try again in a moment',
      });
    }

    // Delete old result
    await TestResult.deleteOne({ _id: existing._id });

    res.json({ success: true, message: 'Previous attempt deleted. You can now retake the test.' });
  } catch (error) {
    next(error);
  }
};

exports.getMyResults = async (req, res, next) => {
  try {
    // Abandoned attempts are analytics telemetry, not results the learner
    // should see — and not results that should block a fresh attempt.
    const results = await TestResult.find({ user: req.userId, status: 'completed' })
      .sort('-completedAt');

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/* ─── ADMIN: PER-TEST ANALYTICS ──────────────────────────────────────────────
   Single source of truth for per-test insight. The admin API route points
   here, and every metric the dashboard renders — drop-off, item analysis,
   pass/fail, timing — is computed in one place so the two can't drift.
   Reads *attempts* (completed + abandoned), because drop-off is unmeasurable
   from a completed-only cohort. */

exports.getTestAnalyticsBySlug = async (req, res, next) => {
  try {
    const { testSlug } = req.params;
    const test = await Test.findOne({ slug: testSlug });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const attempts = await TestResult.find({ testSlug })
      .populate('user', 'name email')
      .sort('-completedAt');

    const results = attempts.filter(r => r.status !== 'abandoned');
    const abandoned = attempts.filter(r => r.status === 'abandoned');
    const totalSubmissions = results.length;
    const totalAttempts = attempts.length;
    const completionRate = totalAttempts > 0
      ? Math.round((totalSubmissions / totalAttempts) * 100)
      : null;
    const uniqueUsers = new Set(attempts.map(r => String(r.user?._id || r.user))).size;
    const totalQuestions = (test.questions || []).length;

    // Time stats — mean and median, so one runaway attempt doesn't skew it.
    const times = results.map(r => r.timeTaken || 0).filter(t => t > 0).sort((a, b) => a - b);
    const avgTimeSeconds = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;
    const medianTimeSeconds = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;
    const expectedSeconds = test.timeLimit ? test.timeLimit * 60 : null;

    // Category averages recomputed from stored answers — never trust resultData.
    const categoryTotals = {};
    test.categories.forEach(cat => { categoryTotals[cat] = 0; });
    results.forEach(r => {
      Object.values(r.answers || {}).forEach(opt => {
        if (opt && typeof opt === 'object' && opt.points) {
          Object.entries(opt.points).forEach(([cat, val]) => {
            if (categoryTotals[cat] !== undefined) categoryTotals[cat] += Number(val) || 0;
          });
        }
      });
    });
    const categoryScores = {};
    Object.entries(categoryTotals).forEach(([cat, total]) => {
      categoryScores[cat] = totalSubmissions > 0 ? Math.round((total / totalSubmissions) * 10) / 10 : 0;
    });

    // Recommendation breakdown
    const recommendationBreakdown = {};
    results.forEach(r => {
      const rec = r.topRecommendation || 'N/A';
      recommendationBreakdown[rec] = (recommendationBreakdown[rec] || 0) + 1;
    });

    // Drop-off across every attempt that started, not just the ones that finished.
    const dropOff = dropOffCurve(attempts, totalQuestions);
    const dropOffPct = dropOff.map(v => totalAttempts > 0 ? Math.round((v / totalAttempts) * 100) : 0);
    let biggestDropIdx = -1;
    let biggestDropPct = 0;
    for (let i = 0; i < totalQuestions - 1; i++) {
      const drop = dropOffPct[i] - dropOffPct[i + 1];
      if (drop > biggestDropPct) {
        biggestDropPct = drop;
        biggestDropIdx = i;
      }
    }

    // Item analysis: timing, keyed accuracy, and where the wrong answers go —
    // a distractor that out-polls the key is a broken question, not a bad cohort.
    const perQuestionStats = (test.questions || []).map((q, i) => {
      const hasCorrectKey = q.correctOptionIndex != null;
      const optionCounts = new Array((q.options || []).length).fill(0);
      let answeredCount = 0;
      let correctCount = 0;
      let flaggedCount = 0;
      let timeSum = 0;
      let timeSamples = 0;
      results.forEach(r => {
        const entry = (r.questionStats || {})[String(i)];
        if (!entry) return;
        if (entry.selectedOption >= 0) {
          answeredCount++;
          if (optionCounts[entry.selectedOption] !== undefined) optionCounts[entry.selectedOption]++;
        }
        if (entry.correct === true) correctCount++;
        if (entry.flagged) flaggedCount++;
        if (typeof entry.timeSpentSeconds === 'number' && entry.timeSpentSeconds > 0) {
          timeSum += entry.timeSpentSeconds;
          timeSamples++;
        }
      });
      const optionDistribution = (q.options || []).map((opt, oi) => ({
        index: oi,
        text: opt.text,
        count: optionCounts[oi],
        pct: answeredCount > 0 ? Math.round((optionCounts[oi] / answeredCount) * 100) : 0,
        isCorrect: hasCorrectKey && oi === q.correctOptionIndex,
      }));
      const wrongPicks = optionDistribution
        .filter(o => !o.isCorrect)
        .sort((a, b) => b.count - a.count);
      return {
        index: i,
        question: q.question || '',
        scenario: q.scenario || '',
        difficulty: q.difficulty || 'intermediate',
        tags: q.tags || [],
        hasCorrectKey,
        answeredCount,
        skippedCount: Math.max(0, totalSubmissions - answeredCount),
        correctCount,
        correctPct: !hasCorrectKey || answeredCount === 0
          ? null
          : Math.round((correctCount / answeredCount) * 100),
        avgTimeSeconds: timeSamples > 0 ? Math.round(timeSum / timeSamples) : null,
        flaggedCount,
        optionDistribution,
        topDistractor: wrongPicks.length > 0 && wrongPicks[0].count > 0 ? wrongPicks[0] : null,
      };
    });

    // Difficulty mix + per-tier accuracy: does the bank actually get harder,
    // and where do candidates fall over on the way up?
    const mix = difficultyMix(test.questions);
    const difficultyBreakdown = Object.entries(mix).map(([tier, count]) => {
      const tierQs = perQuestionStats.filter(q => q.difficulty === tier && q.hasCorrectKey);
      const attempted = tierQs.reduce((sum, q) => sum + q.answeredCount, 0);
      const correct = tierQs.reduce((sum, q) => sum + q.correctCount, 0);
      return {
        tier,
        count,
        accuracyPct: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
      };
    });

    // Scored-test outcome. Meaningless for profile tests, hence the nulls.
    const scoredResults = results.filter(r => r.percentage != null);
    const passedCount = scoredResults.filter(r => r.passed === true).length;
    const failedCount = scoredResults.filter(r => r.passed === false).length;
    const passRate = test.passingScore != null && scoredResults.length > 0
      ? Math.round((passedCount / scoredResults.length) * 100)
      : null;
    const avgPercentage = scoredResults.length > 0
      ? Math.round((scoredResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / scoredResults.length) * 10) / 10
      : null;
    const scoreBuckets = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100.01]];
    const scoreDistribution = scoreBuckets.map(([lo, hi]) => ({
      label: `${lo}\u2013${Math.min(100, Math.floor(hi))}%`,
      count: scoredResults.filter(r => (r.percentage || 0) >= lo && (r.percentage || 0) < hi).length,
    }));

    // Recent attempts (with learner identity) so admins can follow up.
    const recentResults = attempts.slice(0, 20).map(tr => ({
      _id: tr._id,
      user: tr.user ? { name: tr.user.name, email: tr.user.email } : null,
      testName: tr.testName,
      topRecommendation: tr.topRecommendation,
      percentage: tr.percentage,
      passed: tr.passed,
      timeTaken: tr.timeTaken,
      completedAt: tr.completedAt,
      status: tr.status,
      resultData: typeof tr.resultData === 'object' ? tr.resultData : {},
    }));

    res.json({
      success: true,
      data: {
        test: {
          name: test.name,
          slug: test.slug,
          difficulty: test.difficulty,
          scoringMode: test.scoringMode || 'profile',
          passingScore: test.passingScore,
          timeLimit: test.timeLimit,
          totalQuestions,
          categories: test.categories,
          difficultyMix: mix,
          keyedQuestions: (test.questions || []).filter(q => q.correctOptionIndex != null).length,
        },
        totalSubmissions,
        totalAttempts,
        abandonedCount: abandoned.length,
        completionRate,
        totalUsers: uniqueUsers,
        avgTimeSeconds,
        medianTimeSeconds,
        expectedSeconds,
        categoryScores,
        recommendationBreakdown,
        dropOffCurve: dropOffPct,
        biggestDropOff: biggestDropIdx >= 0 ? {
          questionIndex: biggestDropIdx,
          question: test.questions[biggestDropIdx]?.question || '',
          dropPercentage: biggestDropPct,
        } : null,
        perQuestionStats,
        difficultyBreakdown,
        passRate,
        passedCount,
        failedCount,
        avgPercentage,
        scoreDistribution,
        recentResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: TEST CRUD ─────────────────────────────────────────────────────────

exports.getAllTests = async (req, res, next) => {
  try {
    const tests = await Test.find().sort('-createdAt');
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

exports.createTest = async (req, res, next) => {
  try {
    const {
      name, slug, description, instructions, introMessage,
      categories, questions, sections, difficulty,
      timeLimit, passingScore, allowRetake, retakeCooldownMin,
      scoringMode, shuffleQuestions, showExplanations
    } = req.body;

    if (!name || !slug || !categories || !questions) {
      return res.status(400).json({ success: false, message: 'Name, slug, categories, and questions are required' });
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required' });
    }

    // Validate categories
    const categorySet = new Set(categories);
    if (categorySet.size !== categories.length) {
      return res.status(400).json({ success: false, message: 'Duplicate categories found' });
    }

    // Validate questions
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || q.options.length < 2) {
        return res.status(400).json({ success: false, message: `Question ${i + 1} must have a question text and at least 2 options` });
      }
      if (q.options.length > 6) {
        return res.status(400).json({ success: false, message: `Question ${i + 1} can have at most 6 options` });
      }
      // Validate points reference valid categories
      const invalidCat = q.options.flatMap(opt => opt.points ? Object.keys(opt.points) : []).find(cat => !categorySet.has(cat));
      if (invalidCat) {
        const optIdx = q.options.findIndex(opt => opt.points && opt.points[invalidCat] !== undefined);
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}, option ${optionLetters[optIdx] || optIdx + 1}: category "${invalidCat}" is not in the test's category list`,
        });
      }
      // Validate difficulty enum
      if (q.difficulty && !['beginner','intermediate','advanced'].includes(q.difficulty)) {
        return res.status(400).json({ success: false, message: `Question ${i + 1} has an invalid difficulty value` });
      }
      // Validate correctOptionIndex if provided
      if (q.correctOptionIndex != null && (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length)) {
        return res.status(400).json({ success: false, message: `Question ${i + 1}: correctOptionIndex is out of range` });
      }
    }

    // A scored test cannot ship with unkeyed items — the pass/fail percentage
    // would be computed over a different denominator than the candidate saw.
    if (scoringMode === 'scored') {
      const unkeyed = questions.findIndex(q => q.correctOptionIndex == null);
      if (unkeyed !== -1) {
        return res.status(400).json({
          success: false,
          message: `Question ${unkeyed + 1} has no correct answer set. Scored tests need a key for every question.`,
        });
      }
      if (passingScore == null) {
        return res.status(400).json({
          success: false,
          message: 'Scored tests need a passing score so results can be marked pass/fail.',
        });
      }
    }

    // A profile (points-vector) test with no points anywhere cannot produce a
    // recommendation, so every option would tie at zero.
    if ((scoringMode || 'profile') === 'profile') {
      const unweighted = questions.findIndex(q =>
        !q.options.some(opt => opt.points && Object.keys(opt.points).length > 0));
      if (unweighted !== -1) {
        return res.status(400).json({
          success: false,
          message: `Question ${unweighted + 1} has no scoring points on any option. Add category points so a profile can be computed.`,
        });
      }
    }

    // Validate sections if provided. Unassigned questions are allowed (flat
    // mode) — only out-of-range and duplicate references are rejected.
    if (sections) {
      const sectionError = sectionValidationError(sections, questions.length);
      if (sectionError) {
        return res.status(400).json({ success: false, message: sectionError });
      }
    }

    const testInput = {
      name,
      slug,
      description: description || '',
      instructions: instructions || '',
      introMessage: introMessage || '',
      categories,
      questions,
      sections: sections || [],
      difficulty: difficulty || 'mixed',
      timeLimit: timeLimit || null,
      passingScore: passingScore != null ? Number(passingScore) : null,
      scoringMode: scoringMode === 'scored' ? 'scored' : 'profile',
      shuffleQuestions: shuffleQuestions != null ? Boolean(shuffleQuestions) : false,
      showExplanations: showExplanations != null ? Boolean(showExplanations) : true,
      allowRetake: allowRetake != null ? Boolean(allowRetake) : true,
      retakeCooldownMin: retakeCooldownMin != null ? Number(retakeCooldownMin) : 10,
      isActive: true,
    };

    const test = await Test.create(testInput);
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A test with this slug already exists' });
    }
    next(error);
  }
};

exports.updateTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, slug, description, instructions, introMessage,
      categories, questions, sections, difficulty,
      timeLimit, passingScore, allowRetake, retakeCooldownMin, isActive,
      scoringMode, shuffleQuestions, showExplanations
    } = req.body;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Validate the incoming bank against the mode it will be saved in. The
    // model's validate hook does not run on findByIdAndUpdate, so the same
    // checks are mirrored here rather than silently trusting the client.
    const nextMode = scoringMode !== undefined ? scoringMode : (test.scoringMode || 'profile');
    const nextQuestions = questions !== undefined ? questions : test.questions;
    const nextPassingScore = passingScore !== undefined ? passingScore : test.passingScore;
    if (nextMode === 'scored') {
      const unkeyed = (nextQuestions || []).findIndex(q => q.correctOptionIndex == null);
      if (unkeyed !== -1) {
        return res.status(400).json({
          success: false,
          message: `Question ${unkeyed + 1} has no correct answer set. Scored tests need a key for every question.`,
        });
      }
      if (nextPassingScore == null) {
        return res.status(400).json({
          success: false,
          message: 'Scored tests need a passing score so results can be marked pass/fail.',
        });
      }
    }
    if (nextMode === 'profile') {
      const unweighted = (nextQuestions || []).findIndex(q =>
        !(q.options || []).some(opt => opt.points && Object.keys(opt.points).length > 0));
      if (unweighted !== -1) {
        return res.status(400).json({
          success: false,
          message: `Question ${unweighted + 1} has no scoring points on any option. Add category points so a profile can be computed.`,
        });
      }
    }

    // Validate slug uniqueness if changed
    if (slug && slug !== test.slug) {
      const slugExists = await Test.findOne({ slug, _id: { $ne: id } });
      if (slugExists) {
        return res.status(409).json({ success: false, message: 'Another test already uses this slug' });
      }
    }

    // Validate categories if provided
    if (categories) {
      const categorySet = new Set(categories);
      if (categorySet.size !== categories.length) {
        return res.status(400).json({ success: false, message: 'Duplicate categories found' });
      }
    }
    // Validate question payload whenever questions are sent — against the
    // incoming categories when present, otherwise the test's own list, so a
    // questions-only PUT cannot smuggle in an unknown points key or bad index.
    if (questions) {
      const effectiveCategories = categories ?? test.categories ?? [];
      const categorySet = new Set(effectiveCategories);
      {
        for (const q of questions) {
          if (q.options) {
            const invalidCat = q.options.flatMap(opt => opt.points ? Object.keys(opt.points) : []).find(cat => !categorySet.has(cat));
            if (invalidCat) {
              return res.status(400).json({
                success: false,
                message: `Category "${invalidCat}" is not in the test's category list`,
              });
            }
          }
          if (q.difficulty && !['beginner','intermediate','advanced'].includes(q.difficulty)) {
            return res.status(400).json({ success: false, message: `Question has an invalid difficulty value` });
          }
          if (q.correctOptionIndex != null && (q.correctOptionIndex < 0 || q.correctOptionIndex >= (q.options?.length || 0))) {
            return res.status(400).json({ success: false, message: `Question correctOptionIndex is out of range` });
          }
        }
      }
    }

    // Validate sections if provided
    if (sections) {
      const sectionError = sectionValidationError(sections, questions?.length ?? (test.questions || []).length);
      if (sectionError) {
        return res.status(400).json({ success: false, message: sectionError });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (introMessage !== undefined) updateData.introMessage = introMessage;
    if (categories !== undefined) updateData.categories = categories;
    if (questions !== undefined) updateData.questions = questions;
    if (sections !== undefined) updateData.sections = sections;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (passingScore !== undefined) updateData.passingScore = passingScore != null ? Number(passingScore) : null;
    if (allowRetake !== undefined) updateData.allowRetake = Boolean(allowRetake);
    if (retakeCooldownMin !== undefined) updateData.retakeCooldownMin = Number(retakeCooldownMin);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (scoringMode !== undefined) updateData.scoringMode = scoringMode === 'scored' ? 'scored' : 'profile';
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = Boolean(shuffleQuestions);
    if (showExplanations !== undefined) updateData.showExplanations = Boolean(showExplanations);

    const updated = await Test.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteTest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Cascade delete: remove all TestResults for this test
    await TestResult.deleteMany({ testSlug: test.slug });

    await Test.findByIdAndDelete(id);

    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: SEED TESTS ────────────────────────────────────────────────────────

exports.seedTests = async (req, res, next) => {
  try {
    const { tests } = req.body;

    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of tests to seed' });
    }

    // Validate each test before inserting
    for (const testData of tests) {
      if (!testData.name || !testData.slug || !testData.categories || !testData.questions) {
        return res.status(400).json({
          success: false,
          message: `Test "${testData.name || 'unknown'}" is missing required fields (name, slug, categories, questions)`,
        });
      }

      const categorySet = new Set(testData.categories);
      if (categorySet.size !== testData.categories.length) {
        return res.status(400).json({
          success: false,
          message: `Test "${testData.name}": duplicate categories found`,
        });
      }

      for (let i = 0; i < testData.questions.length; i++) {
        const q = testData.questions[i];
        if (!q.question || !q.options || q.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Test "${testData.name}", question ${i + 1}: must have question text and at least 2 options`,
          });
        }
        const invalidCat = q.options.flatMap(opt => opt.points ? Object.keys(opt.points) : []).find(cat => !categorySet.has(cat));
        if (invalidCat) {
          const optIdx = q.options.findIndex(opt => opt.points && opt.points[invalidCat] !== undefined);
          const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
          return res.status(400).json({
            success: false,
            message: `Test "${testData.name}", question ${i + 1}, option ${optionLetters[optIdx] || optIdx + 1}: category "${invalidCat}" is not in the test's category list`,
          });
        }
      }
    }

    const testArray = tests.map(t => ({
      name: t.name,
      slug: t.slug,
      description: t.description || '',
      instructions: t.instructions || '',
      introMessage: t.introMessage || '',
      categories: t.categories,
      questions: t.questions.map(q => ({
        question: q.question,
        options: q.options.map((opt, oi) => ({
          text: opt.text,
          imageUrl: opt.imageUrl || '',
          points: opt.points || {},
          explanation: opt.explanation || '',
        })),
        scenario: q.scenario || '',
        imageUrl: q.imageUrl || '',
        difficulty: q.difficulty || 'intermediate',
        tags: q.tags || [],
        explanation: q.explanation || '',
        correctOptionIndex: q.correctOptionIndex != null ? q.correctOptionIndex : undefined,
      })),
      sections: (t.sections || []).map(s => ({
        ...s,
        questionIndices: s.questionIndices || [],
      })),
      difficulty: t.difficulty || 'mixed',
      timeLimit: t.timeLimit || null,
      passingScore: t.passingScore != null ? Number(t.passingScore) : null,
      scoringMode: t.scoringMode === 'scored' ? 'scored' : 'profile',
      shuffleQuestions: t.shuffleQuestions != null ? Boolean(t.shuffleQuestions) : false,
      showExplanations: t.showExplanations != null ? Boolean(t.showExplanations) : true,
      allowRetake: t.allowRetake != null ? Boolean(t.allowRetake) : true,
      retakeCooldownMin: t.retakeCooldownMin != null ? Number(t.retakeCooldownMin) : 10,
      isActive: true,
    }));

    // Seeding replaces the whole bank, so every prior attempt is orphaned.
    await TestResult.deleteMany({});
    await Test.deleteMany({});
    const created = await Test.insertMany(testArray);

    res.status(201).json({ success: true, message: `Seeded ${created.length} tests`, data: created });
  } catch (error) {
    next(error);
  }
};
