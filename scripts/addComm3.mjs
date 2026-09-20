import fs from 'fs';

let code = fs.readFileSync('src/data/matchOfficialAccounts.js', 'utf8');

const marker = `            avatar: 'MO'
        }
    ]
};`;

const newStr = `            avatar: 'MO'
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

if (code.includes(marker)) {
    code = code.replace(marker, newStr);
    code = code.replaceAll('eduvision-match-officials-v6', 'eduvision-match-officials-v7');
    fs.writeFileSync('src/data/matchOfficialAccounts.js', code);
    console.log('Success!');
} else {
    console.log('Could not find the marker.');
}
