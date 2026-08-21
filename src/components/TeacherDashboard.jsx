import { useState, useEffect, useMemo } from 'react';
import { generateTeacherAlerts } from '../utils/interventionEngine';
import DataEntryPanel from './DataEntryPanel';
import RegisterPlayerModal from './RegisterPlayerModal';
import CreateSquadModal from './CreateSquadModal';
import MatchdaySquadSelection from './MatchdaySquadSelection';
import LeagueTable from './LeagueTable';
import CoachLiveManagement from './match/CoachLiveManagement';
import CoachPostGameStatsHub from './coach/CoachPostGameStatsHub';

export default function TeacherDashboard({ 
    students, year, term, subjects, settings,
    onStudentClick, onDataUpdate, onRemoveSubject, onRemoveStudent, onAddSubjectClick,
    onOpenLogShotModal,
    schoolId, schools, allTeams, onAddTeam, onAddPlayer,
    userRole, matches, allPlayers, onUpdateMatch, selectedClassroom
}) {
    const [alerts, setAlerts] = useState([]);
    const [dismissedIds, setDismissedIds] = useState(new Set());
    const [mainTab, setMainTab] = useState('stats_hub'); // 'stats_hub' | 'overview' | 'registration' | 'data' | 'matchday'

    const [showRegisterPlayer, setShowRegisterPlayer] = useState(false);
    const [showCreateSquad, setShowCreateSquad] = useState(false);

    // Generate alerts whenever the core data changes
    useEffect(() => {
        const generated = generateTeacherAlerts(students, year, term);
        setAlerts(generated);
    }, [students, year, term]);

    const activeAlerts = alerts.filter(a => !dismissedIds.has(a.id));

    // Check if the coach's selected team/school is currently playing a live match
    const liveMatch = useMemo(() => {
        if (userRole !== 'coach') return null;
        const schoolObj = (schools || []).find(s => s.id === schoolId || s.name === schoolId);
        const teamObj = (allTeams || []).find(t => t.id === selectedClassroom || t.name === selectedClassroom);

        const cleanSchoolId = String(schoolId || '').toLowerCase().replace('-team-pmc', '');
        const cleanClassroom = String(selectedClassroom || '').toLowerCase().replace('-team-pmc', '');

        const targets = [
            schoolId, selectedClassroom, cleanSchoolId, cleanClassroom,
            schoolObj?.id, schoolObj?.name,
            teamObj?.id, teamObj?.name, teamObj?.schoolId
        ].filter(Boolean).map(x => String(x).toLowerCase());

        return (matches || []).find(m => {
            if (m.status !== 'live') return false;
            const homeVals = [m.homeTeamId, m.homeTeam, m.homeSchoolId].filter(Boolean).map(x => String(x).toLowerCase());
            const awayVals = [m.awayTeamId, m.awayTeam, m.awaySchoolId].filter(Boolean).map(x => String(x).toLowerCase());

            const isHome = homeVals.some(h => targets.some(t => h.includes(t) || t.includes(h)));
            const isAway = awayVals.some(a => targets.some(t => a.includes(t) || t.includes(a)));
            return isHome || isAway;
        });
    }, [matches, schoolId, selectedClassroom, userRole, schools, allTeams]);

    // Auto-switch coach to 'live' tab when their match goes live
    useEffect(() => {
        if (liveMatch && userRole === 'coach') {
            setMainTab('live');
        }
    }, [liveMatch?.id, userRole]);

    const handleDismiss = (id) => {
        setDismissedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    // Calculate Z-Scores for simple display
    const zScores = useMemo(() => {
        const scores = {};
        students.forEach(s => {
            const g = s.performance?.[year]?.[term];
            if (!g) return;
            const v = Object.values(g).filter(x => x > 0);
            if (v.length) scores[s.id] = Math.round(v.reduce((a, b) => a + b, 0) / v.length);
        });

        const validScores = Object.values(scores);
        if (validScores.length === 0) return {};

        const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        const variance = validScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validScores.length;
        const stdDev = Math.sqrt(variance) || 1;

        const result = {};
        for (const [id, score] of Object.entries(scores)) {
            const z = (score - mean) / stdDev;
            result[id] = { score, mean, stdDev, z };
        }
        return result;
    }, [students, year, term]);

    // Aggregated Squad Analytics & Top Performers for Coach Dashboard
    const squadStats = useMemo(() => {
        let totalGoals = 0;
        let totalAssists = 0;
        let totalShots = 0;
        let totalShotsOnTarget = 0;
        let totalSaves = 0;
        let totalCleanSheets = 0;
        let topScorer = null;
        let topAssist = null;
        let topSaves = null;

        students.forEach(s => {
            const perf = s.performance?.[year]?.[term] || {};
            const g = perf['Goals'] || 0;
            const a = perf['Assists'] || 0;
            const sh = perf['Shots'] || 0;
            const sot = perf['Shots on Target'] || 0;
            const sv = perf['Saves'] || 0;
            const cs = perf['Clean Sheets'] || 0;

            totalGoals += g;
            totalAssists += a;
            totalShots += sh;
            totalShotsOnTarget += sot;
            totalSaves += sv;
            totalCleanSheets += cs;

            if (g > 0 && (!topScorer || g > topScorer.goals)) {
                topScorer = { name: s.name, jerseyNumber: s.jerseyNumber, goals: g, position: s.position };
            }
            if (a > 0 && (!topAssist || a > topAssist.assists)) {
                topAssist = { name: s.name, jerseyNumber: s.jerseyNumber, assists: a, position: s.position };
            }
            if (sv > 0 && (!topSaves || sv > topSaves.saves)) {
                topSaves = { name: s.name, jerseyNumber: s.jerseyNumber, saves: sv, position: s.position };
            }
        });

        const shotAcc = totalShots > 0 ? Math.round((totalShotsOnTarget / totalShots) * 100) : 0;
        const convRate = totalShotsOnTarget > 0 ? Math.round((totalGoals / totalShotsOnTarget) * 100) : 0;

        return {
            totalGoals,
            totalAssists,
            totalShots,
            totalSaves,
            totalCleanSheets,
            shotAcc,
            convRate,
            topScorer,
            topAssist,
            topSaves
        };
    }, [students, year, term]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top-level Tabs for Coach View */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setMainTab('stats_hub')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: mainTab === 'stats_hub' ? 'rgba(34, 197, 94, 0.18)' : 'transparent',
                            color: mainTab === 'stats_hub' ? '#4ade80' : 'var(--text-secondary)',
                            border: mainTab === 'stats_hub' ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        Stats &amp; Analytics Hub
                    </button>
                    <button
                        onClick={() => setMainTab('registration')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: mainTab === 'registration' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: mainTab === 'registration' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            border: mainTab === 'registration' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Roster Registration & Status
                    </button>
                    {userRole !== 'coach' && (
                        <button
                            onClick={() => setMainTab('data')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '700',
                                background: mainTab === 'data' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: mainTab === 'data' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                border: mainTab === 'data' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Performance Log Entries
                        </button>
                    )}
                    {userRole === 'coach' && (
                        <button
                            onClick={() => setMainTab('matchday')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '700',
                                background: mainTab === 'matchday' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: mainTab === 'matchday' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                border: mainTab === 'matchday' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Matchday Squad
                        </button>
                    )}
                    {liveMatch && userRole === 'coach' && (
                        <button
                            onClick={() => setMainTab('live')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '800',
                                background: mainTab === 'live' ? 'rgba(244,63,94,0.15)' : 'transparent',
                                color: mainTab === 'live' ? 'var(--danger)' : 'var(--text-secondary)',
                                border: mainTab === 'live' ? '1px solid rgba(244,63,94,0.3)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }}></span>
                            LIVE MATCH
                        </button>
                    )}
                    <button
                        onClick={() => setMainTab('standings')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: mainTab === 'standings' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: mainTab === 'standings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            border: mainTab === 'standings' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        League Standings
                    </button>
                </div>

                {userRole !== 'coach' && (
                    <button
                        onClick={() => setShowCreateSquad(true)}
                        style={{
                            padding: '8px 18px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)',
                            color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                        }}
                    >
                        Initialize New Squad
                    </button>
                )}
            </div>

            {mainTab === 'stats_hub' && (
                <CoachPostGameStatsHub
                    schoolId={schoolId}
                    selectedClassroom={selectedClassroom}
                    matches={matches}
                    students={students}
                    allTeams={allTeams}
                    schools={schools}
                    allPlayers={allPlayers}
                    year={year}
                    term={term}
                    onStudentClick={onStudentClick}
                    activeAlerts={activeAlerts}
                    handleDismiss={handleDismiss}
                />
            )}

            {mainTab === 'registration' && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Roster Registration Panel</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Submit player details to the league for eligibility approval.</p>
                        </div>
                        <button
                            onClick={() => setShowRegisterPlayer(true)}
                            style={{
                                padding: '8px 20px', borderRadius: '20px', background: 'var(--primary)',
                                color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                            }}
                        >
                            Register New Player
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: 'var(--border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Jersey # & Player</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Position</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>DOB</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Foot</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Emergency Contact</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Approval Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(player => {
                                const status = player.status || 'approved';
                                return (
                                    <tr key={player.id} style={{ borderBottom: 'var(--border)' }}>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800'
                                                }}>
                                                    {player.jerseyNumber || '-'}
                                                </div>
                                                {player.name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>{player.position || '—'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{player.dob || '—'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{player.preferredFoot || '—'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>{player.emergencyContact || '—'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px',
                                                    background: status === 'approved' ? 'var(--success-dim)' : status === 'rejected' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                                                    color: status === 'approved' ? 'var(--success)' : status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                                                    border: status === 'approved' ? '1px solid rgba(16,185,129,0.2)' : status === 'rejected' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)'
                                                }}>
                                                    {status}
                                                </span>
                                                {status === 'rejected' && player.rejectionReason && (
                                                    <span style={{ fontSize: '10px', color: 'var(--danger)', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={player.rejectionReason}>
                                                        {player.rejectionReason}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {mainTab === 'data' && (
                <div style={{ width: '100%' }}>
                    <DataEntryPanel
                        students={students}
                        year={year}
                        term={term}
                        subjects={subjects}
                        settings={settings}
                        onDataUpdate={onDataUpdate}
                        onRemoveSubject={onRemoveSubject}
                        onRemoveStudent={onRemoveStudent}
                        onStudentClick={onStudentClick}
                        onAddSubjectClick={onAddSubjectClick}
                        onOpenLogShotModal={onOpenLogShotModal}
                    />
                </div>
            )}

            {mainTab === 'matchday' && userRole === 'coach' && (
                <MatchdaySquadSelection
                    matches={matches}
                    schoolId={schoolId}
                    allPlayers={allPlayers}
                    allTeams={allTeams}
                    schools={schools}
                    onUpdateMatch={onUpdateMatch}
                />
            )}

            {mainTab === 'live' && liveMatch && userRole === 'coach' && (
                <CoachLiveManagement
                    match={liveMatch}
                    teamId={selectedClassroom}
                    allPlayers={allPlayers}
                    year={year}
                    onUpdateMatch={onUpdateMatch}
                />
            )}

            {mainTab === 'standings' && (
                <LeagueTable matches={matches} teams={allTeams} schools={schools} />
            )}

            {/* Modals */}
            {showRegisterPlayer && (
                <RegisterPlayerModal
                    onAdd={(newPlayer) => {
                        onAddPlayer(newPlayer);
                        setShowRegisterPlayer(false);
                    }}
                    onClose={() => setShowRegisterPlayer(false)}
                    existingNames={students.map(s => s.name)}
                />
            )}

            {showCreateSquad && (
                <CreateSquadModal
                    schoolId={schoolId}
                    schools={schools}
                    onAdd={(newSquad) => {
                        onAddTeam(newSquad);
                        setShowCreateSquad(false);
                    }}
                    onClose={() => setShowCreateSquad(false)}
                    existingSquads={allTeams}
                />
            )}
        </div>
    );
}
