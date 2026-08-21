import { useState, useMemo } from 'react';

export default function FourthOfficialDashboard({ 
    matches = [], 
    schools = [], 
    allPlayers = [], 
    currentOfficial = null, 
    onUpdateMatch, 
    onLogout 
}) {
    // Live matches and upcoming scheduled matches
    const liveMatches = useMemo(() => matches.filter(m => m.status === 'live'), [matches]);
    const upcomingMatches = useMemo(() => matches.filter(m => m.status === 'upcoming' || m.status === 'scheduled'), [matches]);

    const getSchoolName = (schoolId, fallbackName) => {
        const sc = schools?.find(s => s.id === schoolId || s.rawId === schoolId);
        if (sc) return sc.name;
        return fallbackName || schoolId || 'Team';
    };

    const getPlayerName = (playerId) => {
        const p = allPlayers?.find(p => p.id === playerId);
        return p ? p.name : `Player #${playerId}`;
    };

    const getPlayerNumber = (playerId) => {
        const p = allPlayers?.find(p => p.id === playerId);
        return p?.jerseyNumber != null ? `#${p.jerseyNumber}` : '';
    };

    const [approvingReqId, setApprovingReqId] = useState(null);
    const [subMinute, setSubMinute] = useState('');

    // Removed: handleStartMatch — Referee is the sole authority to start a match

    const handleApproveSub = (reqId) => {
        setApprovingReqId(reqId);
        setSubMinute('');
    };

    const confirmApproveSub = (match, reqId) => {
        const req = (match.substitutionRequests || []).find(r => r.id === reqId);
        if (!req) return;

        // Mark as approved
        const updatedRequests = match.substitutionRequests.map(r => 
            r.id === reqId ? { ...r, status: 'approved' } : r
        );

        // Also add to match events
        const newEvent = {
            id: `event-${Date.now()}`,
            type: 'substitution',
            teamId: req.teamId,
            playerOff: req.playerOff,
            playerOn: req.playerOn,
            timestamp: Date.now(),
            minute: subMinute ? parseInt(subMinute, 10) : (match.matchClock || 0)
        };

        const updatedEvents = [...(match.events || []), newEvent];

        // Process the lineup swap (move playerOff to bench, playerOn to XI)
        let newHomeSquad = match.homeSquadSelection || {
            startingXI: (match.homePlayers || []).slice(0, 11),
            benchPlayers: (match.homePlayers || []).slice(11)
        };
        let newAwaySquad = match.awaySquadSelection || {
            startingXI: (match.awayPlayers || []).slice(0, 11),
            benchPlayers: (match.awayPlayers || []).slice(11)
        };

        let isMatchHome = req.teamId === match.homeTeamId || String(match.homeTeamId).toLowerCase().includes(String(req.teamId).toLowerCase().replace('-team-pmc', ''));

        if (isMatchHome) {
            const newXI = newHomeSquad.startingXI.map(pid => pid === req.playerOff ? req.playerOn : pid);
            const newBench = [...newHomeSquad.benchPlayers.filter(pid => pid !== req.playerOn && pid !== req.playerOff), req.playerOff];
            newHomeSquad = { ...newHomeSquad, startingXI: newXI, benchPlayers: newBench };
        } else {
            const newXI = newAwaySquad.startingXI.map(pid => pid === req.playerOff ? req.playerOn : pid);
            const newBench = [...newAwaySquad.benchPlayers.filter(pid => pid !== req.playerOn && pid !== req.playerOff), req.playerOff];
            newAwaySquad = { ...newAwaySquad, startingXI: newXI, benchPlayers: newBench };
        }

        onUpdateMatch({
            ...match,
            substitutionRequests: updatedRequests,
            events: updatedEvents,
            homeSquadSelection: newHomeSquad,
            awaySquadSelection: newAwaySquad
        });
        setApprovingReqId(null);
    };

    const handleRejectSub = (match, reqId) => {
        const updatedRequests = match.substitutionRequests.map(r => 
            r.id === reqId ? { ...r, status: 'rejected' } : r
        );
        onUpdateMatch({
            ...match,
            substitutionRequests: updatedRequests
        });
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
                        Fourth Official Touchline Portal
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>
                        Monitor active fixtures and process real-time live substitution requests from team coaches.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {currentOfficial && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>{currentOfficial.name}</div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{currentOfficial.assignedVenue}</div>
                            </div>
                        </div>
                    )}
                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            style={{
                                padding: '8px 16px', borderRadius: '8px',
                                background: 'rgba(244,63,94,0.15)', color: '#f43f5e',
                                border: '1px solid rgba(244,63,94,0.3)', fontSize: '12px', fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Log Out
                        </button>
                    )}
                </div>
            </div>

            {/* 1. Active Live Matches Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></span>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                        Active Matches In Progress ({liveMatches.length})
                    </h3>
                </div>

                {liveMatches.length === 0 ? (
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No active live matches currently in progress. The Referee will kick off scheduled matches when both teams' squads are submitted.
                    </div>
                ) : (
                    liveMatches.map(match => {
                        const matchName = `${getSchoolName(match.homeTeamId, match.homeTeam)} vs ${getSchoolName(match.awayTeamId, match.awayTeam)}`;
                        const pendingSubs = (match.substitutionRequests || []).filter(r => r.status === 'pending');
                        const processedSubs = (match.substitutionRequests || []).filter(r => r.status !== 'pending');

                        return (
                            <div key={match.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(34,197,94,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{matchName}</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{match.round || match.division || match.ageGroup} • {match.venue || 'Unknown Venue'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#4ade80' }}>LIVE NOW</span>
                                        </div>
                                    </div>
                                </div>

                            {/* Pending Requests */}
                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '12px' }}>Pending Requests ({pendingSubs.length})</h4>
                                {pendingSubs.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No pending requests.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {pendingSubs.map(req => {
                                            const teamName = getSchoolName(req.teamId);
                                            return (
                                                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '12px 16px', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{teamName}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600' }}>
                                                            <span style={{ color: 'var(--danger)' }}>↓ {getPlayerNumber(req.playerOff)} {getPlayerName(req.playerOff)}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                                                            <span style={{ color: 'var(--success)' }}>↑ {getPlayerNumber(req.playerOn)} {getPlayerName(req.playerOn)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {approvingReqId === req.id ? (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <input 
                                                                type="number" 
                                                                placeholder="Min (e.g. 64)" 
                                                                value={subMinute}
                                                                onChange={(e) => setSubMinute(e.target.value)}
                                                                style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-primary)', fontSize: '13px' }}
                                                            />
                                                            <button 
                                                                onClick={() => confirmApproveSub(match, req.id)}
                                                                style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--success)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                                                                Confirm
                                                            </button>
                                                            <button 
                                                                onClick={() => setApprovingReqId(null)}
                                                                style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button 
                                                                onClick={() => handleRejectSub(match, req.id)}
                                                                style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(244,63,94,0.1)', color: 'var(--danger)', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer', fontWeight: '600' }}>
                                                                Reject
                                                            </button>
                                                            <button 
                                                                onClick={() => handleApproveSub(req.id)}
                                                                style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--success)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                                                                Approve
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Processed History */}
                            {processedSubs.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Recent History</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {processedSubs.slice(-3).map(req => (
                                            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    <span style={{ fontWeight: '600', marginRight: '8px' }}>{getSchoolName(req.teamId)}</span>
                                                    <span>Off: {getPlayerName(req.playerOff)} / On: {getPlayerName(req.playerOn)}</span>
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: req.status === 'approved' ? 'var(--success)' : 'var(--danger)', background: req.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }))
            }
            </div>

            {/* 2. Registered Upcoming Fixtures Section — Read-Only (Referee starts matches) */}
            {upcomingMatches.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                            Registered Upcoming Fixtures ({upcomingMatches.length})
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                        {upcomingMatches.map(m => {
                            const matchName = `${getSchoolName(m.homeTeamId, m.homeTeam)} vs ${getSchoolName(m.awayTeamId, m.awayTeam)}`;
                            const homeSquadReady = !!m.homeSquadSelection;
                            const awaySquadReady = !!m.awaySquadSelection;
                            return (
                                <div key={m.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{matchName}</h4>
                                        <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                                            {m.time || '18:00'}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.round || m.division} · {m.venue || 'Turf Location'}</span>
                                    
                                    {/* Squad Readiness Badges */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: homeSquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: homeSquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${homeSquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                            {homeSquadReady ? 'Ready' : 'Pending'} Home Squad
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: awaySquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: awaySquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${awaySquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                            {awaySquadReady ? 'Ready' : 'Pending'} Away Squad
                                        </span>
                                    </div>

                                    <div style={{
                                        padding: '10px 16px', borderRadius: '8px',
                                        background: 'rgba(99,102,241,0.08)', color: 'var(--text-muted)',
                                        border: '1px solid rgba(99,102,241,0.15)',
                                        fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                    }}>
                                        Awaiting Referee Kick-Off
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
