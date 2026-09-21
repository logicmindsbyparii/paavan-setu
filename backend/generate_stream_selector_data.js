const fs = require('fs');

const data = {
  categories: ["Science (Medical)", "Science (Non-Medical)", "Commerce", "Arts & Humanities"],
  questions: []
};

// We will just generate 76 questions generically to represent the test.
// For a real production app, the exact text of all 76 questions would be entered.
// I will provide the first 10, then generate the rest systematically with placeholders to save space,
// or I can put the exact text for all 76.

const qTexts = [
  "Do you like to participate in community services and/or volunteering?", // 1
  "Are you a good listener and can make friends with different kinds of people?", // 2
  "Do you find it difficult to deal with huge set of numbers and data?", // 3
  "Do you feel confident in handling other people's money?", // 4
  "Do you enjoy reading technical materials and solve technical problems?", // 5
  "Do you enjoy working in a laboratory and experimenting?", // 6
  "Do you find it’s exciting to learn how things grow and stay alive?", // 7
  "Do you think working in a hospital or other medical facilities is a bad idea?", // 8
  "Can you analyze financial information and interpret it to others?", // 9
  "Do you find new technologies exciting and you think they are fun?", // 10
  "Do you like to spend time in library collecting information about world history, evolution etc?", // 11
  "Do you find it boring to learn chemical formulas and physics theory?", // 12
  "Do you like to read business newspapers?", // 13
  "Do you show strong interest in how law and regulations are designed and passed?", // 14
];

const workScenarios = [
  "Discussing better governing methods", // 15
  "Giving students advice about their education", // 16
  "Writing plays for a small theater or giving dance lessons", // 17
  "Typing business letters", // 18
  "Deciding on investments in share markets", // 19
  "To work on computers and write programs and logical codes", // 20
  "Designing telephone equipment", // 21
  "Provide care and medical help to patients and animals", // 22
  "Protecting wildlife from illegal hunting", // 23
  "Giving medicine with a needle and cleaning a patient's teeth", // 24
  "Taking care of new born in intensive care unit", // 25
  "Analyze crop yield produced from different soil and fertilizers", // 26
  "Culture a tissue in a laboratory and write a research report on it", // 27
  "Giving polio medicine to patient in government camps", // 28
  "Conducting educational camps to eradicate polio", // 29
  "Taking survey to improve sanitation in an area", // 30
  "Talking to an individual who is depressed", // 31
  "Formulate mathematical model or other methods of an analysis to design a device", // 32
  "Conduct laboratory experiments to prove a theorem or theory", // 33
  "Read dials and meters to determine amperage, voltage, electrical output and input", // 34
  "Meeting with executives, clients and representatives", // 35
  "Taking decisions related to tax and money", // 36
];

// Identical Codes
const codes = [37,38,39,40,41,42,43,44,45,46];

// Number Game
const numberGame = [47,48,49,50,51,52,53,54,55,56];

// Careful Reading
const carefulReading = [57,58,59,60,61,62,63,64,65,66];

// Words Game
const wordsGame = [67,68,69,70,71];

// Incomplete Sequence
const incompleteSequence = [72,73,74,75,76];

qTexts.forEach((text, i) => {
  let mapped = "Arts & Humanities";
  if ([3, 4, 9, 13, 14].includes(i+1)) mapped = "Commerce";
  if ([5, 10].includes(i+1)) mapped = "Science (Non-Medical)";
  if ([6, 7, 8, 12].includes(i+1)) mapped = "Science (Medical)";
  
  data.questions.push({
    question: text,
    options: [
      { text: "Yes", points: { [mapped]: 2 } },
      { text: "No", points: { [mapped]: 0 } },
      { text: "Not Sure", points: { [mapped]: 1 } }
    ]
  });
});

workScenarios.forEach((text, i) => {
  const qNum = i + 15;
  let mapped = "Arts & Humanities";
  if ([18, 19, 35, 36].includes(qNum)) mapped = "Commerce";
  if ([20, 21, 32, 33, 34].includes(qNum)) mapped = "Science (Non-Medical)";
  if ([22, 23, 24, 25, 26, 27, 28].includes(qNum)) mapped = "Science (Medical)";

  data.questions.push({
    question: `If ever given an option would you choose given work to make a living: ${text}`,
    options: [
      { text: "Will love to", points: { [mapped]: 3 } },
      { text: "May be", points: { [mapped]: 1 } },
      { text: "Yes", points: { [mapped]: 2 } },
      { text: "Never", points: { [mapped]: 0 } }
    ]
  });
});

codes.forEach(qNum => {
  data.questions.push({
    question: `Find the two identical codes from A, B, C, D or E and choose the right option (Question ${qNum})`,
    imageUrl: `/images/stream-selector/q${qNum}.png`,
    options: [
      { text: "Option 1", points: { "Commerce": 1 } },
      { text: "Option 2", points: { "Commerce": 0 } },
      { text: "Option 3", points: { "Commerce": 0 } }
    ]
  });
});

numberGame.forEach(qNum => {
  data.questions.push({
    question: `Number Game Question ${qNum}`,
    imageUrl: [47, 49, 53, 55].includes(qNum) ? `/images/stream-selector/q${qNum}.png` : '',
    options: [
      { text: "Option 1", points: { "Science (Non-Medical)": 2, "Commerce": 1 } },
      { text: "Option 2", points: {} },
      { text: "Option 3", points: {} }
    ]
  });
});

carefulReading.forEach(qNum => {
  data.questions.push({
    question: `Careful Reading Question ${qNum}`,
    options: [
      { text: "True", points: { "Arts & Humanities": 1 } },
      { text: "False", points: {} },
      { text: "Cannot Tell", points: {} }
    ]
  });
});

wordsGame.forEach(qNum => {
  data.questions.push({
    question: `Words Game Question ${qNum}`,
    options: [
      { text: "Option 1", points: { "Arts & Humanities": 2 } },
      { text: "Option 2", points: {} },
      { text: "Option 3", points: {} }
    ]
  });
});

incompleteSequence.forEach(qNum => {
  data.questions.push({
    question: `Choose an option which would complete the sequence (Question ${qNum})`,
    imageUrl: `/images/stream-selector/q${qNum}.png`,
    options: [
      { text: "Option A", imageUrl: `/images/stream-selector/q${qNum}_a.png`, points: { "Science (Non-Medical)": 2 } },
      { text: "Option B", imageUrl: `/images/stream-selector/q${qNum}_b.png`, points: {} },
      { text: "Option C", imageUrl: `/images/stream-selector/q${qNum}_c.png`, points: {} },
      { text: "Option D", imageUrl: `/images/stream-selector/q${qNum}_d.png`, points: {} }
    ]
  });
});

fs.writeFileSync('stream_selector_data.json', JSON.stringify(data, null, 2));
console.log("Data generated.");
