/**
 * UEFA Champions League (UCL) Testing Sandbox Data
 * 
 * High-profile European clubs with verified star rosters for testing match capture,
 * tactical formations, lineup approvals, and official reporting in complete isolation
 * from the live Prime Minister's Cup production environment.
 */

export const UCL_YEARS = ['2026-2027'];

export const UCL_ROUNDS = [
  'League Phase',
  'Round of 16',
  'Quarter-Final',
  'Semi-Final',
  'Final'
];

export const UCL_STADIUMS = [
  'Santiago Bernabéu, Madrid',
  'Etihad Stadium, Manchester',
  'Allianz Arena, Munich',
  'Emirates Stadium, London',
  'Parc des Princes, Paris',
  'Spotify Camp Nou, Barcelona',
  'Anfield, Liverpool',
  'San Siro, Milan'
];

export const UCL_CLUBS = [
  {
    id: 'ucl-club-rm',
    name: 'Real Madrid CF',
    shortName: 'Real Madrid',
    stadium: 'Santiago Bernabéu, Madrid',
    country: 'Spain',
    primaryColor: '#FFFFFF',
    secondaryColor: '#00529F',
    accentColor: '#FEBE10',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
  },
  {
    id: 'ucl-club-mc',
    name: 'Manchester City FC',
    shortName: 'Man City',
    stadium: 'Etihad Stadium, Manchester',
    country: 'England',
    primaryColor: '#6CABDD',
    secondaryColor: '#1C2C5B',
    accentColor: '#FFFFFF',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
  },
  {
    id: 'ucl-club-bayern',
    name: 'FC Bayern Munich',
    shortName: 'Bayern Munich',
    stadium: 'Allianz Arena, Munich',
    country: 'Germany',
    primaryColor: '#DC052D',
    secondaryColor: '#0066B2',
    accentColor: '#FFFFFF',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
  },
  {
    id: 'ucl-club-arsenal',
    name: 'Arsenal FC',
    shortName: 'Arsenal',
    stadium: 'Emirates Stadium, London',
    country: 'England',
    primaryColor: '#EF0107',
    secondaryColor: '#063672',
    accentColor: '#9C824A',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
  },
  {
    id: 'ucl-club-psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    stadium: 'Parc des Princes, Paris',
    country: 'France',
    primaryColor: '#004170',
    secondaryColor: '#DA291C',
    accentColor: '#FFFFFF',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'
  },
  {
    id: 'ucl-club-barca',
    name: 'FC Barcelona',
    shortName: 'Barcelona',
    stadium: 'Spotify Camp Nou, Barcelona',
    country: 'Spain',
    primaryColor: '#A50044',
    secondaryColor: '#004D98',
    accentColor: '#EDBB00',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
  },
  {
    id: 'ucl-club-liv',
    name: 'Liverpool FC',
    shortName: 'Liverpool',
    stadium: 'Anfield, Liverpool',
    country: 'England',
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    accentColor: '#F6EB61',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'
  },
  {
    id: 'ucl-club-inter',
    name: 'FC Internazionale Milano',
    shortName: 'Inter Milan',
    stadium: 'San Siro, Milan',
    country: 'Italy',
    primaryColor: '#010E80',
    secondaryColor: '#000000',
    accentColor: '#D4AF37',
    division: 'League Phase',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'
  }
];

export const UCL_TEAMS = UCL_CLUBS.map(club => ({
  id: `${club.id}-team-UCL`,
  schoolId: club.id,
  name: `${club.shortName} (UCL Squad)`,
  ageGroup: 'UCL',
  division: club.division,
  groupNum: 1
}));

