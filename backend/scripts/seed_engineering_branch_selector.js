require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Test = require('../models/Test');

const questions = [
  // 1-10: Situational Exploration
  { q: "Do you find it thrilling to see the satellite view of Earth?", opts: ["Yes, satellite view of earth looks awesome", "It hardly matters", "No, earth looks good from land"], branch: ["Computer Science / IT", "Civil"] },
  { q: "Do you often read about the preservatives of packed food items as ketchup toppings jams jellies etc, and also be cautious about their utility?", opts: ["Yes definitely one must do that", "I read if it smells bad", "I don’t waste time on that"], branch: ["Chemical", "Chemical"] },
  { q: "Would you like to make a gadget to replace women, that can work like her in the kitchen?", opts: ["Yes I want to make a woman robot", "May be but women are better cooks", "Gadgets can never replace humans"], branch: ["Mechanical", "Mechanical"] },
  { q: "You have come to visit Delhi with your friends. You have three options to spend the day which one would you pick?", opts: ["Go for a historical site scene", "Depends, wherever my friends will go", "Go to a movie"], branch: ["Civil", "Civil"] },
  { q: "When there is a major power cut in the city what do you do?", opts: ["Think about alternate of renewable energy", "Think about the source of fault", "Dial up electricity department to complain"], branch: ["Electrical / Electronics", "Electrical / Electronics"] },
  { q: "You have gone to a village where the students of 9th class don’t have a science teacher in their school. What kind of step would you like to take to improve the situation?", opts: ["Make a website explaining all science chapters", "Teach the students on your laptop about the subject", "Meet village panchayat to request for teachers appointment"], branch: ["Computer Science / IT", "Computer Science / IT"] },
  { q: "On a Sunday evening there are three programs running on television. Which one would you like to see?", opts: ["Programs which are made with many ocean survival equipments", "Programs which are made about solar system and planetary bodies", "Program based on impact of fertilizers on food crops"], branch: ["Mechanical", "Mechanical", "Chemical"] },
  { q: "Will you be comfortable to work in rotational shifts in an underground set up like coal mines?", opts: ["Yes I can dare to do that", "May be but not at night", "No I will feel discomfort"], branch: ["Mechanical", "Civil"] },
  { q: "When you go out for shopping clothes on what parameters do you lay stress", opts: ["On the material quality and durability", "On the color and pattern", "On the latest fashion and wearer comfort"], branch: ["Civil", "Computer Science / IT"] },
  { q: "You and your friend were working in the school chemistry lab. Suddenly there was an explosion in the beaker which your friend was handling. The teacher has told you to find the reason. Which of the following chemical was probably mixed by your friend?", opts: ["Potassium + water", "Magnesium + water", "Water + water"], branch: ["Chemical", "Chemical"] },

  // 11-20: Interest Inventory - Part 1
  { q: "In an entertainment park which one will you choose?", opts: ["Riding on a roller coaster", "On a merry go round", "I am scared"], branch: ["Mechanical", "Mechanical"] },
  { q: "Do you think about the quality of nutritional values of food, the purity of water and impact of edibles on your health?", opts: ["Yes that is my prime concern", "May be at times", "I never thought about it"], branch: ["Chemical", "Chemical"] },
  { q: "You are visiting your grandmother’s village where there is supply of unhygienic drinking water. What would you like to do for benefits of villagers?", opts: ["Help them purify water with chemicals", "Tell them to boil water before use", "Educate them about ill effects of unhygienic water"], branch: ["Chemical", "Chemical"] },
  { q: "In a workshop where there is odor of spirit, petroleum, paint etc will you be able to spend a day?", opts: ["Yes, I can spend easily", "May be for few hours", "No I feel nausea"], branch: ["Chemical", "Mechanical"] },
  { q: "If you are the DM of the city which one of the following would you like to do for traffic control?", opts: ["Build good roads and flyways", "Promote use of public transport", "Promote traffic rules and regulations"], branch: ["Civil", "Civil"] },
  { q: "You are fed up of frequent fuse faults in your society building during exams. As an alternative measure what would you like to do?", opts: ["Make a fuse free lighting device", "Find a permanent solution to mend the fuse", "Have a permanent electrician in the society"], branch: ["Electrical / Electronics", "Electrical / Electronics"] },
  { q: "There is frequent power cut in your city. When you work on your PC whatever work you do gets deleted because you forget to save it. What will you do?", opts: ["Install a UPS", "Remember to save in equal intervals", "Complain to the electricity dept"], branch: ["Computer Science / IT", "Computer Science / IT"] },
  { q: "Imagine that you are on an adventure camp with your friends and go for river rafting in a gushing water body; suddenly you realize that there is a hole in the raft. None of you knows swimming and you are far from the coast guard. What will you do?", opts: ["Will you try to repair the raft with the emergency material given for this", "Call the coast guard by phone", "Call your family and ask for help"], branch: ["Mechanical", "Mechanical"] },
  { q: "Will you be comfortable to work on heavy machines in summer season that make lot of noise and are placed amidst heavy dust?", opts: ["Yes I can", "May be for some time", "No I will not prefer that"], branch: ["Mechanical", "Mechanical"] },
  { q: "Ten varieties of cloth material such as silk, cotton, wool, chiffon, georgette, marble, satin, jute, nylon and rayon are been given to you. How many would you be able to name by looking at their texture.", opts: ["Probably all of them", "Probably four to five", "Probably one or two"], branch: ["Chemical", "Civil"] },

  // 21-30: Interest Inventory - Part 2
  { q: "Which one sounds more thrilling to you?", opts: ["Paragliding", "Cycling", "Running"], branch: ["Mechanical", "Mechanical"] },
  { q: "When a TV or Fridge or Washing Machine gets damaged in your home, someone comes to repair it; do you closely watch the mechanic working on it?", opts: ["Yes I keenly observe", "Yes at times I do", "No I don’t like it"], branch: ["Electrical / Electronics", "Mechanical"] },
  { q: "If given an option How comfortable you are to spend a day in a brick furnace in normal weather conditions?", opts: ["Yes, I can spend easily", "May be for few hours", "No I feel nausea"], branch: ["Civil", "Civil"] },
  { q: "What do you think was the reason of Hiroshima Nagasaki mishap after it was bombarded in 1945?", opts: ["Nuclear explosion", "Chemical explosion", "World war II"], branch: ["Chemical", "Chemical"] },
  { q: "There are frequent earthquakes in your city and the Mayor has asked to draft proposals to be sent to the government. What agenda would you choose out of these options?", opts: ["Proposal for building light weight houses", "Proposal for a disaster management team", "Proposal as per my parent’s suggestion"], branch: ["Civil", "Civil"] },
  { q: "If ever You have an opportunity to understand the function of smoke detector What will you do?", opts: ["I will open to see it", "I will take a incense stick close to it", "I don’t want to get into trouble by handling it"], branch: ["Electrical / Electronics", "Electrical / Electronics"] },
  { q: "You have to participate in the college project of making a touch screen device. There are three kinds of work which one would you prefer to choose?", opts: ["Designing and developing touch screen technology", "Documenting the concept of touch screen technology", "Presenting the touch screen device to audience"], branch: ["Computer Science / IT", "Computer Science / IT"] },
  { q: "The great Titanic Ship is being created once more if given a chance will you like to join the crew. How?", opts: ["Work with technical team so that this time the ship does not sink", "Help in coordinating the entire crew", "I will not like to participate"], branch: ["Mechanical", "Mechanical"] },
  { q: "Which one is the original source of Diamond out of these three?", opts: ["Coal", "Crystals", "Precious stones"], branch: ["Chemical", "Mechanical"] },
  { q: "How comfortable will you feel to work in a compact area with lot of humidity and bad odor of animal hides as Cow, Snake, Crocodile and camel?", opts: ["I will be habitual in few days", "May be I can work for some days", "No I cannot tolerate dead animal smell"], branch: ["Chemical", "Chemical"] },

  // 31-40: Aptitude Assessment - Part 1
  { q: "Do you find inspiration from the colony of ants? What kind of thoughts do they provoke in your mind?", opts: ["Ants work in a team with equal weight distribution on each ones head", "Ants are very laborious", "Ants fall and again climb up"], branch: ["Civil", "Civil"] },
  { q: "Do you think on a Diwali night the earth would look much more beautiful and magnificent from the sky than on the earth?", opts: ["Wow! This sounds amazing", "What is the difference", "I am not interested to see"], branch: ["Civil", "Civil"] },
  { q: "Given a Botanical laboratory will you like to grow pink brinjals and red potatoes?", opts: ["Oh yes I will love to grow them", "I don’t know how to grow them", "Brinjals and potatoes are good with their natural colors"], branch: ["Chemical", "Chemical"] },
  { q: "Do you read all the technical manuals of the new electronic products, kitchen gadgets, vehicles etc to know how they have been made?", opts: ["Yes I want to understand the product technically", "Only if I am told to operate", "No I don’t like it"], branch: ["Computer Science / IT", "Mechanical"] },
  { q: "If given a chance to study Egyptian pyramids what would you like to study?", opts: ["About the structure of pyramids", "About mummy graves of pyramids", "About mythologies of Pyramids"], branch: ["Civil", "Civil"] },
  { q: "When you buy a vegetables, milk or grocery products, apart from the pricing per Kg / Liter, on what else do you lay stress?", opts: ["Weighing machine, and its quality or usage standard parameters", "On the product weight being measured by the vendor", "On the calorific and nutritional value"], branch: ["Mechanical", "Chemical"] },
  { q: "Would you prefer to work for long hours sitting on chair with concentration and work on complex project for a whole year?", opts: ["Yes I would love to do that", "May be for some hours per day", "Not more than two hours per day"], branch: ["Computer Science / IT", "Computer Science / IT"] },
  { q: "Would you feel comfortable to sail for six months, where you get to see beautiful water bodies and clear sky?", opts: ["Yes I will find it thrilling", "May be once in my life time", "I don’t like traveling so much"], branch: ["Mechanical", "Mechanical"] },
  { q: "In a summer camp you have been provided with three trays which contain some materials. Your task is to make a necklace choosing one of these materials given in a tray.", opts: ["Tray 1 – metal chain and beads", "Tray 2 – Thread and cotton beads", "Tray 3 – Plastic thread and pearls"], branch: ["Mechanical", "Civil"] },
  { q: "Leather is a costly and fashionable commodity; which of the following do you find more closer to your opinion in this regard", opts: ["Develop artificial and better alternate as rexene", "Those who can afford may buy it", "I would prefer to join NGO against killing animals for leather"], branch: ["Chemical", "Chemical"] },

  // 41-50: Aptitude Assessment - Part 2
  { q: "How comfortable will you be to work in rotational shifts, handling teams of people, working on different production machines to accomplish their tasks on time?", opts: ["Will feel comfortable", "May feel confused", "Can monitor them but not sure about timely production"], branch: ["Mechanical", "Mechanical"] },
  { q: "If a toy helicopter is given to you as a gift and it breaks its hover wings what will you do?", opts: ["You try to repair it immediately", "Give it to a mechanic for repair", "You buy a new one"], branch: ["Mechanical", "Mechanical"] },
  { q: "Do you often think to make a family car which is less expensive in fuel usage like a Solar Rickshaw?", opts: ["Yes it would be a big innovation", "May be but don’t know how", "CNG cars are already available"], branch: ["Electrical / Electronics", "Mechanical"] },
  { q: "You are on a school trip and have been given the responsibility of medical first aid box. Will you study before this trip that which medicine contains what chemicals and what is the first aid use of it as for e.g. Paracetamole, penicillin, streptomycin etc?", opts: ["Oh yes I must", "I will ask my ma’am", "I don’t like such responsibilities"], branch: ["Chemical", "Chemical"] },
  { q: "Your Class teacher gave three science prototypes to be made, which one will you choose?", opts: ["Construction of Dam", "Construction of Park", "Construction of Tent"], branch: ["Civil", "Civil"] },
  { q: "As a child when someone gifted you an electronic motor car or piano or watch, did you ever try to mend it on your own and open its parts to understand the inside mechanism?", opts: ["Yes I always open it", "May be when it is broken", "Never I kept my toys safe"], branch: ["Mechanical", "Electrical / Electronics"] },
  { q: "You are in your college if you are given an option to pick a computer related subject what would you like to study?", opts: ["Learning software programs", "Learning about world’s great programmers", "Learning about history of computers"], branch: ["Computer Science / IT", "Computer Science / IT"] },
  { q: "During winters if a scooter does starts but doesn’t run smoothly although its battery is fully charged what else could be the reason?", opts: ["May be there is no lubricant oil", "May be the plug is choked", "I don’t know"], branch: ["Mechanical", "Electrical / Electronics"] },
  { q: "There are three international seminars in your college. Which one would you like to attend?", opts: ["Seminar on volcanic activities around the world", "Seminar on world geography", "Seminar on world economy"], branch: ["Civil", "Civil"] },
  { q: "In a Trade fair there all artifact stalls of all Indian states. You visit the Kashmir stall where three kinds of artifacts manufacturing is being taught. Which one will you choose?", opts: ["Kashmiri paper mash", "Kashmiri woolen shawls", "Kashmiri wooden toys"], branch: ["Chemical", "Mechanical"] },

  // 51-60: Work Style Preferences
  { q: "Are you amazed by the variety and colors of bird and startled by the way they fly, perch on the trees and dive in the lakes to catch fishes?", opts: ["Yes they look like airplanes", "Only when you are free", "You never noticed"], branch: ["Mechanical", "Mechanical"] },
  { q: "Do you ever think that there should be more production of grains in India and you want to do something in this direction?", opts: ["Yes I want to increase grain production", "We can import from other countries", "Never thought about it"], branch: ["Chemical", "Civil"] },
  { q: "Would you like to make some other medical equipment which is as useful as an injection but not painful like it?", opts: ["Yes a needle free injection", "Injections cannot be replaced", "Never thought of"], branch: ["Mechanical", "Chemical"] },
  { q: "Your neighbor is constructing a new house on the first floor of the building, suddenly the balcony he made has fallen down. What will you do?", opts: ["Will find out the reason for poor quality of cement", "Will call a construction specialist", "Will show sympathy to your neighbor"], branch: ["Civil", "Civil"] },
  { q: "Do you like to read about telephone, mobile, fax, internet etc and want to improvise the technology of the same for even faster communication than the current one?", opts: ["Yes I am keen to know that", "May be at times", "Communication is at its best level now"], branch: ["Computer Science / IT", "Electrical / Electronics"] },
  { q: "In the computer laboratory of your school during the exams, suddenly your PC shuts down and doesn’t re start. What will you do?", opts: ["Will try to check the wiring of the system", "Take help from IT teacher", "Ask for another PC"], branch: ["Electrical / Electronics", "Computer Science / IT"] },
  { q: "In a public poll a question is asked what should be done to solve the problem of petrol price hike. What would your opinion be in this regard?", opts: ["Find other renewable fuel sources", "Extract more petroleum in India", "Raise the issue in media"], branch: ["Electrical / Electronics", "Chemical"] },
  { q: "You have gone to a museum just 10 minutes before it closes, there are three rooms which have different articles, since you have less time so now you can visit only one of the three rooms. Which room would you visit?", opts: ["Room with precious stones", "Room with ancient weapons", "Remains of dead animals"], branch: ["Civil", "Mechanical"] },
  { q: "Deforestation is happening due to increased consumption of paper. Which of the following do you find more closer to your opinion in this regard.", opts: ["More recycling industries should be encouraged", "More forestation should be encouraged", "Paper free work should be encouraged"], branch: ["Chemical", "Civil", "Computer Science / IT"] },
  { q: "You have to work on a school project in which you have to assemble some materials to make a very light weight body of a scooter. Which material will you choose?", opts: ["Polymer or fiber", "Plastic", "Aluminium sheets"], branch: ["Chemical", "Chemical", "Mechanical"] },

  // 61-70: Physical Concepts
  { q: "You are a site supervisor and the masons have to mix cement in this mixer. Help them by assembling the pictures in a right combination and make a Cement mixer.", img: "q61_main.jpeg", opts: ["BAC", "ACB", "CBA"], correctIdx: 0, branch: "Civil" },
  { q: "Reorder vertically the pieces of a Ceramic tile to make a beautiful image", img: "q62_main.jpeg", opts: ["CAB", "ABC", "BCA"], correctIdx: 0, branch: "Civil" },
  { q: "Suppose that you went to IG International Airport and a senior pilot asked you a question that:\nIf drive wheel X rotates clockwise then how does wheel Y turn?", img: "q63_main.jpeg", opts: ["Clockwise faster", "Clockwise slower", "Anticlockwise faster"], correctIdx: 2, branch: "Mechanical" },
  { q: "Assemble the parts of a computer CPU", img: "q64_main.jpeg", opts: ["CBA", "BAC", "ABC"], correctIdx: 0, branch: "Computer Science / IT" },
  { q: "Assemble the parts of a Stone crusher by choosing the correct option", img: "q65_main.jpeg", opts: ["CAB", "BAC", "CBA"], correctIdx: 1, branch: "Civil" },
  { q: "You are making a new vehicle which moves on the following mechanics. Explain the answer to the following question to your team. If bar Y moves left at a constant speed of 10 rpm how does bar X move", img: "q66_main.jpeg", opts: ["Faster", "Same", "Slower"], correctIdx: 1, branch: "Mechanical" },
  { q: "Assemble the parts of a submarine by choosing the correct option", img: "q67_main.jpeg", opts: ["ACB", "BAC", "CBA"], correctIdx: 0, branch: "Mechanical" },
  { q: "Paper production roller", img: "q68_main.jpeg", opts: ["ABC", "CBA", "BAC"], correctIdx: 1, branch: "Mechanical" },
  { q: "Imagine that you are in a science laboratory where you have to make pictures of Beaker Petri-dish Burner and Test tube from the jumbled pieces of pictures. How will you make?", img: "q69_main.jpeg", opts: ["BCA", "CBA", "BAC"], correctIdx: 1, branch: "Chemical" },
  { q: "Suppose you are the Electrical Engineer of a company X and you have to manage the whole circuit system for the IT department. The IT head has asked you a question kindly solve it to help him.\nIn the circuit shown how many switches need to be closed to light up one bulb?", img: "q70_main.jpeg", opts: ["None", "One", "Two"], correctIdx: 2, branch: "Electrical / Electronics" },

  // 71-80: Technical Preferences - Part 1
  { q: "Match the correct option:", img: "q71_main.jpeg", opts: ["Vecsel", "Vessle", "Vessel"], correctIdx: 2, branch: "Mechanical" },
  { q: "Match the correct option:", img: "q72_main.jpeg", opts: ["Ariation", "Aviation", "Aviatoin"], correctIdx: 1, branch: "Mechanical" },
  { q: "Match the correct option:", img: "q73_main.jpeg", opts: ["Genetic feed", "Generic food", "Genetic food"], correctIdx: 2, branch: "Chemical" },
  { q: "Match the correct option:", img: "q74_main.jpeg", opts: ["Alioy", "Alloy", "Allay"], correctIdx: 1, branch: "Chemical" },
  { q: "Match the correct option:", img: "q75_main.jpeg", opts: ["Ristructuring", "Restructuring", "Restracturing"], correctIdx: 1, branch: "Civil" },
  { q: "Match the correct option:", img: "q76_main.jpeg", opts: ["Landecape", "Landscape", "Landgrape"], correctIdx: 1, branch: "Civil" },
  { q: "Match the correct option:", img: "q77_main.jpeg", opts: ["Bemlconductor", "Femiconductor", "Semiconductor"], correctIdx: 2, branch: "Electrical / Electronics" },
  { q: "Match the correct option:", img: "q78_main.jpeg", opts: ["Program", "Progrem", "Progrmm"], correctIdx: 0, branch: "Computer Science / IT" },
  { q: "Match the correct option:", img: "q79_main.jpeg", opts: ["Assemble line", "Assembly line", "Assembly link"], correctIdx: 1, branch: "Mechanical" },
  { q: "Match the correct option:", img: "q80_main.jpeg", opts: ["Fusion", "Pission", "Fission"], correctIdx: 2, branch: "Chemical" },

  // 81-90: Technical Preferences - Part 2
  { q: "A child is playing with some pieces of plastic and rubber given in tray X. Help him find out the identical pieces of plastic and rubber in one of the three trays given here.", img: "q81_main.jpeg", opts: ["Option A", "Option B", "Option C"], optImgs: ["q81_opt0.jpeg", "q81_opt1.jpeg", "q81_opt2.jpeg"], correctIdx: 0, branch: "Civil" },
  { q: "Imagine that you are sitting on ground and seeing an Aero plane which is not flying normally, it is reversed and the wheels are upside down. How would this plane look like?", opts: ["Option A", "Option B", "Option C"], optImgs: ["q82_opt0.jpeg", "q82_opt1.jpeg", "q82_opt2.jpeg"], correctIdx: 2, branch: "Mechanical" },
  { q: "There are four rooms with computer workstations. Two of them look alike. Which two are they?", img: "q83_main.jpeg", opts: ["AB", "BC", "CA"], correctIdx: 0, branch: "Computer Science / IT" },
  { q: "Imagine that there are three sets of chemical boxes placed on three pentagonal plates and you have to pick the two with matching placement. How will you do?", img: "q84_main.jpeg", opts: ["Option A", "Option B", "Option C"], optImgs: ["q84_opt0.jpeg", "q84_opt1.jpeg", "q84_opt2.jpeg"], correctIdx: 1, branch: "Chemical" },
  { q: "This picture X is a map of underground mine. It shows the entry and exit arrows from the mine in four sub maps. One of the four direction sub map is missing. Pick the correct option out of the three options to complete the map.", img: "q85_main.jpeg", opts: ["Option 1", "Option 2", "Option 3"], optImgs: ["q85_opt0.jpeg", "q85_opt1.jpeg", "q85_opt2.jpeg"], correctIdx: 2, branch: "Civil" },
  { q: "These are prototypes of machines kept in different directions in company X. One of the machine is missing. Pick it up from the given options to complete the machine set up.", img: "q86_main.jpeg", opts: ["Option 1", "Option 2", "Option 3"], optImgs: ["q86_opt0.jpeg", "q86_opt1.jpeg", "q86_opt2.jpeg"], correctIdx: 1, branch: "Mechanical" },
  { q: "You have to make a display wall to stick a painting on it. Reassemble the pieces given in X frame to make a display wall.", img: "q87_main.jpeg", opts: ["Option 1", "Option 2", "Option 3"], optImgs: ["q87_opt0.jpeg", "q87_opt1.jpeg", "q87_opt2.jpeg"], correctIdx: 0, branch: "Civil" },
  { q: "You are an Electrician and you have been given a big board with three small boards fit into it. You have to find out which small board fits into the fourth place and completes the Board?", img: "q88_main.jpeg", opts: ["Option 1", "Option 2", "Option 3"], optImgs: ["q88_opt0.jpeg", "q88_opt1.jpeg", "q88_opt2.jpeg"], correctIdx: 2, branch: "Electrical / Electronics" },
  { q: "You are sailing in the sea in a ship and suddenly the compass stops working. The captain of the ship asks you to match the compass X with three more available compasses. Which one will you choose?", img: "q89_main.jpeg", opts: ["Option 1", "Option 2", "Option 3"], optImgs: ["q89_opt0.jpeg", "q89_opt1.jpeg", "q89_opt2.jpeg"], correctIdx: 1, branch: "Mechanical" },
  { q: "In a video game a house X fell on its left side and shattered to pieces you have to combine them and make the house again. How will you make this house by assembling the pieces?", img: "q90_main.jpeg", opts: ["Option 1", "Option 2", "Option 3"], optImgs: ["q90_opt0.jpeg", "q90_opt1.jpeg", "q90_opt2.jpeg"], correctIdx: 1, branch: "Civil" },

  // 91-100: Visual Assembly
  { q: "John is an international commercial pilot he starts his flight at 08:45 AM and finishes at 05:15 PM. How many hours does he work in a days?", opts: ["8.5", "8", "8.25"], correctIdx: 0, branch: "Computer Science / IT" },
  { q: "You are the shift in charge of mine X. The masons have been allotted odd and even numbers there just like roll numbers. You have to find out which mason is not in the group given below:\n3, 5, 11, 14, 17, 21", opts: ["21", "17", "14"], correctIdx: 2, branch: "Computer Science / IT" },
  { q: "You are working in a ship construction company. The ship will have a cubical box placed on its terrace. You have been told to find the volume occupied by this cubical box with the particular dimensions:\nLength 20 Ft, Breadth 20Ft and Height 40 Ft", opts: ["16000", "1600", "10600"], correctIdx: 0, branch: "Civil" },
  { q: "You are an Architect find out the area of a room which is specified by the following length X breadth\n3 2/6 x 12 2/8 =", opts: ["6", "3", "9"], correctIdx: 1, branch: "Civil" },
  { q: "You are working as the international marketing head in a motorbike manufacturing company and have to answer How many motor bikes were sold in Belgium in the month of April?", img: "q95_main.jpeg", opts: ["14", "16", "17"], correctIdx: 1, branch: "Computer Science / IT" },
  { q: "A canteen bill is made up of the following Rs 12.50 for starters Rs 28.55 for main course and Rs 8.95 for dessert. How much is the bill?", opts: ["49", "50", "51"], correctIdx: 1, branch: "Computer Science / IT" },
  { q: "You have to work on a school project in which your team has to make a model of village. You have been given the task to prepare the cardboard base as the village ground. The length of the cardboard is 8 meter and width is 12 meters. What is the area of your village ground?", opts: ["64", "96", "144"], correctIdx: 1, branch: "Civil" },
  { q: "You are the System Administrator of company X. You are given a list of PC numbering. Two of them are identical. Match them.", img: "q98_main.jpeg", opts: ["AB", "BC", "CA"], correctIdx: 1, branch: "Computer Science / IT" },
  { q: "These are proton and neutron in an atom. Which image would be the next one in the series?", img: "q99_main.jpeg", opts: ["Option A", "Option B", "Option C"], optImgs: ["q99_opt0.jpeg", "q99_opt1.jpeg", "q99_opt2.jpeg"], correctIdx: 1, branch: "Chemical" },
  { q: "Suppose you go for an interview in a company that makes LED lights and they ask you to complete a series of LED lights on a display board. If you complete the series what would the board look like out of the options?", img: "q100_main.jpeg", opts: ["Option A", "Option B", "Option C"], optImgs: ["q100_opt0.jpeg", "q100_opt1.jpeg", "q100_opt2.jpeg"], correctIdx: 1, branch: "Electrical / Electronics" }

];

