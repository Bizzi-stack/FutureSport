import { useMemo } from 'react';
import {
    HubCard, SectionHeader, Empty, ScoreBar, scoreColor, RankBadge,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis,
    LineChart, Line,
    ResizableHSplit, ResizableVSplit,
} from './HubShared';

import { ALL_STUDENTS, TEAMS, SUBJECTS, AGE_GROUPS, SPORTS_EXTRACURRICULARS, YEARS } from '../../data/mockData';

function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

// ── Sports Tab — Athlete Academic Performance ─────────────────────────
export function SportsTab({ year, term, onStudentClick }) {
    const activeStudents = useMemo(() =>
        (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id)),
    [year]);

    // Split athletes (1+ sports club) vs non-athletes
    const { athletes, nonAthletes } = useMemo(() => {
        const athletes = [], nonAthletes = [];
        for (const s of activeStudents) {
            const sportCount = (s.extracurriculars ?? []).filter(e => SPORTS_EXTRACURRICULARS.includes(e.name)).length;
            (sportCount > 0 ? athletes : nonAthletes).push({ ...s, sportCount });
        }
        return { athletes, nonAthletes };
    }, [activeStudents]);

    const avg = (arr, fn) => {
        const vals = arr.map(fn).filter(v => v > 0);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    };

    const athleteAvg    = avg(athletes,    s => getOverall(s, year, term));
    const nonAthleteAvg = avg(nonAthletes, s => getOverall(s, year, term));
    const atRiskAthletes = athletes.filter(s => { const a = getOverall(s, year, term); return a > 0 && a < 55; });

    // Subject comparison: athletes vs non-athletes
    const subjectComparison = useMemo(() =>
        SUBJECTS.filter(sub => sub !== 'P.E.').map(sub => ({
            subject: sub,
            Athletes:    avg(athletes,    s => s.performance?.[year]?.[term]?.[sub] ?? 0),
            'Non-athletes': avg(nonAthletes, s => s.performance?.[year]?.[term]?.[sub] ?? 0),
        })),
    [athletes, nonAthletes, year, term]);

    // Radar: athletes vs non-athletes
    const radarComparison = useMemo(() =>
        SUBJECTS.filter(s => s !== 'P.E.').map(sub => ({
            subject: sub,
            Athletes:    avg(athletes,    s => s.performance?.[year]?.[term]?.[sub] ?? 0),
            'Non-athletes': avg(nonAthletes, s => s.performance?.[year]?.[term]?.[sub] ?? 0),
        })),
    [athletes, nonAthletes, year, term]);

    // Academic leaderboard of athletes
    const athleteLeaderboard = useMemo(() =>
        athletes
            .map(s => ({ ...s, academicAvg: getOverall(s, year, term) }))
            .filter(s => s.academicAvg > 0)
            .sort((a, b) => b.academicAvg - a.academicAvg)
            .slice(0, 10),
    [athletes, year, term]);

    // Multi-sport athletes with academic avg
    const multiSport = useMemo(() =>
        athletes
            .filter(s => s.sportCount >= 2)
            .map(s => ({ ...s, academicAvg: getOverall(s, year, term) }))
            .filter(s => s.academicAvg > 0)
            .sort((a, b) => b.sportCount - a.sportCount || b.academicAvg - a.academicAvg)
            .slice(0, 9),
    [athletes, year, term]);

    const diff = athleteAvg - nonAthleteAvg;
    const diffColor = diff >= 0 ? '#10b981' : '#ef4444';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                {[
                    { label: 'Total Athletes',       value: athletes.length,    color: '#3b82f6' },
                    { label: 'Athlete Academic Avg', value: `${athleteAvg}%`,   color: scoreColor(athleteAvg) },
                    { label: 'School Avg (non-athlete)', value: `${nonAthleteAvg}%`, color: scoreColor(nonAthleteAvg) },
                    { label: 'Vs Non-athletes',      value: `${diff >= 0 ? '+' : ''}${diff}%`, color: diffColor },
                ].map(k => (
                    <HubCard key={k.label}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>{k.label}</div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: k.color }}>{k.value}</div>
                    </HubCard>
                ))}
            </div>

            {/* Athletes at academic risk callout */}
            {atRiskAthletes.length > 0 && (
                <HubCard style={{ borderLeft: '3px solid #ef4444', flex: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px' }}>Athletes at Academic Risk</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{atRiskAthletes.length} student{atRiskAthletes.length !== 1 ? 's' : ''} with overall average below 55% — may need academic support.</div>
                        </div>
                        <span style={{ fontSize: '22px', fontWeight: '900', color: '#ef4444', flexShrink: 0 }}>{atRiskAthletes.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {atRiskAthletes.map(s => {
                            const a = getOverall(s, year, term);
                            return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.15)' }}>
                                    <span className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ fontSize: '12px', fontWeight: '600' }}>{s.name}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444' }}>{a}%</span>
                                </div>
                            );
                        })}
                    </div>
                </HubCard>
            )}

            {/* Subject comparison bar */}
            <HubCard>
                <SectionHeader title="Academic Performance by Subject — Athletes vs Non-athletes" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Comparing average scores across all academic subjects for student-athletes vs students not enrolled in sports clubs.</p>
                <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={subjectComparison} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip {...TT_STYLE} formatter={v => [`${v}%`]} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                        <Bar dataKey="Athletes"     fill="#3b82f6" radius={[3,3,0,0]} fillOpacity={0.85} />
                        <Bar dataKey="Non-athletes" fill="#64748b" radius={[3,3,0,0]} fillOpacity={0.55} />
                    </BarChart>
                </ResponsiveContainer>
            </HubCard>

            <ResizableHSplit
                defaultSplit={50} min={25} max={75}
                left={
                    <HubCard>
                        <SectionHeader title="Subject Profile Comparison (Radar)" />
                        <div style={{ flex: 1, minHeight: 300, width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarComparison}>
                                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Radar name="Athletes"     dataKey="Athletes"     stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.14} strokeWidth={2.5} />
                                    <Radar name="Non-athletes" dataKey="Non-athletes" stroke="#64748b" fill="#64748b" fillOpacity={0.08} strokeWidth={1.5} />
                                    <Tooltip {...TT_STYLE} formatter={v => [`${v}%`]} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ flexShrink: 0, paddingBottom: '5px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                                Athletes
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
                                Non-athletes
                            </div>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Top Academic Athletes" count={athleteLeaderboard.length} />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Students enrolled in sports clubs, ranked by overall academic average.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {athleteLeaderboard.map((s, i) => (
                                <div key={s.id} style={{
                                    padding: '8px 10px', borderRadius: '7px',
                                    background: i < 3 ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <RankBadge rank={i} />
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.sportCount} sport{s.sportCount !== 1 ? 's' : ''}</div>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: scoreColor(s.academicAvg), flexShrink: 0 }}>{s.academicAvg}%</span>
                                    </div>
                                    <div style={{ paddingLeft: '30px' }}>
                                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${s.academicAvg}%`, background: scoreColor(s.academicAvg), borderRadius: '99px', opacity: 0.8, transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
            />


            {/* Multi-sport athlete academic cards */}
            {multiSport.length > 0 && (
                <HubCard>
                    <SectionHeader title="Multi-Sport Athletes — Academic Overview" count={multiSport.length} />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Students enrolled in 2 or more sports clubs, with their overall academic average and risk status.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '10px' }}>
                        {multiSport.map(s => {
                            const isAtRisk = s.academicAvg < 55 && s.academicAvg > 0;
                            return (
                                <div key={s.id} style={{
                                    padding: '12px 14px', borderRadius: '8px',
                                    background: isAtRisk ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isAtRisk ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <span className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ fontWeight: '700', fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                        <span style={{ fontSize: '13px', fontWeight: '900', color: scoreColor(s.academicAvg), marginLeft: '8px', flexShrink: 0 }}>{s.academicAvg}%</span>
                                    </div>
                                    <ScoreBar score={s.academicAvg} />
                                    {isAtRisk && (
                                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#ef4444' }}>
                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444' }} />
                                            Academic support needed
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                                        {(s.extracurriculars ?? []).filter(e => SPORTS_EXTRACURRICULARS.includes(e.name)).map(sp => (
                                            <span key={sp.name} style={{ fontSize: '10px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '2px 7px', borderRadius: '99px', fontWeight: '600' }}>
                                                {sp.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </HubCard>
            )}
        </div>
    );
}

// ── Year Groups Tab ──────────────────────────────────────────────────
export function YearGroupsTab({ year, term, onStudentClick }) {
    const gradeStats = useMemo(() =>
        AGE_GROUPS.map((g, i) => {
            const students = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => g.classes.includes(s.teamAssignments?.[year]));
            if (!students.length) return null;
            const avgs = students.map(s => getOverall(s, year, term)).filter(v => v > 0);
            const avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
            const subjectProfile = SUBJECTS.map(sub => {
                const vals = students.map(s => s.performance?.[year]?.[term]?.[sub] ?? 0).filter(v => v > 0);
                return { subject: sub, value: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0 };
            });
            const top = students.map(s => ({ ...s, avg: getOverall(s, year, term) })).sort((a, b) => b.avg - a.avg)[0];
            const atRisk = students.filter(s => { const a = getOverall(s, year, term); return a > 0 && a < 55; }).length;
            return { ...g, avg, students: students.length, atRisk, subjectProfile, top, color: CHART_COLORS[i] };
        }).filter(Boolean),
    [year, term]);

    const progressionData = useMemo(() =>
        YEARS.map(yr => {
            const obj = { year: yr.slice(2) };
            for (const g of AGE_GROUPS) {
                const students = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => g.classes.includes(s.teamAssignments?.[yr]));
                const avgs = students.map(s => getOverall(s, yr, 'Term 1')).filter(v => v > 0);
                obj[g.grade] = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
            }
            return obj;
        }),
    []);

    const radarData = useMemo(() => {
        if (!gradeStats.length) return [];
        return SUBJECTS.map(sub => {
            const obj = { subject: sub };
            for (const g of gradeStats) {
                const row = g.subjectProfile.find(p => p.subject === sub);
                obj[g.grade] = row?.value ?? 0;
            }
            return obj;
        });
    }, [gradeStats]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '12px' }}>
                {gradeStats.map(g => (
                    <HubCard key={g.grade} style={{ borderTop: `2px solid ${g.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '14px' }}>{g.grade}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{g.classes.length} classes · {g.students} students</div>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: scoreColor(g.avg) }}>{g.avg}%</span>
                        </div>
                        <ScoreBar score={g.avg} />
                        {g.atRisk > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ef4444' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                {g.atRisk} at risk
                            </div>
                        )}
                        {g.top && (
                            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', fontWeight: '700' }}>Top Student</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="clickable-name" onClick={() => onStudentClick?.(g.top)} style={{ fontSize: '12px', fontWeight: '600' }}>{g.top.name}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#3b82f6' }}>{g.top.avg}%</span>
                                </div>
                            </div>
                        )}
                    </HubCard>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <HubCard>
                    <SectionHeader title="Subject Profile by Form (Radar)" />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Larger spokes indicate stronger average performance in that subject.</p>
                    <div style={{ flex: 1, minHeight: 300, width: '100%', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                                {gradeStats.map((g, i) => (
                                    <Radar key={g.grade} name={g.grade} dataKey={g.grade} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.08} strokeWidth={1.5} />
                                ))}
                                <Tooltip {...TT_STYLE} formatter={v => [`${v}%`]} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ flexShrink: 0, paddingBottom: '5px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
                        {gradeStats.map((g, i) => (
                            <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: CHART_COLORS[i], borderRadius: '2px' }}></div>
                                {g.grade}
                            </div>
                        ))}
                    </div>
                </HubCard>

                <HubCard>
                    <SectionHeader title="Form Average — Year on Year (Term 1)" />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Tracks how each grade's Term 1 average has changed across all five academic years.</p>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={progressionData} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={12} />
                            <YAxis domain={[30, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip {...TT_STYLE} formatter={v => v != null ? [`${v}%`] : ['-']} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} />
                            {gradeStats.map((g, i) => (
                                <Line key={g.grade} type="monotone" dataKey={g.grade} stroke={CHART_COLORS[i]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0 }} connectNulls />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </HubCard>
            </div>

        </div>
    );
}

// ── Heatmap Tab ──────────────────────────────────────────────────────
export function HeatmapTab({ year, term }) {
    const data = useMemo(() =>
        TEAMS.map(teamObj => {
            const students = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => s.teamAssignments?.[year] === teamObj.id);
            if (!students.length) return null;
            const row = { class: teamObj.name };
            for (const sub of SUBJECTS) {
                const vals = students.map(s => s.performance?.[year]?.[term]?.[sub] ?? 0).filter(v => v > 0);
                row[sub] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            }
            return row;
        }).filter(Boolean),
    [year, term]);

    function cellBg(val) {
        if (val === 0) return 'rgba(255,255,255,0.02)';
        if (val >= 80) return `rgba(16,185,129,${0.12 + (val - 80) * 0.008})`;
        if (val >= 65) return `rgba(245,158,11,${0.1  + (val - 65) * 0.006})`;
        return             `rgba(239,68,68,${0.1  + (70  - val) * 0.006})`;
    }

    function cellTextColor(val) {
        if (val >= 65) return '#cbd5e1';
        return '#fca5a5';
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <HubCard>
                <SectionHeader title="Class × Subject Score Heatmap" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Class average per subject. Green = strong, amber = average, red = needs attention.
                </p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Class</th>
                                {SUBJECTS.map(s => (
                                    <th key={s} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{s}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(row => (
                                <tr key={row.class}>
                                    <td style={{ padding: '8px 12px', fontWeight: '700', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{row.class}</td>
                                    {SUBJECTS.map(sub => {
                                        const v = row[sub] ?? 0;
                                        return (
                                            <td key={sub}
                                                title={`${row.class} – ${sub}: ${v}%`}
                                                style={{
                                                    padding: '8px 10px', textAlign: 'center',
                                                    background: cellBg(v),
                                                    color: cellTextColor(v),
                                                    fontWeight: '700', fontSize: '11px',
                                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                    cursor: 'default',
                                                }}>
                                                {v > 0 ? `${v}%` : '—'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</span>
                    {[['≥ 80%', '#10b981'], ['65–79%', '#f59e0b'], ['< 65%', '#ef4444']].map(([label, color]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', background: color, borderRadius: '2px', opacity: 0.55 }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                        </div>
                    ))}
                </div>
            </HubCard>

            <HubCard>
                <SectionHeader title="Strongest and Weakest Subject per Class" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1, alignContent: 'stretch' }}>
                    {data.map(row => {
                        const entries = SUBJECTS.map(s => ({ s, v: row[s] ?? 0 })).filter(e => e.v > 0).sort((a, b) => b.v - a.v);
                        const best = entries[0];
                        const worst = entries[entries.length - 1];
                        return (
                            <div key={row.class} style={{ flex: '1 1 calc(20% - 10px)', minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px', color: 'var(--text-secondary)' }}>{row.class}</div>
                                {best && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Strongest: <strong style={{ color: '#10b981' }}>{best.s}</strong> {best.v}%</span>
                                    </div>
                                )}
                                {worst && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Weakest: <strong style={{ color: '#ef4444' }}>{worst.s}</strong> {worst.v}%</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </HubCard>
        </div>
    );
}

