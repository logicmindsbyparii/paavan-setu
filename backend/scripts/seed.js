/**
 * Seeds the database with the content that used to be hardcoded in the React
 * frontend (books, categories, author, site settings).
 *
 * Idempotent: re-running updates existing documents instead of duplicating.
 *
 *   node scripts/seed.js
 *   node scripts/seed.js --fresh   # wipe books/categories/authors/settings first
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Book = require('../models/Book');
const Category = require('../models/Category');
const Author = require('../models/Author');
const SiteSettings = require('../models/SiteSettings');

const FRESH = process.argv.includes('--fresh');

// Brand palette — kept identical to the frontend tokens.
const T = {
  green: '#0a4f22', greenLt: '#c8e8d2', greenMid: '#96cead',
  blue: '#174a72', blueLt: '#c4d9ec', blueMid: '#90b8d8',
  amber: '#b06e10', amberLt: '#f5d9a0', amberMid: '#e8b86d',
  wa: '#16a34a', waLt: '#bbf7d0', waMid: '#6ee7a0',
  rose: '#c0395a', roseLt: '#fde8f0', roseMid: '#f5b8cc',
};

const CATEGORIES = [
  { name: 'English Books', description: 'Value-based storybooks in English.', color: T.green, icon: '📗', order: 1 },
  { name: 'Gujarati Books', description: 'ગુજરાતી ભાષામાં મૂલ્ય-આધારિત પુસ્તકો.', color: T.blue, icon: '📘', order: 2 },
];

const AUTHORS = [
  {
    name: 'Shweta Kothari',
    bio: 'Founder of Paavan Setu. Each book is crafted and personally reviewed by her, weaving together character-building, cultural roots, and practical life lessons for young readers.',
    image: '/uploads/seed/profile2.jpeg',
    credentials: ['Founder, Paavan Setu', 'Career Counsellor', 'Author'],
    order: 1,
  },
];

const BOOKS = [
  {
    title: 'My Friend Ganesha',
    subtitle: 'Early Learners / Primary',
    description: 'My Friend Ganesha helps children learn good values and simple life skills through gentle stories and playful moments with their favourite friend, Ganesha.',
    audience: 'Class 9-12', pages: 220, price: 200, language: 'English',
    coverImage: '/uploads/seed/Myfriendganesha2.jpeg', coverImageAlt: 'My Friend Ganesha book cover',
    tag: 'Bestseller', rating: 4.9, reviewCount: 128, stock: 50,
    isFeatured: true, categoryName: 'English Books', order: 1,
    accent: { bg: T.amberLt, border: T.amberMid, col: T.amber },
    imageStyle: { objectPosition: 'center 60%', height: '100%' },
  },
  {
    title: "Krishnaa's Classroom",
    subtitle: 'Primary / Upper Primary',
    description: "This is the Bhagavad Gita retold for children in a way that is simple, engaging, and alive. Each chapter becomes a short, colorful story where the reader steps into Arjun's place, makes decisions, and discovers the lesson for themselves.",
    audience: 'Age 6+', pages: 180, price: 250, language: 'English',
    coverImage: '/uploads/seed/krishna_classroom.jpeg', coverImageAlt: "Krishnaa's Classroom book cover",
    tag: 'New', rating: 4.8, reviewCount: 87, stock: 50,
    isFeatured: true, categoryName: 'English Books', order: 2,
    accent: { bg: T.greenLt, border: T.greenMid, col: T.green },
    imageStyle: { objectPosition: 'top 30%', height: '115%' },
  },
  {
    title: 'Hanuman Chalisa',
    subtitle: 'Primary / Middle School',
    description: "This book gently answers those questions. Through simple meanings, inspiring stories from Hanuman's life, relatable value-based tales, and thoughtful activities, children don't just chant—they understand.",
    audience: 'Class 7-10', pages: 160, price: 250, language: 'English',
    coverImage: '/uploads/seed/Hanuman_chalisa2.jpeg', coverImageAlt: 'Hanuman Chalisa book cover',
    tag: 'Workbook', rating: 4.7, reviewCount: 63, stock: 50,
    categoryName: 'English Books', order: 3,
    accent: { bg: T.blueLt, border: T.blueMid, col: T.blue },
    imageStyle: { objectPosition: 'center', height: '130%' },
  },
  {
    title: 'Krishna Leela',
    subtitle: 'Primary',
    description: 'Krishna Leela is a gentle collection of childhood stories told in simple, lyrical language; these stories follow a playful little boy and the people around him—his family, friends, and village—through moments of joy, mischief, courage, and care.',
    audience: 'Parents', pages: 200, price: 200, language: 'English',
    coverImage: '/uploads/seed/Krishna_leela2.jpeg', coverImageAlt: 'Krishna Leela book cover',
    tag: 'For Parents', rating: 4.9, reviewCount: 54, stock: 50,
    categoryName: 'English Books', order: 4,
    accent: { bg: T.roseLt, border: T.roseMid, col: T.rose },
    imageStyle: { objectPosition: 'center 40%', height: '100%' },
  },
  {
    title: 'Kids Ramayana',
    subtitle: 'Primary / Upper Primary',
    description: 'This book presents a carefully adapted retelling of the Ramayan, based on the Valmiki tradition, for young readers. The narrative has been structured to support clarity of thought, emotional balance, and ethical understanding.',
    audience: 'Teachers & Schools', pages: 280, price: 250, language: 'English',
    coverImage: '/uploads/seed/Ramayan2.jpeg', coverImageAlt: 'Kids Ramayana book cover',
    tag: 'Curriculum', rating: 4.8, reviewCount: 41, stock: 50,
    categoryName: 'English Books', order: 5,
    accent: { bg: T.greenLt, border: T.greenMid, col: T.green },
    imageStyle: { objectPosition: 'center 5%', height: '125%' },
  },
  {
    title: 'માય ફ્રેન્ડ ગણેશ',
    slug: 'my-friend-ganesha-gujarati',
    subtitle: 'પ્રારંભિક શીખનારા / પ્રાથમિક',
    description: 'બાળકોને તેમના પ્રિય મિત્ર ગણેશ સાથેની કોમળ વાર્તાઓ અને રમતિયાળ ક્ષણો દ્વારા સારા મૂલ્યો અને સરળ જીવન કૌશલ્યો શીખવામાં મદદ કરે છે. દબાણ કે ઉપદેશ આપ્યા વિના, આ પુસ્તક બાળકોને શાંતિથી વિચારવા, અન્યની આદર કરવા અને આત્મવિશ્વાસ સાથે દરેક દિવસની શરૂઆત કરવા માર્ગદર્શન આપે છે.',
    audience: 'Class 9-12', pages: 220, price: 180, language: 'Gujarati',
    coverImage: '/uploads/seed/myfriendganesha2.png', coverImageAlt: 'માય ફ્રેન્ડ ગણેશ book cover',
    tag: 'Bestseller', rating: 4.9, reviewCount: 128, stock: 50,
    isFeatured: true, categoryName: 'Gujarati Books', order: 6,
    accent: { bg: T.amberLt, border: T.amberMid, col: T.amber },
    imageStyle: { objectPosition: 'center 60%', height: '100%' },
  },
  {
    title: 'કૃષ્ણની પાઠશાળા',
    slug: 'krishnani-pathshala-gujarati',
    subtitle: 'પ્રાથમિક / ઉચ્ચ પ્રાથમિક',
    description: 'આ ભગવદ ગીતા બાળકોને સરળ, આકર્ષક અને જીવંત રીતે ફરીથી કહેવામાં આવી છે. દરેક પ્રકરણ એક ટૂંકી, રંગીન વાર્તા બની જાય છે જ્યાં વાચક અર્જુનના સ્થાને પણ મૂકે છે, નિર્ણય લે છે અને પોતાને માટે પાઠ શોધે છે.',
    audience: 'Age 6+', pages: 180, price: 220, language: 'Gujarati',
    coverImage: '/uploads/seed/krishna_pathsala2.png', coverImageAlt: 'કૃષ્ણની પાઠશાળા book cover',
    tag: 'New', rating: 4.8, reviewCount: 87, stock: 50,
    categoryName: 'Gujarati Books', order: 7,
    accent: { bg: T.greenLt, border: T.greenMid, col: T.green },
    imageStyle: { objectPosition: 'top 40%', height: '115%' },
  },
  {
    title: 'હનુમાન ચાલીસા',
    slug: 'hanuman-chalisa-gujarati',
    subtitle: 'પ્રાથમિક / માધ્યમિક શાળા',
    description: 'આ પુસ્તક આ પ્રશ્નોના જવાબો હળવાશથી આપે છે. સરળ અર્થો, હૃદયસ્પર્શી જીવનની પ્રેરણાદાયી વાર્તાઓ, સંબંધિત મૂલ્ય-આધારિત વાર્તાઓ અને વિચારશીલ પ્રવૃત્તિઓ દ્વારા, બાળકો ફક્ત જપ નથી — તેઓ સમજવા લાગે છે.',
    audience: 'Class 7-10', pages: 160, price: 210, language: 'Gujarati',
    coverImage: '/uploads/seed/hanumanchalisa2.png', coverImageAlt: 'હનુમાન ચાલીસા book cover',
    tag: 'Workbook', rating: 4.7, reviewCount: 63, stock: 50,
    categoryName: 'Gujarati Books', order: 8,
    accent: { bg: T.blueLt, border: T.blueMid, col: T.blue },
    imageStyle: { objectPosition: 'center', height: '130%' },
  },
  {
    title: 'ક્રિષ્ણા લીલા',
    slug: 'krishna-leela-gujarati',
    subtitle: 'પ્રાથમિક',
    description: 'કૃષ્ણલીલા આ બાળપણની વાર્તાઓનો એક સૌમ્ય સંગ્રહ છે જે સરળ, ગીતાત્મક ભાષામાં કહેવામાં આવ્યા છે; આ વાર્તાઓ એક રમતિયાળ નાના છોકરા અને તેની આસપાસના લોકો – તેના પરિવાર, મિત્રો અને ગામ – ને આનંદ, તોફાન, હિંમત અને સંભાળની ક્ષણો દ્વારા અનુસરે છે.',
    audience: 'Parents', pages: 200, price: 180, language: 'Gujarati',
    coverImage: '/uploads/seed/kleela.png', coverImageAlt: 'ક્રિષ્ણા લીલા book cover',
    tag: 'For Parents', rating: 4.9, reviewCount: 54, stock: 50,
    categoryName: 'Gujarati Books', order: 9,
    accent: { bg: T.roseLt, border: T.roseMid, col: T.rose },
    imageStyle: { objectPosition: 'center 60%', height: '120%' },
  },
  {
    title: 'રામાયણ',
    slug: 'ramayana-gujarati',
    subtitle: 'પ્રાથમિક / ઉચ્ચ પ્રાથમિક',
    description: 'આ પુસ્તક વાલ્મીકિ પરંપરા પર આધારિત રામાયણનું કાળજીપૂર્વક રૂપાંતરિત પુનઃકથન, યુવા વાચકો માટે રજૂ કરે છે. આ કથા વિચારની સ્પષ્ટતા, ભાવનાત્મક સંતુલન અને નૈતિક સમજણને સમર્થન આપવા માટે રચાયેલ છે.',
    audience: 'Teachers & Schools', pages: 280, price: 200, language: 'Gujarati',
    coverImage: '/uploads/seed/Ramayan2.png', coverImageAlt: 'રામાયણ book cover',
    tag: 'Curriculum', rating: 4.8, reviewCount: 41, stock: 50,
    categoryName: 'Gujarati Books', order: 10,
    accent: { bg: T.greenLt, border: T.greenMid, col: T.green },
    imageStyle: { objectPosition: 'top', height: '125%' },
  },
];

/**
 * Site settings.
 *
 * These keys are the contract between three places and must stay in step:
 *   - this seed,
 *   - the admin panel (frontend/src/pages/admin/SettingsManagement.jsx),
 *   - the components that read them (Home, Footer, Contact, Books).
 * They had drifted apart, so seeded values were invisible to the site and admin
 * edits landed on keys nothing consumed.
 */
