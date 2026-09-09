import { useState, useMemo } from 'react';
import { resolvePlayer, resolvePlayerName } from '../../utils/playerResolver';

export default function EditMatchEventModal({
    isOpen,
    event,
    match,
    allPlayers = [],
    userRole = 'operator', // 'operator' | 'statistician' | 'referee'
    onSave,
    onOverturn,
    onClose
}) {
    if (!isOpen || !event) return null;

    const isReferee = userRole === 'referee';

    // Determine initial team side from event or player
    const initialTeamSide = useMemo(() => {
        if (event.team === 'away' || event.teamSide === 'away') return 'away';
        if (event.team === 'home' || event.teamSide === 'home') return 'home';
        const p = resolvePlayer(event.playerId, allPlayers);
        if (p && (p.schoolId === match?.awayTeamId || p.school === match?.awayTeamId)) return 'away';
        return 'home';
    }, [event, match, allPlayers]);

    const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'overturn'
    const [teamSide, setTeamSide] = useState(initialTeamSide);
    const [eventType, setEventType] = useState(event.type || 'goal');
    const [goalType, setGoalType] = useState(event.goalType || event.subtype || 'foot');
    const [playerId, setPlayerId] = useState(String(event.playerId || ''));
    const [assistPlayerId, setAssistPlayerId] = useState(String(event.assistingPlayerId || ''));
    const [minute, setMinute] = useState(() => {
        if (typeof event.minute === 'number') return event.minute;
        if (typeof event.elapsed === 'number') return Math.floor(event.elapsed / 60) + 1;
        return 1;
    });
    const [notes, setNotes] = useState(event.notes || '');
    const [overturnReason, setOverturnReason] = useState(
        event.overturnReason || (isReferee ? 'Referee changed call - Disallowed for Offside' : 'Referee changed call')
    );

    // Resolve team metadata
    const homeName = match?.homeTeam || (typeof match?.homeTeamId === 'string' ? match.homeTeamId : 'Home Team');
    const awayName = match?.awayTeam || (typeof match?.awayTeamId === 'string' ? match.awayTeamId : 'Away Team');

    // Extract players for both teams
    const { homePlayersList, awayPlayersList } = useMemo(() => {
        const homeIds = new Set([
            ...(match?.homeSquadSelection?.startingXI || []),
            ...(match?.homeSquadSelection?.substitutes || []),
            ...(match?.homePlayers || [])
        ].map(String));

        const awayIds = new Set([
            ...(match?.awaySquadSelection?.startingXI || []),
            ...(match?.awaySquadSelection?.substitutes || []),
            ...(match?.awayPlayers || [])
        ].map(String));

        const homeList = [];
        const awayList = [];

        allPlayers.forEach(p => {
            const pIdStr = String(p.id);
            const isHomeTeam = homeIds.has(pIdStr) || p.schoolId === match?.homeTeamId || p.school === match?.homeTeamId;
            const isAwayTeam = awayIds.has(pIdStr) || p.schoolId === match?.awayTeamId || p.school === match?.awayTeamId;

            const entry = {
                id: pIdStr,
                name: p.name || `Player #${p.jerseyNumber || pIdStr}`,
                jerseyNumber: p.jerseyNumber || ''
            };

            if (isHomeTeam) homeList.push(entry);
            if (isAwayTeam) awayList.push(entry);
        });

        // Fallback: If list is empty, include whatever playerId we have
        if (homeList.length === 0 && match?.homePlayers) {
            match.homePlayers.forEach(id => homeList.push({ id: String(id), name: `Player #${id}` }));
        }
        if (awayList.length === 0 && match?.awayPlayers) {
            match.awayPlayers.forEach(id => awayList.push({ id: String(id), name: `Player #${id}` }));
        }

        return { homePlayersList: homeList, awayPlayersList: awayList };
    }, [match, allPlayers]);

    const currentSquadList = teamSide === 'home' ? homePlayersList : awayPlayersList;

    const quickOverturnReasons = [
        'Referee changed call - Disallowed for Offside',
        'Referee changed call - Disallowed for Foul',
        'Referee changed call - Overturned Card / Booking Rescinded',
        'Referee changed call - No Penalty Awarded',
        'Operator data entry correction'
    ];

    const handleSaveEdits = (e) => {
        e.preventDefault();
        const selPlayer = allPlayers.find(p => String(p.id) === String(playerId));
        const pName = selPlayer?.name || resolvePlayerName(playerId, allPlayers) || event.playerName;

        let aName = null;
        if (assistPlayerId) {
            const aPlayer = allPlayers.find(p => String(p.id) === String(assistPlayerId));
            aName = aPlayer?.name || resolvePlayerName(assistPlayerId, allPlayers);
        }

        const updatedFields = {
            type: eventType,
            team: teamSide,
            teamSide: teamSide,
            playerId: playerId || event.playerId,
            playerName: pName,
            minute: Number(minute) || 1,
            elapsed: Math.max(0, (Number(minute) - 1) * 60),
            notes: notes.trim()
        };

        if (eventType === 'goal') {
            updatedFields.goalType = goalType;
            updatedFields.assistingPlayerId = assistPlayerId || null;
            updatedFields.assistingPlayerName = aName;
        } else if (eventType === 'gkSave') {
            updatedFields.saveType = goalType === 'penalty' ? 'penalty' : (goalType === 'freekick' ? 'freekick' : 'normal');
        }

        if (onSave) {
            onSave(event.id, updatedFields);
        }
        onClose();
    };

    const handleConfirmOverturn = () => {
        if (!overturnReason.trim()) {
            alert('Please select or provide a reason for overturning this call.');
            return;
        }
        if (onOverturn) {
            onOverturn(event.id, overturnReason.trim());
        }
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(10, 15, 29, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, rgba(23, 30, 50, 0.98), rgba(15, 20, 35, 0.99))',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '560px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{isReferee ? '⚖️' : '✏️'}</span>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                                {isReferee ? 'Referee Call Review & Edit' : 'Edit / Overturn Match Event'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {isReferee ? 'Official post-game audit & call adjustment' : 'Operator match events correction desk'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--text-muted)',
                            width: '28px', height: '28px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 'bold'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Mode Selector Tabs: Edit Details vs. Overturn Call */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        style={{
                            flex: 1, padding: '12px 16px', fontSize: '12px', fontWeight: '800',
                            color: activeTab === 'edit' ? '#38bdf8' : 'var(--text-muted)',
                            borderBottom: activeTab === 'edit' ? '2px solid #38bdf8' : '2px solid transparent',
                            background: activeTab === 'edit' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                            cursor: 'pointer', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        ✏️ Edit Event Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('overturn')}
                        style={{
                            flex: 1, padding: '12px 16px', fontSize: '12px', fontWeight: '800',
                            color: activeTab === 'overturn' ? '#f59e0b' : 'var(--text-muted)',
                            borderBottom: activeTab === 'overturn' ? '2px solid #f59e0b' : '2px solid transparent',
                            background: activeTab === 'overturn' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                            cursor: 'pointer', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        ⚔️ Overturn / Cancel Call
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '22px', maxHeight: '68vh', overflowY: 'auto' }}>
                    {activeTab === 'edit' ? (
                        <form onSubmit={handleSaveEdits} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Team Selection */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                    Team
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setTeamSide('home')}
                                        style={{
                                            padding: '10px 14px', borderRadius: '8px',
                                            background: teamSide === 'home' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                            border: teamSide === 'home' ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.08)',
                                            color: teamSide === 'home' ? '#4ade80' : 'var(--text-secondary)',
                                            fontSize: '12px', fontWeight: '800', cursor: 'pointer', textAlign: 'center'
                                        }}
                                    >
                                        Home: {homeName}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTeamSide('away')}
                                        style={{
                                            padding: '10px 14px', borderRadius: '8px',
                                            background: teamSide === 'away' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                            border: teamSide === 'away' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                                            color: teamSide === 'away' ? '#818cf8' : 'var(--text-secondary)',
                                            fontSize: '12px', fontWeight: '800', cursor: 'pointer', textAlign: 'center'
                                        }}
                                    >
                                        Away: {awayName}
                                    </button>
                                </div>
                            </div>

                            {/* Event Type & Subtype */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                        Event Type
                                    </label>
                                    <select
                                        value={eventType}
                                        onChange={e => setEventType(e.target.value)}
                                        style={{
                                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                            color: '#ffffff', fontSize: '13px', outline: 'none'
                                        }}
                                    >
                                        <option value="goal">⚽ Goal</option>
                                        <option value="shotOnTarget">🎯 Shot on Target / Saved</option>
                                        <option value="shotBlocked">🛡️ Shot Blocked</option>
                                        <option value="shotMissed">❌ Shot Off Target</option>
                                        <option value="assist">🅰️ Assist</option>
                                        <option value="yellowCard">🟨 Yellow Card</option>
                                        <option value="redCard">🟥 Red Card</option>
                                        <option value="foul">⚠️ Foul Committed</option>
                                        <option value="corner">🚩 Corner Kick</option>
                                        <option value="gkSave">🧤 Goalkeeper Save</option>
                                    </select>
                                </div>

                                {eventType === 'goal' ? (
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                            Goal Variety
                                        </label>
                                        <select
                                            value={goalType}
                                            onChange={e => setGoalType(e.target.value)}
                                            style={{
                                                width: '100%', padding: '9px 12px', borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                                color: '#ffffff', fontSize: '13px', outline: 'none'
                                            }}
                                        >
                                            <option value="foot">Open Play (Foot)</option>
                                            <option value="header">Header</option>
                                            <option value="penalty">Penalty Kick</option>
                                            <option value="freekick">Direct Free Kick</option>
                                            <option value="own-goal">Own Goal (Deflection)</option>
                                        </select>
                                    </div>
                                ) : eventType === 'gkSave' ? (
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                            Save Type
                                        </label>
                                        <select
                                            value={goalType}
                                            onChange={e => setGoalType(e.target.value)}
                                            style={{
                                                width: '100%', padding: '9px 12px', borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                                color: '#ffffff', fontSize: '13px', outline: 'none'
                                            }}
                                        >
                                            <option value="normal">Standard Save</option>
                                            <option value="penalty">Penalty Save 🧤</option>
                                            <option value="freekick">Free Kick Save</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                            Match Minute
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="130"
                                            value={minute}
                                            onChange={e => setMinute(e.target.value)}
                                            style={{
                                                width: '100%', padding: '9px 12px', borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                                color: '#ffffff', fontSize: '13px', outline: 'none'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Minute if Goal or Save */}
                            {(eventType === 'goal' || eventType === 'gkSave') && (
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                        Match Minute ({minute}')
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="130"
                                        value={minute}
                                        onChange={e => setMinute(e.target.value)}
                                        style={{
                                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                            color: '#ffffff', fontSize: '13px', outline: 'none'
                                        }}
                                    />
                                </div>
                            )}

                            {/* Player Selection */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                    Attributed Player
                                </label>
                                <select
                                    value={playerId}
                                    onChange={e => setPlayerId(e.target.value)}
                                    style={{
                                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                        color: '#ffffff', fontSize: '13px', outline: 'none'
                                    }}
                                >
                                    <option value="">-- Select Player --</option>
                                    {currentSquadList.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assist Selection if Goal */}
                            {eventType === 'goal' && goalType !== 'own-goal' && (
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                        Assisting Player (Optional)
                                    </label>
                                    <select
                                        value={assistPlayerId}
                                        onChange={e => setAssistPlayerId(e.target.value)}
                                        style={{
                                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                            color: '#ffffff', fontSize: '13px', outline: 'none'
                                        }}
                                    >
                                        <option value="">-- None / Unassisted --</option>
                                        {currentSquadList.filter(p => String(p.id) !== String(playerId)).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Optional Notes */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                    Correction Note / Reason
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="e.g. Scorer corrected to #10 after official confirmation"
                                    style={{
                                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                        color: '#ffffff', fontSize: '12px', outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '9px 18px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                                        border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '9px 22px', borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '800',
                                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                                    }}
                                >
                                    Save &amp; Recalculate
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Overturn Mode */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                padding: '14px', borderRadius: '10px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex', alignItems: 'flex-start', gap: '10px'
                            }}>
                                <span style={{ fontSize: '20px' }}>⚠️</span>
                                <div style={{ fontSize: '12px', color: '#fde68a', lineHeight: 1.5 }}>
                                    <strong>Overturning this call will nullify this event</strong> from all player statistics and match scores. If this event was a Goal, the match score will be decremented automatically.
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                    Select Overturn Reason (Referee Call Change)
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {quickOverturnReasons.map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setOverturnReason(r)}
                                            style={{
                                                padding: '8px 12px', borderRadius: '8px', textAlign: 'left',
                                                background: overturnReason === r ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                                border: overturnReason === r ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.06)',
                                                color: overturnReason === r ? '#fbbf24' : 'var(--text-secondary)',
                                                fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                                            }}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                                    Custom Reason / Official Note
                                </label>
                                <textarea
                                    value={overturnReason}
                                    onChange={e => setOverturnReason(e.target.value)}
                                    rows="2"
                                    style={{
                                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                                        color: '#ffffff', fontSize: '12px', resize: 'none', outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '9px 18px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                                        border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmOverturn}
                                    style={{
                                        padding: '9px 22px', borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '800',
                                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                                    }}
                                >
                                    ⚔️ Confirm Overturn Call
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
