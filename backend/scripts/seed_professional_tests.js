/**
 * Professional question bank — seed / upgrade
 * ─────────────────────────────────────────────────────────────────────────────
 * Rewrites the bundled tests around four authoring rules that the original
 * item bank broke:
 *
 *   1. Behaviourally specific over generic. "I enjoy working with my hands"
 *      measures nothing; "the bike's gears skip — would you rebuild the
 *      drivetrain yourself?" is answerable.
 *   2. Scenario-led. Every item carries a `scenario` so the candidate is
 *      judging a situation, not rating an adjective.
 *   3. Tiered. Items are tagged beginner / intermediate / advanced so a test
 *      can be read as a progression rather than a flat wall.
 *   4. Explained. Each item ships a rationale — the interpretation layer that
 *      turns a score into feedback.
 *
 * Note on instrument design: a RIASEC interest inventory is a self-report
 * instrument, not a quiz. Its items stay Likert-scaled (forcing them into
 * "pick the correct career" multiple choice would destroy their validity), so
 * the difficulty tier on those items describes abstraction/reading load, not
 * rightness. The keyed, auto-scored `logical-reasoning-aptitude` test is where
 * correctOptionIndex applies.
 *
 * Idempotent: matches on slug, updates in place, creates when missing.
 * Existing TestResults are untouched unless you pass --reset-results.
 *
 * Usage:
 *   node scripts/seed_professional_tests.js
 *   node scripts/seed_professional_tests.js --only=holland-code-career-test
 *   node scripts/seed_professional_tests.js --reset-results
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');

/* ─── Profile-test options (Likert) ───────────────────────────────────────────
   Balanced keying: the same five anchors on every item, so a "Strongly Agree"
   habit cannot inflate one category. */

const LIKERT = (category) => [
  { text: 'Strongly agree', points: { [category]: 3 }, explanation: 'A strong pull towards this kind of work.' },
  { text: 'Agree', points: { [category]: 1 }, explanation: 'A mild preference for this kind of work.' },
  { text: 'Neutral', points: {}, explanation: 'No signal either way — this item does not move your profile.' },
  { text: 'Disagree', points: { [category]: -1 }, explanation: 'A mild aversion to this kind of work.' },
  { text: 'Strongly disagree', points: { [category]: -3 }, explanation: 'A clear aversion to this kind of work.' },
];

/* ─── Holland / RIASEC — 30 items, 5 per type, three tiers ─────────────────── */