const getPoints = (branchArr, isCorrect = true) => {
  const pts = {};
  if (Array.isArray(branchArr)) {
    branchArr.forEach(b => { if (b) pts[b] = isCorrect ? 3 : 0; });
  } else if (branchArr) {
    pts[branchArr] = isCorrect ? 3 : 0;
  }
  return pts;
};

const processedQuestions = questions.map((item, index) => {
  return {
    question: item.q,
    imageUrl: item.img ? `/images/stream-selector/${item.img}` : '',
    options: item.opts.map((opt, idx) => {
      let isCorrect = true;
      if (item.correctIdx !== undefined) {
        isCorrect = idx === item.correctIdx;
      } else {
        // Psychometric - first option strong agree (+3), second option neutral (+1), third option disagree (0/-1)
        if (idx === 0) isCorrect = true;
        else isCorrect = false; // logic handled by manual points if needed, but here we just give points for the first option based on index if no correctIdx
      }
      
      let pts = {};
      if (item.correctIdx !== undefined) {
        pts = getPoints(item.branch, isCorrect);
      } else {
        if (idx === 0) pts = getPoints(item.branch, true);
        else if (idx === 1) {
          if (item.branch.length > 1) pts = getPoints(item.branch[1], true);
          else pts = getPoints(item.branch, false);
        }
        else pts = getPoints(item.branch, false);
      }
      return {
        text: opt,
        imageUrl: item.optImgs ? `/images/stream-selector/${item.optImgs[idx]}` : '',
        points: pts
      };
    })
  };
});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const categoriesSet = new Set();
    processedQuestions.forEach(q => {
      q.options.forEach(o => {
        Object.keys(o.points).forEach(k => categoriesSet.add(k));
      });
    });
    const categories = Array.from(categoriesSet);

    let test = await Test.findOne({ slug: 'engineering-branch-selector' });
    if (!test) {
      test = new Test({
        slug: 'engineering-branch-selector',
        name: 'Engineering Branch Selector',
        description: 'Find the right engineering branch for you based on situational exploration, interest inventory, aptitude, and physical concepts.',
      });
    }
    test.questions = processedQuestions;
    test.categories = categories;
    
    // Update sections
    test.sections = [
      { title: "Situational Exploration", description: "Read each situation carefully and select the response that best describes what you would do.", questionIndices: Array.from({length: 10}, (_, i) => i) },
      { title: "Interest Inventory - Part 1", description: "Indicate your level of interest in each of the following activities.", questionIndices: Array.from({length: 10}, (_, i) => i + 10) },
      { title: "Interest Inventory - Part 2", description: "Indicate your level of interest in each of the following activities.", questionIndices: Array.from({length: 10}, (_, i) => i + 20) },
      { title: "Aptitude Assessment - Part 1", description: "Answer each question to the best of your ability.", questionIndices: Array.from({length: 10}, (_, i) => i + 30) },
      { title: "Aptitude Assessment - Part 2", description: "Answer each question to the best of your ability.", questionIndices: Array.from({length: 10}, (_, i) => i + 40) },
      { title: "Work Style Preferences", description: "Select the work environment and style that best suits you.", questionIndices: Array.from({length: 10}, (_, i) => i + 50) },
      { title: "Physical Concepts", description: "Answer questions about physical concepts and engineering fundamentals.", questionIndices: Array.from({length: 10}, (_, i) => i + 60) },
      { title: "Technical Preferences - Part 1", description: "Choose your technical preferences and inclinations.", questionIndices: Array.from({length: 10}, (_, i) => i + 70) },
      { title: "Technical Preferences - Part 2", description: "Choose your technical preferences and inclinations.", questionIndices: Array.from({length: 10}, (_, i) => i + 80) },
      { title: "Visual Assembly", description: "Assemble the pictures in the right combination to complete the visual patterns.", questionIndices: Array.from({length: 10}, (_, i) => i + 90) }
    ];
    
    test.scoringMode = 'profile'; 
    await test.save();
    console.log("Successfully updated Engineering Branch Selector with 100 questions.");
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}

run();
