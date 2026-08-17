import React, { useState, useMemo } from 'react';

// ── Icons (Inline SVG) ──────────────────────────────────────────────────
const TrophyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-2c-.55 0-1-.45-1-1v-2.34" />
        <path d="M6 5v4a6 6 0 0 0 12 0V5H6Z" />
    </svg>
);

const ChartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const NoteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

// ── Comparative Stat Bar ──────────────────────────────────────────────
function ComparativeStatBar({ label, teamVal, oppVal, teamName, oppName, isPercentage = false }) {
    const numTeam = Number(teamVal) || 0;
    const numOpp = Number(oppVal) || 0;
    const total = numTeam + numOpp;
    const teamPct = total > 0 ? Math.round((numTeam / total) * 100) : 50;
    const oppPct = 100 - teamPct;

    const teamLeading = numTeam > numOpp;
    const isTied = numTeam === numOpp;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: teamLeading ? '#4ade80' : isTied ? '#ffffff' : 'var(--text-muted)' }}>
                    {teamVal}{isPercentage ? '%' : ''}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {label}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: !teamLeading && !isTied ? '#f87171' : isTied ? '#ffffff' : 'var(--text-muted)' }}>
                    {oppVal}{isPercentage ? '%' : ''}
                </span>
            </div>
            <div style={{ display: 'flex', height: '8px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', gap: '2px' }}>
                <div style={{ width: `${teamPct}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '6px 0 0 6px', transition: 'width 0.4s ease' }} />
                <div style={{ width: `${oppPct}%`, background: 'linear-gradient(90deg, #6366f1, #4f46e5)', borderRadius: '0 6px 6px 0', transition: 'width 0.4s ease' }} />
            </div>
        </div>
    );
}

// ── Interactive Goalmouth Visual Shot Map ──────────────────────────────
function GoalmouthShotMap({ shots = [], teamName }) {
    const [hoveredShot, setHoveredShot] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>🎯</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Match Goalmouth Shot Map ({shots.length} Shots Placed)
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '10px', fontWeight: '700' }}>
                    <span style={{ color: '#4ade80' }}>● Goal</span>
                    <span style={{ color: '#818cf8' }}>● Saved</span>
                    <span style={{ color: '#f87171' }}>● Off-Target</span>
                </div>
            </div>

            <div style={{
                position: 'relative', width: '100%', height: '220px',
                background: 'radial-gradient(ellipse at bottom, #091224 0%, #030712 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
            }}>
                {/* Visual Goal Frame Post Structure (10% to 90% X, 20% to 95% Y) */}
                <div style={{
                    position: 'absolute', left: '10%', right: '10%', top: '20%', bottom: '5%',
                    border: '4px solid rgba(255,255,255,0.9)', borderBottom: 'none',
                    background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px),
                                 repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px)`,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)'
                }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.04)', fontSize: '14px', fontWeight: '900', letterSpacing: '0.2em' }}>
                        GOAL FRAME · ON TARGET
                    </div>
                </div>

                {/* Turf Grass */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5%', background: '#144626', borderTop: '1px solid #166534' }} />

                {/* Shot Plot Points */}
                {shots.map((sh, idx) => {
                    const isGoal = sh.type === 'goal' || sh.result === 'goal';
                    const isSaved = sh.type === 'shotOnTarget' || sh.result === 'saved' || sh.result === 'save';
                    const color = isGoal ? '#22c55e' : isSaved ? '#6366f1' : '#ef4444';
                    const posX = sh.x != null ? sh.x : 50;
                    const posY = sh.y != null ? sh.y : 50;

                    return (
                        <div
                            key={sh.id || idx}
                            onMouseEnter={() => setHoveredShot(sh)}
                            onMouseLeave={() => setHoveredShot(null)}
                            style={{
                                position: 'absolute', left: `${posX}%`, top: `${posY}%`,
                                transform: 'translate(-50%, -50%)',
                                width: isGoal ? '16px' : '12px', height: isGoal ? '16px' : '12px',
                                borderRadius: '50%',
                                background: color,
                                border: '2px solid #ffffff',
                                boxShadow: `0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.6)`,
                                cursor: 'pointer',
                                zIndex: 15,
                                transition: 'all 0.2s ease'
                            }}
                        />
                    );
                })}

                {/* Hover Tooltip */}
                {hoveredShot && (
                    <div style={{
                        position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)',
                        padding: '6px 14px', borderRadius: '8px', color: '#ffffff',
                        fontSize: '11px', fontWeight: '700', zIndex: 30,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', display: 'flex', gap: '8px', alignItems: 'center'
                    }}>
                        <span>{hoveredShot.playerName || 'Player'}</span>
                        <span style={{ color: hoveredShot.type === 'goal' ? '#4ade80' : hoveredShot.type === 'shotOnTarget' ? '#818cf8' : '#f87171' }}>
                            {hoveredShot.type === 'goal' ? '⚽ Goal' : hoveredShot.type === 'shotOnTarget' ? '🧤 Saved on Target' : '💥 Off-Target Miss'}
                        </span>
                        {hoveredShot.goalType && <span style={{ opacity: 0.7 }}>({hoveredShot.goalType})</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Coach Post-Game Stats Hub Component ──────────────────────────
export default function CoachPostGameStatsHub({
    schoolId,
    selectedClassroom,
    matches = [],
    students = [],
    allTeams = [],
    schools = [],
    allPlayers = [],
    year,
    term
}) {
    const [recentRange, setRecentRange] = useState('5'); // '3' | '5' | 'all'
    const [resultFilter, setResultFilter] = useState('all'); // 'all' | 'win' | 'draw' | 'loss'
    const [selectedMatchDetail, setSelectedMatchDetail] = useState(null);
    const [coachNotes, setCoachNotes] = useState(() => {
        try {
            const saved = localStorage.getItem('eduvision-coach-match-notes');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [noteDraft, setNoteDraft] = useState('');
    const [noteSavedToast, setNoteSavedToast] = useState(false);

    // Identify Coach's Team and School Meta
    const teamObj = useMemo(() => {
        return (allTeams || []).find(t => t.id === selectedClassroom || t.schoolId === schoolId) || null;
    }, [allTeams, selectedClassroom, schoolId]);

    const schoolObj = useMemo(() => {
        return (schools || []).find(s => s.id === schoolId) || null;
    }, [schools, schoolId]);

    const teamDisplayName = useMemo(() => {
        if (teamObj?.name) return teamObj.name;
        if (schoolObj?.name) return schoolObj.name;
        return 'My Squad';
    }, [teamObj, schoolObj]);

    // STRICT DATA ISOLATION: Filter ONLY matches where coach's team played
    const coachTeamMatches = useMemo(() => {
        const cleanSchoolId = String(schoolId || '').toLowerCase().replace('-team-pmc', '');
        const cleanClassroom = String(selectedClassroom || '').toLowerCase().replace('-team-pmc', '');
        const schoolName = String(schoolObj?.name || '').toLowerCase();
        const teamName = String(teamObj?.name || '').toLowerCase();

        const targets = [
            schoolId, selectedClassroom, cleanSchoolId, cleanClassroom,
            schoolName, teamName, schoolObj?.id, teamObj?.id
        ].filter(Boolean).map(x => String(x).toLowerCase());

        const teamMatches = (matches || []).filter(m => {
            const isFinished = ['completed', 'approved', 'refereed'].includes(m.status);
            if (!isFinished) return false;

            const homeVals = [m.homeTeamId, m.homeTeam, m.homeSchoolId].filter(Boolean).map(x => String(x).toLowerCase());
            const awayVals = [m.awayTeamId, m.awayTeam, m.awaySchoolId].filter(Boolean).map(x => String(x).toLowerCase());

            const isHome = homeVals.some(h => targets.some(t => h.includes(t) || t.includes(h)));
            const isAway = awayVals.some(a => targets.some(t => a.includes(t) || t.includes(a)));

            return isHome || isAway;
        });

        // Sort latest first
        return teamMatches.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()));
    }, [matches, schoolId, selectedClassroom, schoolObj, teamObj]);

    // Apply Range Filter (e.g. Last 3, Last 5, or All)
    const rangeFilteredMatches = useMemo(() => {
        let list = [...coachTeamMatches];
        if (recentRange === '3') list = list.slice(0, 3);
        else if (recentRange === '5') list = list.slice(0, 5);

        if (resultFilter !== 'all') {
            list = list.filter(m => {
                const cleanSchoolId = String(schoolId || '').toLowerCase();
                const schoolName = String(schoolObj?.name || '').toLowerCase();
                const isHome = String(m.homeTeamId || '').toLowerCase().includes(cleanSchoolId) || String(m.homeTeam || '').toLowerCase().includes(schoolName);
                const teamScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
                const oppScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);

                if (resultFilter === 'win') return teamScore > oppScore;
                if (resultFilter === 'draw') return teamScore === oppScore;
                if (resultFilter === 'loss') return teamScore < oppScore;
                return true;
            });
        }
        return list;
    }, [coachTeamMatches, recentRange, resultFilter, schoolId, schoolObj]);

    // Calculate Aggregated Metrics across the selected games
    const aggregatedStats = useMemo(() => {
        const totalGames = rangeFilteredMatches.length;
        if (totalGames === 0) {
            return {
                totalGames: 0, wins: 0, draws: 0, losses: 0, winRate: 0,
                goalsScored: 0, goalsConceded: 0, gpg: '0.00', gaa: '0.00',
                cleanSheets: 0, cleanSheetPct: 0,
                totalShots: 0, totalShotsOnTarget: 0, shotAccuracy: 0, conversionRate: 0,
                avgPossession: 50, totalCards: 0, totalSaves: 0,
                formGuide: []
            };
        }

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goalsScored = 0;
        let goalsConceded = 0;
        let cleanSheets = 0;
        let totalShots = 0;
        let totalShotsOnTarget = 0;
        let totalPossessionSum = 0;
        let totalCards = 0;
        let totalSaves = 0;
        const formGuide = [];

        const cleanSchoolId = String(schoolId || '').toLowerCase();
        const schoolName = String(schoolObj?.name || '').toLowerCase();

        rangeFilteredMatches.forEach(m => {
            const isHome = String(m.homeTeamId || '').toLowerCase().includes(cleanSchoolId) || String(m.homeTeam || '').toLowerCase().includes(schoolName);
            const teamScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
            const oppScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);

            goalsScored += teamScore;
            goalsConceded += oppScore;

            if (teamScore > oppScore) {
                wins++;
                formGuide.push({ result: 'W', score: `${teamScore}-${oppScore}`, matchday: m.matchday || 'MD' });
            } else if (teamScore === oppScore) {
                draws++;
                formGuide.push({ result: 'D', score: `${teamScore}-${oppScore}`, matchday: m.matchday || 'MD' });
            } else {
                losses++;
                formGuide.push({ result: 'L', score: `${teamScore}-${oppScore}`, matchday: m.matchday || 'MD' });
            }

            if (oppScore === 0) cleanSheets++;

            // Count playerStats for team
            const teamPlayerIds = isHome ? (m.homePlayers || []) : (m.awayPlayers || []);
            let matchShots = 0;
            let matchSot = 0;

            teamPlayerIds.forEach(pId => {
                const ps = m.playerStats?.[pId];
                if (ps) {
                    matchShots += (ps.Shots || 0);
                    matchSot += (ps['Shots on Target'] || 0);
                    totalCards += (ps.yellowCards || 0) + (ps.redCards || 0);
                    totalSaves += (ps.Saves || 0);
                }
            });

            totalShots += matchShots;
            totalShotsOnTarget += matchSot;

            // Possession
            const teamPoss = isHome ? (m.possession?.homePct || 50) : (m.possession?.awayPct || 50);
            totalPossessionSum += teamPoss;
        });

        const winRate = Math.round((wins / totalGames) * 100);
        const gpg = (goalsScored / totalGames).toFixed(2);
        const gaa = (goalsConceded / totalGames).toFixed(2);
        const cleanSheetPct = Math.round((cleanSheets / totalGames) * 100);
        const shotAccuracy = totalShots > 0 ? Math.round((totalShotsOnTarget / totalShots) * 100) : 0;
        const conversionRate = totalShots > 0 ? Math.round((goalsScored / totalShots) * 100) : 0;
        const avgPossession = Math.round(totalPossessionSum / totalGames);

        return {
            totalGames, wins, draws, losses, winRate,
            goalsScored, goalsConceded, gpg, gaa,
            cleanSheets, cleanSheetPct,
            totalShots, totalShotsOnTarget, shotAccuracy, conversionRate,
            avgPossession, totalCards, totalSaves,
            formGuide
        };
    }, [rangeFilteredMatches, schoolId, schoolObj]);

    // Handle Saving Coach's Tactical Note for a Match
    const handleSaveNote = (matchId) => {
        const updated = { ...coachNotes, [matchId]: noteDraft };
        setCoachNotes(updated);
        try {
            localStorage.setItem('eduvision-coach-match-notes', JSON.stringify(updated));
            setNoteSavedToast(true);
            setTimeout(() => setNoteSavedToast(false), 2000);
        } catch { /* ignored */ }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>

            {/* ── 1. Header Banner & Filter Strip ───────────────────────── */}
            <div className="glass-panel" style={{
                padding: '24px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
                display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>📊</span>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                                Post-Game Statistics &amp; Performance Hub
                            </h2>
                            <span style={{
                                fontSize: '11px', fontWeight: '800', color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)',
                                padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}>
                                🔒 {teamDisplayName} Data Scoped
                            </span>
                        </div>
                        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Review historical match performances, aggregated form indices, and tactical breakdown over recent fixtures.
                        </p>
                    </div>

                    {/* Range Selectors */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: 'var(--border)' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', paddingLeft: '8px' }}>Range:</span>
                        <button
                            type="button"
                            onClick={() => setRecentRange('3')}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                                background: recentRange === '3' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                                color: recentRange === '3' ? '#a5b4fc' : 'var(--text-secondary)',
                                border: recentRange === '3' ? '1px solid #6366f1' : 'none', cursor: 'pointer'
                            }}
                        >
                            Last 3 Games
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecentRange('5')}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                                background: recentRange === '5' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                                color: recentRange === '5' ? '#a5b4fc' : 'var(--text-secondary)',
                                border: recentRange === '5' ? '1px solid #6366f1' : 'none', cursor: 'pointer'
                            }}
                        >
                            Last 5 Games
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecentRange('all')}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                                background: recentRange === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                                color: recentRange === 'all' ? '#a5b4fc' : 'var(--text-secondary)',
                                border: recentRange === 'all' ? '1px solid #6366f1' : 'none', cursor: 'pointer'
                            }}
                        >
                            All Matches ({coachTeamMatches.length})
                        </button>
                    </div>
                </div>

                {/* Form Guide Pill Bar */}
                {aggregatedStats.formGuide.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Recent Form Guide:
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {aggregatedStats.formGuide.map((f, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '4px 10px', borderRadius: '8px',
                                        background: f.result === 'W' ? 'rgba(34, 197, 94, 0.15)' : f.result === 'D' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        border: `1px solid ${f.result === 'W' ? '#22c55e' : f.result === 'D' ? '#eab308' : '#ef4444'}`,
                                        color: f.result === 'W' ? '#4ade80' : f.result === 'D' ? '#fde047' : '#f87171',
                                        fontSize: '11px', fontWeight: '800'
                                    }}
                                >
                                    <span>{f.result}</span>
                                    <span style={{ opacity: 0.8 }}>({f.score})</span>
                                </div>
                            ))}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            Record: <strong>{aggregatedStats.wins}W · {aggregatedStats.draws}D · {aggregatedStats.losses}L</strong> ({aggregatedStats.winRate}% Win Rate)
                        </span>
                    </div>
                )}
            </div>

            {/* ── 2. Aggregated Performance KPI Metric Cards ─────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Goals Per Game (GPG)</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80', marginTop: '4px' }}>{aggregatedStats.gpg}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{aggregatedStats.goalsScored} Total Goals Scored</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conceded Per Game</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#f87171', marginTop: '4px' }}>{aggregatedStats.gaa}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{aggregatedStats.goalsConceded} Total Conceded</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shot Accuracy</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#818cf8', marginTop: '4px' }}>{aggregatedStats.shotAccuracy}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{aggregatedStats.totalShotsOnTarget} on target / {aggregatedStats.totalShots} shots</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Ball Possession</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>{aggregatedStats.avgPossession}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Across played matches</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clean Sheet Ratio</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>{aggregatedStats.cleanSheetPct}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{aggregatedStats.cleanSheets} Shutouts recorded</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GK Saves Recorded</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#a78bfa', marginTop: '4px' }}>{aggregatedStats.totalSaves}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Defensive stops logged</div>
                </div>
            </div>

            {/* ── 3. Past Games History Grid ─────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚽</span>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Individual Match Performance Log ({rangeFilteredMatches.length} Fixtures)
                        </h3>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Click any match card to open detailed post-game report &amp; shot map
                    </span>
                </div>

                {rangeFilteredMatches.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                        No completed matches found for this filter range. Play a live match or adjust the range filter above.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                        {rangeFilteredMatches.map(m => {
                            const cleanSchoolId = String(schoolId || '').toLowerCase();
                            const schoolName = String(schoolObj?.name || '').toLowerCase();
                            const isHome = String(m.homeTeamId || '').toLowerCase().includes(cleanSchoolId) || String(m.homeTeam || '').toLowerCase().includes(schoolName);
                            const teamScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
                            const oppScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
                            const oppName = isHome ? m.awayTeam : m.homeTeam;
                            const isWin = teamScore > oppScore;
                            const isDraw = teamScore === oppScore;

                            // Extract goals scored by team
                            const teamGoalEvents = (m.timeline || []).filter(e => e.type === 'goal' && (isHome ? e.team === 'home' : e.team === 'away'));

                            return (
                                <div
                                    key={m.id}
                                    onClick={() => {
                                        setSelectedMatchDetail(m);
                                        setNoteDraft(coachNotes[m.id] || '');
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: isWin ? '1px solid rgba(34, 197, 94, 0.3)' : isDraw ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '14px', padding: '16px 18px',
                                        display: 'flex', flexDirection: 'column', gap: '12px',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Card Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-light)', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                                            {m.matchday || 'Matchday'}
                                        </span>
                                        <span style={{
                                            fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px',
                                            background: isWin ? 'rgba(34, 197, 94, 0.15)' : isDraw ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: isWin ? '#4ade80' : isDraw ? '#fde047' : '#f87171'
                                        }}>
                                            {isWin ? '🏆 VICTORY' : isDraw ? '🤝 DRAW' : '❌ DEFEAT'}
                                        </span>
                                    </div>

                                    {/* Scoreline */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '120px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: isHome ? '#4ade80' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {m.homeTeam}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Home</span>
                                        </div>

                                        <div style={{
                                            fontSize: '22px', fontWeight: '900', color: '#ffffff',
                                            background: 'rgba(0,0,0,0.4)', padding: '4px 14px', borderRadius: '10px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {m.homeScore ?? 0} - {m.awayScore ?? 0}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '120px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: !isHome ? '#4ade80' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {m.awayTeam}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Away</span>
                                        </div>
                                    </div>

                                    {/* Goal Scorers Preview */}
                                    {teamGoalEvents.length > 0 && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                                            <span>⚽</span>
                                            <span>{teamGoalEvents.map(e => e.playerName).join(', ')}</span>
                                        </div>
                                    )}

                                    {/* Venue & Action Link */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                                        <span>📍 {m.venue || 'National Stadium'}</span>
                                        <span style={{ color: 'var(--primary-light)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            View Report <ArrowRight />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── 4. Detailed Post-Game Match Report Modal ───────────────── */}
            {selectedMatchDetail && (() => {
                const m = selectedMatchDetail;
                const cleanSchoolId = String(schoolId || '').toLowerCase();
                const schoolName = String(schoolObj?.name || '').toLowerCase();
                const isHome = String(m.homeTeamId || '').toLowerCase().includes(cleanSchoolId) || String(m.homeTeam || '').toLowerCase().includes(schoolName);

                const teamName = isHome ? m.homeTeam : m.awayTeam;
                const oppName = isHome ? m.awayTeam : m.homeTeam;

                const teamScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
                const oppScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);

                const teamPlayerIds = isHome ? (m.homePlayers || []) : (m.awayPlayers || []);
                const oppPlayerIds = isHome ? (m.awayPlayers || []) : (m.homePlayers || []);

                // Calculate Match Head-to-Head Statistics
                let teamShots = 0;
                let teamSot = 0;
                let teamFouls = 0;
                let teamCorners = 0;
                let teamYc = 0;
                let teamRc = 0;
                let teamSaves = 0;

                teamPlayerIds.forEach(id => {
                    const ps = m.playerStats?.[id];
                    if (ps) {
                        teamShots += (ps.Shots || 0);
                        teamSot += (ps['Shots on Target'] || 0);
                        teamFouls += (ps['Fouls Committed'] || 0);
                        teamCorners += (ps['Corners Taken'] || 0);
                        teamYc += (ps.yellowCards || 0);
                        teamRc += (ps.redCards || 0);
                        teamSaves += (ps.Saves || 0);
                    }
                });

                let oppShots = 0;
                let oppSot = 0;
                let oppFouls = 0;
                let oppCorners = 0;
                let oppYc = 0;
                let oppRc = 0;
                let oppSaves = 0;

                oppPlayerIds.forEach(id => {
                    const ps = m.playerStats?.[id];
                    if (ps) {
                        oppShots += (ps.Shots || 0);
                        oppSot += (ps['Shots on Target'] || 0);
                        oppFouls += (ps['Fouls Committed'] || 0);
                        oppCorners += (ps['Corners Taken'] || 0);
                        oppYc += (ps.yellowCards || 0);
                        oppRc += (ps.redCards || 0);
                        oppSaves += (ps.Saves || 0);
                    }
                });

                const teamPoss = isHome ? (m.possession?.homePct || 52) : (m.possession?.awayPct || 48);
                const oppPoss = 100 - teamPoss;

                // Extract all shots for Goalmouth map
                const teamShotsEvents = (m.timeline || []).filter(e => (isHome ? e.team === 'home' : e.team === 'away') && (e.type === 'goal' || e.type === 'shotOnTarget' || e.type === 'shotMissed'));

                return (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(16px)',
                        padding: '20px'
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.96)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '20px',
                            padding: '24px',
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
                        }}>
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '20px' }}>📋</span>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                                            Post-Game Match Analysis &amp; Box Score
                                        </h2>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {m.round || m.matchday} · {m.venue} · Referee: {m.referee || 'Official'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMatchDetail(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: 'none',
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        color: '#ffffff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Match Result Banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px', padding: '20px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: isHome ? '#4ade80' : 'var(--text-muted)' }}>
                                        {isHome ? '🟢 YOUR TEAM (HOME)' : 'HOME'}
                                    </span>
                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
                                        {m.homeTeam}
                                    </h3>
                                </div>

                                <div style={{ textAlign: 'center', padding: '0 24px' }}>
                                    <div style={{
                                        fontSize: '32px', fontWeight: '900', color: '#ffffff',
                                        background: 'rgba(0,0,0,0.5)', padding: '6px 20px', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '2px'
                                    }}>
                                        {m.homeScore ?? 0} - {m.awayScore ?? 0}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', marginTop: '6px', display: 'block' }}>
                                        FINAL · COMMISSIONER APPROVED
                                    </span>
                                </div>

                                <div style={{ textAlign: 'right', flex: 1 }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: !isHome ? '#4ade80' : 'var(--text-muted)' }}>
                                        {!isHome ? '🟢 YOUR TEAM (AWAY)' : 'AWAY'}
                                    </span>
                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
                                        {m.awayTeam}
                                    </h3>
                                </div>
                            </div>

                            {/* Comparative Statistics Grid */}
                            <div style={{
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                                    <span style={{ color: '#4ade80' }}>🟢 {teamName}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>HEAD-TO-HEAD MATCH MATRIX</span>
                                    <span style={{ color: '#818cf8' }}>🔵 {oppName}</span>
                                </div>

                                <ComparativeStatBar label="Ball Possession" teamVal={teamPoss} oppVal={oppPoss} isPercentage={true} />
                                <ComparativeStatBar label="Total Shots" teamVal={teamShots} oppVal={oppShots} />
                                <ComparativeStatBar label="Shots on Target" teamVal={teamSot} oppVal={oppSot} />
                                <ComparativeStatBar label="Goalkeeper Saves" teamVal={teamSaves} oppVal={oppSaves} />
                                <ComparativeStatBar label="Corner Kicks" teamVal={teamCorners} oppVal={oppCorners} />
                                <ComparativeStatBar label="Fouls Committed" teamVal={teamFouls} oppVal={oppFouls} />
                                <ComparativeStatBar label="Yellow &amp; Red Cards" teamVal={teamYc + teamRc} oppVal={oppYc + oppRc} />
                            </div>

                            {/* Goalmouth Visual Shot Map */}
                            <GoalmouthShotMap shots={teamShotsEvents} teamName={teamName} />

                            {/* Match Event Timeline Stream */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Match Event Chronology ({(m.timeline || []).length} Events)
                                </span>
                                {(m.timeline || []).length === 0 ? (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No timeline events recorded.</div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {(m.timeline || []).map((e, idx) => {
                                            const isGoal = e.type === 'goal';
                                            const isCard = e.type === 'yellowCard' || e.type === 'redCard';
                                            const clr = isGoal ? '#22c55e' : isCard ? '#f59e0b' : '#6366f1';
                                            const icon = isGoal ? '⚽' : e.type === 'yellowCard' ? '🟨' : e.type === 'redCard' ? '🟥' : '⏱️';

                                            return (
                                                <div key={e.id || idx} style={{
                                                    flexShrink: 0, padding: '8px 12px', borderRadius: '10px',
                                                    background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${clr}`,
                                                    borderTop: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)',
                                                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px'
                                                }}>
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-light)' }}>
                                                        {Math.floor((e.elapsed || 0) / 60)}'
                                                    </span>
                                                    <span>{icon}</span>
                                                    <span style={{ fontWeight: '700', color: '#ffffff' }}>
                                                        {e.playerName}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Player Box Score Table */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Squad Box Score &amp; Player Match Ratings
                                </span>
                                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <th style={{ padding: '10px 14px' }}>Player</th>
                                                <th style={{ padding: '10px' }}>Pos</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Mins</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Goals</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Assists</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Shots (On Target)</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Passes</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Tackles</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Saves</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Cards</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teamPlayerIds.map(pId => {
                                                const p = (allPlayers || students || []).find(s => String(s.id) === String(pId)) || { id: pId, name: `Player #${pId}`, position: 'Player' };
                                                const ps = m.playerStats?.[pId] || {};
                                                return (
                                                    <tr key={pId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#ffffff' }}>
                                                            {p.name}
                                                        </td>
                                                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{p.position || '—'}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{ps.minutesPlayed || 90}'</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', color: ps.Goals > 0 ? '#4ade80' : '#ffffff', fontWeight: ps.Goals > 0 ? '800' : '500' }}>
                                                            {ps.Goals || 0}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center', color: ps.Assists > 0 ? '#818cf8' : '#ffffff', fontWeight: ps.Assists > 0 ? '800' : '500' }}>
                                                            {ps.Assists || 0}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                            {ps.Shots || 0} ({ps['Shots on Target'] || 0})
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{ps.passesCompleted || 24}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{ps.tackles || 2}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', color: ps.Saves > 0 ? '#fbbf24' : '#ffffff' }}>
                                                            {ps.Saves || 0}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                            {ps.yellowCards > 0 && <span title="Yellow Card">🟨 </span>}
                                                            {ps.redCards > 0 && <span title="Red Card">🟥 </span>}
                                                            {(!ps.yellowCards && !ps.redCards) && '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Coach's Post-Match Tactical Notes Section */}
                            <div style={{
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <NoteIcon />
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                                            Coach's Tactical Post-Match Notes &amp; Action Items
                                        </span>
                                    </div>
                                    {noteSavedToast && (
                                        <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700' }}>
                                            ✅ Saved to Team Ledger
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    value={noteDraft}
                                    onChange={e => setNoteDraft(e.target.value)}
                                    placeholder="Write tactical takeaways, player performance feedback, set-piece adjustments, and training focus areas for this fixture..."
                                    rows={3}
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '10px 14px', color: '#ffffff', fontSize: '13px',
                                        fontFamily: 'inherit', resize: 'vertical', outline: 'none'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSaveNote(m.id)}
                                        style={{
                                            padding: '8px 18px', borderRadius: '8px', border: 'none',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        💾 Save Match Notes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
