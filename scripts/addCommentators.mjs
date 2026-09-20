import fs from 'fs';

let code = fs.readFileSync('src/data/matchOfficialAccounts.js', 'utf8');

const strToFind = `        {
            id: 'fo_n_greaves',
            username: 'n.greaves',
            name: 'N. Greaves',
            email: 'n.greaves@pmcup.bb',
            password: 'password123',
            role: 'fourth-official',
            assignedMatchIds: ['pmc-fixture-6', 'pmc-fixture-7', 'pmc-fixture-8']
        }
    ]
};`;

const newStr = `        {
            id: 'fo_n_greaves',
            username: 'n.greaves',
            name: 'N. Greaves',
            email: 'n.greaves@pmcup.bb',
            password: 'password123',
            role: 'fourth-official',
            assignedMatchIds: ['pmc-fixture-6', 'pmc-fixture-7', 'pmc-fixture-8']
        }
    ],
    commentator: [
        {
            id: 'comm_1',
            username: 'commentator1',
            name: 'Broadcast Commentator 1',
            email: 'commentator1@pmcup.bb',
            password: 'password123',
            role: 'commentator',
            assignedMatchIds: []
        },
        {
            id: 'comm_2',
            username: 'commentator2',
            name: 'Broadcast Commentator 2',
            email: 'commentator2@pmcup.bb',
            password: 'password123',
            role: 'commentator',
            assignedMatchIds: []
        }
    ]
};`;

if (code.includes(strToFind)) {
  code = code.replace(strToFind, newStr);
  code = code.replace(/eduvision-match-officials-v[0-9]+/, 'eduvision-match-officials-v9');
  fs.writeFileSync('src/data/matchOfficialAccounts.js', code);
  console.log('Success');
} else {
  console.log('Did not find the exact string. Let me search for fo_n_greaves to see what it is');
  const fo = code.substring(code.indexOf('fo_n_greaves'));
  console.log(fo.substring(0, 500));
}
