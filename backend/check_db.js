const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paawansetu');
const Test = require('./models/Test');
async function run() {
  const test = await Test.findOne({ slug: 'stream-selector-test' });
  console.log(JSON.stringify(test.questions.slice(0,2), null, 2));
  process.exit();
}
run();
