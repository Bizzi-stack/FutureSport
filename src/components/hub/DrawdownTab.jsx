import { useMemo, useState } from 'react';
import {
    HubCard, SectionHeader, scoreColor, CHART_COLORS, TT_STYLE,
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
    ScatterChart, Scatter, ZAxis, Cell,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, YEARS, TERMS, AGE_GROUPS, getOverallAvg } from '../../data/mockData';

// ── Build ordered term timeline ──────────────────────────────────────
const ALL_TERM_POINTS = [];
for (const y of YEARS) for (const t of TERMS) ALL_TERM_POINTS.push({ year: y, term: t });

function termLabel(tp) { return `${tp.year.slice(2, 4)}/${tp.year.slice(7)} ${tp.term.replace('Matchday ', 'M')}`; }

// ── Finance helpers ──────────────────────────────────────────────────
// Peak = Highest score achieved up to time t
// Form Slump = Current score - Peak (always <= 0)
// Recovery Duration = Terms spent below peak
function computeFormSlump(student) {
    const timeline = ALL_TERM_POINTS.map(tp => {
        const avg = getOverallAvg(student, tp.year, tp.term);
        return { ...tp, label: termLabel(tp), score: avg > 0 ? avg : null };
    });

    let peak = -Infinity;
    let currentRecoveryDuration = 0;
    
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].score == null) {
            timeline[i].peak = null;
            timeline[i].formSlump = null;
            timeline[i].recoveryDuration = null;
            continue;
        }

        if (timeline[i].score >= peak) {
            peak = timeline[i].score;
            currentRecoveryDuration = 0;
        } else {
            currentRecoveryDuration++;
        }
        
        timeline[i].peak = peak;
        timeline[i].formSlump = timeline[i].score - peak; // <= 0
        timeline[i].recoveryDuration = currentRecoveryDuration;
    }

    return timeline;
}

// ── Custom tooltip ───────────────────────────────────────────────────
function CurveTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px', minWidth: 160,
        }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
                    {p.name}: <strong>{p.value != null ? p.value : '—'}</strong>
                </div>
            ))}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────
