import { useMemo } from 'react';
import {
    HubCard, SectionHeader,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, SCHOOLS, TEAMS, YEARS } from '../../data/mockData';

const SCHOOL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#0ea5e9', '#fb923c'];

function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

export default function NationalCohortTab({ year, term }) {

    // ── Squad Distribution Data ───────────────────────────────────────
    // How many players in each squad, per club, for the current year
    const formDistributionData = useMemo(() => {
        return SCHOOLS.map((sch, idx) => {
            const schStudents = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[year]);
            const formCounts = { U14: 0, U16: 0, U19: 0 };
            
            schStudents.forEach(s => {
                const cId = s.teamAssignments[year];
                const c = TEAMS.find(teamObj => teamObj.id === cId);
                if (c) {
                    if (c.gradeNum === 1) formCounts.U14++;
                    else if (c.gradeNum === 2) formCounts.U16++;
                    else if (c.gradeNum === 3) formCounts.U19++;
                }
            });

            return {
                name: sch.name,
                color: SCHOOL_COLORS[idx % SCHOOL_COLORS.length],
                'U14': formCounts.U14,
                'U16': formCounts.U16,
                'U19': formCounts.U19,
                total: schStudents.length,
            };
        });
    }, [year]);

    // ── 5-Year Enrollment Trends ─────────────────────────────────────
    const enrollmentData = useMemo(() => {
        return YEARS.map(y => {
            const dataPoint = { yearLabel: y.slice(2, 4) + '/' + y.slice(7, 9) };
            SCHOOLS.forEach(sch => {
                const count = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[y]).length;
                dataPoint[sch.name] = count || null;
            });
            return dataPoint;
        });
    }, []);

    // ── Squad Ratings Progression ──────────────────────────
    // Compares the average rating of U14 vs U16 vs U19 squads for each club
    const gradeProgressionData = useMemo(() => {
        const data = [];
        for (let g = 1; g <= 3; g++) {
            const point = { squad: g === 1 ? 'U14' : g === 2 ? 'U16' : 'U19' };
            SCHOOLS.forEach(sch => {
                const students = ALL_STUDENTS.filter(s => {
                    if (s.schoolId !== sch.id) return false;
                    const c = TEAMS.find(teamObj => teamObj.id === s.teamAssignments?.[year]);
                    return c && c.gradeNum === g;
                });
                
                const avgs = students.map(s => getOverall(s, year, term)).filter(v => v > 0);
                point[sch.name] = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
            });
            data.push(point);
        }
        return data;
    }, [year, term]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ── Enrollment Trends ─────────────────────────────────────── */}
            <HubCard>
                <SectionHeader title="5-Year Academy Enrollment Trends" infoKey="national-enrollment" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                    Tracking the total player population capacity across academies over time.
                </p>
                <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={enrollmentData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="yearLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                            <Tooltip {...TT_STYLE} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            {SCHOOLS.map((sch, i) => (
                                <Line key={sch.id} type="monotone" dataKey={sch.name} stroke={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </HubCard>

            <ResizableHSplit
                defaultSplit={50} min={30} max={70} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="Academy Cohort Demographic Shapes" infoKey="national-demographics" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Visualizing the internal demographic structure of each club/academy.
                        </p>
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formDistributionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip {...TT_STYLE} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="U14" stackId="a" fill="#3b82f6" />
                                    <Bar dataKey="U16" stackId="a" fill="#10b981" />
                                    <Bar dataKey="U19" stackId="a" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Cross-Sectional Rating Progression" infoKey="national-progression" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Comparing average performance by squad group (U14, U16, U19).
                        </p>
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={gradeProgressionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="squad" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis domain={[40, 90]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip {...TT_STYLE} formatter={v => [`${v}%`]} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    {SCHOOLS.map((sch, i) => (
                                        <Line key={sch.id} type="monotone" dataKey={sch.name} stroke={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
            />
        </div>
    );
}
