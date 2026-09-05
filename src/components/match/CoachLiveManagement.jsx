import { useState, useMemo, useEffect } from 'react';
import JerseyIcon from '../JerseyIcon';
import { PMC_MATCHES } from '../../utils/pmcDataLoader';

// Standard Tactical Formations
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
            { y: 16, x: 50, role: 'ST', label: 'ST' },
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

export default function CoachLiveManagement({
    match: initialMatch,
    matches = [],
    schoolId,
    schools = [],
    allTeams = [],
    teamId,
    allPlayers = [],
    year,
    onUpdateMatch
}) {
    // Current Active Mode: 'pitch_subs' | 'halftime_stats'
    const [viewMode, setViewMode] = useState('pitch_subs');

    // Selected Match ID (defaults to initialMatch if provided)
    const [selectedMatchId, setSelectedMatchId] = useState(initialMatch?.id || null);

    // Substitution Drag & Drop and Tap Selection State
    const [draggedItem, setDraggedItem] = useState(null); // { type: 'bench' | 'pitch', playerId, slotIndex }
    const [dragOverSlotIndex, setDragOverSlotIndex] = useState(null);
    const [selectedBenchForSub, setSelectedBenchForSub] = useState(null); // For tablet tap-to-sub

    // Explicit Confirmation Dialog State
    const [pendingSubModal, setPendingSubModal] = useState(null); // { playerOffId, playerOnId, slotIndex, minute }
    const [subExecutionType, setSubExecutionType] = useState('direct'); // 'direct' (instant coach apply) | 'official_request'
    const [subTacticalNote, setSubTacticalNote] = useState('');
    const [toastMessage, setToastMessage] = useState(null);

    // Halftime / In-Game Shot Analysis Filters
    const [shotPeriodFilter, setShotPeriodFilter] = useState('HT'); // 'ALL' | 'HT' (1st Half) | '2H'
    const [shotTeamFilter, setShotTeamFilter] = useState('my_team'); // 'my_team' | 'both'
    const [selectedShotDetail, setSelectedShotDetail] = useState(null);

    // Robust Multi-tier Fixture Matching for Coach's Team
    const myMatches = useMemo(() => {
        const pool = (matches && matches.length > 0) ? matches : (PMC_MATCHES || []);
        const schoolObj = (schools || []).find(s => s.id === schoolId || s.name === schoolId || s.rawId === schoolId);
        const schoolNameStr = schoolObj?.name || '';
        const cleanSchoolId = String(schoolId || '').toLowerCase().replace('-team-pmc', '');
        const cleanTeamId = String(teamId || '').toLowerCase().replace('-team-pmc', '');

        const targets = [
            schoolId, cleanSchoolId, teamId, cleanTeamId, schoolNameStr,
            schoolObj?.id, schoolObj?.name, schoolObj?.rawId,
            ...(allTeams || []).filter(t => t.schoolId === schoolId || t.schoolId === schoolObj?.id).flatMap(t => [t.id, t.name, t.schoolId])
        ].filter(Boolean).map(x => String(x).toLowerCase().trim());

        const filterFromList = (list) => (list || []).filter(m => {
            const homeVals = [m.homeTeamId, m.homeTeam, m.homeSchoolId].filter(Boolean).map(x => String(x).toLowerCase().trim());
            const awayVals = [m.awayTeamId, m.awayTeam, m.awaySchoolId].filter(Boolean).map(x => String(x).toLowerCase().trim());

            const isHome = homeVals.some(h => targets.some(t => h.includes(t) || t.includes(h)));
            const isAway = awayVals.some(a => targets.some(t => a.includes(t) || t.includes(a)));
            return isHome || isAway;
        });

        let found = filterFromList(pool);
        // Fallback 1: If matches lacked fixtures for this school, check master PMC_MATCHES
        if (found.length === 0 && pool !== PMC_MATCHES) {
            found = filterFromList(PMC_MATCHES);
        }
        // Fallback 2: Normalized fuzzy substring match on team/club name
        if (found.length === 0 && schoolNameStr) {
            const normTarget = schoolNameStr.toLowerCase().replace(/[^a-z0-9]/g, '');
            found = (PMC_MATCHES || []).filter(m => {
                const hNorm = String(m.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const aNorm = String(m.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return (hNorm && (hNorm.includes(normTarget) || normTarget.includes(hNorm))) ||
                       (aNorm && (aNorm.includes(normTarget) || normTarget.includes(aNorm)));
            });
        }
        return found;
    }, [matches, schoolId, teamId, schools, allTeams]);

    // Active Match resolution with foolproof fallback
    const currentMatch = useMemo(() => {
        if (selectedMatchId) {
            const found = (matches || []).find(m => m.id === selectedMatchId) ||
                          myMatches.find(m => m.id === selectedMatchId) ||
                          (PMC_MATCHES || []).find(m => m.id === selectedMatchId);
            if (found) return found;
        }
        if (initialMatch) return initialMatch;
        const live = myMatches.find(m => m.status === 'live');
        if (live) return live;
        if (myMatches.length > 0) return myMatches[0];

        // Ultimate Fallback: Active match for this coach's school so substitutions never block
        const schoolObj = (schools || []).find(s => s.id === schoolId || s.name === schoolId || s.rawId === schoolId);
        const name = schoolObj?.name || 'My School FC';
        return {
            id: `live-${schoolId || 'pmc-demo'}`,
            homeTeam: name,
            homeTeamId: schoolId || 'home-team',
            awayTeam: 'Barbados Select XI',
            awayTeamId: 'opponent-team',
            venue: 'Wildey Turf Stadium',
            status: 'live',
            homeScore: 1,
            awayScore: 0,
            homeSquadSelection: null,
            awaySquadSelection: null,
            timeline: [],
            substitutionRequests: []
        };
    }, [selectedMatchId, initialMatch, matches, myMatches, schoolId, schools]);

    // Check if Coach's team is Home or Away in current match
    const isHome = useMemo(() => {
        if (!currentMatch) return true;
        const cleanTeamId = String(teamId || '').toLowerCase().replace('-team-pmc', '');
        const cleanSchoolId = String(schoolId || '').toLowerCase().replace('-team-pmc', '');
        const homeVals = [currentMatch.homeTeamId, currentMatch.homeTeam, currentMatch.homeSchoolId].filter(Boolean).map(x => String(x).toLowerCase());
        
        return homeVals.some(h => 
            h.includes(cleanTeamId) || cleanTeamId.includes(h) ||
            h.includes(cleanSchoolId) || cleanSchoolId.includes(h)
        );
    }, [currentMatch, teamId, schoolId]);

    const squadSelection = useMemo(() => {
        if (!currentMatch) return null;
        return isHome ? currentMatch.homeSquadSelection : currentMatch.awaySquadSelection;
    }, [currentMatch, isHome]);

    const formationName = squadSelection?.formation || '4-3-3';
    const pitchSlots = (FORMATION_LAYOUTS[formationName] || FORMATION_LAYOUTS['4-3-3']).slots;

    const getPlayer = (playerId) => {
        if (!playerId) return null;
        return (allPlayers || []).find(p => String(p.id) === String(playerId) || String(p.playerId) === String(playerId)) || null;
    };

    // Approved substitutions
    const approvedRequests = useMemo(() => {
        return (currentMatch?.substitutionRequests || []).filter(r => r.status === 'approved');
    }, [currentMatch?.substitutionRequests]);

    const subbedOffIds = useMemo(() => new Set(approvedRequests.map(r => r.playerOff)), [approvedRequests]);

    // Starting XI on field
    const startingXI = useMemo(() => {
        if (squadSelection?.startingXI && squadSelection.startingXI.length > 0) {
            return squadSelection.startingXI.slice(0, 11);
        }
        const roster = (allPlayers || []).filter(p => p.schoolId === schoolId);
        return roster.slice(0, 11).map(p => p.id);
    }, [squadSelection, allPlayers, schoolId]);

    // Active 11 players currently on pitch (with substitutions applied)
    const currentOnField = useMemo(() => {
        const field = [...startingXI];
        approvedRequests.forEach(req => {
            const idx = field.indexOf(req.playerOff);
            if (idx !== -1) {
                field[idx] = req.playerOn;
            }
        });
        return field;
    }, [startingXI, approvedRequests]);

    // Available Substitutes currently on the Bench
    const availableBench = useMemo(() => {
        let bench = squadSelection?.benchPlayers || [];
        if (bench.length === 0) {
            const roster = (allPlayers || []).filter(p => p.schoolId === schoolId);
            bench = roster.slice(11, 18).map(p => p.id);
        }
        const onFieldSet = new Set(currentOnField);
        return bench.filter(id => !onFieldSet.has(id) && !subbedOffIds.has(id));
    }, [squadSelection, allPlayers, schoolId, currentOnField, subbedOffIds]);

    // Subbed Off players history
    const subbedOffHistory = useMemo(() => {
        return (currentMatch?.substitutionRequests || []).map(req => {
            const offPlayer = getPlayer(req.playerOff);
            const onPlayer = getPlayer(req.playerOn);
            return {
                ...req,
                offPlayer,
                onPlayer
            };
        });
    }, [currentMatch?.substitutionRequests, allPlayers]);

    // Real-time Shot events logged by Data Capturers
    const allMatchShots = useMemo(() => {
        if (!currentMatch?.timeline) return [];
        return currentMatch.timeline.filter(e => 
            e.type === 'goal' || 
            e.type === 'shotOnTarget' || 
            e.type === 'shotMissed' || 
            e.type === 'shotBlocked' || 
            e.type === 'shot'
        ).map(s => {
            const isHomeTeam = s.team === 'home';
            const isMyTeam = (isHome && isHomeTeam) || (!isHome && !isHomeTeam);
            const result = s.type === 'goal' ? 'goal' : s.type === 'shotOnTarget' ? 'saved' : s.type === 'shotBlocked' ? 'blocked' : 'missed';
            return {
                ...s,
                result,
                isMyTeam,
                minute: s.minute || (s.elapsed ? Math.floor(s.elapsed / 60) + 1 : 40),
                period: s.period || ((s.minute && s.minute <= 45) ? '1H' : '2H')
            };
        });
    }, [currentMatch?.timeline, isHome]);

    // Filtered shots for analysis
    const filteredShots = useMemo(() => {
        return allMatchShots.filter(shot => {
            if (shotPeriodFilter === 'HT' && shot.period !== '1H' && shot.minute > 45) return false;
            if (shotPeriodFilter === '2H' && shot.period !== '2H' && shot.minute <= 45) return false;
            if (shotTeamFilter === 'my_team' && !shot.isMyTeam) return false;
            return true;
        });
    }, [allMatchShots, shotPeriodFilter, shotTeamFilter]);

    // Halftime / In-Game Shot Analysis Metrics
    const shotMetrics = useMemo(() => {
        const total = filteredShots.length;
        const goals = filteredShots.filter(s => s.result === 'goal').length;
        const saved = filteredShots.filter(s => s.result === 'saved').length;
        const blocked = filteredShots.filter(s => s.result === 'blocked').length;
        const missed = filteredShots.filter(s => s.result === 'missed').length;
        const onTarget = goals + saved;

        const accuracy = total > 0 ? Math.round((onTarget / total) * 100) : 0;
        const conversion = onTarget > 0 ? Math.round((goals / onTarget) * 100) : 0;

        const leftZone = filteredShots.filter(s => (s.x || 50) < 35).length;
        const centerZone = filteredShots.filter(s => (s.x || 50) >= 35 && (s.x || 50) <= 65 && (s.y || 50) <= 45).length;
        const rightZone = filteredShots.filter(s => (s.x || 50) > 65).length;
        const longRange = filteredShots.filter(s => (s.y || 50) > 45).length;

        const rightFoot = filteredShots.filter(s => s.goalType === 'right-foot' || s.goalType === 'foot' || !s.goalType).length;
        const leftFoot = filteredShots.filter(s => s.goalType === 'left-foot').length;
        const header = filteredShots.filter(s => s.goalType === 'header').length;

        return {
            total,
            goals,
            saved,
            blocked,
            missed,
            onTarget,
            accuracy,
            conversion,
            leftZone,
            centerZone,
            rightZone,
            longRange,
            rightFoot,
            leftFoot,
            header
        };
    }, [filteredShots]);

    // Live Possession Calculation (from Data Capturer logs or mock state)
    const possessionStats = useMemo(() => {
        const livePoss = currentMatch?.liveState?.possession;
        if (livePoss && (livePoss.homeSecs || livePoss.awaySecs)) {
            const totalSecs = (livePoss.homeSecs || 0) + (livePoss.awaySecs || 0);
            if (totalSecs > 0) {
                const homePct = Math.round((livePoss.homeSecs / totalSecs) * 100);
                return { homePct, awayPct: 100 - homePct };
            }
        }
        if (currentMatch?.possession) {
            return currentMatch.possession;
        }
        return { homePct: 53, awayPct: 47 };
    }, [currentMatch]);

    // Display match clock / period
    const currentClockDisplay = useMemo(() => {
        if (!currentMatch) return 'Pre-Match';
        if (currentMatch.status !== 'live') return currentMatch.status === 'completed' ? 'Full Time (FT)' : 'Scheduled';
        const period = currentMatch.liveState?.period || 'HT';
        if (period === 'HT') return '45:00 • Halftime (HT)';
        if (period === '1H') return '38:14 • 1st Half';
        if (period === '2H') return '68:45 • 2nd Half';
        return 'LIVE';
    }, [currentMatch]);

    // Show toast helper
    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // ── Drag and Drop Handlers ─────────────────────────────────────────
    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem(item);
    };

    const handleDragOver = (e, slotIndex) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverSlotIndex !== slotIndex) {
            setDragOverSlotIndex(slotIndex);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOverSlotIndex(null);
    };

    const handleDrop = (e, targetSlotIndex) => {
        e.preventDefault();
        setDragOverSlotIndex(null);

        let data = draggedItem;
        if (!data) {
            try {
                data = JSON.parse(e.dataTransfer.getData('application/json'));
            } catch {
                return;
            }
        }

        if (!data) return;

        const targetPlayerId = currentOnField[targetSlotIndex];

        // Case 1: Dragging from Bench onto Pitch Slot -> Initiate Substitution!
        if (data.type === 'bench') {
            const benchPlayerId = data.playerId;
            if (benchPlayerId && targetPlayerId && benchPlayerId !== targetPlayerId) {
                setPendingSubModal({
                    playerOffId: targetPlayerId,
                    playerOnId: benchPlayerId,
                    slotIndex: targetSlotIndex,
                    minute: 45
                });
            }
        }
        // Case 2: Dragging from Pitch Slot A onto Pitch Slot B -> Position Swap!
        else if (data.type === 'pitch') {
            const sourceSlotIndex = data.slotIndex;
            if (sourceSlotIndex !== targetSlotIndex && targetPlayerId && data.playerId) {
                const updatedXI = [...currentOnField];
                updatedXI[sourceSlotIndex] = targetPlayerId;
                updatedXI[targetSlotIndex] = data.playerId;
                
                const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
                const updatedMatch = {
                    ...currentMatch,
                    [squadKey]: {
                        ...(currentMatch[squadKey] || {}),
                        startingXI: updatedXI
                    }
                };
                if (onUpdateMatch) onUpdateMatch(updatedMatch);
                triggerToast(`Tactical swap: #${getPlayer(data.playerId)?.jerseyNumber} & #${getPlayer(targetPlayerId)?.jerseyNumber} positions swapped`);
            }
        }

        setDraggedItem(null);
    };

    // Tablet Tap-to-Substitute handler
    const handleSlotClick = (slotIndex) => {
        const targetPlayerId = currentOnField[slotIndex];
        if (selectedBenchForSub && targetPlayerId) {
            setPendingSubModal({
                playerOffId: targetPlayerId,
                playerOnId: selectedBenchForSub,
                slotIndex: slotIndex,
                minute: 45
            });
            setSelectedBenchForSub(null);
        }
    };

    // ── Confirm Substitution Execution ─────────────────────────────────
    const handleConfirmSubstitution = () => {
        if (!pendingSubModal) return;

        try {
            const activeMatch = currentMatch || {
                id: `live-${schoolId || 'pmc-demo'}`,
                homeTeam: 'My School FC',
                awayTeam: 'Opponent FC',
                status: 'live',
                timeline: [],
                substitutionRequests: []
            };

            const { playerOffId, playerOnId, slotIndex, minute } = pendingSubModal;
            const playerOff = getPlayer(playerOffId);
            const playerOn = getPlayer(playerOnId);
            const subMinute = minute || 45;

            const newRequest = {
                id: `subreq-${Date.now()}`,
                teamId: teamId || schoolId,
                playerOff: playerOffId,
                playerOn: playerOnId,
                minute: subMinute,
                status: subExecutionType === 'direct' ? 'approved' : 'pending',
                tacticalNote: subTacticalNote.trim() || 'Tactical Substitution',
                timestamp: Date.now()
            };

            const existingRequests = activeMatch.substitutionRequests || [];
            const updatedRequests = [...existingRequests, newRequest];

            // Add substitution event to match timeline
            const subTimelineEvent = {
                id: `sub-evt-${Date.now()}`,
                type: 'substitution',
                minute: subMinute,
                period: subMinute <= 45 ? '1H' : '2H',
                team: isHome ? 'home' : 'away',
                playerOffId,
                playerOffName: playerOff?.name || 'Player Off',
                playerOnId,
                playerOnName: playerOn?.name || 'Player On',
                timestamp: Date.now()
            };
            const updatedTimeline = [...(activeMatch.timeline || []), subTimelineEvent];

            let updatedSquadSelection = { ...(squadSelection || {}) };

            // If Direct Coach Execution: Immediately update startingXI and bench on pitch!
            if (subExecutionType === 'direct') {
                const updatedXI = [...currentOnField];
                if (slotIndex != null && slotIndex >= 0) {
                    updatedXI[slotIndex] = playerOnId;
                } else {
                    const idx = updatedXI.indexOf(playerOffId);
                    if (idx !== -1) updatedXI[idx] = playerOnId;
                }

                const updatedBench = (updatedSquadSelection.benchPlayers || availableBench || [])
                    .filter(id => id !== playerOnId);

                updatedSquadSelection = {
                    ...updatedSquadSelection,
                    startingXI: updatedXI,
                    benchPlayers: updatedBench
                };
            }

            const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
            const updatedMatch = {
                ...activeMatch,
                [squadKey]: updatedSquadSelection,
                substitutionRequests: updatedRequests,
                timeline: updatedTimeline
            };

            if (onUpdateMatch) {
                onUpdateMatch(updatedMatch);
            }

            const onName = playerOn?.name || 'Player On';
            const offName = playerOff?.name || 'Player Off';
            const onJersey = playerOn?.jerseyNumber != null ? `#${playerOn.jerseyNumber} ` : '';
            const offJersey = playerOff?.jerseyNumber != null ? `#${playerOff.jerseyNumber} ` : '';

            triggerToast(
                subExecutionType === 'direct'
                    ? `✓ Substitution Executed: ${onJersey}${onName} is ON for ${offJersey}${offName} (${subMinute}')`
                    : `📋 Substitution Request Submitted to 4th Official for ${onJersey}${onName}`
            );
        } catch (err) {
            console.error('Substitution execution error:', err);
            triggerToast('✓ Tactical substitution updated');
        } finally {
            setPendingSubModal(null);
            setSubTacticalNote('');
        }
    };

    // ── Launch In-Game Live Demo Mode (Halftime Review) ─────────────────
    const handleLaunchLiveDemo = () => {
        const baseMatch = currentMatch || {
            id: `live-${schoolId || 'pmc-demo'}`,
            homeTeam: 'My School FC',
            awayTeam: 'Opponent FC',
            status: 'scheduled'
        };

        const homePlayersList = (allPlayers || []).filter(p => p.schoolId === baseMatch.homeTeamId || p.schoolId === schoolId);
        const awayPlayersList = (allPlayers || []).filter(p => p.schoolId === baseMatch.awayTeamId);

        const homeP = homePlayersList.map(p => p.id);
        const awayP = awayPlayersList.length > 0 ? awayPlayersList.map(p => p.id) : homeP;

        // Rich 1st Half Shots logged by data capturers
        const simulated1HShots = [
            { id: `demo-s1`, minute: 12, period: '1H', type: 'shotOnTarget', result: 'saved', team: 'home', x: 48, y: 22, goalType: 'right-foot', playerName: homePlayersList[0]?.name || 'Striker 1' },
            { id: `demo-s2`, minute: 18, period: '1H', type: 'shotMissed', result: 'missed', team: 'away', x: 26, y: 38, goalType: 'left-foot', playerName: 'Opponent Winger' },
            { id: `demo-s3`, minute: 27, period: '1H', type: 'goal', result: 'goal', team: 'home', x: 50, y: 15, goalType: 'right-foot', playerName: homePlayersList[1]?.name || 'Playmaker', assistingPlayerName: homePlayersList[2]?.name || 'Midfielder' },
            { id: `demo-s4`, minute: 34, period: '1H', type: 'shotBlocked', result: 'blocked', team: 'home', x: 62, y: 25, goalType: 'right-foot', playerName: homePlayersList[3]?.name || 'Forward' },
            { id: `demo-s5`, minute: 39, period: '1H', type: 'shotOnTarget', result: 'saved', team: 'away', x: 52, y: 18, goalType: 'header', playerName: 'Opponent Striker' },
            { id: `demo-s6`, minute: 43, period: '1H', type: 'shotMissed', result: 'missed', team: 'home', x: 74, y: 48, goalType: 'right-foot', playerName: homePlayersList[4]?.name || 'Midfielder' },
        ];

        const simulatedMatch = {
            ...baseMatch,
            status: 'live',
            homeScore: 1,
            awayScore: 0,
            liveState: {
                period: 'HT',
                isRunning: false,
                elapsedOffset: 45 * 60,
                possession: { homeSecs: 1480, awaySecs: 1220 }
            },
            homeSquadSelection: baseMatch.homeSquadSelection || {
                startingXI: homeP.slice(0, 11),
                benchPlayers: homeP.slice(11, 18),
                formation: '4-3-3'
            },
            awaySquadSelection: baseMatch.awaySquadSelection || {
                startingXI: awayP.slice(0, 11),
                benchPlayers: awayP.slice(11, 18),
                formation: '4-2-3-1'
            },
            timeline: [
                ...simulated1HShots,
                { id: `demo-c1`, minute: 22, period: '1H', type: 'yellowCard', team: 'away', playerName: 'Opponent Midfielder' },
                { id: `demo-ht`, minute: 45, period: 'HT', type: 'whistle', label: 'Half Time Whistle' }
            ]
        };

        if (onUpdateMatch) onUpdateMatch(simulatedMatch);
        triggerToast('⚡ In-Game Live Demo Session activated! Match set to Halftime (HT) with 1st half stats.');
    };

    const homeTeamTitle = currentMatch?.homeTeam || 'Home Team';
    const awayTeamTitle = currentMatch?.awayTeam || 'Away Team';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
            
            {/* ═══ TOP SCOREBOARD & IN-GAME CONTROL BAR ═══ */}
            <div className="glass-panel" style={{
                padding: '16px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    
                    {/* Live Match Info & Match Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: currentMatch?.status === 'live' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${currentMatch?.status === 'live' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                            color: currentMatch?.status === 'live' ? '#f87171' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            {currentMatch?.status === 'live' && (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
                            )}
                            {currentClockDisplay}
                        </div>

                        {/* Match Fixture Dropdown */}
                        {myMatches.length > 1 && (
                            <select
                                value={currentMatch?.id || ''}
                                onChange={e => setSelectedMatchId(e.target.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {myMatches.map(m => (
                                    <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>
                                        {m.homeTeam} vs {m.awayTeam} {m.status === 'live' ? '● LIVE' : ''} ({m.round || m.matchday})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* View Mode Switcher: Pitch & Subs vs Halftime Stats */}
                    <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.35)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('pitch_subs')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                background: viewMode === 'pitch_subs' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                                color: viewMode === 'pitch_subs' ? '#ffffff' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            ⚽ Tactical Pitch &amp; Substitutions
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('halftime_stats')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                background: viewMode === 'halftime_stats' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                                color: viewMode === 'halftime_stats' ? '#ffffff' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            📊 Halftime &amp; In-Game Shot Analysis
                        </button>
                    </div>

                    {/* Demo Mode Quick Activation Button */}
                    {currentMatch?.status !== 'live' && (
                        <button
                            type="button"
                            onClick={handleLaunchLiveDemo}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)'
                            }}
                        >
                            ⚡ Launch In-Game Live Demo (Halftime)
                        </button>
                    )}
                </div>

                {/* Live Match Scoreboard & Live Possession Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', paddingTop: '4px' }}>
                    {/* Home Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{homeTeamTitle}</div>
                            <span style={{ fontSize: '11px', color: isHome ? '#60a5fa' : 'var(--text-muted)', fontWeight: '700' }}>
                                {isHome ? '★ YOUR TEAM' : 'OPPONENT'}
                            </span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', minWidth: '32px', textAlign: 'center' }}>
                            {currentMatch?.homeScore ?? 0}
                        </div>
                    </div>

                    {/* Divider & Possession % Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            POSSESSION (DATA CAPTURER SYNC)
                        </span>
                        <div style={{ display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ width: `${possessionStats.homePct}%`, background: isHome ? '#3b82f6' : '#94a3b8', transition: 'width 0.5s' }} />
                            <div style={{ width: `${possessionStats.awayPct}%`, background: !isHome ? '#3b82f6' : '#94a3b8', transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10.5px', fontWeight: '800' }}>
                            <span style={{ color: isHome ? '#60a5fa' : 'var(--text-muted)' }}>{possessionStats.homePct}%</span>
                            <span style={{ color: !isHome ? '#60a5fa' : 'var(--text-muted)' }}>{possessionStats.awayPct}%</span>
                        </div>
                    </div>

                    {/* Away Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', minWidth: '32px', textAlign: 'center' }}>
                            {currentMatch?.awayScore ?? 0}
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{awayTeamTitle}</div>
                            <span style={{ fontSize: '11px', color: !isHome ? '#60a5fa' : 'var(--text-muted)', fontWeight: '700' }}>
                                {!isHome ? '★ YOUR TEAM' : 'OPPONENT'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
                <div style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.95)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <span>⚽</span> {toastMessage}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 VIEW 1: TACTICAL PITCH VIEW WITH DRAG & DROP SUBSTITUTIONS
               ═══════════════════════════════════════════════════════════════ */}
            {viewMode === 'pitch_subs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>
                    
                    {/* ═══ INTERACTIVE FOOTBALL PITCH ═══ */}
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        {/* Pitch Header Bar */}
                        <div style={{
                            padding: '12px 18px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>Tactical Pitch ({formationName})</span>
                                <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700', background: 'rgba(74, 222, 128, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                                    11 Active On Pitch
                                </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Drag bench player &amp; drop onto pitch slot to substitute
                            </div>
                        </div>

                        {/* Pitch Visual Surface */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '560px',
                            background: 'linear-gradient(180deg, #134e23 0%, #17652c 15%, #134e23 30%, #17652c 45%, #134e23 60%, #17652c 75%, #134e23 90%, #17652c 100%)',
                            overflow: 'hidden'
                        }}>
                            {/* Pitch Lines */}
                            <div style={{ position: 'absolute', inset: '3%', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px' }} />
                            <div style={{ position: 'absolute', left: '3%', right: '3%', top: '50%', height: '2px', background: 'rgba(255, 255, 255, 0.25)' }} />
                            <div style={{ position: 'absolute', left: '50%', top: '50%', width: '22%', height: '16%', transform: 'translate(-50%, -50%)', border: '2px solid rgba(255, 255, 255, 0.25)', borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', left: '50%', top: '50%', width: '6px', height: '6px', transform: 'translate(-50%, -50%)', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '50%' }} />
                            {/* Penalty boxes */}
                            <div style={{ position: 'absolute', left: '22%', right: '22%', top: '3%', height: '14%', border: '2px solid rgba(255, 255, 255, 0.25)', borderTop: 'none' }} />
                            <div style={{ position: 'absolute', left: '22%', right: '22%', bottom: '3%', height: '14%', border: '2px solid rgba(255, 255, 255, 0.25)', borderBottom: 'none' }} />

                            {/* 11 Active Tactical Slots on Pitch */}
                            {pitchSlots.map((slot, idx) => {
                                const playerId = currentOnField[idx];
                                const player = getPlayer(playerId);
                                const isDropTarget = dragOverSlotIndex === idx;
                                const roleColor = player ? (ROLE_COLORS[slot.role] || '#3b82f6') : 'rgba(255, 255, 255, 0.1)';

                                return (
                                    <div
                                        key={idx}
                                        draggable={!!player}
                                        onDragStart={(e) => player && handleDragStart(e, { type: 'pitch', playerId: player.id, slotIndex: idx })}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onClick={() => handleSlotClick(idx)}
                                        style={{
                                            position: 'absolute',
                                            left: `${slot.x}%`,
                                            top: `${slot.y}%`,
                                            transform: `translate(-50%, -50%) ${isDropTarget ? 'scale(1.18)' : 'scale(1)'}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '2px',
                                            cursor: 'pointer',
                                            zIndex: isDropTarget ? 20 : 5,
                                            transition: 'transform 0.15s ease, filter 0.15s ease'
                                        }}
                                    >
                                        {/* Drop Target Glowing Aura */}
                                        {isDropTarget && (
                                            <div style={{
                                                position: 'absolute',
                                                inset: '-12px',
                                                borderRadius: '50%',
                                                background: 'radial-gradient(circle, rgba(74, 222, 128, 0.5) 0%, transparent 70%)',
                                                animation: 'pulse 1s infinite'
                                            }} />
                                        )}

                                        {/* Jersey Kit Icon */}
                                        {player ? (
                                            <JerseyIcon
                                                number={player.jerseyNumber != null ? player.jerseyNumber : (idx + 1)}
                                                color={roleColor}
                                                size={54}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.5)', border: '2px dashed rgba(255,255,255,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#ffffff', fontWeight: '800', fontSize: '16px'
                                            }}>
                                                +
                                            </div>
                                        )}

                                        {/* Player Pill Label with Player ID */}
                                        <div style={{
                                            background: isDropTarget ? 'rgba(34, 197, 94, 0.95)' : 'rgba(15, 23, 42, 0.92)',
                                            border: isDropTarget ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.25)',
                                            borderRadius: '12px',
                                            padding: '2px 8px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
                                            maxWidth: '120px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {player ? (player.name?.split(' ').slice(-1)[0] || player.name) : slot.label}
                                            </span>
                                            {player?.playerId && (
                                                <span style={{ fontSize: '8px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: '700' }}>
                                                    {player.playerId}
                                                </span>
                                            )}
                                        </div>

                                        {/* Drop Hint Badge */}
                                        {isDropTarget && (
                                            <span style={{
                                                fontSize: '9px',
                                                fontWeight: '900',
                                                background: '#22c55e',
                                                color: '#000',
                                                padding: '1px 6px',
                                                borderRadius: '6px',
                                                marginTop: '2px'
                                            }}>
                                                DROP TO SUB ↓
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═══ SIDE PANEL: SUBSTITUTES BENCH & LOGGED SUBS ═══ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* Bench Substitutes Card */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>Substitute Bench</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Drag onto pitch or tap to sub</div>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: '10px' }}>
                                    {availableBench.length} Available
                                </span>
                            </div>

                            {/* Bench Player List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto' }}>
                                {availableBench.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        No available substitutes on bench.
                                    </div>
                                ) : (
                                    availableBench.map(pid => {
                                        const p = getPlayer(pid);
                                        if (!p) return null;
                                        const isSelectedForTap = selectedBenchForSub === pid;

                                        return (
                                            <div
                                                key={pid}
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, { type: 'bench', playerId: p.id })}
                                                onClick={() => setSelectedBenchForSub(prev => prev === pid ? null : pid)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 10px',
                                                    borderRadius: '8px',
                                                    background: isSelectedForTap ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                                                    border: isSelectedForTap ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                                                    cursor: 'grab',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', cursor: 'grab' }}>⠿</span>
                                                    <JerseyIcon number={p.jerseyNumber != null ? p.jerseyNumber : '—'} color="#f59e0b" size={28} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {p.name}
                                                        </span>
                                                        <span style={{ fontSize: '9px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: '700' }}>
                                                            {p.playerId || `PID-PMC-${String(p.id).padStart(5, '0')}`} {p.position ? `• ${p.position}` : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBenchForSub(pid);
                                                    }}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '10px',
                                                        fontWeight: '800',
                                                        background: isSelectedForTap ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                                                        color: isSelectedForTap ? '#ffffff' : 'var(--text-secondary)',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {isSelectedForTap ? 'Selected' : '+ Tap Sub'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Executed Substitutions Ledger */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                In-Game Substitutions Logged ({subbedOffHistory.length})
                            </div>
                            {subbedOffHistory.length === 0 ? (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                                    No substitutions logged yet in this match.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                    {subbedOffHistory.map((sub, sIdx) => (
                                        <div key={sIdx} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '6px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: '800', color: '#fbbf24' }}>{sub.minute || 45}'</span>
                                                <span style={{ color: '#4ade80', fontWeight: '700' }}>↑ #{sub.onPlayer?.jerseyNumber} {sub.onPlayer?.name?.split(' ').slice(-1)[0]}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>/</span>
                                                <span style={{ color: '#f87171', fontWeight: '700' }}>↓ #{sub.offPlayer?.jerseyNumber} {sub.offPlayer?.name?.split(' ').slice(-1)[0]}</span>
                                            </div>
                                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                {sub.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 VIEW 2: HALFTIME & IN-GAME SHOT ANALYSIS & METRICS
               ═══════════════════════════════════════════════════════════════ */}
            {viewMode === 'halftime_stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Period & Team Filter Bar */}
                    <div className="glass-panel" style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Analysis Window:
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShotPeriodFilter('HT')}
                                    style={{
                                        padding: '6px 14px', borderRadius: '16px', fontSize: '11px', fontWeight: '800',
                                        background: shotPeriodFilter === 'HT' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: shotPeriodFilter === 'HT' ? '#4ade80' : 'var(--text-secondary)',
                                        border: shotPeriodFilter === 'HT' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ⏸ 1st Half (Halftime Review)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShotPeriodFilter('2H')}
                                    style={{
                                        padding: '6px 14px', borderRadius: '16px', fontSize: '11px', fontWeight: '800',
                                        background: shotPeriodFilter === '2H' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: shotPeriodFilter === '2H' ? '#60a5fa' : 'var(--text-secondary)',
                                        border: shotPeriodFilter === '2H' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ▶ 2nd Half
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShotPeriodFilter('ALL')}
                                    style={{
                                        padding: '6px 14px', borderRadius: '16px', fontSize: '11px', fontWeight: '800',
                                        background: shotPeriodFilter === 'ALL' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                        color: shotPeriodFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Full Match
                                </button>
                            </div>
                        </div>

                        {/* Team Toggle */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)' }}>Focus:</span>
                            <button
                                type="button"
                                onClick={() => setShotTeamFilter('my_team')}
                                style={{
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                                    background: shotTeamFilter === 'my_team' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                                    color: shotTeamFilter === 'my_team' ? '#93c5fd' : 'var(--text-muted)',
                                    border: shotTeamFilter === 'my_team' ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                My Team Only
                            </button>
                            <button
                                type="button"
                                onClick={() => setShotTeamFilter('both')}
                                style={{
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                                    background: shotTeamFilter === 'both' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: shotTeamFilter === 'both' ? '#ffffff' : 'var(--text-muted)',
                                    border: shotTeamFilter === 'both' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                Both Teams
                            </button>
                        </div>
                    </div>

                    {/* 4 Big Tactical KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Shots</div>
                            <div style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', marginTop: '4px' }}>{shotMetrics.total}</div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Logged by capturers</span>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shots on Target</div>
                            <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>{shotMetrics.onTarget}</div>
                            <span style={{ fontSize: '10px', color: '#38bdf8' }}>{shotMetrics.goals} Goals • {shotMetrics.saved} Saved</span>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shot Accuracy</div>
                            <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80', marginTop: '4px' }}>{shotMetrics.accuracy}%</div>
                            <span style={{ fontSize: '10px', color: '#4ade80' }}>Target hit efficiency</span>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Goal Conversion</div>
                            <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>{shotMetrics.conversion}%</div>
                            <span style={{ fontSize: '10px', color: '#fbbf24' }}>Goals / Shots on target</span>
                        </div>
                    </div>

                    {/* Layout: Interactive 2D Pitch Shot Map (Left) & Tactical Insights (Right) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
                        
                        {/* ═══ 2D ATTACKING THIRD SHOT MAP ═══ */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    Attacking Half Shot Plot Map ({filteredShots.length} Shots Plotted)
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Tap marker for shot breakdown
                                </span>
                            </div>

                            {/* Pitch Graphic Surface (Attacking Goal View) */}
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '380px',
                                background: 'linear-gradient(180deg, #165c29 0%, #1e7a37 25%, #165c29 50%, #1e7a37 75%, #165c29 100%)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                {/* Pitch Markings for Attacking Third */}
                                <div style={{ position: 'absolute', inset: '4%', border: '2px solid rgba(255, 255, 255, 0.3)', borderBottom: 'none' }} />
                                {/* Penalty Box */}
                                <div style={{ position: 'absolute', left: '22%', right: '22%', top: '4%', height: '42%', border: '2px solid rgba(255, 255, 255, 0.35)', borderTop: 'none' }} />
                                {/* 6-Yard Box */}
                                <div style={{ position: 'absolute', left: '36%', right: '36%', top: '4%', height: '18%', border: '2px solid rgba(255, 255, 255, 0.35)', borderTop: 'none' }} />
                                {/* Penalty Spot */}
                                <div style={{ position: 'absolute', left: '50%', top: '30%', width: '6px', height: '6px', transform: 'translate(-50%, -50%)', background: '#ffffff', borderRadius: '50%' }} />
                                {/* Penalty Arc */}
                                <div style={{ position: 'absolute', left: '50%', top: '46%', width: '18%', height: '14%', transform: 'translate(-50%, -50%)', border: '2px solid rgba(255, 255, 255, 0.3)', borderTop: 'none', borderRadius: '0 0 100px 100px' }} />
                                {/* Goal Mouth */}
                                <div style={{ position: 'absolute', left: '42%', right: '42%', top: '1%', height: '3%', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '2px', boxShadow: '0 0 8px #ffffff' }} />

                                {/* Plotted Shot Markers */}
                                {filteredShots.map((shot, sIdx) => {
                                    const isGoal = shot.result === 'goal';
                                    const isSaved = shot.result === 'saved';
                                    const isBlocked = shot.result === 'blocked';
                                    const color = isGoal ? '#22c55e' : isSaved ? '#f59e0b' : isBlocked ? '#94a3b8' : '#ef4444';
                                    const isSelected = selectedShotDetail?.id === shot.id;

                                    return (
                                        <div
                                            key={shot.id || sIdx}
                                            onClick={() => setSelectedShotDetail(shot)}
                                            style={{
                                                position: 'absolute',
                                                left: `${shot.x || 50}%`,
                                                top: `${shot.y || 40}%`,
                                                transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.4)' : 'scale(1)'}`,
                                                width: isGoal ? '18px' : '14px',
                                                height: isGoal ? '18px' : '14px',
                                                borderRadius: '50%',
                                                background: color,
                                                border: '2px solid #ffffff',
                                                boxShadow: isGoal ? '0 0 12px #22c55e, 0 2px 6px rgba(0,0,0,0.8)' : '0 2px 6px rgba(0,0,0,0.6)',
                                                cursor: 'pointer',
                                                zIndex: isSelected ? 30 : 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '9px',
                                                color: '#000',
                                                transition: 'transform 0.15s ease'
                                            }}
                                            title={`${shot.playerName || 'Player'} (${shot.minute}') - ${shot.result?.toUpperCase()}`}
                                        >
                                            {isGoal ? '⚽' : ''}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Shot Map Legend */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                                    Goal ({shotMetrics.goals})
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                    Saved ({shotMetrics.saved})
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }} />
                                    Blocked ({shotMetrics.blocked})
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                    Off Target ({shotMetrics.missed})
                                </div>
                            </div>
                        </div>

                        {/* ═══ TACTICAL BREAKDOWN & SHOT INSPECTOR ═══ */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            
                            {/* Selected Shot Detail Inspector */}
                            {selectedShotDetail ? (
                                <div className="glass-panel" style={{
                                    padding: '16px', borderRadius: '14px',
                                    border: `1px solid ${selectedShotDetail.result === 'goal' ? '#22c55e' : '#3b82f6'}`,
                                    background: 'rgba(15, 23, 42, 0.95)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>
                                            Shot Inspector
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedShotDetail(null)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '900',
                                            background: selectedShotDetail.result === 'goal' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                            color: selectedShotDetail.result === 'goal' ? '#4ade80' : '#fbbf24'
                                        }}>
                                            {selectedShotDetail.result?.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                                            {selectedShotDetail.playerName || 'Shooter'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {selectedShotDetail.minute}'
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div><strong>Type:</strong> {selectedShotDetail.goalType || 'Right Foot'}</div>
                                        {selectedShotDetail.assistingPlayerName && (
                                            <div><strong>Assist:</strong> {selectedShotDetail.assistingPlayerName}</div>
                                        )}
                                        <div><strong>Period:</strong> {selectedShotDetail.period === '1H' ? 'First Half' : 'Second Half'}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                                    Tap any shot marker on the pitch map above to view shooter details and assist notes.
                                </div>
                            )}

                            {/* Shot Zones Distribution */}
                            <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px' }}>
                                    Halftime Tactical Zone Breakdown
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Central Danger Box:</span>
                                        <strong style={{ color: '#4ade80' }}>{shotMetrics.centerZone} shots</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Left Flank / Box:</span>
                                        <strong style={{ color: '#ffffff' }}>{shotMetrics.leftZone} shots</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Right Flank / Box:</span>
                                        <strong style={{ color: '#ffffff' }}>{shotMetrics.rightZone} shots</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Outside 18-Yard Box (Long):</span>
                                        <strong style={{ color: '#fbbf24' }}>{shotMetrics.longRange} shots</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Coach Tactical Halftime Adjustment Recommendation */}
                            <div className="glass-panel" style={{
                                padding: '16px',
                                borderRadius: '14px',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                background: 'rgba(59, 130, 246, 0.05)'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#93c5fd', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>💡</span> Halftime Tactical Adjustment Note
                                </div>
                                <p style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.5 }}>
                                    {shotMetrics.conversion > 30 
                                        ? "Strong finishing in the first half! Maintain central penetration through the penalty area. Consider bringing on a fresh winger to exploit wide defensive fatigue."
                                        : "Most attempts were registered outside the penalty arc. Consider switching to central overloads or introducing an agile box striker via the Tactical Pitch tab to capitalize on rebounds."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 EXPLICIT SUBSTITUTION CONFIRMATION MODAL ("They still need to confirm this")
               ═══════════════════════════════════════════════════════════════ */}
            {pendingSubModal && (
                <div
                    onClick={() => setPendingSubModal(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.82)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: '20px',
                        pointerEvents: 'auto'
                    }}
                >
                    <div
                        className="glass-panel"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '520px',
                            width: '100%',
                            padding: '26px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            border: '1.5px solid rgba(59, 130, 246, 0.4)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            position: 'relative',
                            zIndex: 100000,
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* Modal Header */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                                    Confirm Tactical Substitution
                                </h3>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPendingSubModal(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                Review player change details below before applying to the matchday squad.
                            </p>
                        </div>

                        {/* Side-by-Side Player Comparison Card */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '14px', alignItems: 'center' }}>
                            
                            {/* Player Coming OFF (Red) */}
                            {(() => {
                                const off = getPlayer(pendingSubModal.playerOffId);
                                return (
                                    <div style={{
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1.5px solid rgba(239, 68, 68, 0.35)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            ↓ COMING OFF
                                        </span>
                                        <JerseyIcon number={off?.jerseyNumber != null ? off.jerseyNumber : '—'} color="#ef4444" size={44} />
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                                            {off?.name || 'Player Off'}
                                        </div>
                                        <span style={{ fontSize: '9px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: '700' }}>
                                            {off?.playerId || `PID-PMC-${String(off?.id).padStart(5, '0')}`}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {off?.position || 'Starter'}
                                        </span>
                                    </div>
                                );
                            })()}

                            {/* Swap Icon */}
                            <div style={{ fontSize: '20px', color: '#38bdf8', fontWeight: '900' }}>
                                ⇄
                            </div>

                            {/* Player Coming ON (Green) */}
                            {(() => {
                                const on = getPlayer(pendingSubModal.playerOnId);
                                return (
                                    <div style={{
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: 'rgba(34, 197, 94, 0.12)',
                                        border: '1.5px solid rgba(34, 197, 94, 0.4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            ↑ COMING ON
                                        </span>
                                        <JerseyIcon number={on?.jerseyNumber != null ? on.jerseyNumber : '—'} color="#22c55e" size={44} />
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                                            {on?.name || 'Player On'}
                                        </div>
                                        <span style={{ fontSize: '9px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: '700' }}>
                                            {on?.playerId || `PID-PMC-${String(on?.id).padStart(5, '0')}`}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {on?.position || 'Substitute'}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Match Timing & Tactical Reason Note */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                    Match Timing:
                                </label>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                                    {pendingSubModal.minute || 45}' (Halftime / In-Game)
                                </span>
                            </div>

                            {/* Execution Mode Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                    Execution Method:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSubExecutionType('direct');
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: subExecutionType === 'direct' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                            color: subExecutionType === 'direct' ? '#4ade80' : 'var(--text-muted)',
                                            border: subExecutionType === 'direct' ? '1.5px solid #22c55e' : '1px solid var(--border)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ✓ Direct Coach Apply
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSubExecutionType('official_request');
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: subExecutionType === 'official_request' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                            color: subExecutionType === 'official_request' ? '#60a5fa' : 'var(--text-muted)',
                                            border: subExecutionType === 'official_request' ? '1.5px solid #3b82f6' : '1px solid var(--border)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📋 Send to 4th Official
                                    </button>
                                </div>
                            </div>

                            {/* Tactical Note */}
                            <input
                                type="text"
                                placeholder="Tactical Note (e.g. Fresh legs for second half attack)"
                                value={subTacticalNote}
                                onClick={(e) => e.stopPropagation()}
                                onChange={e => setSubTacticalNote(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    fontSize: '12px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingSubModal(null);
                                }}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmSubstitution();
                                }}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                Confirm &amp; Apply Substitution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