export default function DrawdownTab({ year, term, selectedSchool, onStudentClick }) {
    const [selectedStudent, setSelectedStudent] = useState(null);

    // All active students with their Form Slump Data
    const students = useMemo(() => {
        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
            .map(s => {
                const timeline = computeFormSlump(s);
                const currentIdx = timeline.findIndex(tp => tp.year === year && tp.term === term);
                const currentData = currentIdx >= 0 ? timeline[currentIdx] : null;
                const teamObj = TEAMS.find(c => s.teamAssignments?.[year] === c.id);
                return { 
                    ...s, 
                    timeline, 
                    currentScore: currentData?.score,
                    currentFormSlump: currentData?.formSlump,
                    currentRecovery: currentData?.recoveryDuration,
                    peak: currentData?.peak,
                    form: teamObj?.gradeNum ?? 0, 
                    className: teamObj?.name ?? '' 
                };
            })
            .filter(s => s.currentScore > 0);
    }, [year, term]);

    // KPIs
    const inFormSlump = students.filter(s => s.currentFormSlump < 0).length;
    const avgFormSlump = students.filter(s => s.currentFormSlump != null).length > 0
        ? Math.round(students.filter(s => s.currentFormSlump != null).reduce((a, s) => a + s.currentFormSlump, 0) / students.filter(s => s.currentFormSlump != null).length * 100) / 100
        : 0;
    const severeFormSlumps = students.filter(s => s.currentFormSlump <= -10).length;
    const maxRecovery = students.filter(s => s.currentRecovery != null).reduce((max, s) => Math.max(max, s.currentRecovery), 0);
    const avgRecovery = students.filter(s => s.currentRecovery > 0).length > 0
        ? Math.round(students.filter(s => s.currentRecovery > 0).reduce((a, s) => a + s.currentRecovery, 0) / students.filter(s => s.currentRecovery > 0).length * 100) / 100
        : 0;
    const recoveredRecently = students.filter(s => s.currentRecovery === 0 && s.timeline.length > 1 && s.timeline[s.timeline.findIndex(tp => tp.year === year && tp.term === term) - 1]?.recoveryDuration > 0).length;

    // Scatter data: current score vs formSlump
    const scatterData = students.filter(s => s.currentFormSlump != null);

    // Top Form Slumps
    const sortedFormSlumps = [...students].filter(s => s.currentFormSlump != null && s.currentFormSlump < 0).sort((a, b) => a.currentFormSlump - b.currentFormSlump);
    const topFormSlumps = sortedFormSlumps.slice(0, 8);
    const topRecoveriesList = [...students].filter(s => s.currentRecovery === 0 && s.timeline.length > 1).sort((a, b) => {
        // Find how long they were in formSlump before recovering
        const aIdx = a.timeline.findIndex(tp => tp.year === year && tp.term === term);
        const bIdx = b.timeline.findIndex(tp => tp.year === year && tp.term === term);
        const aPrevRec = a.timeline[aIdx - 1]?.recoveryDuration || 0;
        const bPrevRec = b.timeline[bIdx - 1]?.recoveryDuration || 0;
        return bPrevRec - aPrevRec;
    }).slice(0, 8);

    // Individual student timeline for drill-down
    const drillStudent = selectedStudent ?? topFormSlumps[0] ?? students[0];
    const drillTimeline = drillStudent?.timeline?.filter(t => t.score != null) ?? [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Explainer ── */}
            <HubCard style={{ flex: 'none', borderLeft: '3px solid #f43f5e' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ fontSize: 28, lineHeight: 1 }}>📉</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Form Slump Analysis</div>
                        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                            Borrowed from financial risk analysis, a <strong style={{ color: '#e2e8f0' }}>formSlump</strong> measures how far a player's performance has fallen from their historical peak. It visualizes the severity of form slumps and the <strong style={{ color: '#f59e0b' }}>recovery duration</strong> (time spent below their peak).
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10 }}>
                            <code style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '3px 8px', borderRadius: 4 }}>
                                Peak = MAX(score(0)...score(t))
                            </code>
                            <code style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 8px', borderRadius: 4 }}>
                                Form Slump = score(t) − Peak
                            </code>
                            <code style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '3px 8px', borderRadius: 4 }}>
                                Recovery = Matchdays below Peak
                            </code>
                        </div>
                    </div>
                </div>
            </HubCard>

            {/* ── KPI Strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                {[
                    { label: 'Avg Form Slump', value: `${avgFormSlump} pts`, color: '#f43f5e' },
                    { label: 'In Form Slump', value: inFormSlump, color: '#f59e0b' },
                    { label: 'Severe (≤-10 pts)', value: severeFormSlumps, color: '#ef4444' },
                    { label: 'Max Recovery Time', value: `${maxRecovery} Matchdays`, color: '#64748b' },
                    { label: 'Avg Recovery Time', value: `${avgRecovery} Matchdays`, color: '#94a3b8' },
                    { label: 'Recovered Recently', value: recoveredRecently, color: '#10b981' },
                ].map(k => (
                    <HubCard key={k.label}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
                    </HubCard>
                ))}
            </div>

            {/* ── Form Slump Scatter ── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Form Slump Matrix — Current Score vs Form Slump Depth" count={scatterData.length} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Players at the top (0 formSlump) are currently at their historical peak. Players lower down are experiencing form slumps.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" dataKey="currentScore" name="Current Score" domain={[20, 100]} unit="%"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Current Average Score', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis type="number" dataKey="currentFormSlump" name="Form Slump" domain={[-40, 5]}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Form Slump from Peak (pts)', angle: -90, position: 'insideLeft', offset: 18, fill: '#f43f5e', fontSize: 11 }}
                        />
                        <ZAxis type="number" range={[36, 36]} />
                        <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', fontSize: 12, minWidth: 180 }}>
                                    <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{d.name}</div>
                                    <div style={{ color: '#94a3b8' }}>Squad {d.form === 1 ? 'U14' : d.form === 2 ? 'U16' : 'U19'} · {d.className}</div>
                                    <div style={{ marginTop: 4, color: '#94a3b8' }}>Avg: <strong style={{ color: scoreColor(d.currentScore) }}>{d.currentScore}%</strong></div>
                                    <div style={{ color: '#94a3b8' }}>Form Slump: <strong style={{ color: d.currentFormSlump === 0 ? '#10b981' : '#f43f5e' }}>{d.currentFormSlump} pts</strong></div>
                                    <div style={{ color: '#94a3b8' }}>Recovery Time: <strong>{d.currentRecovery} matchdays</strong></div>
                                </div>
                            );
                        }} />
                        <ReferenceLine y={0} stroke="rgba(16,185,129,0.3)" strokeWidth={2} />
                        <ReferenceLine y={-10} stroke="rgba(239,68,68,0.15)" strokeDasharray="4 4" />
                        <Scatter data={scatterData} onClick={(d) => setSelectedStudent(d)} style={{ cursor: 'pointer' }}>
                            {scatterData.map((s) => (
                                <Cell key={s.id} fill={s.currentFormSlump === 0 ? '#10b981' : s.currentFormSlump > -5 ? '#f59e0b' : '#ef4444'} fillOpacity={0.7} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</span>
                    {[['At Peak (0 pts)', '#10b981'], ['Slight Form Slump (-1…-4 pts)', '#f59e0b'], ['Severe Form Slump (≤-5 pts)', '#ef4444']].map(([l, c]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</span>
                        </div>
                    ))}
                </div>
            </HubCard>

            {/* ── Individual Drill-Down: Form Slump Curves ── */}
            <HubCard style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <SectionHeader title={`Form Slump Curve — ${drillStudent?.name ?? 'Select a Player'}`} />
                    {drillStudent && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Form Slump:</span>
                            <span style={{ fontWeight: 900, color: drillStudent.currentFormSlump === 0 ? '#10b981' : '#f43f5e', fontSize: 18 }}>{drillStudent.currentFormSlump ?? '—'}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `rgba(244,63,94,0.1)`, color: '#f43f5e', fontWeight: 700 }}>
                                {drillStudent.currentRecovery} Matchdays Below Peak
                            </span>
                        </div>
                    )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    The "waterfall" area highlights the gap between the player's peak performance and their actual scores.
                </p>

                {drillTimeline.length > 1 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Score vs Peak */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Score vs Peak
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={drillTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} interval="preserveStartEnd" />
                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} />
                                    <Tooltip content={<CurveTooltip />} />
                                    <Area type="monotone" dataKey="peak" stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" fill="transparent" name="Peak" />
                                    <Area type="monotone" dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} name="Score" dot={{ r: 3, fill: '#38bdf8' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Form Slump Depth Area */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Form Slump Depth
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={drillTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} interval="preserveStartEnd" />
                                    <YAxis domain={['auto', 5]} tick={{ fontSize: 9, fill: '#64748b' }} />
                                    <Tooltip content={<CurveTooltip />} />
                                    <ReferenceLine y={0} stroke="rgba(16,185,129,0.4)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="formSlump" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} strokeWidth={2} name="Form Slump" dot={{ r: 3, fill: '#f43f5e' }} connectNulls />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
                        Insufficient data points to render curves. Select a player with more historical matchdays.
                    </div>
                )}
            </HubCard>

            {/* ── Top Form Slumps & Recoveries ── */}
            <ResizableHSplit
                defaultSplit={50} min={25} max={75}
                left={
                    <HubCard>
                        <SectionHeader title="Deepest Active Form Slumps" infoKey="formSlump" count={topFormSlumps.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Players currently furthest below their historical peak.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {topFormSlumps.map((s, i) => (
                                <div key={s.id} onClick={() => setSelectedStudent(s)}
                                    style={{
                                        padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                                        background: selectedStudent?.id === s.id ? 'rgba(239,68,68,0.1)' : i < 3 ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: selectedStudent?.id === s.id ? '1px solid rgba(239,68,68,0.25)' : '1px solid transparent',
                                        transition: 'all 0.15s',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: i < 3 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i < 3 ? '#ef4444' : '#64748b', flexShrink: 0 }}>{i + 1}</span>
                                        <span className="clickable-name" onClick={(e) => { e.stopPropagation(); onStudentClick?.(s); }} style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Peak: {s.peak}%</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#ef4444', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>{s.currentFormSlump}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Recent Recoveries" infoKey="formSlump" count={topRecoveriesList.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Players who broke their formSlump and hit a new peak.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {topRecoveriesList.map((s, i) => {
                                const prevIdx = s.timeline.findIndex(tp => tp.year === year && tp.term === term) - 1;
                                const prevRec = s.timeline[prevIdx]?.recoveryDuration || 0;
                                return (
                                <div key={s.id} onClick={() => setSelectedStudent(s)}
                                    style={{
                                        padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                                        background: selectedStudent?.id === s.id ? 'rgba(16,185,129,0.1)' : i < 3 ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: selectedStudent?.id === s.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                                        transition: 'all 0.15s',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: i < 3 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i < 3 ? '#10b981' : '#64748b', flexShrink: 0 }}>{i + 1}</span>
                                        <span className="clickable-name" onClick={(e) => { e.stopPropagation(); onStudentClick?.(s); }} style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Was down {prevRec} Matchdays</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>NEW PEAK</span>
                                    </div>
                                </div>
                            )})}
                            {topRecoveriesList.length === 0 && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px' }}>No recent recoveries to display.</div>
                            )}
                        </div>
                    </HubCard>
                }
            />
        </div>
    );
}

