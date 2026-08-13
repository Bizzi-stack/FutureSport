import pmcData from '../data/pmcScrapedData.json';

export const PMC_YEARS = ['2026-2027'];
const YEARS = PMC_YEARS;
const TERMS = ['Matchday 1', 'Matchday 2', 'Matchday 3'];

// Mulberry32 RNG for consistent mock performance generation on scraped PMC players
function mulberry32(seed) {
    let s = seed >>> 0;
    return () => {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// 1. Process Schools / Clubs
export const PMC_SCHOOLS = pmcData.teams.map((t, idx) => ({
    id: `pmc-club-${t.id}`,
    name: t.name || `Club ${t.id}`,
    logo: t.logo || (idx % 3 === 0 ? '/Harrison College.png' : idx % 3 === 1 ? '/Queens College.png' : '/Combermere.png'),
    primaryColor: t.primaryColor || '#00267F',
    secondaryColor: t.secondaryColor || '#FFC726',
    division: t.division || 'Group A',
    rawId: t.id
}));

// 2. Process Teams (categorized per club)
export const PMC_TEAMS = [];
PMC_SCHOOLS.forEach(school => {
    PMC_TEAMS.push({
        id: `${school.id}-team-PMC`,
        schoolId: school.id,
        name: `${school.name} (${school.division})`,
        ageGroup: 'PMC',
        groupNum: 1
    });
});

// Helper for random performance stats
function generatePmcPerformance(rng, isGk) {
    const perf = {};
    YEARS.forEach(y => {
        perf[y] = {};
        TERMS.forEach(t => {
            if (isGk) {
                const saves = Math.floor(rng() * 15) + 5;
                const conceded = Math.floor(rng() * 8);
                perf[y][t] = {
                    'Saves': saves,
                    'Clean Sheets': rng() < 0.4 ? 1 : 0,
                    'Goals Conceded': conceded,
                    'Penalties Saved': rng() < 0.2 ? 1 : 0,
                    'Pass Completed': Math.floor(rng() * 30) + 60,
                    'Punches': Math.floor(rng() * 6),
                    'High Claims': Math.floor(rng() * 8)
                };
            } else {
                const goals = Math.floor(rng() * 5);
                const shotsOnTarget = goals + Math.floor(rng() * 8);
                const shots = shotsOnTarget + Math.floor(rng() * 6);
                perf[y][t] = {
                    'Goals': goals,
                    'Assists': Math.floor(rng() * 4),
                    'Shots on Target': shotsOnTarget,
                    'Shots': shots,
                    'Shots Per Game': Number((shots / 3).toFixed(1)),
                    'Shot Accuracy': shots > 0 ? Math.round((shotsOnTarget / shots) * 100) : 0,
                    'Pass Completed': Math.floor(rng() * 30) + 65,
                    'Successful Dribbles': Math.floor(rng() * 10),
                    'Tackles Per Game': Number((rng() * 4).toFixed(1)),
                    'Interceptions Per Game': Number((rng() * 3).toFixed(1)),
                    'Successful Clearances': Math.floor(rng() * 6),
                    'Successful Blocks': Math.floor(rng() * 4),
                    'Corners Taken': Math.floor(rng() * 5),
                    'Freekicks Taken': Math.floor(rng() * 3),
                    'Penalties Taken': Math.floor(rng() * 2),
                    'Successful Tackles': Math.floor(rng() * 8)
                };
            }
        });
    });
    return perf;
}

// 3. Process Players / Students — Guaranteed 25 players for EVERY club
const FIRST_NAMES = ["Jamal", "Kevon", "Dario", "Rohan", "Tariq", "Tyrese", "Devonte", "Rashad", "Kobe", "Zico", "Jadon", "Malik", "Shakille", "Kaelen", "Kofi", "Neymar", "Christian", "Raheem", "Marcus", "Andre", "Damian", "Jevon", "Micah", "Romario", "Javonte"];
const LAST_NAMES = ["Smith", "Forde", "Haynes", "Alleyne", "Beckles", "Clarke", "Goddard", "Nurse", "Inniss", "Weekes", "Yearwood", "Hunte", "Brathwaite", "Trotman", "Holder", "Grannum", "Griffith", "Best", "Evelyn", "Babb", "Sealy", "Sargeant", "Rollins", "Walcott", "Barrow"];

const allPmcStudents = [];

PMC_SCHOOLS.forEach((club, cIdx) => {
    const scrapedForClub = pmcData.players.filter(p => p.teamId === club.rawId);
    const teamId = `${club.id}-team-PMC`;
    const rng = mulberry32(club.rawId || (cIdx + 1) * 100);

    for (let i = 0; i < 25; i++) {
        const scP = scrapedForClub[i];
        const firstName = FIRST_NAMES[(cIdx * 3 + i) % FIRST_NAMES.length];
        const lastName = LAST_NAMES[(cIdx * 5 + i) % LAST_NAMES.length];

        const pos = scP?.position || (i < 2 ? 'Goalkeeper' : i < 10 ? 'Defender' : i < 18 ? 'Midfielder' : 'Forward');
        const isGk = pos === 'Goalkeeper' || pos === 'GK';

        const teamAssignments = {};
        YEARS.forEach(y => { teamAssignments[y] = teamId; });

        const student = {
            id: scP ? `pmc-student-${scP.id}` : `pmc-student-${club.id}-${i + 1}`,
            name: scP?.name || `${firstName} ${lastName}`,
            schoolId: club.id,
            teamAssignments,
            position: pos,
            jerseyNumber: scP?.number || (i + 1),
            gender: scP?.gender || 'Boy',
            dob: scP?.dob || `200${6 + (i % 3)}-0${(i % 9) + 1}-15`,
            preferredFoot: rng() < 0.8 ? 'Right' : 'Left',
            medicalInfo: 'None',
            emergencyContact: 'Parent / Guardian',
            status: 'approved',
            isMockPlayer: !scP,
            performance: generatePmcPerformance(rng, isGk),
            matchStats: {
                yellowCards: 0,
                redCards: 0,
                fouls: Math.floor(rng() * 5),
                minutesPlayed: Math.floor(rng() * 180) + 90
            },
            documents: {
                birthCertificate: 'Birth_Certificate.pdf',
                enrollmentLetter: 'School_Enrollment_Letter.pdf'
            }
        };

        if (isGk) {
            student.saveLogs = [];
        } else {
            student.shotLogs = [];
        }

        allPmcStudents.push(student);
    }
});

export const PMC_STUDENTS = allPmcStudents;

// Helper to find school by name fragment
function findClubByName(query, defaultIdx) {
    const sc = PMC_SCHOOLS.find(s => s.name.toLowerCase().includes(query.toLowerCase()));
    return sc || PMC_SCHOOLS[defaultIdx] || PMC_SCHOOLS[0];
}

function getClubPlayerIds(clubId) {
    return PMC_STUDENTS.filter(s => s.schoolId === clubId).map(s => s.id);
}

// 4. Generate clean upcoming fixtures across 4 Matchdays for ALL 24 PMC teams
const VENUES = [
    'Kensington Oval, Bridgetown',
    'Wildey Turf, St. Michael',
    'Usain Bolt Sports Complex, St. Michael',
    'National Stadium, Bank Hall',
    'Speightstown Playing Field, St. Peter'
];

const generatedMatches = [];
let matchIdCount = 1;

const MATCHDAYS = [
    { num: 1, date: '2026-08-10', offset: 1 },
    { num: 2, date: '2026-08-12', offset: 3 },
    { num: 3, date: '2026-08-15', offset: 5 },
    { num: 4, date: '2026-08-18', offset: 7 }
];

MATCHDAYS.forEach(md => {
    const paired = new Set();
    PMC_SCHOOLS.forEach((homeClub, i) => {
        if (paired.has(homeClub.id)) return;

        let awayIdx = (i + md.offset) % PMC_SCHOOLS.length;
        if (awayIdx === i) awayIdx = (i + 1) % PMC_SCHOOLS.length;

        const awayClub = PMC_SCHOOLS[awayIdx];
        if (paired.has(awayClub.id)) return;

        paired.add(homeClub.id);
        paired.add(awayClub.id);

        const homeP = getClubPlayerIds(homeClub.id);
        const awayP = getClubPlayerIds(awayClub.id);

        generatedMatches.push({
            id: `pmc-fixture-${matchIdCount++}`,
            homeTeam: homeClub.name,
            awayTeam: awayClub.name,
            homeTeamId: homeClub.id,
            awayTeamId: awayClub.id,
            homeScore: 0,
            awayScore: 0,
            status: 'upcoming',
            venue: VENUES[matchIdCount % VENUES.length],
            date: md.date,
            time: `${15 + (matchIdCount % 5)}:00`,
            round: `Matchday ${md.num} · ${homeClub.division || 'PMC Group Stage'}`,
            matchday: `Matchday ${md.num}`,
            ageGroup: 'PMC',
            homePlayers: homeP,
            awayPlayers: awayP,
            homeSquadSelection: null,
            awaySquadSelection: null,
            substitutionRequests: []
        });
    });
});

export const PMC_MATCHES = generatedMatches;
