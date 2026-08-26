import { useState, useEffect, useMemo } from 'react';
import StudentProfileDrawer from './StudentProfileDrawer';
import JerseyIcon from './JerseyIcon';
import { 
    sendRefereeSquadNotification, 
    sendDataLoggerMatchReadyNotification, 
    sendCoachSquadReminderNotification, 
    getRefereeContactSettings 
} from '../services/refereeNotificationService';

// Formation layouts define rows from back (GK) to front (FWD)
// Each row has: y position (% from top), count of players, role, and position labels
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

const MAX_BENCH = 7;

const ROLE_COLORS = {
    GK: '#f59e0b',
    DEF: '#3b82f6',
    CDM: '#8b5cf6',
    MID: '#10b981',
    CAM: '#06b6d4',
    FWD: '#ef4444',
    ST: '#ef4444',
};

export default function MatchdaySquadSelection({ matches, schoolId, allPlayers, allTeams, schools, onUpdateMatch, onStudentClick }) {
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [formation, setFormation] = useState('4-3-3');
    const [previewStudent, setPreviewStudent] = useState(null);
    
    // startingXI mapped to slot indices (indices 0 to 10 matching slot configuration)
    const [startingXI, setStartingXI] = useState(() => Array(11).fill(null));
    const [benchPlayers, setBenchPlayers] = useState([]);
    
    // Active slot being selected via pop-up player picker
    const [activeSlotIndex, setActiveSlotIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [notificationInfo, setNotificationInfo] = useState(null);
    const [reminderSentToast, setReminderSentToast] = useState(null);

    const schoolName = useMemo(() => {
        const sc = schools?.find(s => s.id === schoolId);
        return sc ? sc.name : 'My School';
    }, [schools, schoolId]);

    const myTeamIds = useMemo(() => {
        return (allTeams || []).filter(t => t.schoolId === schoolId).map(t => t.id);
    }, [allTeams, schoolId]);

    const myMatches = useMemo(() => {
        const schoolObj = (schools || []).find(s => s.id === schoolId || s.name === schoolId || s.rawId === schoolId);
        const schoolNameStr = schoolObj?.name || schoolName || '';
        const cleanSchoolId = String(schoolId || '').toLowerCase().replace('-team-pmc', '');

        const targets = [
            schoolId, cleanSchoolId, schoolNameStr,
            schoolObj?.id, schoolObj?.name, schoolObj?.rawId,
            ...(allTeams || []).filter(t => t.schoolId === schoolId || t.schoolId === schoolObj?.id).flatMap(t => [t.id, t.name, t.schoolId])
        ].filter(Boolean).map(x => String(x).toLowerCase());

        return (matches || []).filter(m => {
            const homeVals = [m.homeTeamId, m.homeTeam, m.homeSchoolId].filter(Boolean).map(x => String(x).toLowerCase());
            const awayVals = [m.awayTeamId, m.awayTeam, m.awaySchoolId].filter(Boolean).map(x => String(x).toLowerCase());

            const isHome = homeVals.some(h => targets.some(t => h.includes(t) || t.includes(h)));
            const isAway = awayVals.some(a => targets.some(t => a.includes(t) || t.includes(a)));
            return isHome || isAway;
        });
    }, [matches, schoolId, schoolName, schools, allTeams]);

    const selectedMatch = useMemo(() => {
        return myMatches.find(m => m.id === selectedMatchId) || myMatches[0] || null;
    }, [myMatches, selectedMatchId]);

    const isHome = useMemo(() => {
        if (!selectedMatch) return false;
        const targets = [
            schoolId, schoolName,
            ...(allTeams || []).filter(t => t.schoolId === schoolId).flatMap(t => [t.id, t.name])
        ].filter(Boolean).map(x => String(x).toLowerCase());

        const homeVals = [selectedMatch.homeTeamId, selectedMatch.homeTeam, selectedMatch.homeSchoolId].filter(Boolean).map(x => String(x).toLowerCase());
        return homeVals.some(h => targets.some(t => h.includes(t) || t.includes(h)));
    }, [selectedMatch, schoolId, schoolName, allTeams]);

    const eligiblePlayers = useMemo(() => {
        if (!selectedMatch) return [];
        return (allPlayers || []).filter(p => {
            if (p.schoolId === schoolId) return true;
            const assignments = p.teamAssignments || {};
            const teamIds = (allTeams || []).filter(t => t.schoolId === schoolId).map(t => t.id);
            return teamIds.some(tId => Object.values(assignments).includes(tId)) || Object.values(assignments).includes(schoolId);
        });
    }, [allPlayers, selectedMatch, schoolId, allTeams]);

    // Flat list of selected player IDs in starting XI (no nulls)
    const selectedStartingXIIds = useMemo(() => {
        return startingXI.filter(id => id !== null);
    }, [startingXI]);

    // Available players for selection (not in Starting XI and not on bench)
    const availablePlayers = useMemo(() => {
        const selectedIds = new Set([...selectedStartingXIIds, ...benchPlayers]);
        return eligiblePlayers.filter(p => !selectedIds.has(p.id));
    }, [eligiblePlayers, selectedStartingXIIds, benchPlayers]);

    // Filter available players by search query
    const filteredAvailablePlayers = useMemo(() => {
        if (!searchQuery) return availablePlayers;
        const q = searchQuery.toLowerCase();
        return availablePlayers.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.firstName && p.firstName.toLowerCase().includes(q)) || 
            (p.lastName && p.lastName.toLowerCase().includes(q)) ||
            (p.jerseyNumber != null && String(p.jerseyNumber).includes(q)) ||
            (p.position && p.position.toLowerCase().includes(q))
        );
    }, [availablePlayers, searchQuery]);

    const getSchoolObj = (teamId) => {
        if (!teamId) return null;
        let sc = (schools || []).find(s => s.id === teamId || s.rawId === teamId);
        if (sc) return sc;
        if (typeof teamId === 'string') {
            const baseId = teamId.includes('-team-') ? teamId.split('-team-')[0] : teamId.split('_')[0];
            sc = (schools || []).find(s => s.id === baseId || s.rawId === baseId);
            if (sc) return sc;
            sc = (schools || []).find(s => s.name?.toLowerCase() === teamId.toLowerCase());
            if (sc) return sc;
        }
        return null;
    };

    const getSchoolName = (teamId, matchObj) => {
        if (!teamId && !matchObj) return 'Unknown Team';
        
        if (matchObj) {
            if (matchObj.homeTeamId === teamId && matchObj.homeTeam && typeof matchObj.homeTeam === 'string' && !matchObj.homeTeam.includes('-team-') && !matchObj.homeTeam.startsWith('s1-') && !matchObj.homeTeam.startsWith('s2-') && !matchObj.homeTeam.startsWith('s3-')) {
                return matchObj.homeTeam;
            }
            if (matchObj.awayTeamId === teamId && matchObj.awayTeam && typeof matchObj.awayTeam === 'string' && !matchObj.awayTeam.includes('-team-') && !matchObj.awayTeam.startsWith('s1-') && !matchObj.awayTeam.startsWith('s2-') && !matchObj.awayTeam.startsWith('s3-')) {
                return matchObj.awayTeam;
            }
        }

        const sc = getSchoolObj(teamId);
        if (sc?.name) {
            if (typeof teamId === 'string' && teamId.includes('-team-')) {
                const ageGroup = teamId.split('-team-')[1];
                if (ageGroup && ageGroup !== 'PMC') {
                    return `${sc.name} (${ageGroup})`;
                }
            }
            return sc.name;
        }

        const team = (allTeams || []).find(t => t.id === teamId || t.schoolId === teamId);
        if (team) {
            const sc2 = getSchoolObj(team.schoolId);
            return sc2 ? `${sc2.name} (${team.name})` : team.name;
        }

        if (matchObj) {
            if (matchObj.homeTeamId === teamId && matchObj.homeTeam) return matchObj.homeTeam;
            if (matchObj.awayTeamId === teamId && matchObj.awayTeam) return matchObj.awayTeam;
        }

        if (typeof teamId === 'string') {
            return teamId
                .replace('-team-PMC', '')
                .replace('-team-', ' ')
                .replace('pmc-club-', 'Club ')
                .replace(/^s1(\b|_|-|\s)/, 'Elite Academy ')
                .replace(/^s2(\b|_|-|\s)/, 'City Football Club ')
                .replace(/^s3(\b|_|-|\s)/, 'United Youth Academy ')
                .replace(/_/g, ' ');
        }

        return 'Team';
    };

    const getPlayerById = (id) => eligiblePlayers.find(p => p.id === id);

    // Automatically sync squad state when active match, school, or home/away orientation changes
    useEffect(() => {
        if (!selectedMatch) return;
        const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
        const savedSquad = selectedMatch[squadKey];

        if (savedSquad) {
            setFormation(savedSquad.formation || '4-3-3');
            setBenchPlayers(savedSquad.benchPlayers || []);
            if (Array.isArray(savedSquad.startingXI) && savedSquad.startingXI.length === 11) {
                setStartingXI(savedSquad.startingXI);
            } else {
                const restored = Array(11).fill(null);
                (savedSquad.startingXI || []).forEach((id, index) => {
                    if (index < 11) restored[index] = id;
                });
                setStartingXI(restored);
            }
        } else {
            setFormation('4-3-3');
            setStartingXI(Array(11).fill(null));
            setBenchPlayers([]);
        }
        
        setActiveSlotIndex(null);
        setSearchQuery('');
        setSubmitSuccess(false);
    }, [selectedMatch?.id, schoolId, isHome]);

    const handleSelectMatch = (matchId) => {
        setSelectedMatchId(matchId);
        setNotificationInfo(null);
    };

    const assignPlayerToSlot = (playerId) => {
        if (activeSlotIndex === null) return;
        
        const newXI = [...startingXI];
        const existingSlotIdx = newXI.indexOf(playerId);
        if (existingSlotIdx !== -1) {
            newXI[existingSlotIdx] = null;
        }

        newXI[activeSlotIndex] = playerId;
        setStartingXI(newXI);
        setActiveSlotIndex(null);
        setSearchQuery('');
    };

    const clearSlot = (slotIdx) => {
        const newXI = [...startingXI];
        newXI[slotIdx] = null;
        setStartingXI(newXI);
        setActiveSlotIndex(null);
    };

    const addToBench = (playerId) => {
        if (benchPlayers.length >= MAX_BENCH) return;
        setBenchPlayers(prev => [...prev, playerId]);
    };

    const removeFromBench = (playerId) => {
        setBenchPlayers(prev => prev.filter(id => id !== playerId));
    };

    const handleSubmitSquad = () => {
        if (selectedStartingXIIds.length !== 11 || !selectedMatch) return;
        const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
        const opponentSquadKey = isHome ? 'awaySquadSelection' : 'homeSquadSelection';
        const opponentAlreadySubmitted = !!selectedMatch[opponentSquadKey];

        const squadPayload = {
            formation,
            startingXI,
            benchPlayers,
            submittedAt: new Date().toISOString(),
            submittedBy: schoolName,
            validationStatus: 'pending_validation' // Manager submits -> Super-Admin validates
        };

        const updatedMatch = {
            ...selectedMatch,
            [squadKey]: squadPayload
        };

        onUpdateMatch(updatedMatch);
        setSubmitSuccess(true);

        const homeName = getSchoolName(selectedMatch.homeTeamId, selectedMatch);
        const awayName = getSchoolName(selectedMatch.awayTeamId, selectedMatch);

        if (opponentAlreadySubmitted) {
            setNotificationInfo({
                bothReady: true,
                refereeEmail: getRefereeContactSettings().refereeEmail,
                homeName,
                awayName
            });
        } else {
            setNotificationInfo({
                bothReady: false,
                refereeEmail: getRefereeContactSettings().refereeEmail,
                homeName,
                awayName
            });
        }

        setTimeout(() => {
            setSubmitSuccess(false);
        }, 6000);
    };

    const handleSendCoachSelfReminder = async () => {
        if (!selectedMatch) return;
        const opponentId = isHome ? selectedMatch.awayTeamId : selectedMatch.homeTeamId;
        const opponentName = getSchoolName(opponentId, selectedMatch);
        try {
            await sendCoachSquadReminderNotification(
                selectedMatch,
                schoolName,
                '', // defaults to coach contact
                `Head Coach (${schoolName})`,
                opponentName
            );
            setReminderSentToast(`✓ Squad submission reminder delivered to Coach email!`);
            setTimeout(() => setReminderSentToast(null), 5000);
        } catch (e) {
            console.warn('Failed to send coach reminder:', e);
        }
    };

    const alreadySubmitted = useMemo(() => {
        if (!selectedMatch) return false;
        const key = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
        return !!selectedMatch[key];
    }, [selectedMatch, isHome]);

    const pitchSlots = useMemo(() => {
        const layout = FORMATION_LAYOUTS[formation];
        return layout ? layout.slots : [];
    }, [formation]);

    const activeSlotRole = useMemo(() => {
        if (activeSlotIndex === null) return '';
        return pitchSlots[activeSlotIndex]?.label || '';
    }, [activeSlotIndex, pitchSlots]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0 }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Matchday Squad Selection</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure formation, click pitch positions to select players, and fill your bench.</span>
            </div>

            {/* Referee Email & Kick-off Notification Banner */}
            {notificationInfo && (
                <div style={{
                    padding: '12px 18px', borderRadius: '12px',
                    background: notificationInfo.bothReady ? 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))' : 'rgba(99,102,241,0.12)',
                    border: `1px solid ${notificationInfo.bothReady ? '#22c55e' : '#6366f1'}`,
                    color: notificationInfo.bothReady ? '#4ade80' : '#a5b4fc',
                    fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                            <div>
                                {notificationInfo.bothReady
                                    ? `Both squads submitted! Match is ready for blow-off. Official notification & team sheets dispatched to Referee via Gmail (${notificationInfo.refereeEmail}).`
                                    : `Your squad is submitted. Waiting for opponent squad submission before referee kick-off alert is dispatched.`
                                }
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                                {notificationInfo.bothReady ? `Referee assigned can blow the whistle from the Referee Dashboard.` : `Referee will be alerted automatically as soon as the opposing coach submits.`}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setNotificationInfo(null)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {myMatches.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px' }}>
                        No matches found for {schoolName}. Fixtures are automatically populated from the Prime Minister's Cup schedule.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedMatch ? '260px 1fr' : '1fr', gap: '16px', flex: 1, minHeight: 0 }}>
                    
                    {/* Fixture list */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>Team Fixtures</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {myMatches.map(m => {
                                const isMatchHome = String(m.homeTeamId).toLowerCase().includes(String(schoolId).toLowerCase().replace('-team-pmc', ''));
                                const squadKey = isMatchHome ? 'homeSquadSelection' : 'awaySquadSelection';
                                const submitted = !!m[squadKey];
                                const isFinished = m.status === 'completed' || m.status === 'refereed';
                                return (
                                    <div key={m.id} onClick={() => handleSelectMatch(m.id)} style={{
                                        padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                                        background: selectedMatchId === m.id ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.01)',
                                        border: selectedMatchId === m.id ? '1px solid rgba(37,99,235,0.3)' : 'var(--border)',
                                        display: 'flex', flexDirection: 'column', gap: '4px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                                            <span style={{ color: 'var(--primary-light)', fontWeight: '700' }}>{m.ageGroup || 'PMC'} • {m.matchday || m.round}</span>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                {m.status === 'live' && <span style={{ color: '#4ade80', fontWeight: '800', background: 'rgba(74,222,128,0.15)', padding: '1px 6px', borderRadius: '8px' }}>LIVE</span>}
                                                {isFinished && <span style={{ color: '#94a3b8', fontWeight: '700', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '8px' }}>FINISHED</span>}
                                                {submitted && !isFinished && m.status !== 'live' && <span style={{ color: 'var(--success)', fontWeight: '700' }}>SENT</span>}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {getSchoolName(m.homeTeamId, m)} vs {getSchoolName(m.awayTeamId, m)}
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.venue}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Squad builder */}
                    {selectedMatch && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                            
                            {/* Match header */}
                            <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        {getSchoolName(selectedMatch.homeTeamId, selectedMatch)} vs {getSchoolName(selectedMatch.awayTeamId, selectedMatch)}
                                    </h3>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedMatch.ageGroup || 'PMC'} • {selectedMatch.matchday || selectedMatch.round} • {selectedMatch.venue}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {selectedMatch.status === 'live' ? (
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(74,222,128,0.3)' }}>
                                            LIVE ({selectedMatch.homeScore} - {selectedMatch.awayScore})
                                        </span>
                                    ) : (selectedMatch.status === 'completed' || selectedMatch.status === 'refereed') ? (
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '20px', border: 'var(--border)' }}>
                                            Match Completed ({selectedMatch.homeScore} - {selectedMatch.awayScore})
                                        </span>
                                    ) : alreadySubmitted ? (
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.25)' }}>Squad Submitted</span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={handleSendCoachSelfReminder}
                                                style={{
                                                    padding: '8px 14px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '700',
                                                    background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                }}
                                                title="Send an email reminder to submit this squad before kickoff"
                                            >
                                                Send Reminder
                                            </button>
                                            <button onClick={handleSubmitSquad} disabled={selectedStartingXIIds.length !== 11} style={{
                                                padding: '8px 22px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                                                background: selectedStartingXIIds.length === 11 ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.06)',
                                                color: selectedStartingXIIds.length === 11 ? '#ffffff' : 'var(--text-muted)',
                                                border: selectedStartingXIIds.length === 11 ? 'none' : 'var(--border)',
                                                cursor: selectedStartingXIIds.length === 11 ? 'pointer' : 'not-allowed',
                                                boxShadow: selectedStartingXIIds.length === 11 ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                                                transition: 'all 0.15s ease'
                                            }}>
                                                Submit Squad ({formation})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Coach Reminder Toast Notification */}
                            {reminderSentToast && (
                                <div style={{
                                    padding: '10px 16px', borderRadius: '10px',
                                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                                    color: '#4ade80', fontSize: '12px', fontWeight: '700',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    {reminderSentToast}
                                </div>
                            )}

                            {/* Formation selector */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {Object.keys(FORMATION_LAYOUTS).map(f => (
                                    <button key={f} disabled={alreadySubmitted} onClick={() => { setFormation(f); setStartingXI(Array(11).fill(null)); }} style={{
                                        padding: '5px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '700',
                                        background: formation === f ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.03)',
                                        color: formation === f ? 'var(--primary-light)' : 'var(--text-secondary)',
                                        border: formation === f ? '1px solid rgba(37,99,235,0.35)' : 'var(--border)',
                                        cursor: alreadySubmitted ? 'default' : 'pointer', transition: 'all 0.15s',
                                        opacity: alreadySubmitted ? 0.6 : 1
                                    }}>
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Layout containing Pitch (fixed/contained aspect ratio) & Side Panel */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 340px', 
                                gap: '20px',
                                alignItems: 'start'
                            }}>
                                
                                {/* ═══ PITCH VISUALIZATION ═══ */}
                                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Formation: {formation}</span>
                                        <span style={{ fontSize: '11px', color: selectedStartingXIIds.length === 11 ? 'var(--success)' : 'var(--warning)', fontWeight: '700' }}>
                                            {selectedStartingXIIds.length}/11 assigned
                                        </span>
                                    </div>
                                    
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '440px',
                                        background: 'linear-gradient(180deg, #165c29 0%, #1c6d32 15%, #165c29 30%, #1c6d32 45%, #165c29 60%, #1c6d32 75%, #165c29 90%, #1c6d32 100%)',
                                        borderRadius: '0 0 12px 12px',
                                        overflow: 'hidden',
                                    }}>
                                        {/* Pitch markings */}
                                        <div style={{ position: 'absolute', inset: '3%', border: '2px solid rgba(255,255,255,0.25)', borderRadius: '4px' }} />
                                        <div style={{ position: 'absolute', left: '3%', right: '3%', top: '50%', height: '2px', background: 'rgba(255,255,255,0.2)' }} />
                                        <div style={{ position: 'absolute', left: '50%', top: '50%', width: '22%', height: '16%', transform: 'translate(-50%, -50%)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%' }} />
                                        <div style={{ position: 'absolute', left: '50%', top: '50%', width: '6px', height: '6px', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.4)', borderRadius: '50%' }} />
                                        <div style={{ position: 'absolute', left: '22%', right: '22%', top: '3%', height: '14%', border: '2px solid rgba(255,255,255,0.2)', borderTop: 'none' }} />
                                        <div style={{ position: 'absolute', left: '22%', right: '22%', bottom: '3%', height: '14%', border: '2px solid rgba(255,255,255,0.2)', borderBottom: 'none' }} />

                                        {/* Player slots on Pitch */}
                                        {pitchSlots.map((slot, idx) => {
                                            const playerId = startingXI[idx];
                                            const player = getPlayerById(playerId);
                                            const roleColor = player ? (ROLE_COLORS[slot.role] || '#6366f1') : 'rgba(255,255,255,0.08)';
                                            const isEditingThisSlot = activeSlotIndex === idx;

                                            return (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => !alreadySubmitted && setActiveSlotIndex(idx)}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${slot.x}%`,
                                                        top: `${slot.y}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                                        zIndex: 2,
                                                        cursor: alreadySubmitted ? 'default' : 'pointer',
                                                    }}
                                                >
                                                    {/* Football Kit SVG Jersey Graphic */}
                                                    {player ? (
                                                        <JerseyIcon 
                                                            number={player.jerseyNumber != null ? player.jerseyNumber : (idx + 1)} 
                                                            color={roleColor} 
                                                            size={isEditingThisSlot ? 50 : 44}
                                                            style={{
                                                                transform: isEditingThisSlot ? 'scale(1.15)' : 'scale(1)',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '34px',
                                                            height: '34px',
                                                            borderRadius: '50%',
                                                            background: 'rgba(0,0,0,0.4)',
                                                            border: '2px dashed rgba(255,255,255,0.4)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '14px', fontWeight: '800', color: 'rgba(255,255,255,0.7)'
                                                        }}>
                                                            +
                                                        </div>
                                                    )}
                                                    
                                                    {/* Name Tag Pill with 👤 Profile Drawer Trigger */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '3px',
                                                        background: player ? 'rgba(15,23,42,0.92)' : 'rgba(0,0,0,0.5)',
                                                        padding: '2px 7px',
                                                        borderRadius: '12px',
                                                        fontSize: '9.5px',
                                                        fontWeight: '800',
                                                        color: player ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '90px',
                                                        border: player ? '1px solid rgba(255,255,255,0.2)' : '1px dashed rgba(255,255,255,0.2)',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                                    }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {player ? (player.name ? (player.name.split(' ').slice(-1)[0] || player.name) : `${player.lastName || ''}`) : slot.label}
                                                        </span>

                                                        {/* Profile Icon Trigger Button */}
                                                        {player && (
                                                            <button
                                                                type="button"
                                                                title={`View ${player.name}'s Permanent Stats Profile (${player.playerId || `PID-${player.id}`})`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onStudentClick) {
                                                                        onStudentClick(player);
                                                                    } else {
                                                                        setPreviewStudent(player);
                                                                    }
                                                                }}
                                                                style={{
                                                                    background: 'rgba(99, 102, 241, 0.35)',
                                                                    border: '1px solid rgba(165, 180, 252, 0.5)',
                                                                    borderRadius: '50%',
                                                                    width: '15px',
                                                                    height: '15px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '8.5px',
                                                                    color: '#ffffff',
                                                                    cursor: 'pointer',
                                                                    padding: 0,
                                                                    marginLeft: '2px',
                                                                    transition: 'transform 0.15s ease'
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                            >
                                                                👤
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* ═══ INTERACTIVE POSITION SELECTION POP-UP OVERLAY ═══ */}
                                        {activeSlotIndex !== null && (
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(10, 25, 15, 0.92)',
                                                zIndex: 10,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '16px',
                                                color: '#fff',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--primary-light)' }}>
                                                            Assign {activeSlotRole} Position
                                                        </h4>
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Select player or clear slot</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => { setActiveSlotIndex(null); setSearchQuery(''); }}
                                                        style={{ background: 'none', border: 'none', color: '#ff6b6b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                {/* Search Box */}
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    placeholder="Search player name or number..."
                                                    style={{
                                                        padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                                                        background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px', outline: 'none',
                                                        marginBottom: '10px'
                                                    }}
                                                />

                                                {/* Available Selection List */}
                                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                                                    {startingXI[activeSlotIndex] && (
                                                        <button 
                                                            onClick={() => clearSlot(activeSlotIndex)}
                                                            style={{
                                                                padding: '8px', borderRadius: '6px', border: '1px solid rgba(255, 107, 107, 0.3)',
                                                                background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', fontSize: '11px',
                                                                fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                        >
                                                            ✕ Remove Assigned Player from this Position
                                                        </button>
                                                    )}

                                                    {filteredAvailablePlayers.length === 0 ? (
                                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '12px', textAlign: 'center' }}>
                                                            No matches. Make sure player is not in another slot or on the bench.
                                                        </span>
                                                    ) : (
                                                        filteredAvailablePlayers.map(p => (
                                                            <div 
                                                                key={p.id} 
                                                                onClick={() => assignPlayerToSlot(p.id)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                                                                    padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.15s'
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                    <span style={{
                                                                        width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '9px', fontWeight: '800', color: '#fff', border: '1px solid rgba(255,255,255,0.15)'
                                                                    }}>
                                                                        {p.jerseyNumber != null ? p.jerseyNumber : '—'}
                                                                    </span>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>
                                                                            {p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()}
                                                                        </span>
                                                                        <span style={{ fontSize: '9px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: '700' }}>
                                                                            Player ID: {p.playerId || `PID-2026-${String(p.id).padStart(5, '0')}`} {p.position ? `• ${p.position}` : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: '700' }}>Select</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ═══ SIDE PANEL: SQUAD SUMMARY & BENCH SELECTION ═══ */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    
                                    {/* Bench Management Panel */}
                                    <div className="glass-panel" style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>Substitute Bench</span>
                                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{benchPlayers.length}/{MAX_BENCH} max</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto', marginBottom: '8px' }}>
                                            {benchPlayers.length === 0 ? (
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px', textAlign: 'center' }}>No substitutes selected</span>
                                            ) : benchPlayers.map(pid => {
                                                const p = getPlayerById(pid);
                                                return (
                                                    <div 
                                                        key={pid} 
                                                        onClick={() => !alreadySubmitted && removeFromBench(pid)} 
                                                        title={alreadySubmitted ? '' : 'Click to remove'} 
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px',
                                                            background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)',
                                                            cursor: alreadySubmitted ? 'default' : 'pointer'
                                                        }}
                                                    >
                                                        <JerseyIcon number={p?.jerseyNumber != null ? p.jerseyNumber : '—'} color="#f59e0b" size={24} />
                                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {p ? (p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()) : `#${pid}`}
                                                        </span>
                                                        {!alreadySubmitted && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>✕</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bench Available Player Pool Selector */}
                                    <div className="glass-panel" style={{ padding: '12px', maxHeight: '290px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Select Bench Players</span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{availablePlayers.length} unassigned</span>
                                        </div>
                                        
                                        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                            {availablePlayers.length === 0 ? (
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
                                                    All players have been assigned.
                                                </span>
                                            ) : availablePlayers.map(p => (
                                                <div key={p.id} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '5px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                                        <JerseyIcon number={p.jerseyNumber != null ? p.jerseyNumber : '—'} color="#3b82f6" size={24} />
                                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()}
                                                            </span>
                                                            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                                                Reg No: {p.id} {p.jerseyNumber != null ? `• #${p.jerseyNumber}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => addToBench(p.id)} 
                                                        disabled={benchPlayers.length >= MAX_BENCH || alreadySubmitted} 
                                                        style={{
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '800',
                                                            background: (benchPlayers.length >= MAX_BENCH || alreadySubmitted) ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.15)',
                                                            color: (benchPlayers.length >= MAX_BENCH || alreadySubmitted) ? 'var(--text-muted)' : 'var(--warning)',
                                                            border: 'none', cursor: (benchPlayers.length >= MAX_BENCH || alreadySubmitted) ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        + Bench
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Submit bar */}
                            {submitSuccess && (
                                <div style={{
                                    padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                }}>
                                    ✓ Squad submitted! The statistician will see your Starting XI and Bench for this match.
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button onClick={handleSubmitSquad} disabled={selectedStartingXIIds.length !== 11 || alreadySubmitted} style={{
                                    padding: '10px 28px', borderRadius: '24px', fontSize: '13px', fontWeight: '800',
                                    background: (selectedStartingXIIds.length === 11 && !alreadySubmitted) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: (selectedStartingXIIds.length === 11 && !alreadySubmitted) ? '#ffffff' : 'var(--text-muted)',
                                    border: 'none', cursor: (selectedStartingXIIds.length === 11 && !alreadySubmitted) ? 'pointer' : 'not-allowed',
                                    boxShadow: (selectedStartingXIIds.length === 11 && !alreadySubmitted) ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                                    transition: 'all 0.2s'
                                }}>
                                    {alreadySubmitted ? 'Squad Already Submitted' : `Submit Squad (${formation})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {previewStudent && (
                <StudentProfileDrawer 
                    student={previewStudent} 
                    onClose={() => setPreviewStudent(null)} 
                />
            )}
        </div>
    );
}
