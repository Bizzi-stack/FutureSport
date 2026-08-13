import { useState, useMemo } from 'react';
import LiveMatch from '../match/LiveMatch';

export default function StatisticianDashboard({ matches = [], schools = [], allPlayers = [], year = '2026-2027', onUpdateMatch, onEndMatch, onLogout }) {
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const getSchoolObj = (schoolId) => {
        return schools?.find(s => s.id === schoolId) || null;
    };

    // Filter matches by search query (team name or venue)
    const filteredMatches = useMemo(() => {
        if (!searchQuery.trim()) return matches;
        const q = searchQuery.toLowerCase();
        return matches.filter(m => {
            const homeName = getSchoolObj(m.homeTeamId)?.name || m.homeTeam || '';
            const awayName = getSchoolObj(m.awayTeamId)?.name || m.awayTeam || '';
            const venue = m.venue || '';
            return homeName.toLowerCase().includes(q) || awayName.toLowerCase().includes(q) || venue.toLowerCase().includes(q);
        });
    }, [matches, schools, searchQuery]);

    // Categorize matches
    const liveMatches = useMemo(() => filteredMatches.filter(m => m.status === 'live'), [filteredMatches]);
    const upcomingMatches = useMemo(() => filteredMatches.filter(m => m.status === 'upcoming' || m.status === 'scheduled'), [filteredMatches]);
    const completedMatches = useMemo(() => filteredMatches.filter(m => m.status === 'completed' || m.status === 'refereed'), [filteredMatches]);

    // Statistician can only select already-live matches for data capture — no starting matches
    const handleSelectLiveMatch = (match) => {
        setSelectedMatch(match);
    };

    if (selectedMatch) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                {/* Back to Match Selection Bar */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '12px 20px', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '12px', borderRadius: '12px'
                }}>
                    <button
                        onClick={() => setSelectedMatch(null)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Match Selection
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                            🔴 LIVE DATA CAPTURE IN PROGRESS
                        </span>
                        {onLogout && (
                            <button
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

                {/* Embedded LiveMatch Engine */}
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <LiveMatch
                        matchData={selectedMatch}
                        match={selectedMatch}
                        schools={schools}
                        allStudents={allPlayers}
                        allPlayers={allPlayers}
                        year={year}
                        onUpdateMatch={(updated) => {
                            if (onUpdateMatch) onUpdateMatch(updated);
                            setSelectedMatch(updated);
                        }}
                        onEndMatch={(finalData) => {
                            if (onEndMatch) onEndMatch(finalData);
                            setSelectedMatch(null);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%', padding: '4px' }}>
            {/* Header Banner for Live Data Capturer */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.85))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>📡</span>
                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                    Field Live Data Capturer Portal
                                </h1>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                    Stationed at Turf / Venue · Select a live match to begin logging match statistics in real time.
                                </p>
                            </div>
                        </div>
                    </div>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                padding: '10px 20px', borderRadius: '10px',
                                background: 'rgba(244,63,94,0.15)', color: '#f43f5e',
                                border: '1px solid rgba(244,63,94,0.3)', fontSize: '13px', fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Log Out
                        </button>
                    )}
                </div>

                {/* Match Filter & Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '14px' }}>🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Identify match by club / team name (e.g. Wotton, UWI, Notre Dame, Ellerton...)"
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 40px',
                                borderRadius: '10px',
                                background: 'rgba(3, 7, 18, 0.65)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Match Listings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto' }}>
                
                {/* 1. Live Matches Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></span>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                            Active Matches In Progress ({liveMatches.length})
                        </h2>
                    </div>

                    {liveMatches.length === 0 ? (
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No active matches currently in progress. The Referee will kick off scheduled matches once both teams' squads are submitted.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                            {liveMatches.map(m => {
                                const homeSchool = getSchoolObj(m.homeTeamId);
                                const awaySchool = getSchoolObj(m.awayTeamId);
                                return (
                                    <div key={m.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(34,197,94,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '4px 10px', borderRadius: '20px' }}>
                                                🔴 LIVE NOW · {m.venue || 'Kensington Oval'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                {m.group || m.division || 'Group Stage'}
                                            </span>
                                        </div>

                                        {/* Teams & Score */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                                {homeSchool?.logo && <img src={homeSchool.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{homeSchool?.name || m.homeTeam}</span>
                                            </div>

                                            <div style={{ padding: '6px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', fontSize: '18px', fontWeight: '800', color: '#4ade80' }}>
                                                {m.homeScore ?? 0} - {m.awayScore ?? 0}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{awaySchool?.name || m.awayTeam}</span>
                                                {awaySchool?.logo && <img src={awaySchool.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSelectLiveMatch(m)}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '10px',
                                                background: '#22c55e', color: '#ffffff', border: 'none',
                                                fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            ⚽ Capture Live Stats
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Registered Scheduled Matches Section — Read Only */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>📅</span>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                            Registered Upcoming Fixtures ({upcomingMatches.length})
                        </h2>
                    </div>

                    {upcomingMatches.length === 0 ? (
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No upcoming scheduled matches found.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                            {upcomingMatches.map(m => {
                                const homeSchool = getSchoolObj(m.homeTeamId);
                                const awaySchool = getSchoolObj(m.awayTeamId);
                                const homeSquadReady = !!m.homeSquadSelection;
                                const awaySquadReady = !!m.awaySquadSelection;
                                return (
                                    <div key={m.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '4px 10px', borderRadius: '20px' }}>
                                                📅 Scheduled · {m.kickoff || m.time || '18:00'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                {m.venue || 'Turf Location'}
                                            </span>
                                        </div>

                                        {/* Teams */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                                {homeSchool?.logo && <img src={homeSchool.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{homeSchool?.name || m.homeTeam}</span>
                                            </div>

                                            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                                                VS
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{awaySchool?.name || m.awayTeam}</span>
                                                {awaySchool?.logo && <img src={awaySchool.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                                            </div>
                                        </div>

                                        {/* Squad Readiness Badges */}
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: homeSquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: homeSquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${homeSquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                                {homeSquadReady ? '✅' : '⏳'} Home Squad
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: awaySquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: awaySquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${awaySquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                                {awaySquadReady ? '✅' : '⏳'} Away Squad
                                            </span>
                                        </div>

                                        <div style={{
                                            padding: '10px 16px', borderRadius: '8px',
                                            background: 'rgba(99,102,241,0.08)', color: 'var(--text-muted)',
                                            border: '1px solid rgba(99,102,241,0.15)',
                                            fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                        }}>
                                            ⏳ Awaiting Referee Kick-Off
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3. Completed Matches Section */}
                {completedMatches.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '16px' }}>✅</span>
                            <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                Completed Matches ({completedMatches.length})
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                            {completedMatches.map(m => {
                                const homeSchool = getSchoolObj(m.homeTeamId);
                                const awaySchool = getSchoolObj(m.awayTeamId);
                                return (
                                    <div key={m.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {homeSchool?.logo && <img src={homeSchool.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />}
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{homeSchool?.name || m.homeTeam}</span>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#4ade80' }}>{m.homeScore ?? 0} - {m.awayScore ?? 0}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{awaySchool?.name || m.awayTeam}</span>
                                            {awaySchool?.logo && <img src={awaySchool.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />}
                                        </div>
                                        <button
                                            onClick={() => setSelectedMatch(m)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '6px',
                                                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                                                border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: '700',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            View Stats
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
