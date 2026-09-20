import fs from 'fs';

let code = fs.readFileSync('src/data/matchOfficialAccounts.js', 'utf8');

const newStr = `            avatar: 'MO'\n        }\n    ],\n    commentator: [\n        {\n            id: 'comm_1',\n            username: 'commentator1',\n            name: 'Broadcast Commentator 1',\n            email: 'commentator1@pmcup.bb',\n            password: 'password123',\n            role: 'commentator',\n            assignedMatchIds: []\n        },\n        {\n            id: 'comm_2',\n            username: 'commentator2',\n            name: 'Broadcast Commentator 2',\n            email: 'commentator2@pmcup.bb',\n            password: 'password123',\n            role: 'commentator',\n            assignedMatchIds: []\n        }\n    ]\n};`;

code = code.replace(/avatar:\s*'MO'\s*}\s*\]\s*};/, newStr);
code = code.replace(/eduvision-match-officials-v[0-9]+/, 'eduvision-match-officials-v7');
fs.writeFileSync('src/data/matchOfficialAccounts.js', code);
console.log('Done with Regex');
