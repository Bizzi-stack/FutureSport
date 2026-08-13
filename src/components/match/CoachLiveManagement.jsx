import { useState, useMemo } from 'react';

export default function CoachLiveManagement({ match, teamId, allPlayers, year, onUpdateMatch }) {
    const [selectedOff, setSelectedOff] = useState(null);
    const [selectedOn, setSelectedOn] = useState(null);

    const isHome = useMemo(() => {
        if (!match) return false;
        const cleanTeamId = String(teamId || '').toLowerCase().replace('-team-pmc', '');
        const cleanHomeId = String(match.homeTeamId || '').toLowerCase().replace('-team-pmc', '');
        return cleanHomeId === cleanTeamId || match.homeTeamId === teamId;
    }, [match, teamId]);

    const squadSelection = isHome ? match.homeSquadSelection : match.awaySquadSelection;

    const pendingRequests = useMemo(() => {
        return (match.substitutionRequests || []).filter(r => r.status === 'pending');
    }, [match.substitutionRequests]);

    const pendingOffIds = useMemo(() => new Set(pendingRequests.map(r => r.playerOff)), [pendingRequests]);
    const pendingOnIds = useMemo(() => new Set(pendingRequests.map(r => r.playerOn)), [pendingRequests]);

    const approvedRequests = useMemo(() => {
        return (match.substitutionRequests || []).filter(r => r.status === 'approved');
    }, [match.substitutionRequests]);

    const subbedOffIds = useMemo(() => new Set(approvedRequests.map(r => r.playerOff)), [approvedRequests]);
    const subbedOnIds = useMemo(() => new Set(approvedRequests.map(r => r.playerOn)), [approvedRequests]);

    // Active 11 players currently on the pitch (starting XI minus subbed off plus subbed on)
    const currentOnFieldPlayers = useMemo(() => {
        if (!squadSelection?.startingXI) return [];
        const field = [...squadSelection.startingXI.filter(Boolean)];
        // Replace subbed off players with their approved substitutes
        approvedRequests.forEach(req => {
            const idx = field.indexOf(req.playerOff);
            if (idx !== -1) {
                field[idx] = req.playerOn;
            } else if (!field.includes(req.playerOn) && !subbedOffIds.has(req.playerOn)) {
                field.push(req.playerOn);
            }
        });
        return field.filter(id => !subbedOffIds.has(id));
    }, [squadSelection, approvedRequests, subbedOffIds]);

    // Active bench substitutes currently available to come ON
    const currentBenchPlayers = useMemo(() => {
        if (!squadSelection?.benchPlayers) return [];
        return squadSelection.benchPlayers.filter(Boolean).filter(id => !subbedOnIds.has(id) && !subbedOffIds.has(id));
    }, [squadSelection, subbedOnIds, subbedOffIds]);

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

    // If no squad was submitted, show a warning instead of the sub panel
    if (!squadSelection) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '3rem' }}>⚠️</span>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--warning)' }}>
                        Squad Not Submitted
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', maxWidth: '420px' }}>
                        Your matchday squad was not submitted before kick-off. Live substitution management is unavailable. 
                        Please contact the Fourth Official if you need to make changes.
                    </p>
                </div>
            </div>
        );
    }

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
                            {currentOnFieldPlayers.map(pid => {
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
                            {currentBenchPlayers.map(pid => {
                                const isPending = pendingOnIds.has(pid);
                                return (
                                <button
                                    key={pid}
                                    onClick={() => !isPending && setSelectedOn(pid)}
                                    disabled={isPending}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: selectedOn === pid ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                                        border: selectedOn === pid ? '1px solid var(--success)' : 'var(--border)',
                                        borderRadius: '8px', cursor: isPending ? 'not-allowed' : 'pointer', outline: 'none', transition: 'all 0.2s',
                                        color: selectedOn === pid ? 'var(--success)' : 'var(--text-primary)',
                                        opacity: isPending ? 0.3 : 1
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: '700', width: '24px' }}>{getPlayerNumber(pid)}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                        {getPlayerName(pid)} {isPending ? '(Pending Sub)' : ''}
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