const HOLLAND = [
  /* Realistic */
  { type: 'Realistic', difficulty: 'beginner', scenario: 'A neighbourhood bike is unrideable — the gears skip and the brakes rub.', q: 'You would rather strip it down and rebuild the drivetrain yourself than pay a shop to do it.' },
  { type: 'Realistic', difficulty: 'beginner', scenario: 'A garden wall has a cracked course of bricks.', q: 'Mixing mortar and rebuilding that section with your own hands appeals to you.' },
  { type: 'Realistic', difficulty: 'intermediate', scenario: 'Your family is moving house this weekend.', q: 'Packing, lifting and reassembling the furniture is the part of moving day you would volunteer for.' },
  { type: 'Realistic', difficulty: 'intermediate', scenario: 'A local trail race covers 18 km of rough ground.', q: 'Training for something that depends on stamina and physical coordination sounds like your idea of fun.' },
  { type: 'Realistic', difficulty: 'advanced', scenario: 'A workshop induction covers lathes, pillar drills and powered hand tools.', q: 'You would feel at home being assessed on operating that machinery safely and precisely.' },

  /* Investigative */
  { type: 'Investigative', difficulty: 'beginner', scenario: 'A quiz claims a statistic you are fairly sure is wrong.', q: 'You would spend the evening digging through sources to find out who is right rather than let it go.' },
  { type: 'Investigative', difficulty: 'beginner', scenario: 'A household appliance has stopped working.', q: 'Understanding *why* it failed interests you more than arranging a replacement.' },
  { type: 'Investigative', difficulty: 'intermediate', scenario: 'Your team has twelve months of sales data with no obvious story in it.', q: 'You would enjoy hunting for the pattern that explains the dip.' },
  { type: 'Investigative', difficulty: 'intermediate', scenario: 'A final-year project lets you choose between a lab study and a group case competition.', q: 'You would pick the lab study.' },
  { type: 'Investigative', difficulty: 'advanced', scenario: 'A published paper describes an experiment you cannot reproduce.', q: 'You would want to reason through the method yourself to find where it could be wrong.' },

  /* Artistic */
  { type: 'Artistic', difficulty: 'beginner', scenario: 'A community newsletter needs a cover for its next issue.', q: 'Designing the layout and the visual identity yourself would be the fun part.' },
  { type: 'Artistic', difficulty: 'beginner', scenario: "A friend's short film needs background music.", q: 'You would be keen to write or arrange something original for it.' },
  { type: 'Artistic', difficulty: 'intermediate', scenario: 'A brand brief is deliberately vague about the direction.', q: 'You would enjoy interpreting it in an original way rather than asking for tighter rules.' },
  { type: 'Artistic', difficulty: 'intermediate', scenario: 'A client asks for something "unconventional".', q: 'The absence of a fixed structure energises you rather than worries you.' },
  { type: 'Artistic', difficulty: 'advanced', scenario: 'A gallery is taking open submissions for its next show.', q: 'You would put forward a piece you made purely for your own expression.' },

  /* Social */
  { type: 'Social', difficulty: 'beginner', scenario: 'A classmate has clearly fallen behind on the coursework.', q: 'You would offer to sit with them and work through it together.' },
  { type: 'Social', difficulty: 'beginner', scenario: 'A local NGO needs weekend volunteers.', q: 'You would sign up for the role that involves supporting people directly.' },
  { type: 'Social', difficulty: 'intermediate', scenario: 'A junior colleague is stuck, discouraged and losing confidence.', q: 'Coaching them back to competence would be more rewarding to you than finishing your own work early.' },
  { type: 'Social', difficulty: 'intermediate', scenario: 'A team meeting turns emotional and people stop listening to each other.', q: 'You would be the one who draws each person out until everyone feels heard.' },
  { type: 'Social', difficulty: 'advanced', scenario: 'You are offered two roles on the same terms: an independent specialist, or a mentor to six trainees.', q: 'The mentoring role is the one that appeals.' },

  /* Enterprising */
  { type: 'Enterprising', difficulty: 'beginner', scenario: 'A group project has no leader and no plan.', q: 'You would step up, split the work and start assigning it.' },
  { type: 'Enterprising', difficulty: 'beginner', scenario: 'A stall at the college fest is not selling anything.', q: 'You would take over the pitch and start convincing passers-by.' },
  { type: 'Enterprising', difficulty: 'intermediate', scenario: 'A pitch competition gives you five minutes in front of investors.', q: 'You would relish making the case and handling the pushback.' },
  { type: 'Enterprising', difficulty: 'intermediate', scenario: 'An opportunity could pay off well or fail in public.', q: 'The size of the potential upside would outweigh the risk of looking bad.' },
  { type: 'Enterprising', difficulty: 'advanced', scenario: "A friend's small business has plateaued for two years.", q: 'You would want to run the growth push yourself rather than advise from the sidelines.' },

  /* Conventional */
  { type: 'Conventional', difficulty: 'beginner', scenario: 'A shared spreadsheet has inconsistent formats and duplicate rows.', q: 'You would enjoy cleaning it into something people can trust.' },
  { type: 'Conventional', difficulty: 'beginner', scenario: 'Two records disagree about the same invoice.', q: 'Tracking down which entry is wrong and correcting it sounds satisfying.' },
  { type: 'Conventional', difficulty: 'intermediate', scenario: 'A process nobody has ever written down is run differently by each person.', q: 'You would want to document it step by step so it runs the same way every time.' },
  { type: 'Conventional', difficulty: 'intermediate', scenario: 'A project needs someone to hold the schedule and budget exactly.', q: 'That role appeals to you more than the creative work does.' },
  { type: 'Conventional', difficulty: 'advanced', scenario: 'Several statutory filings fall due in the same fortnight.', q: 'You would take on the checklist and make sure nothing is missed or late.' },
];

