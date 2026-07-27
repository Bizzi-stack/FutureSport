import { useMemo } from 'react';
import {
    HubCard, SectionHeader, scoreColor,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ReferenceLine,
    BarChart, Bar, Cell, Legend,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, SCHOOLS, TEAMS } from '../../data/mockData';

const SCHOOL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#0ea5e9', '#fb923c'];

function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: '180px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: d.color, marginBottom: '6px' }}>{d.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avg "Games Played":</span>
                    <span style={{ fontWeight: '700', color: '#10b981' }}>{d.gamesPlayed.toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>Avg Grade:</span>
                    <span style={{ fontWeight: '700', color: '#3b82f6' }}>{d.grade.toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>Students:</span>
                    <span style={{ fontWeight: '700', color: '#f59e0b' }}>{d.count}</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function NationalBehaviorTab({ year, term }) {

    // Scatter data: Games Played vs Performance per form per school
    const attendanceGradeData = useMemo(() => {
        const data = [];
        SCHOOLS.forEach((sch, idx) => {
            for (let g = 1; g <= 5; g++) {
                const students = ALL_STUDENTS.filter(s => {
                    if (s.schoolId !== sch.id) return false;
                    const c = TEAMS.find(teamObj => teamObj.id === s.teamAssignments?.[year]);
                    return c && c.gradeNum === g;
                });
                
                if (!students.length) continue;

                let totalAtt = 0, attCount = 0;
                let totalGrade = 0, gradeCount = 0;

                students.forEach(s => {
                    const att = s.matchStats?.[year]?.[term]?.gamesPlayed;
                    if (att != null) { totalAtt += att; attCount++; }
                    
                    const grade = getOverall(s, year, term);
                    if (grade > 0) { totalGrade += grade; gradeCount++; }
                });

                if (attCount > 0 && gradeCount > 0) {
                    data.push({
                        id: `${sch.id}-F${g}`,
                        name: `${sch.name} (Form ${g})`,
                        school: sch.name,
                        form: g,
                        color: SCHOOL_COLORS[idx % SCHOOL_COLORS.length],
                        gamesPlayed: totalAtt / attCount,
                        grade: totalGrade / gradeCount,
                        count: students.length,
                    });
                }
            }
        });
        return data;
    }, [year, term]);

    const xMed = attendanceGradeData.length ? attendanceGradeData.reduce((a, s) => a + s.gamesPlayed, 0) / attendanceGradeData.length : 90;
    const yMed = attendanceGradeData.length ? attendanceGradeData.reduce((a, s) => a + s.grade, 0) / attendanceGradeData.length : 60;

    // Discipline data: minutes played and yellow cards per school
    const disciplineData = useMemo(() => {
        return SCHOOLS.map((sch, idx) => {
            const students = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[year]);
            let totalLates = 0, totalIncidents = 0, bCount = 0;
            
            students.forEach(s => {
                const b = s.matchStats?.[year]?.[term];
                if (b) {
                    totalLates += b.minutesPlayed;
                    totalIncidents += b.yellowCards;
                    bCount++;
                }
            });

            return {
                id: sch.id,
                name: sch.name,
                color: SCHOOL_COLORS[idx % SCHOOL_COLORS.length],
                avgLates: bCount ? (totalLates / bCount) : 0,
                avgIncidents: bCount ? (totalIncidents / bCount) : 0,
            };
        });
    }, [year, term]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ResizableHSplit
                defaultSplit={60} min={40} max={70} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="Systemic Games Played vs Outcomes" infoKey="national-gamesPlayed" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Each dot represents a specific Form (e.g., School A U16). X-Axis is average gamesPlayed, Y-Axis is average grade.
                            Identifies systemic welfare impact on academic success.
                        </p>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis type="number" dataKey="gamesPlayed" domain={['auto', 100]} tick={{ fontSize: 10, fill: '#64748b' }} 
                                        label={{ value: 'Average Games Played %', position: 'bottom', offset: 0, fill: '#10b981', fontSize: 11 }} />
                                    <YAxis type="number" dataKey="grade" domain={[40, 90]} tick={{ fontSize: 10, fill: '#64748b' }} 
                                        label={{ value: 'Average Grade %', angle: -90, position: 'insideLeft', offset: 10, fill: '#3b82f6', fontSize: 11 }} />
                                    <ZAxis type="number" dataKey="count" range={[60, 300]} />
                                    <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                                    
                                    <ReferenceLine x={xMed} stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" />
                                    <ReferenceLine y={yMed} stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" />
                                    
                                    {SCHOOLS.map((sch, i) => {
                                        const pts = attendanceGradeData.filter(d => d.school === sch.name);
                                        return pts.length > 0 && (
                                            <Scatter key={sch.id} name={sch.name} data={pts} fill={SCHOOL_COLORS[i % SCHOOL_COLORS.length]} fillOpacity={0.8} />
                                        );
                                    })}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="National Discipline Overview" infoKey="national-discipline" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Average yellow cards and minutes played per student, by school.
                        </p>
                        <div style={{ width: '100%', height: 380 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={disciplineData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#cbd5e1' }} width={110} />
                                    <Tooltip {...TT_STYLE} formatter={(v) => [v.toFixed(2), 'Avg per Student']} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="avgLates" name="Minutes Played" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="avgIncidents" name="Yellow Cards" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
            />
        </div>
    );
}