function createUclStatsTemplate(isGk) {
  const years = UCL_YEARS;
  const terms = ['Matchday 1', 'Matchday 2', 'Matchday 3'];
  const perf = {};
  years.forEach(y => {
    perf[y] = {};
    terms.forEach(t => {
      if (isGk) {
        perf[y][t] = {
          'Saves': 0,
          'Clean Sheets': 0,
          'Goals Conceded': 0,
          'Penalties Saved': 0,
          'Pass Completed': 0,
          'Punches': 0,
          'High Claims': 0
        };
      } else {
        perf[y][t] = {
          'Goals': 0,
          'Assists': 0,
          'Shots on Target': 0,
          'Shots': 0,
          'Shots Per Game': 0,
          'Shot Accuracy': 0,
          'Pass Completed': 0,
          'Successful Dribbles': 0,
          'Tackles Per Game': 0,
          'Interceptions Per Game': 0,
          'Successful Clearances': 0,
          'Successful Blocks': 0,
          'Corners Taken': 0,
          'Freekicks Taken': 0,
          'Penalties Taken': 0,
          'Successful Tackles': 0
        };
      }
    });
  });
  return perf;
}

const RAW_UCL_ROSTERS = {
  'ucl-club-rm': [
    { num: 1, name: 'Thibaut Courtois', pos: 'Goalkeeper', isStarter: true },
    { num: 2, name: 'Dani Carvajal', pos: 'Defender', isStarter: true },
    { num: 3, name: 'Éder Militão', pos: 'Defender', isStarter: true },
    { num: 22, name: 'Antonio Rüdiger', pos: 'Defender', isStarter: true },
    { num: 23, name: 'Ferland Mendy', pos: 'Defender', isStarter: true },
    { num: 8, name: 'Federico Valverde', pos: 'Midfielder', isStarter: true },
    { num: 14, name: 'Aurélien Tchouaméni', pos: 'Midfielder', isStarter: true },
    { num: 5, name: 'Jude Bellingham', pos: 'Midfielder', isStarter: true },
    { num: 6, name: 'Eduardo Camavinga', pos: 'Midfielder', isStarter: true },
    { num: 7, name: 'Vinícius Júnior', pos: 'Forward', isStarter: true },
    { num: 9, name: 'Kylian Mbappé', pos: 'Forward', isStarter: true },
    // Bench
    { num: 13, name: 'Andriy Lunin', pos: 'Goalkeeper', isStarter: false },
    { num: 10, name: 'Luka Modrić', pos: 'Midfielder', isStarter: false },
    { num: 11, name: 'Rodrygo', pos: 'Forward', isStarter: false },
    { num: 15, name: 'Arda Güler', pos: 'Midfielder', isStarter: false },
    { num: 16, name: 'Endrick', pos: 'Forward', isStarter: false },
    { num: 17, name: 'Lucas Vázquez', pos: 'Defender', isStarter: false },
    { num: 19, name: 'Dani Ceballos', pos: 'Midfielder', isStarter: false }
  ],
  'ucl-club-mc': [
    { num: 31, name: 'Ederson', pos: 'Goalkeeper', isStarter: true },
    { num: 2, name: 'Kyle Walker', pos: 'Defender', isStarter: true },
    { num: 3, name: 'Rúben Dias', pos: 'Defender', isStarter: true },
    { num: 24, name: 'Joško Gvardiol', pos: 'Defender', isStarter: true },
    { num: 25, name: 'Manuel Akanji', pos: 'Defender', isStarter: true },
    { num: 16, name: 'Rodri', pos: 'Midfielder', isStarter: true },
    { num: 17, name: 'Kevin De Bruyne', pos: 'Midfielder', isStarter: true },
    { num: 20, name: 'Bernardo Silva', pos: 'Midfielder', isStarter: true },
    { num: 47, name: 'Phil Foden', pos: 'Midfielder', isStarter: true },
    { num: 19, name: 'İlkay Gündoğan', pos: 'Midfielder', isStarter: true },
    { num: 9, name: 'Erling Haaland', pos: 'Forward', isStarter: true },
    // Bench
    { num: 18, name: 'Stefan Ortega', pos: 'Goalkeeper', isStarter: false },
    { num: 5, name: 'John Stones', pos: 'Defender', isStarter: false },
    { num: 6, name: 'Nathan Aké', pos: 'Defender', isStarter: false },
    { num: 10, name: 'Jack Grealish', pos: 'Forward', isStarter: false },
    { num: 11, name: 'Jérémy Doku', pos: 'Forward', isStarter: false },
    { num: 8, name: 'Mateo Kovačić', pos: 'Midfielder', isStarter: false },
    { num: 82, name: 'Rico Lewis', pos: 'Defender', isStarter: false }
  ],
  'ucl-club-bayern': [
    { num: 1, name: 'Manuel Neuer', pos: 'Goalkeeper', isStarter: true },
    { num: 6, name: 'Joshua Kimmich', pos: 'Defender', isStarter: true },
    { num: 2, name: 'Dayot Upamecano', pos: 'Defender', isStarter: true },
    { num: 3, name: 'Min-jae Kim', pos: 'Defender', isStarter: true },
    { num: 19, name: 'Alphonso Davies', pos: 'Defender', isStarter: true },
    { num: 45, name: 'Aleksandar Pavlović', pos: 'Midfielder', isStarter: true },
    { num: 8, name: 'Leon Goretzka', pos: 'Midfielder', isStarter: true },
    { num: 42, name: 'Jamal Musiala', pos: 'Midfielder', isStarter: true },
    { num: 17, name: 'Michael Olise', pos: 'Midfielder', isStarter: true },
    { num: 7, name: 'Serge Gnabry', pos: 'Forward', isStarter: true },
    { num: 9, name: 'Harry Kane', pos: 'Forward', isStarter: true },
    // Bench
    { num: 26, name: 'Sven Ulreich', pos: 'Goalkeeper', isStarter: false },
    { num: 25, name: 'Thomas Müller', pos: 'Forward', isStarter: false },
    { num: 10, name: 'Leroy Sané', pos: 'Forward', isStarter: false },
    { num: 11, name: 'Kingsley Coman', pos: 'Forward', isStarter: false },
    { num: 16, name: 'João Palhinha', pos: 'Midfielder', isStarter: false },
    { num: 22, name: 'Raphaël Guerreiro', pos: 'Defender', isStarter: false },
    { num: 15, name: 'Eric Dier', pos: 'Defender', isStarter: false }
  ],
  'ucl-club-arsenal': [
    { num: 22, name: 'David Raya', pos: 'Goalkeeper', isStarter: true },
    { num: 4, name: 'Ben White', pos: 'Defender', isStarter: true },
    { num: 2, name: 'William Saliba', pos: 'Defender', isStarter: true },
    { num: 6, name: 'Gabriel Magalhães', pos: 'Defender', isStarter: true },
    { num: 12, name: 'Jurriën Timber', pos: 'Defender', isStarter: true },
    { num: 5, name: 'Thomas Partey', pos: 'Midfielder', isStarter: true },
    { num: 41, name: 'Declan Rice', pos: 'Midfielder', isStarter: true },
    { num: 8, name: 'Martin Ødegaard', pos: 'Midfielder', isStarter: true },
    { num: 7, name: 'Bukayo Saka', pos: 'Forward', isStarter: true },
    { num: 29, name: 'Kai Havertz', pos: 'Forward', isStarter: true },
    { num: 11, name: 'Gabriel Martinelli', pos: 'Forward', isStarter: true },
    // Bench
    { num: 32, name: 'Neto', pos: 'Goalkeeper', isStarter: false },
    { num: 9, name: 'Gabriel Jesus', pos: 'Forward', isStarter: false },
    { num: 19, name: 'Leandro Trossard', pos: 'Forward', isStarter: false },
    { num: 20, name: 'Jorginho', pos: 'Midfielder', isStarter: false },
    { num: 23, name: 'Mikel Merino', pos: 'Midfielder', isStarter: false },
    { num: 30, name: 'Raheem Sterling', pos: 'Forward', isStarter: false },
    { num: 15, name: 'Jakub Kiwior', pos: 'Defender', isStarter: false }
  ],
  'ucl-club-psg': [
    { num: 1, name: 'Gianluigi Donnarumma', pos: 'Goalkeeper', isStarter: true },
    { num: 2, name: 'Achraf Hakimi', pos: 'Defender', isStarter: true },
    { num: 5, name: 'Marquinhos', pos: 'Defender', isStarter: true },
    { num: 51, name: 'Willian Pacho', pos: 'Defender', isStarter: true },
    { num: 25, name: 'Nuno Mendes', pos: 'Defender', isStarter: true },
    { num: 33, name: 'Warren Zaïre-Emery', pos: 'Midfielder', isStarter: true },
    { num: 17, name: 'Vitinha', pos: 'Midfielder', isStarter: true },
    { num: 8, name: 'Fabián Ruiz', pos: 'Midfielder', isStarter: true },
    { num: 10, name: 'Ousmane Dembélé', pos: 'Forward', isStarter: true },
    { num: 23, name: 'Randal Kolo Muani', pos: 'Forward', isStarter: true },
    { num: 29, name: 'Bradley Barcola', pos: 'Forward', isStarter: true },
    // Bench
    { num: 39, name: 'Matvey Safonov', pos: 'Goalkeeper', isStarter: false },
    { num: 35, name: 'Lucas Beraldo', pos: 'Defender', isStarter: false },
    { num: 21, name: 'Lucas Hernández', pos: 'Defender', isStarter: false },
    { num: 19, name: 'Kang-in Lee', pos: 'Midfielder', isStarter: false },
    { num: 11, name: 'Marco Asensio', pos: 'Forward', isStarter: false },
    { num: 14, name: 'Désiré Doué', pos: 'Forward', isStarter: false },
    { num: 24, name: 'Senny Mayulu', pos: 'Midfielder', isStarter: false }
  ],
  'ucl-club-barca': [
    { num: 1, name: 'Marc-André ter Stegen', pos: 'Goalkeeper', isStarter: true },
    { num: 23, name: 'Jules Koundé', pos: 'Defender', isStarter: true },
    { num: 2, name: 'Pau Cubarsí', pos: 'Defender', isStarter: true },
    { num: 5, name: 'Íñigo Martínez', pos: 'Defender', isStarter: true },
    { num: 3, name: 'Alejandro Balde', pos: 'Defender', isStarter: true },
    { num: 17, name: 'Marc Casadó', pos: 'Midfielder', isStarter: true },
    { num: 8, name: 'Pedri', pos: 'Midfielder', isStarter: true },
    { num: 20, name: 'Dani Olmo', pos: 'Midfielder', isStarter: true },
    { num: 19, name: 'Lamine Yamal', pos: 'Forward', isStarter: true },
    { num: 9, name: 'Robert Lewandowski', pos: 'Forward', isStarter: true },
    { num: 11, name: 'Raphinha', pos: 'Forward', isStarter: true },
    // Bench
    { num: 13, name: 'Iñaki Peña', pos: 'Goalkeeper', isStarter: false },
    { num: 4, name: 'Ronald Araújo', pos: 'Defender', isStarter: false },
    { num: 6, name: 'Gavi', pos: 'Midfielder', isStarter: false },
    { num: 7, name: 'Ferran Torres', pos: 'Forward', isStarter: false },
    { num: 21, name: 'Frenkie de Jong', pos: 'Midfielder', isStarter: false },
    { num: 16, name: 'Fermín López', pos: 'Midfielder', isStarter: false },
    { num: 10, name: 'Ansu Fati', pos: 'Forward', isStarter: false }
  ],
  'ucl-club-liv': [
    { num: 1, name: 'Alisson Becker', pos: 'Goalkeeper', isStarter: true },
    { num: 66, name: 'Trent Alexander-Arnold', pos: 'Defender', isStarter: true },
    { num: 5, name: 'Ibrahima Konaté', pos: 'Defender', isStarter: true },
    { num: 4, name: 'Virgil van Dijk', pos: 'Defender', isStarter: true },
    { num: 26, name: 'Andy Robertson', pos: 'Defender', isStarter: true },
    { num: 38, name: 'Ryan Gravenberch', pos: 'Midfielder', isStarter: true },
    { num: 10, name: 'Alexis Mac Allister', pos: 'Midfielder', isStarter: true },
    { num: 8, name: 'Dominik Szoboszlai', pos: 'Midfielder', isStarter: true },
    { num: 11, name: 'Mohamed Salah', pos: 'Forward', isStarter: true },
    { num: 20, name: 'Diogo Jota', pos: 'Forward', isStarter: true },
    { num: 7, name: 'Luis Díaz', pos: 'Forward', isStarter: true },
    // Bench
    { num: 62, name: 'Caoimhín Kelleher', pos: 'Goalkeeper', isStarter: false },
    { num: 18, name: 'Cody Gakpo', pos: 'Forward', isStarter: false },
    { num: 9, name: 'Darwin Núñez', pos: 'Forward', isStarter: false },
    { num: 17, name: 'Curtis Jones', pos: 'Midfielder', isStarter: false },
    { num: 3, name: 'Wataru Endō', pos: 'Midfielder', isStarter: false },
    { num: 21, name: 'Kostas Tsimikas', pos: 'Defender', isStarter: false },
    { num: 2, name: 'Joe Gomez', pos: 'Defender', isStarter: false }
  ],
  'ucl-club-inter': [
    { num: 1, name: 'Yann Sommer', pos: 'Goalkeeper', isStarter: true },
    { num: 28, name: 'Benjamin Pavard', pos: 'Defender', isStarter: true },
    { num: 15, name: 'Francesco Acerbi', pos: 'Defender', isStarter: true },
    { num: 95, name: 'Alessandro Bastoni', pos: 'Defender', isStarter: true },
    { num: 2, name: 'Denzel Dumfries', pos: 'Defender', isStarter: true },
    { num: 32, name: 'Federico Dimarco', pos: 'Defender', isStarter: true },
    { num: 23, name: 'Nicolò Barella', pos: 'Midfielder', isStarter: true },
    { num: 20, name: 'Hakan Çalhanoğlu', pos: 'Midfielder', isStarter: true },
    { num: 22, name: 'Henrikh Mkhitaryan', pos: 'Midfielder', isStarter: true },
    { num: 10, name: 'Lautaro Martínez', pos: 'Forward', isStarter: true },
    { num: 9, name: 'Marcus Thuram', pos: 'Forward', isStarter: true },
    // Bench
    { num: 13, name: 'Josep Martínez', pos: 'Goalkeeper', isStarter: false },
    { num: 6, name: 'Stefan de Vrij', pos: 'Defender', isStarter: false },
    { num: 7, name: 'Piotr Zieliński', pos: 'Midfielder', isStarter: false },
    { num: 16, name: 'Davide Frattesi', pos: 'Midfielder', isStarter: false },
    { num: 99, name: 'Mehdi Taremi', pos: 'Forward', isStarter: false },
    { num: 30, name: 'Carlos Augusto', pos: 'Defender', isStarter: false },
    { num: 36, name: 'Matteo Darmian', pos: 'Defender', isStarter: false }
  ]
};

