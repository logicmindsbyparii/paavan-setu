/* Rebuilds stream_selector_data.json Q37–Q76 from the PDF (no guessing).
 * Run: node scripts/build_stream_selector_bank.js   (from backend/)
 * Image map (verified against actual pixels):
 *  Q37-46 codes -> img-000..009 | Q47 -> img-010 | Q48 -> img-011
 *  Q52 belt -> img-012 | Q54 rack -> img-013 | Q55 circuit -> img-014
 *  Q72 stem+opts -> img-015..019 | Q73 -> img-020..024 | Q74 -> img-025..029
 *  Q75 -> img-030..034 | Q76 -> img-035..039
 * Text-only: Q49,50,51,53,56,57-71 (passages live in `scenario`).
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', '..', 'stream_selector_data.json');
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const IMG = (n) => `/images/stream-selector/img-${String(n).padStart(3, '0')}.png`;
const COM = 'Commerce', MED = 'Science (Medical)', NM = 'Science (Non-Medical)', ART = 'Arts & Humanities';

/* options: array of text; correct index gets domain points, rest get {} */
const apt = (o) => ({
  question: o.q,
  scenario: o.scenario || '',
  imageUrl: o.img || '',
  difficulty: o.diff || 'intermediate',
  tags: o.tags || [],
  explanation: o.exp || '',
  correctOptionIndex: o.correct,
  options: o.opts.map((t, i) => ({
    ...(o.optImg ? { imageUrl: o.optImg[i] } : {}),
    text: t,
    points: i === o.correct ? { [o.domain]: o.weight || 1 } : {},
    explanation: i === o.correct ? (o.exp || '') : '',
  })),
});

const ASIA = 'Asia is the world\u2019s largest continent and stretches from the Baring Sea in the east to Turkey and Europe in the west. Its southern border comprises many islands, including those that make up Indonesia. Since independence of colonial powers Asian economies have boomed. First were Japan, Singapore, Taiwan, South Korea and later Malaysia, Thailand and Indonesia. More recently China and India have enjoyed rapid economic growth. The south west central part of the continent are deserts. The people of Asia make up over two-thirds of the world\u2019s population and they live in the birthplace of the world\u2019s earliest civilizations. Asia varies greatly across and within its regions with regard to ethnic groups, cultures, environments, economics, historical ties and government systems. It also has a mix of many different climates ranging from the equatorial south via the hot desert in the Middle East, temperate areas in the east and the extremely continental centre to vast subarctic and polar areas in Siberia.';
const EM = 'Electromagnetic radiation is one of the many ways that energy travels through space. The heat from a burning fire, the light from the sun, the X-rays used by your doctor, as well as the energy used to cook food in a microwave are all forms of electromagnetic radiation. While these forms of energy might seem quite different from one another, they are related in that they all exhibit wavelike properties. Light from the sun is also made up of these electromagnetic waves. These vary in length and it is these differences that we perceive as different colours. White light has all the wavelengths of the light spectrum mixed up together. An object looks coloured because light falls on it and it reflects only certain parts of the spectrum. The rest of the spectrum is absorbed by the object. An object that looks white reflects the red part of the spectrum and absorbs the rest. Our eyes detect these different reflected waves and we see them as different colours.';
const ASIA_REF = 'Answer based on the Asia passage shown in Q57.';
const EM_REF = 'Answer based on the electromagnetic-radiation passage shown in Q62.';
const TFC = ['True', 'False', 'Cannot tell'];

