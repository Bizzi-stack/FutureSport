import fs from 'fs';

let code = fs.readFileSync('src/data/matchOfficialAccounts.js', 'utf8');

const newCommentators = `    commentator: [
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

const marker = `    ]
};

export function getOfficialsByRole(role) {`;

if (code.includes(marker)) {
    code = code.replace(marker, `    ],\n${newCommentators}\n\nexport function getOfficialsByRole(role) {`);
    code = code.replace(/eduvision-match-officials-v[0-9]+/, 'eduvision-match-officials-v9');
    fs.writeFileSync('src/data/matchOfficialAccounts.js', code);
    console.log('Success');
} else {
    console.log('Could not find the marker');
}
