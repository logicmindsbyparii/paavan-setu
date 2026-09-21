/* Humanities Career Test — career-track metadata.
   The bank's 76 questions are a strict grid: 19 career tracks × 4 lenses
   (Activity, Comfort, Career Knowledge, Personality), track = index % 19.
   Track order below MUST match that question order — it is the same order
   parse_humanities_pdf.js extracted from the source paper, so track k is
   described by questions k, k+19, k+38 and k+57.
   Keyed by the exact strings the scoring engine emits, shared by the
   on-screen report, the print document and the report model. */

export const HUMANITIES_TRACKS = [
  'Economist',
  'Psychologist',
  'Journalist',
  'Media & Film Professional',
  'Beauty & Styling Professional',
  'Librarian / Document Specialist',
  'Manager & Team Lead',
  'Logical Planner',
  'Civil Services Officer',
  'Sports & Fitness Professional',
  'Hospitality Professional',
  'Travel & Tourism Professional',
  'Teacher / Educator',
  'Language Specialist',
  'Designer (Graphic & Animation)',
  'Fashion Designer',
  'Historian / Archaeologist',
  'Geographer',
  'Political Analyst',
];

/* How the four lenses read a track, one line each — used in the profile
   card and the print sheet. Order matches the question blocks:
   0–18 Activity · 19–37 Comfort · 38–56 Career Knowledge (graded) ·
   57–75 Personality. */
export const LENSES = [
  { key: 'activity', title: 'Activity pull', from: 0, to: 18, graded: false,
    blurb: 'Do the day-to-day tasks of this career sound like you?' },
  { key: 'comfort', title: 'Work comfort', from: 19, to: 37, graded: false,
    blurb: 'How comfortable the career’s working style feels.' },
  { key: 'knowledge', title: 'Career knowledge', from: 38, to: 56, graded: true,
    blurb: '19 quiz questions — how well you already know these careers.' },
  { key: 'personality', title: 'Personality fit', from: 57, to: 75, graded: false,
    blurb: 'What your choices in school-life situations say about you.' },
];

