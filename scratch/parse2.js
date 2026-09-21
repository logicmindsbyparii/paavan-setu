const fs = require('fs');
const text = fs.readFileSync('scratch/questions.txt', 'utf8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '' && l !== '​');

const questions = [];
let currentQuestion = null;

const isQuestionStart = (line) => {
    return /^(\d+)\.(.*)/.test(line) || (/^(\d+)$/.test(line) && parseInt(line) >= 55 && parseInt(line) <= 72);
};

let mode = 'search';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('Discover your Ideal Commerce Career') || 
        line.startsWith('Self Comparisons') ||
        line.startsWith('Compare yourself with the') ||
        line.startsWith('Work Situations') ||
        line.startsWith('Imagine yourself in the given') ||
        line.startsWith('Applied Knowledge') ||
        line.startsWith('Answer the following questions') ||
        line.startsWith('Logical Scenarios') ||
        line.startsWith('Analyze the given scenarios') ||
        line.startsWith('Situational Exploration') ||
        line.startsWith('Select the action that best') ||
        line.charCodeAt(0) === 12) {
        continue;
    }

    if (isQuestionStart(line)) {
        if (currentQuestion) {
            questions.push(currentQuestion);
        }
        
        let qNum, qText;
        if (/^(\d+)\.(.*)/.test(line)) {
            const match = line.match(/^(\d+)\.(.*)/);
            qNum = parseInt(match[1]);
            qText = match[2].trim();
        } else {
            qNum = parseInt(line);
            qText = "";
        }
        
        currentQuestion = { num: qNum, text: qText, lines: [] };
    } else {
        if (currentQuestion) {
            currentQuestion.lines.push(line);
        }
    }
}
if (currentQuestion) {
    questions.push(currentQuestion);
}

for (let q of questions) {
    let optionCount = 3;
    let textLines = q.lines.slice(0, q.lines.length - optionCount);
    let optionLines = q.lines.slice(q.lines.length - optionCount);
    
    if (q.text) {
        q.text = q.text + " " + textLines.join(" ");
    } else {
        q.text = textLines.join(" ");
    }
    q.options = optionLines.map(o => ({ text: o.trim(), weight: 1 })); // weight can be updated later
    delete q.lines;
    q.text = q.text.trim();
    
    // Assign images for 55 to 61 and 63? Wait, let's see.
    // The user had 8 images. 55, 56, 57, 58, 59, 60, 61.
    // We will find out what the 8th image is.
}

console.log(`Parsed: ${questions.length} questions`);
fs.writeFileSync('backend/data/commerce_questions.json', JSON.stringify(questions, null, 2));
