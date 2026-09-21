require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Test = require('../models/Test');

const hollandQuestions = [
  // Realistic
  { category: "Realistic", q: "I enjoy working with my hands to build, fix, or assemble things." },
  { category: "Realistic", q: "I prefer working outdoors or in a physical environment rather than sitting at a desk." },
  { category: "Realistic", q: "I am comfortable operating machinery, tools, or equipment." },
  { category: "Realistic", q: "I like practical tasks where I can see a tangible result of my work." },
  { category: "Realistic", q: "I would enjoy a job that requires physical coordination and stamina." },

  // Investigative
  { category: "Investigative", q: "I enjoy analyzing complex data to find patterns or solve problems." },
  { category: "Investigative", q: "I am naturally curious about how things work scientifically or logically." },
  { category: "Investigative", q: "I prefer to work independently on research or investigative tasks." },
  { category: "Investigative", q: "I like intellectual challenges that require deep thinking and strategy." },
  { category: "Investigative", q: "I would enjoy working in a laboratory or conducting experiments." },

  // Artistic
  { category: "Artistic", q: "I value self-expression and enjoy creative activities like writing, design, or music." },
  { category: "Artistic", q: "I prefer unstructured environments where I can use my imagination." },
  { category: "Artistic", q: "I like approaching problems from an unconventional or original perspective." },
  { category: "Artistic", q: "I enjoy attending cultural events, art exhibits, or theater performances." },
  { category: "Artistic", q: "I would enjoy a career that allows me to design or create aesthetic products." },

  // Social
  { category: "Social", q: "I find it deeply rewarding to help others learn, grow, or heal." },
  { category: "Social", q: "I am good at listening to people and providing empathy or support." },
  { category: "Social", q: "I prefer working collaboratively in a team rather than in isolation." },
  { category: "Social", q: "I enjoy participating in community service or volunteer work." },
  { category: "Social", q: "I would enjoy a job that involves teaching, counseling, or mentoring others." },

  // Enterprising
  { category: "Enterprising", q: "I enjoy taking the lead on projects and motivating a team." },
  { category: "Enterprising", q: "I am comfortable speaking in public and persuading others to my point of view." },
  { category: "Enterprising", q: "I like taking risks in business or competitive environments." },
  { category: "Enterprising", q: "I am driven by goals, achievements, and career advancement." },
  { category: "Enterprising", q: "I would enjoy starting my own business or managing a company." },

  // Conventional
  { category: "Conventional", q: "I enjoy working with numbers, spreadsheets, and detailed records." },
  { category: "Conventional", q: "I prefer tasks that have clear instructions and structured procedures." },
  { category: "Conventional", q: "I am highly organized and pay close attention to details." },
  { category: "Conventional", q: "I like maintaining order and ensuring that rules are followed correctly." },
  { category: "Conventional", q: "I would enjoy a career in administration, finance, or data management." },
];

const getHollandOptions = (category) => [
  { text: "Strongly Agree", points: { [category]: 3 } },
  { text: "Agree", points: { [category]: 1 } },
  { text: "Neutral", points: {} },
  { text: "Disagree", points: { [category]: -1 } },
  { text: "Strongly Disagree", points: { [category]: -3 } }
];

const engineeringQuestions = [
  // Computer Science / IT
  { category: "Computer Science / IT", q: "I enjoy writing code, developing software, or exploring how apps are built." },
  { category: "Computer Science / IT", q: "I am fascinated by artificial intelligence, cybersecurity, and data structures." },
  { category: "Computer Science / IT", q: "I prefer solving abstract logical puzzles rather than building physical objects." },
  { category: "Computer Science / IT", q: "I enjoy learning new programming languages and automating repetitive tasks." },

  // Mechanical
  { category: "Mechanical", q: "I am fascinated by engines, robotics, and the physical mechanics of how machines operate." },
  { category: "Mechanical", q: "I enjoy dismantling mechanical devices to understand their inner workings." },
  { category: "Mechanical", q: "I like working with CAD software to design physical prototypes and mechanical parts." },
  { category: "Mechanical", q: "I am interested in thermodynamics, fluid mechanics, or aerospace technology." },

  // Civil
  { category: "Civil", q: "I am interested in the design and construction of large-scale infrastructure like bridges and dams." },
  { category: "Civil", q: "I enjoy planning urban spaces and considering the environmental impact of construction." },
  { category: "Civil", q: "I prefer projects that have a massive, visible physical presence in the real world." },
  { category: "Civil", q: "I am intrigued by structural integrity, materials science, and surveying land." },

  // Electrical / Electronics
  { category: "Electrical / Electronics", q: "I am fascinated by how electricity is generated, transmitted, and utilized." },
  { category: "Electrical / Electronics", q: "I enjoy tinkering with circuits, microcontrollers, like Arduino or Raspberry Pi." },
  { category: "Electrical / Electronics", q: "I am interested in renewable energy systems, battery technology, and power grids." },
  { category: "Electrical / Electronics", q: "I like designing or repairing electronic devices and telecommunication systems." },

  // Chemical
  { category: "Chemical", q: "I am passionate about understanding chemical reactions and molecular structures." },
  { category: "Chemical", q: "I am interested in how lab-scale chemical processes are scaled up for industrial manufacturing." },
  { category: "Chemical", q: "I would enjoy working in pharmaceuticals, petrochemicals, or food processing." },
  { category: "Chemical", q: "I want to develop new sustainable materials, advanced polymers, or clean fuels." },
];

const getEngineeringOptions = (category) => [
  { text: "Strongly Agree", points: { [category]: 3 } },
  { text: "Agree", points: { [category]: 1 } },
  { text: "Neutral", points: {} },
  { text: "Disagree", points: { [category]: -1 } },
  { text: "Strongly Disagree", points: { [category]: -3 } }
];

async function updateTests() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const hollandTest = await Test.findOne({ slug: "holland-code-career-test" });
    if (hollandTest) {
      hollandTest.questions = hollandQuestions.map(item => ({
        question: item.q,
        options: getHollandOptions(item.category)
      }));
      await hollandTest.save();
      console.log("Updated holland-code-career-test");
    } else {
      console.log("holland-code-career-test not found!");
    }

    const engTest = await Test.findOne({ slug: "engineering-branch-selector" });
    if (engTest) {
      engTest.questions = engineeringQuestions.map(item => ({
        question: item.q,
        options: getEngineeringOptions(item.category)
      }));
      await engTest.save();
      console.log("Updated engineering-branch-selector");
    } else {
      console.log("engineering-branch-selector not found!");
    }
  } catch (error) {
    console.error("Error updating tests:", error);
  } finally {
    mongoose.disconnect();
  }
}

updateTests();
