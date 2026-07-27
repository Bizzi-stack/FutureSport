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

// ── Physics helpers ──────────────────────────────────────────────────
// Velocity  = Δscore / Δmatchday  (first derivative)
// Acceleration = Δvelocity / Δmatchday  (second derivative)
function computeTimeline(student) {
    const scores = ALL_TERM_POINTS.map(tp => {
        const avg = getOverallAvg(student, tp.year, tp.term);
        return { ...tp, label: termLabel(tp), score: avg > 0 ? avg : null };
    });

    // Velocity (first-difference of score)
    for (let i = 0; i < scores.length; i++) {
        if (i === 0 || scores[i].score == null || scores[i - 1].score == null) {
            scores[i].velocity = null;
        } else {
            scores[i].velocity = scores[i].score - scores[i - 1].score;
        }
    }

    // Acceleration (first-difference of velocity)
    for (let i = 0; i < scores.length; i++) {
        if (i === 0 || scores[i].velocity == null || scores[i - 1].velocity == null) {
            scores[i].acceleration = null;
        } else {
            scores[i].acceleration = scores[i].velocity - scores[i - 1].velocity;
        }
    }

    return scores;
}

// Form Trajectory Factor: weighted sum of recent velocity + acceleration
// AMF = 0.6 * velocity + 0.4 * acceleration  (tuned so acceleration rewards bursts)
function computeAMF(timeline, year, term) {
    const idx = ALL_TERM_POINTS.findIndex(tp => tp.year === year && tp.term === term);
    if (idx < 0) return null;
    const pt = timeline[idx];
    if (pt?.velocity == null) return null;
    const accel = pt.acceleration ?? 0;
    return Math.round((0.6 * pt.velocity + 0.4 * accel) * 100) / 100;
}

function amfColor(v) {
    if (v == null) return '#64748b';
    if (v >= 5) return '#10b981';
    if (v >= 1) return '#34d399';
    if (v > -1) return '#64748b';
    if (v > -5) return '#f59e0b';
    return '#ef4444';
}

