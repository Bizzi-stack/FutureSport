// ── Subject definitions ──────────────────────────────────────────────
export const SUBJECTS = ['Goals', 'Assists', 'Shots on Target', 'Shots', 'Shots Per Game', 'Shot Accuracy', 'Pass Completed', 'Successful Dribbles', 'Tackles Per Game', 'Interceptions Per Game', 'Successful Clearances', 'Successful Blocks', 'Corners Taken', 'Freekicks Taken', 'Penalties Taken', 'Successful Tackles'];
export const GK_SUBJECTS = ['Saves', 'Clean Sheets', 'Goals Conceded', 'Penalties Saved', 'Pass Completed', 'Punches', 'High Claims'];
export const STEM_SUBJECTS = ['Goals', 'Assists', 'Shots on Target']; // Attacking
export const HUMANITIES = ['Successful Tackles', 'Interceptions Per Game', 'Successful Clearances', 'Successful Blocks']; // Defending
export const ARTS_SUBJECTS = ['Pass Completed', 'Successful Dribbles']; // Possession

export const YEARS = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025'];
export const TERMS = ['Matchday 1', 'Matchday 2', 'Matchday 3'];

export const SCHOOLS = [
    { id: 's1', name: 'Elite Academy', logo: '/Harrison College.png' },
    { id: 's2', name: 'City Football Club', logo: '/Queens College.png' },
    { id: 's3', name: 'United Youth Academy', logo: '/Combermere.png' }
];

export const TEAMS = [];
export const AGE_GROUPS = [
    { ageGroup: 'U14', groupNum: 1, teams: [] },
    { ageGroup: 'U16', groupNum: 2, teams: [] },
    { ageGroup: 'U19', groupNum: 3, teams: [] },
];

SCHOOLS.forEach(school => {
    const sId = school.id;
    AGE_GROUPS.forEach(gr => {
        const teamObj = { 
            id: `${sId}-team-${gr.ageGroup}`, 
            schoolId: sId, 
            name: gr.ageGroup, 
            ageGroup: gr.ageGroup, 
            groupNum: gr.groupNum 
        };
        TEAMS.push(teamObj);
        gr.teams.push(teamObj.id);
    });
});

