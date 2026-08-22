import { useState, useMemo } from 'react';
import { SCHOOLS, TEAMS } from '../../data/mockData';

// ── Helpers ────────────────────────────────────────────────────────────
function getTeamSchool(teamId) {
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return null;
    return SCHOOLS.find(s => s.id === team.schoolId) || null;
}

function getPlayerName(allStudents, playerId) {
    const s = allStudents.find(st => String(st.id) === String(playerId));
    return s ? s.name : playerId;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatEventTime(elapsed, period) {
    const mins = Math.floor((elapsed || 0) / 60);
    const p = period || (mins < 45 ? '1H' : '2H');
    
    if (p === '1H') {
        if (mins >= 45) {
            const extra = mins - 45 + 1;
            return `45+${extra}'`;
        }
        return `${mins + 1}'`;
    } else {
        const displayMins = mins + 1;
        if (displayMins > 90) {
            const extra = displayMins - 90;
            return `90+${extra}'`;
        }
        return `${displayMins}'`;
    }
}

// ── Sub-components ─────────────────────────────────────────────────────

function BackArrowIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

// ── Comparison bar ─────────────────────────────────────────────────────
function ComparisonBar({ label, homeVal, awayVal, homeColor, awayColor }) {
    const total = homeVal + awayVal;
    const homePct = total > 0 ? (homeVal / total) * 100 : 50;
    const awayPct = total > 0 ? (awayVal / total) * 100 : 50;

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: homeVal >= awayVal ? '#a5b4fc' : 'var(--text-muted)', minWidth: '32px', transition: 'all 0.2s ease' }}>
                    {homeVal}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {label}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: awayVal >= homeVal ? '#f59e0b' : 'var(--text-muted)', minWidth: '32px', textAlign: 'right', transition: 'all 0.2s ease' }}>
                    {awayVal}
                </span>
            </div>
            <div style={{
                display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)', gap: '2px'
            }}>
                <div style={{
                    width: `${homePct}%`, background: homeColor,
                    borderRadius: '4px 0 0 4px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
                <div style={{
                    width: `${awayPct}%`, background: awayColor,
                    borderRadius: '0 4px 4px 0', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
            </div>
        </div>
    );
}

// ── Player stat row ────────────────────────────────────────────────────
function PlayerRow({ name, stats, isGoalScorer }) {
    const [hovered, setHovered] = useState(false);

    return (
        <tr
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered
                    ? 'rgba(255,255,255,0.04)'
                    : isGoalScorer
                        ? 'rgba(34, 197, 94, 0.04)'
                        : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'default'
            }}
        >
            <td style={{
                padding: '10px 14px', fontSize: '13px', fontWeight: '600',
                color: isGoalScorer ? '#22c55e' : 'var(--text-primary)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                whiteSpace: 'nowrap'
            }}>
                {isGoalScorer && <span style={{ marginRight: '4px' }}>⚽</span>}
                {name}
            </td>
            <td style={cellStyle}>{stats.Goals || 0}</td>
            <td style={cellStyle}>{stats.Assists || 0}</td>
            <td style={cellStyle}>{stats['Shots on Target'] || 0}</td>
            <td style={cellStyle}>{stats.Shots || 0}</td>
            <td style={{
                ...cellStyle,
                color: (stats.yellowCards || 0) > 0 ? '#f59e0b' : 'var(--text-muted)',
                fontWeight: (stats.yellowCards || 0) > 0 ? '700' : '500'
            }}>
                {stats.yellowCards || 0}
            </td>
            <td style={{
                ...cellStyle,
                color: (stats.redCards || 0) > 0 ? '#ef4444' : 'var(--text-muted)',
                fontWeight: (stats.redCards || 0) > 0 ? '700' : '500'
            }}>
                {stats.redCards || 0}
            </td>
        </tr>
    );
}

const cellStyle = {
    padding: '10px 12px', fontSize: '13px', fontWeight: '500',
    color: 'var(--text-secondary)', textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.04)'
};

const headerCellStyle = {
    padding: '10px 12px', fontSize: '11px', fontWeight: '700',
    color: 'var(--text-muted)', textAlign: 'center',
    textTransform: 'uppercase', letterSpacing: '0.6px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap'
};

