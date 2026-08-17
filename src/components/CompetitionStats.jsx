import { useState, useMemo } from 'react';

export default function CompetitionStats({ matches, teams, schools, allStudents, year }) {
    const [selectedDivision, setSelectedDivision] = useState(() => {
        const hasPmc = (teams || []).some(t => t?.ageGroup === 'PMC' || (typeof t?.name === 'string' && t.name.includes('PMC')));
        return hasPmc ? 'PMC' : 'U14';
    });

    const getSchoolName = (schoolId) => {
        const sc = (schools || []).find(s => s.id === schoolId || s.rawId === schoolId);
        return sc ? sc.name : 'Unknown Team';
    };

    // Filter teams for selected division
    const divisionTeams = useMemo(() => {
        return (teams || []).filter(t => t && (t.ageGroup === selectedDivision || (typeof t.name === 'string' && t.name.includes(selectedDivision))));
    }, [teams, selectedDivision]);

    const divisionTeamIds = useMemo(() => {
        return new Set(divisionTeams.map(t => t.id));
    }, [divisionTeams]);

    // Calculate dynamic tournament metrics
    const statsSummary = useMemo(() => {
        const approvedMatches = (matches || []).filter(m => 
            (m.status === 'approved' || m.status === 'completed' || m.status === 'refereed') && 
            (m.ageGroup === selectedDivision || (m.ageGroup === undefined && (teams || []).find(t => t.id === m.homeTeamId)?.ageGroup === selectedDivision))
        );

        let totalGoals = 0;
        let totalYellowCards = 0;
        let totalRedCards = 0;

        approvedMatches.forEach(match => {
            totalGoals += (Number(match.homeScore) || 0) + (Number(match.awayScore) || 0);
            
            // Sum cards from player statistics
            if (match.playerStats) {
                Object.values(match.playerStats).forEach(playerStat => {
                    totalYellowCards += playerStat.yellowCards || 0;
                    totalRedCards += playerStat.redCards || 0;
                });
            }
        });

        const matchesPlayed = approvedMatches.length;
        const avgGoals = matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(2) : '0.00';

        return {
            matchesPlayed,
            totalGoals,
            avgGoals,
            totalYellowCards,
            totalRedCards
        };
    }, [matches, teams, selectedDivision]);

    // Aggregate statistics for players in the selected division
    const playerLeaderboards = useMemo(() => {
        const divisionPlayers = (allStudents || []).filter(student => {
            const assignedTeamId = student.teamAssignments?.[year];
            return divisionTeamIds.has(assignedTeamId) || divisionTeamIds.has(student.schoolId);
        });

        const playerStats = divisionPlayers.map(student => {
            const totals = {
                goals: 0,
                assists: 0,
                saves: 0,
                yellowCards: 0,
                redCards: 0,
                gamesPlayed: 0
            };

            const yearPerf = student.performance?.[year] || {};
            Object.values(yearPerf).forEach(mdPerf => {
                totals.goals += mdPerf['Goals'] || 0;
                totals.assists += mdPerf['Assists'] || 0;
                totals.saves += mdPerf['Saves'] || 0;
            });

            const yearMatch = student.matchStats?.[year] || {};
            Object.values(yearMatch).forEach(mdMatch => {
                totals.gamesPlayed += mdMatch.gamesPlayed || 0;
                totals.yellowCards += mdMatch.yellowCards || 0;
                totals.redCards += mdMatch.redCards || 0;
            });

            const teamObj = (teams || []).find(t => t.id === student.teamAssignments?.[year] || t.schoolId === student.schoolId);
            const schoolObj = (schools || []).find(s => s.id === student.schoolId || s.rawId === student.schoolId);

            return {
                id: student.id,
                name: student.name,
                teamName: teamObj ? teamObj.name : 'Unassigned',
                schoolColors: schoolObj ? schoolObj.colors : ['#3b82f6', '#1e3a8a'],
                ...totals
            };
        });

        // Top Scorers: Goals DESC -> Games Played ASC
        const topScorers = [...playerStats]
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals || a.gamesPlayed - b.gamesPlayed)
            .slice(0, 5);

        // Top Playmakers: Assists DESC -> Games Played ASC
        const topAssists = [...playerStats]
            .filter(p => p.assists > 0)
            .sort((a, b) => b.assists - a.assists || a.gamesPlayed - b.gamesPlayed)
            .slice(0, 5);

        // Top Goalkeepers: Saves DESC
        const topSaves = [...playerStats]
            .filter(p => p.saves > 0)
            .sort((a, b) => b.saves - a.saves)
            .slice(0, 5);

        // Disciplinary: Red Cards DESC -> Yellow Cards DESC
        const disciplinary = [...playerStats]
            .filter(p => p.yellowCards > 0 || p.redCards > 0)
            .sort((a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards)
            .slice(0, 5);

        return {
            topScorers,
            topAssists,
            topGoalkeepers: topSaves,
            disciplinary
        };
    }, [allStudents, year, divisionTeamIds, teams, schools]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* Header tab section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>📈 Competition Statistics</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aggregated division-wide tournament metrics and leaderboards</span>
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

            {/* Metric Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Matches Played</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-light)' }}>{statsSummary.matchesPlayed}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Total Goals</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>{statsSummary.totalGoals}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Goals / Match</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)' }}>{statsSummary.avgGoals}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Yellow Cards</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24' }}>{statsSummary.totalYellowCards}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Red Cards</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{statsSummary.totalRedCards}</div>
                </div>
            </div>

            {/* Leaderboard Lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* 1. Golden Boot (Top Scorers) */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>⚽ Golden Boot (Top Scorers)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {playerLeaderboards.topScorers.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>No goals logged yet.</span>
                        ) : (
                            playerLeaderboards.topScorers.map((player, index) => (
                                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--text-muted)', width: '16px' }}>{index + 1}</span>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${player.schoolColors[0]}, ${player.schoolColors[1]})` }} />
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{player.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{player.teamName}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: '800', color: 'var(--success)' }}>{player.goals} G</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Playmaker Award (Top Assists) */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>👟 Playmaker (Most Assists)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {playerLeaderboards.topAssists.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>No assists logged yet.</span>
                        ) : (
                            playerLeaderboards.topAssists.map((player, index) => (
                                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--text-muted)', width: '16px' }}>{index + 1}</span>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${player.schoolColors[0]}, ${player.schoolColors[1]})` }} />
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{player.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{player.teamName}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: '800', color: 'var(--primary-light)' }}>{player.assists} A</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Golden Glove (Goalkeeper Saves) */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>🧤 Golden Glove (Saves)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {playerLeaderboards.topGoalkeepers.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>No goalkeeper saves logged yet.</span>
                        ) : (
                            playerLeaderboards.topGoalkeepers.map((player, index) => (
                                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--text-muted)', width: '16px' }}>{index + 1}</span>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${player.schoolColors[0]}, ${player.schoolColors[1]})` }} />
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{player.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{player.teamName}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: '800', color: 'var(--warning)' }}>{player.saves} Saves</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 4. Disciplinary Record */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>🟨 Disciplinary Record</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {playerLeaderboards.disciplinary.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>No cards issued yet.</span>
                        ) : (
                            playerLeaderboards.disciplinary.map((player, index) => (
                                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--text-muted)', width: '16px' }}>{index + 1}</span>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${player.schoolColors[0]}, ${player.schoolColors[1]})` }} />
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{player.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{player.teamName}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '700' }}>
                                        <span style={{ color: '#fbbf24' }}>{player.yellowCards} 🟨</span>
                                        <span style={{ color: '#ef4444' }}>{player.redCards} 🟥</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
