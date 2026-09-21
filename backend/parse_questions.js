const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Test = require('./models/Test');

const text = fs.readFileSync('/home/av/.gemini/antigravity-ide/brain/0adf47b5-5846-4be8-b97b-8a10847d8a3e/scratch/commerce_questions.txt', 'utf-8');

const categories = [
  "Financial Planner", "Languages", "Computer Related Designing", "Industrial Designing",
  "Journalism", "Communication and Media", "Social Sciences", "Hospitality and Tourism", "Hotel",
  "Management", "Trading", "Financial Planner", "Financial Management", "Financial Banking and Investment",
  "Trading", "Accounts/Taxation", "Law", "Analytics",
  "Teaching and Education", "Languages", "Computer Related Designing", "Industrial Designing",
  "Journalism", "Communication and Media", "Social Sciences", "Hospitality and Tourism", "Hotel",
  "Management", "Trading", "Financial Banking and Investment", "Financial Management", "Financial Planner",
  "Financial Auditing and Investigation", "Accounts/Taxation", "Law", "Analytics",
  "Teaching and Education", "Languages", "Computer Related Designing", "Industrial Designing",
  "Journalism", "Communication and Media", "Social Sciences", "Hospitality and Tourism", "Hotel",
  "Management", "Trading", "Financial Planner", "Financial Banking and Investment", "Financial Management",
  "Financial Auditing and Investigation", "Accounts/Taxation", "Law", "Analytics",
  "Accounts/Taxation", "Trading", "Financial Planner", "Management", "Financial Banking and Investment",
  "Financial Auditing and Investigation", "Accounts/Taxation", "Law", "Analytics", "Teaching and Education",
  "Languages", "Computer Related Designing", "Industrial Designing", "Journalism", "Communication and Media",
  "Social Sciences", "Hospitality and Tourism", "Hotel"
]; 

async function seed() {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const questions = [];
  
  let currentQ = '';
  let options = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+)\.(.*)/);
    
    if (match) {
      if (currentQ) {
         let opts = [];
         const qNum = questions.length + 1;
         const cat = categories[qNum - 1] || "Management";
         if (qNum <= 18) {
           opts = [
             { text: "I want to be like that", points: { [cat]: 2 } },
             { text: "I can try to be like that", points: { [cat]: 1 } },
             { text: "I can never be like that", points: { [cat]: 0 } }
           ];
         } else if (qNum <= 36) {
           opts = [
             { text: "Very comfortable", points: { [cat]: 2 } },
             { text: "May not be comfortable", points: { [cat]: 1 } },
             { text: "Not comfortable at all", points: { [cat]: 0 } }
           ];
         } else {
           if (i + 1 < lines.length && !lines[i+1].match(/^\d+\./)) {
             const optsText = lines[i+1].split('|').map(o => o.trim());
             if (optsText.length >= 2) {
               opts = optsText.map((o, idx) => ({ text: o, points: idx === 0 ? { [cat]: 1 } : {} }));
               i++;
             }
           }
           if (opts.length === 0) {
             opts = [
               { text: "Yes", points: { [cat]: 1 } },
               { text: "No", points: { [cat]: 0 } }
             ];
           }
         }
         questions.push({ question: currentQ, options: opts });
      }
      currentQ = line;
    } else {
      if (currentQ && !line.match(/Part/i) && !line.match(/Scenarios/i) && !line.match(/Knowledge/i) && !line.match(/Explore/i) && !line.match(/Answer the/i) && !line.match(/Imagine/i)) {
         if (!currentQ.match(/^\d+\./)) continue;
      }
    }
  }
  
  if (currentQ) {
      const qNum = questions.length + 1;
      const cat = categories[qNum - 1] || "Management";
      const opts = [
        { text: "Yes", points: { [cat]: 1 } },
        { text: "No", points: { [cat]: 0 } }
      ];
      questions.push({ question: currentQ, options: opts });
  }

  const uniqueCats = [...new Set(categories)];

  mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const existing = await Test.findOne({ slug: 'commerce-career-selector' });
    if (existing) {
      await Test.deleteOne({ slug: 'commerce-career-selector' });
      console.log('Deleted existing test');
    }
    const test = new Test({
      name: 'Commerce Career Selector',
      slug: 'commerce-career-selector',
      description: 'Find out which commerce career suits you best.',
      instructions: 'Answer all 72 questions to get your personalized career report.',
      categories: uniqueCats,
      scoringMode: 'profile',
      questions: questions,
      isActive: true,
    });
    await test.save();
    console.log(`Seeded ${questions.length} questions.`);
    process.exit(0);
  });
}
seed();
