import { useState, useEffect } from 'react';
import MatchSetup from './match/MatchSetup';
import LiveMatch from './match/LiveMatch';
import MatchHistory from './match/MatchHistory';
import MatchDetail from './match/MatchDetail';

const VIEWS = { SETUP: 'setup', LIVE: 'live', HISTORY: 'history', DETAIL: 'detail' };

export default function MatchCentre({ allStudents, year, term, matches, onEndMatch, onUpdateMatch, onClose }) {
    const [view, setView] = useState(VIEWS.SETUP);
    const [activeMatchData, setActiveMatchData] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);

    // Initialize with a live match if one is already running
    useEffect(() => {
        const liveMatch = matches.find(m => m.status === 'live');
        if (liveMatch && !activeMatchData) {
            setActiveMatchData(liveMatch);
            setView(VIEWS.LIVE);
        }
    }, [matches, activeMatchData]);

    const handleStartMatch = (setupData) => {
        setActiveMatchData(setupData);
        setView(VIEWS.LIVE);

        // If it was a scheduled match, mark it as 'live' to remove it from scheduler list
        if (setupData.id && onUpdateMatch) {
            const matchToUpdate = matches.find(m => m.id === setupData.id);
            if (matchToUpdate) {
                onUpdateMatch({
                    ...matchToUpdate,
                    status: 'live',
                    homeSquadSelection: setupData.homeSquadSelection,
                    awaySquadSelection: setupData.awaySquadSelection,
                    homePlayers: setupData.homePlayers,
                    awayPlayers: setupData.awayPlayers,
                    ageGroup: setupData.ageGroup,
                    matchday: setupData.matchday,
                    liveState: {
                        isRunning: true,
                        startTime: Date.now(),
                        elapsedOffset: 0,
                        period: '1H',
                        playerStats: {},
                        timeline: []
                    }
                });
            }
        }
    };

    const handleEndMatch = (matchResult) => {
        onEndMatch(matchResult);
        setActiveMatchData(null);
        setView(VIEWS.HISTORY);
    };

    const handleCancelMatch = () => {
        if (activeMatchData?.id && onUpdateMatch) {
            const matchToUpdate = matches.find(m => m.id === activeMatchData.id);
            if (matchToUpdate) {
                onUpdateMatch({
                    ...matchToUpdate,
                    status: 'scheduled',
                    homeSquadSelection: null,
                    awaySquadSelection: null
                });
            }
        }
        setActiveMatchData(null);
        setView(VIEWS.SETUP);
    };

    const handleSelectMatch = (match) => {
        setSelectedMatch(match);
        setView(VIEWS.DETAIL);
    };

    const handleBackFromDetail = () => {
        setSelectedMatch(null);
        setView(VIEWS.HISTORY);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'var(--bg-app)',
            display: 'flex', flexDirection: 'column',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
        }}>
            {/* Header */}
            <div style={{
                minHeight: '64px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: 'var(--border)',
                background: 'var(--bg-surface)',
                backdropFilter: 'blur(24px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onClose} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        flexShrink: 0,
                        fontSize: '12px', fontWeight: '700',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.04)',
                        border: 'var(--border)',
                        borderRadius: '8px', padding: '6px 14px',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                        ← Back to Squad
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
                            Match Centre
                        </span>
                        {view === VIEWS.LIVE && (
                            <span style={{
                                fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#10b981',
                                background: 'var(--success-dim)',
                                border: '1px solid rgba(16,185,129,0.2)',
                                padding: '3px 10px',
                                borderRadius: '99px',
                                animation: 'pulse 2s infinite',
                            }}>
                                ● LIVE
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Nav tabs */}
                    {view !== VIEWS.LIVE && (
                        <>
                            <button
                                onClick={() => setView(VIEWS.SETUP)}
                                style={{
                                    padding: '6px 16px',
                                    fontSize: '12px', fontWeight: '600',
                                    fontFamily: 'inherit',
                                    border: view === VIEWS.SETUP ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: view === VIEWS.SETUP ? 'var(--primary-glow-sm)' : 'rgba(255,255,255,0.03)',
                                    color: view === VIEWS.SETUP ? 'var(--primary-light)' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { if (view !== VIEWS.SETUP) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                                onMouseLeave={e => { if (view !== VIEWS.SETUP) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
                            >
                                ⚽ New Match
                            </button>
                            <button
                                onClick={() => { setSelectedMatch(null); setView(VIEWS.HISTORY); }}
                                style={{
                                    padding: '6px 16px',
                                    fontSize: '12px', fontWeight: '600',
                                    fontFamily: 'inherit',
                                    border: (view === VIEWS.HISTORY || view === VIEWS.DETAIL) ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: (view === VIEWS.HISTORY || view === VIEWS.DETAIL) ? 'var(--primary-glow-sm)' : 'rgba(255,255,255,0.03)',
                                    color: (view === VIEWS.HISTORY || view === VIEWS.DETAIL) ? 'var(--primary-light)' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { if (view !== VIEWS.HISTORY && view !== VIEWS.DETAIL) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                                onMouseLeave={e => { if (view !== VIEWS.HISTORY && view !== VIEWS.DETAIL) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
                            >
                                📋 Match History {matches.length > 0 && `(${matches.length})`}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: view === VIEWS.LIVE ? '0' : '24px 32px 48px',
                background: 'var(--bg-app)',
                minWidth: 0,
            }}>
                {view === VIEWS.SETUP && (
                    <MatchSetup
                        allStudents={allStudents}
                        year={year}
                        matchday={term}
                        onStartMatch={handleStartMatch}
                        matches={matches}
                    />
                )}
                {view === VIEWS.LIVE && activeMatchData && (
                    <LiveMatch
                        matchData={matches.find(m => m.id === activeMatchData.id) || activeMatchData}
                        allStudents={allStudents}
                        year={year}
                        onUpdateMatch={onUpdateMatch}
                        onEndMatch={handleEndMatch}
                        onCancel={handleCancelMatch}
                    />
                )}
                {view === VIEWS.HISTORY && (
                    <MatchHistory
                        matches={matches}
                        onSelectMatch={handleSelectMatch}
                    />
                )}
                {view === VIEWS.DETAIL && selectedMatch && (
                    <MatchDetail
                        match={selectedMatch}
                        allStudents={allStudents}
                        onBack={handleBackFromDetail}
                    />
                )}
            </div>

            {/* Pulse animation for LIVE badge */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
