/* Category metadata for the stream & engineering-branch selector reports.
   Keyed to the exact category names the scoring engine emits. Shared by the
   on-screen report, the print document, and the report model. */

export const streamMeta = {
  'Science (Medical)': {
    careers: 'MBBS, Dentistry, Pharmacy, Biotechnology, Physiotherapy, Nursing',
    subjects: 'Physics, Chemistry, Biology',
    fit: 'You are drawn to life sciences, care work and lab-based discovery.',
  },
  'Science (Non-Medical)': {
    careers: 'Engineering, Architecture, Computer Science, Aviation, Data Science',
    subjects: 'Physics, Chemistry, Mathematics',
    fit: 'You enjoy technical problems, patterns, machines and logical reasoning.',
  },
  Commerce: {
    careers: 'Chartered Accountancy, Business Administration, Economics, Finance, Banking',
    subjects: 'Accounts, Business Studies, Economics, Mathematics',
    fit: 'You are comfortable with numbers, money decisions and organised detail.',
  },
  'Arts & Humanities': {
    careers: 'Law, Journalism, Psychology, Design, Civil Services, Teaching',
    subjects: 'History, Political Science, Psychology, Literature',
    fit: 'You lean towards people, ideas, language and creative expression.',
  },
};

/* Engineering Branch Selector categories — keyed to the branch names the
   scoring engine emits, so the verdict card, careers and subject advice work
   for this test as well as the stream selector. */
export const branchMeta = {
  'Computer Science / IT': {
    careers: 'Software development, Data science & AI, Cybersecurity, Cloud engineering, Product engineering',
    subjects: 'Physics, Chemistry, Mathematics, Computer Science',
    fit: 'You enjoy building with software, logic and systems — abstract problems that turn into working products.',
  },
  Mechanical: {
    careers: 'Automotive & aerospace design, Manufacturing, Robotics, Thermal systems, Mechatronics',
    subjects: 'Physics, Chemistry, Mathematics, Engineering Drawing',
    fit: 'You are drawn to machines, movement, energy and how things are built.',
  },
  Civil: {
    careers: 'Structural engineering, Urban planning, Transportation, Construction management, Environmental systems',
    subjects: 'Physics, Chemistry, Mathematics',
    fit: 'You notice structures, spaces and the built world around you.',
  },
  'Electrical / Electronics': {
    careers: 'Power systems, Embedded systems, VLSI & chip design, Telecom, Instrumentation',
    subjects: 'Physics, Mathematics, Electronics',
    fit: 'You like circuits, signals and making energy do useful work.',
  },
  Chemical: {
    careers: 'Process engineering, Petrochemicals, Pharma & materials, Food technology, Environmental engineering',
    subjects: 'Physics, Chemistry, Mathematics, Biology (optional)',
    fit: 'You are curious about reactions, materials and how things are made at scale.',
  },
};

/* Commerce Career Selector — cluster → roles map and the financial-domain
   list used to split the dominant axis. Shared by the on-screen report and
   the print document (including PDFs built from My Results). */
export const careerClusters = {
  'Accounts/Taxation': 'Accountant, Cost Accountant, Chartered Accountant, Tax Advisor',
  'Analytics': 'Statistician, Business Analyst',
  'Communication and Media': 'Radio/TV Anchoring, PR, Photography, Media Editor',
  'Computer Related Designing': 'Web Designer, Animator, Game Designer, Illustrator',
  'Financial Auditing and Investigation': 'Security Analyst, Auditor, Actuary, Risk Management',
  'Financial Banking and Investment': 'Actuary, Personal Banker, Treasury, Investment Banker',
  'Financial Management': 'Real Estate, Finance Management, Wealth Management',
  'Financial Planner': 'Economist, Economic Advisor, Budget Analyst',
  'Hospitality and Tourism': 'Travel Agent, Logistics Manager, Event Manager',
  'Hotel': 'Hotel Manager, Chef, F&B Specialist',
  'Industrial Designing': 'Fashion Designer, Jewellery Designer, Interior Designer',
  'Journalism': 'Journalist, Reporter, Editor, Copy Writer',
  'Languages': 'Linguist, Translator, Interpreter, News Reader',
  'Law': 'Corporate Lawyer, Tax Lawyer, Company Secretary',
  'Management': 'Banking Management, HR Management, Operations Management',
  'Social Sciences': 'Teacher, Social Worker, Career Counselor, Researcher',
  'Teaching and Education': 'Primary Teacher, Lecturer, Institute Trainer, Principal',
  'Trading': 'Stock Broker, Foreign Exchange Trader, Commodity Trader',
};

export const financialDomains = [
  'Accounts/Taxation', 'Analytics', 'Financial Auditing and Investigation', 'Financial Banking and Investment',
  'Financial Management', 'Financial Planner', 'Law', 'Management', 'Trading',
];

/* Fallback section map (0-based) if the test doc carries no sections. */
export const FALLBACK_SECTIONS = [
  { title: 'Like / Dislike', from: 0, to: 13, aptitude: false },
  { title: 'Work Situations I', from: 14, to: 24, aptitude: false },
  { title: 'Work Situations II', from: 25, to: 35, aptitude: false },
  { title: 'Identical Codes', from: 36, to: 45, aptitude: true },
  { title: 'Number Game', from: 46, to: 55, aptitude: true },
  { title: 'Careful Reading', from: 56, to: 65, aptitude: true },
  { title: 'Words Game', from: 66, to: 70, aptitude: true },
  { title: 'Incomplete Sequence', from: 71, to: 75, aptitude: true },
];
