import fs from 'fs';

let code = fs.readFileSync('src/data/matchOfficialAccounts.js', 'utf8');

const newAccount = `        {
            id: 'comm_pmcup',
            username: 'pmcupofficial',
            name: 'PMC Official Commentator',
            email: 'pmcupofficial@pmcup.bb',
            password: 'pmcup2026',
            role: 'commentator',
            assignedMatchIds: []
        },`;

code = code.replace(/commentator:\s*\[/, 'commentator: [\n' + newAccount);
code = code.replace(/eduvision-match-officials-v[0-9]+/, 'eduvision-match-officials-v10');

fs.writeFileSync('src/data/matchOfficialAccounts.js', code);
console.log('Account added!');
