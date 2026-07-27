import { useMemo } from 'react';
import {
    HubCard, SectionHeader, scoreColor, ScoreBar,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend,
    LineChart, Line, ReferenceLine,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, SCHOOLS, SUBJECTS, YEARS, TERMS } from '../../data/mockData';

// ── Consistent school palette ─────────────────────────────────────────
const SCHOOL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#0ea5e9', '#fb923c'];
function schoolColor(idx) { return SCHOOL_COLORS[idx % SCHOOL_COLORS.length]; }

// ── Helpers ───────────────────────────────────────────────────────────
function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

function gradeBand(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

const BAND_COLORS = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#fb923c', F: '#ef4444' };

// ── Main Component ────────────────────────────────────────────────────
export default function NationalOverviewTab({ year, term }) {

    // ── Per-school computed data ──────────────────────────────────────
    const schoolData = useMemo(() => {
        return SCHOOLS.map((sch, idx) => {
            const students = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[year]);
            const avgs = students.map(s => getOverall(s, year, term)).filter(v => v > 0);
            const overall = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;

            // Momentum (avg slope across last 3 terms)
            let totalSlope = 0, slopeCount = 0;
            students.forEach(s => {
                const pts = TERMS.map(t => getOverall(s, year, t)).filter(v => v > 0);
                if (pts.length >= 2) {
                    totalSlope += (pts[pts.length - 1] - pts[0]) / (pts.length - 1);
                    slopeCount++;
                }
            });
            const momentum = slopeCount ? totalSlope / slopeCount : 0;

            // Subject averages
            const subjectAvgs = {};
            SUBJECTS.forEach(sub => {
                const vals = students.map(s => s.performance?.[year]?.[term]?.[sub] ?? 0).filter(v => v > 0);
                subjectAvgs[sub] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            });

            // Behavioral
            const behaviorAgg = { gamesPlayed: 0, redCards: 0, minutesPlayed: 0, yellowCards: 0, count: 0 };
            students.forEach(s => {
                const b = s.matchStats?.[year]?.[term];
                if (b) {
                    behaviorAgg.gamesPlayed += b.gamesPlayed;
                    behaviorAgg.redCards += b.redCards;
                    behaviorAgg.minutesPlayed += b.minutesPlayed;
                    behaviorAgg.yellowCards += b.yellowCards;
                    behaviorAgg.count++;
                }
            });
            const bc = behaviorAgg.count || 1;

            // Grade bands
            const bands = { A: 0, B: 0, C: 0, D: 0, F: 0 };
            avgs.forEach(a => { bands[gradeBand(a)]++; });

            // Pro readiness
            let csecReady = 0;
            students.forEach(s => {
                const g = s.performance?.[year]?.[term];
                if (!g) return;
                const entries = Object.values(g);
                const passed = entries.filter(v => v >= 50).length;
                if (entries.length && (passed / entries.length) >= 0.75) csecReady++;
            });

            // At-risk
            let highRisk = 0, modRisk = 0, lowRisk = 0;
            avgs.forEach(a => {
                if (a < 50) highRisk++;
                else if (a < 60) modRisk++;
                else lowRisk++;
            });

            return {
                ...sch,
                color: schoolColor(idx),
                students: students.length,
                overall,
                momentum: Math.round(momentum * 10) / 10,
                subjectAvgs,
                matchStats: {
                    "Games Played": Math.round((behaviorAgg.gamesPlayed / bc / 25) * 100),
                    "Minutes Played": Math.round((behaviorAgg.minutesPlayed / bc / 2250) * 100),
                    "Discipline (Yellow)": Math.max(0, 100 - Math.round((behaviorAgg.yellowCards / bc) * 15)),
                    "Discipline (Red)": Math.max(0, 100 - Math.round((behaviorAgg.redCards / bc) * 50)),
                },
                bands,
                csecReady,
                csecRate: avgs.length ? Math.round((csecReady / avgs.length) * 100) : 0,
                risk: { high: highRisk, moderate: modRisk, low: lowRisk },
                totalStudents: avgs.length,
            };
        });
    }, [year, term]);

    // ── National aggregates ───────────────────────────────────────────
    const national = useMemo(() => {
        const totStudents = schoolData.reduce((a, s) => a + s.totalStudents, 0);
        const avgOverall = totStudents ? Math.round(schoolData.reduce((a, s) => a + s.overall * s.totalStudents, 0) / totStudents) : 0;
        const avgMomentum = schoolData.length ? (schoolData.reduce((a, s) => a + s.momentum, 0) / schoolData.length).toFixed(1) : 0;
        const totCsec = schoolData.reduce((a, s) => a + s.csecReady, 0);
        const totHighRisk = schoolData.reduce((a, s) => a + s.risk.high, 0);
        return { totStudents, avgOverall, avgMomentum, totCsec, totHighRisk };
    }, [schoolData]);

    // ── Trend overlay data (all schools across all years) ─────────────
    const trendData = useMemo(() => {
        const pts = [];
        for (const yr of YEARS) {
            for (const t of TERMS) {
                const point = { label: `${yr.slice(2, 4)}/${yr.slice(7, 9)} ${t.replace('Matchday ', 'M')}` };
                SCHOOLS.forEach((sch, idx) => {
                    const students = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[yr]);
                    const avgs = students.map(s => getOverall(s, yr, t)).filter(v => v > 0);
                    point[sch.name] = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
                });
                pts.push(point);
            }
        }
        return pts;
    }, []);

    // ── Subject heatmap data ──────────────────────────────────────────
    const heatmapData = useMemo(() => {
        return SUBJECTS.map(sub => {
            const row = { subject: sub };
            let nationalTotal = 0, nationalCount = 0;
            schoolData.forEach(sch => {
                row[sch.name] = sch.subjectAvgs[sub];
                nationalTotal += sch.subjectAvgs[sub] * sch.totalStudents;
                nationalCount += sch.totalStudents;
            });
            row._nationalAvg = nationalCount ? Math.round(nationalTotal / nationalCount) : 0;
            return row;
        });
    }, [schoolData]);

    // ── Match Stats radar data ───────────────────────────────────────────
    const behaviorRadarData = useMemo(() => {
        return ['Games Played', 'Minutes Played', 'Discipline (Yellow)', 'Discipline (Red)'].map(metric => {
            const d = { metric };
            schoolData.forEach(sch => { d[sch.name] = sch.matchStats[metric]; });
            return d;
        });
    }, [schoolData]);

    // ── Grade distribution bar data ───────────────────────────────────
    const gradeDistData = useMemo(() => {
        return schoolData.map(sch => {
            const total = sch.totalStudents || 1;
            return {
                name: sch.name,
                A: Math.round((sch.bands.A / total) * 100),
                B: Math.round((sch.bands.B / total) * 100),
                C: Math.round((sch.bands.C / total) * 100),
                D: Math.round((sch.bands.D / total) * 100),
                F: Math.round((sch.bands.F / total) * 100),
            };
        });
    }, [schoolData]);

    // ── Heatmap color ─────────────────────────────────────────────────
    function heatCell(val) {
        if (val >= 75) return { bg: 'rgba(16,185,129,0.18)', color: '#34d399' };
        if (val >= 60) return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' };
        if (val >= 50) return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
        return { bg: 'rgba(239,68,68,0.15)', color: '#f87171' };
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── National Overview KPIs ────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>National Average</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: scoreColor(national.avgOverall) }}>{national.avgOverall}%</div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Total Enrolled</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{national.totStudents.toLocaleString()}</div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>System Momentum</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: national.avgMomentum > 0 ? '#10b981' : '#ef4444' }}>
                        {national.avgMomentum > 0 ? '+' : ''}{national.avgMomentum} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>pts/matchday</span>
                    </div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Pro Academy Ready (National)</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#2dd4bf' }}>{national.totCsec} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>players</span></div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>At-Risk (National)</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{national.totHighRisk} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>players</span></div>
                </HubCard>
            </div>

            {/* ── School Profile Cards ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SCHOOLS.length}, 1fr)`, gap: '12px' }}>
                {schoolData.map(sch => (
                    <HubCard key={sch.id} style={{ borderTop: `3px solid ${sch.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            {sch.logo && <img src={sch.logo} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', background: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />}
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: sch.color }}>{sch.name}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sch.students} players</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { label: 'Avg', value: `${sch.overall}%`, color: scoreColor(sch.overall) },
                                { label: 'Momentum', value: `${sch.momentum > 0 ? '+' : ''}${sch.momentum}`, color: sch.momentum > 0 ? '#10b981' : '#ef4444' },
                                { label: 'Pro Readiness', value: `${sch.csecRate}%`, color: sch.csecRate >= 70 ? '#10b981' : '#f59e0b' },
                                { label: 'At-Risk', value: sch.risk.high, color: sch.risk.high > 0 ? '#ef4444' : '#10b981' },
                            ].map(kpi => (
                                <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 10px' }}>
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{kpi.label}</div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                ))}
            </div>

            {/* ── Performance Trend Overlay ─────────────────────────────── */}
            <HubCard>
                <SectionHeader title="National Performance Trajectory" infoKey="national-trajectory" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                    5-year average performance trend across all academies — identifying systemic patterns in youth development outcomes.
                </p>
                <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 4, right: 20, left: -10, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#475569' }} interval={2} />
                            <YAxis domain={[40, 85]} tick={{ fontSize: 10, fill: '#475569' }} />
                            <Tooltip {...TT_STYLE} formatter={(v) => [`${v}%`]} />
                            {schoolData.map((sch, i) => (
                                <Line key={sch.id} type="monotone" dataKey={sch.name} stroke={sch.color} strokeWidth={2.5}
                                    dot={{ r: 2, fill: sch.color, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
                    {schoolData.map(sch => (
                        <div key={sch.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                            <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: sch.color }} />
                            {sch.name}
                        </div>
                    ))}
                </div>
            </HubCard>

            {/* ── Subject Strength Heatmap + Match Stats Radar ─────────────── */}
            <ResizableHSplit
                defaultSplit={55} min={35} max={70} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="Stat Category Strength Map" infoKey="subject-heatmap" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            Identifying national metric strengths and areas needing systemic development attention.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${schoolData.length}, 1fr) 60px`, gap: '2px' }}>
                            {/* Header row */}
                            <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700', padding: '6px 8px' }} />
                            {schoolData.map(sch => (
                                <div key={sch.id} style={{ fontSize: '9px', fontWeight: '700', color: sch.color, padding: '6px 4px', textAlign: 'center', letterSpacing: '0.02em' }}>
                                    {sch.name.split(' ')[0]}
                                </div>
                            ))}
                            <div style={{ fontSize: '9px', color: '#475569', fontWeight: '700', padding: '6px 4px', textAlign: 'center' }}>Natl</div>

                            {/* Data rows */}
                            {heatmapData.map(row => (
                                <>
                                    <div key={row.subject + '-label'} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', padding: '8px 8px', display: 'flex', alignItems: 'center' }}>
                                        {row.subject}
                                    </div>
                                    {schoolData.map(sch => {
                                        const val = row[sch.name];
                                        const h = heatCell(val);
                                        return (
                                            <div key={sch.id + row.subject} style={{
                                                background: h.bg, color: h.color,
                                                fontSize: '12px', fontWeight: '800',
                                                padding: '8px 4px', textAlign: 'center',
                                                borderRadius: '4px',
                                            }}>
                                                {val}%
                                            </div>
                                        );
                                    })}
                                    <div key={row.subject + '-natl'} style={{
                                        ...heatCell(row._nationalAvg),
                                        fontSize: '11px', fontWeight: '700',
                                        padding: '8px 4px', textAlign: 'center', borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)',
                                    }}>
                                        {row._nationalAvg}%
                                    </div>
                                </>
                            ))}
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Behavioral Health Profile" infoKey="matchStats-radar" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '-6px' }}>
                            System-wide player behavior and engagement metrics.
                        </p>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={behaviorRadarData} outerRadius="72%">
                                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    {schoolData.map((sch, i) => (
                                        <Radar key={sch.id} name={sch.name} dataKey={sch.name}
                                            stroke={sch.color} fill={sch.color} fillOpacity={0.08 + i * 0.04} strokeWidth={2} />
                                    ))}
                                    <Tooltip {...TT_STYLE} formatter={(v) => [`${v}/100`]} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                            {schoolData.map(sch => (
                                <div key={sch.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                                    <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: sch.color }} />
                                    {sch.name}
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
            />

            {/* ── Grade Distribution + CSEC + Risk ─────────────────────── */}
            <ResizableHSplit
                defaultSplit={50} min={30} max={70} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="National Rating Distribution" infoKey="grade-distribution" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                            How player performance is distributed across rating bands nationally — revealing the shape of outcomes.
                        </p>
                        <div style={{ width: '100%', height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gradeDistData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                                    <Tooltip {...TT_STYLE} formatter={(v) => [`${v}%`]} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    {['A', 'B', 'C', 'D', 'F'].map(band => (
                                        <Bar key={band} dataKey={band} stackId="a" fill={BAND_COLORS[band]} fillOpacity={0.8} radius={band === 'A' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Squad Pro Readiness & Risk Landscape" infoKey="csec-risk" />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', marginTop: '-6px' }}>
                            National readiness for professional academy promotion and the distribution of at-risk players requiring development.
                        </p>

                        {/* Graduation rings */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
                            {schoolData.map(sch => {
                                const r = 32;
                                const circ = 2 * Math.PI * r;
                                const offset = circ - (sch.csecRate / 100) * circ;
                                return (
                                    <div key={sch.id} style={{ textAlign: 'center' }}>
                                        <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 6px' }}>
                                            <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                                <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                                <circle cx="40" cy="40" r={r} fill="none" stroke={sch.color} strokeWidth="5" strokeLinecap="round"
                                                    strokeDasharray={circ} strokeDashoffset={offset}
                                                    style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                                            </svg>
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '900', color: sch.color }}>{sch.csecRate}%</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '9px', fontWeight: '700', color: sch.color }}>{sch.name.split(' ')[0]}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Risk bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {schoolData.map(sch => {
                                const total = sch.totalStudents || 1;
                                const highPct = Math.round((sch.risk.high / total) * 100);
                                const modPct = Math.round((sch.risk.moderate / total) * 100);
                                const lowPct = 100 - highPct - modPct;
                                return (
                                    <div key={sch.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '700', color: sch.color }}>{sch.name.split(' ')[0]}</span>
                                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{sch.risk.high} high · {sch.risk.moderate} mod</span>
                                        </div>
                                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '1px' }}>
                                            <div style={{ width: `${lowPct}%`, background: '#10b981', opacity: 0.7, transition: 'width 0.4s' }} />
                                            <div style={{ width: `${modPct}%`, background: '#f59e0b', opacity: 0.7, transition: 'width 0.4s' }} />
                                            <div style={{ width: `${highPct}%`, background: '#ef4444', opacity: 0.7, transition: 'width 0.4s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '4px' }}>
                                {[{ label: 'Low Risk', color: '#10b981' }, { label: 'Moderate', color: '#f59e0b' }, { label: 'High Risk', color: '#ef4444' }].map(l => (
                                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, opacity: 0.7 }} />
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </HubCard>
                }
            />
        </div>
    );
}