// Process complete list of UCL players
export const UCL_PLAYERS = [];

Object.entries(RAW_UCL_ROSTERS).forEach(([clubId, players]) => {
  const teamId = `${clubId}-team-UCL`;
  players.forEach((p, idx) => {
    const playerId = `${clubId}-p${idx + 1}`;
    const isGk = p.pos === 'Goalkeeper';
    const teamAssignments = {};
    UCL_YEARS.forEach(y => { teamAssignments[y] = teamId; });

    UCL_PLAYERS.push({
      id: playerId,
      name: p.name,
      schoolId: clubId,
      position: p.pos,
      grade: 'Senior',
      number: p.num,
      isStarter: p.isStarter,
      teamAssignments,
      performance: createUclStatsTemplate(isGk)
    });
  });
});

// Helper to get Starting XI and bench player IDs for a club
export function getUclClubSquad(clubId) {
  const clubPlayers = UCL_PLAYERS.filter(p => p.schoolId === clubId);
  const startingXI = clubPlayers.filter(p => p.isStarter).map(p => p.id);
  const benchPlayers = clubPlayers.filter(p => !p.isStarter).map(p => p.id);
  return {
    startingXI: startingXI.length >= 11 ? startingXI.slice(0, 11) : clubPlayers.slice(0, 11).map(p => p.id),
    benchPlayers: benchPlayers.length > 0 ? benchPlayers : clubPlayers.slice(11).map(p => p.id)
  };
}

