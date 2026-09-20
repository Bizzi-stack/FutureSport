import fs from 'fs';

const dataPath = 'src/data/pmcScrapedData.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const brittonsPlayers = [
  { n: '1', name: 'Ziah Franklyn', pos: 'GK' },
  { n: '2', name: 'Mario Albert', pos: 'GK' },
  { n: '3', name: 'Engozy Reid', pos: 'FIELD' },
  { n: '4', name: 'Jafari Watson', pos: 'FIELD' },
  { n: '5', name: 'Eriq Puckerin', pos: 'FIELD' },
  { n: '6', name: 'Aaron Reid-Cox', pos: 'FIELD' },
  { n: '7', name: 'Donte Gill', pos: 'FIELD' },
  { n: '8', name: 'Tranikko Browne-Carter', pos: 'FIELD' },
  { n: '9', name: 'Rashaun Hoyte', pos: 'FIELD' },
  { n: '10', name: 'Akeem Gibbons', pos: 'FIELD' },
  { n: '11', name: 'Brian Stuart', pos: 'FIELD' },
  { n: '12', name: 'Zayvion Welch', pos: 'FIELD' },
  { n: '13', name: 'Ray Snagg', pos: 'FIELD' },
  { n: '14', name: 'Shaquan Collymore', pos: 'FIELD' },
  { n: '15', name: 'Raheim Walcott', pos: 'FIELD' },
  { n: '16', name: "T'Shane Lorde", pos: 'FIELD' },
  { n: '17', name: 'Antonio Rodney', pos: 'FIELD' },
  { n: '18', name: 'Romario Dennie', pos: 'FIELD' },
  { n: '19', name: 'Jalen Branch', pos: 'FIELD' }
];

// Clean out existing Britton's Hill players just in case
data.players = data.players.filter(p => p.teamId !== 5);

const mapPlayer = (p, teamId, idx) => ({
  "number": p.n,
  "nationality": "Barbados",
  "cloudUpdatedAt": new Date().toISOString(),
  "id": `${teamId}_${idx}`,
  "position": p.pos,
  "teamId": teamId,
  "name": p.name,
  "status": "active",
  "cloudCollection": "players"
});

data.players.push(...brittonsPlayers.map((p, i) => mapPlayer(p, 5, i)));

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

// Bump cache in App.jsx
const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');
appCode = appCode.replaceAll('eduvision-pmc-students-v12', 'eduvision-pmc-students-v13');
appCode = appCode.replace("'eduvision-pmc-students-v11']", "'eduvision-pmc-students-v11', 'eduvision-pmc-students-v12']");
fs.writeFileSync(appPath, appCode);

console.log("Britton's Hill added and cache bumped!");
