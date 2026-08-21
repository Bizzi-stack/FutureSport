import { useState, useMemo, useEffect } from 'react';
import LiveMatch from '../match/LiveMatch';
import {
    getRefereeContactSettings,
    saveRefereeContactSettings,
    sendDataLoggerMatchReadyNotification,
    playDataLoggerAlertChime,
    triggerDeviceNotification
} from '../../services/refereeNotificationService';
import { getAnalystAccounts } from '../../data/analystAccounts';

export default function StatisticianDashboard({
    matches = [],
    schools = [],
    allPlayers = [],
    year = '2026-2027',
    currentAnalyst = null,
    initialDirectMatchId = null,
    onClearDirectMatchId = () => {},
    onUpdateMatch,
    onEndMatch,
    onLogout
}) {
    const [selectedMatchId, setSelectedMatchId] = useState(() => initialDirectMatchId || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('assigned'); // 'assigned' | 'all'
    const [loggerToast, setLoggerToast] = useState(null);

    const activeAnalyst = useMemo(() => {
        return currentAnalyst || getAnalystAccounts()[0];
    }, [currentAnalyst]);

    const dataLoggerEmail = activeAnalyst?.email || 'statistician.pmcup@gmail.com';

    // Auto-select match if arriving via deep link (initialDirectMatchId)
    useEffect(() => {
        if (initialDirectMatchId) {
            setSelectedMatchId(initialDirectMatchId);
            onClearDirectMatchId();
        }
    }, [initialDirectMatchId, onClearDirectMatchId]);

    const getSchoolObj = (schoolId) => {
        return schools?.find(s => s.id === schoolId || s.rawId === schoolId) || null;
    };

    // Keep live selected match synchronized with latest matches state
    const selectedMatch = useMemo(() => {
        if (!selectedMatchId) return null;
        return matches.find(m => m.id === selectedMatchId) || null;
    }, [matches, selectedMatchId]);

    const handleSendTestLoggerAlert = async () => {
        try {
            playDataLoggerAlertChime();
            triggerDeviceNotification(`Live Data Capture Alert: ${activeAnalyst?.name}`, {
                body: `Test signal delivered to ${dataLoggerEmail}. Real-time event capture alerts online!`,
                tag: 'logger-test'
            });
            await sendDataLoggerMatchReadyNotification(
                { id: 'TEST-LOGGER', venue: activeAnalyst?.venue || 'National Stadium', matchday: 'Matchday 1', homeSquadSelection: { formation: '4-3-3' }, awaySquadSelection: { formation: '4-2-3-1' } },
                'UWI Blackbirds',
                'Weymouth Wales',
                allPlayers,
                dataLoggerEmail
            );
            setLoggerToast(`Alert signal & deep link sent to ${dataLoggerEmail}!`);
            setTimeout(() => setLoggerToast(null), 4000);
        } catch (e) {
            console.warn('Logger test alert warning:', e);
        }
    };

    // Filter matches by search query (team name or venue)
    const filteredMatches = useMemo(() => {
        let list = matches;

        if (filterTab === 'assigned' && activeAnalyst) {
            const assignedIds = activeAnalyst.assignedMatchIds || [];
            const venueKeyword = activeAnalyst.venue ? activeAnalyst.venue.toLowerCase().split(' ')[0] : '';
            list = list.filter(m => {
                if (assignedIds.includes(m.id)) return true;
                if (venueKeyword && m.venue && m.venue.toLowerCase().includes(venueKeyword)) return true;
                return false;
            });
            // If no matches directly matched assigned venue, show all matches so analyst is never stuck
            if (list.length === 0) {
                list = matches;
            }
        }

        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(m => {
            const homeName = getSchoolObj(m.homeTeamId)?.name || m.homeTeam || '';
            const awayName = getSchoolObj(m.awayTeamId)?.name || m.awayTeam || '';
            const venue = m.venue || '';
            return homeName.toLowerCase().includes(q) || awayName.toLowerCase().includes(q) || venue.toLowerCase().includes(q);
        });
    }, [matches, schools, searchQuery, filterTab, activeAnalyst]);

    // Categorize matches
    const liveMatches = useMemo(() => filteredMatches.filter(m => m.status === 'live'), [filteredMatches]);
    const upcomingMatches = useMemo(() => filteredMatches.filter(m => m.status === 'upcoming' || m.status === 'scheduled'), [filteredMatches]);
    const completedMatches = useMemo(() => filteredMatches.filter(m => m.status === 'completed' || m.status === 'refereed'), [filteredMatches]);

    // When an analyst clicks a match
    const handleSelectMatch = (match) => {
        setSelectedMatchId(match.id);
    };

    // Force Start Match (Field Override if referee whistled on pitch)
    const handleForceStartLiveCapture = (match) => {
        const updated = {
            ...match,
            status: 'live',
            currentHalf: '1H',
            matchTime: '00:00',
            homeScore: match.homeScore || 0,
            awayScore: match.awayScore || 0,
            timeline: match.timeline || []
        };
        if (onUpdateMatch) onUpdateMatch(updated);
        setSelectedMatchId(match.id);
    };

    // ── Selected Match View (Pre-Kickoff Waiting Room OR Active Live Match) ──
    if (selectedMatch) {
        const isMatchLive = selectedMatch.status === 'live';
        const homeSchool = getSchoolObj(selectedMatch.homeTeamId);
        const awaySchool = getSchoolObj(selectedMatch.awayTeamId);
        const homeName = homeSchool?.name || selectedMatch.homeTeam || 'Home Team';
        const awayName = awaySchool?.name || selectedMatch.awayTeam || 'Away Team';
        const homeXI = selectedMatch.homeSquadSelection?.startingXI || [];
        const awayXI = selectedMatch.awaySquadSelection?.startingXI || [];
        const homeFormation = selectedMatch.homeSquadSelection?.formation || '4-3-3';
        const awayFormation = selectedMatch.awaySquadSelection?.formation || '4-3-3';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                {/* Top Navigation Bar */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '12px 20px', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '12px', borderRadius: '12px'
                }}>
                    <button
                        onClick={() => setSelectedMatchId(null)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Match Fixtures
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isMatchLive ? (
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></span>
                                LIVE DATA CAPTURE ACTIVE
                            </span>
                        ) : (
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                WAITING FOR REFEREE KICK-OFF
                            </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '14px' }}>{activeAnalyst.avatar}</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>{activeAnalyst.name}</span>
                        </div>

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

                {/* Condition: If Match is LIVE -> Render Live Data Capture Console */}
                {isMatchLive ? (
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
                            }}
                            onEndMatch={(finalData) => {
                                if (onEndMatch) onEndMatch(finalData);
                                setSelectedMatchId(null);
                            }}
                        />
                    </div>
                ) : (
                    /* Condition: If Match is NOT LIVE -> Render Pre-Kickoff Waiting Room */
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px' }}>
                        {/* Waiting Room Hero Banner */}
                        <div className="glass-panel" style={{
                            padding: '28px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,58,138,0.4))',
                            border: '1px solid rgba(56,189,248,0.3)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px'
                        }}>
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Match Live Readiness Room · Deep Link Station
                                </span>
                                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '6px 0' }}>
                                    {homeName} vs {awayName}
                                </h1>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '580px', margin: '0 auto' }}>
                                    Both teams have submitted their Starting XIs. The Match Referee has been notified with the team sheets. As soon as the referee blows the whistle to start the match on their device, this capture console will automatically activate.
                                </p>
                            </div>

                            {/* Match Meta Badges */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>
                                    Venue: {selectedMatch.venue || activeAnalyst.venue || 'National Stadium'}
                                </span>
                                <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>
                                    Kickoff: {selectedMatch.time || selectedMatch.kickoff || '18:00'}
                                </span>
                                <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                                    Assigned Analyst: {activeAnalyst.name} ({activeAnalyst.email})
                                </span>
                            </div>

                            {/* Live Pulse Indicator */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 20px', borderRadius: '30px',
                                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></span>
                                <span style={{ fontSize: '12.5px', color: '#fbbf24', fontWeight: '700' }}>
                                    Stationed pitchside · Live sync listening for referee whistle...
                                </span>
                            </div>

                            {/* Manual Override Action for Pitchside Testing */}
                            <div style={{ marginTop: '8px' }}>
                                <button
                                    onClick={() => handleForceStartLiveCapture(selectedMatch)}
                                    style={{
                                        padding: '12px 24px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#ffffff',
                                        border: 'none', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                                        boxShadow: '0 4px 18px rgba(34, 197, 94, 0.4)',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    Referee Has Blown Whistle · Begin Live Stat Capture
                                </button>
                            </div>
                        </div>

                        {/* Verified Team Sheets Preview */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                            {/* Home Squad */}
                            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid #22c55e' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {homeSchool?.logo && <img src={homeSchool.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />}
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{homeName}</h3>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                                        Formation: {homeFormation}
                                    </span>
                                </div>

                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Confirmed Starting XI ({homeXI.length} Players):
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                                    {homeXI.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '8px' }}>No players registered in lineup yet.</div>
                                    ) : (
                                        homeXI.map((pId, idx) => {
                                            const p = allPlayers.find(s => String(s.id) === String(pId)) || { name: `Player #${pId}`, jerseyNumber: '-' };
                                            return (
                                                <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{idx + 1}. {p.name}</span>
                                                    <span style={{ fontWeight: '700', color: '#4ade80' }}>#{p.jerseyNumber || '-'}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Away Squad */}
                            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid #38bdf8' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {awaySchool?.logo && <img src={awaySchool.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />}
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{awayName}</h3>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                                        Formation: {awayFormation}
                                    </span>
                                </div>

                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Confirmed Starting XI ({awayXI.length} Players):
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                                    {awayXI.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '8px' }}>No players registered in lineup yet.</div>
                                    ) : (
                                        awayXI.map((pId, idx) => {
                                            const p = allPlayers.find(s => String(s.id) === String(pId)) || { name: `Player #${pId}`, jerseyNumber: '-' };
                                            return (
                                                <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{idx + 1}. {p.name}</span>
                                                    <span style={{ fontWeight: '700', color: '#38bdf8' }}>#{p.jerseyNumber || '-'}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Main Statistician Match Dashboard ─────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%', padding: '4px' }}>
            {/* Header Banner */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.85))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px' }}>{activeAnalyst.avatar}</span>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                    {activeAnalyst.name}
                                </h1>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                                    {activeAnalyst.venue}
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                Field Live Data Analyst · Logged in as <strong style={{ color: '#a5b4fc' }}>{dataLoggerEmail}</strong>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                Switch Account / Log Out
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            type="button"
                            onClick={() => setFilterTab('assigned')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                                background: filterTab === 'assigned' ? 'rgba(56,189,248,0.25)' : 'transparent',
                                color: filterTab === 'assigned' ? '#38bdf8' : 'rgba(255,255,255,0.7)',
                                border: filterTab === 'assigned' ? '1px solid rgba(56,189,248,0.4)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            My Assigned Venue Fixtures
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('all')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                                background: filterTab === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent',
                                color: filterTab === 'all' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            All Tournament Fixtures ({matches.length})
                        </button>
                    </div>

                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by club, school, or venue..."
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: 'rgba(3, 7, 18, 0.65)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Email Dispatch Notification Status Bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                    padding: '10px 16px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Notification Destination: </span>
                        <strong style={{ color: '#a5b4fc' }}>{dataLoggerEmail}</strong>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 6px', borderRadius: '8px' }}>
                            ● FormSubmit Deep-Link Relay Online
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {loggerToast && (
                            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                                {loggerToast}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSendTestLoggerAlert}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff',
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            Test My Deep-Link Alert
                        </button>
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
                            No active matches currently in progress. Select an upcoming match below to enter the live waiting room.
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
                                                LIVE NOW · {m.venue || 'Kensington Oval'}
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
                                            onClick={() => handleSelectMatch(m)}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '10px',
                                                background: '#22c55e', color: '#ffffff', border: 'none',
                                                fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            Enter Live Data Capture Console
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Registered Scheduled Fixtures */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                            Upcoming Match Fixtures ({upcomingMatches.length})
                        </h2>
                    </div>

                    {upcomingMatches.length === 0 ? (
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No upcoming scheduled matches found in this view.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                            {upcomingMatches.map(m => {
                                const homeSchool = getSchoolObj(m.homeTeamId);
                                const awaySchool = getSchoolObj(m.awayTeamId);
                                const homeSquadReady = !!m.homeSquadSelection;
                                const awaySquadReady = !!m.awaySquadSelection;
                                const bothReady = homeSquadReady && awaySquadReady;

                                return (
                                    <div key={m.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '4px 10px', borderRadius: '20px' }}>
                                                Scheduled · {m.kickoff || m.time || '18:00'}
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
                                                {homeSquadReady ? 'Ready' : 'Pending'} Home Squad
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: awaySquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: awaySquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${awaySquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                                {awaySquadReady ? 'Ready' : 'Pending'} Away Squad
                                            </span>
                                            {bothReady && (
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                                                    SQUADS SUBMITTED
                                                </span>
                                            )}
                                        </div>

                                        {bothReady ? (
                                            <button
                                                onClick={() => handleSelectMatch(m)}
                                                style={{
                                                    padding: '11px 16px', borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff',
                                                    border: 'none', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer',
                                                    boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                Open Live Match Readiness Room
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSelectMatch(m)}
                                                style={{
                                                    padding: '10px 16px', borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                                }}
                                            >
                                                Preview Fixture &amp; Lineups
                                            </button>
                                        )}
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
                                            onClick={() => setSelectedMatchId(m.id)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '6px',
                                                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                                                border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: '700',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            View Match Summary
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
