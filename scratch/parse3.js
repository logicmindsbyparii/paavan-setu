const fs = require('fs');

const text = fs.readFileSync('scratch/questions.txt', 'utf8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '' && l !== '​');

const questions = [];
let currentQuestion = null;

const isQuestionStart = (line) => {
    return /^(\d+)\.(.*)/.test(line) || (/^(\d+)$/.test(line) && parseInt(line) >= 55 && parseInt(line) <= 72);
};

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
    let optionCount = 3; // most have 3 options
    if (q.num >= 55 && q.num <= 63) {
        // these have 3 options, except they might have charts.
        optionCount = 3;
    }
    
    // Check if 59 is weird
    if (q.num === 59) {
        // Let's manually fix 59 and 60 if needed, but the simple approach:
        // just take the last 3 lines as options
    }
    
    let textLines = q.lines.slice(0, q.lines.length - optionCount);
    let optionLines = q.lines.slice(q.lines.length - optionCount);
    
    if (q.text) {
        q.text = q.text + " " + textLines.join(" ");
    } else {
        q.text = textLines.join(" ");
    }
    
    // special cleanup for Q59
    if (q.num === 59) {
        q.text = "You are an Investment Banker. You have compared Bank A and B in terms of their rate of interest offered. Answer the two questions asked by Management. In the first year what was the common rate of interest offered by both the Banks and by what percentage is the Rate of interest of Bank A higher than Bank B in the fifth year?";
        q.options = ["8.5,5", "8,5", "8,0.5"];
    } else {
        q.options = optionLines.map(o => o.trim());
    }
    
    delete q.lines;
    q.text = q.text.trim();
    
    // Map the 8 images to questions
    // Images are img-000 to img-007
    // According to the PDF, there are charts for:
    // 55, 56, 57, 58, 59, 60, 61. That's 7 questions.
    // Let's check which is the 8th image. Maybe 62 or 63. Let's just map 0-7 sequentially starting at 55.
    if (q.num >= 55 && q.num <= 62) {
        q.imageUrl = `/commerce-test/img-00${q.num - 55}.jpg`;
    }
}

fs.writeFileSync('backend/commerce_questions.json', JSON.stringify(questions, null, 2));
console.log(`Parsed: ${questions.length} questions`);
