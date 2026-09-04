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

        const rawPid = scP ? String(scP.id).padStart(5, '0') : `${club.id}-${i + 1}`;
        const student = {
            id: scP ? `pmc-student-${scP.id}` : `pmc-student-${club.id}-${i + 1}`,
            playerId: `PID-PMC-${rawPid}`,
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

// 4. Generate clean fixtures across 4 Matchdays with completed Matchday 1 & 2 fixtures for all 24 PMC teams
const VENUES = [
    'Kensington Oval, Bridgetown',
    'Wildey Turf, St. Michael',
    'Usain Bolt Sports Complex, St. Michael',
    'National Stadium, Bank Hall',
    'Speightstown Playing Field, St. Peter'
];

function generateCompletedPmcMatch(matchId, homeClub, awayClub, homeP, awayP, mdNum, date, venue, rng) {
    const homeScore = Math.floor(rng() * 4); // 0 to 3
    const awayScore = Math.floor(rng() * 3); // 0 to 2
    const homePlayersList = PMC_STUDENTS.filter(s => s.schoolId === homeClub.id);
    const awayPlayersList = PMC_STUDENTS.filter(s => s.schoolId === awayClub.id);

    const playerStats = {};
    const timeline = [];

    // Initialize base stats for players
    homeP.forEach(id => {
        playerStats[id] = {
            Goals: 0, Assists: 0, Shots: 0, 'Shots on Target': 0,
            Saves: 0, 'Fouls Committed': Math.floor(rng() * 3), 'Corners Taken': 0,
            yellowCards: 0, redCards: 0, ownGoals: 0,
            minutesPlayed: 90, passesCompleted: Math.floor(rng() * 30) + 20,
            tackles: Math.floor(rng() * 6)
        };
    });
    awayP.forEach(id => {
        playerStats[id] = {
            Goals: 0, Assists: 0, Shots: 0, 'Shots on Target': 0,
            Saves: 0, 'Fouls Committed': Math.floor(rng() * 3), 'Corners Taken': 0,
            yellowCards: 0, redCards: 0, ownGoals: 0,
            minutesPlayed: 90, passesCompleted: Math.floor(rng() * 30) + 20,
            tackles: Math.floor(rng() * 6)
        };
    });

    // Home goals
    for (let g = 0; g < homeScore; g++) {
        const scorer = homePlayersList[Math.floor(rng() * Math.min(11, homePlayersList.length))] || homePlayersList[0];
        const assister = rng() > 0.3 ? (homePlayersList.find(p => p.id !== scorer.id) || null) : null;
        const minute = Math.floor(rng() * 85) + 5;
        const period = minute <= 45 ? '1H' : '2H';
        const elapsed = minute * 60;
        const goalType = rng() > 0.8 ? 'header' : rng() > 0.9 ? 'penalty' : 'foot';
        const x = Math.floor(rng() * 70) + 15;
        const y = Math.floor(rng() * 60) + 30;

        if (scorer && playerStats[scorer.id]) {
            playerStats[scorer.id].Goals += 1;
            playerStats[scorer.id].Shots += 1;
            playerStats[scorer.id]['Shots on Target'] += 1;
        }
        if (assister && playerStats[assister.id]) {
            playerStats[assister.id].Assists += 1;
        }

        timeline.push({
            id: `ev-${matchId}-g-h-${g}`,
            elapsed,
            period,
            type: 'goal',
            playerId: scorer.id,
            playerName: scorer.name,
            team: 'home',
            teamName: homeClub.name,
            x, y,
            goalType,
            assistingPlayerId: assister?.id || null,
            assistingPlayerName: assister?.name || null
        });
    }

    // Away goals
    for (let g = 0; g < awayScore; g++) {
        const scorer = awayPlayersList[Math.floor(rng() * Math.min(11, awayPlayersList.length))] || awayPlayersList[0];
        const assister = rng() > 0.3 ? (awayPlayersList.find(p => p.id !== scorer.id) || null) : null;
        const minute = Math.floor(rng() * 85) + 5;
        const period = minute <= 45 ? '1H' : '2H';
        const elapsed = minute * 60;
        const goalType = rng() > 0.8 ? 'header' : rng() > 0.9 ? 'freekick' : 'foot';
        const x = Math.floor(rng() * 70) + 15;
        const y = Math.floor(rng() * 60) + 30;

        if (scorer && playerStats[scorer.id]) {
            playerStats[scorer.id].Goals += 1;
            playerStats[scorer.id].Shots += 1;
            playerStats[scorer.id]['Shots on Target'] += 1;
        }
        if (assister && playerStats[assister.id]) {
            playerStats[assister.id].Assists += 1;
        }

        timeline.push({
            id: `ev-${matchId}-g-a-${g}`,
            elapsed,
            period,
            type: 'goal',
            playerId: scorer.id,
            playerName: scorer.name,
            team: 'away',
            teamName: awayClub.name,
            x, y,
            goalType,
            assistingPlayerId: assister?.id || null,
            assistingPlayerName: assister?.name || null
        });
    }

    // Extra shots for home
    const extraShotsHome = Math.floor(rng() * 6) + 3;
    for (let s = 0; s < extraShotsHome; s++) {
        const shooter = homePlayersList[Math.floor(rng() * Math.min(11, homePlayersList.length))];
        const isSaved = rng() > 0.4;
        const minute = Math.floor(rng() * 88) + 2;
        const period = minute <= 45 ? '1H' : '2H';
        const elapsed = minute * 60;
        const x = isSaved ? Math.floor(rng() * 70) + 15 : (rng() > 0.5 ? Math.floor(rng() * 9) : Math.floor(rng() * 9) + 91);
        const y = isSaved ? Math.floor(rng() * 60) + 25 : Math.floor(rng() * 15);

        if (shooter && playerStats[shooter.id]) {
            playerStats[shooter.id].Shots += 1;
            if (isSaved) playerStats[shooter.id]['Shots on Target'] += 1;
        }

        timeline.push({
            id: `ev-${matchId}-sh-h-${s}`,
            elapsed,
            period,
            type: isSaved ? 'shotOnTarget' : 'shotMissed',
            playerId: shooter.id,
            playerName: shooter.name,
            team: 'home',
            teamName: homeClub.name,
            x, y,
            goalType: 'foot'
        });
    }

    // Extra shots for away
    const extraShotsAway = Math.floor(rng() * 5) + 2;
    for (let s = 0; s < extraShotsAway; s++) {
        const shooter = awayPlayersList[Math.floor(rng() * Math.min(11, awayPlayersList.length))];
        const isSaved = rng() > 0.4;
        const minute = Math.floor(rng() * 88) + 2;
        const period = minute <= 45 ? '1H' : '2H';
        const elapsed = minute * 60;
        const x = isSaved ? Math.floor(rng() * 70) + 15 : (rng() > 0.5 ? Math.floor(rng() * 9) : Math.floor(rng() * 9) + 91);
        const y = isSaved ? Math.floor(rng() * 60) + 25 : Math.floor(rng() * 15);

        if (shooter && playerStats[shooter.id]) {
            playerStats[shooter.id].Shots += 1;
            if (isSaved) playerStats[shooter.id]['Shots on Target'] += 1;
        }

        timeline.push({
            id: `ev-${matchId}-sh-a-${s}`,
            elapsed,
            period,
            type: isSaved ? 'shotOnTarget' : 'shotMissed',
            playerId: shooter.id,
            playerName: shooter.name,
            team: 'away',
            teamName: awayClub.name,
            x, y,
            goalType: 'foot'
        });
    }

    // Yellow cards
    if (rng() > 0.3) {
        const carded = homePlayersList[Math.floor(rng() * homePlayersList.length)];
        const min = Math.floor(rng() * 70) + 10;
        if (carded && playerStats[carded.id]) {
            playerStats[carded.id].yellowCards += 1;
            timeline.push({
                id: `ev-${matchId}-yc-h`,
                elapsed: min * 60,
                period: min <= 45 ? '1H' : '2H',
                type: 'yellowCard',
                playerId: carded.id,
                playerName: carded.name,
                team: 'home'
            });
        }
    }
    if (rng() > 0.3) {
        const carded = awayPlayersList[Math.floor(rng() * awayPlayersList.length)];
        const min = Math.floor(rng() * 70) + 10;
        if (carded && playerStats[carded.id]) {
            playerStats[carded.id].yellowCards += 1;
            timeline.push({
                id: `ev-${matchId}-yc-a`,
                elapsed: min * 60,
                period: min <= 45 ? '1H' : '2H',
                type: 'yellowCard',
                playerId: carded.id,
                playerName: carded.name,
                team: 'away'
            });
        }
    }

    // Goalkeeper saves
    const homeGk = homePlayersList.find(p => p.position === 'Goalkeeper') || homePlayersList[0];
    const awayGk = awayPlayersList.find(p => p.position === 'Goalkeeper') || awayPlayersList[0];
    if (homeGk && playerStats[homeGk.id]) {
        playerStats[homeGk.id].Saves = Math.max(1, Math.floor(rng() * 6) + 2);
    }
    if (awayGk && playerStats[awayGk.id]) {
        playerStats[awayGk.id].Saves = Math.max(1, Math.floor(rng() * 6) + 2);
    }

    timeline.sort((a, b) => (a.elapsed || 0) - (b.elapsed || 0));

    const homePossession = Math.floor(rng() * 26) + 40; // 40% to 65%
    const awayPossession = 100 - homePossession;

    return {
        id: `pmc-fixture-${matchId}`,
        homeTeam: homeClub.name,
        awayTeam: awayClub.name,
        homeTeamId: homeClub.id,
        awayTeamId: awayClub.id,
        homeScore,
        awayScore,
        status: 'approved',
        venue: venue,
        date: date,
        time: '18:00',
        round: `Matchday ${mdNum} · ${homeClub.division || 'PMC Group Stage'}`,
        matchday: `Matchday ${mdNum}`,
        ageGroup: 'PMC',
        homePlayers: homeP,
        awayPlayers: awayP,
        homeSquadSelection: {
            startingXI: homeP.slice(0, 11),
            benchPlayers: homeP.slice(11, 18),
            formation: '4-3-3'
        },
        awaySquadSelection: {
            startingXI: awayP.slice(0, 11),
            benchPlayers: awayP.slice(11, 18),
            formation: '4-2-3-1'
        },
        playerStats,
        timeline,
        possession: { homePct: homePossession, awayPct: awayPossession },
        referee: 'Adrian Hunte',
        commissioner: 'Sarah Rollins (Verified Official)'
    };
}

const generatedMatches = [];
let matchIdCount = 1;

// Group clubs by their division (Group A through F)
const clubsByGroup = {};
PMC_SCHOOLS.forEach(club => {
    const div = club.division || 'Group A';
    if (!clubsByGroup[div]) clubsByGroup[div] = [];
    clubsByGroup[div].push(club);
});

// Round robin pairings for 4-team groups across 4 Matchdays
const GROUP_MATCHDAYS = [
    { num: 1, date: '2026-08-10', isCompleted: true, pairings: [[0, 1], [2, 3]] },
    { num: 2, date: '2026-08-12', isCompleted: true, pairings: [[0, 2], [1, 3]] },
    { num: 3, date: '2026-08-15', isCompleted: false, pairings: [[0, 3], [1, 2]] },
    { num: 4, date: '2026-08-18', isCompleted: false, pairings: [[1, 0], [3, 2]] }
];

GROUP_MATCHDAYS.forEach(md => {
    Object.entries(clubsByGroup).forEach(([grpName, teamList]) => {
        if (teamList.length < 2) return;
        const pairings = teamList.length === 4 
            ? md.pairings 
            : [[0, 1]];

        pairings.forEach(([hIdx, aIdx]) => {
            const homeClub = teamList[hIdx % teamList.length];
            const awayClub = teamList[aIdx % teamList.length];
            if (!homeClub || !awayClub || homeClub.id === awayClub.id) return;

            const homeP = getClubPlayerIds(homeClub.id);
            const awayP = getClubPlayerIds(awayClub.id);
            const venue = VENUES[matchIdCount % VENUES.length];
            const matchId = matchIdCount++;
            const rng = mulberry32(matchId * 777 + md.num * 333);

            // Make WOTTON vs PARISH LAND and KICKSTART RUSH vs L & R UNITED live in Matchday 3 for instant interactive demos
            const isLiveMatch = md.num === 3 && (
                (homeClub.name === 'WOTTON' && awayClub.name === 'PARISH LAND') ||
                (homeClub.name === 'KICKSTART RUSH' && awayClub.name === 'L & R UNITED')
            );

            if (md.isCompleted) {
                generatedMatches.push(generateCompletedPmcMatch(matchId, homeClub, awayClub, homeP, awayP, md.num, md.date, venue, rng));
            } else if (isLiveMatch) {
                const homePlayersList = PMC_STUDENTS.filter(s => s.schoolId === homeClub.id);
                const awayPlayersList = PMC_STUDENTS.filter(s => s.schoolId === awayClub.id);
                const scorer = homePlayersList[0] || null;

                const liveTimeline = [
                    {
                        id: `ev-live-${matchId}-1`,
                        elapsed: 14 * 60,
                        period: '1H',
                        type: 'goal',
                        playerId: scorer?.id || homeP[0],
                        playerName: scorer?.name || 'Striker',
                        team: 'home',
                        teamName: homeClub.name,
                        x: 88,
                        y: 48,
                        goalType: 'foot'
                    },
                    {
                        id: `ev-live-${matchId}-2`,
                        elapsed: 22 * 60,
                        period: '1H',
                        type: 'shotOnTarget',
                        playerId: awayP[1] || awayP[0],
                        playerName: awayPlayersList[1]?.name || 'Attacker',
                        team: 'away',
                        teamName: awayClub.name,
                        x: 82,
                        y: 52,
                        goalType: 'foot'
                    }
                ];

                generatedMatches.push({
                    id: `pmc-fixture-${matchId}`,
                    homeTeam: homeClub.name,
                    awayTeam: awayClub.name,
                    homeTeamId: homeClub.id,
                    awayTeamId: awayClub.id,
                    homeScore: 1,
                    awayScore: 0,
                    status: 'live',
                    currentHalf: '1H',
                    matchTime: '28:15',
                    venue: 'National Stadium',
                    date: md.date,
                    time: '18:00',
                    round: `Matchday ${md.num} · ${homeClub.division || 'PMC Group Stage'} (LIVE)`,
                    matchday: `Matchday ${md.num}`,
                    ageGroup: 'PMC',
                    homePlayers: homeP,
                    awayPlayers: awayP,
                    homeSquadSelection: {
                        startingXI: homeP.slice(0, 11),
                        benchPlayers: homeP.slice(11, 18),
                        formation: '4-3-3',
                        confirmedAt: new Date().toISOString()
                    },
                    awaySquadSelection: {
                        startingXI: awayP.slice(0, 11),
                        benchPlayers: awayP.slice(11, 18),
                        formation: '4-2-3-1',
                        confirmedAt: new Date().toISOString()
                    },
                    liveState: {
                        period: '1H',
                        isRunning: true,
                        elapsedOffset: 28 * 60 + 15,
                        periodStartTime: Date.now() - (28 * 60 + 15) * 1000,
                        possession: {
                            homeSecs: 940,
                            awaySecs: 755,
                            activeSide: 'home',
                            lastToggleTime: Date.now()
                        }
                    },
                    timeline: liveTimeline,
                    playerStats: {},
                    substitutionRequests: [],
                    referee: 'Adrian Hunte',
                    commissioner: 'Sarah Rollins (Verified Official)'
                });
            } else {
                // Scheduled fixture with pre-submitted Starting XIs ready for 1-click kick-off
                generatedMatches.push({
                    id: `pmc-fixture-${matchId}`,
                    homeTeam: homeClub.name,
                    awayTeam: awayClub.name,
                    homeTeamId: homeClub.id,
                    awayTeamId: awayClub.id,
                    homeScore: 0,
                    awayScore: 0,
                    status: 'upcoming',
                    venue: venue,
                    date: md.date,
                    time: `${15 + (matchId % 5)}:00`,
                    round: `Matchday ${md.num} · ${homeClub.division || 'PMC Group Stage'}`,
                    matchday: `Matchday ${md.num}`,
                    ageGroup: 'PMC',
                    homePlayers: homeP,
                    awayPlayers: awayP,
                    homeSquadSelection: {
                        startingXI: homeP.slice(0, 11),
                        benchPlayers: homeP.slice(11, 18),
                        formation: '4-3-3',
                        confirmedAt: new Date().toISOString()
                    },
                    awaySquadSelection: {
                        startingXI: awayP.slice(0, 11),
                        benchPlayers: awayP.slice(11, 18),
                        formation: '4-2-3-1',
                        confirmedAt: new Date().toISOString()
                    },
                    liveState: {
                        period: '1H',
                        isRunning: false,
                        elapsedOffset: 0,
                        possession: {
                            homeSecs: 0,
                            awaySecs: 0,
                            activeSide: null
                        }
                    },
                    timeline: [],
                    playerStats: {},
                    substitutionRequests: [],
                    referee: 'Michael Beckles',
                    commissioner: 'Sarah Rollins (Verified Official)'
                });
            }
        });
    });
});

export const PMC_MATCHES = generatedMatches;
