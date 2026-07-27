import { useMemo, useState, useRef, useEffect } from 'react';
import {
    HubCard, SectionHeader, TT_STYLE,
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ZAxis,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, SUBJECTS, YEARS, TERMS, AGE_GROUPS } from '../../data/mockData';

// ── Metric definitions ─────────────────────────────────────────────────
const METRIC_GROUPS = [
    {
        label: 'Performance',
        color: '#3b82f6',
        metrics: [
            ...SUBJECTS.map(s => ({ id: `grade_${s}`, label: `${s}`, unit: '%', desc: `Current ${s} rating` })),
            { id: 'grade_overall', label: 'Overall Rating', unit: '%', desc: 'Average across all metrics' },
        ],
    },
    {
        label: 'Discipline & Playtime',
        color: '#10b981',
        metrics: [
            { id: 'gamesPlayed',         label: 'Games Played Rate',         unit: '%',  desc: 'Percentage of matches played' },
            { id: 'redCards',            label: 'Red Cards',                 unit: '',   desc: 'Red cards received' },
            { id: 'minutesPlayed',       label: 'Minutes Played',            unit: ' min',desc: 'Minutes played on the field' },
            { id: 'yellowCards',         label: 'Yellow Cards',              unit: '',   desc: 'Yellow cards received' },
        ],
    },
    {
        label: 'Extracurricular',
        color: '#f59e0b',
        metrics: [
            { id: 'extracurricularCount', label: 'Activities Count', unit: '',  desc: 'Number of extracurricular activities' },
            { id: 'hasSport',             label: 'Plays Sport',      unit: '',  desc: '1 = plays a sport, 0 = does not' },
        ],
    },
];

const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);

function getMetric(student, year, term, id) {
    if (id === 'grade_overall') {
        const g = student.performance?.[year]?.[term];
        if (!g) return null;
        const vals = Object.values(g).filter(v => v > 0);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    }
    if (id.startsWith('grade_')) {
        const sub = id.slice(6);
        return student.performance?.[year]?.[term]?.[sub] ?? null;
    }
    if (id === 'gamesPlayed')         return student.matchStats?.[year]?.[term]?.gamesPlayed ?? null;
    if (id === 'redCards') return student.matchStats?.[year]?.[term]?.redCards ?? null;
    if (id === 'minutesPlayed')       return student.matchStats?.[year]?.[term]?.minutesPlayed ?? null;
    if (id === 'yellowCards')   return student.matchStats?.[year]?.[term]?.yellowCards ?? null;
    if (id === 'extracurricularCount') return student.extracurriculars?.length ?? 0;
    if (id === 'hasSport') return student.extracurriculars?.some(e => e.category === 'sport') ? 1 : 0;
    return null;
}

function getMeta(id) { return ALL_METRICS.find(m => m.id === id); }

// Correlation coefficient r
function pearson(data) {
    const n = data.length;
    if (n < 3) return null;
    const mx = data.reduce((a, d) => a + d.x, 0) / n;
    const my = data.reduce((a, d) => a + d.y, 0) / n;
    let num = 0, dx2 = 0, dy2 = 0;
    for (const d of data) {
        const dx = d.x - mx, dy = d.y - my;
        num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
    }
    const denom = Math.sqrt(dx2 * dy2);
    return denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;
}

// Quadrant label colour
function qColor(label) {
    if (label === 'High / High') return '#10b981';
    if (label === 'Low / Low')   return '#ef4444';
    return '#f59e0b';
}

// Dot colour: form group
const FORM_COLORS = ['#3b82f6','#0ea5e9','#14b8a6','#f59e0b','#a78bfa'];

// Preset correlation suggestions (like FM's "Ask for" menu)
const PRESETS = [
    { label: 'Games Played → Goals',           x: 'gamesPlayed',         y: 'grade_Goals'         },
    { label: 'Minutes Played → Overall Rating',x: 'minutesPlayed',       y: 'grade_overall'       },
    { label: 'Yellow Cards → Goals',           x: 'yellowCards',         y: 'grade_Goals'         },
    { label: 'Minutes Played → Shot Accuracy', x: 'minutesPlayed',       y: 'grade_Shot Accuracy' },
    { label: 'Sport → Overall Rating',         x: 'hasSport',            y: 'grade_overall'       },
    { label: 'Activities → Goals',             x: 'extracurricularCount',y: 'grade_Goals'         },
    { label: 'Games Played → Yellow Cards',    x: 'gamesPlayed',         y: 'yellowCards'         },
    { label: 'Minutes Played → Goals',         x: 'minutesPlayed',       y: 'grade_Goals'         },
];

