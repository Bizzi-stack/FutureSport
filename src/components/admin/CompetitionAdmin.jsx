import { useState, useMemo } from 'react';
import LeagueTable from '../LeagueTable';
import KnockoutBrackets from '../KnockoutBrackets';
import CompetitionStats from '../CompetitionStats';
import {
    sendCoachSquadReminderNotification,
    sendRefereeSquadNotification,
    sendDataLoggerMatchReadyNotification
} from '../../services/refereeNotificationService';

const DEFAULT_VENUES = [
    { id: 'v1', name: 'Harrison College Field', status: 'Available' },
    { id: 'v2', name: 'Queens College Arena', status: 'Available' },
    { id: 'v3', name: 'National Stadium', status: 'Available' },
    { id: 'v4', name: 'Combermere Grounds', status: 'Maintenance' },
];

const DEFAULT_OFFICIALS = [
    { id: 'off1', name: 'Michael Beckles', role: 'Referee' },
    { id: 'off2', name: 'Sarah Rollins', role: 'Match Commissioner' },
    { id: 'off3', name: 'Dave Yearwood', role: 'Referee' },
    { id: 'off4', name: 'Karen Thorne', role: 'Match Commissioner' },
    { id: 'off5', name: 'Adrian Hunte', role: 'Referee' },
];

