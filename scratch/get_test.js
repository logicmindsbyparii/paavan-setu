const mongoose = require('mongoose');
const Test = require('./backend/models/Test');

mongoose.connect('mongodb://127.0.0.1:27017/logicmind')
  .then(async () => {
    const test = await Test.findOne({ slug: 'engineering-branch-selector' });
    if (test) {
      console.log(JSON.stringify(test, null, 2));
    } else {
      console.log('Test not found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