const SETTINGS = [
  // Branding — Footer reads general.tagline
  { key: 'general.tagline', value: 'Bridging Values with Education', category: 'general', description: 'Short tagline used under the logo and in the footer.' },
  { key: 'site.logo', value: '/uploads/seed/logo_final.png', type: 'image', category: 'general', description: 'Navbar logo.' },

  // Contact — Contact.jsx reads contact.address as one multi-line value
  { key: 'contact.email', value: 'paavan.setu@gmail.com', category: 'contact', description: 'Public contact email.' },
  { key: 'contact.phone', value: '+91 63511-13766', category: 'contact', description: 'Public contact phone, display format.' },
  { key: 'contact.whatsapp', value: '916351113766', category: 'contact', description: 'WhatsApp number, digits only with country code.' },
  {
    key: 'contact.address',
    value: 'A-5/29, 6th Floor, Green City Gold,\nPal Bhata Road, Pal, Surat,\nGujarat – 394510',
    category: 'contact',
    description: 'Postal address; newlines are rendered as line breaks.',
  },
  { key: 'contact.workingHours', value: 'Monday - Saturday, 10:00 AM – 7:00 PM', category: 'contact', description: 'Working hours shown on the contact page.' },

  // Social
  { key: 'social.instagram', value: 'https://www.instagram.com/paavansetu.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', category: 'social', description: 'Instagram profile URL.' },
  { key: 'social.facebook', value: 'https://www.facebook.com/share/18NLzSmM16/', category: 'social', description: 'Facebook page URL.' },
  { key: 'social.youtube', value: '', category: 'social', description: 'YouTube channel URL.' },

  // Hero — Home.jsx splits the headline across two lines
  { key: 'hero.title.line1', value: 'Building Character Through', category: 'hero', description: 'Hero headline, first line (white).' },
  { key: 'hero.title.line2', value: 'Education', category: 'hero', description: 'Hero headline, gradient-highlighted word.' },
  { key: 'hero.description', value: 'Nurturing minds and building character across generations. We combine academic excellence with value-based learning to create well-rounded individuals ready for a meaningful future.', category: 'hero', description: 'Hero paragraph.' },
  { key: 'hero.ctaPrimary', value: 'Explore Programs', category: 'hero', description: 'Primary hero button label.' },
  { key: 'hero.ctaPrimaryLink', value: '/schools-workshops', category: 'hero', description: 'Primary hero button target path.' },
  { key: 'hero.ctaSecondary', value: 'Contact via WhatsApp', category: 'hero', description: 'Secondary hero button label.' },

  // Homepage
  { key: 'services.description', value: 'Comprehensive solutions designed to help students discover their true potential and build a strong foundation for the future.', category: 'homepage', description: 'Intro under the "What We Do" heading.' },
  {
    key: 'services.items',
    type: 'json',
    category: 'homepage',
    description: 'Service cards in the homepage bento grid.',
    value: [
      { title: 'Career Counselling', desc: 'Personalised one-on-one sessions using psychometric tools.', link: '/career-counselling', colSpan: 'md:col-span-6 md:row-span-2', bg: 'bg-brand-green-light', tone: 'green' },
      { title: 'Value Books', desc: 'Thoughtfully authored books bridging academics with life values.', link: '/books', colSpan: 'md:col-span-3', bg: 'bg-brand-blue-light', tone: 'blue' },
      { title: 'Schools & Workshops', desc: 'Interactive workshops instilling discipline and empathy.', link: '/schools-workshops', colSpan: 'md:col-span-3', bg: 'bg-brand-amber-light', tone: 'amber' },
      { title: 'DMIT Assessment', desc: "Understand a student's innate strengths.", link: '/about', colSpan: 'md:col-span-6', bg: 'bg-brand-green-light', tone: 'green' },
    ],
  },
  { key: 'homepage.whyTitle', value: 'Why Choose Paavan Setu for your future?', category: 'homepage', description: '"Why us" section heading.' },
  { key: 'homepage.whyDescription', value: 'At Paavan Setu, we believe that true education goes beyond textbooks. We combine academic excellence with value-based learning to create well-rounded individuals ready to make a positive impact on society.', category: 'homepage', description: '"Why us" section body.' },
  {
    key: 'homepage.achievements',
    type: 'json',
    category: 'homepage',
    description: 'Animated counters. Format: "<number><suffix> <label>".',
    value: ['2000+ Students Guided', '20+ Partner Schools', '10 Published Books', '98% Satisfaction Rate'],
  },
  {
    key: 'homepage.testimonials',
    type: 'json',
    category: 'homepage',
    description: 'Testimonial marquee entries.',
    value: [
      { name: 'Riya Sharma', role: 'Student', text: 'The counselling session changed my perspective completely.' },
      { name: 'Anil Mehta', role: 'Parent', text: 'Paavan SETU helped my son discover his passion for design.' },
      { name: 'Priya Patel', role: 'Teacher', text: 'The school workshop was engaging, practical and truly impactful.' },
      { name: 'Raj Kumar', role: 'Student', text: 'Amazing psychometric tools.' },
      { name: 'Sneha Gupta', role: 'Parent', text: 'Highly recommend their value education books.' },
    ],
  },
  { key: 'cta.title', value: 'Ready to Begin?', category: 'homepage', description: 'Closing CTA heading on the homepage.' },
  { key: 'cta.description', value: 'Book a personalised career counselling session today and take the first step towards a meaningful, confident future.', category: 'homepage', description: 'Closing CTA body copy.' },
  { key: 'cta.button', value: 'Book a Session', category: 'homepage', description: 'Closing CTA button label.' },

  // Footer
  { key: 'footer.about', value: 'Paavan Setu creates value-based books and programmes that bridge timeless wisdom with modern education.', category: 'footer', description: 'Short about blurb in the footer.' },
  { key: 'footer.copyright', value: `© ${new Date().getFullYear()} Paavan Setu. All rights reserved.`, category: 'footer', description: 'Footer copyright line.' },
];

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Add it to backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅ Connected to ${mongoose.connection.name}`);

  if (FRESH) {
    await Promise.all([
      Book.deleteMany({}), Category.deleteMany({}),
      Author.deleteMany({}), SiteSettings.deleteMany({}),
    ]);
    console.log('🧹 Cleared books, categories, authors and settings');
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryByName = {};
  for (const data of CATEGORIES) {
    let doc = await Category.findOne({ name: data.name });
    if (doc) Object.assign(doc, data);
    else doc = new Category(data);
    await doc.save();
    categoryByName[doc.name] = doc;
  }
  console.log(`📂 Categories: ${Object.keys(categoryByName).length}`);

  // ── Authors ─────────────────────────────────────────────────────────────────
  const authorByName = {};
  for (const data of AUTHORS) {
    let doc = await Author.findOne({ name: data.name });
    if (doc) Object.assign(doc, data);
    else doc = new Author(data);
    await doc.save();
    authorByName[doc.name] = doc;
  }
  console.log(`✍️  Authors: ${Object.keys(authorByName).length}`);

  // ── Books ───────────────────────────────────────────────────────────────────
  const author = authorByName['Shweta Kothari'];
  let created = 0;
  let updated = 0;

  for (const { categoryName, ...data } of BOOKS) {
    const category = categoryByName[categoryName];
    const payload = {
      ...data,
      categoryName,
      category: category?._id,
      author: author?._id,
      authorName: author?.name,
      isPublished: true,
      currency: 'INR',
    };

    let doc = await Book.findOne({ title: data.title });
    if (doc) {
      Object.assign(doc, payload);
      updated++;
    } else {
      doc = new Book(payload);
      created++;
    }
    await doc.save();
  }
  console.log(`📚 Books: ${created} created, ${updated} updated`);

  // ── Site settings ───────────────────────────────────────────────────────────
  for (const s of SETTINGS) {
    await SiteSettings.findOneAndUpdate(
      { key: s.key },
      { ...s, type: s.type || 'text' },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log(`⚙️  Settings: ${SETTINGS.length}`);

  await mongoose.disconnect();
  console.log('✨ Seed complete');
}

run().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
