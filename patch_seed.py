import re

seed_file = 'backend/scripts/seed_engineering_branch_selector.js'
with open(seed_file, 'r') as f:
    content = f.read()

# I will replace the questions array from Q61 to Q100 with the exact mapped image names.

replacement = """  // 61-70: Physical Concepts
  { q: "You are a site supervisor and the masons have to mix cement in this mixer. Help them by assembling the pictures in a right combination and make a Cement mixer.", img: "q61_main.jpeg", opts: ["BAC", "ACB", "CBA"], correctIdx: 0, branch: "Civil" },
  { q: "Reorder vertically the pieces of a Ceramic tile to make a beautiful image", img: "q62_main.jpeg", opts: ["CAB", "ABC", "BCA"], correctIdx: 0, branch: "Civil" },
  { q: "Suppose that you went to IG International Airport and a senior pilot asked you a question that:\\nIf drive wheel X rotates clockwise then how does wheel Y turn?", img: "q63_main.jpeg", opts: ["Clockwise faster", "Clockwise slower", "Anticlockwise faster"], correctIdx: 2, branch: "Mechanical" },
  { q: "Assemble the parts of a computer CPU", img: "q64_main.jpeg", opts: ["CBA", "BAC", "ABC"], correctIdx: 0, branch: "Computer Science / IT" },
  { q: "Assemble the parts of a Stone crusher by choosing the correct option", img: "q65_main.jpeg", opts: ["CAB", "BAC", "CBA"], correctIdx: 1, branch: "Civil" },
  { q: "You are making a new vehicle which moves on the following mechanics. Explain the answer to the following question to your team. If bar Y moves left at a constant speed of 10 rpm how does bar X move", img: "q66_main.jpeg", opts: ["Faster", "Same", "Slower"], correctIdx: 1, branch: "Mechanical" },
  { q: "Assemble the parts of a submarine by choosing the correct option", img: "q67_main.jpeg", opts: ["ACB", "BAC", "CBA"], correctIdx: 0, branch: "Mechanical" },
  { q: "Paper production roller", img: "q68_main.jpeg", opts: ["ABC", "CBA", "BAC"], correctIdx: 1, branch: "Mechanical" },
  { q: "Imagine that you are in a science laboratory where you have to make pictures of Beaker Petri-dish Burner and Test tube from the jumbled pieces of pictures. How will you make?", img: "q69_main.jpeg", opts: ["BCA", "CBA", "BAC"], correctIdx: 1, branch: "Chemical" },
  { q: "Suppose you are the Electrical Engineer of a company X and you have to manage the whole circuit system for the IT department. The IT head has asked you a question kindly solve it to help him.\\nIn the circuit shown how many switches need to be closed to light up one bulb?", img: "q70_main.jpeg", opts: ["None", "One", "Two"], correctIdx: 2, branch: "Electrical / Electronics" },

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
  { q: "You are the shift in charge of mine X. The masons have been allotted odd and even numbers there just like roll numbers. You have to find out which mason is not in the group given below:\\n3, 5, 11, 14, 17, 21", opts: ["21", "17", "14"], correctIdx: 2, branch: "Computer Science / IT" },
  { q: "You are working in a ship construction company. The ship will have a cubical box placed on its terrace. You have been told to find the volume occupied by this cubical box with the particular dimensions:\\nLength 20 Ft, Breadth 20Ft and Height 40 Ft", opts: ["16000", "1600", "10600"], correctIdx: 0, branch: "Civil" },
  { q: "You are an Architect find out the area of a room which is specified by the following length X breadth\\n3 2/6 x 12 2/8 =", opts: ["6", "3", "9"], correctIdx: 1, branch: "Civil" },
  { q: "You are working as the international marketing head in a motorbike manufacturing company and have to answer How many motor bikes were sold in Belgium in the month of April?", img: "q95_main.jpeg", opts: ["14", "16", "17"], correctIdx: 1, branch: "Computer Science / IT" },
  { q: "A canteen bill is made up of the following Rs 12.50 for starters Rs 28.55 for main course and Rs 8.95 for dessert. How much is the bill?", opts: ["49", "50", "51"], correctIdx: 1, branch: "Computer Science / IT" },
  { q: "You have to work on a school project in which your team has to make a model of village. You have been given the task to prepare the cardboard base as the village ground. The length of the cardboard is 8 meter and width is 12 meters. What is the area of your village ground?", opts: ["64", "96", "144"], correctIdx: 1, branch: "Civil" },
  { q: "You are the System Administrator of company X. You are given a list of PC numbering. Two of them are identical. Match them.", img: "q98_main.jpeg", opts: ["AB", "BC", "CA"], correctIdx: 1, branch: "Computer Science / IT" },
  { q: "These are proton and neutron in an atom. Which image would be the next one in the series?", img: "q99_main.jpeg", opts: ["Option A", "Option B", "Option C"], optImgs: ["q99_opt0.jpeg", "q99_opt1.jpeg", "q99_opt2.jpeg"], correctIdx: 1, branch: "Chemical" },
  { q: "Suppose you go for an interview in a company that makes LED lights and they ask you to complete a series of LED lights on a display board. If you complete the series what would the board look like out of the options?", img: "q100_main.jpeg", opts: ["Option A", "Option B", "Option C"], optImgs: ["q100_opt0.jpeg", "q100_opt1.jpeg", "q100_opt2.jpeg"], correctIdx: 1, branch: "Electrical / Electronics" }
"""

import re
pattern = re.compile(r'  // 61-70: Physical Concepts.*?// 61-70: Physical Concepts \(Images in question, some in options\).*?\{ q: "Suppose you go for an interview in a company that makes LED lights.*?\}', re.DOTALL)

# Find where it starts
start_str = '  // 61-70: Physical Concepts'
end_str = '];\n\nconst getPoints'

idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    new_content = content[:idx1] + replacement + '\n' + content[idx2:]
    with open(seed_file, 'w') as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Could not find boundaries")