export const humanitiesMeta = {
  'Economist': {
    careers: 'Economist, Economic Researcher, Policy Analyst, Data Journalist (economics)',
    subjects: 'Economics, Mathematics, Statistics, Political Science',
    fit: 'You read the world through numbers, markets and incentives — the person who asks “why did prices move?”.',
  },
  'Psychologist': {
    careers: 'Clinical Psychologist, Counsellor, Organisational Psychologist, Therapist',
    subjects: 'Psychology, Biology, Sociology, English',
    fit: 'You notice what people feel before they say it, and you stay steady when others open up.',
  },
  'Journalist': {
    careers: 'Reporter, News Anchor, Editor, Photojournalist, Digital Content Creator',
    subjects: 'English, Political Science, Economics, Media Studies',
    fit: 'You are curious to a fault — you want to know what happened and tell someone about it.',
  },
  'Media & Film Professional': {
    careers: 'Film Maker, Ad Film Director, Video Editor, Content Producer, Radio Jockey',
    subjects: 'Media Studies, English, Fine Arts, Psychology',
    fit: 'You think in stories and scenes, and you would rather show than tell.',
  },
  'Beauty & Styling Professional': {
    careers: 'Hair Stylist, Makeup Artist, Image Consultant, Salon Entrepreneur',
    subjects: 'Any stream + professional beauty/styling certification',
    fit: 'You have an eye for detail on real people — and the confidence to tell someone a look will work.',
  },
  'Librarian / Document Specialist': {
    careers: 'Librarian, Archivist, Documentation Officer, Records Manager, Information Scientist',
    subjects: 'Any stream + Library & Information Science degree',
    fit: 'You find calm in order — systems, lists and everything filed where it can be found again.',
  },
  'Manager & Team Lead': {
    careers: 'Management Executive, HR Manager, Operations Lead, Event Manager',
    subjects: 'Business Studies, Economics, English, Mathematics',
    fit: 'You naturally take charge — plans, delegation and seeing a team through to the target.',
  },
  'Administrator (Law & Governance)': {
    careers: 'Company Secretary, Corporate Lawyer, Compliance Officer, Administrative Officer, Legal Assistant',
    subjects: 'Political Science, Economics, Business Studies, Legal Studies',
    fit: 'You rehearse every move before making it, and rules, laws and procedures feel like structure to use — not obstacles.',
  },
  'Civil Services Officer': {
    careers: 'IAS/IPS/IFS Officer, District Administration, Public Policy, Defence Services',
    subjects: 'History, Political Science, Geography, Economics',
    fit: 'You want the authority to be useful — command with responsibility suits you.',
  },
  'Sports & Fitness Professional': {
    careers: 'Professional Athlete, Sports Coach, Fitness Trainer, Sports Physiotherapist',
    subjects: 'Physical Education, Biology, Psychology',
    fit: 'Discipline comes naturally — early mornings, routines and the grind do not scare you.',
  },
  'Hospitality Professional': {
    careers: 'Hotel Management, Chef, F&B Services, Front Office, Cabin Crew',
    subjects: 'Any stream + Hotel Management entrance (NCHM JEE)',
    fit: 'Hostaising is instinct — you enjoy pleasing people and you do it with energy.',
  },
  'Travel & Tourism Professional': {
    careers: 'Travel Consultant, Tour Manager, Ticketing & Logistics, Destination Expert',
    subjects: 'Geography, Economics, any language, Tourism diplomas',
    fit: 'You plan trips in your head for fun — logistics, budgets and new places excite you.',
  },
  'Teacher / Educator': {
    careers: 'School Teacher, Professor, Education Content Creator, Special Educator',
    subjects: 'Your chosen subjects + B.Ed / NET for senior roles',
    fit: 'Explaining something until it clicks gives you genuine satisfaction.',
  },
  'Language Specialist': {
    careers: 'Translator, Interpreter, Linguist, Foreign-Language Trainer, Subtitler',
    subjects: 'The languages you love + a university linguistics/translation programme',
    fit: 'Languages are puzzles you enjoy — sounds, meanings and switching between them.',
  },
  'Designer (Graphic & Animation)': {
    careers: 'Graphic Designer, Animator, UI Designer, Motion Graphics Artist, Illustrator',
    subjects: 'Fine Arts, Computer Science + design portfolio (NID/NIFT/UCEED)',
    fit: 'You think in colour, type and movement — making things look right matters to you.',
  },
  'Fashion & Interior Designer': {
    careers: 'Fashion Designer, Interior Designer, Jewellery Designer, Merchandiser, Stylist, Boutique Owner',
    subjects: 'Any stream + NIFT/NID portfolio and entrance',
    fit: 'You see garments, rooms and accessories as design problems — fabric, form, colour and trend.',
  },
  'Historian / Archaeologist': {
    careers: 'Historian, Archaeologist, Museum Curator, Heritage Manager, Archivist',
    subjects: 'History, Political Science, Geography, a classical/foreign language',
    fit: 'The past is not dead to you — artefacts, ruins and old texts pull you in.',
  },
  'Geographer': {
    careers: 'Geographer, Meteorologist, Cartographer, GIS Analyst, Environmental Planner',
    subjects: 'Geography, Economics, Mathematics, Environmental Science',
    fit: 'You know the land — rivers, climate, soils — and how people live on it.',
  },
  'Political Analyst': {
    careers: 'Political Analyst, Psephologist, Political Correspondent, Policy Researcher',
    subjects: 'Political Science, Economics, History, Statistics',
    fit: 'You follow power like a sport — elections, policy and the news that moves them.',
  },
};

/* Lens labels shown when a section renders in the section table. */
export const lensLabelFor = (graded) => (graded
  ? 'Career knowledge quiz (graded right / wrong)'
  : 'Interest & preference (no right answers)');
