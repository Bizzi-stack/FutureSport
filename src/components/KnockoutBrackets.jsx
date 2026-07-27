import { useState, useMemo } from 'react';

const VENUES = [
    { id: 'Wildey Turf Ground', name: 'Wildey Turf Ground' },
    { id: 'Harrison College Ground', name: 'Harrison College Ground' },
    { id: 'Combermere Playing Field', name: 'Combermere Playing Field' },
    { id: 'Weymouth Turf', name: 'Weymouth Turf' }
];

const OFFICIALS = [
    { name: 'Gavin Corbin', role: 'Referee' },
    { name: 'Kristian Gilkes', role: 'Referee' },
    { name: 'Adrian Skeete', role: 'Referee' },
    { name: 'Mark Forde', role: 'Referee' },
    { name: 'Sherwin Johnson', role: 'Referee' },
    { name: 'Charles White', role: 'Commissioner' },
    { name: 'Harcourt Wason', role: 'Commissioner' }
];

export default function KnockoutBrackets({ matches, teams, schools, onAddMatches }) {
    const [selectedDivision, setSelectedDivision] = useState('U14');
    
    // Form States for Semifinals
    const [sfDate, setSfDate] = useState('2026-07-20');
    const [sfVenue, setSfVenue] = useState(VENUES[0].name);
    const [sfReferee1, setSfReferee1] = useState(OFFICIALS[0].name);
    const [sfReferee2, setSfReferee2] = useState(OFFICIALS[1].name);
    const [sfComm1, setSfComm1] = useState(OFFICIALS[5].name);
    const [sfComm2, setSfComm2] = useState(OFFICIALS[6].name);

    // Form States for Finals
    const [fDate, setFDate] = useState('2026-07-25');
    const [fVenue, setFVenue] = useState(VENUES[1].name);
    const [fReferee, setFReferee] = useState(OFFICIALS[2].name);
    const [fComm, setFComm] = useState(OFFICIALS[5].name);

    const getSchoolName = (schoolId) => {
        const sc = schools.find(s => s.id === schoolId);
        return sc ? sc.name : 'Unknown School';
    };

    // Calculate standings to identify top 4 teams
    const standings = useMemo(() => {
        const divisionTeams = (teams || []).filter(t => t && (t.ageGroup === selectedDivision || (typeof t.name === 'string' && t.name.includes(selectedDivision))));

        const stats = divisionTeams.map(team => ({
            id: team.id,
            name: team.customName || `${getSchoolName(team.schoolId)} ${team.name}`,
            schoolId: team.schoolId,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0
        }));

        const approvedMatches = (matches || []).filter(m => 
            m.status === 'approved' && 
            (m.ageGroup === selectedDivision || (m.ageGroup === undefined && teams.find(t => t.id === m.homeTeamId)?.ageGroup === selectedDivision)) &&
            m.stage !== 'knockout'
        );

        approvedMatches.forEach(match => {
            const homeStand = stats.find(s => s.id === match.homeTeamId);
            const awayStand = stats.find(s => s.id === match.awayTeamId);

            if (homeStand && awayStand) {
                const homeScore = Number(match.homeScore) || 0;
                const awayScore = Number(match.awayScore) || 0;

                homeStand.goalsFor += homeScore;
                homeStand.goalsAgainst += awayScore;
                awayStand.goalsFor += awayScore;
                awayStand.goalsAgainst += homeScore;

                if (homeScore > awayScore) {
                    homeStand.points += 3;
                } else if (homeScore < awayScore) {
                    awayStand.points += 3;
                } else {
                    homeStand.points += 1;
                    awayStand.points += 1;
                }
            }
        });

        stats.forEach(s => {
            s.goalDifference = s.goalsFor - s.goalsAgainst;
        });

        return stats.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    }, [matches, teams, schools, selectedDivision]);

    // Find existing knockout matches for selected division
    const knockoutMatches = useMemo(() => {
        return (matches || []).filter(m => 
            m.stage === 'knockout' && 
            m.ageGroup === selectedDivision
        );
    }, [matches, selectedDivision]);

    const semifinal1 = knockoutMatches.find(m => m.round === 'semifinal' && m.sfNumber === 1);
    const semifinal2 = knockoutMatches.find(m => m.round === 'semifinal' && m.sfNumber === 2);
    const finalMatch = knockoutMatches.find(m => m.round === 'final');

    const handleScheduleSemifinals = () => {
        if (standings.length < 4) {
            alert('Need at least 4 teams in the division to schedule Semifinals!');
            return;
        }

        const team1 = standings[0];
        const team4 = standings[3];
        const team2 = standings[1];
        const team3 = standings[2];

        const matchesToAdd = [
            {
                id: `knockout-sf1-${Date.now()}`,
                homeTeamId: team1.id,
                awayTeamId: team4.id,
                ageGroup: selectedDivision,
                matchday: 'Semifinal 1',
                venue: sfVenue,
                referee: sfReferee1,
                commissioner: sfComm1,
                status: 'scheduled',
                stage: 'knockout',
                round: 'semifinal',
                sfNumber: 1,
                homeScore: 0,
                awayScore: 0,
                playerStats: {},
                timeline: [],
                date: new Date(sfDate).toISOString()
            },
            {
                id: `knockout-sf2-${Date.now()}`,
                homeTeamId: team2.id,
                awayTeamId: team3.id,
                ageGroup: selectedDivision,
                matchday: 'Semifinal 2',
                venue: sfVenue,
                referee: sfReferee2,
                commissioner: sfComm2,
                status: 'scheduled',
                stage: 'knockout',
                round: 'semifinal',
                sfNumber: 2,
                homeScore: 0,
                awayScore: 0,
                playerStats: {},
                timeline: [],
                date: new Date(sfDate).toISOString()
            }
        ];

        onAddMatches(matchesToAdd);
    };

    const handleScheduleFinals = () => {
        if (!semifinal1 || !semifinal2 || semifinal1.status !== 'approved' || semifinal2.status !== 'approved') {
            alert('Both Semifinals must be completed and approved before scheduling the Finals!');
            return;
        }

        const winner1Id = semifinal1.homeScore > semifinal1.awayScore ? semifinal1.homeTeamId : semifinal1.awayTeamId;
        const winner2Id = semifinal2.homeScore > semifinal2.awayScore ? semifinal2.homeTeamId : semifinal2.awayTeamId;

        const newFinalMatch = {
            id: `knockout-final-${Date.now()}`,
            homeTeamId: winner1Id,
            awayTeamId: winner2Id,
            ageGroup: selectedDivision,
            matchday: 'Grand Final',
            venue: fVenue,
            referee: fReferee,
            commissioner: fComm,
            status: 'scheduled',
            stage: 'knockout',
            round: 'final',
            homeScore: 0,
            awayScore: 0,
            playerStats: {},
            timeline: [],
            date: new Date(fDate).toISOString()
        };

        onAddMatches([newFinalMatch]);
    };

    const getTeamDisplayName = (teamId) => {
        if (!teamId) return 'TBD';
        const team = teams.find(t => t.id === teamId);
        return team ? (team.customName || `${getSchoolName(team.schoolId)} ${team.name}`) : 'TBD';
    };

    const isChampion = finalMatch && finalMatch.status === 'approved';
    const championId = isChampion ? (finalMatch.homeScore > finalMatch.awayScore ? finalMatch.homeTeamId : finalMatch.awayTeamId) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* Header / Division Select */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>🏆 Knockout Brackets Setup</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Setup Semifinals and Finals for the cup stage</span>
                </div>
                <select
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                    style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'var(--border)',
                        background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer'
                    }}
                >
                    <option value="U14">U14 Division</option>
                    <option value="U16">U16 Division</option>
                    <option value="U19">U19 Division</option>
                </select>
            </div>

            {/* Main Visual Bracket Tree */}
            <div className="glass-panel" style={{ padding: '24px', position: 'relative', background: 'rgba(255,255,255,0.01)', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                
                {/* Visual flowchart container */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', position: 'relative' }}>
                    
                    {/* Column 1: Semifinals */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '220px' }}>
                        {/* SF 1 Card */}
                        <div className="glass-panel" style={{
                            padding: '12px', borderLeft: semifinal1 ? '4px solid var(--primary-light)' : '4px dashed rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative'
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary-light)', textTransform: 'uppercase' }}>Semifinal 1</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                    {semifinal1 ? getTeamDisplayName(semifinal1.homeTeamId) : '1st Place Team'}
                                </span>
                                <span>{semifinal1 && semifinal1.status !== 'scheduled' ? semifinal1.homeScore : '-'}</span>
                            </div>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                    {semifinal1 ? getTeamDisplayName(semifinal1.awayTeamId) : '4th Place Team'}
                                </span>
                                <span>{semifinal1 && semifinal1.status !== 'scheduled' ? semifinal1.awayScore : '-'}</span>
                            </div>
                            {semifinal1 && (
                                <span style={{ fontSize: '9px', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                                    {semifinal1.status}
                                </span>
                            )}
                        </div>

                        {/* SF 2 Card */}
                        <div className="glass-panel" style={{
                            padding: '12px', borderLeft: semifinal2 ? '4px solid var(--primary-light)' : '4px dashed rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary-light)', textTransform: 'uppercase' }}>Semifinal 2</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                    {semifinal2 ? getTeamDisplayName(semifinal2.homeTeamId) : '2nd Place Team'}
                                </span>
                                <span>{semifinal2 && semifinal2.status !== 'scheduled' ? semifinal2.homeScore : '-'}</span>
                            </div>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                    {semifinal2 ? getTeamDisplayName(semifinal2.awayTeamId) : '3rd Place Team'}
                                </span>
                                <span>{semifinal2 && semifinal2.status !== 'scheduled' ? semifinal2.awayScore : '-'}</span>
                            </div>
                            {semifinal2 && (
                                <span style={{ fontSize: '9px', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                                    {semifinal2.status}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Connective Line Graphic (Arrow) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.15)' }} />
                    </div>

                    {/* Column 2: Finals */}
                    <div style={{ width: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="glass-panel" style={{
                            padding: '16px', borderLeft: finalMatch ? '4px solid var(--warning)' : '4px dashed rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '10px'
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Grand Final</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '145px' }}>
                                    {finalMatch ? getTeamDisplayName(finalMatch.homeTeamId) : 'Winner Semifinal 1'}
                                </span>
                                <span>{finalMatch && finalMatch.status !== 'scheduled' ? finalMatch.homeScore : '-'}</span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '145px' }}>
                                    {finalMatch ? getTeamDisplayName(finalMatch.awayTeamId) : 'Winner Semifinal 2'}
                                </span>
                                <span>{finalMatch && finalMatch.status !== 'scheduled' ? finalMatch.awayScore : '-'}</span>
                            </div>
                            {finalMatch && (
                                <span style={{ fontSize: '10px', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                                    {finalMatch.status}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Champion Display */}
                    <div style={{ width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
                        {isChampion ? (
                            <div style={{ animation: 'bounce 2s infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '42px' }}>👑</span>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--warning)' }}>CHAMPION</div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', maxWidth: '160px' }}>
                                    {getTeamDisplayName(championId)}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '32px' }}>🏆</span>
                                <span>Cup Champion</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Setup Controls Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Semifinals Schedule Panel */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>1. Setup Semifinals</h4>
                    
                    {semifinal1 && semifinal2 ? (
                        <div style={{
                            padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.15)', fontSize: '12.5px', color: 'var(--success)'
                        }}>
                            ✓ Semifinal fixtures scheduled successfully. Track their status in the Match Centre.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                                Pairs the top 4 teams in U14/U16/U19 standings (1st vs 4th &amp; 2nd vs 3rd) for knockout matches.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Venue</label>
                                    <select value={sfVenue} onChange={e => setSfVenue(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '12px' }}>
                                        {VENUES.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date</label>
                                    <input type="date" value={sfDate} onChange={e => setSfDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '12px' }} />
                                </div>
                            </div>

                            <button
                                onClick={handleScheduleSemifinals}
                                disabled={standings.length < 4}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', background: 'var(--primary)',
                                    color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer',
                                    opacity: standings.length < 4 ? 0.5 : 1
                                }}
                            >
                                Schedule Semifinals 📅
                            </button>
                        </div>
                    )}
                </div>

                {/* Finals Schedule Panel */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>2. Setup Grand Final</h4>
                    
                    {finalMatch ? (
                        <div style={{
                            padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.15)', fontSize: '12.5px', color: 'var(--success)'
                        }}>
                            ✓ Grand Final fixture scheduled successfully. Track its status in the Match Centre.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                                Pairs the winners of Semifinal 1 and Semifinal 2 once their scores are approved.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Venue</label>
                                    <select value={fVenue} onChange={e => setFVenue(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '12px' }}>
                                        {VENUES.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date</label>
                                    <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '12px' }} />
                                </div>
                            </div>

                            <button
                                onClick={handleScheduleFinals}
                                disabled={!semifinal1 || !semifinal2 || semifinal1.status !== 'approved' || semifinal2.status !== 'approved'}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', background: 'var(--warning)',
                                    color: '#000000', border: 'none', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer',
                                    opacity: (!semifinal1 || !semifinal2 || semifinal1.status !== 'approved' || semifinal2.status !== 'approved') ? 0.5 : 1
                                }}
                            >
                                Schedule Grand Final 🏆
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>

        </div>
    );
}
