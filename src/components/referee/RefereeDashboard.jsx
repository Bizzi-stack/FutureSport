import { useState, useMemo, useEffect } from 'react';
import LiveMatch from '../match/LiveMatch';
import {
    getRefereeContactSettings,
    saveRefereeContactSettings,
    sendTestRefereeNotification,
    requestRefereeNotificationPermission,
    playRefereeWhistleSound
} from '../../services/refereeNotificationService';

export default function RefereeDashboard({ 
    matches, 
    schools, 
    allPlayers, 
    year, 
    currentReferee = null, 
    onUpdateMatch, 
    onLogout 
}) {
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'live'
    
    // Referee Form States
    const [misconductNotes, setMisconductNotes] = useState('');
    const [pitchCondition, setPitchCondition] = useState('Excellent');
    const [weatherCondition, setWeatherCondition] = useState('Sunny');
    const [refereeSummary, setRefereeSummary] = useState('');
    const [refereeSignature, setRefereeSignature] = useState(currentReferee?.name || '');
    const [reportSaved, setReportSaved] = useState(false);

    // Referee Contact & Notification Settings State
    const [refereeSettings, setRefereeSettings] = useState(getRefereeContactSettings);
    const [emailInput, setEmailInput] = useState(() => currentReferee?.email || getRefereeContactSettings().refereeEmail || '');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [pushPermission, setPushPermission] = useState('default');
    const [testAlertToast, setTestAlertToast] = useState(null);

    useEffect(() => {
        if ('Notification' in window) {
            setPushPermission(Notification.permission);
        }
    }, []);

    const handleSaveEmail = (e) => {
        e.preventDefault();
        const updated = saveRefereeContactSettings({ refereeEmail: emailInput });
        setRefereeSettings(updated);
        setIsEditingEmail(false);
    };

    const handleEnablePush = async () => {
        const res = await requestRefereeNotificationPermission();
        setPushPermission(res.status);
    };

    const handleSendTestAlert = async () => {
        const res = await sendTestRefereeNotification(emailInput);
        setTestAlertToast(`Test alert & whistle delivered to ${res.email}!`);
        setTimeout(() => setTestAlertToast(null), 4000);
    };

    // Get scheduled matches (Referee can kick these off)
    const scheduledMatches = useMemo(() => {
        return matches.filter(m => m.status === 'upcoming' || m.status === 'scheduled');
    }, [matches]);

    // Get matches waiting for Referee Reports (completed matches)
    const pendingMatches = useMemo(() => {
        return matches.filter(m => m.status === 'completed');
    }, [matches]);

    // Get live matches
    const liveMatches = useMemo(() => {
        return matches.filter(m => m.status === 'live');
    }, [matches]);

    const getSchoolName = (schoolId, matchObj) => {
        if (!schoolId && !matchObj) return 'Unknown School';
        const sc = schools?.find(s => s.id === schoolId || s.rawId === schoolId);
        if (sc) return sc.name;
        if (matchObj) {
            if (matchObj.homeTeamId === schoolId && matchObj.homeTeam) return matchObj.homeTeam;
            if (matchObj.awayTeamId === schoolId && matchObj.awayTeam) return matchObj.awayTeam;
        }
        return schoolId || 'Unknown School';
    };

    const handleSelectMatch = (match) => {
        setSelectedMatch(match);
        
        if (match.status === 'live') {
            setViewMode('live');
        } else {
            setViewMode('list');
            setMisconductNotes(match.refereeReport?.misconductNotes || '');
            setPitchCondition(match.refereeReport?.pitchCondition || 'Excellent');
            setWeatherCondition(match.refereeReport?.weatherCondition || 'Sunny');
            setRefereeSummary(match.refereeReport?.refereeSummary || '');
            setRefereeSignature(match.refereeReport?.refereeSignature || '');
            setReportSaved(false);
        }
    };

    const handleKickOff = (match) => {
        const homeSquadReady = !!match.homeSquadSelection;
        const awaySquadReady = !!match.awaySquadSelection;

        if (!homeSquadReady || !awaySquadReady) {
            alert(`Cannot kick off — squads pending:\n${!homeSquadReady ? '• Home team squad not submitted\n' : ''}${!awaySquadReady ? '• Away team squad not submitted' : ''}`);
            return;
        }

        // Blow whistle audio on kick-off
        playRefereeWhistleSound();

        onUpdateMatch({
            ...match,
            status: 'live',
            liveState: match.liveState || {
                isRunning: true,
                startTime: Date.now(),
                elapsedOffset: 0,
                period: '1H',
                playerStats: {},
                timeline: []
            }
        });
    };

    const handleSubmitReport = (e) => {
        e.preventDefault();
        if (!refereeSignature.trim()) return;

        const updatedMatch = {
            ...selectedMatch,
            status: 'refereed',
            refereeReport: {
                misconductNotes,
                pitchCondition,
                weatherCondition,
                refereeSummary,
                refereeSignature,
                submittedAt: new Date().toISOString()
            }
        };

        onUpdateMatch(updatedMatch);
        setReportSaved(true);
        setSelectedMatch(null);
        setTimeout(() => setReportSaved(false), 3000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', height: '100%', minHeight: 0 }}>

            {/* ── Top Referee Notification & Gmail Dispatch Control Center ── */}
            <div className="glass-panel" style={{
                padding: '16px 20px', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                                Referee Direct Notification &amp; Gmail Alert Dispatcher
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.3)' }}>
                                ● Live Dispatch Active
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Target Gmail:</span>
                            {isEditingEmail ? (
                                <form onSubmit={handleSaveEmail} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input
                                        type="email"
                                        value={emailInput}
                                        onChange={e => setEmailInput(e.target.value)}
                                        placeholder="Enter your Gmail..."
                                        style={{
                                            background: 'rgba(0,0,0,0.4)', border: '1px solid #6366f1',
                                            borderRadius: '6px', padding: '3px 10px', color: '#ffffff', fontSize: '12px', outline: 'none'
                                        }}
                                        autoFocus
                                    />
                                    <button type="submit" style={{ padding: '3px 10px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                        Save
                                    </button>
                                    <button type="button" onClick={() => setIsEditingEmail(false)} style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'none', fontSize: '11px', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong style={{ color: '#a5b4fc' }}>{refereeSettings.refereeEmail}</strong>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingEmail(true)}
                                        style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                                    >
                                        Change Gmail
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {testAlertToast && (
                        <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                            {testAlertToast}
                        </span>
                    )}

                    {pushPermission !== 'granted' ? (
                        <button
                            type="button"
                            onClick={handleEnablePush}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                                background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            Enable Phone Screen Push
                        </button>
                    ) : (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', background: 'rgba(34,197,94,0.12)', padding: '4px 10px', borderRadius: '8px' }}>
                            Phone Push Enabled
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleSendTestAlert}
                        style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff', border: 'none', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        Send Test Alert
                    </button>

                    {currentReferee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>{currentReferee.name}</span>
                        </div>
                    )}

                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            style={{
                                padding: '6px 12px', borderRadius: '8px',
                                background: 'rgba(244,63,94,0.15)', color: '#f43f5e',
                                border: '1px solid rgba(244,63,94,0.3)', fontSize: '11.5px', fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Log Out
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Layout: Schedule + Match Area ───────────────────────── */}
            <div style={{ display: 'flex', gap: '20px', width: '100%', flex: 1, minHeight: 0 }}>
            
            {/* Left side: Pending matches list */}
            <div className="glass-panel" style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Referee Schedule</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kick off matches, officiate, or submit reports</span>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reportSaved && (
                        <div style={{
                            padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                        }}>
                            ✓ Match report submitted successfully!
                        </div>
                    )}

                    {/* Scheduled Matches — Kick Off Section */}
                    {scheduledMatches.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>Scheduled — Awaiting Kick-Off</div>
                            {scheduledMatches.map(m => {
                                const homeSquadReady = !!m.homeSquadSelection;
                                const awaySquadReady = !!m.awaySquadSelection;
                                const bothReady = homeSquadReady && awaySquadReady;
                                return (
                                    <div
                                        key={m.id}
                                        style={{
                                            padding: '14px', borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.01)',
                                            border: '1px solid rgba(96,165,250,0.15)',
                                            display: 'flex', flexDirection: 'column', gap: '8px',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>
                                            <span>{m.ageGroup || m.division || 'Match'}</span>
                                            <span style={{ color: '#60a5fa' }}>{m.time || m.kickoff || 'Scheduled'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            <span>{getSchoolName(m.homeTeamId, m)}</span>
                                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                VS
                                            </span>
                                            <span>{getSchoolName(m.awayTeamId, m)}</span>
                                        </div>

                                        {/* Squad Readiness Badges & Notification Indicator */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: homeSquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: homeSquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${homeSquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                                    {homeSquadReady ? 'Ready' : 'Pending'} · Home
                                                </span>
                                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: awaySquadReady ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: awaySquadReady ? 'var(--success)' : 'var(--warning)', border: `1px solid ${awaySquadReady ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                                    {awaySquadReady ? 'Ready' : 'Pending'} · Away
                                                </span>
                                            </div>
                                            {bothReady && (
                                                <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: '800', background: 'rgba(34,197,94,0.12)', padding: '2px 6px', borderRadius: '6px' }}>
                                                    Alert Sent
                                                </span>
                                            )}
                                        </div>

                                        {/* Kick Off Button */}
                                        <button
                                            onClick={() => handleKickOff(m)}
                                            disabled={!bothReady}
                                            style={{
                                                padding: '8px 14px', borderRadius: '8px',
                                                background: bothReady ? 'var(--success)' : 'rgba(255,255,255,0.03)',
                                                color: bothReady ? '#fff' : 'var(--text-muted)',
                                                border: bothReady ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                fontWeight: '800', fontSize: '12px',
                                                cursor: bothReady ? 'pointer' : 'not-allowed',
                                                opacity: bothReady ? 1 : 0.6,
                                                boxShadow: bothReady ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {bothReady ? 'Blow Whistle — Kick Off' : 'Waiting for Squad Submissions'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {liveMatches.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>Live Matches</div>
                            {liveMatches.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => handleSelectMatch(m)}
                                    style={{
                                        padding: '14px', borderRadius: '10px', background: selectedMatch?.id === m.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                                        border: selectedMatch?.id === m.id ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(16, 185, 129, 0.15)',
                                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.15s',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>
                                        <span>{m.ageGroup} Division</span>
                                        <span style={{ color: 'var(--success)' }}>LIVE</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                        <span>{getSchoolName(m.homeTeamId, m)}</span>
                                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {m.homeScore} - {m.awayScore}
                                        </span>
                                        <span>{getSchoolName(m.awayTeamId, m)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px', marginTop: liveMatches.length > 0 ? '8px' : '0' }}>Awaiting Report</div>
                    {pendingMatches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No pending referee reports.
                        </div>
                    ) : (
                        pendingMatches.map(m => (
                            <div
                                key={m.id}
                                onClick={() => handleSelectMatch(m)}
                                style={{
                                    padding: '14px', borderRadius: '10px', background: selectedMatch?.id === m.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                                    border: selectedMatch?.id === m.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.03)',
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.15s',
                                    marginBottom: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>
                                    <span>{m.ageGroup} Division</span>
                                    <span>{m.matchday}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    <span>{getSchoolName(m.homeTeamId, m)}</span>
                                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {m.homeScore} - {m.awayScore}
                                    </span>
                                    <span>{getSchoolName(m.awayTeamId, m)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right side: Report input form or Live Match */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', minHeight: 0 }}>
                {selectedMatch ? (
                    viewMode === 'live' ? (
                        <div style={{ flex: 1, position: 'relative', height: '100%', overflowY: 'auto' }}>
                            <LiveMatch
                                matchData={matches.find(m => m.id === selectedMatch.id) || selectedMatch}
                                allStudents={allPlayers}
                                year={year}
                                isRefereeMode={true}
                                onEndMatch={(res) => { 
                                    const completed = { ...res, status: 'completed' };
                                    onUpdateMatch(completed); 
                                    handleSelectMatch(completed);
                                }}
                            />
                        </div>
                    ) : (
                    <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    Official Referee Match Report
                                </h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {getSchoolName(selectedMatch.homeTeamId)} vs {getSchoolName(selectedMatch.awayTeamId)}
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.08)', padding: '4px 10px', borderRadius: '20px' }}>
                                Status: Awaiting Report
                            </span>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Match Summary info */}
                            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDir: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>Live Timeline Events Logged</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>
                                        {selectedMatch.timeline?.length || 0} match events recorded by statistician
                                    </span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>Score Verified ✓</span>
                            </div>

                            {/* Conditions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Pitch Ground Condition</label>
                                    <select
                                        value={pitchCondition}
                                        onChange={e => setPitchCondition(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="Excellent">Excellent</option>
                                        <option value="Good">Good / Playable</option>
                                        <option value="Muddy">Muddy / Heavy</option>
                                        <option value="Waterlogged">Waterlogged</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Weather Condition</label>
                                    <select
                                        value={weatherCondition}
                                        onChange={e => setWeatherCondition(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="Sunny">Sunny / Clear</option>
                                        <option value="Overcast">Overcast / Windy</option>
                                        <option value="Raining">Heavy Rain</option>
                                        <option value="Humid">Humid / Hot</option>
                                    </select>
                                </div>
                            </div>

                            {/* Misconduct */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Disciplinary & Misconduct Notes</label>
                                <textarea
                                    value={misconductNotes}
                                    onChange={e => setMisconductNotes(e.target.value)}
                                    placeholder="Log details of yellow/red cards, player cautions, or team manager warnings..."
                                    style={{
                                        height: '70px', padding: '10px 12px', borderRadius: '8px', border: 'var(--border)',
                                        background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', resize: 'none', outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Summary */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Match Summary / Overview</label>
                                <textarea
                                    value={refereeSummary}
                                    onChange={e => setRefereeSummary(e.target.value)}
                                    placeholder="Enter a brief narrative of the match, incident descriptions, or notable details..."
                                    required
                                    style={{
                                        height: '110px', padding: '10px 12px', borderRadius: '8px', border: 'var(--border)',
                                        background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', resize: 'none', outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Digital Sign off */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Referee Authorization Signature</label>
                                <input
                                    type="text"
                                    value={refereeSignature}
                                    onChange={e => setRefereeSignature(e.target.value)}
                                    placeholder="Type your official name to sign off..."
                                    required
                                    style={{
                                        padding: '10px 12px', borderRadius: '8px', border: 'var(--border)',
                                        background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit Footer */}
                        <div style={{ padding: '16px 24px', borderTop: 'var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.01)' }}>
                            <button
                                type="submit"
                                disabled={!refereeSignature.trim() || !refereeSummary.trim()}
                                style={{
                                    padding: '8px 24px', borderRadius: '20px', background: 'var(--primary)',
                                    color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    opacity: (refereeSignature.trim() && refereeSummary.trim()) ? 1 : 0.5,
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                                }}
                            >
                                Submit & Sign Report
                            </button>
                        </div>
                    </form>
                    )
                ) : (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', flexDirection: 'column', gap: '8px' }}>
                        <span>Select a match from the pending queue to write the referee report</span>
                    </div>
                )}
            </div>

            </div>
        </div>
    );
}