export default function CompetitionAdmin({ schools, teams, matches, allStudents, year, onAddMatches, selectedTournament }) {
    const [activeSubTab, setActiveSubTab] = useState('divisions'); // 'divisions' | 'venues' | 'generator' | 'standings' | 'knockout' | 'stats' | 'alerts'
    const [adminAlertToast, setAdminAlertToast] = useState(null);
    
    // Generator states
    const [selectedDivision, setSelectedDivision] = useState(() => selectedTournament === 'PMC' ? 'PMC' : 'U14');
    const [selectedVenue, setSelectedVenue] = useState('v1');
    const [matchdayTerm, setMatchdayTerm] = useState('Matchday 1');
    const [generationSuccess, setGenerationSuccess] = useState(false);

    // Group teams by division/age group
    const divisionGroups = useMemo(() => {
        const safeTeams = teams || [];
        const PMC = safeTeams.filter(t => t && (t.ageGroup === 'PMC' || (typeof t.name === 'string' && t.name.includes('PMC'))));
        const U14 = safeTeams.filter(t => t && (t.ageGroup === 'U14' || (typeof t.name === 'string' && t.name.includes('U14'))));
        const U16 = safeTeams.filter(t => t && (t.ageGroup === 'U16' || (typeof t.name === 'string' && t.name.includes('U16'))));
        const U19 = safeTeams.filter(t => t && (t.ageGroup === 'U19' || (typeof t.name === 'string' && t.name.includes('U19'))));
        return { PMC, U14, U16, U19 };
    }, [teams]);

    const getSchoolName = (schoolId) => {
        const sc = (schools || []).find(s => s.id === schoolId || s.rawId === schoolId);
        return sc ? sc.name : 'Team';
    };

    const handleGenerateFixtures = () => {
        const divisionTeams = divisionGroups[selectedDivision] || [];
        if (divisionTeams.length < 2) return;

        const newFixtures = [];
        const venue = DEFAULT_VENUES.find(v => v.id === selectedVenue)?.name || 'Local Ground';
        const referees = DEFAULT_OFFICIALS.filter(o => o.role === 'Referee');
        const commissioners = DEFAULT_OFFICIALS.filter(o => o.role === 'Match Commissioner');

        // Round-robin pairing for the selected division teams
        let matchIndex = 1;
        for (let i = 0; i < divisionTeams.length; i++) {
            for (let j = i + 1; j < divisionTeams.length; j++) {
                const home = divisionTeams[i];
                const away = divisionTeams[j];

                const ref = referees.length > 0 ? referees[(i + j) % referees.length].name : 'Official Referee';
                const comm = commissioners.length > 0 ? commissioners[(i + j) % commissioners.length].name : 'Match Commissioner';

                newFixtures.push({
                    id: `scheduled-${Date.now()}-${matchIndex++}`,
                    homeTeamId: home.id,
                    awayTeamId: away.id,
                    ageGroup: selectedDivision,
                    matchday: matchdayTerm,
                    venue,
                    referee: ref,
                    commissioner: comm,
                    status: 'scheduled',
                    homeScore: 0,
                    awayScore: 0,
                    playerStats: {},
                    timeline: [],
                    date: new Date(Date.now() + 86400000 * matchIndex).toISOString(), // future dates
                });
            }
        }

        onAddMatches(newFixtures);
        setGenerationSuccess(true);
        setTimeout(() => setGenerationSuccess(false), 3000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%', minHeight: 0 }}>
            
            {/* Sub-navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: 'var(--border)', paddingBottom: '10px', flexWrap: 'wrap' }}>
                {[
                    { key: 'divisions', label: 'Divisions & Teams' },
                    { key: 'alerts', label: 'Match Operations & Alerts' },
                    { key: 'standings', label: 'League Standings' },
                    { key: 'stats', label: 'Competition Stats' },
                    { key: 'knockout', label: 'Knockouts' },
                    { key: 'venues', label: 'Venues & Officials' },
                    { key: 'generator', label: 'Fixture Generator' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveSubTab(tab.key)}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                            background: activeSubTab === tab.key ? 'rgba(37,99,235,0.18)' : 'transparent',
                            color: activeSubTab === tab.key ? 'var(--primary-light)' : 'var(--text-secondary)',
                            border: activeSubTab === tab.key ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Switcher */}
            <div style={{ flex: 1, minHeight: 0 }}>
                {activeSubTab === 'divisions' && (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedTournament === 'PMC' || divisionGroups.PMC.length > 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '20px' }}>
                        {(selectedTournament === 'PMC' || divisionGroups.PMC.length > 0 ? ['PMC', 'U14', 'U16', 'U19'] : ['U14', 'U16', 'U19']).map(div => {
                            const list = divisionGroups[div] || [];
                            if (list.length === 0 && div !== 'PMC' && selectedTournament === 'PMC') return null;
                            return (
                                <div key={div} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                            {div === 'PMC' ? "PMC Senior Division" : `${div} Division`}
                                        </h3>
                                        <span style={{ fontSize: '11px', color: 'var(--primary-light)', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                            {list.length} Teams
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                        {list.map(team => (
                                            <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', borderRadius: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{getSchoolName(team.schoolId)}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {team.id}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSubTab === 'venues' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Venues Panel */}
                        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>Venues Directory</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {DEFAULT_VENUES.map(venue => (
                                    <div key={venue.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{venue.name}</span>
                                        </div>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px',
                                            background: venue.status === 'Available' ? 'var(--success-dim)' : 'var(--danger-dim)',
                                            color: venue.status === 'Available' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {venue.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Officials Panel */}
                        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>Match Officials</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {DEFAULT_OFFICIALS.map(off => (
                                    <div key={off.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{off.name}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--primary-light)', background: 'rgba(37,99,235,0.1)', padding: '3px 10px', borderRadius: '6px', fontWeight: '600' }}>
                                            {off.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'generator' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }} className="glass-panel">
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'center' }}>Automatic Fixture Generator</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Target Division</label>
                                <select
                                    value={selectedDivision}
                                    onChange={e => setSelectedDivision(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                >
                                    {(selectedTournament === 'PMC' || divisionGroups.PMC.length > 0) && <option value="PMC">PMC Senior Division</option>}
                                    <option value="U14">U14 Division</option>
                                    <option value="U16">U16 Division</option>
                                    <option value="U19">U19 Division</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Default Matchday / Term</label>
                                <select
                                    value={matchdayTerm}
                                    onChange={e => setMatchdayTerm(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="Matchday 1">Matchday 1</option>
                                    <option value="Matchday 2">Matchday 2</option>
                                    <option value="Matchday 3">Matchday 3</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Primary Ground Venue</label>
                                <select
                                    value={selectedVenue}
                                    onChange={e => setSelectedVenue(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                >
                                    {DEFAULT_VENUES.filter(v => v.status === 'Available').map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>

                            {generationSuccess && (
                                <div style={{
                                    padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '13px', fontWeight: '600', textAlign: 'center'
                                }}>
                                    ✓ Fixtures successfully generated and loaded into the Match Centre!
                                </div>
                            )}

                            <button
                                onClick={handleGenerateFixtures}
                                style={{
                                    padding: '12px', borderRadius: '24px', background: 'var(--primary)', border: 'none',
                                    color: '#ffffff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)', marginTop: '10px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                            >
                                Generate Round-Robin Schedule
                            </button>
                        </div>
                    </div>
                )}

                {activeSubTab === 'standings' && (
                    <LeagueTable matches={matches} teams={teams} schools={schools} />
                )}

                {activeSubTab === 'knockout' && (
                    <KnockoutBrackets matches={matches} teams={teams} schools={schools} onAddMatches={onAddMatches} />
                )}

                {activeSubTab === 'stats' && (
                    <CompetitionStats matches={matches} teams={teams} schools={schools} allStudents={allStudents} year={year} />
                )}

                {activeSubTab === 'alerts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Admin Alert Feedback Toast */}
                        {adminAlertToast && (
                            <div style={{
                                padding: '12px 18px', borderRadius: '10px',
                                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                                color: '#4ade80', fontSize: '13px', fontWeight: '700',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                                {adminAlertToast}
                            </div>
                        )}

                        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        Live Match Operations &amp; Official Notifications
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Monitor team sheet readiness, dispatch coach submission reminders, and trigger official alerts.
                                    </p>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                                    ● FormSubmit Relay Connected
                                </span>
                            </div>

                            {/* Fixtures list with alert action buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(matches || []).filter(m => m.status === 'upcoming' || m.status === 'scheduled' || m.status === 'live').map(m => {
                                    const homeName = getSchoolName(m.homeTeamId);
                                    const awayName = getSchoolName(m.awayTeamId);
                                    const homeReady = !!m.homeSquadSelection;
                                    const awayReady = !!m.awaySquadSelection;
                                    const bothReady = homeReady && awayReady;

                                    return (
                                        <div key={m.id} style={{
                                            padding: '16px', borderRadius: '12px',
                                            background: bothReady ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                                            border: bothReady ? '1px solid rgba(34,197,94,0.3)' : 'var(--border)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                        {homeName} vs {awayName}
                                                    </span>
                                                    {m.status === 'live' && (
                                                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                                                            LIVE
                                                        </span>
                                                    )}
                                                    {bothReady && m.status !== 'live' && (
                                                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                                                            SQUADS LOCKED
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                                    {m.matchday || 'Matchday 1'} · {m.venue || 'Stadium'} · Ref: {m.referee || 'Assigned Referee'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                {/* Home Squad Status / Remind Button */}
                                                {!homeReady ? (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await sendCoachSquadReminderNotification(m, homeName, '', `Coach (${homeName})`, awayName);
                                                                setAdminAlertToast(`Squad reminder dispatched to ${homeName} Coach!`);
                                                                setTimeout(() => setAdminAlertToast(null), 4000);
                                                            } catch (e) {
                                                                console.warn(e);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                                                            background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}
                                                    >
                                                        Remind {homeName} Coach
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                                        {homeName} Ready
                                                    </span>
                                                )}

                                                {/* Away Squad Status / Remind Button */}
                                                {!awayReady ? (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await sendCoachSquadReminderNotification(m, awayName, '', `Coach (${awayName})`, homeName);
                                                                setAdminAlertToast(`Squad reminder dispatched to ${awayName} Coach!`);
                                                                setTimeout(() => setAdminAlertToast(null), 4000);
                                                            } catch (e) {
                                                                console.warn(e);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                                                            background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}
                                                    >
                                                        Remind {awayName} Coach
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                                        {awayName} Ready
                                                    </span>
                                                )}

                                                {/* If both ready, allow manual broadcast alert */}
                                                {bothReady && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await sendRefereeSquadNotification(m, homeName, awayName, allStudents);
                                                                await sendDataLoggerMatchReadyNotification(m, homeName, awayName, allStudents);
                                                                setAdminAlertToast(`Official alerts & team sheets delivered to Referee and Data Loggers!`);
                                                                setTimeout(() => setAdminAlertToast(null), 4000);
                                                            } catch (e) {
                                                                console.warn(e);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                                                            background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff',
                                                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                                                        }}
                                                    >
                                                        Alert Officials
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
