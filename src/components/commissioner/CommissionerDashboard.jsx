import { useState, useMemo } from 'react';
import LeagueTable from '../LeagueTable';
import KnockoutBrackets from '../KnockoutBrackets';
import { exportPMCMatchPacket, pushMatchToPMC } from '../../utils/pmcSyncEngine';

const DEFAULT_VENUES = [
    { id: 'Wildey Turf', name: 'Wildey Turf Ground' },
    { id: 'Harrison College', name: 'Harrison College Ground' },
    { id: 'Combermere Ground', name: 'Combermere Playing Field' },
    { id: 'Weymouth Playing Field', name: 'Weymouth Turf' }
];

const DEFAULT_OFFICIALS = [
    { id: 'ref-1', name: 'Gavin Corbin', role: 'Referee' },
    { id: 'ref-2', name: 'Kristian Gilkes', role: 'Referee' },
    { id: 'ref-3', name: 'Adrian Skeete', role: 'Referee' },
    { id: 'ref-4', name: 'Mark Forde', role: 'Referee' },
    { id: 'ref-5', name: 'Sherwin Johnson', role: 'Referee' },
    { id: 'comm-1', name: 'Charles White', role: 'Commissioner' },
    { id: 'comm-2', name: 'Harcourt Wason', role: 'Commissioner' }
];

