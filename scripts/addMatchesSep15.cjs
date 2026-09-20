const fs = require('fs');

const dataPath = 'src/data/pmcScrapedData.json';
const matchesPath = 'src/data/pmcInitialMatches.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

// Add missing teams
const newTeams = [
  {
    "primaryColor": "#ff6600", // Orange
    "venue": "Friendship",
    "uid": "team_27_pinelands-united",
    "shortName": "PIN",
    "visible": true,
    "logo": "",
    "status": "active",
    "name": "PINELANDS UNITED",
    "coach": "Samuel Murray",
    "cloudUpdatedAt": new Date().toISOString(),
    "id": 27,
    "description": "Team colours: Pine lands Orange, black shorts, Orange socks",
    "secondaryColor": "#000000",
    "featured": false,
    "cloudCollection": "teams",
    "division": "Group A"
  },
  {
    "primaryColor": "#000000", // Black
    "venue": "Friendship",
    "uid": "team_28_ivy-rovers",
    "shortName": "IVY",
    "visible": true,
    "logo": "",
    "status": "active",
    "name": "IVY ROVERS",
    "coach": "Bryan Neblett",
    "cloudUpdatedAt": new Date().toISOString(),
    "id": 28,
    "description": "Black Jersey highlighted with yellow, Black shorts, Black sock",
    "secondaryColor": "#ffff00",
    "featured": false,
    "cloudCollection": "teams",
    "division": "Group B"
  }
];

newTeams.forEach(t => {
  if (!data.teams.find(existing => existing.id === t.id)) {
    data.teams.push(t);
  }
});

const pinelandsPlayers = [
  {n: '01', name: 'Zico Callender', pos: 'GK'},
  {n: '13', name: 'Jeremy Foster', pos: 'FIELD'},
  {n: '05', name: 'Lamario Springer', pos: 'FIELD'},
  {n: '07', name: 'Ronaldo Clarke', pos: 'FIELD'},
  {n: '15', name: 'Re-Shawn Johnson', pos: 'FIELD'},
  {n: '19', name: 'Oshea Grant', pos: 'FIELD'},
  {n: '18', name: 'Raycio Jeffrey', pos: 'FIELD'},
  {n: '02', name: 'Deshone White', pos: 'FIELD'},
  {n: '20', name: 'Raquelme Shepherd', pos: 'FIELD'},
  {n: '17', name: 'Ronaldo Newton', pos: 'FIELD'},
  {n: '04', name: 'Trevor Mayers', pos: 'FIELD'},
  {n: '08', name: 'Lamar Scantlebury', pos: 'FIELD'},
  {n: '12', name: 'Kaheem Layne', pos: 'FIELD'},
  {n: '14', name: 'Nikkolai Lashley', pos: 'FIELD'},
  {n: '23', name: 'Nicholas Griffith', pos: 'FIELD'},
  {n: '09', name: 'Nathan Broomes', pos: 'FIELD'},
  {n: '11', name: 'Daviere Grimes', pos: 'FIELD'},
  {n: '25', name: 'Shane Campbell', pos: 'FIELD'}
];

const ivyPlayers = [
  {n: '1', name: 'Ronaldo Bailey', pos: 'FIELD'},
  {n: '2', name: 'Ramario Carter', pos: 'FIELD'},
  {n: '3', name: 'Darian Maloney', pos: 'FIELD'},
  {n: '4', name: 'Rashad Burke', pos: 'FIELD'},
  {n: '5', name: 'Erin Brathwaite', pos: 'FIELD'},
  {n: '6', name: 'Shakron Jack', pos: 'FIELD'},
  {n: '7', name: 'Danico Blenman', pos: 'FIELD'},
  {n: '8', name: 'Jarad Maxius', pos: 'FIELD'},
  {n: '9', name: 'Shawneko Moore', pos: 'FIELD'},
  {n: '10', name: 'Revira Cottle', pos: 'FIELD'},
  {n: '11', name: 'Kymanni Cruickshank', pos: 'FIELD'},
  {n: '12', name: 'Jamario Nicholls', pos: 'FIELD'},
  {n: '13', name: 'Akeil Selman', pos: 'FIELD'},
  {n: '14', name: 'Jacoby Marshall', pos: 'FIELD'},
  {n: '15', name: 'Antwan Lovell', pos: 'FIELD'},
  {n: '16', name: 'Shem Jordan', pos: 'FIELD'},
  {n: '17', name: 'Davon Sam', pos: 'FIELD'},
  {n: '18', name: 'Rashon Howell', pos: 'FIELD'}
];

