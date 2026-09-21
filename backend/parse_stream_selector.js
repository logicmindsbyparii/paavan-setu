const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Test = require('./models/Test');

const data = JSON.parse(fs.readFileSync('../stream_selector_data.json', 'utf-8'));

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const existing = await Test.findOne({ slug: 'stream-selector-test' });
  if (existing) {
    await Test.deleteOne({ slug: 'stream-selector-test' });
    console.log('Deleted existing test');
  }

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i - 1);
  const test = new Test({
    name: 'Stream Selector Test',
    slug: 'stream-selector-test',
    description: 'Find out which stream (Science Medical, Science Non-Medical, Commerce, Arts & Humanities) suits you best after 10th grade. 76 questions across interests, work situations and aptitude.',
    instructions: 'Answer all 76 questions based on your true feelings. Sections 1-3 have no right answers; aptitude sections do, and explanations are shown in your report.',
    categories: data.categories,
    scoringMode: 'profile',
    questions: data.questions,
    sections: [
      { title: 'Like / Dislike', description: 'Choose Yes, No, or Not Sure based on your true feelings.', questionIndices: range(1, 14) },
      { title: 'Work Situations I', description: 'Would you choose this work to make a living?', questionIndices: range(15, 25) },
      { title: 'Work Situations II', description: 'Would you choose this work to make a living?', questionIndices: range(26, 36) },
      { title: 'Identical Codes', description: 'Find the two identical codes in the table image.', questionIndices: range(37, 46) },
      { title: 'Number Game', description: 'Read the question (and table/diagram image) carefully.', questionIndices: range(47, 56) },
      { title: 'Careful Reading', description: 'Read the passage carefully and answer True / False / Cannot tell.', questionIndices: range(57, 66) },
      { title: 'Words Game', description: 'Choose the option you think is correct.', questionIndices: range(67, 71) },
      { title: 'Incomplete Sequence', description: 'Observe the diagram and pick the image that completes the sequence.', questionIndices: range(72, 76) },
    ],
    isActive: true,
  });

  await test.save();
  console.log(`Seeded Stream Selector Test with ${data.questions.length} questions.`);
  process.exit(0);
}

seed();
