const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replaceAll('eduvision-pmc-students-v10', 'eduvision-pmc-students-v11');
c = c.replace("'eduvision-pmc-students-v9'].forEach", "'eduvision-pmc-students-v9', 'eduvision-pmc-students-v10'].forEach");

c = c.replaceAll('eduvision-pmc-matches-v8', 'eduvision-pmc-matches-v9');
c = c.replaceAll('eduvision-pmc-matches-v7', 'eduvision-pmc-matches-v8');

fs.writeFileSync('src/App.jsx', c);
