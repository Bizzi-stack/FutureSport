import fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/data/pmcScrapedData.json', 'utf8'));

const changes = [
  { name: 'DEMAR STONE', num: 13 },
  { name: 'DASHAWN GRIFFITH', num: 12 },
  { name: 'WADE GIBSON', num: 15 },
  { name: 'RICO NURSE', num: 5 },
  { name: 'DANIEL DRUMMOND', num: 34 },
  { name: 'TERRIKE SMALL', num: 19 },
  { name: 'DENILSON HARTE', num: 17 },
];

changes.forEach(c => {
  const p = data.players.find(pl => pl.teamId === 30 && pl.name.toUpperCase().includes(c.name));
  if (p) { p.jerseyNumber = c.num; console.log('Updated: #' + c.num + ' ' + p.name); }
  else { console.log('NOT FOUND: ' + c.name); }
});

fs.writeFileSync('src/data/pmcScrapedData.json', JSON.stringify(data, null, 2));

// Bump cache: add v23 to purge list, change live key to v24
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(
  "'eduvision-pmc-students-v22'].forEach",
  "'eduvision-pmc-students-v22', 'eduvision-pmc-students-v23'].forEach"
);
code = code.replace(/eduvision-pmc-students-v23/g, 'eduvision-pmc-students-v24');
fs.writeFileSync('src/App.jsx', code);
console.log('Bumped cache to v24');
