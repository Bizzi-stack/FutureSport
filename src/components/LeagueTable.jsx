import { useState, useMemo } from 'react';

export default function LeagueTable({ matches, teams, schools }) {
    const [selectedDivision, setSelectedDivision] = useState(() => {
        const hasPmc = (teams || []).some(t => t?.ageGroup === 'PMC' || (typeof t?.name === 'string' && t.name.includes('PMC')));
        return hasPmc ? 'PMC' : 'U14';
    });

    const getSchoolName = (schoolId) => {
        const sc = (schools || []).find(s => s.id === schoolId || s.rawId === schoolId);
        return sc ? sc.name : 'Unknown Team';
    };

    // Calculate standings for the selected division U14, U16, U19, PMC
    const standings = useMemo(() => {
        // Filter teams that belong to the selected division
        const divisionTeams = (teams || []).filter(t => t && (t.ageGroup === selectedDivision || (typeof t.name === 'string' && t.name.includes(selectedDivision))));

        const stats = divisionTeams.map(team => ({
            id: team.id,
            name: team.customName || team.name || `${getSchoolName(team.schoolId)} ${team.name || ''}`,
            schoolId: team.schoolId,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        }));

        // Filter approved or completed matches for this division
        const finishedMatches = (matches || []).filter(m => 
            (m.status === 'approved' || m.status === 'completed' || m.status === 'refereed') && 
            (m.ageGroup === selectedDivision || (m.ageGroup === undefined && (teams || []).find(t => t.id === m.homeTeamId)?.ageGroup === selectedDivision))
        );

        finishedMatches.forEach(match => {
            const homeStand = stats.find(s => s.id === match.homeTeamId);
            const awayStand = stats.find(s => s.id === match.awayTeamId);

            if (homeStand && awayStand) {
                homeStand.played += 1;
                awayStand.played += 1;
                
                const homeScore = Number(match.homeScore) || 0;
                const awayScore = Number(match.awayScore) || 0;

                homeStand.goalsFor += homeScore;
                homeStand.goalsAgainst += awayScore;
                awayStand.goalsFor += awayScore;
                awayStand.goalsAgainst += homeScore;

                if (homeScore > awayScore) {
                    homeStand.won += 1;
                    homeStand.points += 3;
                    awayStand.lost += 1;
                } else if (homeScore < awayScore) {
                    awayStand.won += 1;
                    awayStand.points += 3;
                    homeStand.lost += 1;
                } else {
                    homeStand.drawn += 1;
                    homeStand.points += 1;
                    awayStand.drawn += 1;
                    awayStand.points += 1;
                }
            }
        });

        // Recalculate goal difference
        stats.forEach(s => {
            s.goalDifference = s.goalsFor - s.goalsAgainst;
        });

        // Sort: Points DESC -> Goal Difference DESC -> Goals For DESC -> Name ASC
        return stats.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return a.name.localeCompare(b.name);
        });
    }, [matches, teams, schools, selectedDivision]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Live Division Standings</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dynamically calculated from official tournament fixtures</span>
                </div>
                <select
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                    style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'var(--border)',
                        background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer'
                    }}
                >
                    <option value="PMC">Prime Minister's Cup (PMC)</option>
                    <option value="U14">U14 Division</option>
                    <option value="U16">U16 Division</option>
                    <option value="U19">U19 Division</option>
                </select>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: 'var(--border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>Pos</th>
                            <th style={{ padding: '12px 16px' }}>Academy Team</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>P</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>W</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>D</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>L</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>GF</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>GA</th>
                            <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>GD</th>
                            <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center', fontWeight: '800', color: 'var(--primary-light)' }}>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No teams found in this division.
                                </td>
                            </tr>
                        ) : (
                            standings.map((team, index) => {
                                const isTop4 = index < 4;
                                const school = schools.find(s => s.id === team.schoolId) || {};
                                const colors = school.colors || ['#3b82f6', '#1e3a8a'];

                                return (
                                    <tr key={team.id} style={{ 
                                        borderBottom: 'var(--border)',
                                        background: isTop4 ? 'rgba(16,185,129,0.01)' : 'transparent',
                                        transition: 'background 0.15s ease'
                                    }}>
                                        {/* Position */}
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex', width: '22px', height: '22px', borderRadius: '50%',
                                                alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800',
                                                background: isTop4 ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)',
                                                color: isTop4 ? 'var(--success)' : 'var(--text-secondary)'
                                            }}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        
                                        {/* Team Name */}
                                        <td style={{ padding: '14px 16px', fontWeight: '700' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ 
                                                    width: '12px', height: '12px', borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                                                    border: '1px solid rgba(255,255,255,0.2)'
                                                }} />
                                                <span style={{ color: 'var(--text-primary)' }}>{team.name}</span>
                                                {isTop4 && (
                                                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'var(--success-dim)', color: 'var(--success)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Qualifying
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Played, Won, Drawn, Lost, Goals For, Goals Against, Goal Diff, Points */}
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-primary)' }}>{team.played}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-primary)' }}>{team.won}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-primary)' }}>{team.drawn}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-primary)' }}>{team.lost}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{team.goalsFor}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{team.goalsAgainst}</td>
                                        <td style={{ 
                                            padding: '14px 16px', textAlign: 'center', fontWeight: '700',
                                            color: team.goalDifference > 0 ? 'var(--success)' : team.goalDifference < 0 ? 'var(--danger)' : 'var(--text-secondary)'
                                        }}>
                                            {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '800', color: 'var(--primary-light)', fontSize: '14px' }}>{team.points}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
