import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SCHOOLS, TEAMS } from '../../data/mockData';
import LiveShotModal from './LiveShotModal';
import LiveGkSaveModal from './LiveGkSaveModal';
import TileDataCaptureControlPanel from './TileDataCaptureControlPanel';

// Formation layouts define rows from back (GK) to front (FWD)
const FORMATION_LAYOUTS = {
    '4-3-3': { 
        label: '4-3-3', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 68, x: 15, role: 'DEF', label: 'LB' },
            { y: 68, x: 38, role: 'DEF', label: 'CB' },
            { y: 68, x: 62, role: 'DEF', label: 'CB' },
            { y: 68, x: 85, role: 'DEF', label: 'RB' },
            { y: 44, x: 25, role: 'MID', label: 'LM' },
            { y: 46, x: 50, role: 'MID', label: 'CM' },
            { y: 44, x: 75, role: 'MID', label: 'RM' },
            { y: 20, x: 20, role: 'FWD', label: 'LW' },
            { y: 18, x: 50, role: 'FWD', label: 'ST' },
            { y: 20, x: 80, role: 'FWD', label: 'RW' }
        ]
    },
    '4-4-2': { 
        label: '4-4-2', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 68, x: 15, role: 'DEF', label: 'LB' },
            { y: 68, x: 38, role: 'DEF', label: 'CB' },
            { y: 68, x: 62, role: 'DEF', label: 'CB' },
            { y: 68, x: 85, role: 'DEF', label: 'RB' },
            { y: 44, x: 15, role: 'MID', label: 'LM' },
            { y: 44, x: 38, role: 'MID', label: 'CM' },
            { y: 44, x: 62, role: 'MID', label: 'CM' },
            { y: 44, x: 85, role: 'MID', label: 'RM' },
            { y: 20, x: 35, role: 'FWD', label: 'ST' },
            { y: 20, x: 65, role: 'FWD', label: 'ST' }
        ]
    },
    '4-2-3-1': { 
        label: '4-2-3-1', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 72, x: 15, role: 'DEF', label: 'LB' },
            { y: 72, x: 38, role: 'DEF', label: 'CB' },
            { y: 72, x: 62, role: 'DEF', label: 'CB' },
            { y: 72, x: 85, role: 'DEF', label: 'RB' },
            { y: 56, x: 35, role: 'CDM', label: 'LDM' },
            { y: 56, x: 65, role: 'CDM', label: 'RDM' },
            { y: 38, x: 20, role: 'CAM', label: 'LAM' },
            { y: 36, x: 50, role: 'CAM', label: 'CAM' },
            { y: 38, x: 80, role: 'CAM', label: 'RAM' },
            { y: 16, x: 50, role: 'ST', label: 'ST' }
        ]
    },
    '3-5-2': { 
        label: '3-5-2', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 68, x: 25, role: 'DEF', label: 'CB' },
            { y: 68, x: 50, role: 'DEF', label: 'CB' },
            { y: 68, x: 75, role: 'DEF', label: 'CB' },
            { y: 44, x: 15, role: 'MID', label: 'LWB' },
            { y: 46, x: 35, role: 'MID', label: 'CM' },
            { y: 48, x: 50, role: 'MID', label: 'CDM' },
            { y: 46, x: 65, role: 'MID', label: 'CM' },
            { y: 44, x: 85, role: 'MID', label: 'RWB' },
            { y: 20, x: 35, role: 'FWD', label: 'ST' },
            { y: 20, x: 65, role: 'FWD', label: 'ST' }
        ]
    },
    '3-4-3': { 
        label: '3-4-3', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 68, x: 25, role: 'DEF', label: 'CB' },
            { y: 68, x: 50, role: 'DEF', label: 'CB' },
            { y: 68, x: 75, role: 'DEF', label: 'CB' },
            { y: 44, x: 15, role: 'MID', label: 'LM' },
            { y: 44, x: 38, role: 'MID', label: 'CM' },
            { y: 44, x: 62, role: 'MID', label: 'CM' },
            { y: 44, x: 85, role: 'MID', label: 'RM' },
            { y: 20, x: 20, role: 'FWD', label: 'LW' },
            { y: 18, x: 50, role: 'FWD', label: 'ST' },
            { y: 20, x: 80, role: 'FWD', label: 'RW' }
        ]
    },
    '4-5-1': { 
        label: '4-5-1', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 68, x: 15, role: 'DEF', label: 'LB' },
            { y: 68, x: 38, role: 'DEF', label: 'CB' },
            { y: 68, x: 62, role: 'DEF', label: 'CB' },
            { y: 68, x: 85, role: 'DEF', label: 'RB' },
            { y: 44, x: 15, role: 'MID', label: 'LM' },
            { y: 44, x: 32, role: 'MID', label: 'CM' },
            { y: 46, x: 50, role: 'MID', label: 'CM' },
            { y: 44, x: 68, role: 'MID', label: 'CM' },
            { y: 44, x: 85, role: 'MID', label: 'RM' },
            { y: 18, x: 50, role: 'FWD', label: 'ST' }
        ]
    },
    '5-3-2': { 
        label: '5-3-2', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 68, x: 12, role: 'DEF', label: 'LWB' },
            { y: 68, x: 31, role: 'DEF', label: 'CB' },
            { y: 68, x: 50, role: 'DEF', label: 'CB' },
            { y: 68, x: 69, role: 'DEF', label: 'CB' },
            { y: 68, x: 88, role: 'DEF', label: 'RWB' },
            { y: 44, x: 25, role: 'MID', label: 'CM' },
            { y: 44, x: 50, role: 'MID', label: 'CM' },
            { y: 44, x: 75, role: 'MID', label: 'CM' },
            { y: 20, x: 35, role: 'FWD', label: 'ST' },
            { y: 20, x: 65, role: 'FWD', label: 'ST' }
        ]
    },
    '4-1-4-1': { 
        label: '4-1-4-1', 
        slots: [
            { y: 88, x: 50, role: 'GK', label: 'GK' },
            { y: 72, x: 15, role: 'DEF', label: 'LB' },
            { y: 72, x: 38, role: 'DEF', label: 'CB' },
            { y: 72, x: 62, role: 'DEF', label: 'CB' },
            { y: 72, x: 85, role: 'DEF', label: 'RB' },
            { y: 56, x: 50, role: 'CDM', label: 'CDM' },
            { y: 38, x: 15, role: 'MID', label: 'LM' },
            { y: 38, x: 38, role: 'MID', label: 'CM' },
            { y: 38, x: 62, role: 'MID', label: 'CM' },
            { y: 38, x: 85, role: 'MID', label: 'RM' },
            { y: 16, x: 50, role: 'ST', label: 'ST' }
        ]
    }
};

const ROLE_COLORS = {
    GK: '#f59e0b',
    DEF: '#3b82f6',
    CDM: '#8b5cf6',
    MID: '#10b981',
    CAM: '#06b6d4',
    FWD: '#ef4444',
    ST: '#ef4444',
};

/* ─── helpers ──────────────────────────────────────────────────────── */
function teamMeta(teamId) {
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return { name: '???', school: null };
    const school = SCHOOLS.find(s => s.id === team.schoolId);
    return { name: `${school?.name ?? ''} ${team.ageGroup}`.trim(), school };
}

function pad(n) { return String(n).padStart(2, '0'); }

const QUICK_ACTIONS = [
    { key: 'goal',         label: '⚽',  tooltip: 'Goal / Shot',    color: '#22c55e', hoverColor: '#16a34a' },
    { key: 'assist',       label: '🅰️', tooltip: 'Assist',         color: '#6366f1', hoverColor: '#4f46e5' },
    { key: 'yellowCard',   label: '🟨',  tooltip: 'Yellow Card',    color: '#f59e0b', hoverColor: '#d97706' },
    { key: 'redCard',      label: '🟥',  tooltip: 'Red Card',       color: '#ef4444', hoverColor: '#dc2626' },
];

