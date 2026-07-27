import { useMemo } from 'react';
import {
    HubCard, SectionHeader, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line,
    ResizableHSplit,
} from './hub/HubShared';
import { TEAMS } from '../data/mockData';

function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

export default function PrincipalDashboard({ allStudents, selectedSchool, year, term }) {

    // ── School-wide Cohort Performance ──
    const cohortData = useMemo(() => {
        const data = [];
        for (let g = 1; g <= 5; g++) {
            const students = allStudents.filter(s => {
                if (s.schoolId !== selectedSchool) return false;
                const c = TEAMS.find(teamObj => teamObj.id === s.teamAssignments?.[year]);
                return c && c.gradeNum === g;
            });
            
            const avgs = students.map(s => getOverall(s, year, term)).filter(v => v > 0);
            const avgGrade = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
            
            let totalAtt = 0, attCount = 0;
            students.forEach(s => {
                const att = s.matchStats?.[year]?.[term]?.gamesPlayed;
                if (att != null) { totalAtt += att; attCount++; }
            });

            data.push({
                form: `Form ${g}`,
                grade: avgGrade,
                gamesPlayed: attCount ? Math.round(totalAtt / attCount) : 0,
                studentCount: students.length,
            });
        }
        return data;
    }, [allStudents, selectedSchool, year, term]);

    // ── Cohort Drawdown (Largest Year-over-Year drops) ──
    // Simply comparing Form N to Form N-1
    const drawdownData = useMemo(() => {
        const data = [];
        for (let g = 2; g <= 5; g++) {
            const currentForm = cohortData.find(d => d.form === `Form ${g}`);
            const prevForm = cohortData.find(d => d.form === `Form ${g - 1}`);
            
            if (currentForm && prevForm && currentForm.grade > 0 && prevForm.grade > 0) {
                data.push({
                    name: `F${g-1} → F${g}`,
                    drop: currentForm.grade - prevForm.grade, // Negative means a drop
                });
            }
        }
        return data;
    }, [cohortData]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 8px', width: '100%' }}>
            
            {/* Top Stat Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <HubCard>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Total Enrollment</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#e2e8f0', marginTop: '4px' }}>
                        {cohortData.reduce((a, b) => a + b.studentCount, 0)}
                    </div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Academy Average</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6', marginTop: '4px' }}>
                        {Math.round(cohortData.reduce((a, b) => a + b.grade * b.studentCount, 0) / (cohortData.reduce((a, b) => a + b.studentCount, 0) || 1))}
                    </div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Academy Games Played</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                        {Math.round(cohortData.reduce((a, b) => a + b.gamesPlayed * b.studentCount, 0) / (cohortData.reduce((a, b) => a + b.studentCount, 0) || 1))} matches
                    </div>
                </HubCard>
            </div>

            <ResizableHSplit
                defaultSplit={60} min={40} max={70} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="Cohort Rating & Games Played Pulse" infoKey="principal-pulse" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Aggregated rating and matches played metrics across the entire academy.
                        </p>
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cohortData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="form" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis yAxisId="left" domain={[40, 90]} tick={{ fontSize: 10, fill: '#3b82f6' }} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 38]} tick={{ fontSize: 10, fill: '#10b981' }} />
                                    <Tooltip {...TT_STYLE} formatter={(v, n) => [n === 'grade' ? v : `${v} matches`, n === 'grade' ? 'Average Rating' : 'Games Played']} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="grade" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="gamesPlayed" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Cohort Shift Analysis" infoKey="principal-drawdown" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Tracking performance shifts between consecutive squads to isolate developmental friction points.
                        </p>
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={drawdownData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#cbd5e1' }} width={80} />
                                    <Tooltip {...TT_STYLE} formatter={(v) => [v.toFixed(1), 'Rating Shift']} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="drop" name="Performance Shift" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
            />
        </div>
    );
}
