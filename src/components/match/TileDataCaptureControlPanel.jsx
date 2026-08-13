import React, { useState, useEffect, useMemo } from 'react';

export default function TileDataCaptureControlPanel({
    match,
    home,
    away,
    homePlayers = [],
    awayPlayers = [],
    studentsById = {},
    playerStats = {},
    elapsed = 0,
    period = '1H',
    onQuickLogEvent,
    onShotModal,
    onGkSaveModal
}) {
    // Active Possession Tracking State
    const [possessionSide, setPossessionSide] = useState(match?.liveState?.possession?.activeSide || null); // 'home' | 'away' | null
    const [homePossessionSecs, setHomePossessionSecs] = useState(match?.liveState?.possession?.homeSecs || 0);
    const [awayPossessionSecs, setAwayPossessionSecs] = useState(match?.liveState?.possession?.awaySecs || 0);

    // Selected Active Player (Optional Player-First Flow)
    const [activePlayer, setActivePlayer] = useState(null); // { id, name, team: 'home'|'away' }

    // Stat Action Picker Modal State (Stat-First Flow)
    const [pendingAction, setPendingAction] = useState(null); // { key: 'shot'|'yellowCard'|..., label: string, color: string }
    const [pickerTeamTab, setPickerTeamTab] = useState('home'); // 'home' | 'away'

    // Notification toast state
    const [toastMessage, setToastMessage] = useState(null);

    // Possession Timer Effect
    useEffect(() => {
        let interval = null;
        if (possessionSide === 'home') {
            interval = setInterval(() => setHomePossessionSecs(s => s + 1), 1000);
        } else if (possessionSide === 'away') {
            interval = setInterval(() => setAwayPossessionSecs(s => s + 1), 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [possessionSide]);

    // Calculate Possession Percentages
    const totalPossessionSecs = homePossessionSecs + awayPossessionSecs;
    const homePossessionPct = totalPossessionSecs > 0 ? Math.round((homePossessionSecs / totalPossessionSecs) * 100) : 50;
    const awayPossessionPct = totalPossessionSecs > 0 ? 100 - homePossessionPct : 50;

    const formatPossessionTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${String(s).padStart(2, '0')}s`;
    };

    // Toggle Team Possession
    const handleTogglePossession = (side) => {
        setPossessionSide(side);
        const teamName = side === 'home' ? home.name : away.name;
        triggerToast(`⚽ Ball Possession switched to ${teamName}`);
        if (onQuickLogEvent) {
            onQuickLogEvent({
                type: 'possessionChange',
                team: side,
                teamName,
                homePct: side === 'home' ? Math.min(99, homePossessionPct + 1) : homePossessionPct,
                awayPct: side === 'away' ? Math.min(99, awayPossessionPct + 1) : awayPossessionPct
            });
        }
    };

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    // All Direct Stat Tiles Configuration
    const STAT_TILES = [
        { key: 'shot', label: '⚽ Shot / Goal', subtitle: 'Log Shot attempt or Goal', color: 'linear-gradient(135deg, #10b981, #059669)', border: 'rgba(16, 185, 129, 0.4)' },
        { key: 'yellowCard', label: '🟨 Yellow Card', subtitle: 'Caution / Warning', color: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'rgba(245, 158, 11, 0.4)' },
        { key: 'redCard', label: '🟥 Red Card', subtitle: 'Ejection / Send-off', color: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'rgba(239, 68, 68, 0.4)' },
        { key: 'assist', label: '🅰️ Goal Assist', subtitle: 'Key Pass Scorer Assist', color: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'rgba(99, 102, 241, 0.4)' },
        { key: 'gkSave', label: '🧤 Goalkeeper Save', subtitle: 'GK Shot Block / Save', color: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'rgba(6, 182, 212, 0.4)' },
        { key: 'foul', label: '🛑 Foul Committed', subtitle: 'Tactical or Free Kick Foul', color: 'linear-gradient(135deg, #ea580c, #c2410c)', border: 'rgba(234, 88, 12, 0.4)' },
        { key: 'corner', label: '🚩 Corner Kick', subtitle: 'Set Piece Corner', color: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'rgba(59, 130, 246, 0.4)' },
        { key: 'penalty', label: '🎯 Penalty Kick', subtitle: 'Penalty Spot Kick', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'rgba(139, 92, 246, 0.4)' },
        { key: 'offside', label: '🚩 Offside Call', subtitle: 'Offside Infringement', color: 'linear-gradient(135deg, #64748b, #475569)', border: 'rgba(100, 116, 139, 0.4)' },
        { key: 'sub', label: '🔄 Substitution', subtitle: 'Player Tactical Swap', color: 'linear-gradient(135deg, #4b5563, #374151)', border: 'rgba(75, 85, 99, 0.4)' },
    ];

    // Handle Clicking a Stat Tile
    const handleTileClick = (tile) => {
        // If a player is already selected, log directly for active player!
        if (activePlayer) {
            executeLogForPlayer(activePlayer, tile.key);
            setActivePlayer(null);
            return;
        }

        // Handle specific modal triggers
        if (tile.key === 'shot' && onShotModal) {
            setPendingAction(tile);
            return;
        }

        if (tile.key === 'gkSave' && onGkSaveModal) {
            setPendingAction(tile);
            return;
        }

        // Open quick player picker for stat
        setPendingAction(tile);
    };

    // Execute Log for Selected Player
    const executeLogForPlayer = (player, actionKey) => {
        const student = studentsById[player.id];
        const name = student?.name || player.name || `Player #${player.id}`;

        if (actionKey === 'shot' && onShotModal) {
            onShotModal(player, 'goal');
            setPendingAction(null);
            return;
        }

        if (actionKey === 'gkSave' && onGkSaveModal) {
            onGkSaveModal(player);
            setPendingAction(null);
            return;
        }

        // Direct Quick Log
        if (onQuickLogEvent) {
            onQuickLogEvent({
                type: actionKey,
                playerId: player.id,
                playerName: name,
                team: player.team
            });
        }

        triggerToast(`Logged ${actionKey} for ${name}`);
        setPendingAction(null);
    };

    const homeRoster = useMemo(() => homePlayers.map(id => studentsById[id] || { id, name: `Player #${id}` }), [homePlayers, studentsById]);
    const awayRoster = useMemo(() => awayPlayers.map(id => studentsById[id] || { id, name: `Player #${id}` }), [awayPlayers, studentsById]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* Toast Notification Banner */}
            {toastMessage && (
                <div style={{
                    padding: '12px 20px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff', fontWeight: '800', fontSize: '13px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
                }}>
                    <span>✅ {toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>
            )}

            {/* ── 1. POSSESSION LOGGING TILES ───────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⏱️</span>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Live Team Possession Tracker
                        </h3>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Click team tile when ball possession switches
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Home Possession Tile */}
                    <button
                        type="button"
                        onClick={() => handleTogglePossession('home')}
                        style={{
                            padding: '18px 20px', borderRadius: '14px',
                            background: possessionSide === 'home'
                                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.15))'
                                : 'rgba(255, 255, 255, 0.03)',
                            border: possessionSide === 'home'
                                ? '2px solid #22c55e'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
                            boxShadow: possessionSide === 'home' ? '0 0 24px rgba(34, 197, 94, 0.3)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                                🟢 {home.name}
                            </span>
                            {possessionSide === 'home' && (
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#4ade80', background: 'rgba(34,197,94,0.2)', padding: '3px 8px', borderRadius: '12px' }}>
                                    ● IN POSSESSION
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                            <span style={{ fontSize: '32px', fontWeight: '900', color: possessionSide === 'home' ? '#4ade80' : 'var(--text-muted)' }}>
                                {homePossessionPct}%
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                                Time: {formatPossessionTime(homePossessionSecs)}
                            </span>
                        </div>
                    </button>

                    {/* Away Possession Tile */}
                    <button
                        type="button"
                        onClick={() => handleTogglePossession('away')}
                        style={{
                            padding: '18px 20px', borderRadius: '14px',
                            background: possessionSide === 'away'
                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))'
                                : 'rgba(255, 255, 255, 0.03)',
                            border: possessionSide === 'away'
                                ? '2px solid #818cf8'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
                            boxShadow: possessionSide === 'away' ? '0 0 24px rgba(99, 102, 241, 0.3)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                                🔵 {away.name}
                            </span>
                            {possessionSide === 'away' && (
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#818cf8', background: 'rgba(99,102,241,0.2)', padding: '3px 8px', borderRadius: '12px' }}>
                                    ● IN POSSESSION
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                            <span style={{ fontSize: '32px', fontWeight: '900', color: possessionSide === 'away' ? '#818cf8' : 'var(--text-muted)' }}>
                                {awayPossessionPct}%
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                                Time: {formatPossessionTime(awayPossessionSecs)}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Active Selected Player Indicator (Optional Fast Selection) */}
            {activePlayer && (
                <div style={{
                    padding: '12px 20px', borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>👤</span>
                        <div>
                            <span style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700', textTransform: 'uppercase' }}>Active Selected Player</span>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                                {activePlayer.name} ({activePlayer.team === 'home' ? home.name : away.name})
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tap any Stat Tile below to log instantly!</span>
                        <button onClick={() => setActivePlayer(null)} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                            Clear ✕
                        </button>
                    </div>
                </div>
            )}

            {/* ── 2. DIRECT STAT LOG OPTIONS TILES GRID ─────────────────────── */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📊 Direct Match Event Log Tiles
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Select a tile to log match events in 1 tap
                    </span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '14px'
                }}>
                    {STAT_TILES.map(tile => (
                        <button
                            key={tile.key}
                            type="button"
                            onClick={() => handleTileClick(tile)}
                            style={{
                                padding: '16px', borderRadius: '12px',
                                background: tile.color,
                                border: `1px solid ${tile.border}`,
                                color: '#ffffff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '15px', fontWeight: '800' }}>
                                {tile.label}
                            </span>
                            <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: '600' }}>
                                {tile.subtitle}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 3. FAST PLAYER SELECTOR MODAL (Stat-First Flow) ───────────── */}
            {pendingAction && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '650px', maxHeight: '85vh',
                        display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
                        border: `1px solid ${pendingAction.border}`,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 20px', background: pendingAction.color, color: '#ffffff',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                                    Select Player for {pendingAction.label}
                                </h3>
                                <span style={{ fontSize: '12px', opacity: 0.9 }}>
                                    Tap player name to log event immediately
                                </span>
                            </div>
                            <button
                                onClick={() => setPendingAction(null)}
                                style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Team Selector Tabs */}
                        <div style={{ display: 'flex', borderBottom: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            <button
                                type="button"
                                onClick={() => setPickerTeamTab('home')}
                                style={{
                                    flex: 1, padding: '12px', background: pickerTeamTab === 'home' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                    color: pickerTeamTab === 'home' ? '#4ade80' : 'var(--text-muted)',
                                    border: 'none', borderBottom: pickerTeamTab === 'home' ? '3px solid #22c55e' : 'none',
                                    fontWeight: '800', fontSize: '13px', cursor: 'pointer'
                                }}
                            >
                                🟢 {home.name}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPickerTeamTab('away')}
                                style={{
                                    flex: 1, padding: '12px', background: pickerTeamTab === 'away' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    color: pickerTeamTab === 'away' ? '#818cf8' : 'var(--text-muted)',
                                    border: 'none', borderBottom: pickerTeamTab === 'away' ? '3px solid #6366f1' : 'none',
                                    fontWeight: '800', fontSize: '13px', cursor: 'pointer'
                                }}
                            >
                                🔵 {away.name}
                            </button>
                        </div>

                        {/* Roster Selection Grid */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                            {(pickerTeamTab === 'home' ? homeRoster : awayRoster).map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => executeLogForPlayer({ id: p.id, name: p.name, team: pickerTeamTab }, pendingAction.key)}
                                    style={{
                                        padding: '12px 14px', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#ffffff', cursor: 'pointer', textAlign: 'left',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <span style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: pickerTeamTab === 'home' ? '#22c55e' : '#6366f1',
                                        color: '#fff', fontSize: '11px', fontWeight: '900',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {p.jerseyNumber || (p.id % 22) + 1}
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {p.name}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {p.position || 'Player'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
