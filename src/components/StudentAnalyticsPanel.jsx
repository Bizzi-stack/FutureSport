import { useMemo, useState } from 'react';
import {
    ResponsiveContainer, Tooltip,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
    AreaChart, Area,
} from 'recharts';
import { YEARS, TERMS, SUBJECTS, TEAMS, ALL_STUDENTS, getOverallAvg } from '../data/mockData';

// ── Shared helpers ────────────────────────────────────────────────────
function scoreColor(s) {
    if (s >= 75) return '#10b981';
    if (s >= 55) return '#f59e0b';
    return '#ef4444';
}

const TT_STYLE = {
    contentStyle: { background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', fontSize: '11px', padding: '8px 12px' },
    labelStyle: { color: '#94a3b8', fontWeight: '600', fontSize: '10px' },
    itemStyle: { color: '#cbd5e1' },
};

function MiniCard({ children, style = {}, title, icon }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            ...style,
        }}>
            {title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    {icon && <span style={{ fontSize: '13px' }}>{icon}</span>}
                    <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</span>
                </div>
            )}
            {children}
        </div>
    );
}

// ── 1. Subject Radar ──────────────────────────────────────────────────
function SubjectRadar({ student, classmates, year, term }) {
    const data = useMemo(() => {
        return SUBJECTS.map(sub => {
            const studentScore = student.performance?.[year]?.[term]?.[sub] ?? 0;
            const classScores = classmates.map(s => s.performance?.[year]?.[term]?.[sub] ?? 0).filter(v => v > 0);
            const classAvg = classScores.length ? Math.round(classScores.reduce((a, b) => a + b, 0) / classScores.length) : 0;
            return { subject: sub, Player: studentScore, 'Squad Avg': classAvg };
        });
    }, [student, classmates, year, term]);

    return (
        <MiniCard title="Stat Category Profile">
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} outerRadius="72%">
                        <PolarGrid stroke="rgba(255,255,255,0.07)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                        <Radar name="Squad Avg" dataKey="Squad Avg" stroke="#334155" fill="#334155" fillOpacity={0.15} strokeWidth={1} strokeDasharray="4 4" />
                        <Radar name="Player" dataKey="Player" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                        <Tooltip {...TT_STYLE} formatter={(v) => [`${v}%`]} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                    <div style={{ width: '10px', height: '3px', background: '#3b82f6', borderRadius: '2px' }} /> Player
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                    <div style={{ width: '10px', height: '3px', background: '#334155', borderRadius: '2px', borderTop: '1px dashed #64748b' }} /> Squad Avg
                </div>
            </div>
        </MiniCard>
    );
}

// ── 2. Grade Trend ────────────────────────────────────────────────────
function GradeTrend({ student }) {
    const data = useMemo(() => {
        const pts = [];
        for (const yr of YEARS) {
            for (const t of TERMS) {
                const avg = getOverallAvg(student, yr, t);
                if (avg > 0) {
                    pts.push({
                        label: `${yr.slice(2, 4)}/${yr.slice(7, 9)} ${t.replace('Matchday ', 'M')}`,
                        avg,
                    });
                }
            }
        }
        return pts;
    }, [student]);

    const min = Math.min(...data.map(d => d.avg));
    const max = Math.max(...data.map(d => d.avg));
    const domainMin = Math.max(0, min - 10);
    const domainMax = Math.min(100, max + 10);

    return (
        <MiniCard title="Rating Trend (All Years)">
            <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                        <defs>
                            <linearGradient id="gradeTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#475569' }} interval="preserveStartEnd" />
                        <YAxis domain={[domainMin, domainMax]} tick={{ fontSize: 9, fill: '#475569' }} />
                        <Tooltip {...TT_STYLE} formatter={(v) => [`${v}%`, 'Overall Rating Avg']} />
                        <Area type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} fill="url(#gradeTrendFill)" dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#60a5fa' }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </MiniCard>
    );
}

