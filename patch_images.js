const fs = require('fs');

const data = JSON.parse(fs.readFileSync('stream_selector_data.json', 'utf8'));

// Identical Codes: Q37 to Q46 (index 36 to 45) -> img-000 to img-009
for (let i = 0; i < 10; i++) {
  data.questions[36 + i].imageUrl = `/uploads/img-${String(i).padStart(3, '0')}.png`;
}

// Number Game: Q47 (idx 46) -> img-010, Q48 (idx 47) -> img-011, Q52 (idx 51) -> img-012, Q54 (idx 53) -> img-013, Q55 (idx 54) -> img-014
data.questions[46].imageUrl = `/uploads/img-010.png`;
data.questions[47].imageUrl = `/uploads/img-011.png`;
data.questions[51].imageUrl = `/uploads/img-012.png`;
data.questions[53].imageUrl = `/uploads/img-013.png`;
data.questions[54].imageUrl = `/uploads/img-014.png`;

// Incomplete Sequence: Q72 to Q76 (index 71 to 75)
let imgIndex = 15;
for (let i = 0; i < 5; i++) {
  const qIdx = 71 + i;
  data.questions[qIdx].imageUrl = `/uploads/img-${String(imgIndex++).padStart(3, '0')}.png`;
  data.questions[qIdx].options.forEach(opt => {
    opt.imageUrl = `/uploads/img-${String(imgIndex++).padStart(3, '0')}.png`;
  });
}

fs.writeFileSync('stream_selector_data.json', JSON.stringify(data, null, 2));
console.log('Done mapping images!');