/* ─── Engineering branch selector — 20 items, 4 per branch ─────────────────── */

const ENGINEERING = [
  /* Computer Science / IT */
  { type: 'Computer Science / IT', difficulty: 'beginner', scenario: 'A repetitive reporting task eats an hour of your team’s morning, every morning.', q: 'You would rather write a script to automate it than keep doing it by hand.' },
  { type: 'Computer Science / IT', difficulty: 'intermediate', scenario: 'A new platform has to hold user sessions securely.', q: 'Designing the data structures and access rules is the part that interests you.' },
  { type: 'Computer Science / IT', difficulty: 'intermediate', scenario: 'A service slows to a crawl under load.', q: 'You would rather profile the code and fix the algorithms than replace the hardware.' },
  { type: 'Computer Science / IT', difficulty: 'advanced', scenario: 'A model gives confident answers that are plainly wrong.', q: 'Digging into how it was trained and where it fails is the interesting part.' },

  /* Mechanical */
  { type: 'Mechanical', difficulty: 'beginner', scenario: 'A washing machine has started making a grinding noise.', q: 'You would open it up and find the worn part yourself.' },
  { type: 'Mechanical', difficulty: 'intermediate', scenario: 'A clinic needs a device that holds a sample at a fixed temperature for hours.', q: 'Designing the mechanism and working out its tolerances sounds engaging.' },
  { type: 'Mechanical', difficulty: 'intermediate', scenario: 'A factory line keeps jamming at one station.', q: 'You would prefer to rework the moving parts than the control software.' },
  { type: 'Mechanical', difficulty: 'advanced', scenario: 'A drone loses lift as it climbs to altitude.', q: 'You would model the airflow and thermal effects rather than just fit a bigger motor.' },

  /* Civil */
  { type: 'Civil', difficulty: 'beginner', scenario: 'A footbridge over a drainage channel has to be replaced.', q: 'Designing the span and its foundations interests you.' },
  { type: 'Civil', difficulty: 'intermediate', scenario: 'A new road has to cross a floodplain.', q: 'Assessing drainage, materials and environmental impact is the work you would take on.' },
  { type: 'Civil', difficulty: 'intermediate', scenario: 'A city block is being redeveloped around a new transit stop.', q: 'Planning how it sits, drains and serves people appeals more than the interior design.' },
  { type: 'Civil', difficulty: 'advanced', scenario: 'A structure develops hairline cracks after an earthquake.', q: 'You would want to analyse load paths and materials until you could explain exactly why.' },

  /* Electrical / Electronics */
  { type: 'Electrical / Electronics', difficulty: 'beginner', scenario: 'The lights on one circuit in a house flicker.', q: 'You would take a multimeter and trace the fault yourself.' },
  { type: 'Electrical / Electronics', difficulty: 'intermediate', scenario: 'A greenhouse needs solar power to run sensors and pumps.', q: 'Sizing the panels, batteries and wiring is the interesting problem.' },
  { type: 'Electrical / Electronics', difficulty: 'intermediate', scenario: 'A microcontroller project needs to report readings wirelessly.', q: 'Building the circuit and writing the firmware is the part you would want.' },
  { type: 'Electrical / Electronics', difficulty: 'advanced', scenario: 'A microgrid has to balance variable supply with variable demand.', q: 'Modelling the control and storage strategy sounds engaging.' },

  /* Chemical */
  { type: 'Chemical', difficulty: 'beginner', scenario: 'A stain remover works far better at one temperature than another.', q: 'The reaction behind that difference is what you would look up.' },
  { type: 'Chemical', difficulty: 'intermediate', scenario: 'A reaction works perfectly in a beaker but not at industrial scale.', q: 'Working out how to scale the process up interests you.' },
  { type: 'Chemical', difficulty: 'intermediate', scenario: 'A plant has to cut its emissions without losing yield.', q: 'Optimising the process chemistry is the task you would choose.' },
  { type: 'Chemical', difficulty: 'advanced', scenario: 'A packaging material has to biodegrade on a predictable schedule.', q: 'Designing the polymer to meet that schedule is the challenge you would take.' },
];

