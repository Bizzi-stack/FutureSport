import { useState, useMemo } from 'react';

export default function FourthOfficialDashboard({ matches, schools, allPlayers, onUpdateMatch }) {
    // We want matches that are currently live.
    const liveMatches = useMemo(() => {
        return matches.filter(m => m.status === 'live');
    }, [matches]);

    const getSchoolName = (schoolId) => {
        const sc = schools?.find(s => s.id === schoolId);
        return sc ? sc.name : 'Unknown School';
    };

    const getPlayerName = (playerId) => {
        const p = allPlayers?.find(p => p.id === playerId);
        return p ? p.name : 'Unknown Player';
    };

    const getPlayerNumber = (playerId) => {
        const p = allPlayers?.find(p => p.id === playerId);
        return p?.jerseyNumber != null ? `#${p.jerseyNumber}` : '';
    };

    const [approvingReqId, setApprovingReqId] = useState(null);
    const [subMinute, setSubMinute] = useState('');

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

        if (req.teamId === match.homeTeamId) {
            const newXI = newHomeSquad.startingXI.map(pid => pid === req.playerOff ? req.playerOn : pid);
            const newBench = newHomeSquad.benchPlayers.filter(pid => pid !== req.playerOn);
            newBench.push(req.playerOff);
            newHomeSquad = { ...newHomeSquad, startingXI: newXI, benchPlayers: newBench };
        } else if (req.teamId === match.awayTeamId) {
            const newXI = newAwaySquad.startingXI.map(pid => pid === req.playerOff ? req.playerOn : pid);
            const newBench = newAwaySquad.benchPlayers.filter(pid => pid !== req.playerOn);
            newBench.push(req.playerOff);
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

    if (liveMatches.length === 0) {
        return (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <h2>No live matches currently in progress.</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Fourth Official Dashboard</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage live substitution requests from coaches.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {liveMatches.map(match => {
                    const matchName = `${getSchoolName(match.homeTeamId)} vs ${getSchoolName(match.awayTeamId)}`;
                    const pendingSubs = (match.substitutionRequests || []).filter(r => r.status === 'pending');
                    const processedSubs = (match.substitutionRequests || []).filter(r => r.status !== 'pending');

                    return (
                        <div key={match.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{matchName}</h3>
                                    <span style={{ fontSize: '12px', color: 'var(--primary-light)' }}>{match.division || match.ageGroup} • {match.venue || 'Unknown Venue'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--success)' }}>LIVE</span>
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
                })}
            </div>
        </div>
    );
}
