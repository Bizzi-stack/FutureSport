import { useMemo, useState } from 'react';
import CustomSelect from '../CustomSelect';
import {
    HubCard, SectionHeader, Empty, ScoreBar, scoreColor, RankBadge,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, SUBJECTS, STEM_SUBJECTS } from '../../data/mockData';

function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

function getSubAvg(s, year, term, subs) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = subs.map(sub => g[sub]).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

const selStyle = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none',
};

// ── Class Compare Tab ────────────────────────────────────────────────
export function ClassCompareTab({ year, term }) {
    const [classA, setClassA] = useState(TEAMS[0].id);
    const [classB, setClassB] = useState(TEAMS[2].id);

    function buildStats(teamId) {
        const students = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => s.teamAssignments?.[year] === teamId);
        if (!students.length) return null;
        const radarData = SUBJECTS.map(sub => {
            const vals = students.map(s => s.performance?.[year]?.[term]?.[sub] ?? 0).filter(v => v > 0);
            return { subject: sub, value: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0 };
        });
        const overall = radarData.length ? Math.round(radarData.reduce((a, b) => a + b.value, 0) / radarData.length) : 0;
        return { students: students.length, radarData, overall };
    }

    const statA = useMemo(() => buildStats(classA), [classA, year, term]);
    const statB = useMemo(() => buildStats(classB), [classB, year, term]);
    const clsA = TEAMS.find(c => c.id === classA);
    const clsB = TEAMS.find(c => c.id === classB);

    const radarMerged = useMemo(() => {
        if (!statA || !statB) return [];
        return statA.radarData.map((d, i) => ({
            subject: d.subject,
            [clsA?.name]: d.value,
            [clsB?.name]: statB.radarData[i]?.value ?? 0,
        }));
    }, [statA, statB, clsA, clsB]);

    const barData = useMemo(() => {
        if (!statA || !statB) return [];
        return statA.radarData.map((d, i) => ({
            subject: d.subject,
            [clsA?.name]: d.value,
            [clsB?.name]: statB.radarData[i]?.value ?? 0,
        }));
    }, [statA, statB, clsA, clsB]);

    const winner = statA && statB
        ? statA.overall > statB.overall ? clsA?.name
            : statB.overall > statA.overall ? clsB?.name : 'Tied'
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <HubCard style={{ flex: 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                    {[
                        { label: 'Class A', color: '#3b82f6', val: classA, set: setClassA },
                        { label: 'Class B', color: '#0ea5e9', val: classB, set: setClassB },
                    ].map(({ label, color, val, set }) => (
                        <div key={label}>
                            <p style={{ fontSize: '10px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</p>
                            <CustomSelect
                                value={val}
                                onChange={e => set(e.target.value)}
                                style={{ width: '100%' }}
                                options={TEAMS.map(c => ({ value: c.id, label: `${c.name} (${c.grade})` }))}
                            />
                        </div>
                    ))}
                </div>
                {winner && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {winner === 'Tied' ? 'Classes are tied this period' : `${winner} leads this period`}
                    </div>
                )}
            </HubCard>

            {statA && statB && (
                <>
                    <ResizableHSplit
                        defaultSplit={50} min={25} max={75} gap={16}
                        left={
                            <HubCard style={{ borderTop: `2px solid #3b82f6` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#3b82f6' }}>{clsA?.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{clsA?.grade} · {statA.students} students</div>
                                    </div>
                                    <span style={{ fontSize: '26px', fontWeight: '900', color: scoreColor(statA.overall) }}>{statA.overall}%</span>
                                </div>
                                {statA.radarData.map(({ subject, value }) => (
                                    <div key={subject} style={{ marginBottom: '7px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>{subject}</div>
                                        <ScoreBar score={value} />
                                    </div>
                                ))}
                            </HubCard>
                        }
                        right={
                            <HubCard style={{ borderTop: `2px solid #0ea5e9` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0ea5e9' }}>{clsB?.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{clsB?.grade} · {statB.students} students</div>
                                    </div>
                                    <span style={{ fontSize: '26px', fontWeight: '900', color: scoreColor(statB.overall) }}>{statB.overall}%</span>
                                </div>
                                {statB.radarData.map(({ subject, value }) => (
                                    <div key={subject} style={{ marginBottom: '7px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>{subject}</div>
                                        <ScoreBar score={value} />
                                    </div>
                                ))}
                            </HubCard>
                        }
                    />

                    <HubCard>
                        <SectionHeader title="Subject Profile (Radar)" infoKey="class-compare" />
                        <div style={{ flex: 1, minHeight: 300, width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarMerged}>
                                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Radar name={clsA?.name} dataKey={clsA?.name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                                    <Radar name={clsB?.name} dataKey={clsB?.name} stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.12} strokeWidth={2} />
                                    <Tooltip {...TT_STYLE} formatter={v => [`${v}%`]} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ flexShrink: 0, paddingBottom: '5px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                                {clsA?.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#0ea5e9', borderRadius: '2px' }}></div>
                                {clsB?.name}
                            </div>
                        </div>
                    </HubCard>

                    <HubCard>
                        <SectionHeader title="Subject-by-Subject Comparison" infoKey="class-compare" />
                        <div style={{ flex: 1, minHeight: 220, width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip {...TT_STYLE} formatter={v => [`${v}%`]} />
                                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                    <Bar dataKey={clsA?.name} fill="#3b82f6" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
                                    <Bar dataKey={clsB?.name} fill="#0ea5e9" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                </>
            )}
        </div>
    );
}

// ── STEM Tab ─────────────────────────────────────────────────────────
export function StemTab({ year, term, onStudentClick }) {
    const leaders = useMemo(() =>
        (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
            .map(s => {
                const avg = getSubAvg(s, year, term, STEM_SUBJECTS);
                const perSub = STEM_SUBJECTS.map(sub => ({ sub, score: s.performance?.[year]?.[term]?.[sub] ?? 0 }));
                return { ...s, avg, perSub };
            })
            .filter(s => s.avg > 0)
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 12),
    [year, term]);

    const scatterData = useMemo(() =>
        (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
            .map(s => ({
                stem: getSubAvg(s, year, term, STEM_SUBJECTS),
                overall: getOverall(s, year, term),
                name: s.name,
            }))
            .filter(s => s.stem > 0 && s.overall > 0),
    [year, term]);

    const subjectAvgs = useMemo(() =>
        STEM_SUBJECTS.map((sub, i) => {
            const vals = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
                .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
                .map(s => s.performance?.[year]?.[term]?.[sub] ?? 0).filter(v => v > 0);
            return { label: sub, value: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0, fill: CHART_COLORS[i] };
        }),
    [year, term]);

    const classRankings = useMemo(() =>
        TEAMS.map((teamObj, i) => {
            const students = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => s.teamAssignments?.[year] === teamObj.id);
            if (!students.length) return null;
            const avgs = students.map(s => getSubAvg(s, year, term, STEM_SUBJECTS)).filter(v => v > 0);
            return {
                ...teamObj,
                stemAvg: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0,
                count: students.length,
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.stemAvg - a.stemAvg),
    [year, term]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <HubCard>
                <SectionHeader title="STEM Score vs Overall Average" infoKey="stem" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Each point represents one student. Points above the diagonal outperform in STEM relative to their overall average.</p>
                <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart margin={{ top: 4, right: 20, left: -10, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" dataKey="overall" name="Overall" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Overall Avg', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }} />
                        <YAxis type="number" dataKey="stem" name="STEM" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'STEM Avg', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                        <ZAxis range={[28, 28]} />
                        <Tooltip {...TT_STYLE} content={({ payload }) => {
                            if (!payload?.length) return null;
                            const d = payload[0].payload;
                            return <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#e2e8f0' }}>{d.name}</div>
                                <div style={{ color: '#94a3b8' }}>STEM: <span style={{ color: '#e2e8f0', fontWeight: '700' }}>{d.stem}%</span></div>
                                <div style={{ color: '#94a3b8' }}>Overall: <span style={{ color: '#e2e8f0', fontWeight: '700' }}>{d.overall}%</span></div>
                            </div>;
                        }} />
                        <Scatter data={scatterData} fill="#3b82f6" fillOpacity={0.55} />
                    </ScatterChart>
                </ResponsiveContainer>
            </HubCard>

            <ResizableHSplit
                defaultSplit={50} min={25} max={75} gap={16}
                left={
                    <HubCard style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        <SectionHeader title="STEM Subject Averages" infoKey="stem" />
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={subjectAvgs} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip {...TT_STYLE} formatter={v => [`${v}%`, 'Avg']} />
                                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                    {subjectAvgs.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                                Class STEM Rankings
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {classRankings.map((teamObj, i) => (
                                    <div key={teamObj.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                            background: i === 0 ? '#3b82f6' : i === 1 ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '9px', fontWeight: '800',
                                            color: i === 0 ? '#fff' : '#a5b4fc',
                                        }}>{i + 1}</span>
                                        <span style={{ width: '52px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', flexShrink: 0 }}>{teamObj.name}</span>
                                        <div style={{ flex: 1 }}><ScoreBar score={teamObj.stemAvg} /></div>
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: scoreColor(teamObj.stemAvg), flexShrink: 0, width: '34px', textAlign: 'right' }}>{teamObj.stemAvg}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Top STEM Students" infoKey="stem" count={leaders.length} />
                        {!leaders.length ? <Empty msg="No STEM data." /> :
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {leaders.map((s, i) => (
                                    <div key={s.id} style={{
                                        padding: '8px 10px', borderRadius: '7px',
                                        background: i < 3 ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                                    }}>
                                        {/* Row 1: Rank + Name + Score */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                            <RankBadge rank={i} />
                                            <span className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ flex: 1, fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.name}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: scoreColor(s.avg), flexShrink: 0 }}>
                                                {s.avg}%
                                            </span>
                                        </div>
                                        {/* Row 2: Score bar */}
                                        <div style={{ paddingLeft: '30px' }}>
                                            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${s.avg}%`, background: scoreColor(s.avg), borderRadius: '99px', opacity: 0.8, transition: 'width 0.4s ease' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </HubCard>
                }
            />
        </div>
    );
}

