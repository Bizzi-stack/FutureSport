import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replaceAll('eduvision-match-officials-v7', 'eduvision-match-officials-v10');
code = code.replaceAll('eduvision-match-officials-v8', 'eduvision-match-officials-v10');
code = code.replaceAll('eduvision-match-officials-v9', 'eduvision-match-officials-v10');
fs.writeFileSync('src/App.jsx', code);
console.log('App bumped');