/* ─── Keyed, auto-scored aptitude test — 12 items, three tiers ─────────────── */

const REASONING = [
  {
    difficulty: 'beginner',
    scenario: 'A staircase of numbers: 2, 6, 12, 20, 30, ?',
    q: 'What comes next in the sequence?',
    tags: ['number-series', 'pattern-recognition'],
    options: ['36', '40', '42', '44'],
    correct: 2,
    explanation: 'The gaps are 4, 6, 8, 10 — increasing by two each time. The next gap is 12, so 30 + 12 = 42.',
  },
  {
    difficulty: 'beginner',
    scenario: 'Every engineer at the firm has passed the safety test. Priya works at the firm and has not passed the safety test.',
    q: 'What must be true?',
    tags: ['deduction', 'logic'],
    options: ['Priya is an engineer who is exempt', 'Priya is not an engineer', 'Priya will pass on a retake', 'Nothing can be concluded'],
    correct: 1,
    explanation: 'If all engineers have passed and Priya has not, Priya cannot be in the set of engineers. This is the contrapositive of the given rule.',
  },
  {
    difficulty: 'beginner',
    scenario: 'A shop takes 20% off an item, then a further 10% off the already-discounted price.',
    q: 'What single discount is equivalent to the two?',
    tags: ['percentages', 'quantitative'],
    options: ['26%', '28%', '30%', '32%'],
    correct: 1,
    explanation: 'Successive discounts multiply: 0.8 × 0.9 = 0.72, so the customer pays 72% and the total discount is 28%. Discounts add only when applied to the original price.',
  },
  {
    difficulty: 'beginner',
    scenario: 'No reptiles are warm-blooded. A gecko is a reptile.',
    q: 'Which conclusion follows?',
    tags: ['deduction', 'logic'],
    options: ['A gecko is not warm-blooded', 'A gecko may be warm-blooded', 'Warm-blooded animals are not reptiles and geckos live in warm places', 'All cold-blooded animals are geckos'],
    correct: 0,
    explanation: 'If the reptile set and the warm-blooded set share no members, membership of one excludes the other.',
  },
  {
    difficulty: 'intermediate',
    scenario: 'A train covers 240 km at 80 km/h, then continues 150 km at 50 km/h.',
    q: 'What is its average speed across the whole journey?',
    tags: ['rates', 'quantitative'],
    options: ['60 km/h', '63 km/h', '65 km/h', '70 km/h'],
    correct: 2,
    explanation: 'Time is 240/80 = 3 h plus 150/50 = 3 h, so 6 h for 390 km. Average speed is total distance over total time: 390/6 = 65 km/h — not the mean of 80 and 50.',
  },
  {
    difficulty: 'intermediate',
    scenario: 'A sequence doubles and then adds a growing number: 3, 7, 16, 35, 74, ?',
    q: 'What comes next?',
    tags: ['number-series', 'pattern-recognition'],
    options: ['143', '148', '153', '160'],
    correct: 2,
    explanation: 'Each term is double the previous plus an increment: 3×2+1, 7×2+2, 16×2+3, 35×2+4, so 74×2+5 = 153.',
  },
  {
    difficulty: 'intermediate',
    scenario: 'Some reports are urgent. Every urgent item goes to the director.',
    q: 'Which statement must be true?',
    tags: ['deduction', 'logic'],
    options: ['All reports go to the director', 'At least one report goes to the director', 'Only urgent reports go to the director', 'No report goes to the director'],
    correct: 1,
    explanation: '"Some reports are urgent" guarantees at least one urgent report, and every urgent item reaches the director — so at least one report does. The other options overreach.',
  },
  {
    difficulty: 'intermediate',
    scenario: 'A team shipped 40, 46, 50, 54 and 56 units over five consecutive weeks.',
    q: 'Between which two consecutive weeks was the percentage increase the largest?',
    tags: ['data-interpretation', 'quantitative'],
    options: ['Weeks 1 to 2', 'Weeks 2 to 3', 'Weeks 3 to 4', 'Weeks 4 to 5'],
    correct: 0,
    explanation: 'Week-on-week growth is 6/40 = 15%, then 4/46 ≈ 8.7%, 4/50 = 8% and 2/54 ≈ 3.7%. The same absolute rise is a bigger percentage off a smaller base.',
  },
  {
    difficulty: 'advanced',
    scenario: 'A door code uses three different digits chosen from 1, 2, 3, 4 and 5. No digit repeats.',
    q: 'How many different codes end in 5?',
    tags: ['combinatorics', 'quantitative'],
    options: ['9', '10', '12', '20'],
    correct: 2,
    explanation: 'The last digit is fixed as 5. The remaining two positions are an ordered selection of two digits from {1,2,3,4}: 4 × 3 = 12.',
  },
  {
    difficulty: 'advanced',
    scenario: 'Four colleagues sit in a row of four seats. Ana refuses either end seat. Ben always sits immediately to Ana’s right. Cara sits in the right-hand end seat.',
    q: 'Who must be sitting in the left-hand end seat?',
    tags: ['logic-grid', 'deduction'],
    options: ['Ana', 'Ben', 'Cara', 'Dan'],
    correct: 3,
    explanation: 'Cara holds seat 4. Ben sits immediately right of Ana, so Ana cannot be in seat 3 (that would put Ben in Cara’s seat). Ana must be in seat 2, Ben in seat 3, leaving Dan in seat 1.',
  },
  {
    difficulty: 'advanced',
    scenario: 'A screening test for a rare condition is 95% accurate in both directions. The condition affects 1 person in 1,000.',
    q: 'Of 1,000 people tested, roughly what share of positive results are true positives?',
    tags: ['probability', 'data-interpretation'],
    options: ['About 2%', 'About 20%', 'About 65%', 'About 95%'],
    correct: 2,
    explanation: 'Expect ~1 true case (95% detected ≈ 1 true positive) against ~50 false positives from the 999 healthy people (5% of 999), so positives are ≈ 95/(95+50) ≈ 65%. Low base rates swamp a good test.',
  },
  {
    difficulty: 'advanced',
    scenario: 'In a group of 40 students, 25 use the news app, 18 read the printed paper, and 8 do both.',
    q: 'How many read neither?',
    tags: ['sets', 'quantitative'],
    options: ['5', '7', '8', '13'],
    correct: 0,
    explanation: 'Union = 25 + 18 − 8 = 35, so 40 − 35 = 5 read neither. Subtracting the overlap twice is the usual slip.',
  },
];

