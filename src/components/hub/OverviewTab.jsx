import { useMemo } from 'react';
import {
    HubCard, SectionHeader, Empty, ScoreBar, scoreColor, RankBadge,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    LineChart, Line, ReferenceLine, AreaChart, Area,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, SCHOOLS, SUBJECTS, YEARS, TERMS, AGE_GROUPS } from '../../data/mockData';

// ── Helpers ──────────────────────────────────────────────────────────
function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return 0;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}

export default function OverviewTab({ year, term, selectedSchool }) {
    
    // ── Performance Analytics Engine (Macro Level) ────────────────────────
    const macroStats = useMemo(() => {
        let totalMomentum = 0;
        let totalDrawdown = 0;
        let eliteCount = 0;
        let volatileCount = 0;
        let proReady = 0;
        let validStudents = 0;

        let activeStudentsList = selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool);
        activeStudentsList.forEach(s => {
            const points = [];
            for (const y of YEARS) {
                for (const t of TERMS) {
                    const performance = Object.values(s.performance?.[y]?.[t] || {}).filter(v => v > 0);
                    if (performance.length) points.push(performance.reduce((a, b) => a + b, 0) / performance.length);
                    if (y === year && t === term) break;
                }
                if (y === year) break;
            }
            if (points.length < 2) return;
            validStudents++;

            // Momentum
            const recent = points.slice(-4);
            const n = recent.length;
            const xMean = (n - 1) / 2;
            const yMean = recent.reduce((a, b) => a + b, 0) / n;
            let num = 0, den = 0;
            for (let i = 0; i < n; i++) {
                num += (i - xMean) * (recent[i] - yMean);
                den += (i - xMean) ** 2;
            }
            const slope = den === 0 ? 0 : num / den;
            totalMomentum += slope;

            // Drawdown
            let peak = 0;
            points.forEach(p => { if (p > peak) peak = p; });
            const finalDrawdown = peak - points[points.length - 1];
            totalDrawdown += Math.max(0, finalDrawdown);

            // Factor Proxy
            const amfScore = Math.max(0, Math.min(100, 75 + (slope * 10)));
            const variance = recent.reduce((a, b) => a + Math.pow(b - yMean, 2), 0) / n;
            const vol = Math.sqrt(variance);
            const consScore = Math.max(0, Math.min(100, 100 - (vol * 2.5)));
            
            const bData = s.matchStats?.[year]?.[term];
            const att = bData?.gamesPlayed ?? 0;
            const cond = bData?.yellowCards ?? 0;
            const late = bData?.minutesPlayed ?? 0;
            const beh = Math.max(0, Math.min(100, 100 - (cond * 10) - (late * 2)));

            let recScore = 70;
            if (n >= 2) recScore = Math.max(0, Math.min(100, 70 + ((recent[n-1] - recent[n-2]) * 15)));

            const composite = (amfScore * 0.25) + (consScore * 0.20) + (recScore * 0.15) + (att * 0.20) + (beh * 0.20);
            if (composite >= 80) eliteCount++;
            if (composite < 65) volatileCount++;

            // Readiness Proxy
            if (points[points.length - 1] >= 70 && slope > -1 && finalDrawdown < 10) {
                proReady++;
            }
        });

        return {
            avgMomentum: validStudents ? (totalMomentum / validStudents).toFixed(2) : 0,
            avgDrawdown: validStudents ? (totalDrawdown / validStudents).toFixed(1) : 0,
            elitePct: validStudents ? Math.round((eliteCount / validStudents) * 100) : 0,
            volatilePct: validStudents ? Math.round((volatileCount / validStudents) * 100) : 0,
            proReady,
            validStudents
        };
    }, [year, term]);

    // ── Trend Data ──────────────────────────────────────────────────
    const terms = ['Matchday 1', 'Matchday 2', 'Matchday 3'];
    const trendData = useMemo(() =>
        terms.map(t => {
            const avgs = ALL_STUDENTS
                .filter(s => (selectedSchool === 'ALL' || s.schoolId === selectedSchool) && TEAMS.some(c => s.teamAssignments?.[year] === c.id))
                .map(s => getOverall(s, year, t)).filter(v => v > 0);
            return { term: t, avg: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0 };
        }),
    [year]);

    // ── Momentum Leaderboard ─────────────────────────────────────────
    const leaderboardData = useMemo(() => {
        if (selectedSchool === 'ALL') {
            return SCHOOLS.map(sch => {
                const students = ALL_STUDENTS.filter(s => s.schoolId === sch.id && s.teamAssignments?.[year]);
                if (!students.length) return null;
                const avgs = students.map(s => getOverall(s, year, term)).filter(v => v > 0);
                const avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
                
                let totalSlope = 0;
                students.forEach(s => {
                    const points = [
                        getOverall(s, year, 'Matchday 1'),
                        getOverall(s, year, 'Matchday 2'),
                        getOverall(s, year, 'Matchday 3')
                    ].filter(v => v > 0);
                    if (points.length >= 2) {
                        totalSlope += (points[points.length - 1] - points[0]) / (points.length - 1);
                    }
                });
                const momentum = students.length ? (totalSlope / students.length).toFixed(1) : 0;

                return { id: sch.id, name: sch.name, subtitle: 'Academy', avg, count: students.length, momentum: parseFloat(momentum) };
            }).filter(Boolean).sort((a, b) => b.momentum - a.momentum);
        } else {
            return TEAMS.filter(c => c.schoolId === selectedSchool).map(c => {
                const students = ALL_STUDENTS.filter(s => s.teamAssignments?.[year] === c.id);
                if (!students.length) return null;
                const avgs = students.map(s => getOverall(s, year, term)).filter(v => v > 0);
                const avg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
                
                let totalSlope = 0;
                students.forEach(s => {
                    const points = [
                        getOverall(s, year, 'Matchday 1'),
                        getOverall(s, year, 'Matchday 2'),
                        getOverall(s, year, 'Matchday 3')
                    ].filter(v => v > 0);
                    if (points.length >= 2) {
                        totalSlope += (points[points.length - 1] - points[0]) / (points.length - 1);
                    }
                });
                const momentum = students.length ? (totalSlope / students.length).toFixed(1) : 0;

                return { id: c.id, name: c.name, subtitle: `Squad ${c.gradeNum}`, avg, count: students.length, momentum: parseFloat(momentum) };
            }).filter(Boolean).sort((a, b) => b.momentum - a.momentum);
        }
    }, [year, term, selectedSchool]);

    const globalAvg = leaderboardData.length
        ? Math.round(leaderboardData.reduce((a, c) => a + c.avg * c.count, 0) / Math.max(1, macroStats.validStudents))
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ── Executive KPI Row ───────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>{selectedSchool === 'ALL' ? 'Global Average' : 'Academy Average'}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: scoreColor(globalAvg) }}>{globalAvg}%</div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Systemic Momentum</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: macroStats.avgMomentum > 0 ? '#10b981' : '#ef4444' }}>
                        {macroStats.avgMomentum > 0 ? '+' : ''}{macroStats.avgMomentum} <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>pts/matchday</span>
                    </div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Mean Drawdown Risk</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: macroStats.avgDrawdown > 5 ? '#f59e0b' : '#3b82f6' }}>
                        -{macroStats.avgDrawdown} <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>pts from peak</span>
                    </div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Quant High Potential</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#8b5cf6' }}>
                        {macroStats.elitePct}% <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>of cohort</span>
                    </div>
                </HubCard>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Pro Ready (Projection)</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#2dd4bf' }}>
                        {macroStats.proReady} <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>players</span>
                    </div>
                </HubCard>
            </div>

            {/* ── Macro Analytics Split ───────────────────────────────────── */}
            <ResizableHSplit
                defaultSplit={60} min={40} max={70} gap={16}
                left={
                    <HubCard style={{ height: 320 }}>
                        <SectionHeader title={`Macro Trajectory — ${year}`} />
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="term" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip {...TT_STYLE} formatter={v => [`${v}%`, 'Academy Avg']} />
                                <ReferenceLine y={55} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                                <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />
                                <Area type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </HubCard>
                }
                right={
                    <HubCard style={{ height: 320 }}>
                        <SectionHeader title="Multi-Factor Risk Distribution" infoKey="risk-distribution" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', height: '100%', paddingBottom: '30px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: '700', color: '#8b5cf6' }}>
                                    <span>Elite / High Potential (Score 80+)</span>
                                    <span>{macroStats.elitePct}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${macroStats.elitePct}%`, background: '#8b5cf6', borderRadius: '4px' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: '700', color: '#10b981' }}>
                                    <span>Stable Core (Score 65-79)</span>
                                    <span>{100 - macroStats.elitePct - macroStats.volatilePct}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${100 - macroStats.elitePct - macroStats.volatilePct}%`, background: '#10b981', borderRadius: '4px' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: '700', color: '#f59e0b' }}>
                                    <span>Volatile Risk (Score &lt;65)</span>
                                    <span>{macroStats.volatilePct}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${macroStats.volatilePct}%`, background: '#f59e0b', borderRadius: '4px' }} />
                                </div>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '12px', textAlign: 'center' }}>
                                Based on advanced Multi-Factor Model (Momentum, Volatility, Recovery, Games Played, Match Stats).
                            </div>
                        </div>
                    </HubCard>
                }
            />

            {/* ── Momentum Leaderboard ──────────────────────────────── */}
            <HubCard>
                <SectionHeader title={selectedSchool === 'ALL' ? "Academy Momentum Leaderboard" : "Squad Momentum Leaderboard"} count={leaderboardData.length} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px', marginTop: '12px' }}>
                    {leaderboardData.map((c, i) => (
                        <div key={c.id} style={{ 
                            padding: '12px 16px', borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RankBadge rank={i} />
                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }}>{c.name}</span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: c.momentum > 0 ? '#10b981' : c.momentum < 0 ? '#ef4444' : '#64748b' }}>
                                    {c.momentum > 0 ? '+' : ''}{c.momentum}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                                <span>{c.subtitle} · {c.count} players</span>
                                <span>Avg: <strong style={{color: scoreColor(c.avg)}}>{c.avg}%</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            </HubCard>
        </div>
    );
}
