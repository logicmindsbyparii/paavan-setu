const fs = require('fs');
const filePath = '/home/av/Desktop/win_Desktop_data/Desktop/Work/av/Logic Mind projects/internship/paawan setu/frontend/src/pages/admin/TestAnalytics.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix old orange/gold
content = content.replace(/rgba\(232,184,109,0\.06\)/g, "#f0fdf4");
content = content.replace(/rgba\(232,184,109,0\.6\)/g, "#34d399");
content = content.replace(/rgba\(232,184,109,0\.25\)/g, "#d1fae5");
content = content.replace(/rgba\(232,184,109,0\.12\)/g, "#ecfdf5");
content = content.replace(/rgba\(232,184,109,0\.3\)/g, "#6ee7b7");

// Fix generic grays
content = content.replace(/rgba\(0, 0, 0, 0\.45\)/g, "#9ca3af");
content = content.replace(/rgba\(0, 0, 0, 0\.02\)/g, "#ffffff");
content = content.replace(/rgba\(0, 0, 0, 0\.06\)/g, "#f3f4f6");
content = content.replace(/rgba\(0,0,0,0\.06\)/g, "#f3f4f6");

// Fix pie chart colors so they are light-theme friendly
// old: ['#10b981', '#f43f5e', '#6366f1', '#f59e0b', '#8b5cf6', '#14b8a6']
// The existing colors might already be okay, but maybe they were too dim.

// Fix border radius and card styles to be Emil Kowalski style (smooth)
content = content.replace(/borderRadius: 2/g, "borderRadius: '12px'");
content = content.replace(/borderRadius: 4/g, "borderRadius: '16px'");
// Some charts have axis colors as #4b5563, which is good.

fs.writeFileSync(filePath, content);
console.log('Fixed lingering UX colors!');
