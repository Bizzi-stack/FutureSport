import { useMemo } from 'react';
import {
    HubCard, SectionHeader, scoreColor,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ReferenceLine,
    BarChart, Bar, Cell,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, SCHOOLS, SUBJECTS, STEM_SUBJECTS, HUMANITIES } from '../../data/mockData';

const SCHOOL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#0ea5e9', '#fb923c'];

function getAvg(gradesObj, subjectsArr) {
    if (!gradesObj) return 0;
    const vals = subjectsArr.map(s => gradesObj[s]).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: '180px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: d.color, marginBottom: '6px' }}>{d.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Attacking Avg:</span>
                    <span style={{ fontWeight: '700', color: '#10b981' }}>{d.x.toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>Defending Avg:</span>
                    <span style={{ fontWeight: '700', color: '#3b82f6' }}>{d.y.toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>Bias:</span>
                    <span style={{ fontWeight: '700', color: '#f59e0b' }}>{(d.x - d.y) > 0 ? `+${(d.x - d.y).toFixed(1)} Attacking` : `+${(d.y - d.x).toFixed(1)} Defending`}</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function NationalSubjectTab({ year, term }) {

    const schoolDomainData = useMemo(() => {
        return SCHOOLS.map((sch, idx) => {
            const students = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[year]);
            let totalStem = 0, stemCount = 0;
            let totalHum = 0, humCount = 0;
            
            const subjectAverages = {};
            SUBJECTS.forEach(sub => {
                const subScores = students.map(s => s.performance?.[year]?.[term]?.[sub]).filter(v => v > 0);
                subjectAverages[sub] = subScores.length ? subScores.reduce((a, b) => a + b, 0) / subScores.length : 0;
            });

            students.forEach(s => {
                const stemAvg = getAvg(s.performance?.[year]?.[term], STEM_SUBJECTS);
                const humAvg = getAvg(s.performance?.[year]?.[term], HUMANITIES);
                if (stemAvg > 0) { totalStem += stemAvg; stemCount++; }
                if (humAvg > 0) { totalHum += humAvg; humCount++; }
            });

            const x = stemCount ? totalStem / stemCount : 0;
            const y = humCount ? totalHum / humCount : 0;

            return {
                id: sch.id,
                name: sch.name,
                color: SCHOOL_COLORS[idx % SCHOOL_COLORS.length],
                x, y,
                subjectAverages,
                studentCount: students.length,
            };
        });
    }, [year, term]);

    // Calculate domain medians for quadrants
    const xMed = schoolDomainData.length ? schoolDomainData.reduce((a, s) => a + s.x, 0) / schoolDomainData.length : 50;
    const yMed = schoolDomainData.length ? schoolDomainData.reduce((a, s) => a + s.y, 0) / schoolDomainData.length : 50;

    // Leaderboard by Subject Data
    const subjectLeaderboard = useMemo(() => {
        return SUBJECTS.map(sub => {
            const scores = schoolDomainData.map(sch => ({ name: sch.name, score: sch.subjectAverages[sub] || 0, color: sch.color }));
            scores.sort((a, b) => b.score - a.score);
            return { subject: sub, top: scores[0], bottom: scores[scores.length - 1], avg: scores.reduce((a, b) => a + b.score, 0) / Math.max(1, scores.length) };
        });
    }, [schoolDomainData]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ResizableHSplit
                defaultSplit={55} min={40} max={70} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="Attacking vs Defending Specialization" infoKey="national-domains" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Maps institutional biases. X-Axis is the academy's average across Attacking metrics; Y-Axis is Defending. 
                            Academies above the diagonal line are Defending-focused; below are Attacking-focused.
                        </p>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis type="number" dataKey="x" domain={[40, 90]} tick={{ fontSize: 10, fill: '#64748b' }} 
                                        label={{ value: 'Attacking Average', position: 'bottom', offset: 0, fill: '#10b981', fontSize: 11 }} />
                                    <YAxis type="number" dataKey="y" domain={[40, 90]} tick={{ fontSize: 10, fill: '#64748b' }} 
                                        label={{ value: 'Defending Average', angle: -90, position: 'insideLeft', offset: 10, fill: '#3b82f6', fontSize: 11 }} />
                                    <ZAxis range={[150, 400]} />
                                    <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                                    
                                    <ReferenceLine x={xMed} stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" />
                                    <ReferenceLine y={yMed} stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" />
                                    
                                    {schoolDomainData.map(sch => (
                                        <Scatter key={sch.id} name={sch.name} data={[sch]} fill={sch.color} fillOpacity={0.8} />
                                    ))}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="National Metric Benchmarks" infoKey="national-benchmarks" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Top performing academy in each metric compared to the national average.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                            {subjectLeaderboard.map(sl => (
                                <div key={sl.subject} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#e2e8f0' }}>{sl.subject}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Natl Avg: {sl.avg.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div style={{ width: '4px', height: '32px', background: sl.top.color, borderRadius: '2px' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader</div>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: sl.top.color }}>{sl.top.name}</div>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: scoreColor(sl.top.score) }}>
                                            {sl.top.score.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
            />
        </div>
    );
}