const lionsPlayers = [
  {n: '1', name: 'Leonardo Saunders', pos: 'GK'},
  {n: '2', name: 'Romario Reid', pos: 'FIELD'},
  {n: '3', name: 'Zico Greaves', pos: 'FIELD'},
  {n: '4', name: 'Kadeem Atwell', pos: 'FIELD'},
  {n: '5', name: 'Ramon Griffith', pos: 'FIELD'},
  {n: '6', name: 'Javari Mitchell', pos: 'FIELD'},
  {n: '7', name: 'Darico King', pos: 'FIELD'}, // CPT handled in UI
  {n: '8', name: 'Jomol Williams', pos: 'FIELD'},
  {n: '9', name: 'Matthew Ellis', pos: 'FIELD'},
  {n: '10', name: 'Thierry Bradshaw', pos: 'FIELD'},
  {n: '11', name: 'Kymani Cox', pos: 'FIELD'},
  {n: '12', name: 'Javaun Taylor', pos: 'FIELD'},
  {n: '13', name: 'Shamario Smith', pos: 'FIELD'},
  {n: '14', name: 'Amari Griffith', pos: 'FIELD'},
  {n: '15', name: 'Josimar Skinner', pos: 'FIELD'},
  {n: '16', name: 'Devante Munroe', pos: 'FIELD'},
  {n: '17', name: 'Rashad Phillips', pos: 'FIELD'},
  {n: '18', name: 'Omar Harris', pos: 'FIELD'},
  {n: '19', name: 'Comar Clarke', pos: 'FIELD'},
  {n: '20', name: 'Okeefe Yearwood', pos: 'FIELD'}
];

// Delete existing players for these teams to avoid duplicates
data.players = data.players.filter(p => ![27, 28, 1].includes(p.teamId));

const mapPlayer = (p, teamId, idx) => ({
  "number": p.n,
  "nationality": "Barbados",
  "cloudUpdatedAt": new Date().toISOString(),
  "id": `${teamId}_${idx}`, // unique temp id, mapped in dataloader
  "position": p.pos,
  "teamId": teamId,
  "name": p.name,
  "status": "active",
  "cloudCollection": "players"
});

data.players.push(...pinelandsPlayers.map((p, i) => mapPlayer(p, 27, i)));
data.players.push(...ivyPlayers.map((p, i) => mapPlayer(p, 28, i)));
data.players.push(...lionsPlayers.map((p, i) => mapPlayer(p, 1, i)));

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

// Update matches
matches = matches.filter(m => m.id !== 'pmc-fixture-7' && m.id !== 'pmc-fixture-8');

