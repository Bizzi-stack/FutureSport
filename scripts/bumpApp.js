import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// bump matches
code = code.replaceAll('eduvision-pmc-matches-v9', 'eduvision-pmc-matches-v10');
code = code.replaceAll('eduvision-pmc-matches-v8', 'eduvision-pmc-matches-v9');

// bump students
code = code.replaceAll('eduvision-pmc-students-v11', 'eduvision-pmc-students-v12');
code = code.replace("'eduvision-pmc-students-v10']", "'eduvision-pmc-students-v10', 'eduvision-pmc-students-v11']");

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx cache keys bumped!');