// ── Team Stats Table ───────────────────────────────────────────────────
function TeamStatsTable({ teamId, teamPlayers, allStudents, accentColor }) {
    const school = getTeamSchool(teamId);
    const teamName = school ? school.name : teamId;
    const teamLogo = school ? school.logo : null;

    const sorted = useMemo(() => {
        return [...teamPlayers].sort((a, b) => {
            const goalDiff = (b.stats.Goals || 0) - (a.stats.Goals || 0);
            if (goalDiff !== 0) return goalDiff;
            return (b.stats.Assists || 0) - (a.stats.Assists || 0);
        });
    }, [teamPlayers]);

    return (
        <div style={{
            background: 'var(--bg-card)', border: 'var(--border)',
            borderRadius: '16px', overflow: 'hidden', flex: 1, minWidth: '380px'
        }}>
            {/* Team header */}
            <div style={{
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                borderBottom: `2px solid ${accentColor}20`,
                background: 'var(--bg-surface)'
            }}>
                {teamLogo && (
                    <img src={teamLogo} alt={teamName} style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        objectFit: 'contain', background: 'rgba(255,255,255,0.06)', padding: '4px'
                    }} />
                )}
                <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{teamName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sorted.length} player{sorted.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ ...headerCellStyle, textAlign: 'left', paddingLeft: '14px' }}>Player</th>
                            <th style={headerCellStyle}>⚽</th>
                            <th style={headerCellStyle}>🅰️</th>
                            <th style={headerCellStyle}>🎯</th>
                            <th style={headerCellStyle}>Shots</th>
                            <th style={headerCellStyle}>🟨</th>
                            <th style={headerCellStyle}>🟥</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(p => (
                            <PlayerRow
                                key={p.id}
                                name={getPlayerName(allStudents, p.id)}
                                stats={p.stats}
                                isGoalScorer={(p.stats.Goals || 0) > 0}
                            />
                        ))}
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    No player data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ██ MATCH DETAIL COMPONENT ████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════
export default function MatchDetail({ match, allStudents, onBack }) {
    const homeSchool = getTeamSchool(match.homeTeamId);
    const awaySchool = getTeamSchool(match.awayTeamId);
    const homeName = homeSchool ? homeSchool.name : match.homeTeamId;
    const awayName = awaySchool ? awaySchool.name : match.awayTeamId;
    const homeLogo = homeSchool ? homeSchool.logo : null;
    const awayLogo = awaySchool ? awaySchool.logo : null;

    // ── Split players into home / away ─────────────────────────────────
    const { homePlayers, awayPlayers, teamTotals } = useMemo(() => {
        const home = [];
        const away = [];
        const totals = {
            home: { shots: 0, shotsOnTarget: 0, passes: 0, tackles: 0 },
            away: { shots: 0, shotsOnTarget: 0, passes: 0, tackles: 0 }
        };

        if (match.playerStats) {
            Object.entries(match.playerStats).forEach(([pid, ps]) => {
                const entry = { id: pid, stats: ps };
                const side = ps.team === 'home' ? 'home' : 'away';
                if (side === 'home') home.push(entry); else away.push(entry);

                totals[side].shots += ps.Shots || 0;
                totals[side].shotsOnTarget += ps['Shots on Target'] || 0;
                totals[side].passes += ps['Pass Completed'] || 0;
                totals[side].tackles += (ps['Successful Tackles'] || 0);
            });
        }
        return { homePlayers: home, awayPlayers: away, teamTotals: totals };
    }, [match.playerStats]);

    // ── Determine match result labels ──────────────────────────────────
    const homeWin = match.homeScore > match.awayScore;
    const awayWin = match.awayScore > match.homeScore;
    const isDraw = match.homeScore === match.awayScore;

    const HOME_COLOR = '#6366f1';
    const AWAY_COLOR = '#f59e0b';

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
            {/* ── Back button ───────────────────────────────────────────── */}
            <button
                onClick={onBack}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', padding: '8px 16px', color: 'var(--text-secondary)',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease', marginBottom: '20px'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
            >
                <BackArrowIcon /> Back to Matches
            </button>

            {/* ── Match Header (Scoreboard) ─────────────────────────────── */}
            <div style={{
                background: 'var(--bg-surface)', border: 'var(--border)',
                borderRadius: '20px', padding: '32px 24px', marginBottom: '24px',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Subtle gradient glow behind score */}
                <div style={{ display: 'none' }} />

                {/* Meta tags */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'
                }}>
                    {match.ageGroup && (
                        <span style={tagStyle}>{match.ageGroup}</span>
                    )}
                    {match.matchday && (
                        <span style={tagStyle}>{match.matchday}</span>
                    )}
                    {match.date && (
                        <span style={tagStyle}>{formatDate(match.date)}</span>
                    )}
                    {match.startTime && (
                        <span style={tagStyle}>
                            {match.startTime}{match.endTime ? ` – ${match.endTime}` : ''}
                        </span>
                    )}
                </div>

                {/* Scoreboard row */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px',
                    position: 'relative', zIndex: 1
                }}>
                    {/* Home team */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
                        {homeLogo && (
                            <img src={homeLogo} alt={homeName} style={{
                                width: '64px', height: '64px', borderRadius: '14px',
                                objectFit: 'contain', background: 'rgba(255,255,255,0.06)', padding: '8px',
                                border: homeWin ? `2px solid ${HOME_COLOR}50` : '2px solid transparent'
                            }} />
                        )}
                        <div style={{
                            fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)',
                            textAlign: 'center', maxWidth: '160px'
                        }}>
                            {homeName}
                        </div>
                        {homeWin && <span style={winBadgeStyle(HOME_COLOR)}>WIN</span>}
                        {isDraw && <span style={winBadgeStyle('#64748b')}>DRAW</span>}
                    </div>

                    {/* Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '52px', fontWeight: '800', color: homeWin ? HOME_COLOR : 'var(--text-primary)',
                            lineHeight: 1, transition: 'all 0.2s ease',
                            textShadow: 'none'
                        }}>
                            {match.homeScore}
                        </span>
                        <span style={{
                            fontSize: '28px', fontWeight: '300', color: 'var(--text-muted)',
                            margin: '0 4px'
                        }}>
                            –
                        </span>
                        <span style={{
                            fontSize: '52px', fontWeight: '800', color: awayWin ? AWAY_COLOR : 'var(--text-primary)',
                            lineHeight: 1, transition: 'all 0.2s ease',
                            textShadow: 'none'
                        }}>
                            {match.awayScore}
                        </span>
                    </div>

                    {/* Away team */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
                        {awayLogo && (
                            <img src={awayLogo} alt={awayName} style={{
                                width: '64px', height: '64px', borderRadius: '14px',
                                objectFit: 'contain', background: 'rgba(255,255,255,0.06)', padding: '8px',
                                border: awayWin ? `2px solid ${AWAY_COLOR}50` : '2px solid transparent'
                            }} />
                        )}
                        <div style={{
                            fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)',
                            textAlign: 'center', maxWidth: '160px'
                        }}>
                            {awayName}
                        </div>
                        {awayWin && <span style={winBadgeStyle(AWAY_COLOR)}>WIN</span>}
                        {isDraw && <span style={winBadgeStyle('#64748b')}>DRAW</span>}
                    </div>
                </div>
            </div>

            {/* ── Team Comparison Bars ───────────────────────────────────── */}
            <div style={{
                background: 'var(--bg-card)', border: 'var(--border)',
                borderRadius: '16px', padding: '24px', marginBottom: '24px'
            }}>
                <h3 style={{
                    margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700',
                    color: 'var(--text-primary)', textAlign: 'center',
                    textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                    Team Comparison
                </h3>

                {/* Team name legend */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '20px', padding: '0 4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: HOME_COLOR }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{homeName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{awayName}</span>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: AWAY_COLOR }} />
                    </div>
                </div>

                <ComparisonBar label="Total Shots" homeVal={teamTotals.home.shots} awayVal={teamTotals.away.shots} homeColor={HOME_COLOR} awayColor={AWAY_COLOR} />
                <ComparisonBar label="Shots on Target" homeVal={teamTotals.home.shotsOnTarget} awayVal={teamTotals.away.shotsOnTarget} homeColor={HOME_COLOR} awayColor={AWAY_COLOR} />
                <ComparisonBar label="Passes Completed" homeVal={teamTotals.home.passes} awayVal={teamTotals.away.passes} homeColor={HOME_COLOR} awayColor={AWAY_COLOR} />
                <ComparisonBar label="Successful Tackles" homeVal={teamTotals.home.tackles} awayVal={teamTotals.away.tackles} homeColor={HOME_COLOR} awayColor={AWAY_COLOR} />
            </div>

            {/* ── Match Event Timeline ───────────────────────────────────── */}
            {match.timeline && match.timeline.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)', border: 'var(--border)',
                    borderRadius: '16px', padding: '24px', marginBottom: '24px'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700',
                        color: 'var(--text-primary)', textAlign: 'center',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Match Events Timeline
                    </h3>
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        maxWidth: '600px', margin: '0 auto'
                    }}>
                        {match.timeline.map((event, idx) => {
                            let icon = '⚡';
                            let clr = '#6366f1';
                            let desc = '';

                            if (event.type === 'goal') {
                                icon = '⚽';
                                clr = '#22c55e';
                                let goalLabel = 'Goal';
                                if (event.goalType === 'header') goalLabel = 'Header Goal';
                                if (event.goalType === 'penalty') goalLabel = 'Penalty Goal';
                                if (event.goalType === 'freekick') goalLabel = 'Free Kick Goal';
                                if (event.goalType === 'own-goal') {
                                    goalLabel = 'Own Goal ⚠️';
                                    clr = '#ef4444';
                                }
                                desc = `${goalLabel} scored by ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                                if (event.assistingPlayerName || event.assistingPlayerId) {
                                    const aName = event.assistingPlayerName || getPlayerName(allStudents, event.assistingPlayerId);
                                    desc += ` (Assist: ${aName})`;
                                }
                            } else if (event.type === 'shotOnTarget') {
                                icon = '🎯';
                                clr = '#14b8a6';
                                desc = `Shot Saved - ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                            } else if (event.type === 'shotBlocked') {
                                icon = '🛡️';
                                clr = '#a855f7';
                                desc = `Shot Blocked - ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                            } else if (event.type === 'shotMissed') {
                                icon = '❌';
                                clr = '#6b7280';
                                desc = `Shot Missed - ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                            } else if (event.type === 'assist') {
                                icon = '🅰️';
                                clr = '#6366f1';
                                desc = `Direct Assist by ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                            } else if (event.type === 'yellowCard') {
                                icon = '🟨';
                                clr = '#f59e0b';
                                desc = `Yellow Card - ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                            } else if (event.type === 'redCard') {
                                icon = '🟥';
                                clr = '#ef4444';
                                desc = `Red Card - ${event.playerName || getPlayerName(allStudents, event.playerId)}`;
                            }

                            const timeString = formatEventTime(event.elapsed, event.period);

                            return (
                                <div key={event.id || idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '8px 16px', background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px', borderLeft: `4px solid ${clr}`
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-light)', minWidth: '40px' }}>
                                        {timeString}
                                    </span>
                                    <span style={{ fontSize: '14px' }}>{icon}</span>
                                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{desc}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Player Stats Tables ───────────────────────────────────── */}
            <div style={{
                display: 'flex', gap: '20px', flexWrap: 'wrap'
            }}>
                <TeamStatsTable
                    teamId={match.homeTeamId}
                    teamPlayers={homePlayers}
                    allStudents={allStudents}
                    accentColor={HOME_COLOR}
                />
                <TeamStatsTable
                    teamId={match.awayTeamId}
                    teamPlayers={awayPlayers}
                    allStudents={allStudents}
                    accentColor={AWAY_COLOR}
                />
            </div>
        </div>
    );
}

// ── Shared style helpers ───────────────────────────────────────────────
const tagStyle = {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)',
    letterSpacing: '0.3px'
};

function winBadgeStyle(color) {
    return {
        display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
        background: `${color}18`, border: `1px solid ${color}30`,
        fontSize: '10px', fontWeight: '800', color: color,
        letterSpacing: '1.2px'
    };
}
