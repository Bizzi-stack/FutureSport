import { useState, useMemo } from 'react';

export default function CoachLiveManagement({ match, teamId, allPlayers, year, onUpdateMatch }) {
    const [selectedOff, setSelectedOff] = useState(null);
    const [selectedOn, setSelectedOn] = useState(null);

    const isHome = match.homeTeamId === teamId;
    const squadSelection = isHome ? match.homeSquadSelection : match.awaySquadSelection;
    
    // Fallback if squadSelection was skipped
    const fullRoster = isHome ? match.homePlayers : match.awayPlayers;
    
    const startingXI = useMemo(() => {
        if (squadSelection?.startingXI) return squadSelection.startingXI.filter(Boolean);
        if (fullRoster && fullRoster.length > 0) return fullRoster.slice(0, 11);
        
        // Final fallback: any players belonging to this team
        return allPlayers?.filter(p => p.teamAssignments?.[year] === teamId).map(p => p.id).slice(0, 11) || [];
    }, [squadSelection, fullRoster, allPlayers, teamId, year]);

    const benchPlayers = useMemo(() => {
        if (squadSelection?.benchPlayers) return squadSelection.benchPlayers;
        if (fullRoster && fullRoster.length > 0) return fullRoster.slice(11);
        
        // Final fallback
        return allPlayers?.filter(p => p.teamAssignments?.[year] === teamId).map(p => p.id).slice(11) || [];
    }, [squadSelection, fullRoster, allPlayers, teamId, year]);

    const getPlayerName = (playerId) => {
        const p = allPlayers?.find(p => p.id === playerId);
        return p ? p.name : 'Unknown';
    };

    const getPlayerNumber = (playerId) => {
        const p = allPlayers?.find(p => p.id === playerId);
        return p?.jerseyNumber != null ? `#${p.jerseyNumber}` : '';
    };

    const handleRequestSub = () => {
        if (!selectedOff || !selectedOn) return;

        const newRequest = {
            id: `subreq-${Date.now()}`,
            teamId,
            playerOff: selectedOff,
            playerOn: selectedOn,
            status: 'pending',
            timestamp: Date.now()
        };

        const updatedRequests = [...(match.substitutionRequests || []), newRequest];

        onUpdateMatch({
            ...match,
            substitutionRequests: updatedRequests
        });

        // Reset selection
        setSelectedOff(null);
        setSelectedOn(null);
    };

    const pendingRequests = (match.substitutionRequests || []).filter(r => r.teamId === teamId && r.status === 'pending');
    const pendingOffIds = new Set(pendingRequests.map(r => r.playerOff));
    const pendingOnIds = new Set(pendingRequests.map(r => r.playerOn));

    const approvedRequests = (match.substitutionRequests || []).filter(r => r.teamId === teamId && r.status === 'approved');
    const subbedOffIds = new Set(approvedRequests.map(r => r.playerOff));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Live Substitution Management</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>Request a substitution during the live match. The Fourth Official will receive and process your request.</p>
                    </div>
                    {pendingRequests.length > 0 && (
                        <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', borderRadius: '8px', color: 'var(--warning)', fontSize: '12px', fontWeight: '700' }}>
                            {pendingRequests.length} Pending Request(s)
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Players on Pitch (Select to take off) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ↓ Select Player to Come Off
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                            {startingXI.filter(Boolean).map(pid => {
                                const isPending = pendingOffIds.has(pid);
                                return (
                                <button
                                    key={pid}
                                    onClick={() => !isPending && setSelectedOff(pid)}
                                    disabled={isPending}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: selectedOff === pid ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.02)',
                                        border: selectedOff === pid ? '1px solid var(--danger)' : 'var(--border)',
                                        borderRadius: '8px', cursor: isPending ? 'not-allowed' : 'pointer', outline: 'none', transition: 'all 0.2s',
                                        color: selectedOff === pid ? 'var(--danger)' : 'var(--text-primary)',
                                        opacity: isPending ? 0.4 : 1
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: '700', width: '24px' }}>{getPlayerNumber(pid)}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{getPlayerName(pid)} {isPending ? '(Pending Sub)' : ''}</span>
                                </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bench Players (Select to bring on) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ↑ Select Substitute
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                            {benchPlayers.filter(Boolean).map(pid => {
                                const isSubbedOff = subbedOffIds.has(pid);
                                const isPending = pendingOnIds.has(pid);
                                const isDisabled = isSubbedOff || isPending;
                                return (
                                <button
                                    key={pid}
                                    onClick={() => !isDisabled && setSelectedOn(pid)}
                                    disabled={isDisabled}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: selectedOn === pid ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                                        border: selectedOn === pid ? '1px solid var(--success)' : 'var(--border)',
                                        borderRadius: '8px', cursor: isDisabled ? 'not-allowed' : 'pointer', outline: 'none', transition: 'all 0.2s',
                                        color: selectedOn === pid ? 'var(--success)' : 'var(--text-primary)',
                                        opacity: isDisabled ? 0.3 : 1
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: '700', width: '24px' }}>{getPlayerNumber(pid)}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                        {getPlayerName(pid)} {isSubbedOff ? '(Subbed Off)' : isPending ? '(Pending Sub)' : ''}
                                    </span>
                                </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '4px' }}>
                    <button
                        onClick={handleRequestSub}
                        disabled={!selectedOff || !selectedOn}
                        style={{
                            padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '800',
                            background: (!selectedOff || !selectedOn) ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                            color: (!selectedOff || !selectedOn) ? 'rgba(255,255,255,0.3)' : '#fff',
                            border: 'none', cursor: (!selectedOff || !selectedOn) ? 'not-allowed' : 'pointer',
                            boxShadow: (!selectedOff || !selectedOn) ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Submit Substitution Request
                    </button>
                </div>
            </div>
        </div>
    );
}