// ── 3. Momentum Gauge ─────────────────────────────────────────────────
function MomentumGauge({ student, year, term }) {
    const { delta, sparkData } = useMemo(() => {
        const termIdx = TERMS.indexOf(term);
        let prevYear = year;
        let prevTerm;
        if (termIdx > 0) {
            prevTerm = TERMS[termIdx - 1];
        } else {
            const yi = YEARS.indexOf(year);
            prevYear = yi > 0 ? YEARS[yi - 1] : year;
            prevTerm = TERMS[TERMS.length - 1];
        }

        const currAvg = getOverallAvg(student, year, term);
        const prevAvg = getOverallAvg(student, prevYear, prevTerm);
        const d = currAvg > 0 && prevAvg > 0 ? currAvg - prevAvg : 0;

        // Build a sparkline from the last 6 terms
        const spark = [];
        for (const yr of YEARS) {
            for (const t of TERMS) {
                const a = getOverallAvg(student, yr, t);
                if (a > 0) spark.push({ t: `${yr.slice(5)}${t.slice(-1)}`, v: a });
            }
        }

        return { delta: d, sparkData: spark.slice(-6) };
    }, [student, year, term]);

    const color = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#64748b';
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';

    return (
        <MiniCard title="Momentum">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '900', color, lineHeight: 1 }}>
                        {arrow} {Math.abs(delta)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>pts this matchday</div>
                </div>
                <div style={{ flex: 1, height: 60 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                            <defs>
                                <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#momentumFill)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MiniCard>
    );
}

// ── 4. Pro Academy Readiness ──────────────────────────────────────────
function CsecReadiness({ student, year, term }) {
    const { passRate, subjectPasses } = useMemo(() => {
        const performance = student.performance?.[year]?.[term];
        if (!performance) return { passRate: 0, subjectPasses: [] };
        const entries = Object.entries(performance);
        const passed = entries.filter(([, v]) => v >= 50);
        const rate = entries.length ? Math.round((passed.length / entries.length) * 100) : 0;
        return {
            passRate: rate,
            subjectPasses: entries.map(([sub, v]) => ({ sub, v, pass: v >= 50 })),
        };
    }, [student, year, term]);

    // SVG circular progress ring
    const r = 38;
    const circ = 2 * Math.PI * r;
    const offset = circ - (passRate / 100) * circ;
    const ringColor = passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <MiniCard title="Pro Academy Readiness">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                        <circle cx="50" cy="50" r={r} fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: '900', color: ringColor }}>{passRate}%</span>
                        <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>PASS RATE</span>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {subjectPasses.map(({ sub, v, pass }) => (
                        <div key={sub} style={{
                            fontSize: '9px', fontWeight: '700', padding: '3px 7px', borderRadius: '6px',
                            background: pass ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: pass ? '#34d399' : '#f87171',
                            border: `1px solid ${pass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                            {sub} {v}%
                        </div>
                    ))}
                </div>
            </div>
        </MiniCard>
    );
}

// ── 5. Z-Score Position ───────────────────────────────────────────────
function ZScorePosition({ student, classmates, year, term }) {
    const { zScore, label } = useMemo(() => {
        const studentAvg = getOverallAvg(student, year, term);
        const classAvgs = classmates.map(s => getOverallAvg(s, year, term)).filter(v => v > 0);
        if (classAvgs.length < 2 || studentAvg === 0) return { zScore: 0, label: 'N/A' };

        const mean = classAvgs.reduce((a, b) => a + b, 0) / classAvgs.length;
        const variance = classAvgs.reduce((sum, v) => sum + (v - mean) ** 2, 0) / classAvgs.length;
        const sd = Math.sqrt(variance);
        if (sd === 0) return { zScore: 0, label: 'N/A' };

        const z = (studentAvg - mean) / sd;
        let lbl;
        if (z >= 2) lbl = 'Exceptional';
        else if (z >= 1) lbl = 'Above Average';
        else if (z >= -1) lbl = 'Average';
        else if (z >= -2) lbl = 'Below Average';
        else lbl = 'At Risk';

        return { zScore: Math.round(z * 100) / 100, label: lbl };
    }, [student, classmates, year, term]);

    const barColor = zScore >= 1 ? '#10b981' : zScore >= -1 ? '#3b82f6' : '#ef4444';
    // Map z-score to percentage for display (z = -3 to 3 mapped to 0-100%)
    const pct = Math.max(2, Math.min(98, ((zScore + 3) / 6) * 100));

    return (
        <MiniCard title="Z-Score Position">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: barColor, lineHeight: 1 }}>
                        {zScore > 0 ? '+' : ''}{zScore}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>{label}</div>
                </div>
                <div style={{ flex: 1 }}>
                    {/* Bell curve bar */}
                    <div style={{ position: 'relative', height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Gradient representing bell curve */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(59,130,246,0.15) 50%, rgba(16,185,129,0.15) 100%)',
                        }} />
                        {/* Mean line */}
                        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.15)' }} />
                        {/* ±1 SD markers */}
                        <div style={{ position: 'absolute', left: 'calc(50% - 16.67%)', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ position: 'absolute', left: 'calc(50% + 16.67%)', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        {/* Student marker */}
                        <div style={{
                            position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)',
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: barColor, border: '2px solid rgba(255,255,255,0.3)',
                            boxShadow: `0 0 8px ${barColor}80`,
                            transition: 'left 0.4s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#475569', marginTop: '3px', padding: '0 2px' }}>
                        <span>-3σ</span><span>-1σ</span><span>μ</span><span>+1σ</span><span>+3σ</span>
                    </div>
                </div>
            </div>
        </MiniCard>
    );
}

// ── 6. Squad Rank ─────────────────────────────────────────────────────
function ClassRank({ student, classmates, year, term }) {
    const { rank, total, percentile } = useMemo(() => {
        const ranked = classmates
            .map(s => ({ id: s.id, avg: getOverallAvg(s, year, term) }))
            .filter(s => s.avg > 0)
            .sort((a, b) => b.avg - a.avg);

        const idx = ranked.findIndex(s => s.id === student.id);
        return {
            rank: idx >= 0 ? idx + 1 : ranked.length,
            total: ranked.length,
            percentile: ranked.length > 1 ? Math.round(((ranked.length - (idx >= 0 ? idx + 1 : ranked.length)) / (ranked.length - 1)) * 100) : 100,
        };
    }, [student, classmates, year, term]);

    const pctColor = percentile >= 75 ? '#10b981' : percentile >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <MiniCard title="Squad Rank">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                        {rank}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>of {total}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Percentile</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: pctColor }}>{percentile}th</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${percentile}%`,
                            background: `linear-gradient(90deg, ${pctColor}cc, ${pctColor})`,
                            borderRadius: '99px',
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#475569', marginTop: '3px' }}>
                        <span>Bottom</span><span>Top</span>
                    </div>
                </div>
            </div>
        </MiniCard>
    );
}

// ── Main Panel ────────────────────────────────────────────────────────
export default function StudentAnalyticsPanel({ student, year, term }) {
    const [expanded, setExpanded] = useState(true);

    // Get squadmates for comparison
    const { classmates, className } = useMemo(() => {
        const teamId = student.teamAssignments?.[year];
        const teamObj = TEAMS.find(c => c.id === teamId);
        const mates = teamId ? ALL_STUDENTS.filter(s => s.teamAssignments?.[year] === teamId) : [];
        return { classmates: mates, className: teamObj?.name ?? 'Unknown' };
    }, [student, year]);

    return (
        <section>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px 0',
                    color: 'var(--text-primary)', fontFamily: 'inherit',
                }}
            >
                <span className="section-title" style={{ margin: 0, flex: 1, textAlign: 'left' }}>Analytics Hub</span>
                <span style={{
                    fontSize: '9px', fontWeight: '700', color: '#64748b',
                    background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {className}
                </span>
                <span style={{
                    fontSize: '10px', color: '#64748b',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                }}>▼</span>
            </button>

            {expanded && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    animation: 'fadeIn 0.25s ease',
                }}>
                    <SubjectRadar student={student} classmates={classmates} year={year} term={term} />
                    <GradeTrend student={student} />
                    <MomentumGauge student={student} year={year} term={term} />
                    <CsecReadiness student={student} year={year} term={term} />
                    <ZScorePosition student={student} classmates={classmates} year={year} term={term} />
                    <ClassRank student={student} classmates={classmates} year={year} term={term} />
                </div>
            )}
        </section>
    );
}