export default function CommissionerDashboard({ matches, schools, allTeams, allStudents = [], onUpdateMatch, onAddMatches }) {
    const [mainTab, setMainTab] = useState('approvals'); // 'approvals' | 'scheduling'
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Commissioner Approval Form States
    const [incidentRating, setIncidentRating] = useState('1'); // 1 = peaceful, 5 = severe incidents
    const [generalRemarks, setGeneralRemarks] = useState('');
    const [commissionerSignature, setCommissionerSignature] = useState('');
    const [approvalSuccess, setApprovalSuccess] = useState(false);

    // Match Scheduling Tab States
    const [schedulingMode, setSchedulingMode] = useState('generator'); // 'generator' | 'manual'
    const [selectedDivision, setSelectedDivision] = useState('U14');
    const [matchdayTerm, setMatchdayTerm] = useState('Matchday 1');
    const [selectedVenue, setSelectedVenue] = useState(DEFAULT_VENUES[0].id);
    const [generationSuccess, setGenerationSuccess] = useState(false);

    // Manual Scheduler States
    const [manualHomeTeamId, setManualHomeTeamId] = useState('');
    const [manualAwayTeamId, setManualAwayTeamId] = useState('');
    const [manualDate, setManualDate] = useState('2026-07-15');
    const [manualReferee, setManualReferee] = useState(DEFAULT_OFFICIALS[0].name);
    const [manualCommissioner, setManualCommissioner] = useState(DEFAULT_OFFICIALS[DEFAULT_OFFICIALS.length - 1].name);
    const [manualGender, setManualGender] = useState('Boy');
    const [manualSuccess, setManualSuccess] = useState(false);

    // Get matches waiting for Commissioner Approval (refereed matches)
    const pendingApprovalMatches = useMemo(() => {
        return matches.filter(m => m.status === 'refereed');
    }, [matches]);

    // Get currently scheduled matches (upcoming)
    const upcomingScheduledMatches = useMemo(() => {
        return matches.filter(m => m.status === 'scheduled');
    }, [matches]);

    // Compute Discrepancies
    const discrepancies = useMemo(() => {
        if (!selectedMatch) return [];
        const issues = [];
        const statTimeline = selectedMatch.timeline || [];
        const refTimeline = selectedMatch.refereeLiveState?.timeline || [];

        const isGoalEvent = (e) => String(e?.type || '').toLowerCase().trim() === 'goal';
        const isYellowEvent = (e) => {
            const t = String(e?.type || '').toLowerCase().replace(/[\s_-]/g, '');
            return t === 'yellowcard' || t === 'yellow';
        };
        const isRedEvent = (e) => {
            const t = String(e?.type || '').toLowerCase().replace(/[\s_-]/g, '');
            return t === 'redcard' || t === 'red';
        };

        const statGoals = statTimeline.filter(isGoalEvent);
        const refGoals = refTimeline.filter(isGoalEvent);
        if (statGoals.length !== refGoals.length && refGoals.length > 0) {
            issues.push(`Goal count mismatch: Statistician logged ${statGoals.length}, Referee logged ${refGoals.length}.`);
        } else if (statGoals.length > 0 && refGoals.length > 0) {
            const statScorers = statGoals.map(g => String(g.playerId || '')).sort().join(',');
            const refScorers = refGoals.map(g => String(g.playerId || '')).sort().join(',');
            if (statScorers !== refScorers) {
                issues.push(`Goal scorers mismatch between Statistician and Referee logs.`);
            }
        }

        const statYellow = statTimeline.filter(isYellowEvent);
        const refYellow = refTimeline.filter(isYellowEvent);
        if (statYellow.length !== refYellow.length && refYellow.length > 0) {
            issues.push(`Yellow Card count mismatch: Statistician logged ${statYellow.length}, Referee logged ${refYellow.length}.`);
        }

        const statRed = statTimeline.filter(isRedEvent);
        const refRed = refTimeline.filter(isRedEvent);
        if (statRed.length !== refRed.length && refRed.length > 0) {
            issues.push(`Red Card count mismatch: Statistician logged ${statRed.length}, Referee logged ${refRed.length}.`);
        }

        return issues;
    }, [selectedMatch]);

    const getSchoolName = (schoolId, matchObj) => {
        if (!schoolId && !matchObj) return 'Unknown Team';
        const sc = (schools || []).find(s => s.id === schoolId || s.rawId === schoolId);
        if (sc) return sc.name;
        if (matchObj) {
            if (matchObj.homeTeamId === schoolId && matchObj.homeTeam) return matchObj.homeTeam;
            if (matchObj.awayTeamId === schoolId && matchObj.awayTeam) return matchObj.awayTeam;
        }
        return schoolId || 'Unknown Team';
    };

    const handleSelectMatch = (match) => {
        setSelectedMatch(match);
        setIncidentRating('1');
        setGeneralRemarks('');
        setCommissionerSignature('');
        setApprovalSuccess(false);
        setIsExpanded(false);
    };

    // Auto round-robin fixture generator
    const handleGenerateFixtures = () => {
        // Find teams matching target division
        const divisionTeams = allTeams.filter(t => t.name === selectedDivision);

        if (divisionTeams.length < 2) {
            alert(`Not enough teams in division ${selectedDivision} to generate fixtures! Need at least 2.`);
            return;
        }

        const referees = DEFAULT_OFFICIALS.filter(o => o.role === 'Referee');
        const commissioners = DEFAULT_OFFICIALS.filter(o => o.role === 'Commissioner');

        const newFixtures = [];
        let matchIndex = 1;
        for (let i = 0; i < divisionTeams.length; i++) {
            for (let j = i + 1; j < divisionTeams.length; j++) {
                const home = divisionTeams[i];
                const away = divisionTeams[j];

                const ref = referees[(i + j) % referees.length].name;
                const comm = commissioners[(i + j) % commissioners.length].name;

                newFixtures.push({
                    id: `scheduled-${Date.now()}-${matchIndex++}`,
                    homeTeamId: home.id,
                    awayTeamId: away.id,
                    ageGroup: selectedDivision,
                    matchday: matchdayTerm,
                    venue: selectedVenue,
                    referee: ref,
                    commissioner: comm,
                    status: 'scheduled',
                    homeScore: 0,
                    awayScore: 0,
                    playerStats: {},
                    timeline: [],
                    date: new Date(Date.now() + 86400000 * matchIndex).toISOString(), // future dates
                });
            }
        }

        onAddMatches(newFixtures);
        setGenerationSuccess(true);
        setTimeout(() => setGenerationSuccess(false), 3000);
    };

    // Manual single match setup
    const handleManualSchedule = (e) => {
        e.preventDefault();
        if (!manualHomeTeamId || !manualAwayTeamId || manualHomeTeamId === manualAwayTeamId) {
            alert('Please select two different teams!');
            return;
        }

        const matchId = `scheduled-manual-${Date.now()}`;
        const newMatch = {
            id: matchId,
            homeTeamId: manualHomeTeamId,
            awayTeamId: manualAwayTeamId,
            ageGroup: selectedDivision,
            matchday: matchdayTerm,
            venue: selectedVenue,
            referee: manualReferee,
            commissioner: manualCommissioner,
            status: 'scheduled',
            homeScore: 0,
            awayScore: 0,
            playerStats: {},
            timeline: [],
            date: new Date(manualDate).toISOString(),
        };

        onAddMatches([newMatch]);
        setManualSuccess(true);
        // Reset selections
        setManualHomeTeamId('');
        setManualAwayTeamId('');
        setTimeout(() => setManualSuccess(false), 3000);
    };

    const handleApproveMatch = async (e) => {
        e.preventDefault();
        if (!commissionerSignature.trim()) return;

        const updatedMatch = {
            ...selectedMatch,
            status: 'approved',
            commissionerReport: {
                incidentRating: parseInt(incidentRating),
                generalRemarks,
                commissionerSignature,
                approvedAt: new Date().toISOString()
            }
        };

        onUpdateMatch(updatedMatch);

        // Export to Prime Minister's Cup Portal
        const pmcPacket = exportPMCMatchPacket(updatedMatch, allStudents, allTeams, schools);
        if (pmcPacket) {
            await pushMatchToPMC(pmcPacket);
        }

        setApprovalSuccess(true);
        setSelectedMatch(null); // return to list view
        setIsExpanded(false);
        setTimeout(() => setApprovalSuccess(false), 3000);
    };

    // filter teams for custom scheduling selection
    const manualHomeTeamOptions = useMemo(() => {
        return allTeams.filter(t => t.name === selectedDivision && t.id !== manualAwayTeamId);
    }, [allTeams, selectedDivision, manualAwayTeamId]);

    const manualAwayTeamOptions = useMemo(() => {
        return allTeams.filter(t => t.name === selectedDivision && t.id !== manualHomeTeamId);
    }, [allTeams, selectedDivision, manualHomeTeamId]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%', minHeight: 0 }}>
            
            {/* Tab switch bar */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border)', paddingBottom: '10px' }}>
                <button
                    onClick={() => setMainTab('approvals')}
                    style={{
                        padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        background: mainTab === 'approvals' ? 'rgba(37,99,235,0.18)' : 'transparent',
                        color: mainTab === 'approvals' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        border: mainTab === 'approvals' ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}
                >
                    📋 Match Approvals & Verification
                </button>
                <button
                    onClick={() => setMainTab('scheduling')}
                    style={{
                        padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        background: mainTab === 'scheduling' ? 'rgba(37,99,235,0.18)' : 'transparent',
                        color: mainTab === 'scheduling' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        border: mainTab === 'scheduling' ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}
                >
                    📅 Match Setup & Scheduling
                </button>
                <button
                    onClick={() => setMainTab('standings')}
                    style={{
                        padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        background: mainTab === 'standings' ? 'rgba(37,99,235,0.18)' : 'transparent',
                        color: mainTab === 'standings' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        border: mainTab === 'standings' ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}
                >
                    📊 League Standings
                </button>
                <button
                    onClick={() => setMainTab('knockouts')}
                    style={{
                        padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        background: mainTab === 'knockouts' ? 'rgba(37,99,235,0.18)' : 'transparent',
                        color: mainTab === 'knockouts' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        border: mainTab === 'knockouts' ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}
                >
                    🏆 Knockout Setup
                </button>
            </div>

            {/* TAB CONTENT: Approvals */}
            {mainTab === 'approvals' && (
                <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
                    {/* Left side: Pending list */}
                    <div className="glass-panel" style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Pending Match Approvals</h3>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authorize scores to update standings and player profiles</span>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {approvalSuccess && (
                                <div style={{
                                    padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                }}>
                                    ✓ Match approved! Standings updated.
                                </div>
                            )}

                            {pendingApprovalMatches.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    🎉 No matches pending commissioner approval!
                                </div>
                            ) : (
                                pendingApprovalMatches.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => handleSelectMatch(m)}
                                        style={{
                                            padding: '14px', borderRadius: '10px', background: selectedMatch?.id === m.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                                            border: selectedMatch?.id === m.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.03)',
                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.15s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>
                                            <span>{m.ageGroup} Division</span>
                                            <span>{m.matchday}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            <span>{getSchoolName(m.homeTeamId).split(' ')[0]}</span>
                                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {m.homeScore} - {m.awayScore}
                                            </span>
                                            <span>{getSchoolName(m.awayTeamId).split(' ')[0]}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 Venue: {m.venue}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right side: Detailed approval pane */}
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                        {selectedMatch ? (
                            <form onSubmit={handleApproveMatch} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                                <div style={{ padding: '20px 24px', borderBottom: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Match Commissioner Verification Panel</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {getSchoolName(selectedMatch.homeTeamId)} vs {getSchoolName(selectedMatch.awayTeamId)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsExpanded(true)}
                                            style={{
                                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                                                background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)',
                                                border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                        >
                                            ⛶ Expand Panel
                                        </button>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-light)', background: 'rgba(37,99,235,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                            Pending Review
                                        </span>
                                    </div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    
                                    {/* Discrepancy Analysis Banner */}
                                    {discrepancies.length === 0 ? (
                                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '18px' }}>✅</span>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>Data Verified: No Discrepancies</span>
                                                <span style={{ fontSize: '12px', color: 'rgba(16, 185, 129, 0.8)' }}>The Referee's event log perfectly matches the Statistician's live data entry.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '18px' }}>⚠️</span>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)' }}>Data Conflict Detected</span>
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '28px', fontSize: '12px', color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {discrepancies.map((issue, idx) => <li key={idx}>{issue}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {/* Statistician stats */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>📊 Live Event Log (Statistician)</h4>
                                            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Score:</span>
                                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedMatch.homeScore} - {selectedMatch.awayScore}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Logged scorers:</span>
                                                    {selectedMatch.timeline?.length === 0 ? (
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No event logs.</span>
                                                    ) : (
                                                        selectedMatch.timeline?.map((ev, i) => (
                                                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                                                ⚽ Min {ev.minute}: {ev.type} (Player ID: {ev.playerId})
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Referee Report */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>📋 Official Event Log (Referee)</h4>
                                            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Referee logged events:</span>
                                                    {selectedMatch.refereeLiveState?.timeline?.length === 0 ? (
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No event logs.</span>
                                                    ) : (
                                                        selectedMatch.refereeLiveState?.timeline?.map((ev, i) => (
                                                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                                                ⏱️ Min {ev.minute}: {ev.type} (Player ID: {ev.playerId})
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '4px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Pitch / Weather:</span>
                                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedMatch.refereeReport?.pitchCondition} / {selectedMatch.refereeReport?.weatherCondition}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Referee Summary:</span>
                                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                                                        "{selectedMatch.refereeReport?.refereeSummary}"
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Referee Signature:</span>
                                                    <span style={{ fontWeight: '700', color: 'var(--primary-light)' }}>✍ {selectedMatch.refereeReport?.refereeSignature}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commissioner approval fields */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Incident Assessment</label>
                                            <select
                                                value={incidentRating}
                                                onChange={e => setIncidentRating(e.target.value)}
                                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                            >
                                                <option value="1">1 - Safe / Peaceful</option>
                                                <option value="2">2 - Minor incidents</option>
                                                <option value="3">3 - Crowd warning issued</option>
                                                <option value="4">4 - High risk / Misconduct</option>
                                                <option value="5">5 - Critical issues / Interrupted</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Commissioner Summary Remarks</label>
                                            <textarea
                                                value={generalRemarks}
                                                onChange={e => setGeneralRemarks(e.target.value)}
                                                placeholder="Write final review notes..."
                                                required
                                                style={{ height: '70px', padding: '10px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', resize: 'none', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Digital Authorization Signature</label>
                                            <input
                                                type="text"
                                                value={commissionerSignature}
                                                onChange={e => setCommissionerSignature(e.target.value)}
                                                placeholder="Type your official name to sign off..."
                                                required
                                                style={{ padding: '10px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '16px 24px', borderTop: 'var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.01)' }}>
                                    <button
                                        type="submit"
                                        disabled={!commissionerSignature.trim() || !generalRemarks.trim()}
                                        style={{
                                            padding: '10px 32px', borderRadius: '24px', background: 'var(--success)', color: '#ffffff', border: 'none',
                                            fontWeight: '800', fontSize: '13px', cursor: 'pointer', opacity: (commissionerSignature.trim() && generalRemarks.trim()) ? 1 : 0.5,
                                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        Authorize Score & Approve Standings
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <span>👉 Select a match from the refereed list to verify and approve.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Scheduling */}
            {mainTab === 'scheduling' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
                    
                    {/* Setup / Schedulers Panel */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', gap: '6px', borderBottom: 'var(--border)', paddingBottom: '10px' }}>
                            <button
                                onClick={() => setSchedulingMode('generator')}
                                style={{
                                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                    background: schedulingMode === 'generator' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    color: schedulingMode === 'generator' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer'
                                }}
                            >
                                ⚙️ Auto Round-Robin Generator
                            </button>
                            <button
                                onClick={() => setSchedulingMode('manual')}
                                style={{
                                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                    background: schedulingMode === 'manual' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    color: schedulingMode === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer'
                                }}
                            >
                                📝 Manual Match Setup
                            </button>
                        </div>

                        {/* MODE: Generator */}
                        {schedulingMode === 'generator' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Target Division Group</label>
                                    <select
                                        value={selectedDivision}
                                        onChange={e => setSelectedDivision(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="U14">U14 Division</option>
                                        <option value="U16">U16 Division</option>
                                        <option value="U19">U19 Division</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Fixture Matchday Term</label>
                                    <select
                                        value={matchdayTerm}
                                        onChange={e => setMatchdayTerm(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="Matchday 1">Matchday 1</option>
                                        <option value="Matchday 2">Matchday 2</option>
                                        <option value="Matchday 3">Matchday 3</option>
                                        <option value="Matchday 4">Matchday 4</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Ground Venue</label>
                                    <select
                                        value={selectedVenue}
                                        onChange={e => setSelectedVenue(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                    >
                                        {DEFAULT_VENUES.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {generationSuccess && (
                                    <div style={{
                                        padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                    }}>
                                        ✓ Fixtures successfully generated and scheduled!
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerateFixtures}
                                    style={{
                                        padding: '10px', borderRadius: '24px', background: 'var(--primary)', border: 'none',
                                        color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(37,99,235,0.25)', marginTop: '8px'
                                    }}
                                >
                                    Generate Round-Robin Fixtures
                                </button>
                            </div>
                        )}

                        {/* MODE: Manual Match scheduler */}
                        {schedulingMode === 'manual' && (
                            <form onSubmit={handleManualSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Division</label>
                                        <select
                                            value={selectedDivision}
                                            onChange={e => setSelectedDivision(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="U14">U14</option>
                                            <option value="U16">U16</option>
                                            <option value="U19">U19</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Matchday</label>
                                        <select
                                            value={matchdayTerm}
                                            onChange={e => setMatchdayTerm(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="Matchday 1">Matchday 1</option>
                                            <option value="Matchday 2">Matchday 2</option>
                                            <option value="Matchday 3">Matchday 3</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Home Team</label>
                                        <select
                                            value={manualHomeTeamId}
                                            onChange={e => setManualHomeTeamId(e.target.value)}
                                            required
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">Select Home School...</option>
                                            {manualHomeTeamOptions.map(t => (
                                                <option key={t.id} value={t.id}>{getSchoolName(t.schoolId)} ({t.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Away Team</label>
                                        <select
                                            value={manualAwayTeamId}
                                            onChange={e => setManualAwayTeamId(e.target.value)}
                                            required
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">Select Away School...</option>
                                            {manualAwayTeamOptions.map(t => (
                                                <option key={t.id} value={t.id}>{getSchoolName(t.schoolId)} ({t.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Match Date</label>
                                        <input
                                            type="date"
                                            value={manualDate}
                                            onChange={e => setManualDate(e.target.value)}
                                            required
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Match Ground Venue</label>
                                        <select
                                            value={selectedVenue}
                                            onChange={e => setSelectedVenue(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {DEFAULT_VENUES.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Assigned Referee</label>
                                        <select
                                            value={manualReferee}
                                            onChange={e => setManualReferee(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {DEFAULT_OFFICIALS.filter(o => o.role === 'Referee').map(o => (
                                                <option key={o.id} value={o.name}>{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Match Commissioner</label>
                                        <select
                                            value={manualCommissioner}
                                            onChange={e => setManualCommissioner(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {DEFAULT_OFFICIALS.filter(o => o.role === 'Commissioner').map(o => (
                                                <option key={o.id} value={o.name}>{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {manualSuccess && (
                                    <div style={{
                                        padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                    }}>
                                        ✓ Match successfully scheduled!
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px', borderRadius: '24px', background: 'var(--primary)', border: 'none',
                                        color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(37,99,235,0.25)', marginTop: '8px'
                                    }}
                                >
                                    Schedule Custom Fixture
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Right side: List of scheduled/upcoming matches */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Scheduled Fixtures</h3>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Currently scheduled and upcoming matches in the league</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {upcomingScheduledMatches.length === 0 ? (
                                <span style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>No matches currently scheduled. Use the generator or manual scheduler on the left to set up matches.</span>
                            ) : (
                                upcomingScheduledMatches.map(m => (
                                    <div
                                        key={m.id}
                                        style={{
                                            padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)',
                                            display: 'flex', flexDirection: 'column', gap: '4px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>
                                            <span>{m.ageGroup} Division ({m.matchday})</span>
                                            <span>🏟️ {m.venue}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            <span>{getSchoolName(m.homeTeamId).split(' ')[0]}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>vs</span>
                                            <span>{getSchoolName(m.awayTeamId).split(' ')[0]}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px' }}>
                                            <span>Ref: {m.referee}</span>
                                            <span>Comm: {m.commissioner}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            )}

            {mainTab === 'standings' && (
                <LeagueTable matches={matches} teams={allTeams} schools={schools} />
            )}

            {/* Expanded Verification Modal Overlay */}
            {isExpanded && selectedMatch && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(3, 7, 18, 0.92)', backdropFilter: 'blur(16px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '1080px', maxHeight: '92vh',
                        display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)'
                    }}>
                        <form onSubmit={e => { handleApproveMatch(e); }} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                            {/* Modal Header */}
                            <div style={{ padding: '20px 28px', borderBottom: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        Match Commissioner Verification & Sign-Off (Expanded View)
                                    </h2>
                                    <span style={{ fontSize: '13px', color: 'var(--primary-light)', fontWeight: '600' }}>
                                        {getSchoolName(selectedMatch.homeTeamId)} vs {getSchoolName(selectedMatch.awayTeamId)} · {selectedMatch.matchday || 'Matchday 1'} · Venue: {selectedMatch.venue || 'TBD'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(false)}
                                    style={{
                                        padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                                        background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                >
                                    ✕ Close Expanded View
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                {/* Discrepancy Analysis Banner */}
                                {discrepancies.length === 0 ? (
                                    <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '22px' }}>✅</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--success)' }}>Data Verified: No Discrepancies</span>
                                            <span style={{ fontSize: '13px', color: 'rgba(16, 185, 129, 0.9)' }}>The Referee's official log matches the Statistician's live event logging. Ready for authorization.</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '22px' }}>⚠️</span>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--danger)' }}>Data Conflict Detected</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '28px', fontSize: '13px', color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {discrepancies.map((issue, idx) => <li key={idx}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {/* Side-by-Side Live vs Official Logs */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Statistician stats */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Live Event Log (Statistician)</h4>
                                        <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: 'var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Score:</span>
                                                <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '16px' }}>{selectedMatch.homeScore} - {selectedMatch.awayScore}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Logged Event Timeline:</span>
                                                {selectedMatch.timeline?.length === 0 ? (
                                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No live events logged.</span>
                                                ) : (
                                                    selectedMatch.timeline?.map((ev, i) => (
                                                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                                            ⚽ Min {ev.minute}: {ev.type} (Player ID: {ev.playerId})
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Referee Report */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Official Event Log (Referee)</h4>
                                        <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: 'var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Referee Logged Events:</span>
                                                {selectedMatch.refereeLiveState?.timeline?.length === 0 ? (
                                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No referee events logged.</span>
                                                ) : (
                                                    selectedMatch.refereeLiveState?.timeline?.map((ev, i) => (
                                                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                                            ⏱️ Min {ev.minute}: {ev.type} (Player ID: {ev.playerId})
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Pitch / Weather:</span>
                                                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedMatch.refereeReport?.pitchCondition || 'Good'} / {selectedMatch.refereeReport?.weatherCondition || 'Clear'}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Referee Summary:</span>
                                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                                                    "{selectedMatch.refereeReport?.refereeSummary || 'Match completed without major incident.'}"
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Referee Signature:</span>
                                                <span style={{ fontWeight: '800', color: 'var(--primary-light)' }}>✍ {selectedMatch.refereeReport?.refereeSignature || selectedMatch.referee || 'Gavin Corbin'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Commissioner approval fields */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700' }}>Incident Assessment</label>
                                        <select
                                            value={incidentRating}
                                            onChange={e => setIncidentRating(e.target.value)}
                                            style={{ padding: '10px 14px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.4)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="1">1 - Safe / Peaceful</option>
                                            <option value="2">2 - Minor incidents</option>
                                            <option value="3">3 - Crowd warning issued</option>
                                            <option value="4">4 - High risk / Misconduct</option>
                                            <option value="5">5 - Critical issues / Interrupted</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700' }}>Commissioner Summary Remarks</label>
                                        <textarea
                                            value={generalRemarks}
                                            onChange={e => setGeneralRemarks(e.target.value)}
                                            placeholder="Write detailed review notes and authorization remarks..."
                                            required
                                            style={{ height: '110px', padding: '12px 14px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.4)', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', outline: 'none', lineHeight: '1.5' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700' }}>Digital Authorization Signature</label>
                                        <input
                                            type="text"
                                            value={commissionerSignature}
                                            onChange={e => setCommissionerSignature(e.target.value)}
                                            placeholder="Type your full official name to sign off..."
                                            required
                                            style={{ padding: '12px 14px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.4)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '20px 28px', borderTop: 'var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '14px', background: 'rgba(255,255,255,0.02)' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(false)}
                                    style={{
                                        padding: '10px 24px', borderRadius: '24px', background: 'transparent',
                                        color: 'var(--text-muted)', border: 'var(--border)', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!commissionerSignature.trim() || !generalRemarks.trim()}
                                    style={{
                                        padding: '12px 36px', borderRadius: '24px', background: 'var(--success)', color: '#ffffff', border: 'none',
                                        fontWeight: '800', fontSize: '14px', cursor: 'pointer', opacity: (commissionerSignature.trim() && generalRemarks.trim()) ? 1 : 0.5,
                                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                                    }}
                                >
                                    Authorize Score & Approve Standings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
