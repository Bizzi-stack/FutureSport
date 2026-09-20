import fs from 'fs';

let code = fs.readFileSync('src/data/matchOfficialAccounts.js', 'utf8');

const newCommentators = `
    commentator: [
        {
            id: 'comm_1',
            username: 'commentator1',
            name: 'Broadcast Commentator 1',
            email: 'commentator1@pmcup.bb',
            password: 'password123',
            role: 'commentator',
            assignedMatchIds: [] // They will see all matches dynamically, or we assign them here. We can leave it blank and handle it in the portal.
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
    ]`;

const lastBracketIdx = code.lastIndexOf(']');
const braceIdx = code.indexOf('};', lastBracketIdx);
if (braceIdx !== -1) {
  code = code.substring(0, lastBracketIdx + 1) + ',\n' + newCommentators + '\n' + code.substring(braceIdx);
  code = code.replace(/eduvision-match-officials-v[0-9]+/, 'eduvision-match-officials-v8');
  fs.writeFileSync('src/data/matchOfficialAccounts.js', code);
  console.log('Success');
} else {
  console.log('Failed to find insertion point');
}