/* ─── Builders ─────────────────────────────────────────────────────────────── */

const profileQuestion = (item) => ({
  question: item.q,
  scenario: item.scenario,
  difficulty: item.difficulty,
  tags: [item.type.toLowerCase().replace(/[^a-z]+/g, '-')],
  explanation: `This item measures ${item.type} interest: agreeing raises that score, disagreeing lowers it.`,
  correctOptionIndex: null,
  options: LIKERT(item.type),
});

const keyedQuestion = (item) => ({
  question: item.q,
  scenario: item.scenario,
  difficulty: item.difficulty,
  tags: item.tags || [],
  explanation: item.explanation,
  correctOptionIndex: item.correct,
  options: item.options.map((text) => ({ text, points: {}, explanation: '' })),
});

const TIER_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
const byTier = (a, b) => TIER_ORDER[a.difficulty] - TIER_ORDER[b.difficulty];

const TESTS = [
  {
    slug: 'holland-code-career-test',
    name: 'Holland Code Career Interest Test',
    description:
      'A 30-item interest inventory built on the six RIASEC dimensions. Each item puts you in a concrete situation and asks how you would actually respond, then maps your answers to the career environments that fit.',
    instructions:
      'Answer as the person you are on an ordinary day, not the person you think you should be. There are no correct answers, and no answer is better than another. Most people take 8–10 minutes.',
    introMessage:
      'This is an interest inventory, not an exam. You will see 30 short scenarios and rate how much each one sounds like you. Your strongest two or three dimensions shape your Holland code at the end.',
    categories: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
    difficulty: 'mixed',
    scoringMode: 'profile',
    timeLimit: null,
    passingScore: null,
    shuffleQuestions: false,
    showExplanations: true,
    questions: [...HOLLAND].sort(byTier).map((i) => profileQuestion(i)),
  },
  {
    slug: 'engineering-branch-selector',
    name: 'Engineering Branch Selector',
    description:
      'Twenty scenarios drawn from real practice across five engineering branches. It shows which branch problems you are drawn to, so a stream choice is based on the work rather than the label.',
    instructions:
      'Rate how much each scenario appeals to you. Work at a steady pace — your first reaction is usually the most honest one.',
    introMessage:
      'Five branches, twenty scenarios. Picture yourself doing each task for a living, not just enjoying it once.',
    categories: ['Computer Science / IT', 'Mechanical', 'Civil', 'Electrical / Electronics', 'Chemical'],
    difficulty: 'mixed',
    scoringMode: 'profile',
    timeLimit: null,
    passingScore: null,
    shuffleQuestions: false,
    showExplanations: true,
    questions: [...ENGINEERING].sort(byTier).map((i) => profileQuestion(i)),
  },
  {
    slug: 'logical-reasoning-aptitude',
    name: 'Logical Reasoning Aptitude Test',
    description:
      'Twelve auto-scored items across number series, deduction, data interpretation, probability and combinatorics. Difficulty is graded so you can see exactly where your reasoning holds and where it breaks down.',
    instructions:
      'Each question has exactly one correct answer. Rough work is expected; no calculator is needed. You get one attempt, and your result includes a full explanation for every item.',
    introMessage:
      'Twelve questions, twenty minutes, one right answer each. The items get harder as you go — expect the last few to need real thought.',
    categories: ['Logical Reasoning'],
    difficulty: 'mixed',
    scoringMode: 'scored',
    timeLimit: 20,
    passingScore: 60,
    shuffleQuestions: true,
    showExplanations: true,
    questions: [...REASONING].sort(byTier).map(keyedQuestion),
  },
];