function amfLabel(v) {
    if (v == null) return 'N/A';
    if (v >= 5) return 'Surging';
    if (v >= 1) return 'Gaining';
    if (v > -1) return 'Cruising';
    if (v > -5) return 'Fading';
    return 'Stalling';
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
export default function MomentumTab({ year, term, selectedSchool, onStudentClick }) {
    const [selectedStudent, setSelectedStudent] = useState(null);

    // All active students with their AMF
    const students = useMemo(() => {
        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
            .map(s => {
                const timeline = computeTimeline(s);
                const amf = computeAMF(timeline, year, term);
                const currentAvg = getOverallAvg(s, year, term);
                const teamObj = TEAMS.find(c => s.teamAssignments?.[year] === c.id);
                return { ...s, timeline, amf, currentAvg, form: teamObj?.gradeNum ?? 0, className: teamObj?.name ?? '' };
            })
            .filter(s => s.currentAvg > 0);
    }, [year, term]);

    // KPIs
    const surging = students.filter(s => s.amf >= 5).length;
    const gaining = students.filter(s => s.amf >= 1 && s.amf < 5).length;
    const cruising = students.filter(s => s.amf > -1 && s.amf < 1).length;
    const fading = students.filter(s => s.amf != null && s.amf <= -1 && s.amf > -5).length;
    const stalling = students.filter(s => s.amf != null && s.amf <= -5).length;
    const avgAMF = students.filter(s => s.amf != null).length > 0
        ? Math.round(students.filter(s => s.amf != null).reduce((a, s) => a + s.amf, 0) / students.filter(s => s.amf != null).length * 100) / 100
        : 0;

    // Scatter data: current avg vs AMF
    const scatterData = students.filter(s => s.amf != null);

    // Top accelerators and decelerators
    const sorted = [...students].filter(s => s.amf != null).sort((a, b) => b.amf - a.amf);
    const topAccel = sorted.slice(0, 8);
    const topDecel = sorted.slice(-8).reverse();

    // Form-level average AMF for bar-like display
    const formAMF = useMemo(() => {
        return AGE_GROUPS.map((g, i) => {
            const formStudents = students.filter(s => s.form === g.gradeNum && s.amf != null);
            const avg = formStudents.length
                ? Math.round(formStudents.reduce((a, s) => a + s.amf, 0) / formStudents.length * 100) / 100
                : 0;
            return { ...g, amf: avg, count: formStudents.length, color: CHART_COLORS[i] };
        });
    }, [students]);

    // Individual student timeline for drill-down
    const drillStudent = selectedStudent ?? topAccel[0];
    const drillTimeline = drillStudent?.timeline?.filter(t => t.score != null) ?? [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Explainer ── */}
            <HubCard style={{ flex: 'none', borderLeft: '3px solid #a78bfa' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ fontSize: 28, lineHeight: 1 }}>📐</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Player Momentum Factor (PMF)</div>
                        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                            PMF measures <strong style={{ color: '#e2e8f0' }}>improvement acceleration</strong>, not just raw performance. It combines a player's
                            <strong style={{ color: '#3b82f6' }}> velocity</strong> (matchday-over-matchday rating change) with their
                            <strong style={{ color: '#a78bfa' }}> acceleration</strong> (how fast that change is itself changing).
                            A player moving 52 → 58 → 71 has a sharply rising PMF because their improvement is <em>accelerating</em>.
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10 }}>
                            <code style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', padding: '3px 8px', borderRadius: 4 }}>
                                PMF = 0.6 × velocity + 0.4 × acceleration
                            </code>
                            <code style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '3px 8px', borderRadius: 4 }}>
                                velocity = score(t) − score(t−1)
                            </code>
                            <code style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '3px 8px', borderRadius: 4 }}>
                                accel = velocity(t) − velocity(t−1)
                            </code>
                        </div>
                    </div>
                </div>
            </HubCard>

            {/* ── KPI Strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                {[
                    { label: 'Academy PMF', value: avgAMF, color: amfColor(avgAMF) },
                    { label: 'Surging (≥+5)', value: surging, color: '#10b981' },
                    { label: 'Gaining (+1…+5)', value: gaining, color: '#34d399' },
                    { label: 'Cruising (±1)', value: cruising, color: '#64748b' },
                    { label: 'Fading (−1…−5)', value: fading, color: '#f59e0b' },
                    { label: 'Stalling (≤−5)', value: stalling, color: '#ef4444' },
                ].map(k => (
                    <HubCard key={k.label}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
                    </HubCard>
                ))}
            </div>

            {/* ── AMF Scatter: Current Avg vs AMF ── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Momentum Matrix — Current Rating vs PMF" count={scatterData.length} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Players above the zero-line are <strong style={{ color: '#10b981' }}>accelerating</strong>. Players below are <strong style={{ color: '#ef4444' }}>decelerating</strong>.
                    Click any dot to drill into their individual velocity & acceleration curves.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" dataKey="currentAvg" name="Current Avg" domain={[20, 100]} unit="%"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Current Average Rating', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis type="number" dataKey="amf" name="AMF" domain={[-20, 20]}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'PMF', angle: -90, position: 'insideLeft', offset: 18, fill: '#a78bfa', fontSize: 11 }}
                        />
                        <ZAxis type="number" range={[36, 36]} />
                        <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', fontSize: 12, minWidth: 180 }}>
                                    <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{d.name}</div>
                                    <div style={{ color: '#94a3b8' }}>Form {d.form} · {d.className}</div>
                                    <div style={{ marginTop: 4, color: '#94a3b8' }}>Avg: <strong style={{ color: scoreColor(d.currentAvg) }}>{d.currentAvg}%</strong></div>
                                    <div style={{ color: '#94a3b8' }}>PMF: <strong style={{ color: amfColor(d.amf) }}>{d.amf}</strong> — {amfLabel(d.amf)}</div>
                                </div>
                            );
                        }} />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
                        <ReferenceLine y={5} stroke="rgba(16,185,129,0.15)" strokeDasharray="4 4" />
                        <ReferenceLine y={-5} stroke="rgba(239,68,68,0.15)" strokeDasharray="4 4" />
                        <Scatter data={scatterData} onClick={(d) => setSelectedStudent(d)} style={{ cursor: 'pointer' }}>
                            {scatterData.map((s) => (
                                <Cell key={s.id} fill={amfColor(s.amf)} fillOpacity={0.7} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</span>
                    {[['Surging ≥+5', '#10b981'], ['Gaining +1…+5', '#34d399'], ['Cruising ±1', '#64748b'], ['Fading −1…−5', '#f59e0b'], ['Stalling ≤−5', '#ef4444']].map(([l, c]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</span>
                        </div>
                    ))}
                </div>
            </HubCard>

            {/* ── Individual Drill-Down: Velocity & Acceleration Curves ── */}
            <HubCard style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <SectionHeader title={`Velocity & Acceleration — ${drillStudent?.name ?? 'Select a Player'}`} />
                    {drillStudent && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>PMF:</span>
                            <span style={{ fontWeight: 900, color: amfColor(drillStudent.amf), fontSize: 18 }}>{drillStudent.amf ?? '—'}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${amfColor(drillStudent.amf)}18`, color: amfColor(drillStudent.amf), fontWeight: 700 }}>
                                {amfLabel(drillStudent.amf)}
                            </span>
                        </div>
                    )}
                </div>
                {drillTimeline.length > 1 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Rating & Velocity */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Rating & Velocity (1st Derivative)
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={drillTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                                    <Tooltip content={<CurveTooltip />} />
                                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} name="Rating" dot={{ r: 3, fill: '#3b82f6' }} />
                                    <Line type="monotone" dataKey="velocity" stroke="#10b981" strokeWidth={2} name="Velocity" dot={{ r: 3, fill: '#10b981' }} connectNulls />
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Acceleration */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Acceleration (2nd Derivative)
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={drillTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                                    <Tooltip content={<CurveTooltip />} />
                                    <Area type="monotone" dataKey="acceleration" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={2} name="Acceleration" dot={{ r: 3, fill: '#a78bfa' }} connectNulls />
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
                        Insufficient data points to render curves. Select a player with more historical matchdays.
                    </div>
                )}

                {/* Mini legend */}
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                    {[['Rating', '#3b82f6'], ['Velocity (Δscore)', '#10b981'], ['Acceleration (Δ²score)', '#a78bfa']].map(([l, c]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 3, borderRadius: 2, background: c }} />
                            {l}
                        </div>
                    ))}
                </div>
            </HubCard>

            {/* ── Top Accelerators & Decelerators ── */}
            <ResizableHSplit
                defaultSplit={50} min={25} max={75}
                left={
                    <HubCard>
                        <SectionHeader title="Top Accelerators" infoKey="momentum" count={topAccel.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Highest positive PMF — improvement is accelerating.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {topAccel.map((s, i) => (
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
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{s.currentAvg}%</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>+{s.amf}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Top Decelerators" infoKey="momentum" count={topDecel.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Lowest PMF — improvement is slowing or reversing.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {topDecel.map((s, i) => (
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
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{s.currentAvg}%</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#ef4444', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>{s.amf}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
            />

            {/* ── Form-Level AMF Comparison ── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="PMF by Squad Level" infoKey="momentum" />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Average Player Momentum Factor per age group. Negative values indicate squad-wide deceleration.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {formAMF.map(g => (
                        <div key={g.grade} style={{
                            padding: '16px', borderRadius: 8, textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)', border: `1px solid ${g.color}33`,
                            borderTop: `2px solid ${g.color}`,
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 6 }}>{g.grade}</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: amfColor(g.amf) }}>{g.amf >= 0 ? '+' : ''}{g.amf}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{g.count} players</div>
                            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: amfColor(g.amf), padding: '2px 8px', borderRadius: 99, background: `${amfColor(g.amf)}15`, display: 'inline-block' }}>
                                {amfLabel(g.amf)}
                            </div>
                        </div>
                    ))}
                </div>
            </HubCard>
        </div>
    );
}

