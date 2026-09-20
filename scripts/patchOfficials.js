import fs from 'fs';

const filePath = 'src/data/matchOfficialAccounts.js';
let content = fs.readFileSync(filePath, 'utf8');

const matchesToAppend = ['pmc-fixture-7', 'pmc-fixture-8'];

// Simple hack: add matches to all existing 'assignedMatchIds: [ ... ]' arrays
matchesToAppend.forEach(matchId => {
    content = content.replace(/assignedMatchIds:\s*\[([^\]]*)\]/g, (match, inner) => {
        if (inner.includes(matchId)) return match;
        const newInner = inner.trim() ? `${inner}, '${matchId}'` : `'${matchId}'`;
        return `assignedMatchIds: [${newInner}]`;
    });
});

// Since the new refs might not exist, we just add them to the DEFAULT_OFFICIALS object
// Let's find the `referee: [` line and inject the new referees
const newReferees = `
        { id: 'ref_n_greaves', username: 'n.greaves', name: 'Norman Greaves', email: 'n.greaves@pmcup.bb', password: 'password123', role: 'referee', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
        { id: 'ref_e_williams', username: 'e.williams', name: 'Elvis Williams', email: 'e.williams@pmcup.bb', password: 'password123', role: 'referee', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
        { id: 'ref_m_williams', username: 'm.williams', name: 'Michael Williams', email: 'm.williams@pmcup.bb', password: 'password123', role: 'referee', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
        { id: 'ref_s_thorne', username: 's.thorne', name: 'Seth Thorne', email: 's.thorne@pmcup.bb', password: 'password123', role: 'referee', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
        { id: 'ref_l_crichlow', username: 'l.crichlow', name: 'Latrall Crichlow', email: 'l.crichlow@pmcup.bb', password: 'password123', role: 'referee', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
        { id: 'ref_s_hill', username: 's.hill', name: 'Sadiq Hill', email: 's.hill@pmcup.bb', password: 'password123', role: 'referee', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
`;

const newFourthOfficials = `
        { id: 'fo_i_watkins', username: 'fo.i.watkins', name: 'Ishmael Watkins', email: 'i.watkins@pmcup.bb', password: 'password123', role: 'fourth-official', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
        { id: 'fo_a_herbert', username: 'a.herbert', name: 'Andrew Herbert', email: 'a.herbert@pmcup.bb', password: 'password123', role: 'fourth-official', assignedMatchIds: ['pmc-fixture-7', 'pmc-fixture-8'] },
`;

content = content.replace(/referee:\s*\[/, `referee: [\n${newReferees}`);
content = content.replace(/['"]fourth-official['"]:\s*\[/, `'fourth-official': [\n${newFourthOfficials}`);

// Bump cache key
content = content.replace(/eduvision-match-officials-v[0-9]+/, 'eduvision-match-officials-v6');

fs.writeFileSync(filePath, content);
console.log('Officials updated!');