// ── Seeded RNG (Mulberry32 — better distribution than LCG) ───────────
function mulberry32(seed) {
    let s = seed >>> 0;
    return () => {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Each class gets its own RNG seeded uniquely so runs are independent
function classRng(teamId, extra = 0) {
    const hash = [...teamId].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
    return mulberry32(Math.abs(hash) + extra * 9973);
}

// ── Per-class personality means ──────────────────────────────────────
// Dynamically generated based on teamId hash in createCohort instead of a hardcoded map.

export const STAT_RANGES = {
    'Goals': { min: 0, max: 15 },
    'Assists': { min: 0, max: 15 },
    'Shots on Target': { min: 0, max: 30 },
    'Shots': { min: 0, max: 50 },
    'Shots Per Game': { min: 0.5, max: 4.5, float: true },
    'Shot Accuracy': { min: 20, max: 100 },
    'Pass Completed': { min: 60, max: 100 },
    'Successful Dribbles': { min: 0, max: 40 },
    'Tackles Per Game': { min: 0.5, max: 5.0, float: true },
    'Interceptions Per Game': { min: 0.5, max: 4.0, float: true },
    'Successful Clearances': { min: 0, max: 30 },
    'Successful Blocks': { min: 0, max: 20 },
    'Corners Taken': { min: 0, max: 20 },
    'Freekicks Taken': { min: 0, max: 15 },
    'Penalties Taken': { min: 0, max: 5 },
    'Successful Tackles': { min: 0, max: 40 },
    // GK Stats
    'Saves': { min: 0, max: 40 },
    'Clean Sheets': { min: 0, max: 8 },
    'Goals Conceded': { min: 0, max: 30 },
    'Penalties Saved': { min: 0, max: 4 },
    'Punches': { min: 0, max: 20 },
    'High Claims': { min: 0, max: 25 },
};

// ── Performance generation ─────────────────────────────────────────────────
function generatePerformance(rng, studentMean, stemBias, artsBias, variance) {
    const performance = {};
    const allPossibleStats = [...new Set([...SUBJECTS, ...GK_SUBJECTS])];
    // Give each student a personal strength profile that stays consistent
    const statOffset = {};
    for (const sub of allPossibleStats) {
        statOffset[sub] = (rng() - 0.5) * 30; // personal skill in this stat
    }

    for (const year of YEARS) {
        performance[year] = {};
        for (let ti = 0; ti < TERMS.length; ti++) {
            const term = TERMS[ti];
            const termDrift = (rng() - 0.45) * 8; // slight trend per term
            performance[year][term] = {};
            for (const sub of allPossibleStats) {
                let bias = statOffset[sub];
                if (['Goals', 'Assists'].includes(sub)) bias += stemBias;
                else if (['Successful Tackles', 'Interceptions Per Game'].includes(sub)) bias += artsBias;
                
                const range = STAT_RANGES[sub] || { min: 0, max: 100 };
                // Map the 0-100 base scale (studentMean + noise) to the stat's min/max range
                const baseScore = Math.max(0, Math.min(100, studentMean + bias + (rng() - 0.5) * variance + termDrift));
                const scaledVal = range.min + (baseScore / 100) * (range.max - range.min);
                
                if (range.float) {
                    performance[year][term][sub] = Math.round(scaledVal * 10) / 10;
                } else {
                    performance[year][term][sub] = Math.round(scaledVal);
                }
            }
        }
    }
    return performance;
}

// ── Match Stats ─────────────────────────────────────────────────────────
function generateBehavior(rng, mean) {
    const bf = Math.max(0.1, Math.min(1, mean / 100));
    const b = {};
    for (const year of YEARS) {
        b[year] = {};
        for (const term of TERMS) {
            b[year][term] = {
                gamesPlayed:         Math.max(0, Math.round(10 + bf * 15 + (rng() - 0.4) * 5)),
                minutesPlayed:       Math.max(0, Math.round(900 + bf * 1200 + (rng() - 0.5) * 400)),
                yellowCards:         Math.max(0, Math.round((1 - bf) * 6 + (rng() - 0.2) * 3)),
                redCards:            Math.max(0, Math.round((1 - bf) * 1 + (rng() - 0.4) * 1)),
            };
        }
    }
    return b;
}

// ── Extracurriculars ─────────────────────────────────────────────────
export const EXTRACURRICULARS = [
    { name: 'Football',        icon: '⚽', category: 'sport' },
    { name: 'Basketball',      icon: '🏀', category: 'sport' },
    { name: 'Swimming',        icon: '🏊', category: 'sport' },
    { name: 'Track & Field',   icon: '🏃', category: 'sport' },
    { name: 'Tennis',          icon: '🎾', category: 'sport' },
    { name: 'Volleyball',      icon: '🏐', category: 'sport' },
    { name: 'Cricket',         icon: '🏏', category: 'sport' },
    { name: 'Drama Club',      icon: '🎭', category: 'arts'  },
    { name: 'Music Band',      icon: '🎸', category: 'arts'  },
    { name: 'Choir',           icon: '🎤', category: 'arts'  },
    { name: 'Art Club',        icon: '🎨', category: 'arts'  },
    { name: 'Dance',           icon: '💃', category: 'arts'  },
    { name: 'Chess Club',      icon: '♟️', category: 'academic' },
    { name: 'Debate Team',     icon: '🗣️', category: 'academic' },
    { name: 'Science Fair',    icon: '🔬', category: 'academic' },
    { name: 'Coding Club',     icon: '💻', category: 'academic' },
    { name: 'Book Club',       icon: '📚', category: 'academic' },
    { name: 'Student Council', icon: '🏛️', category: 'leadership' },
    { name: 'Photography',     icon: '📷', category: 'arts' },
    { name: 'Geography Bees',  icon: '🌍', category: 'academic' },
];

export const SPORTS_EXTRACURRICULARS = EXTRACURRICULARS
    .filter(e => e.category === 'sport').map(e => e.name);

function generateExtracurriculars(rng, sportRate) {
    const count = Math.floor(rng() * 5); // 0-4 activities
    const result = [];
    // Sports bias
    if (rng() < sportRate) {
        const sports = EXTRACURRICULARS.filter(e => e.category === 'sport');
        const pick = sports[Math.floor(rng() * sports.length)];
        if (pick) result.push(pick);
    }
    const pool = EXTRACURRICULARS.filter(e => !result.includes(e));
    const shuffled = [...pool].sort(() => rng() - 0.5);
    while (result.length < count && shuffled.length) result.push(shuffled.pop());
    return result;
}

// ── Name pools ───────────────────────────────────────────────────────
const FIRST_NAMES = [
    'Alice','Bob','Charlie','Diana','Evan','Fiona','George','Hannah',
    'Isaac','Jasmine','Kevin','Lara','Marcus','Nina','Oscar',
    'Priya','Quinn','Ryan','Sofia','Tyler','Uma','Victor','Wanda',
    'Xavier','Yuki','Zara','Aiden','Brianna','Caleb','Destiny',
    'Ethan','Faith','Gavin','Hazel','Ian','Julia','Kyle','Luna',
    'Mason','Nora','Owen','Paige','Reed','Sage','Tiana',
    'Jordan','Kira','Liam','Mia','Nathan','Olivia','Percy','Rhea',
    'Sebastian','Tamara','Uriel','Violet','Wesley','Xena','Yasmin','Zion',
];
const LAST_NAMES = [
    'Johnson','Smith','Brown','Prince','Wright','Garcia','Lee','Clarke',
    'Thompson','Williams','Malone','Croft','Reed','Patel','Rivera',
    'Chen','Douglas','Foster','Grant','Hart','James','King','Lopez',
    'Mitchell','Nelson','Owens','Park','Rose','Scott','Turner',
    'Vargas','Watson','Young','Adams','Baker','Cole','Davis','Evans',
    'Fisher','Gray','Hill','Irwin','Jones','Klein','Lewis',
    'Morgan','Nash','Ortiz','Perry','Ross','Shaw','Tang','Upton',
    'Vega','Wells','York','Zimmerman','Blake','Cruz','Diaz','Edwards',
];

// ── Build students ────────────────────────────────────────────────────
let nextId = 1;
export const ALL_STUDENTS = [];

function buildAssignments(schoolId, startGroupIndex, startYear) {
    const assignments = {};
    const yi = YEARS.indexOf(startYear);
    const groups = ['U14', 'U16', 'U19'];
    
    let currentGroupIndex = startGroupIndex;
    let yearsInGroup = 0;

    for (let y = yi; y < YEARS.length; y++) {
        assignments[YEARS[y]] = `${schoolId}-team-${groups[currentGroupIndex]}`;
        yearsInGroup++;
        
        // Progress to next age group every 2 years
        if (yearsInGroup >= 2 && currentGroupIndex < groups.length - 1) {
            currentGroupIndex++;
            yearsInGroup = 0;
        }
    }
    return assignments;
}

function generateShotLogsForStudent(student, rng) {
    const shotLogs = [];
    let logId = 1;
    for (const year of Object.keys(student.performance)) {
        for (const term of Object.keys(student.performance[year])) {
            const perf = student.performance[year][term];
            const goals = perf['Goals'] || 0;
            const sot = perf['Shots on Target'] || 0;
            const shots = perf['Shots'] || 0;
            
            const saved = Math.max(0, sot - goals);
            const missed = Math.max(0, shots - sot);
            
            // Generate goals
            for (let i = 0; i < goals; i++) {
                const isLeft = rng() < 0.5;
                const isTop = rng() < 0.6;
                let x, y;
                if (isLeft) {
                    x = 12 + rng() * 15; // left corner
                } else {
                    x = 73 + rng() * 15; // right corner
                }
                if (isTop) {
                    y = 22 + rng() * 18; // top corner
                } else {
                    y = 70 + rng() * 20; // bottom corner
                }
                
                // Random shot type for goals
                const typeRnd = rng();
                let gType = 'foot';
                if (typeRnd < 0.65) gType = 'foot';
                else if (typeRnd < 0.85) gType = 'header';
                else if (typeRnd < 0.95) gType = 'freekick';
                else gType = 'penalty';

                shotLogs.push({
                    id: `${student.id}-${year}-${term}-g-${logId++}`,
                    year,
                    term,
                    result: 'goal',
                    goalType: gType,
                    x: Math.round(x),
                    y: Math.round(y),
                    timestamp: Date.now() - rng() * 10000000
                });
            }
            
            // Generate saves
            for (let i = 0; i < saved; i++) {
                const x = 30 + rng() * 40; // central
                const y = 35 + rng() * 50; // central

                // Random shot type for saves
                const typeRnd = rng();
                let gType = 'foot';
                if (typeRnd < 0.80) gType = 'foot';
                else if (typeRnd < 0.92) gType = 'header';
                else if (typeRnd < 0.98) gType = 'freekick';
                else gType = 'penalty';

                shotLogs.push({
                    id: `${student.id}-${year}-${term}-s-${logId++}`,
                    year,
                    term,
                    result: 'saved',
                    goalType: gType,
                    x: Math.round(x),
                    y: Math.round(y),
                    timestamp: Date.now() - rng() * 10000000
                });
            }
            
            // Generate missed
            for (let i = 0; i < missed; i++) {
                const type = Math.floor(rng() * 3); // 0: over, 1: wide left, 2: wide right
                let x, y;
                if (type === 0) {
                    x = 8 + rng() * 84;
                    y = 5 + rng() * 13; // above crossbar
                } else if (type === 1) {
                    x = 2 + rng() * 7; // wide left
                    y = 15 + rng() * 75;
                } else {
                    x = 91 + rng() * 7; // wide right
                    y = 15 + rng() * 75;
                }

                // Random shot type for misses
                const typeRnd = rng();
                let gType = 'foot';
                if (typeRnd < 0.75) gType = 'foot';
                else if (typeRnd < 0.88) gType = 'header';
                else if (typeRnd < 0.97) gType = 'freekick';
                else gType = 'penalty';

                shotLogs.push({
                    id: `${student.id}-${year}-${term}-m-${logId++}`,
                    year,
                    term,
                    result: 'miss',
                    goalType: gType,
                    x: Math.round(x),
                    y: Math.round(y),
                    timestamp: Date.now() - rng() * 10000000
                });
            }
        }
    }
    return shotLogs;
}

function generateSaveLogsForGoalkeeper(student, rng) {
    const saveLogs = [];
    let logId = 1;
    for (const year of Object.keys(student.performance)) {
        for (const term of Object.keys(student.performance[year])) {
            const perf = student.performance[year][term];
            const saves = perf['Saves'] || 0;
            const goalsConceded = perf['Goals Conceded'] || 0;
            
            // Generate save logs
            for (let i = 0; i < saves; i++) {
                const sRnd = rng();
                let sType = 'normal';
                if (sRnd < 0.70) sType = 'normal';
                else if (sRnd < 0.82) sType = '1v1';
                else if (sRnd < 0.92) sType = 'freekick';
                else sType = 'penalty';

                // Distribute save locations on goal frame (x: 12-88%, y: 25-88%)
                const zoneType = rng();
                let x, y;
                if (zoneType < 0.35) { // Corner dive
                    x = rng() < 0.5 ? (12 + rng() * 20) : (68 + rng() * 20);
                    y = 30 + rng() * 45;
                } else if (zoneType < 0.65) { // Low save
                    x = 15 + rng() * 70;
                    y = 65 + rng() * 23;
                } else if (zoneType < 0.85) { // High save / punch
                    x = 20 + rng() * 60;
                    y = 25 + rng() * 30;
                } else { // Central save
                    x = 35 + rng() * 30;
                    y = 40 + rng() * 35;
                }

                saveLogs.push({
                    id: `${student.id}-${year}-${term}-sv-${logId++}`,
                    year,
                    term,
                    result: 'save',
                    saveType: sType,
                    x: Math.round(x),
                    y: Math.round(y),
                    timestamp: Date.now() - rng() * 10000000
                });
            }

            // Generate conceded goal logs
            for (let i = 0; i < goalsConceded; i++) {
                const sRnd = rng();
                let sType = 'normal';
                if (sRnd < 0.65) sType = 'normal';
                else if (sRnd < 0.82) sType = '1v1';
                else if (sRnd < 0.93) sType = 'freekick';
                else sType = 'penalty';

                // Goals conceded usually go to corners or low corners
                const zoneType = rng();
                let x, y;
                if (zoneType < 0.5) { // Top or side corners
                    x = rng() < 0.5 ? (12 + rng() * 18) : (70 + rng() * 18);
                    y = 22 + rng() * 35;
                } else if (zoneType < 0.85) { // Bottom corners
                    x = rng() < 0.5 ? (12 + rng() * 22) : (66 + rng() * 22);
                    y = 65 + rng() * 23;
                } else { // Central / Chip
                    x = 38 + rng() * 24;
                    y = 25 + rng() * 45;
                }

                saveLogs.push({
                    id: `${student.id}-${year}-${term}-gc-${logId++}`,
                    year,
                    term,
                    result: 'goal_conceded',
                    saveType: sType,
                    x: Math.round(x),
                    y: Math.round(y),
                    timestamp: Date.now() - rng() * 10000000
                });
            }
        }
    }
    return saveLogs;
}

function createCohort(schoolId, startGroupIndex, startYear, count = 25) {
    const teamId = `${schoolId}-team-${['U14', 'U16', 'U19'][startGroupIndex]}`;
    
    const profileHash = [...teamId].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
    const pRng = mulberry32(Math.abs(profileHash));
    const profile = { 
        mean: 45 + pRng() * 45, 
        stemBias: (pRng() - 0.5) * 30, 
        artsBias: (pRng() - 0.5) * 30, 
        variance: 10 + pRng() * 20, 
        sportRate: 0.8 + pRng() * 0.2 // Footballers are very sporty!
    };

    const rng = classRng(teamId, YEARS.indexOf(startYear));
    const nameRng = classRng(teamId + '_names', YEARS.indexOf(startYear) + 100);

    for (let i = 0; i < count; i++) {
        const studentMean = Math.max(10, Math.min(98, profile.mean + (rng() - 0.5) * 50));
        const fn = FIRST_NAMES[Math.floor(nameRng() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(nameRng() * LAST_NAMES.length)];

        // Generate realistic registration details
        const birthYear = startGroupIndex === 0 ? 2012 : startGroupIndex === 1 ? 2010 : 2007;
        const dob = `${birthYear}-${String(Math.floor(rng() * 12) + 1).padStart(2, '0')}-${String(Math.floor(rng() * 28) + 1).padStart(2, '0')}`;
        const gender = rng() < 0.55 ? 'Boy' : 'Girl';
        
        let position = 'Midfielder';
        if (i < 2) position = 'Goalkeeper';
        else if (i < 7) position = 'Defender';
        else if (i < 12) position = 'Midfielder';
        else position = 'Forward';
        
        const preferredFoot = rng() < 0.8 ? 'Right' : 'Left';
        const medicalInfo = rng() < 0.9 ? 'None' : (rng() < 0.5 ? 'Asthma' : 'Mild dust allergy');
        const emergencyContact = `Sarah ${ln} (Mother) - 555-${String(Math.floor(1000 + rng() * 9000))}`;
        const status = i >= count - 2 ? 'pending' : 'approved';

        const documents = {
            birthCertificate: 'Birth_Certificate.pdf',
            enrollmentLetter: 'School_Enrollment_Letter.pdf'
        };

        if (status === 'pending' || status === 'rejected') {
            const rngDoc = rng();
            if (rngDoc < 0.35) {
                documents.birthCertificate = null;
            } else if (rngDoc < 0.7) {
                documents.enrollmentLetter = null;
            } else if (rngDoc < 0.85) {
                documents.birthCertificate = null;
                documents.enrollmentLetter = null;
            }
        }

        const jerseyNumber = i === 0 ? 1 : i === 1 ? 12 : i + 1;

        const student = {
            id: nextId++,
            name: `${fn} ${ln}`,
            schoolId: schoolId,
            teamAssignments: buildAssignments(schoolId, startGroupIndex, startYear),
            performance: generatePerformance(rng, studentMean, profile.stemBias, profile.artsBias, profile.variance),
            matchStats: generateBehavior(rng, studentMean),
            extracurriculars: generateExtracurriculars(rng, profile.sportRate),
            dob,
            gender,
            position,
            preferredFoot,
            medicalInfo,
            emergencyContact,
            jerseyNumber,
            documents,
            status
        };
        student.shotLogs = generateShotLogsForStudent(student, rng);
        if (student.position === 'Goalkeeper') {
            student.saveLogs = generateSaveLogsForGoalkeeper(student, rng);
        }
        ALL_STUDENTS.push(student);
    }
}

// ── Cohort matrix ─────────────────────────────────────────────────────
SCHOOLS.forEach(school => {
    const sId = school.id;
    // Create cohorts (15 players per team)
    // Started at U14 in 2020-21 (now U19)
    createCohort(sId, 0, '2020-2021', 15);
    // Started at U14 in 2022-23 (now U16)
    createCohort(sId, 0, '2022-2023', 15);
    // Started at U14 in 2024-25 (now U14)
    createCohort(sId, 0, '2024-2025', 15);
    
    // Fill out the squads for older years
    createCohort(sId, 1, '2020-2021', 15); // Started at U16 back then
    createCohort(sId, 2, '2020-2021', 15); // Started at U19 back then
});


// ── Helpers ───────────────────────────────────────────────────────────
export function getTeamStudents(allStudents, teamId, year) {
    return allStudents.filter(s => s.teamAssignments?.[year] === teamId);
}

export function getSubjectAvg(student, year, term, subject) {
    return student.performance?.[year]?.[term]?.[subject] ?? 0;
}

export function getOverallAvg(student, year, term) {
    const g = student.performance?.[year]?.[term];
    if (!g) return 0;
    
    let totalNormalized = 0;
    let count = 0;
    for (const [sub, val] of Object.entries(g)) {
        if (val == null) continue;
        const range = STAT_RANGES[sub] || { min: 0, max: 100 };
        let normalized = ((val - range.min) / (range.max - range.min)) * 100;
        normalized = Math.max(0, Math.min(100, normalized));
        totalNormalized += normalized;
        count++;
    }
    return count > 0 ? Math.round(totalNormalized / count) : 0;
}

export const MOCK_DATA = {};
for (const yr of YEARS) {
    for (const teamObj of TEAMS) {
        if (!MOCK_DATA[teamObj.id]) MOCK_DATA[teamObj.id] = {};
        MOCK_DATA[teamObj.id][yr] = getTeamStudents(ALL_STUDENTS, teamObj.id, yr);
    }
}

// ── Aliases ─────────────────────────────────────────────────────────
export const ALL_PLAYERS = ALL_STUDENTS;
export const getTeamPlayers = getTeamStudents;