/* ─── Quality audit ────────────────────────────────────────────────────────── */

function audit(test) {
  const qs = test.questions || [];
  const mix = { beginner: 0, intermediate: 0, advanced: 0 };
  let scenario = 0;
  let explained = 0;
  let keyed = 0;
  let tagged = 0;

  qs.forEach((q) => {
    mix[q.difficulty] = (mix[q.difficulty] || 0) + 1;
    if (q.scenario && q.scenario.trim()) scenario++;
    if (q.explanation && q.explanation.trim()) explained++;
    if (q.correctOptionIndex != null) keyed++;
    if (q.tags && q.tags.length) tagged++;
  });

  const pct = (n) => (qs.length ? Math.round((n / qs.length) * 100) : 0);
  return {
    total: qs.length,
    mix,
    scenario: pct(scenario),
    explained: pct(explained),
    tagged: pct(tagged),
    keyed: test.scoringMode === 'scored' ? keyed : null,
  };
}

/* ─── Run ──────────────────────────────────────────────────────────────────── */

/* Structural check on the bundled definitions. Runs before the database is
   touched so a bad key, a category that no test declares, or a duplicate item
   is caught locally rather than as a Mongoose validation error mid-seed. */
function validateDefinitions() {
  const problems = [];
  TESTS.forEach((test) => {
    const cats = new Set(test.categories);
    const seen = new Set();
    test.questions.forEach((q, i) => {
      const label = `${test.slug} Q${i + 1}`;
      if (!q.question || q.question.trim().length < 12) problems.push(`${label}: question text is too short.`);
      const fingerprint = (q.scenario || '').trim().toLowerCase() + '|' + q.question.trim().toLowerCase();
      if (seen.has(fingerprint)) problems.push(`${label}: duplicate of an earlier item.`);
      seen.add(fingerprint);
      if (!q.options || q.options.length < 2) problems.push(`${label}: needs at least 2 options.`);
      if (!['beginner', 'intermediate', 'advanced'].includes(q.difficulty)) problems.push(`${label}: bad difficulty.`);
      if (!q.explanation || !q.explanation.trim()) problems.push(`${label}: missing explanation.`);

      if (test.scoringMode === 'scored') {
        if (q.correctOptionIndex == null) problems.push(`${label}: scored test item has no key.`);
        else if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) problems.push(`${label}: key is out of range.`);
        const texts = q.options.map((o) => o.text.trim().toLowerCase());
        if (new Set(texts).size !== texts.length) problems.push(`${label}: duplicate option text.`);
      } else {
        if (!q.options.some((o) => o.points && Object.keys(o.points).length > 0)) problems.push(`${label}: no scoring points on any option.`);
        q.options.forEach((o) => {
          Object.keys(o.points || {}).forEach((cat) => {
            if (!cats.has(cat)) problems.push(`${label}: option points reference undeclared category \"${cat}\".`);
          });
        });
      }
    });
    if (test.scoringMode === 'scored' && test.passingScore == null) problems.push(`${test.slug}: scored test needs a passingScore.`);
  });
  return problems;
}

