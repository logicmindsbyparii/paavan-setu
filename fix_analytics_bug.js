const fs = require('fs');
const filePath = '/home/av/Desktop/win_Desktop_data/Desktop/Work/av/Logic Mind projects/internship/paawan setu/frontend/src/pages/admin/TestAnalytics.jsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/setTests\(Array\.isArray\(testsRes\) \? testsRes : testsRes\?\.data \|\| \[\]\);/g, "setTests(Array.isArray(testsRes) ? testsRes : testsRes || []);");
content = content.replace(/setAnalytics\(Array\.isArray\(analyticsRes\) \? analyticsRes : analyticsRes\?\.data \?\? null\);/g, "setAnalytics(Array.isArray(analyticsRes) ? analyticsRes : analyticsRes ?? null);");
content = content.replace(/const data = Array\.isArray\(res\) \? res : res\?\.data \?\? null;/g, "const data = Array.isArray(res) ? res : res ?? null;");

fs.writeFileSync(filePath, content);
console.log('Fixed analytics data mapping bug.');
