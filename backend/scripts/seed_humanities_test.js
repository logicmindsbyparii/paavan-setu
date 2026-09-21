const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Test = require('../models/Test');

const data = JSON.parse(fs.readFileSync(__dirname + '/../parsed_humanities.json', 'utf-8'));

const correctAnswers = {
  38: 2, // Q39
  39: 0,
  40: 0,
  41: 0,
  42: 1,
  43: 0,
  44: 1,
  45: 1,
  46: 2,
  47: 1,
  48: 2,
  49: 1,
  50: 0,
  51: 2, // Linguist
  52: 1,
  53: 1,
  54: 0,
  55: 1,
  56: 2,
};

/* Why each keyed answer is right — one or two sentences, written for a Class
   10 student and closed with the career the question probes. Shown in the
   report's review list and the printed PDF. One entry per graded question
   (idx 38–56); the order follows the 19-track grid, so each explanation
   doubles as a one-line career primer. */
const explanations = {
  38: 'Amartya Sen won the 1998 Nobel Memorial Prize in Economic Sciences for his work on welfare economics and social choice theory — the mathematics of how societies make fair decisions. Economists study exactly these questions.',
  39: 'Psychologists are trained to listen without judging, understand behaviour and guide people through stress — motivation with method, not just friendly advice.',
  40: 'A news reader presents events written by others on air. The curiosity to gather them belongs to reporters; the craft of presenting belongs to broadcast journalism.',
  41: 'Ad makers turn a product’s message into a 30-second story for TV or radio — part creativity, part understanding what makes people pay attention.',
  42: 'A hair stylist studies face shape, hair type and trends to suggest the cut that suits a client. Dressers and designers handle related but different parts of the craft.',
  43: 'A secretary keeps records, inventories and files accurate and findable — the librarian’s discipline applied to an office, and the backbone of its paperwork.',
  44: 'Managers own a team’s output and the company’s targets: they plan, delegate and answer for results. Team leaders run smaller units inside that structure.',
  45: 'The executive — the government machinery of ministries and administrators — implements and monitors laws. Legislature makes laws; judiciary interprets them.',
  46: 'The District Collector (or District Magistrate) heads a district’s administration: law and order, public facilities and citizen welfare — the classic civil-services role.',
  47: 'Taekwondo is the Korean martial art famous for fast, high kicks and Olympic competition. Judo is Japanese and grappling-based; cricket is not a martial art at all.',
  48: 'Caterers cook and serve meals at events and gatherings — hospitality work that travels to the celebration instead of waiting for guests at a restaurant.',
  49: 'A travel desk manager books tickets and hotels and coordinates event logistics — organisation, budgets and timing, the daily work of travel and tourism.',
  50: 'Tutorials are private study centres that coach students after school in smaller groups. Extra classes belong to the school; parlors are unrelated.',
  51: 'A linguist studies languages themselves — structure, pronunciation, meaning — and often translates between them. Teaching one language is a narrower slice of this world.',
  52: 'Animators create the moving characters and worlds you see in films, ads and tutorials — drawing or modelling, then bringing them to life frame by frame.',
  53: 'Interior designers plan how a home feels and functions: colours, furniture placement, light. Architects handle the structure itself; homemakers live in it, not design it.',
  54: 'Monuments is the common name for structures built to commemorate rulers — forts, tombs, pillars. Historians and archaeologists read these as records of the past.',
  55: 'Fauna is the scientific term for all animal life of a region; its plant counterpart is flora. Geography borrows these terms to describe places precisely.',
  56: 'Political analysts study how a country’s public, economy and policies behave — and explain them on screen and in print. The job is analysis, not politics itself.',
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paawansetu');
  
  const existing = await Test.findOne({ slug: 'humanities-career-test' });
  if (existing) {
    await Test.deleteOne({ slug: 'humanities-career-test' });
    console.log('Deleted existing humanities test');
  }

  const categoryName = 'Humanities';

  const questions = data.questions.map((q, idx) => {
    const isKnowledge = idx >= 38 && idx <= 56;
    
    return {
      question: q.q,
      options: q.options.map((optText, optIdx) => {
        let points = 0;
        
        if (isKnowledge) {
          if (correctAnswers[idx] === optIdx) {
            points = 3;
          }
        } else {
          if (optIdx === 0) points = 3;
          else if (optIdx === 1) points = 1;
          else points = 0;
        }

        return {
          text: optText,
          points: { [categoryName]: points },
        };
      }),
      correctOptionIndex: isKnowledge ? correctAnswers[idx] : null,
      explanation: explanations[idx] || '',
      difficulty: 'intermediate',
      tags: ['humanities']
    };
  });

  const test = new Test({
    name: 'Humanities Career Test',
    slug: 'humanities-career-test',
    description: 'Find out which humanities career suits you best based on your interests, presence of mind, work situations, and personality.',
    instructions: 'Read each question carefully and select the most appropriate option.',
    categories: [categoryName],
    scoringMode: 'profile',
    questions: questions,
    sections: data.sections.map((sec) => {
      const indices = [];
      for (let j = sec.startIdx; j <= sec.endIdx; j++) {
        indices.push(j);
      }
      return {
        title: sec.title,
        description: sec.description,
        questionIndices: indices
      };
    }),
    isActive: true,
  });

  await test.save();
  console.log(`Seeded Humanities Career Test with ${questions.length} questions.`);
  process.exit(0);
}

seed();