async function seed() {
  const args = process.argv.slice(2);
  const only = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1];
  const resetResults = args.includes('--reset-results');

  const problems = validateDefinitions();
  if (problems.length > 0) {
    console.error('Bundled question bank has problems:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exitCode = 1;
    return;
  }

  if (args.includes('--dry-run')) {
    console.log('Definitions valid. Auditing without connecting:\n');
    TESTS.forEach((t) => {
      const a = audit(t);
      console.log(`${t.slug}: ${a.total} items | ${a.mix.beginner}/${a.mix.intermediate}/${a.mix.advanced} b/i/a | ${a.scenario}% scenario | ${a.explained}% explained`);
    });
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI — point it at the database you want to seed.');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const target = only ? TESTS.filter((t) => t.slug === only) : TESTS;
    if (target.length === 0) {
      console.error(`No bundled test matches slug "${only}". Available: ${TESTS.map((t) => t.slug).join(', ')}`);
      process.exitCode = 1;
      return;
    }

    if (resetResults) {
      const scores = target.map((t) => t.slug);
      const { deletedCount } = await TestResult.deleteMany({ testSlug: { $in: scores } });
      console.log(`Cleared ${deletedCount} stored result(s) for the tests being reseeded.`);
    }

    for (const def of target) {
      const existing = await Test.findOne({ slug: def.slug });
      if (existing) {
        Object.assign(existing, def);
        await existing.save();
        console.log(`Updated  ${def.slug}`);
      } else {
        await Test.create({ ...def, isActive: true });
        console.log(`Created  ${def.slug}`);
      }

      const a = audit(def);
      console.log(
        `         ${a.total} items | ${a.mix.beginner}/${a.mix.intermediate}/${a.mix.advanced} beginner/intermediate/advanced` +
        ` | ${a.scenario}% scenario-led | ${a.explained}% explained | ${a.tagged}% tagged` +
        (a.keyed != null ? ` | ${a.keyed}/${a.total} keyed` : '')
      );
    }

    console.log('\nQuestion bank seeded. Review the questions in /admin/tests before publishing.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