const DETAIL_STATS = [
    'Pass Completed', 'Successful Dribbles', 'Tackles Per Game',
    'Interceptions Per Game', 'Successful Clearances', 'Successful Blocks',
    'Corners Taken', 'Freekicks Taken', 'Penalties Taken',
    'Successful Tackles', 'Minutes Played',
];

function initPlayerStats(playerIds, side) {
    const out = {};
    playerIds.forEach(id => {
        out[id] = {
            Goals: 0, Assists: 0, 'Shots on Target': 0, Shots: 0,
            'Pass Completed': 0, 'Successful Dribbles': 0,
            'Tackles Per Game': 0, 'Interceptions Per Game': 0,
            'Successful Clearances': 0, 'Successful Blocks': 0,
            'Corners Taken': 0, 'Freekicks Taken': 0,
            'Penalties Taken': 0, 'Successful Tackles': 0,
            Saves: 0, 'Penalties Saved': 0, 'Free Kick Saves': 0,
            'Goals Conceded': 0, Punches: 0, 'High Claims': 0,
            minutesPlayed: 0, yellowCards: 0, redCards: 0,
            ownGoals: 0,
            team: side,
        };
    });
    return out;
}

/* ─── component ────────────────────────────────────────────────────── */
export default function LiveMatch({ matchData: matchDataProp, match: matchProp, schools: schoolsProp, allStudents: allStudentsProp, allPlayers: allPlayersProp, year, onUpdateMatch, onEndMatch, onCancel, isRefereeMode }) {
    const matchData = matchDataProp || matchProp || {};
    const allStudents = allStudentsProp || allPlayersProp || [];
    const schools = schoolsProp || [];
    const { 
        homeTeamId, awayTeamId, ageGroup, matchday,
        homeSquadSelection, awaySquadSelection
    } = matchData;
    
    const clockState = matchData.liveState || {};
    const eventState = isRefereeMode ? (matchData.refereeLiveState || {}) : clockState;

    // Fallback if players are missing from global state
    const homePlayers = useMemo(() => {
        if (matchData.homePlayers && matchData.homePlayers.length > 0) return matchData.homePlayers;
        const targetTeamName = (matchData.homeTeam || '').toLowerCase();
        return allStudents.filter(s => 
            (homeTeamId && s.schoolId === homeTeamId) || 
            (homeTeamId && s.teamAssignments?.[year] === homeTeamId) ||
            (homeTeamId && s.teamAssignments?.[year] === `${homeTeamId}-team-PMC`) ||
            (targetTeamName && s.schoolName?.toLowerCase().includes(targetTeamName)) ||
            (targetTeamName && s.clubName?.toLowerCase().includes(targetTeamName))
        ).map(s => s.id);
    }, [matchData.homePlayers, matchData.homeTeam, homeTeamId, allStudents, year]);

    const awayPlayers = useMemo(() => {
        if (matchData.awayPlayers && matchData.awayPlayers.length > 0) return matchData.awayPlayers;
        const targetTeamName = (matchData.awayTeam || '').toLowerCase();
        return allStudents.filter(s => 
            (awayTeamId && s.schoolId === awayTeamId) || 
            (awayTeamId && s.teamAssignments?.[year] === awayTeamId) ||
            (awayTeamId && s.teamAssignments?.[year] === `${awayTeamId}-team-PMC`) ||
            (targetTeamName && s.schoolName?.toLowerCase().includes(targetTeamName)) ||
            (targetTeamName && s.clubName?.toLowerCase().includes(targetTeamName))
        ).map(s => s.id);
    }, [matchData.awayPlayers, matchData.awayTeam, awayTeamId, allStudents, year]);

    // Starters and Bench players from Coach selection (with fallbacks if none submitted)
    const homeStarters = useMemo(() => {
        if (homeSquadSelection?.startingXI) {
            return homeSquadSelection.startingXI.filter(Boolean);
        }
        return homePlayers.slice(0, 11);
    }, [homeSquadSelection, homePlayers]);

    const homeBench = useMemo(() => {
        if (homeSquadSelection?.benchPlayers) {
            return homeSquadSelection.benchPlayers;
        }
        return homePlayers.slice(11);
    }, [homeSquadSelection, homePlayers]);

    const homeUnassigned = useMemo(() => {
        const selected = new Set([...homeStarters, ...homeBench]);
        return homePlayers.filter(id => !selected.has(id));
    }, [homePlayers, homeStarters, homeBench]);

    const awayStarters = useMemo(() => {
        if (awaySquadSelection?.startingXI) {
            return awaySquadSelection.startingXI.filter(Boolean);
        }
        return awayPlayers.slice(0, 11);
    }, [awaySquadSelection, awayPlayers]);

    const awayBench = useMemo(() => {
        if (awaySquadSelection?.benchPlayers) {
            return awaySquadSelection.benchPlayers;
        }
        return awayPlayers.slice(11);
    }, [awaySquadSelection, awayPlayers]);

    const awayUnassigned = useMemo(() => {
        const selected = new Set([...awayStarters, ...awayBench]);
        return awayPlayers.filter(id => !selected.has(id));
    }, [awayPlayers, awayStarters, awayBench]);

    const startTimeRef = useRef(clockState.startTime || Date.now());
    const offsetRef = useRef(clockState.elapsedOffset || 0);

    const [period, setPeriod] = useState(clockState.period || '1H');          // '1H' | 'HT' | '2H'
    const [isPaused, setIsPaused] = useState(clockState.isRunning === false);
    
    // Sync React state if the global clockState changes (e.g. Statistician started it, and Referee is just watching)
    useEffect(() => {
        if (isRefereeMode) {
            setIsPaused(clockState.isRunning === false);
            setPeriod(clockState.period || '1H');
            startTimeRef.current = clockState.startTime || Date.now();
            offsetRef.current = clockState.elapsedOffset || 0;
        }
    }, [clockState.isRunning, clockState.period, clockState.startTime, clockState.elapsedOffset, isRefereeMode]);

    const [elapsed, setElapsed] = useState(() => {
        if (clockState.isRunning === false) return offsetRef.current;
        return offsetRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    });

    const [playerStats, setPlayerStats] = useState(() => {
        if (eventState.playerStats && Object.keys(eventState.playerStats).length > 0) return eventState.playerStats;
        return {
            ...initPlayerStats(homePlayers, 'home'),
            ...initPlayerStats(awayPlayers, 'away'),
        };
    });
    const [timeline, setTimeline] = useState(eventState.timeline || []);
    const [shotModalData, setShotModalData] = useState(null); // { player, defaultOutcome, teammates }
    const [expandedPlayer, setExpandedPlayer] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [hoveredBtn, setHoveredBtn] = useState(null);  // `${playerId}-${actionKey}`

    const matchDataRef = useRef(matchData);
    useEffect(() => {
        matchDataRef.current = matchData;
    }, [matchData]);

    const [homeViewMode, setHomeViewMode] = useState('list'); // 'list' | 'pitch'
    const [awayViewMode, setAwayViewMode] = useState('list'); // 'list' | 'pitch'
    const [mobileTab, setMobileTab] = useState('home'); // 'home' | 'timeline' | 'away'
    const [activePitchPlayerMenu, setActivePitchPlayerMenu] = useState(null); // { playerId, x, y, side }
    const [gkSaveModalData, setGkSaveModalData] = useState(null); // { player }
    const [captureViewMode, setCaptureViewMode] = useState('tile'); // 'tile' | 'roster'

    const handleTogglePause = () => {
        if (isRefereeMode) return; // Referee cannot control clock
        if (isPaused) {
            // Resuming
            startTimeRef.current = Date.now();
            setIsPaused(false);
        } else {
            // Pausing
            offsetRef.current = offsetRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
            setIsPaused(true);
        }
    };

    const handleEndFirstHalf = () => {
        if (isRefereeMode) return;
        setIsPaused(true);
        setPeriod('HT');
    };

    const handleStartSecondHalf = () => {
        if (isRefereeMode) return;
        offsetRef.current = 45 * 60; // strictly 45:00
        startTimeRef.current = Date.now();
        setIsPaused(false);
        setPeriod('2H');
    };

    /* timer */
    useEffect(() => {
        let iv = null;
        if (!isPaused) {
            iv = setInterval(() => {
                setElapsed(offsetRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        }
        return () => {
            if (iv) clearInterval(iv);
        };
    }, [isPaused, isRefereeMode, clockState.startTime]);

    // Sync state to Match object whenever critical states change
    useEffect(() => {
        if (onUpdateMatch) {
            // If referee, only update refereeLiveState with events
            if (isRefereeMode) {
                const updatedRefereeState = {
                    ...eventState,
                    playerStats,
                    timeline
                };
                onUpdateMatch({
                    ...matchDataRef.current,
                    refereeLiveState: updatedRefereeState
                });
            } else {
                // If statistician, update the global liveState
                const updatedLiveState = {
                    ...clockState,
                    isRunning: !isPaused,
                    startTime: startTimeRef.current,
                    elapsedOffset: offsetRef.current,
                    period,
                    playerStats,
                    timeline
                };
                onUpdateMatch({
                    ...matchDataRef.current,
                    liveState: updatedLiveState
                });
            }
        }
        // eslint-disable-next-line
    }, [isPaused, period, playerStats, timeline]);

    /* lookup helper */
    const studentsById = useMemo(() => {
        const map = {};
        allStudents.forEach(s => { map[s.id] = s; });
        return map;
    }, [allStudents]);

    const resolveTeamMeta = useCallback((teamId, fallbackName) => {
        if (!teamId && !fallbackName) return { name: 'Unknown Team', school: null };
        
        // 1. Look up in schools prop
        const foundSchool = (schools || []).find(s => s.id === teamId || s.rawId === teamId);
        if (foundSchool) {
            return { name: foundSchool.name, school: foundSchool };
        }

        // 2. Look up in mock TEAMS & SCHOOLS
        const mockTeam = TEAMS.find(t => t.id === teamId);
        if (mockTeam) {
            const mockSchool = SCHOOLS.find(s => s.id === mockTeam.schoolId);
            return { name: `${mockSchool?.name ?? ''} ${mockTeam.ageGroup}`.trim(), school: mockSchool };
        }

        // 3. Fallback to direct name string
        if (fallbackName) {
            const schoolByName = (schools || []).find(s => s.name?.toLowerCase() === fallbackName.toLowerCase());
            return { name: fallbackName, school: schoolByName || null };
        }

        return { name: teamId || 'Team', school: null };
    }, [schools]);

    const home = useMemo(() => resolveTeamMeta(homeTeamId, matchData.homeTeam), [resolveTeamMeta, homeTeamId, matchData.homeTeam]);
    const away = useMemo(() => resolveTeamMeta(awayTeamId, matchData.awayTeam), [resolveTeamMeta, awayTeamId, matchData.awayTeam]);

    /* derived scores */
    const homeScore = useMemo(() => {
        const goals = homePlayers.reduce((t, id) => t + (playerStats[id]?.Goals ?? 0), 0);
        const ownGoals = awayPlayers.reduce((t, id) => t + (playerStats[id]?.ownGoals ?? 0), 0);
        return goals + ownGoals;
    }, [homePlayers, awayPlayers, playerStats]);

    const awayScore = useMemo(() => {
        const goals = awayPlayers.reduce((t, id) => t + (playerStats[id]?.Goals ?? 0), 0);
        const ownGoals = homePlayers.reduce((t, id) => t + (playerStats[id]?.ownGoals ?? 0), 0);
        return goals + ownGoals;
    }, [homePlayers, awayPlayers, playerStats]);

    /* quick-action handler */
    const handleQuickAction = useCallback((playerId, actionKey) => {
        const student = studentsById[playerId];
        const name = student?.name ?? `Player #${playerId}`;
        const isHome = homePlayers.includes(playerId);
        const teammates = isHome 
            ? homePlayers.map(id => studentsById[id]).filter(Boolean)
            : awayPlayers.map(id => studentsById[id]).filter(Boolean);

        if (actionKey === 'goal') {
            // Open LiveShotModal
            setShotModalData({
                player: { id: playerId, name },
                defaultOutcome: 'goal',
                teammates
            });
        } else {
            // Direct immediate logging for card/assist
            const elapsedMins = Math.floor(elapsed / 60) + 1;
            setTimeline(prev => [
                ...prev,
                {
                    id: `event-${Date.now()}`,
                    elapsed: elapsed,
                    period: period,
                    type: actionKey,
                    playerId,
                    playerName: name,
                    team: isHome ? 'home' : 'away',
                }
            ]);

            setPlayerStats(prev => {
                const ps = { ...prev };
                if (!ps[playerId]) ps[playerId] = initPlayerStats([playerId], isHome ? 'home' : 'away')[playerId];
                ps[playerId] = { ...ps[playerId] };

                if (actionKey === 'assist') ps[playerId].Assists = (ps[playerId].Assists || 0) + 1;
                if (actionKey === 'yellowCard') ps[playerId].yellowCards = (ps[playerId].yellowCards || 0) + 1;
                if (actionKey === 'redCard') ps[playerId].redCards = (ps[playerId].redCards || 0) + 1;
                if (actionKey === 'corner') ps[playerId]['Corners Taken'] = (ps[playerId]['Corners Taken'] || 0) + 1;
                if (actionKey === 'foul') ps[playerId]['Fouls Committed'] = (ps[playerId]['Fouls Committed'] || 0) + 1;

                if (actionKey === 'shotMissed') {
                    ps[playerId].Shots = (ps[playerId].Shots || 0) + 1;
                }

                if (actionKey === 'shotOnTarget') {
                    ps[playerId].Shots = (ps[playerId].Shots || 0) + 1;
                    ps[playerId]['Shots on Target'] = (ps[playerId]['Shots on Target'] || 0) + 1;

                    // Automatically credit opposing Goalkeeper with a Save!
                    const oppPlayers = isHome ? awayPlayers : homePlayers;
                    const oppGkId = oppPlayers.find(id => studentsById[id]?.position === 'Goalkeeper') || oppPlayers[0];
                    if (oppGkId) {
                        const oppSide = isHome ? 'away' : 'home';
                        if (!ps[oppGkId]) ps[oppGkId] = initPlayerStats([oppGkId], oppSide)[oppGkId];
                        ps[oppGkId] = {
                            ...ps[oppGkId],
                            Saves: (ps[oppGkId].Saves || 0) + 1
                        };
                    }
                }

                return ps;
            });
        }
    }, [elapsed, homePlayers, awayPlayers, studentsById]);

    /* Shot/Goal Modal Save */
    const handleSaveShot = (shotDetails) => {
        if (!shotModalData) return;
        const { player } = shotModalData;
        const playerId = player.id;
        const isHome = homePlayers.includes(playerId);
        const { result, x, y, goalType, assistPlayerId } = shotDetails;

        const elapsedMins = Math.floor(elapsed / 60) + 1;
        const eventId = `event-${Date.now()}`;
        
        // Add shot event to timeline
        const eventType = result === 'goal' ? 'goal' : result === 'saved' ? 'shotOnTarget' : 'shotMissed';
        const assistPlayer = assistPlayerId ? studentsById[assistPlayerId] : null;

        const newEvent = {
            id: eventId,
            elapsed: elapsed,
            period: period,
            type: eventType,
            playerId,
            playerName: player.name,
            team: isHome ? 'home' : 'away',
            x, y,
            goalType,
            assistingPlayerId: assistPlayerId,
            assistingPlayerName: assistPlayer?.name || null
        };

        setTimeline(prev => [...prev, newEvent]);

        // Update player statistics
        setPlayerStats(prev => {
            const ps = { ...prev };
            
            // Scorer update
            if (!ps[playerId]) ps[playerId] = initPlayerStats([playerId], isHome ? 'home' : 'away')[playerId];
            const s = { ...ps[playerId] };

            if (result === 'goal') {
                if (goalType === 'own-goal') {
                    s.ownGoals += 1;
                } else {
                    s.Goals += 1;
                    s['Shots on Target'] += 1;
                    s.Shots += 1;
                }
            } else if (result === 'saved') {
                s['Shots on Target'] += 1;
                s.Shots += 1;

                // Auto-attribute save to opposing team's Goalkeeper
                const oppPlayers = isHome ? awayPlayers : homePlayers;
                const oppGkId = oppPlayers.find(id => studentsById[id]?.position === 'Goalkeeper');
                if (oppGkId && studentsById[oppGkId]) {
                    const oppGk = studentsById[oppGkId];
                    if (!oppGk.saveLogs) oppGk.saveLogs = [];
                    oppGk.saveLogs.push({
                        id: `gk-sv-${Date.now()}`,
                        year: '2024-2025',
                        term: 'Matchday 3',
                        result: 'save',
                        saveType: goalType === 'penalty' ? 'penalty' : goalType === 'freekick' ? 'freekick' : 'normal',
                        x: Math.round(x),
                        y: Math.round(y),
                        timestamp: Date.now()
                    });
                }
            } else {
                s.Shots += 1;
            }
            ps[playerId] = s;

            // Assisting player update
            if (result === 'goal' && goalType !== 'own-goal' && assistPlayerId) {
                const assistSide = homePlayers.includes(assistPlayerId) ? 'home' : 'away';
                if (!ps[assistPlayerId]) ps[assistPlayerId] = initPlayerStats([assistPlayerId], assistSide)[assistPlayerId];
                ps[assistPlayerId] = {
                    ...ps[assistPlayerId],
                    Assists: ps[assistPlayerId].Assists + 1
                };
            }

            return ps;
        });

        setShotModalData(null);
    };

    const handleSaveGkSave = (gkSaveDetails) => {
        if (!gkSaveModalData) return;
        const { player } = gkSaveModalData;
        const playerId = player.id;
        const isHome = homePlayers.includes(playerId);
        const { saveType, corner } = gkSaveDetails;

        const eventId = `event-${Date.now()}`;
        
        const newEvent = {
            id: eventId,
            elapsed: elapsed,
            period: period,
            type: 'gkSave',
            playerId,
            playerName: player.name,
            team: isHome ? 'home' : 'away',
            saveType,
            corner
        };

        setTimeline(prev => [...prev, newEvent]);

        // Update goalkeeper statistics and saveLogs
        const gk = studentsById[playerId];
        if (gk) {
            if (!gk.saveLogs) gk.saveLogs = [];
            const cornerCoords = {
                'top-left': { x: 25, y: 35 },
                'top-right': { x: 75, y: 35 },
                'center': { x: 50, y: 57 },
                'bottom-left': { x: 25, y: 80 },
                'bottom-right': { x: 75, y: 80 }
            };
            const coords = cornerCoords[corner] || { x: 50, y: 50 };
            gk.saveLogs.push({
                id: `gk-sv-${Date.now()}`,
                year: '2024-2025',
                term: 'Matchday 3',
                result: 'save',
                saveType: saveType,
                x: coords.x,
                y: coords.y,
                timestamp: Date.now()
            });
        }

        setPlayerStats(prev => {
            const ps = { ...prev };
            if (!ps[playerId]) ps[playerId] = initPlayerStats([playerId], isHome ? 'home' : 'away')[playerId];
            const s = { ...ps[playerId] };

            s.Saves = (s.Saves || 0) + 1;
            if (saveType === 'penalty') {
                s['Penalties Saved'] = (s['Penalties Saved'] || 0) + 1;
            } else if (saveType === 'freekick') {
                s['Free Kick Saves'] = (s['Free Kick Saves'] || 0) + 1;
            }

            ps[playerId] = s;
            return ps;
        });

        setGkSaveModalData(null);
    };

    /* Undo/Delete Timeline Event */
    const handleUndoEvent = (eventId) => {
        const ev = timeline.find(t => t.id === eventId);
        if (!ev) return;

        // Decrement stats
        setPlayerStats(prev => {
            const ps = { ...prev };
            const pId = ev.playerId;
            if (!ps[pId]) return prev;

            const s = { ...ps[pId] };

            if (ev.type === 'goal') {
                if (ev.goalType === 'own-goal') {
                    s.ownGoals = Math.max(0, s.ownGoals - 1);
                } else {
                    s.Goals = Math.max(0, s.Goals - 1);
                    s['Shots on Target'] = Math.max(0, s['Shots on Target'] - 1);
                    s.Shots = Math.max(0, s.Shots - 1);

                    // Revert assist if any
                    if (ev.assistingPlayerId && ps[ev.assistingPlayerId]) {
                        ps[ev.assistingPlayerId] = {
                            ...ps[ev.assistingPlayerId],
                            Assists: Math.max(0, ps[ev.assistingPlayerId].Assists - 1)
                        };
                    }
                }
            } else if (ev.type === 'shotOnTarget') {
                s['Shots on Target'] = Math.max(0, s['Shots on Target'] - 1);
                s.Shots = Math.max(0, s.Shots - 1);
            } else if (ev.type === 'shotMissed') {
                s.Shots = Math.max(0, s.Shots - 1);
            } else if (ev.type === 'assist') {
                s.Assists = Math.max(0, s.Assists - 1);
            } else if (ev.type === 'yellowCard') {
                s.yellowCards = Math.max(0, s.yellowCards - 1);
            } else if (ev.type === 'redCard') {
                s.redCards = Math.max(0, s.redCards - 1);
            } else if (ev.type === 'gkSave') {
                s.Saves = Math.max(0, (s.Saves || 0) - 1);
                if (ev.saveType === 'penalty') {
                    s['Penalties Saved'] = Math.max(0, (s['Penalties Saved'] || 0) - 1);
                } else if (ev.saveType === 'freekick') {
                    s['Free Kick Saves'] = Math.max(0, (s['Free Kick Saves'] || 0) - 1);
                }
            }

            ps[pId] = s;
            return ps;
        });

        // Remove from timeline
        setTimeline(prev => prev.filter(t => t.id !== eventId));
    };

    /* detail stat change */
    const handleDetailChange = useCallback((playerId, stat, value) => {
        const num = Math.max(0, Number(value) || 0);
        setPlayerStats(prev => {
            const ps = { ...prev, [playerId]: { ...prev[playerId] } };
            if (stat === 'Minutes Played') ps[playerId].minutesPlayed = num;
            else ps[playerId][stat] = num;
            return ps;
        });
    }, []);

    /* quick-action badge count */
    const badgeCount = useCallback((playerId, actionKey) => {
        const s = playerStats[playerId];
        if (!s) return 0;
        switch (actionKey) {
            case 'goal':         return s.Goals + s.ownGoals; // Combined indicator
            case 'assist':       return s.Assists;
            case 'yellowCard':   return s.yellowCards;
            case 'redCard':      return s.redCards;
            default:             return 0;
        }
    }, [playerStats]);

    /* end match */
    const confirmEnd = () => {
        onEndMatch({
            id: matchData.id,
            homeTeamId, awayTeamId, ageGroup, matchday,
            homeScore, awayScore,
            playerStats,
            timeline,
            status: 'completed',
            startTime: startTimeRef.current,
            endTime: Date.now(),
            date: new Date().toISOString(),
        });
    };

    /* Format timeline timer */
    const formatEventTime = (secs, eventPeriod) => {
        const mins = Math.floor(secs / 60);
        const p = eventPeriod || (mins < 45 ? '1H' : '2H');
        
        if (p === '1H') {
            if (mins >= 45) {
                const extra = mins - 45 + 1;
                return `45+${extra}'`;
            }
            return `${mins + 1}'`;
        } else {
            const displayMins = mins + 1;
            if (displayMins > 90) {
                const extra = displayMins - 90;
                return `90+${extra}'`;
            }
            return `${displayMins}'`;
        }
    };

    /* ─── render helpers ───────────────────────────────────────────── */
    const renderPitchView = (side) => {
        const squadSelection = side === 'home' ? homeSquadSelection : awaySquadSelection;
        const starters = side === 'home' ? homeStarters : awayStarters;
        const formationText = squadSelection?.formation || '4-3-3';
        const layout = FORMATION_LAYOUTS[formationText];
        const slots = layout ? layout.slots : [];

        return (
            <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '125%',
                background: 'linear-gradient(180deg, #134e23 0%, #175a2a 15%, #134e23 30%, #175a2a 45%, #134e23 60%, #175a2a 75%, #134e23 90%, #175a2a 100%)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: 'var(--border)',
                boxShadow: 'var(--shadow-md)',
            }}>
                {/* Pitch markings */}
                <div style={{ position: 'absolute', inset: '4%', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                <div style={{ position: 'absolute', left: '4%', right: '4%', top: '50%', height: '1.5px', background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: '22%', height: '16%', transform: 'translate(-50%, -50%)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', left: '24%', right: '24%', top: '4%', height: '12%', border: '1.5px solid rgba(255,255,255,0.15)', borderTop: 'none' }} />
                <div style={{ position: 'absolute', left: '24%', right: '24%', bottom: '4%', height: '12%', border: '1.5px solid rgba(255,255,255,0.15)', borderBottom: 'none' }} />

                {/* Click-away overlay for context menu */}
                {activePitchPlayerMenu && activePitchPlayerMenu.side === side && (
                    <div 
                        onClick={() => setActivePitchPlayerMenu(null)}
                        style={{ position: 'absolute', inset: 0, zIndex: 40 }}
                    />
                )}

                {/* Player slots on Pitch */}
                {slots.map((slot, idx) => {
                    const playerId = starters[idx];
                    const student = studentsById[playerId];
                    if (!student) return null;

                    const roleColor = ROLE_COLORS[slot.role] || '#6366f1';
                    const jersey = student.jerseyNumber;
                    const nameParts = student.name.trim().split(/\s+/);
                    const lastName = nameParts[nameParts.length - 1] || student.name;
                    const stats = playerStats[student.id] || {};

                    return (
                        <div 
                            key={idx} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePitchPlayerMenu({
                                    playerId: student.id,
                                    x: slot.x,
                                    y: slot.y,
                                    side
                                });
                            }}
                            style={{
                                position: 'absolute',
                                left: `${slot.x}%`,
                                top: `${slot.y}%`,
                                transform: 'translate(-50%, -50%)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                                zIndex: 2,
                                cursor: 'pointer',
                            }}
                        >
                            {/* Player Circle */}
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: roleColor,
                                border: '1.5px solid rgba(255,255,255,0.85)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: '800',
                                color: '#ffffff',
                                boxShadow: `0 2px 6px ${roleColor}66`,
                                position: 'relative',
                            }}>
                                {jersey != null ? jersey : (idx + 1)}

                                {/* Small stat indicator dot badges */}
                                {(stats.Goals > 0 || stats.ownGoals > 0) && (
                                    <span style={{
                                        position: 'absolute', top: '-4px', right: '-4px',
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        background: '#22c55e', color: '#fff', fontSize: '7px', fontWeight: '900',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {stats.Goals + stats.ownGoals}
                                    </span>
                                )}
                            </div>
                            
                            {/* Position & Name Labels */}
                            <div style={{
                                background: 'rgba(15,15,15,0.85)',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontSize: '8px',
                                fontWeight: '700',
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                maxWidth: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {lastName}
                            </div>
                        </div>
                    );
                })}

                {/* Floating Context Menu Card */}
                {activePitchPlayerMenu && activePitchPlayerMenu.side === side && (() => {
                    const activeStudent = studentsById[activePitchPlayerMenu.playerId];
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${activePitchPlayerMenu.x}%`,
                            top: `${activePitchPlayerMenu.y}%`,
                            transform: activePitchPlayerMenu.y < 35 ? 'translate(-50%, 15px)' : 'translate(-50%, -108%)', // Flip if too high up
                            background: 'rgba(10, 16, 32, 0.96)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            padding: '8px',
                            zIndex: 50,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            minWidth: '130px'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '3px', marginBottom: '3px', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {activeStudent?.name}
                            </div>
                            <button onClick={() => { handleQuickAction(activePitchPlayerMenu.playerId, 'goal'); setActivePitchPlayerMenu(null); }} className="pitch-menu-item">⚽ Log Goal/Shot</button>
                            {!isRefereeMode && (
                                <button onClick={() => { handleQuickAction(activePitchPlayerMenu.playerId, 'assist'); setActivePitchPlayerMenu(null); }} className="pitch-menu-item">👟🎯 Log Assist</button>
                            )}
                            <button onClick={() => { handleQuickAction(activePitchPlayerMenu.playerId, 'yellowCard'); setActivePitchPlayerMenu(null); }} className="pitch-menu-item">🟨 Yellow Card</button>
                            <button onClick={() => { handleQuickAction(activePitchPlayerMenu.playerId, 'redCard'); setActivePitchPlayerMenu(null); }} className="pitch-menu-item">🟥 Red Card</button>
                            {!isRefereeMode && activeStudent?.position === 'Goalkeeper' && (
                                <button onClick={() => { setGkSaveModalData({ player: { id: activePitchPlayerMenu.playerId, name: activeStudent?.name } }); setActivePitchPlayerMenu(null); }} className="pitch-menu-item" style={{ color: '#34d399', fontWeight: '700' }}>🧤 Log GK Save</button>
                            )}
                            <button onClick={() => setActivePitchPlayerMenu(null)} className="pitch-menu-item" style={{ color: 'var(--danger)', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2px', paddingTop: '4px' }}>Close</button>
                        </div>
                    );
                })()}
            </div>
        );
    };

    /* ─── render helpers ───────────────────────────────────────────── */
    const renderPlayerRow = (playerId) => {
        const student = studentsById[playerId];
        const name = student?.name ?? `Player #${playerId}`;
        const jersey = student?.jerseyNumber;
        const isExpanded = expandedPlayer === playerId;

        return (
            <div key={playerId} style={styles.playerCard}>
                {/* Main row */}
                <div
                    style={styles.playerRow}
                    onClick={() => setExpandedPlayer(isExpanded ? null : playerId)}
                >
                    {/* Jersey + name */}
                    <div style={styles.playerIdentity}>
                        <span style={styles.jerseyBadge}>{jersey != null ? jersey : (playerId % 22) + 2}</span>
                        <span style={styles.playerName}>{name}</span>
                        {homeStarters.includes(playerId) || awayStarters.includes(playerId) ? (
                            <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--success)', background: 'rgba(16,185,129,0.12)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', flexShrink: 0 }}>XI</span>
                        ) : homeBench.includes(playerId) || awayBench.includes(playerId) ? (
                            <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--warning)', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', flexShrink: 0 }}>SUB</span>
                        ) : null}
                        <span style={{ ...styles.expandArrow, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                    </div>

                    {/* Quick actions */}
                    <div style={styles.actionsRow} onClick={e => e.stopPropagation()}>
                        {(isRefereeMode ? QUICK_ACTIONS.filter(a => a.key !== 'assist') : QUICK_ACTIONS).map(action => {
                            const count = badgeCount(playerId, action.key);
                            const hoverKey = `${playerId}-${action.key}`;
                            const isHovered = hoveredBtn === hoverKey;
                            return (
                                <button
                                    key={action.key}
                                    title={action.tooltip}
                                    style={{
                                        ...styles.actionBtn,
                                        background: isHovered ? action.hoverColor : action.color,
                                        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                                    }}
                                    onMouseEnter={() => setHoveredBtn(hoverKey)}
                                    onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={() => handleQuickAction(playerId, action.key)}
                                >
                                    <span style={styles.actionEmoji}>{action.label}</span>
                                    {count > 0 && (
                                        <span style={styles.badge}>{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Expandable detail panel */}
                {isExpanded && !isRefereeMode && (
                    <div style={styles.detailPanel}>
                        <div style={styles.detailGrid}>
                            {DETAIL_STATS.map(stat => {
                                const val = stat === 'Minutes Played'
                                    ? playerStats[playerId]?.minutesPlayed ?? 0
                                    : playerStats[playerId]?.[stat] ?? 0;
                                return (
                                    <div key={stat} style={styles.detailField}>
                                        <label style={styles.detailLabel}>{stat}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={val}
                                            onChange={e => handleDetailChange(playerId, stat, e.target.value)}
                                            style={styles.detailInput}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /* ─── main render ──────────────────────────────────────────────── */
    return (
        <div style={styles.wrapper}>
            {/* ── Scoreboard ─────────────────────────────────────────── */}
            <div style={styles.scoreboard}>
                <div style={styles.matchdayLabel}>{matchday ?? 'Match Day'}</div>

                <div style={styles.scoreRow}>
                    {/* Home */}
                    <div style={styles.teamBlock}>
                        {home.school?.logo && (
                            <img src={home.school.logo} alt="" style={styles.teamLogo} />
                        )}
                        <span style={styles.teamName}>{home.name}</span>
                    </div>

                    {/* Score + Timer */}
                    <div style={styles.scoreCenter}>
                        <div style={styles.scoreLine}>
                            <span style={styles.scoreNum}>{homeScore}</span>
                            <span style={styles.scoreDivider}>–</span>
                            <span style={styles.scoreNum}>{awayScore}</span>
                        </div>
                        <div style={styles.timer}>
                            <span style={{
                                ...styles.liveDot,
                                background: isPaused ? 'var(--text-muted)' : 'var(--success)',
                                animation: isPaused ? 'none' : 'pulse 1.5s infinite'
                            }} />
                            <span style={{ marginRight: '10px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {period === 'HT' ? 'Half-Time' : (
                                    <>
                                        {period === '1H' && elapsed > 2700 ? (
                                            `45:00 +${pad(Math.floor((elapsed - 2700) / 60))}:${pad((elapsed - 2700) % 60)}`
                                        ) : period === '2H' && elapsed > 5400 ? (
                                            `90:00 +${pad(Math.floor((elapsed - 5400) / 60))}:${pad((elapsed - 5400) % 60)}`
                                        ) : (
                                            `${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}`
                                        )}
                                    </>
                                )}
                            </span>
                            
                            {!isRefereeMode && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {period !== 'HT' && (
                                        <button
                                            type="button"
                                            onClick={handleTogglePause}
                                            style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                color: 'var(--text-primary)',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                outline: 'none',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                        >
                                            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                                        </button>
                                    )}

                                    {period === '1H' && (
                                        <button
                                            type="button"
                                            onClick={handleEndFirstHalf}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.12)',
                                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                color: '#f87171',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                                        >
                                            End 1st Half
                                        </button>
                                    )}

                                    {period === 'HT' && (
                                        <button
                                            type="button"
                                            onClick={handleStartSecondHalf}
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.12)',
                                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                color: '#34d399',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'}
                                        >
                                            Start 2nd Half
                                        </button>
                                    )}

                                    {period === '2H' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(true)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.12)',
                                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                color: '#f87171',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                                        >
                                            End Match
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Away */}
                    <div style={{ ...styles.teamBlock, flexDirection: 'row-reverse' }}>
                        {away.school?.logo && (
                            <img src={away.school.logo} alt="" style={styles.teamLogo} />
                        )}
                        <span style={{ ...styles.teamName, textAlign: 'right' }}>{away.name}</span>
                    </div>
                </div>
            </div>

            {/* ── Mobile Section Switcher ──────────────────────────────── */}
            <div className="mobile-live-tab-bar">
                <button
                    className={`mobile-live-tab-btn ${mobileTab === 'home' ? 'active' : ''}`}
                    onClick={() => setMobileTab('home')}
                >
                    🏠 Home ({homeStarters.length + homeBench.length})
                </button>
                <button
                    className={`mobile-live-tab-btn ${mobileTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setMobileTab('timeline')}
                >
                    ⏱️ Timeline ({timeline.length})
                </button>
                <button
                    className={`mobile-live-tab-btn ${mobileTab === 'away' ? 'active' : ''}`}
                    onClick={() => setMobileTab('away')}
                >
                    ✈️ Away ({awayStarters.length + awayBench.length})
                </button>
            </div>

            {/* ── Mode Switcher for Data Entry Mode ───────────────────── */}
            {!isRefereeMode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', border: 'var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700' }}>Data Entry Layout:</span>
                        <button
                            type="button"
                            onClick={() => setCaptureViewMode('tile')}
                            style={{
                                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '800',
                                background: captureViewMode === 'tile' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
                                color: '#ffffff', border: captureViewMode === 'tile' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: captureViewMode === 'tile' ? '0 4px 14px rgba(16,185,129,0.3)' : 'none'
                            }}
                        >
                            ⚡ Rapid Tile Capture (Direct Tiles)
                        </button>
                        <button
                            type="button"
                            onClick={() => setCaptureViewMode('roster')}
                            style={{
                                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '800',
                                background: captureViewMode === 'roster' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.06)',
                                color: '#ffffff', border: captureViewMode === 'roster' ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            📋 Classic Roster View
                        </button>
                    </div>
                    <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '700' }}>
                        {captureViewMode === 'tile' ? '● Active: Direct Action Tiles & Team Possession Logging' : '● Active: Classic View'}
                    </span>
                </div>
            )}

            {/* ── Render Rapid Tile Capture Control Panel ────────────── */}
            {!isRefereeMode && captureViewMode === 'tile' && (
                <TileDataCaptureControlPanel
                    match={matchData}
                    home={home}
                    away={away}
                    homePlayers={homePlayers}
                    awayPlayers={awayPlayers}
                    studentsById={studentsById}
                    playerStats={playerStats}
                    elapsed={elapsed}
                    period={period}
                    onQuickLogEvent={(logData) => {
                        if (logData.type === 'possessionChange') {
                            setTimeline(prev => [
                                ...prev,
                                {
                                    id: `event-${Date.now()}`,
                                    elapsed,
                                    period,
                                    type: 'possession',
                                    team: logData.team,
                                    teamName: logData.teamName,
                                    homePct: logData.homePct,
                                    awayPct: logData.awayPct,
                                    playerName: `Ball Possession: ${logData.teamName} (${logData.team === 'home' ? logData.homePct : logData.awayPct}%)`
                                }
                            ]);
                            return;
                        }
                        handleQuickAction(logData.playerId, logData.type);
                    }}
                    onShotModal={(player, defaultOutcome) => {
                        const isHome = homePlayers.includes(player.id);
                        const teammates = isHome 
                            ? homePlayers.map(id => studentsById[id]).filter(Boolean)
                            : awayPlayers.map(id => studentsById[id]).filter(Boolean);
                        setShotModalData({
                            player,
                            defaultOutcome: defaultOutcome || 'goal',
                            teammates
                        });
                    }}
                    onGkSaveModal={(player) => {
                        setGkSaveModalData({ player });
                    }}
                />
            )}

            {/* ── Three-column layout ─────────────────────────────────── */}
            <div style={styles.columns} className="live-match-columns">
                {/* Home column */}
                <div style={{ ...styles.column, display: (window.innerWidth <= 900 && mobileTab !== 'home') ? 'none' : 'flex' }}>
                    <div style={styles.columnHeader}>
                        <span style={styles.columnHeaderDot('#22c55e')} />
                        <span style={{ flex: 1 }}>Home Roster</span>
                        {homePlayers.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                    onClick={() => setHomeViewMode('list')}
                                    style={homeViewMode === 'list' ? styles.toggleBtnActive : styles.toggleBtn}
                                >
                                    📋 List
                                </button>
                                <button 
                                    onClick={() => setHomeViewMode('pitch')}
                                    style={homeViewMode === 'pitch' ? styles.toggleBtnActive : styles.toggleBtn}
                                >
                                    ⚽ Pitch
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {homeViewMode === 'pitch' ? (
                        renderPitchView('home')
                    ) : (
                        <div style={styles.playerList}>
                            {homeSquadSelection ? (
                                <>
                                    {homeStarters.length > 0 && (
                                        <>
                                            <div style={styles.rosterGroupHeader}>Starting XI ({homeSquadSelection.formation || '4-3-3'})</div>
                                            {homeStarters.map(renderPlayerRow)}
                                        </>
                                    )}
                                    {homeBench.length > 0 && (
                                        <>
                                            <div style={styles.rosterGroupHeader}>Substitutes Bench</div>
                                            {homeBench.map(renderPlayerRow)}
                                        </>
                                    )}
                                    {homeUnassigned.length > 0 && (
                                        <>
                                            <div style={styles.rosterGroupHeader}>Reserves</div>
                                            {homeUnassigned.map(renderPlayerRow)}
                                        </>
                                    )}
                                </>
                            ) : (
                                homePlayers.map(renderPlayerRow)
                            )}
                        </div>
                    )}
                </div>

                {/* Center Match Timeline Column */}
                <div style={{ ...styles.timelineColumn, display: (window.innerWidth <= 900 && mobileTab !== 'timeline') ? 'none' : 'flex' }}>
                    <div style={styles.columnHeader}>
                        ⏱️ Match Timeline
                    </div>
                    <div style={styles.timelineWrapper}>
                        {timeline.length === 0 ? (
                            <div style={styles.timelineEmpty}>
                                No events logged yet.<br />
                                <span style={{ fontSize: '11px', opacity: 0.6 }}>Tap quick action buttons on players to register events.</span>
                            </div>
                        ) : (
                            <div style={styles.timelineList}>
                                {timeline.slice().reverse().map(event => {
                                    let icon = '⚡';
                                    let clr = '#fff';
                                    let desc = '';

                                    if (event.type === 'goal') {
                                        icon = '⚽';
                                        clr = '#22c55e';
                                        let goalLabel = 'Goal';
                                        if (event.goalType === 'header') goalLabel = 'Header Goal';
                                        if (event.goalType === 'penalty') goalLabel = 'Penalty Goal';
                                        if (event.goalType === 'freekick') goalLabel = 'Free Kick Goal';
                                        if (event.goalType === 'own-goal') {
                                            goalLabel = 'Own Goal ⚠️';
                                            clr = '#ef4444';
                                        }

                                        desc = `${goalLabel} by ${event.playerName}`;
                                        if (event.assistingPlayerName) {
                                            desc += ` (Assist: ${event.assistingPlayerName})`;
                                        }
                                    } else if (event.type === 'shotOnTarget') {
                                        icon = '🎯';
                                        clr = '#14b8a6';
                                        desc = `Shot Saved - ${event.playerName}`;
                                    } else if (event.type === 'shotMissed') {
                                        icon = '❌';
                                        clr = '#6b7280';
                                        desc = `Shot Missed - ${event.playerName}`;
                                    } else if (event.type === 'assist') {
                                        icon = '🅰️';
                                        clr = '#6366f1';
                                        desc = `Direct Assist by ${event.playerName}`;
                                    } else if (event.type === 'yellowCard') {
                                        icon = '🟨';
                                        clr = '#f59e0b';
                                        desc = `Yellow Card - ${event.playerName}`;
                                    } else if (event.type === 'redCard') {
                                        icon = '🟥';
                                        clr = '#ef4444';
                                        desc = `Red Card - ${event.playerName}`;
                                    } else if (event.type === 'gkSave') {
                                        icon = '🧤';
                                        clr = '#10b981';
                                        let saveLabel = 'Save';
                                        if (event.saveType === 'penalty') saveLabel = 'Penalty Save 🥅';
                                        if (event.saveType === 'freekick') saveLabel = 'Free Kick Save 🎯';
                                        const cornerLabel = event.corner ? event.corner.replace('-', ' ') : '';
                                        desc = `${saveLabel} in the ${cornerLabel} corner by ${event.playerName}`;
                                    } else if (event.type === 'possession') {
                                        icon = '⏱️';
                                        clr = event.team === 'home' ? '#22c55e' : '#6366f1';
                                        desc = event.playerName || `Ball Possession: ${event.teamName}`;
                                    } else if (event.type === 'foul') {
                                        icon = '🛑';
                                        clr = '#ea580c';
                                        desc = `Foul Committed - ${event.playerName}`;
                                    } else if (event.type === 'corner') {
                                        icon = '🚩';
                                        clr = '#3b82f6';
                                        desc = `Corner Kick - ${event.playerName}`;
                                    } else if (event.type === 'penalty') {
                                        icon = '🎯';
                                        clr = '#8b5cf6';
                                        desc = `Penalty Kick Awarded - ${event.playerName}`;
                                    } else if (event.type === 'offside') {
                                        icon = '🚩';
                                        clr = '#64748b';
                                        desc = `Offside Infringement - ${event.playerName}`;
                                    }

                                    return (
                                        <div key={event.id} style={styles.timelineItem(clr)}>
                                            <span style={styles.timelineTime}>{formatEventTime(event.elapsed, event.period)}</span>
                                            <span style={{ fontSize: '14px' }}>{icon}</span>
                                            <span style={styles.timelineText}>{desc}</span>
                                            <button
                                                title="Undo this event"
                                                onClick={() => handleUndoEvent(event.id)}
                                                style={styles.undoBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Away column */}
                <div style={{ ...styles.column, display: (window.innerWidth <= 900 && mobileTab !== 'away') ? 'none' : 'flex' }}>
                    <div style={styles.columnHeader}>
                        <span style={styles.columnHeaderDot('#6366f1')} />
                        <span style={{ flex: 1 }}>Away Roster</span>
                        {awayPlayers.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                    onClick={() => setAwayViewMode('list')}
                                    style={awayViewMode === 'list' ? styles.toggleBtnActive : styles.toggleBtn}
                                >
                                    📋 List
                                </button>
                                <button 
                                    onClick={() => setAwayViewMode('pitch')}
                                    style={awayViewMode === 'pitch' ? styles.toggleBtnActive : styles.toggleBtn}
                                >
                                    ⚽ Pitch
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {awayViewMode === 'pitch' ? (
                        renderPitchView('away')
                    ) : (
                        <div style={styles.playerList}>
                            {awaySquadSelection ? (
                                <>
                                    {awayStarters.length > 0 && (
                                        <>
                                            <div style={styles.rosterGroupHeader}>Starting XI ({awaySquadSelection.formation || '4-3-3'})</div>
                                            {awayStarters.map(renderPlayerRow)}
                                        </>
                                    )}
                                    {awayBench.length > 0 && (
                                        <>
                                            <div style={styles.rosterGroupHeader}>Substitutes Bench</div>
                                            {awayBench.map(renderPlayerRow)}
                                        </>
                                    )}
                                    {awayUnassigned.length > 0 && (
                                        <>
                                            <div style={styles.rosterGroupHeader}>Reserves</div>
                                            {awayUnassigned.map(renderPlayerRow)}
                                        </>
                                    )}
                                </>
                            ) : (
                                awayPlayers.map(renderPlayerRow)
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom bar ─────────────────────────────────────────── */}
            <div style={styles.bottomBar}>
                <button
                    style={styles.cancelBtn}
                    onClick={onCancel}
                >
                    Cancel Match
                </button>
                <button
                    style={styles.endBtn}
                    onClick={() => setShowConfirm(true)}
                >
                    End Match
                </button>
            </div>

            {/* ── Visual Shot Modal ───────────────────────────────────── */}
            {shotModalData && (
                <LiveShotModal
                    player={shotModalData.player}
                    teammates={shotModalData.teammates}
                    defaultOutcome={shotModalData.defaultOutcome}
                    onSave={handleSaveShot}
                    onClose={() => setShotModalData(null)}
                />
            )}

            {/* ── Goalkeeper Save Modal ───────────────────────────────── */}
            {gkSaveModalData && (
                <LiveGkSaveModal
                    player={gkSaveModalData.player}
                    onSave={handleSaveGkSave}
                    onClose={() => setGkSaveModalData(null)}
                />
            )}

            {/* ── Confirmation dialog ────────────────────────────────── */}
            {showConfirm && (
                <div style={styles.overlay} onClick={() => setShowConfirm(false)}>
                    <div style={styles.dialog} onClick={e => e.stopPropagation()}>
                        <h3 style={styles.dialogTitle}>End Match?</h3>
                        <p style={styles.dialogBody}>
                            Final score: <strong>{home.name} {homeScore}</strong> – <strong>{awayScore} {away.name}</strong>.
                            <br />All player stats will be saved. This cannot be undone.
                        </p>
                        <div style={styles.dialogActions}>
                            <button
                                style={styles.dialogCancelBtn}
                                onClick={() => setShowConfirm(false)}
                            >
                                Keep Playing
                            </button>
                            <button
                                style={styles.dialogConfirmBtn}
                                onClick={confirmEnd}
                            >
                                Confirm &amp; End
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .pitch-menu-item {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 11px;
                    font-weight: 600;
                    padding: 5px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    text-align: left;
                    font-family: inherit;
                    transition: all 0.15s ease;
                }
                .pitch-menu-item:hover {
                    background: rgba(255,255,255,0.08);
                    color: var(--text-primary);
                }
            `}} />
        </div>
    );
}

/* ─── styles ───────────────────────────────────────────────────────── */
const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px 32px 48px',
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary, #e2e8f0)',
        fontFamily: 'inherit',
    },

    /* Scoreboard */
    scoreboard: {
        background: 'var(--bg-surface)',
        border: 'var(--border)',
        borderRadius: '20px',
        padding: '24px 32px',
        textAlign: 'center',
    },
    matchdayLabel: {
        fontSize: '13px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--text-muted, #64748b)',
        marginBottom: '12px',
    },
    scoreRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
    },
    teamBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
        justifyContent: 'flex-end',
    },
    teamLogo: {
        width: '48px',
        height: '48px',
        objectFit: 'contain',
        borderRadius: '8px',
    },
    teamName: {
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary, #e2e8f0)',
        maxWidth: '180px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    scoreCenter: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '160px',
    },
    scoreLine: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    scoreNum: {
        fontSize: '52px',
        fontWeight: 800,
        lineHeight: 1,
        color: '#fff',
        fontVariantNumeric: 'tabular-nums',
    },
    scoreDivider: {
        fontSize: '36px',
        fontWeight: 300,
        color: 'var(--text-muted, #64748b)',
    },
    timer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '8px',
        fontSize: '14px',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-primary)',
    },
    liveDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--success)',
        animation: 'pulse 1.5s infinite',
        boxShadow: 'none',
    },

    /* Columns layout */
    columns: {
        display: 'grid',
        gridTemplateColumns: '1fr 340px 1fr',
        gap: '20px',
        alignItems: 'start'
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    timelineColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'var(--bg-card)',
        border: 'var(--border)',
        borderRadius: '16px',
        padding: '16px',
        height: '460px'
    },
    timelineWrapper: {
        flex: 1,
        overflowY: 'auto',
        paddingRight: '4px'
    },
    timelineEmpty: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
        lineHeight: 1.6,
        padding: '20px'
    },
    timelineList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    timelineItem: (clr) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--bg-card)',
        borderLeft: `3px solid ${clr}`,
        borderRadius: '0 8px 8px 0',
        fontSize: '12px',
        animation: 'fadeIn 0.2s ease'
    }),
    timelineTime: {
        fontWeight: '700',
        color: 'var(--primary-light)',
        minWidth: '24px',
    },
    timelineText: {
        flex: 1,
        color: 'var(--text-primary)',
        fontWeight: '500',
        lineHeight: 1.3
    },
    undoBtn: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.2)',
        fontSize: '12px',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: '4px',
        transition: 'all 0.15s ease'
    },
    columnHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        color: 'var(--text-secondary, #94a3b8)',
        padding: '0 4px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    columnHeaderDot: (clr) => ({
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: clr,
        display: 'inline-block',
    }),
    playerList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    rosterGroupHeader: {
        fontSize: '10px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'var(--text-secondary)',
        marginTop: '12px',
        marginBottom: '4px',
        padding: '4px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    toggleBtn: {
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '700',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-muted)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'all 0.15s'
    },
    toggleBtnActive: {
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '700',
        background: 'rgba(37,99,235,0.18)',
        color: 'var(--primary-light)',
        border: '1px solid rgba(37,99,235,0.35)',
        cursor: 'pointer',
        transition: 'all 0.15s'
    },

    /* Player card */
    playerCard: {
        background: 'var(--bg-card)',
        border: 'var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
    },
    playerRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        gap: '8px',
    },
    playerIdentity: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
        flex: '1 1 auto',
    },
    jerseyBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: 'var(--bg-input)',
        border: 'var(--border)',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        flexShrink: 0,
    },
    playerName: {
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-primary, #e2e8f0)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    expandArrow: {
        fontSize: '11px',
        color: 'var(--text-muted, #64748b)',
        transition: 'transform 0.2s ease',
        flexShrink: 0,
    },

    /* Quick-action buttons */
    actionsRow: {
        display: 'flex',
        gap: '4px',
        flexShrink: 0,
    },
    actionBtn: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        padding: 0,
    },
    actionEmoji: {
        fontSize: '14px',
        lineHeight: 1,
    },
    badge: {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        minWidth: '16px',
        height: '16px',
        borderRadius: '8px',
        background: '#fff',
        color: '#040814',
        fontSize: '10px',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 3px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    },

    /* Detail panel */
    detailPanel: {
        padding: '12px 14px 14px',
        borderTop: 'var(--border)',
        background: 'rgba(0,0,0,0.15)',
    },
    detailGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
    },
    detailField: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    detailLabel: {
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted, #64748b)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    detailInput: {
        width: '100%',
        padding: '6px 8px',
        borderRadius: '6px',
        border: 'var(--border)',
        background: 'var(--bg-input)',
        color: 'var(--text-primary, #e2e8f0)',
        fontSize: '13px',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    },

    /* Bottom bar */
    bottomBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0 0',
        borderTop: 'var(--border)',
    },
    cancelBtn: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-secondary, #94a3b8)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
    },
    endBtn: {
        padding: '10px 28px',
        borderRadius: '10px',
        border: 'none',
        background: 'var(--danger)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
    },

    /* Overlay / Confirmation dialog */
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    dialog: {
        background: 'var(--bg-surface)',
        border: 'var(--border)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '440px',
        width: '90%',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
    },
    dialogTitle: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#fff',
        margin: '0 0 12px',
    },
    dialogBody: {
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--text-secondary, #94a3b8)',
        margin: '0 0 24px',
    },
    dialogActions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
    },
    dialogCancelBtn: {
        padding: '10px 22px',
        borderRadius: '10px',
        border: 'var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-secondary, #94a3b8)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
    },
    dialogConfirmBtn: {
        padding: '10px 22px',
        borderRadius: '10px',
        border: 'none',
        background: 'var(--danger)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
    },
};