const bank = [
  // ── Identical Codes (clerical accuracy -> Commerce) ──
  ...[
    ['DE', 'DC', 'DB', 'DA', 0], ['BA', 'BC', 'BD', 'BE', 3],
    ['CB', 'CE', 'CD', 'CA', 2], ['CE', 'CB', 'CA', 'CD', 0],
    ['BA', 'BD', 'BE', 'BC', 1], ['BA', 'BC', 'BE', 'BD', 3],
    ['BA', 'BE', 'BC', 'BD', 2], ['CE', 'CA', 'CB', 'CD', 0],
    ['AE', 'AB', 'AC', 'AD', 3], ['BD', 'AB', 'AD', 'DE', 1],
  ].map((r, k) => apt({
    q: 'Find the two identical codes from A, B, C, D or E and choose the right option.',
    scenario: 'Identical Codes — compare the five codes in the table image carefully.',
    img: IMG(k), opts: r.slice(0, 4), correct: r[4], domain: COM,
    diff: 'beginner', tags: ['identical-codes', 'attention-to-detail'],
    exp: `Codes ${r[r[4]].split('').join('')} match exactly; the rest differ by at least one character.`,
  })),
  // ── Number Game ──
  apt({ q: 'You are the manager of a company which publishes books. You have been given the total cost of a new publication in the table. How much is spent on advertisement and how much is given to the author respectively?', scenario: 'Number Game — Promotion cost = advertisement; Royalty = author share.', img: IMG(10), opts: ['20000, 15000', '15000, 10000', '10000, 15000', 'None of the above'], correct: 2, domain: NM, tags: ['number-game', 'data-interpretation'], exp: 'Promotion cost is 10,000 and Royalty is 15,000 — so 10000, 15000.' }),
  apt({ q: 'You have come as an Auditor to a Company that prepares students for competitive exams. It refunds tuition fees of all students not selected. In which two years does the refunded number NOT match the refund policy?', scenario: 'Number Game — refunded count must equal Students Not Selected.', img: IMG(11), opts: ['2009, 2011', '2009, 2012', '2008, 2010', 'None of the above'], correct: 0, domain: NM, tags: ['number-game', 'data-interpretation'], exp: '2009 refunded 2500 vs 3000 not selected; 2011 refunded 2700 vs 2650. All other years match.' }),
  apt({ q: 'A shopkeeper purchased a set of 400 pencils for Rs 600. He sold each pencil for Rs 2. How much does he earn on each pencil?', opts: ['1', '0.5', '1.5', '2.5'], correct: 1, domain: NM, tags: ['number-game', 'profit-loss'], exp: 'Cost each = 600/400 = 1.5. Sold at 2, so profit = 0.5 per pencil.' }),
  apt({ q: 'Atul purchased 5 kg apples for Rs 300 and 5 kg bananas for Rs 270. He sold the apples for Rs 560 and bananas for Rs 320. What was the total profit?', opts: ['320', '300', '370', '310'], correct: 3, domain: NM, tags: ['number-game', 'profit-loss'], exp: 'Cost 570, sold 880. Profit = 880 - 570 = 310.' }),
  apt({ q: 'Ajay went to bank to get change of Rs 500. He gave the cashier a 500 Rupee note and asked for all Rs 10 notes in return. How many 10 rupee notes will he get?', opts: ['500', '10', '50', '20'], correct: 2, domain: NM, tags: ['number-game', 'arithmetic'], exp: '500 / 10 = 50 notes.' }),
  apt({ q: 'Suppose you went to IG International Airport and a senior pilot asked: if drive wheel X rotates clockwise then how does wheel Y turn?', scenario: 'Number Game — study the belt drive in the image (open belt, Y is the small wheel).', img: IMG(12), opts: ['Clockwise faster', 'Clockwise slower', 'Anticlockwise faster', 'None of the above'], correct: 0, domain: NM, diff: 'advanced', tags: ['number-game', 'mechanical-reasoning'], exp: 'An open belt keeps the same direction, and the smaller wheel Y spins faster than X.' }),
  apt({ q: 'Find 1/9 as a percentage =', opts: ['0.09', '11.11', '1.11', '0.9'], correct: 1, domain: NM, tags: ['number-game', 'percentages'], exp: '1/9 = 0.1111\u2026 = 11.11%.' }),
  apt({ q: 'You are making a new vehicle which moves on the mechanics in the image. If bar Y moves left at a constant speed of 10 rpm, how does bar X move?', scenario: 'Number Game — Y drives the small gear, which drives the big gear, which drives X.', img: IMG(13), opts: ['Faster', 'Same', 'Slower', 'None of the above'], correct: 2, domain: NM, diff: 'advanced', tags: ['number-game', 'mechanical-reasoning'], exp: 'The small gear drives the bigger gear, so X moves the opposite way at a slower speed.' }),
  apt({ q: 'Suppose you are the Electrical Engineer of a company X. In the circuit shown, how many switches need to be closed to light up one bulb?', scenario: 'Number Game — four parallel branches, each with one bulb and one switch.', img: IMG(14), opts: ['None', 'One', 'Two', 'Three'], correct: 1, domain: NM, tags: ['number-game', 'electrical'], exp: 'Each bulb has its own parallel branch, so closing one switch lights exactly one bulb.' }),
  apt({ q: 'A man sold 1 Kg of rice for Rs 40 and made a profit of Rs 10 on it. The next day he sold 2 Kgs of rice for Rs 60 and made a profit of Rs 10. At what cost did he buy rice on Day 1 and Day 2?', opts: ['Rs. 30, Rs. 25 Respectively', 'Rs. 30, Rs. 30 Respectively', 'Rs. 35, Rs. 30 Respectively', 'Rs. 35, Rs. 25 Respectively'], correct: 0, domain: NM, tags: ['number-game', 'profit-loss'], exp: 'Day 1: 40 - 10 = 30/kg. Day 2: (60 - 10)/2 = 25/kg.' }),
  // ── Careful Reading: Asia ──
  apt({ q: 'Civilization began in the continent of Asia.', scenario: ASIA, opts: TFC, correct: 0, domain: ART, tags: ['reading-comprehension'], exp: 'The passage says Asia\u2019s people live in the birthplace of the world\u2019s earliest civilizations.' }),
  apt({ q: 'The colonial era was a disaster for Asia.', scenario: ASIA_REF, opts: TFC, correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'The passage only says economies boomed after independence; it never judges the colonial era.' }),
  apt({ q: 'Is Siberia the coldest place in Asia?', scenario: ASIA_REF, opts: TFC, correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'Siberia is described as subarctic and polar, but no coldest-place claim is made.' }),
  apt({ q: 'Post-colonial growth first occurred in Singapore.', scenario: ASIA_REF, opts: TFC, correct: 1, domain: ART, tags: ['reading-comprehension'], exp: 'Japan is listed first among the early growers, not Singapore alone.' }),
  apt({ q: 'Asia has the largest diversity in the world in terms of culture and climate?', scenario: ASIA_REF, opts: TFC, correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'Great variety is described, but no world-largest comparison is stated.' }),
  // ── Careful Reading: EM radiation ──
  apt({ q: 'Light is known as electromagnetic radiation because it has two complementary components called magnetic field wave and electric field wave.', scenario: EM, opts: TFC, correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'The passage never gives this reason; it only says the forms exhibit wavelike properties.' }),
  apt({ q: 'The colour we perceive an object to be is determined by the electromagnetic waves that it absorbs or reflects.', scenario: EM_REF, opts: TFC, correct: 0, domain: ART, tags: ['reading-comprehension'], exp: 'Stated directly: an object looks coloured because it reflects only certain parts of the spectrum.' }),
  apt({ q: 'Radio waves, Light waves, thermal radiation, X ray, visible light, microwave, infrared, gamma rays etc. are the example of:', scenario: EM_REF, opts: ['Electromagnetic waves', 'Electromagnetic Radiations', 'Both'], correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'The passage calls them electromagnetic radiation and says they all exhibit wavelike properties.' }),
  apt({ q: 'The passage states that an object that looks blue absorbs all but the blue wavelengths of light.', scenario: EM_REF, opts: TFC, correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'Blue is never mentioned; only a white-object example is given.' }),
  apt({ q: 'White paint reflects more light than red paint.', scenario: EM_REF, opts: TFC, correct: 2, domain: ART, tags: ['reading-comprehension'], exp: 'No white-vs-red comparison appears in the passage.' }),
  // ── Words Game ──
  apt({ q: 'Which of the following words are preposition?', scenario: 'Words Game', opts: ['Location', 'No', 'In', 'Position'], correct: 2, domain: ART, diff: 'beginner', tags: ['vocabulary', 'grammar'], exp: 'In is a preposition; the rest are nouns/particles.' }),
  apt({ q: 'Choose the one with right spelling.', scenario: 'Words Game', opts: ['Permisible', 'Permissible', 'Permissable', 'Permisable'], correct: 1, domain: ART, diff: 'beginner', tags: ['vocabulary', 'spelling'], exp: 'The correct spelling is P-E-R-M-I-S-S-I-B-L-E.' }),
  apt({ q: 'Dog is to Hair as Fish is to:', scenario: 'Words Game — analogy.', opts: ['Scales', 'Feathers', 'Tail', 'Fins'], correct: 0, domain: ART, diff: 'beginner', tags: ['vocabulary', 'analogy'], exp: 'Hair covers a dog as scales cover a fish.' }),
  apt({ q: 'Dawn is to Noon as Dusk is to:', scenario: 'Words Game — analogy.', opts: ['Night', 'Midnight', 'Dark', 'Afternoon'], correct: 0, domain: ART, diff: 'beginner', tags: ['vocabulary', 'analogy'], exp: 'Dawn leads to noon as dusk leads to night.' }),
  apt({ q: 'Cat is to paw as Horse is to:', scenario: 'Words Game — analogy.', opts: ['Fur', 'Hair', 'Shoe', 'Hoof'], correct: 3, domain: ART, diff: 'beginner', tags: ['vocabulary', 'analogy'], exp: 'A paw is the cat\u2019s foot as a hoof is the horse\u2019s foot (a shoe is man-made).' }),
  // ── Incomplete Sequence (spatial -> Non-Medical) ──
  apt({ q: 'Choose the option which would complete the sequence.', scenario: 'Incomplete Sequence — the satellite dot circuits the main shape; the grid reads TL \u2192 BL \u2192 BR \u2192 ?.', img: IMG(15), opts: ['Option A', 'Option B', 'Option C', 'Option D'], optImg: [IMG(16), IMG(17), IMG(18), IMG(19)], correct: 3, domain: NM, weight: 2, diff: 'advanced', tags: ['pattern-reasoning', 'spatial'], exp: 'The dot continues its counter-clockwise circuit back to the west side of a round disc.' }),
  apt({ q: 'Choose the option which would complete the sequence.', scenario: 'Incomplete Sequence — each column must match top to bottom.', img: IMG(20), opts: ['Option A', 'Option B', 'Option C', 'Option D'], optImg: [IMG(21), IMG(22), IMG(23), IMG(24)], correct: 0, domain: NM, weight: 2, diff: 'intermediate', tags: ['pattern-reasoning', 'spatial'], exp: 'The right column repeats top to bottom, so the left column repeats the square with the down arrow.' }),
  apt({ q: 'Choose the option which would complete the sequence.', scenario: 'Incomplete Sequence — track the bold ring across the four quadrants.', img: IMG(25), opts: ['Option A', 'Option B', 'Option C', 'Option D'], optImg: [IMG(26), IMG(27), IMG(28), IMG(29)], correct: 0, domain: NM, weight: 2, diff: 'advanced', tags: ['pattern-reasoning', 'spatial'], exp: 'The ring visits each quadrant once; the missing cell needs it bottom-right with triangle, square, circle fixed.' }),
  apt({ q: 'Choose the option which would complete the sequence.', scenario: 'Incomplete Sequence — every cell holds four shapes; count squares vs circles.', img: IMG(30), opts: ['Option A', 'Option B', 'Option C', 'Option D'], optImg: [IMG(31), IMG(32), IMG(33), IMG(34)], correct: 0, domain: NM, weight: 2, diff: 'advanced', tags: ['pattern-reasoning', 'spatial'], exp: 'Each cell totals four shapes and the missing cell balances the set with four circles.' }),
  apt({ q: 'Which comes next? Choose an option.', scenario: 'Incomplete Sequence — the divider alternates horizontal/vertical while the dots travel.', img: IMG(35), opts: ['Option A', 'Option B', 'Option C', 'Option D'], optImg: [IMG(36), IMG(37), IMG(38), IMG(39)], correct: 3, domain: NM, weight: 2, diff: 'advanced', tags: ['pattern-reasoning', 'spatial'], exp: 'The next frame needs a vertical divider with the ring top-left and the solid dot top-right.' }),
];

if (bank.length !== 40) throw new Error(`expected 40 rebuilt questions, got ${bank.length}`);
data.questions.splice(36, 40, ...bank);
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`OK: ${data.questions.length} questions total, Q37-76 rebuilt with keys+images.`);