matches.push({
  "id": "pmc-fixture-7",
  "date": "2026-09-15T19:00:00.000Z",
  "time": "19:00",
  "year": "2026-2027",
  "round": "Group Stage",
  "matchday": "Matchday 4 · PMC Group Stage",
  "venue": "Friendship",
  "ageGroup": "Senior",
  "homeTeam": "PINELANDS UNITED",
  "awayTeam": "IVY ROVERS",
  "homeTeamId": "pmc-club-27",
  "awayTeamId": "pmc-club-28",
  "referee": "N. Greaves",
  "commissioner": "Wren / Aundrea",
  "operator": "Jonathan",
  "status": "scheduled",
  "homeScore": 0,
  "awayScore": 0,
  "events": [],
  "timeline": [],
  "playerStats": {},
  "homeSquadSelection": null,
  "awaySquadSelection": null,
  "teamSheetApproved": false,
  "teamSheetApprovedBy": null,
  "homeTechnicalStaff": ["Martin Newton (Manager)", "Samuel Murray (Coach)", "Stephen Grant (Asst Coach)", "Reg-Marie Parris (Medic)", "Sherisa Brathwaite (Medic)"],
  "awayTechnicalStaff": ["Bryan Neblett (Coach)", "Tarik Boyce (Asst Coach)", "Janelle Stevenson (Manager)", "J'Noire Gittens (MEDIC)"],
  "substitutionRequests": [],
  "tombstoneEventIds": [],
  "countdownProtocol": [
    { "id": "cp1", "timeBefore": 90, "action": "Team Arrival & Dressing Room Access", "location": "Dressing Rooms", "completed": false },
    { "id": "cp2", "timeBefore": 60, "action": "Match Officials Pitch Inspection", "location": "Field of Play", "completed": false },
    { "id": "cp3", "timeBefore": 50, "action": "Warm-ups Commence", "location": "Field of Play", "completed": false },
    { "id": "cp4", "timeBefore": 15, "action": "Warm-ups Conclude & Return to Dressing Rooms", "location": "Dressing Rooms", "completed": false },
    { "id": "cp5", "timeBefore": 10, "action": "Teams & Officials Assemble in Tunnel", "location": "Tunnel", "completed": false },
    { "id": "cp6", "timeBefore": 5, "action": "Teams Enter Field & Formalities", "location": "Field of Play", "completed": false },
    { "id": "cp7", "timeBefore": 0, "action": "Kick-Off", "location": "Field of Play", "completed": false }
  ],
  "homePlayers": [],
  "awayPlayers": []
});

matches.push({
  "id": "pmc-fixture-8",
  "date": "2026-09-15T21:00:00.000Z",
  "time": "21:00",
  "year": "2026-2027",
  "round": "Group Stage",
  "matchday": "Matchday 4 · PMC Group Stage",
  "venue": "Friendship",
  "ageGroup": "Senior",
  "homeTeam": "BRITTON'S HILL",
  "awayTeam": "ST. ANDREW LIONS",
  "homeTeamId": "pmc-club-5",
  "awayTeamId": "pmc-club-1",
  "referee": "S. Thorne",
  "commissioner": "Wren / Aundrea",
  "operator": "Jonathan",
  "status": "scheduled",
  "homeScore": 0,
  "awayScore": 0,
  "events": [],
  "timeline": [],
  "playerStats": {},
  "homeSquadSelection": null,
  "awaySquadSelection": null,
  "teamSheetApproved": false,
  "teamSheetApprovedBy": null,
  "substitutionRequests": [],
  "tombstoneEventIds": [],
  "countdownProtocol": [
    { "id": "cp1", "timeBefore": 90, "action": "Team Arrival & Dressing Room Access", "location": "Dressing Rooms", "completed": false },
    { "id": "cp2", "timeBefore": 60, "action": "Match Officials Pitch Inspection", "location": "Field of Play", "completed": false },
    { "id": "cp3", "timeBefore": 50, "action": "Warm-ups Commence", "location": "Field of Play", "completed": false },
    { "id": "cp4", "timeBefore": 15, "action": "Warm-ups Conclude & Return to Dressing Rooms", "location": "Dressing Rooms", "completed": false },
    { "id": "cp5", "timeBefore": 10, "action": "Teams & Officials Assemble in Tunnel", "location": "Tunnel", "completed": false },
    { "id": "cp6", "timeBefore": 5, "action": "Teams Enter Field & Formalities", "location": "Field of Play", "completed": false },
    { "id": "cp7", "timeBefore": 0, "action": "Kick-Off", "location": "Field of Play", "completed": false }
  ],
  "homePlayers": [],
  "awayPlayers": []
});

fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
console.log('Added teams, players, and fixtures.');
