const mongoose = require('mongoose');
const Test = require('./models/Test');

mongoose.connect('mongodb://127.0.0.1:27017/logicmind')
  .then(async () => {
    const test = await Test.findOne({ slug: 'engineering-branch-selector' });
    if (test) {
      console.log("TEST FOUND:", test.name);
      console.log("QUESTIONS:", test.questions.length);
    } else {
      console.log('Test not found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
