const fs = require('fs');

const text = fs.readFileSync('scratch/questions.txt', 'utf8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');

const questions = [];
let currentQuestion = null;

const isQuestionStart = (line) => {
    return /^\d+\./.test(line) || (/^\d+$/.test(line) && parseInt(line) >= 55);
};

let mode = 'search'; // search for Q, parsing Q text, parsing options

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Ignore headers/footers
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
        
        let qText = line;
        let qNum = null;
        
        if (/^\d+\./.test(line)) {
            const match = line.match(/^(\d+)\.(.*)/);
            qNum = parseInt(match[1]);
            qText = match[2].trim();
        } else {
            qNum = parseInt(line);
            qText = "";
        }
        
        currentQuestion = {
            num: qNum,
            text: qText,
            options: []
        };
        mode = 'parsing_text';
    } else {
        if (!currentQuestion) continue;
        
        if (mode === 'parsing_text') {
            // Check if this line looks like an option instead of more question text.
            // For first 36 questions, options are: "I want to be...", "I can try...", "I can never..."
            // For 37-54, options are just single lines (3 options)
            // For 55-63, options are 3 lines
            // For 64-72, options are 3 lines
            
            // To simplify, let's assume if it's the last 3 lines before the next question, they are options.
            // But we don't know the next question yet.
            // Let's just accumulate everything in an array.
            currentQuestion.lines = currentQuestion.lines || [];
            currentQuestion.lines.push(line);
        }
    }
}
if (currentQuestion) {
    questions.push(currentQuestion);
}

// Now parse the lines array into text and options
for (let q of questions) {
    if (!q.lines) q.lines = [];
    
    // The last 3 lines are usually options.
    // Except for maybe true/false? Most seem to have 3 options.
    // Let's check how many lines there are.
    let optionCount = 3;
    
    let textLines = q.lines.slice(0, q.lines.length - optionCount);
    let optionLines = q.lines.slice(q.lines.length - optionCount);
    
    if (q.text) {
        q.text = q.text + " " + textLines.join(" ");
    } else {
        q.text = textLines.join(" ");
    }
    q.options = optionLines.map(o => o.trim());
    delete q.lines;
    
    q.text = q.text.trim();
}

console.log(JSON.stringify(questions.slice(0, 5), null, 2));
console.log(JSON.stringify(questions.slice(54, 60), null, 2));
console.log(JSON.stringify(questions.slice(questions.length - 2), null, 2));

console.log(`Total parsed questions: ${questions.length}`);
