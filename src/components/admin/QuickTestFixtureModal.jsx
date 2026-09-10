import { useState, useMemo } from 'react';
import { getOfficialsByRole } from '../../data/matchOfficialAccounts';

export default function QuickTestFixtureModal({
    isOpen,
    onClose,
    schools = [],
    teams = [],
    allStudents = [],
    onAddMatch
}) {
    if (!isOpen) return null;

    const [division, setDivision] = useState('U14');
    const [matchday, setMatchday] = useState('Matchday 1');
    const [status, setStatus] = useState('scheduled'); // 'scheduled' | 'live' | 'completed'
    const [venue, setVenue] = useState('Harrison College Field');
    const [autoPopulateLineups, setAutoPopulateLineups] = useState(true);

    // Available officials
    const referees = useMemo(() => getOfficialsByRole('referee'), []);
    const commissioners = useMemo(() => getOfficialsByRole('commissioner'), []);

    const [referee, setReferee] = useState(referees[0]?.name || 'Michael Beckles');
    const [commissioner, setCommissioner] = useState(commissioners[0]?.name || 'Karen Thorne');

    // Filter teams matching the selected ageGroup
    const divisionTeams = useMemo(() => {
        return teams.filter(t => t.ageGroup === division || (typeof t.name === 'string' && t.name.includes(division)));
    }, [teams, division]);

    const [homeTeamId, setHomeTeamId] = useState(divisionTeams[0]?.id || '');
    const [awayTeamId, setAwayTeamId] = useState(divisionTeams[1]?.id || divisionTeams[0]?.id || '');

    // Synchronize teams when division changes
    const handleDivisionChange = (newDiv) => {
        setDivision(newDiv);
        const filtered = teams.filter(t => t.ageGroup === newDiv || (typeof t.name === 'string' && t.name.includes(newDiv)));
        if (filtered.length >= 2) {
            setHomeTeamId(filtered[0].id);
            setAwayTeamId(filtered[1].id);
        } else if (filtered.length === 1) {
            setHomeTeamId(filtered[0].id);
            setAwayTeamId(filtered[0].id);
        }
    };

    const getSchoolName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return teamId;
        const school = schools.find(s => s.id === team.schoolId);
        return school ? `${school.name} (${team.ageGroup || division})` : (team.name || teamId);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
            alert('Please select two different teams for the test match.');
            return;
        }

        const matchId = `sandbox-match-${Date.now()}`;
        const now = Date.now();

        // Extract home & away school IDs
        const homeTeamObj = teams.find(t => t.id === homeTeamId);
        const awayTeamObj = teams.find(t => t.id === awayTeamId);
        const homeSchoolId = homeTeamObj?.schoolId || '';
        const awaySchoolId = awayTeamObj?.schoolId || '';

        // Auto populate lineups if checked
        let homeSquadSelection = null;
        let awaySquadSelection = null;

        if (autoPopulateLineups) {
            const homePlayers = allStudents.filter(s => s.schoolId === homeSchoolId);
            const awayPlayers = allStudents.filter(s => s.schoolId === awaySchoolId);

            const homePids = homePlayers.map(p => String(p.id));
            const awayPids = awayPlayers.map(p => String(p.id));

            homeSquadSelection = {
                startingXI: homePids.slice(0, 11),
                substitutes: homePids.slice(11, 18),
                formation: '4-3-3',
                submittedAt: now
            };

            awaySquadSelection = {
                startingXI: awayPids.slice(0, 11),
                substitutes: awayPids.slice(11, 18),
                formation: '4-3-3',
                submittedAt: now
            };
        }

        const newMatch = {
            id: matchId,
            homeTeamId,
            awayTeamId,
            homeSchoolId,
            awaySchoolId,
            ageGroup: division,
            matchday,
            venue,
            referee,
            commissioner,
            status,
            homeScore: 0,
            awayScore: 0,
            homeSquadSelection,
            awaySquadSelection,
            playerStats: {},
            timeline: [],
            tombstoneEventIds: [],
            date: new Date().toISOString(),
            isSandboxMatch: true,
            createdAt: now,
            updatedAt: now,
            version: 1
        };

        if (status === 'live') {
            newMatch.currentHalf = '1H';
            newMatch.matchTime = '00:00';
            newMatch.liveState = {
                period: '1H',
                isRunning: true,
                elapsedOffset: 0,
                possession: {
                    homeSecs: 0,
                    awaySecs: 0,
                    inContestSecs: 0,
                    activeSide: 'contest'
                },
                playerStats: {},
                timeline: [],
                tombstoneEventIds: [],
                version: 1,
                updatedAt: now
            };
        } else if (status === 'completed') {
            newMatch.completedAt = now;
        }

        if (onAddMatch) {
            onAddMatch(newMatch);
        }

        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '540px', background: '#090d16', border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(56, 189, 248, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🧪</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>
                                Create Sandbox Test Match
                            </h3>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Schools League testing fixture — 100% isolated from live PMC production
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            fontSize: '20px', cursor: 'pointer', padding: '4px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Division Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Age Group / Division
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['U14', 'U16', 'U19'].map(div => (
                                <button
                                    key={div}
                                    type="button"
                                    onClick={() => handleDivisionChange(div)}
                                    style={{
                                        flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                                        background: division === div ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                                        color: division === div ? '#04101e' : 'var(--text-secondary)',
                                        border: division === div ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                        cursor: 'pointer', transition: 'all 0.15s'
                                    }}
                                >
                                    {div} Division
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Team Selections */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase' }}>
                                Home Team
                            </label>
                            <select
                                value={homeTeamId}
                                onChange={e => setHomeTeamId(e.target.value)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                                }}
                            >
                                {divisionTeams.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {getSchoolName(t.id)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#f472b6', textTransform: 'uppercase' }}>
                                Away Team
                            </label>
                            <select
                                value={awayTeamId}
                                onChange={e => setAwayTeamId(e.target.value)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                                }}
                            >
                                {divisionTeams.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {getSchoolName(t.id)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status & Matchday */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Initial Status
                            </label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                                }}
                            >
                                <option value="scheduled">Scheduled (Pre-Match Testing)</option>
                                <option value="live">Live in Progress (Live Operator Testing)</option>
                                <option value="completed">Completed (Referee Report Testing)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Matchday Term
                            </label>
                            <select
                                value={matchday}
                                onChange={e => setMatchday(e.target.value)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                                }}
                            >
                                <option value="Matchday 1">Matchday 1</option>
                                <option value="Matchday 2">Matchday 2</option>
                                <option value="Matchday 3">Matchday 3</option>
                                <option value="Semi-Final">Semi-Final</option>
                                <option value="Final">Final</option>
                            </select>
                        </div>
                    </div>

                    {/* Venue & Referee */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Venue
                            </label>
                            <input
                                type="text"
                                value={venue}
                                onChange={e => setVenue(e.target.value)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Assigned Referee
                            </label>
                            <select
                                value={referee}
                                onChange={e => setReferee(e.target.value)}
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                                }}
                            >
                                {referees.map(r => (
                                    <option key={r.id || r.name} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Convenience Checkbox */}
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <input
                            type="checkbox"
                            checked={autoPopulateLineups}
                            onChange={e => setAutoPopulateLineups(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>
                            Pre-populate starting lineups with school players (ready to play instantly)
                        </span>
                    </label>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 16px', borderRadius: '8px', background: 'transparent',
                                color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.15)',
                                fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px', borderRadius: '8px', background: '#38bdf8',
                                color: '#04101e', border: 'none', fontSize: '13px', fontWeight: '800',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                            }}
                        >
                            Create Sandbox Match
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
