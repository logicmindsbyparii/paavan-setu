const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paawansetu');
const Test = require('./models/Test');
async function run() {
  const tests = await Test.find({}, 'name slug scoringMode');
  console.log(tests);
  process.exit();
}
run();
