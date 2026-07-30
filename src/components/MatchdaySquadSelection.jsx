import { useState, useMemo } from 'react';

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

export default function MatchdaySquadSelection({ matches, schoolId, allPlayers, allTeams, schools, onUpdateMatch }) {
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [formation, setFormation] = useState('4-3-3');
    
    // startingXI mapped to slot indices (indices 0 to 10 matching slot configuration)
    const [startingXI, setStartingXI] = useState(() => Array(11).fill(null));
    const [benchPlayers, setBenchPlayers] = useState([]);
    
    // Active slot being selected via pop-up player picker
    const [activeSlotIndex, setActiveSlotIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const schoolName = useMemo(() => {
        const sc = schools?.find(s => s.id === schoolId);
        return sc ? sc.name : 'My School';
    }, [schools, schoolId]);

    const myTeamIds = useMemo(() => {
        return (allTeams || []).filter(t => t.schoolId === schoolId).map(t => t.id);
    }, [allTeams, schoolId]);

    const myScheduledMatches = useMemo(() => {
        return (matches || []).filter(m =>
            m.status === 'scheduled' &&
            (myTeamIds.includes(m.homeTeamId) || myTeamIds.includes(m.awayTeamId))
        );
    }, [matches, myTeamIds]);

    const selectedMatch = useMemo(() => {
        return myScheduledMatches.find(m => m.id === selectedMatchId) || null;
    }, [myScheduledMatches, selectedMatchId]);

    const myTeamId = useMemo(() => {
        if (!selectedMatch) return null;
        if (myTeamIds.includes(selectedMatch.homeTeamId)) return selectedMatch.homeTeamId;
        if (myTeamIds.includes(selectedMatch.awayTeamId)) return selectedMatch.awayTeamId;
        return null;
    }, [selectedMatch, myTeamIds]);

    const eligiblePlayers = useMemo(() => {
        if (!myTeamId) return [];
        return (allPlayers || []).filter(p => {
            const assignments = p.teamAssignments || {};
            return Object.values(assignments).includes(myTeamId);
        });
    }, [allPlayers, myTeamId]);

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

    const getSchoolName = (teamId) => {
        const team = (allTeams || []).find(t => t.id === teamId);
        if (!team) return teamId;
        const sc = (schools || []).find(s => s.id === team.schoolId);
        return sc ? sc.name : team.name;
    };

    const getPlayerById = (id) => eligiblePlayers.find(p => p.id === id);

    const handleSelectMatch = (matchId) => {
        setSelectedMatchId(matchId);
        
        // Find if this match has pre-existing squad selection to restore
        const match = matches.find(m => m.id === matchId);
        const isHome = myTeamIds.includes(match?.homeTeamId);
        const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
        const savedSquad = match?.[squadKey];

        if (savedSquad) {
            setFormation(savedSquad.formation || '4-3-3');
            setBenchPlayers(savedSquad.benchPlayers || []);
            // Map savedStartingXI back to slots
            if (Array.isArray(savedSquad.startingXI) && savedSquad.startingXI.length === 11) {
                setStartingXI(savedSquad.startingXI);
            } else {
                // If saved format was a dynamic flat array, pad/recreate it
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
    };

    const assignPlayerToSlot = (playerId) => {
        if (activeSlotIndex === null) return;
        
        const newXI = [...startingXI];
        // If this player was already in another slot, clear that slot first
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
        const isHome = myTeamIds.includes(selectedMatch.homeTeamId);
        const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
        const updatedMatch = {
            ...selectedMatch,
            [squadKey]: {
                formation,
                startingXI, // submitting the mapped array of 11 ids
                benchPlayers,
                submittedAt: new Date().toISOString(),
                submittedBy: schoolName
            }
        };
        onUpdateMatch(updatedMatch);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 4000);
    };

    const alreadySubmitted = useMemo(() => {
        if (!selectedMatch) return false;
        const isHome = myTeamIds.includes(selectedMatch.homeTeamId);
        const key = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
        return !!selectedMatch[key];
    }, [selectedMatch, myTeamIds]);

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
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>⚽ Matchday Squad Selection</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure formation, click pitch positions to select players, and fill your bench.</span>
            </div>

            {myScheduledMatches.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <span style={{ fontSize: '2.5rem' }}>📋</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px' }}>
                        No upcoming scheduled matches for {schoolName}. The Match Commissioner will schedule fixtures.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedMatch ? '260px 1fr' : '1fr', gap: '16px', flex: 1, minHeight: 0 }}>
                    
                    {/* Fixture list */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>Upcoming Fixtures</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {myScheduledMatches.map(m => {
                                const isHome = myTeamIds.includes(m.homeTeamId);
                                const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
                                const submitted = !!m[squadKey];
                                return (
                                    <div key={m.id} onClick={() => handleSelectMatch(m.id)} style={{
                                        padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                                        background: selectedMatchId === m.id ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.01)',
                                        border: selectedMatchId === m.id ? '1px solid rgba(37,99,235,0.3)' : 'var(--border)',
                                        display: 'flex', flexDirection: 'column', gap: '4px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                            <span style={{ color: 'var(--primary-light)', fontWeight: '700' }}>{m.ageGroup} • {m.matchday}</span>
                                            {submitted && <span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ SENT</span>}
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {getSchoolName(m.homeTeamId).split(' ')[0]} vs {getSchoolName(m.awayTeamId).split(' ')[0]}
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📍 {m.venue}</span>
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
                                        {getSchoolName(selectedMatch.homeTeamId)} vs {getSchoolName(selectedMatch.awayTeamId)}
                                    </h3>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedMatch.ageGroup} • {selectedMatch.matchday} • {selectedMatch.venue}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {alreadySubmitted ? (
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.25)' }}>✓ Squad Submitted</span>
                                    ) : (
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
                                    )}
                                </div>
                            </div>

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
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                                                        zIndex: 2,
                                                        cursor: alreadySubmitted ? 'default' : 'pointer',
                                                    }}
                                                >
                                                    {/* Jersey or empty circle indicator */}
                                                    <div style={{
                                                        width: player ? '38px' : '32px',
                                                        height: player ? '38px' : '32px',
                                                        borderRadius: '50%',
                                                        background: player ? roleColor : 'rgba(0,0,0,0.3)',
                                                        border: isEditingThisSlot 
                                                            ? '2px solid #ffffff' 
                                                            : player 
                                                                ? '2px solid rgba(255,255,255,0.8)' 
                                                                : '2.5px dashed rgba(255,255,255,0.4)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: player ? '12px' : '12px',
                                                        fontWeight: '800',
                                                        color: player ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                                        boxShadow: player ? `0 3px 10px ${roleColor}99` : 'none',
                                                        transition: 'all 0.15s ease',
                                                        transform: isEditingThisSlot ? 'scale(1.15)' : 'none',
                                                    }}>
                                                        {player ? (player.jerseyNumber != null ? player.jerseyNumber : (idx + 1)) : '+'}
                                                    </div>
                                                    
                                                    {/* Position & Name Labels */}
                                                    <div style={{
                                                        background: player ? 'rgba(15,15,15,0.85)' : 'rgba(0,0,0,0.5)',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '9px',
                                                        fontWeight: '700',
                                                        color: player ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '74px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        textAlign: 'center',
                                                        border: player ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                                    }}>
                                                        {player ? (player.name ? (player.name.split(' ').slice(-1)[0] || player.name) : `${player.lastName || player.firstName || ''}`) : slot.label}
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
                                                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>
                                                                            Reg Number: {p.id} {p.position ? `• ${p.position}` : ''}
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
                                                        <span style={{
                                                            width: '18px', height: '18px', borderRadius: '50%', background: 'var(--warning)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '8px', fontWeight: '800', color: '#fff', flexShrink: 0
                                                        }}>
                                                            {p?.jerseyNumber != null ? p.jerseyNumber : '—'}
                                                        </span>
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
                                                        <span style={{
                                                            width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '9px', fontWeight: '800', color: 'var(--text-primary)', flexShrink: 0,
                                                            border: 'var(--border)'
                                                        }}>
                                                            {p.jerseyNumber != null ? p.jerseyNumber : '—'}
                                                        </span>
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
        </div>
    );
}