// Custom tooltip dot info
function DotTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div style={{
            background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px', minWidth: '160px',
        }}>
            <div style={{ fontWeight: '700', marginBottom: '6px', color: '#e2e8f0' }}>{d.name}</div>
            <div style={{ color: '#94a3b8' }}>Squad: {d.form === 1 ? 'U14' : d.form === 2 ? 'U16' : 'U19'}</div>
            <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                X: <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{d.x}{d.xUnit}</span>
            </div>
            <div style={{ color: '#94a3b8' }}>
                Y: <span style={{ color: '#34d399', fontWeight: '600' }}>{d.y}{d.yUnit}</span>
            </div>
        </div>
    );
}

// ── Custom grouped metric dropdown ────────────────────────────────────
function MetricSelect({ value, onChange, accentColor }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = ALL_METRICS.find(m => m.id === value);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `${accentColor}11`, border: `1px solid ${accentColor}33`,
                    color: '#e2e8f0', borderRadius: '8px', padding: '8px 10px', fontSize: '12px',
                    fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${accentColor}66`; e.currentTarget.style.background = `${accentColor}1a`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${accentColor}33`; e.currentTarget.style.background = `${accentColor}11`; }}
            >
                <span style={{ fontWeight: 600 }}>{selected?.label ?? 'Select…'}</span>
                <span style={{ color: accentColor, fontSize: '10px', marginLeft: '8px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                    background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', padding: '6px', boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                    maxHeight: '320px', overflowY: 'auto',
                }}>
                    {METRIC_GROUPS.map((g, gi) => (
                        <div key={g.label}>
                            {/* Category header */}
                            {gi > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />}
                            <div style={{
                                fontSize: '9px', fontWeight: '800', letterSpacing: '0.12em',
                                textTransform: 'uppercase', color: g.color,
                                padding: '6px 10px 3px', userSelect: 'none',
                            }}>
                                {g.label}
                            </div>
                            {/* Metrics in this group */}
                            {g.metrics.map(m => {
                                const isActive = m.id === value;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => { onChange(m.id); setOpen(false); }}
                                        style={{
                                            display: 'block', width: '100%', textAlign: 'left',
                                            padding: '7px 12px', borderRadius: '6px', fontSize: '12px',
                                            fontFamily: 'inherit', border: 'none', cursor: 'pointer',
                                            background: isActive ? `${accentColor}22` : 'transparent',
                                            color: isActive ? accentColor : '#cbd5e1',
                                            fontWeight: isActive ? '700' : '400',
                                            transition: 'background 0.1s, color 0.1s',
                                        }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; }}}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}}
                                    >
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function CorrelationExplorerTab({ year, term, selectedSchool, onStudentClick }) {
    const [xMetric, setXMetric] = useState('gamesPlayed');
    const [yMetric, setYMetric] = useState('grade_Goals');
    const [formFilter, setFormFilter] = useState('all');
    const [showPresets, setShowPresets] = useState(false);
    const [quadrantFilter, setQuadrantFilter] = useState(null);

    const xMeta = getMeta(xMetric);
    const yMeta = getMeta(yMetric);

    // Build scatter data
    const { points, xMed, yMed, r, quadrants } = useMemo(() => {
        const formNum = formFilter === 'all' ? null : parseInt(formFilter);
        const pts = [];
        for (const s of (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))) {
            const teamId = s.teamAssignments?.[year];
            if (!teamId) continue;
            const teamObj = TEAMS.find(c => c.id === teamId);
            if (!teamObj) continue;
            if (formNum !== null && teamObj.gradeNum !== formNum) continue;
            const x = getMetric(s, year, term, xMetric);
            const y = getMetric(s, year, term, yMetric);
            if (x == null || y == null) continue;
            pts.push({ x, y, name: s.name, form: teamObj.gradeNum, id: s.id, student: s,
                xUnit: xMeta?.unit || '', yUnit: yMeta?.unit || '' });
        }

        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const xm = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 50;
        const ym = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 50;

        const q = { hh: 0, hl: 0, lh: 0, ll: 0 };
        pts.forEach(p => {
            const hi = p.x >= xm, hiy = p.y >= ym;
            if (hi && hiy) { q.hh++; p.q = 'hh'; }
            else if (hi && !hiy) { q.hl++; p.q = 'hl'; }
            else if (!hi && hiy) { q.lh++; p.q = 'lh'; }
            else { q.ll++; p.q = 'll'; }
        });

        return { points: pts, xMed: Math.round(xm), yMed: Math.round(ym), r: pearson(pts), quadrants: q };
    }, [year, term, xMetric, yMetric, formFilter, xMeta, yMeta]);

    const filteredPoints = quadrantFilter ? points.filter(p => p.q === quadrantFilter) : points;

    const rStrength = r === null ? '—'
        : Math.abs(r) >= 0.6 ? (r > 0 ? 'Strong Positive' : 'Strong Negative')
        : Math.abs(r) >= 0.3 ? (r > 0 ? 'Moderate Positive' : 'Moderate Negative')
        : 'Weak / None';
    const rColor = r === null ? '#64748b'
        : Math.abs(r) >= 0.6 ? (r > 0 ? '#10b981' : '#ef4444')
        : Math.abs(r) >= 0.3 ? '#f59e0b' : '#64748b';

    const btnBase = (active, color = '#3b82f6') => ({
        padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
        background: active ? `${color}22` : 'transparent',
        color: active ? color : 'var(--text-muted)',
        border: active ? `1px solid ${color}44` : '1px solid transparent',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Header Controls ───────────────────────────────────── */}
            <HubCard style={{ flex: 'none', overflow: 'visible', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

                    {/* Title */}
                    <div style={{ flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Correlation Explorer
                        </div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '280px', lineHeight: 1.5 }}>
                            Plot any two player metrics against each other to discover hidden insights.
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        {/* X Axis selector */}
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                                X Axis (Input)
                            </div>
                            <MetricSelect value={xMetric} onChange={setXMetric} accentColor="#3b82f6" />
                        </div>

                        {/* Y Axis selector */}
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                                Y Axis (Outcome)
                            </div>
                            <MetricSelect value={yMetric} onChange={setYMetric} accentColor="#10b981" />
                        </div>

                        {/* Form filter */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                                Cohort
                            </div>
                            <div style={{ display: 'flex', gap: '3px' }}>
                                {['all', '1', '2', '3'].map(f => (
                                    <button key={f} onClick={() => setFormFilter(f)}
                                        style={btnBase(formFilter === f)}>
                                        {f === 'all' ? 'All' : f === '1' ? 'U14' : f === '2' ? 'U16' : 'U19'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preset suggestions button */}
                        <div style={{ flexShrink: 0, position: 'relative' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                                Quick Insights
                            </div>
                            <button onClick={() => setShowPresets(p => !p)} style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                                background: showPresets ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
                                color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
                                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                ✦ Ask Analyst
                            </button>
                            {showPresets && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 10,
                                    background: '#0d1526', border: '1px solid rgba(99,102,241,0.25)',
                                    borderRadius: '10px', padding: '6px', minWidth: '220px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                }}>
                                    {PRESETS.map((p, i) => (
                                        <button key={i} onClick={() => { setXMetric(p.x); setYMetric(p.y); setShowPresets(false); }}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                padding: '8px 12px', borderRadius: '7px', fontSize: '12px',
                                                background: 'transparent', color: '#cbd5e1',
                                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </HubCard>

            {/* ── KPI Row ───────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {[
                    { label: 'Players Plotted', value: filteredPoints.length, color: '#e2e8f0' },
                    { label: 'Correlation (r)', value: r ?? '—', color: rColor },
                    { label: 'Strength', value: rStrength, color: rColor, small: true },
                    { label: 'High / High', value: quadrants.hh, color: '#10b981' },
                    { label: 'Low / Low',   value: quadrants.ll, color: '#ef4444' },
                    { label: 'X Median',    value: `${xMed}${xMeta?.unit || ''}`, color: '#3b82f6' },
                ].map(k => (
                    <HubCard key={k.label}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '6px' }}>{k.label}</div>
                        <div style={{ fontSize: k.small ? '14px' : '22px', fontWeight: '900', color: k.color, lineHeight: 1.2 }}>{k.value}</div>
                    </HubCard>
                ))}
            </div>

            {/* ── Scatter Plot ──────────────────────────────────────── */}
            <HubCard style={{ minHeight: '480px', flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <SectionHeader title={`${xMeta?.label ?? 'X'} vs ${yMeta?.label ?? 'Y'}`} count={filteredPoints.length} infoKey="correlation" />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {AGE_GROUPS.map((g, i) => (
                            <div key={g.gradeNum} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: FORM_COLORS[i] }} />
                                {g.ageGroup}
                            </div>
                        ))}
                    </div>
                </div>

                {filteredPoints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No data available for the selected combination.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={420}>
                        <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis
                                dataKey="x" type="number" name={xMeta?.label}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                label={{ value: `${xMeta?.label} (${xMeta?.unit})`, position: 'bottom', offset: 0, fontSize: 11, fill: '#3b82f6' }}
                            />
                            <YAxis
                                dataKey="y" type="number" name={yMeta?.label}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                label={{ value: `${yMeta?.label} (${yMeta?.unit})`, angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: '#10b981' }}
                            />
                            <ZAxis range={[28, 28]} />
                            <Tooltip content={<DotTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />

                            {/* Quadrant crosshairs */}
                            <ReferenceLine x={xMed} stroke="rgba(255,255,255,0.12)" strokeDasharray="6 3" />
                            <ReferenceLine y={yMed} stroke="rgba(255,255,255,0.12)" strokeDasharray="6 3" />

                            {/* One Scatter series per form for legend colours */}
                            {AGE_GROUPS.map((g, i) => {
                                const formPts = filteredPoints.filter(p => p.form === g.gradeNum);
                                return formPts.length ? (
                                    <Scatter
                                        key={g.gradeNum}
                                        name={g.ageGroup}
                                        data={formPts}
                                        fill={FORM_COLORS[i]}
                                        fillOpacity={0.75}
                                        onClick={d => onStudentClick?.(d.student)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ) : null;
                            })}
                        </ScatterChart>
                    </ResponsiveContainer>
                )}
            </HubCard>

            {/* ── Quadrant Insight Cards ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                    { q: 'hh', label: 'High / High', icon: '★', color: '#10b981', desc: `High ${xMeta?.label} AND high ${yMeta?.label}. These are your star performers — showcase and sustain.` },
                    { q: 'lh', label: 'Low / High',  icon: '◆', color: '#3b82f6', desc: `Low ${xMeta?.label} but high ${yMeta?.label}. Hidden talent despite barriers — investigate how they cope.` },
                    { q: 'hl', label: 'High / Low',  icon: '▲', color: '#f59e0b', desc: `High ${xMeta?.label} but low ${yMeta?.label}. Input isn't producing output — look for comprehension gaps.` },
                    { q: 'll', label: 'Low / Low',   icon: '●', color: '#ef4444', desc: `Low ${xMeta?.label} AND low ${yMeta?.label}. Priority intervention cohort — needs immediate support.` },
                ].map(card => {
                    const isActive = quadrantFilter === card.q;
                    const isMuted = quadrantFilter && !isActive;
                    return (
                    <HubCard 
                        key={card.q} 
                        style={{ 
                            borderTop: `2px solid ${card.color}`,
                            cursor: 'pointer',
                            opacity: isMuted ? 0.4 : 1,
                            transform: isActive ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                            boxShadow: isActive ? `0 8px 24px ${card.color}22` : 'none',
                        }}
                        onClick={() => setQuadrantFilter(isActive ? null : card.q)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ color: card.color, fontSize: '14px' }}>{card.icon}</span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: card.color, letterSpacing: '0.04em' }}>{card.label}</span>
                            <span style={{
                                marginLeft: 'auto', fontSize: '18px', fontWeight: '900', color: card.color,
                            }}>{quadrants[card.q]}</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                    </HubCard>
                )})}
            </div>

            {/* ── Outlier Table ─────────────────────────────────────── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Notable Outliers — Clickable Players" count={Math.min(filteredPoints.length, 30)} infoKey="correlation" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Players furthest from the median on both axes. Click any name to open their profile.
                </p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Player</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Squad</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>{xMeta?.label}</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>{yMeta?.label}</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Quadrant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...filteredPoints]
                                .sort((a, b) => (Math.abs(b.x - xMed) + Math.abs(b.y - yMed)) - (Math.abs(a.x - xMed) + Math.abs(a.y - yMed)))
                                .slice(0, 30)
                                .map((p, i) => {
                                    const hiX = p.x >= xMed, hiY = p.y >= yMed;
                                    const qLabel = hiX && hiY ? 'High / High' : !hiX && !hiY ? 'Low / Low' : hiX ? 'High / Low' : 'Low / High';
                                    return (
                                        <tr key={`${p.id}-${i}`} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                                            <td style={{ padding: '8px 10px' }}>
                                                <span onClick={() => onStudentClick?.(p.student)}
                                                    style={{ fontWeight: '700', cursor: 'pointer', color: '#a5b4fc' }}>
                                                    {p.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center', color: FORM_COLORS[p.form - 1], fontWeight: '700' }}>
                                                {p.form === 1 ? 'U14' : p.form === 2 ? 'U16' : 'U19'}
                                            </td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', color: hiX ? '#10b981' : '#ef4444' }}>
                                                {p.x}{xMeta?.unit}
                                            </td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', color: hiY ? '#10b981' : '#ef4444' }}>
                                                {p.y}{yMeta?.unit}
                                            </td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px',
                                                    background: `${qColor(qLabel)}18`, color: qColor(qLabel),
                                                }}>
                                                    {qLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </HubCard>
        </div>
    );
}

