const fs = require('fs');
let questions = JSON.parse(fs.readFileSync('backend/commerce_questions.json', 'utf8'));

// Find the index of the bad question 8
const badIndex = questions.findIndex(q => q.num === 8 && q.text === "5,5 8,5");
if (badIndex !== -1) {
    questions.splice(badIndex, 1);
}

// 59 should have options ["8.5,5", "8,5", "8,0.5"]; Let's set it properly
const q59 = questions.find(q => q.num === 59);
if (q59) {
    q59.options = ["8.5,5", "8,5", "8,0.5"];
}

fs.writeFileSync('backend/commerce_questions.json', JSON.stringify(questions, null, 2));
console.log(`Cleaned up. Total questions: ${questions.length}`);
