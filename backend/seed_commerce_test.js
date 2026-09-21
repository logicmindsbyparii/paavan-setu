const mongoose = require('mongoose');
require('dotenv').config();

const Test = require('./models/Test');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

const categories = [
  "Accounts/Taxation", "Analytics", "Communication and Media", "Computer Related Designing", 
  "Financial Auditing and Investigation", "Financial Banking and Investment", "Financial Management", 
  "Financial Planner", "Hospitality and Tourism", "Hotel", "Industrial Designing", "Journalism", 
  "Languages", "Law", "Management", "Social Sciences", "Teaching and Education", "Trading"
];

const fs = require('fs');

async function seed() {
  const existing = await Test.findOne({ slug: 'commerce-career-selector' });
  if (existing) {
    await Test.deleteOne({ slug: 'commerce-career-selector' });
    console.log('Deleted existing test');
  }

  // Load questions from commerce_questions.json
  const questionsData = JSON.parse(fs.readFileSync(__dirname + '/commerce_questions.json', 'utf8'));

  const questions = questionsData.map((q, idx) => {
    const cat = categories[idx % 18];
    return {
      question: q.text,
      options: q.options.map((optText, optIdx) => {
        // Scoring logic:
        // Most questions have 3 options.
        // First option gets 3 points, second gets 1, third gets 0 (as per the original dummy logic)
        // If there are more options, scale appropriately, but they are all 3 options.
        let points = 0;
        if (optIdx === 0) points = 3;
        else if (optIdx === 1) points = 1;
        else points = 0;
        
        return {
          text: optText,
          points: { [cat]: points }
        };
      }),
      imageUrl: q.imageUrl || undefined
    };
  });

  const test = new Test({
    name: 'Commerce Career Selector',
    slug: 'commerce-career-selector',
    description: 'Find out which commerce career suits you best.',
    instructions: 'Answer all 72 questions to get your personalized career report.',
    categories: categories,
    scoringMode: 'profile',
    questions: questions,
    isActive: true,
  });

  await test.save();
  console.log('Commerce Career Selector seeded successfully!');
  process.exit(0);
}

seed();
