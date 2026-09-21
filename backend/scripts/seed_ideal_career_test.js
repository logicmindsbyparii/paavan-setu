const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

// Models
const Test = require('../models/Test');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const text = fs.readFileSync('/home/av/.gemini/antigravity-ide/brain/14fa06dd-5700-436d-b35e-ce80a81de8d9/scratch/ideal_career_ocr.txt', 'utf8');

  const questions = [];
  let currentSection = 'General';
  let qNum = 1;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  let i = 0;
  
  // Mapping helpers for heuristics
  const getPointsForYesNo = (qText) => {
    const text = qText.toLowerCase();
    const p = {};
    if (text.includes('party') || text.includes('people') || text.includes('friends') || text.includes('talkative')) p['Extroversion'] = 1;
    if (text.includes('criticize') || text.includes('moody') || text.includes('annoyed')) p['Emotional'] = 1;
    if (text.includes('plan') || text.includes('schedule') || text.includes('routine')) p['Conscientiousness'] = 1;
    if (text.includes('math') || text.includes('science') || text.includes('numbers')) p['STEM'] = 1;
    if (text.includes('art') || text.includes('poems') || text.includes('painting') || text.includes('color')) p['Arts'] = 1;
    if (text.includes('team') || text.includes('responsibilities') || text.includes('leader')) p['Leadership'] = 1;
    if (text.includes('nature') || text.includes('outdoors') || text.includes('environment')) p['Environment'] = 1;
    if (text.includes('computer') || text.includes('technology') || text.includes('video game')) p['Technology'] = 1;
    if (text.includes('sick') || text.includes('patient') || text.includes('volunteering')) p['Service'] = 1;
    if (text.includes('politics') || text.includes('government') || text.includes('public service')) p['PublicService'] = 1;
    if (text.includes('money') || text.includes('financial')) p['Finance'] = 1;
    if (Object.keys(p).length === 0) p['General'] = 1;
    return p;
  };

  const getPointsForWorkValues = (qText) => {
    const p = {};
    if (qText.includes('MONEY')) p['Money'] = 1;
    if (qText.includes('RESPECT')) p['Respect'] = 1;
    if (qText.includes('FREEDOM')) p['Freedom'] = 1;
    if (qText.includes('STABILITY')) p['Stability'] = 1;
    if (qText.includes('VARIETY')) p['Variety'] = 1;
    if (qText.includes('LEISURE')) p['Leisure'] = 1;
    if (qText.includes('LEADERSHIP')) p['Leadership'] = 1;
    if (qText.includes('SERVICE')) p['Service'] = 1;
    if (qText.includes('INTEREST')) p['Interest'] = 1;
    if (qText.includes('CHALLENGE')) p['Challenge'] = 1;
    if (Object.keys(p).length === 0) p['General'] = 1;
    return p;
  };

  while (i < lines.length) {
    let line = lines[i];

    if (line.match(/^\d+\.$/)) {
      let qNumParsed = parseInt(line);
      i++;
      let questionText = "";
      while (i < lines.length && !lines[i].match(/^(Yes No|Never|May Be|Yes, Will love to|DE|DC|DB|DA|BA|BC|BD|BE|CB|CE|CD|CA|AE|AB|AC|AD|Sleep|Goat|Lamb|Flock|Forest|Shore|Hedge|Road|Night|Midnight|Dark|Afternoon|Scales|Feathers|Tail|Fins|Fur|Hair|Shoe|Hoof|Large|Larger|Largest|Super Largest|Location|no|in|position|Permisible|Permissible|Permissable|Permisable|Easiley|Easely|Easaly|Easily|132|144|120|143|37\.6|3\.76|376|10|9060|906|906000|90600|24|2400|0\.024|2\.4|1840|18400|9200|184|30|3|4|40|600|900|700|800|0\.09|11\.11|1\.11|0\.9|13|-13|-33|-10|National Youth Day|Ramakrishna Math|Hinduism|Indian Philosophy|Promote Hinduism|Attend Parliament of Religion|Conduct Lectures|None of the above|18th century|19th century|20th century|Vishwanath Datta|Narendra’s Mother|Narendra’s Father|New Delhi|Bengal|Bombay|Calcutta|Sarita|Seema|Ritu|None|Rakhi|Neetu|Ankita|Priyanka|Priyanka & Neha|Priyanka & Neetu|Neetu & Neha|Rohit|Rahul|Raunak|None Of the Above|Less important|Important|Very important|A: |A|B|C|D)$/)) {
        if (!lines[i].includes('Choose an option which would complete the sequence') && !lines[i].includes('Which comes next')) {
           questionText += lines[i] + " ";
        }
        i++;
      }
      questionText = questionText.trim();
      if (!questionText && (qNumParsed >= 53 && qNumParsed <= 61)) {
         questionText = "Choose an option which would complete the sequence";
      }

      let options = [];
      let isAptitude = false;
      let correctOptionIndex = null;
      let imageUrl = '';

      if (qNumParsed >= 53 && qNumParsed <= 61) {
         isAptitude = true;
         correctOptionIndex = 0;
         imageUrl = `/images/ideal-test/q${qNumParsed}.jpeg`;
         options = [
           { text: 'A', imageUrl: `/images/ideal-test/q${qNumParsed}_optA.jpeg` }, 
           { text: 'B', imageUrl: `/images/ideal-test/q${qNumParsed}_optB.jpeg` }, 
           { text: 'C', imageUrl: `/images/ideal-test/q${qNumParsed}_optC.jpeg` }, 
           { text: 'D', imageUrl: `/images/ideal-test/q${qNumParsed}_optD.jpeg` }
         ];
         while (i < lines.length && ['A','B','C','D'].includes(lines[i])) { i++; }
      } else if (qNumParsed >= 62 && qNumParsed <= 70) {
         isAptitude = true;
         imageUrl = `/images/ideal-test/q${qNumParsed}.jpeg`;
         // Handle "A: ... B: ... C: ..." line
         if (lines[i] && lines[i].startsWith("A:")) {
             questionText += "\\n\\n" + lines[i];
             i++;
         }
         while (i < lines.length && lines[i].match(/^(DE|DC|DB|DA|BA|BC|BD|BE|CB|CE|CD|CA|AE|AB|AC|AD)$/)) {
            options.push({ text: lines[i] });
            i++;
         }
         correctOptionIndex = 0;
      } else if (qNumParsed >= 71 && qNumParsed <= 97) {
         isAptitude = true;
         while (i < lines.length && !lines[i].match(/^\d+\.$/) && !lines[i].match(/Congratulations!|Awesome!|Well done!|Trust your instincts!/)) {
            if (lines[i].trim() !== '') {
               options.push({ text: lines[i] });
            }
            i++;
         }
         correctOptionIndex = 0; 
      } else if (qNumParsed >= 98 && qNumParsed <= 107) {
         options = [
           { text: 'Less important', points: {} },
           { text: 'Important', points: {} },
           { text: 'Very important', points: getPointsForWorkValues(questionText) }
         ];
         while (i < lines.length && ['Less important','Important','Very important'].includes(lines[i])) { i++; }
      } else if (qNumParsed >= 29 && qNumParsed <= 52) {
         options = [
           { text: 'Never', points: {} },
           { text: 'May Be', points: {} },
           { text: 'Yes, Will love to', points: getPointsForYesNo(questionText) }
         ];
         while (i < lines.length && ['Never','May Be','Yes, Will love to'].includes(lines[i])) { i++; }
      } else {
         let pts = getPointsForYesNo(questionText);
         options = [
           { text: 'Yes', points: pts },
           { text: 'No', points: {} }
         ];
         if (lines[i] === 'Yes No') { i++; }
      }

      let finalScenario = null;
      if (qNumParsed >= 1 && qNumParsed <= 14) {
          finalScenario = "Awesome! Answer the questions below.";
      } else if (qNumParsed >= 15 && qNumParsed <= 28) {
          finalScenario = "Wow! Going great. Your third set of questions.";
      } else if (qNumParsed >= 29 && qNumParsed <= 52) {
          finalScenario = "Congratulations! You've completed the first two milestones. Welcome to Section 2 (Work Situations). Let your first reaction be your answer. Go ahead!";
      } else if (qNumParsed >= 53 && qNumParsed <= 61) {
          finalScenario = "Congratulations! Observe the patterns carefully and find the shape which completes the sequence.";
      } else if (qNumParsed >= 62 && qNumParsed <= 70) {
          finalScenario = "Trust your instincts! It feels great to see you answer so quickly. Look at the series below and hit the right answer.";
      } else if (qNumParsed >= 71 && qNumParsed <= 79) {
          finalScenario = "Awesome! You have cleared your first two milestones successfully. Now read the sentences carefully and answer:";
      } else if (qNumParsed >= 80 && qNumParsed <= 88) {
          finalScenario = "Observe the patterns carefully and find the shape which completes the sequence. (Quantitative Section)"; // Kept similar to OCR but with clarification if OCR was slightly off
      } else if (qNumParsed >= 89 && qNumParsed <= 93) {
          finalScenario = "Read the passage carefully and answer accordingly:\n\nSwami Vivekananda was born as Narendra Nath Datta in 1863 in Calcutta, the capital of British India. He was a key figure in the introduction of Indian philosophies of Vedanta and Yoga to the western world. Narendra's father Vishwanath Datta was an attorney of Calcutta High Court. Narendra's mother was a pious woman and a housewife. He was a major force in the revival of Hinduism in India and contributed to the notion of nationalism in colonial India. He was the chief disciple of the 19th century saint Ramakrishna and the founder of the Ramakrishna Math and the Ramakrishna Mission.\n\nVivekananda toured the Indian subcontinent extensively and acquired first-hand knowledge of the conditions that prevailed in British India. He later travelled to the United States to represent India as a delegate in the 1893 Parliament of World Religions. He conducted hundreds of public and private lectures and classes, disseminating tenets of Hindu philosophy in the United States, England and Europe. In India, Vivekananda is regarded as a patriotic saint and his birthday is celebrated as the National Youth Day.";
      } else if (qNumParsed >= 94 && qNumParsed <= 97) {
          finalScenario = "Carefully read the questions given below and choose the appropriate option.";
      } else if (qNumParsed >= 108 && qNumParsed <= 123) {
          finalScenario = "Almost there! You will know the right answer as ...";
      } else if (qNumParsed >= 124 && qNumParsed <= 138) {
          finalScenario = "Keep up the good work! You will know the right answer as ...";
      } else if (qNumParsed >= 139 && qNumParsed <= 153) {
          finalScenario = "You are answering very...";
      } else if (qNumParsed >= 154 && qNumParsed <= 168) {
          finalScenario = "And, it's over! Your Psychometric Assessment Report is almost ready...";
      }

      questions.push({
         question: questionText || `Question ${qNumParsed}`,
         options: options.length ? options : [{text: 'A'}, {text: 'B'}],
         imageUrl,
         scenario: finalScenario,
         correctOptionIndex: isAptitude ? 0 : null
      });

    } else {
      i++;
    }
  }

  // Remove existing test if any
  await Test.deleteOne({ slug: 'ideal-career-test' });

  // Compile unique categories
  const categorySet = new Set(['Aptitude']);
  questions.forEach(q => {
     q.options.forEach(opt => {
        if (opt.points) {
           Object.keys(opt.points).forEach(k => categorySet.add(k));
        }
     });
     if (q.correctOptionIndex !== null) {
         q.options[0].points = { 'Aptitude': 1 }; // Give placeholder points for scoring Mode 'profile'
     }
  });

  const testData = {
    slug: 'ideal-career-test',
    name: 'Ideal Career Test',
    description: 'A comprehensive psychometric and aptitude test designed to help you discover your ideal career path based on your personality, values, interests, and abilities.',
    instructions: 'Answer the questions honestly based on your first instinct. For the aptitude sections, select the most logical answer.',
    categories: Array.from(categorySet),
    questions: questions,
    difficulty: 'mixed',
    scoringMode: 'profile',
    isActive: true,
  };

  await Test.create(testData);
  console.log(`Successfully seeded Ideal Career Test with ${questions.length} questions! Categories: ${Array.from(categorySet).join(', ')}`);
  mongoose.disconnect();
}

seedTest().catch(console.error);