// Initial UCL Fixtures for the Testing Sandbox
const rmSquad = getUclClubSquad('ucl-club-rm');
const mcSquad = getUclClubSquad('ucl-club-mc');
const bayernSquad = getUclClubSquad('ucl-club-bayern');
const arsenalSquad = getUclClubSquad('ucl-club-arsenal');
const psgSquad = getUclClubSquad('ucl-club-psg');
const barcaSquad = getUclClubSquad('ucl-club-barca');
const livSquad = getUclClubSquad('ucl-club-liv');
const interSquad = getUclClubSquad('ucl-club-inter');

export const UCL_INITIAL_MATCHES = [
  {
    id: 'ucl-sandbox-match-1',
    tournament: 'UEFA Champions League',
    tournamentId: 'UCL',
    homeTeamId: 'ucl-club-rm-team-UCL',
    awayTeamId: 'ucl-club-mc-team-UCL',
    homeSchoolId: 'ucl-club-rm',
    awaySchoolId: 'ucl-club-mc',
    ageGroup: 'UCL',
    division: 'League Phase',
    matchday: 'Matchday 1',
    venue: 'Santiago Bernabéu, Madrid',
    referee: 'Michael Beckles',
    commissioner: 'Wren',
    status: 'live',
    currentHalf: '1H',
    matchTime: '28:15',
    homeScore: 1,
    awayScore: 0,
    homeSquadSelection: {
      startingXI: rmSquad.startingXI,
      benchPlayers: rmSquad.benchPlayers,
      substitutes: rmSquad.benchPlayers,
      formation: '4-3-3',
      submittedAt: Date.now() - 3600000
    },
    awaySquadSelection: {
      startingXI: mcSquad.startingXI,
      benchPlayers: mcSquad.benchPlayers,
      substitutes: mcSquad.benchPlayers,
      formation: '4-2-3-1',
      submittedAt: Date.now() - 3600000
    },
    liveState: {
      period: '1H',
      isRunning: true,
      elapsedOffset: 28 * 60 + 15,
      possession: {
        homeSecs: 920,
        awaySecs: 670,
        contestSecs: 105,
        activeSide: 'home'
      }
    },
    playerStats: {
      'ucl-club-rm-p10': { // Vinícius Júnior
        minutesPlayed: 28,
        Goals: 1,
        Assists: 0,
        Shots: 2,
        'Shots on Target': 1
      },
      'ucl-club-rm-p8': { // Jude Bellingham
        minutesPlayed: 28,
        Goals: 0,
        Assists: 1,
        Shots: 1,
        'Shots on Target': 1
      },
      'ucl-club-rm-p1': { // Thibaut Courtois
        minutesPlayed: 28,
        Saves: 2,
        GoalsConceded: 0
      },
      'ucl-club-mc-p11': { // Erling Haaland
        minutesPlayed: 28,
        Goals: 0,
        Assists: 0,
        Shots: 2,
        'Shots on Target': 2
      }
    },
    timeline: [
      {
        id: 'ucl-ev-1',
        elapsed: 18 * 60 + 40,
        period: '1H',
        type: 'goal',
        playerId: 'ucl-club-rm-p10',
        playerName: 'Vinícius Júnior',
        assistPlayerId: 'ucl-club-rm-p8',
        assistPlayerName: 'Jude Bellingham',
        team: 'home',
        goalType: 'foot'
      }
    ],
    tombstoneEventIds: [],
    isSandboxMatch: true,
    isUclMatch: true,
    isPmc: false,
    date: new Date().toISOString()
  },
  {
    id: 'ucl-sandbox-match-2',
    tournament: 'UEFA Champions League',
    tournamentId: 'UCL',
    homeTeamId: 'ucl-club-bayern-team-UCL',
    awayTeamId: 'ucl-club-arsenal-team-UCL',
    homeSchoolId: 'ucl-club-bayern',
    awaySchoolId: 'ucl-club-arsenal',
    ageGroup: 'UCL',
    division: 'League Phase',
    matchday: 'Matchday 1',
    venue: 'Allianz Arena, Munich',
    referee: 'Dave Yearwood',
    commissioner: 'Karen Thorne',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    homeSquadSelection: {
      startingXI: bayernSquad.startingXI,
      benchPlayers: bayernSquad.benchPlayers,
      substitutes: bayernSquad.benchPlayers,
      formation: '4-2-3-1'
    },
    awaySquadSelection: {
      startingXI: arsenalSquad.startingXI,
      benchPlayers: arsenalSquad.benchPlayers,
      substitutes: arsenalSquad.benchPlayers,
      formation: '4-3-3'
    },
    playerStats: {},
    timeline: [],
    tombstoneEventIds: [],
    isSandboxMatch: true,
    isUclMatch: true,
    isPmc: false,
    date: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 'ucl-sandbox-match-3',
    tournament: 'UEFA Champions League',
    tournamentId: 'UCL',
    homeTeamId: 'ucl-club-psg-team-UCL',
    awayTeamId: 'ucl-club-barca-team-UCL',
    homeSchoolId: 'ucl-club-psg',
    awaySchoolId: 'ucl-club-barca',
    ageGroup: 'UCL',
    division: 'League Phase',
    matchday: 'Matchday 1',
    venue: 'Parc des Princes, Paris',
    referee: 'Adrian Hunte',
    commissioner: 'Wren',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    homeSquadSelection: {
      startingXI: psgSquad.startingXI,
      benchPlayers: psgSquad.benchPlayers,
      substitutes: psgSquad.benchPlayers,
      formation: '4-3-3'
    },
    awaySquadSelection: {
      startingXI: barcaSquad.startingXI,
      benchPlayers: barcaSquad.benchPlayers,
      substitutes: barcaSquad.benchPlayers,
      formation: '4-3-3'
    },
    playerStats: {},
    timeline: [],
    tombstoneEventIds: [],
    isSandboxMatch: true,
    isUclMatch: true,
    isPmc: false,
    date: new Date(Date.now() + 172800000).toISOString()
  },
  {
    id: 'ucl-sandbox-match-4',
    tournament: 'UEFA Champions League',
    tournamentId: 'UCL',
    homeTeamId: 'ucl-club-liv-team-UCL',
    awayTeamId: 'ucl-club-inter-team-UCL',
    homeSchoolId: 'ucl-club-liv',
    awaySchoolId: 'ucl-club-inter',
    ageGroup: 'UCL',
    division: 'League Phase',
    matchday: 'Matchday 1',
    venue: 'Anfield, Liverpool',
    referee: 'Michael Beckles',
    commissioner: 'Karen Thorne',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    homeSquadSelection: {
      startingXI: livSquad.startingXI,
      benchPlayers: livSquad.benchPlayers,
      substitutes: livSquad.benchPlayers,
      formation: '4-3-3'
    },
    awaySquadSelection: {
      startingXI: interSquad.startingXI,
      benchPlayers: interSquad.benchPlayers,
      substitutes: interSquad.benchPlayers,
      formation: '3-5-2'
    },
    playerStats: {},
    timeline: [],
    tombstoneEventIds: [],
    isSandboxMatch: true,
    isUclMatch: true,
    isPmc: false,
    date: new Date(Date.now() + 259200000).toISOString()
  }
];
