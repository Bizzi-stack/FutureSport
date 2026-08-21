import { useMemo, useState } from 'react';
import {
    HubCard, SectionHeader, scoreColor, CHART_COLORS, TT_STYLE,
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
    ScatterChart, Scatter, ZAxis, Cell, Line, ComposedChart,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, YEARS, TERMS, getOverallAvg } from '../../data/mockData';

// ── Build ordered term timeline ──────────────────────────────────────
const ALL_TERM_POINTS = [];
for (const y of YEARS) for (const t of TERMS) ALL_TERM_POINTS.push({ year: y, term: t });

function termLabel(tp) { return `${tp.year.slice(2, 4)}/${tp.year.slice(7)} ${tp.term.replace('Matchday ', 'M')}`; }

// ── Statistical Helpers ──────────────────────────────────────────────
function computeMatchRhythm(student) {
    const points = [];
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    // Gather all valid data points (where student has both a grade and gamesPlayed)
    for (const tp of ALL_TERM_POINTS) {
        const score = getOverallAvg(student, tp.year, tp.term);
        const gamesPlayed = student.matchStats?.[tp.year]?.[tp.term]?.gamesPlayed;
        
        if (score > 0 && gamesPlayed != null) {
            points.push({ ...tp, label: termLabel(tp), x: gamesPlayed, y: score });
            sumX += gamesPlayed;
            sumY += score;
            sumXY += gamesPlayed * score;
            sumX2 += gamesPlayed * gamesPlayed;
        }
    }

    const n = points.length;
    if (n < 3) return { points, slope: null, intercept: null, r2: null }; // need enough points for regression

    const xMean = sumX / n;
    const yMean = sumY / n;
    
    // Variance denominator
    const denominator = sumX2 - sumX * xMean;
    
    if (denominator === 0) return { points, slope: 0, intercept: yMean, r2: 0 }; // Perfect gamesPlayed always

    const slope = (sumXY - sumX * yMean) / denominator;
    const intercept = yMean - slope * xMean;

    // R-squared (goodness of fit)
    let ssTot = 0, ssRes = 0;
    for (const p of points) {
        ssTot += Math.pow(p.y - yMean, 2);
        const predictedY = slope * p.x + intercept;
        ssRes += Math.pow(p.y - predictedY, 2);
    }
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    // Sort points by gamesPlayed for the regression line rendering
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    return { points, sortedPoints, slope, intercept, r2 };
}

function elasticityColor(slope) {
    if (slope == null) return '#64748b';
    if (slope >= 0.6) return '#ef4444'; // Needs Regular Minutes (steep slope, crash on absence)
    if (slope >= 0.3) return '#f59e0b'; // Sensitive
    if (slope >= 0.05) return '#10b981'; // Plug & Play
    if (slope >= -0.2) return '#34d399'; // Unaffected by Rotation
    return '#8b5cf6'; // Inverse (Anomalous)
}

function elasticityLabel(slope) {
    if (slope == null) return 'N/A';
    if (slope >= 0.6) return 'Needs Regular Minutes';
    if (slope >= 0.3) return 'Sensitive';
    if (slope >= 0.05) return 'Plug & Play';
    if (slope >= -0.2) return 'Unaffected by Rotation';
    return 'Anomalous';
}

// ── Custom Tooltips ──────────────────────────────────────────────────
function MatchRhythmScatterTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px', minWidth: 180,
        }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{d.name}</div>
            <div style={{ color: '#94a3b8' }}>{d.className}</div>
            <div style={{ marginTop: 4, color: '#94a3b8' }}>Avg "Games Played": <strong style={{ color: '#38bdf8' }}>{d.avgAttendance}%</strong></div>
            <div style={{ color: '#94a3b8' }}>Match Rhythm (Slope): <strong style={{ color: elasticityColor(d.slope) }}>{d.slope.toFixed(2)}</strong></div>
            <div style={{ color: '#94a3b8' }}>Profile: <strong style={{ color: elasticityColor(d.slope) }}>{elasticityLabel(d.slope)}</strong></div>
        </div>
    );
}

function RegressionTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px', minWidth: 140,
        }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{d.label}</div>
            <div style={{ color: '#38bdf8' }}>"Games Played": <strong>{d.x}%</strong></div>
            <div style={{ color: '#10b981' }}>Score: <strong>{d.y}%</strong></div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────
export default function ElasticityTab({ year, term, selectedSchool, onStudentClick }) {
    const [selectedStudent, setSelectedStudent] = useState(null);

    // 1. Calculate elasticity for all active students
    const students = useMemo(() => {
        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
            .map(s => {
                const { points, sortedPoints, slope, intercept, r2 } = computeMatchRhythm(s);
                const teamObj = TEAMS.find(c => s.teamAssignments?.[year] === c.id);
                
                // Average gamesPlayed over their valid timeline
                const avgAttendance = points.length ? Math.round(points.reduce((a, p) => a + p.x, 0) / points.length) : 0;
                
                return { 
                    ...s, 
                    points, sortedPoints, slope, intercept, r2, 
                    avgAttendance,
                    className: teamObj?.name ?? '' 
                };
            })
            .filter(s => s.slope != null); // Only those with enough data points
    }, [year, term]);

    // 2. KPIs
    const highlyVulnerable = students.filter(s => s.slope >= 0.6).length;
    const sensitive = students.filter(s => s.slope >= 0.3 && s.slope < 0.6).length;
    const resilient = students.filter(s => s.slope >= 0.05 && s.slope < 0.3).length;
    const inelastic = students.filter(s => s.slope >= -0.2 && s.slope < 0.05).length;
    
    const avgSlope = students.length > 0 
        ? Math.round((students.reduce((a, s) => a + s.slope, 0) / students.length) * 100) / 100 
        : 0;

    // 3. Leaderboards
    const sortedStudents = [...students].sort((a, b) => b.slope - a.slope);
    const mostVulnerable = sortedStudents.slice(0, 8);
    const mostResilient = [...students].filter(s => s.slope >= 0 && s.slope < 0.2).sort((a, b) => a.slope - b.slope).slice(0, 8);

    // Setup drill-down
    const drillStudent = selectedStudent ?? mostVulnerable[0] ?? students[0];
    
    // Format regression line for the drill-down
    const regressionLineData = useMemo(() => {
        if (!drillStudent || drillStudent.slope == null || drillStudent.sortedPoints.length === 0) return [];
        const xMin = drillStudent.sortedPoints[0].x;
        const xMax = drillStudent.sortedPoints[drillStudent.sortedPoints.length - 1].x;
        // Pad the line a bit
        const startX = Math.max(0, xMin - 5);
        const endX = Math.min(100, xMax + 5);
        
        return [
            { x: startX, y: drillStudent.slope * startX + drillStudent.intercept },
            { x: endX, y: drillStudent.slope * endX + drillStudent.intercept }
        ];
    }, [drillStudent]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Explainer ── */}
            <HubCard style={{ flex: 'none', borderLeft: '3px solid #38bdf8' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Games Played-Performance Match Rhythm (β)</div>
                        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                            Measures exactly <strong style={{ color: '#e2e8f0' }}>how sensitive a player's performance is to changes in their games played</strong>. 
                            Using a linear regression model, the slope (β1) reveals intervention intelligence: 
                            <strong style={{ color: '#ef4444' }}> Needs Regular Minutes</strong> players collapse when rotated out, whereas <strong style={{ color: '#10b981' }}>Resilient</strong> players manage to maintain their performance even if they play fewer minutes.
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10 }}>
                            <code style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '3px 8px', borderRadius: 4 }}>
                                Score = β1(Games Played) + β0
                            </code>
                            <code style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: 4 }}>
                                High Slope (β1 {'>'} 0.6) = Vulnerable
                            </code>
                            <code style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 8px', borderRadius: 4 }}>
                                Low Slope (β1 ≈ 0) = Resilient
                            </code>
                        </div>
                    </div>
                </div>
            </HubCard>

            {/* ── KPI Strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                    { label: 'Academy Avg Match Rhythm', value: avgSlope, color: '#38bdf8' },
                    { label: 'Needs Regular Minutes (β ≥ 0.6)', value: highlyVulnerable, color: '#ef4444' },
                    { label: 'Sensitive (β 0.3–0.6)', value: sensitive, color: '#f59e0b' },
                    { label: 'Resilient (β 0.05–0.3)', value: resilient, color: '#10b981' },
                    { label: 'Unaffected by Rotation (β ≈ 0)', value: inelastic, color: '#64748b' },
                ].map(k => (
                    <HubCard key={k.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
                    </HubCard>
                ))}
            </div>

            {/* ── Match Rhythm Matrix Scatter ── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Match Rhythm Matrix — Average Games Played vs Rating Sensitivity (β)" count={students.length} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Players at the top are <strong style={{ color: '#ef4444' }}>highly vulnerable</strong> to rotation. If their games played drops, their performance will plummet.
                    Players on the left have chronically low games played. The top-left quadrant is the extreme danger zone.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" dataKey="avgAttendance" name="Avg Games Played" domain={[20, 100]} unit="%"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Historical Average Games Played', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis type="number" dataKey="slope" name="Match Rhythm" domain={[-0.5, 1.5]}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Sensitivity / Match Rhythm Slope (β)', angle: -90, position: 'insideLeft', offset: 10, fill: '#38bdf8', fontSize: 11 }}
                        />
                        <ZAxis type="number" range={[36, 36]} />
                        <Tooltip content={<MatchRhythmScatterTooltip />} />
                        <ReferenceLine y={0.6} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" />
                        <ReferenceLine y={0.3} stroke="rgba(245,158,11,0.2)" strokeDasharray="4 4" />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        <ReferenceLine x={70} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                        <Scatter data={students} onClick={(d) => setSelectedStudent(d)} style={{ cursor: 'pointer' }}>
                            {students.map((s) => (
                                <Cell key={s.id} fill={elasticityColor(s.slope)} fillOpacity={0.7} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </HubCard>

            {/* ── Individual Drill-Down: Regression Model ── */}
            <HubCard style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <SectionHeader title={`Regression Model — ${drillStudent?.name ?? 'Select a Player'}`} />
                    {drillStudent && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Match Rhythm (β):</span>
                            <span style={{ fontWeight: 900, color: elasticityColor(drillStudent.slope), fontSize: 18 }}>{drillStudent.slope.toFixed(2)}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${elasticityColor(drillStudent.slope)}18`, color: elasticityColor(drillStudent.slope), fontWeight: 700 }}>
                                {elasticityLabel(drillStudent.slope)}
                            </span>
                        </div>
                    )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Plotting the player's historical ratings (Y) against their games played (X) for every matchday. The line of best fit reveals their true elasticity.
                </p>

                {drillStudent && (
                    <div style={{ display: 'flex', gap: 20 }}>
                        {/* Stats Box */}
                        <div style={{ flex: 'none', width: '220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>IMPACT FACTOR</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#e2e8f0' }}>{Math.abs(drillStudent.slope).toFixed(2)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Every 1% drop in games played costs {Math.abs(drillStudent.slope).toFixed(2)}% in performance.
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>MODEL FIT (R²)</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#e2e8f0' }}>{drillStudent.r2.toFixed(2)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                                    How perfectly performance correlates to games played.
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>DATA POINTS</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#e2e8f0' }}>{drillStudent.points.length} Matchdays</div>
                            </div>
                        </div>

                        {/* Regression Chart */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height={260}>
                                <ComposedChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis type="number" dataKey="x" domain={[0, 100]} unit="%"
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        label={{ value: 'Matchday Games Played', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                                    />
                                    <YAxis type="number" dataKey="y" domain={[0, 100]} unit="%"
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        label={{ value: 'Matchday Average Rating', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }}
                                    />
                                    <Tooltip content={<RegressionTooltip />} />
                                    
                                    {/* Line of Best Fit */}
                                    <Line 
                                        data={regressionLineData} 
                                        type="linear" 
                                        dataKey="y" 
                                        stroke={elasticityColor(drillStudent.slope)} 
                                        strokeWidth={2} 
                                        strokeDasharray="5 5" 
                                        dot={false} 
                                        activeDot={false} 
                                        isAnimationActive={false}
                                    />
                                    
                                    {/* Actual Data Points */}
                                    <Scatter data={drillStudent.points} fill="#38bdf8" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </HubCard>

            {/* ── Match Rhythm Rankings ── */}
            <ResizableHSplit
                defaultSplit={50} min={25} max={75}
                left={
                    <HubCard>
                        <SectionHeader title="Most Vulnerable (High Match Rhythm)" infoKey="elasticity" count={mostVulnerable.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Rotation drastically drops their performance ratings.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {mostVulnerable.map((s, i) => (
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
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Avg Att: {s.avgAttendance}%</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#ef4444', flexShrink: 0, minWidth: 45, textAlign: 'right' }}>{s.slope.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Most Resilient (Low Match Rhythm)" infoKey="elasticity" count={mostResilient.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Performance stays stable regardless of games played drops.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {mostResilient.map((s, i) => (
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
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Avg Att: {s.avgAttendance}%</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981', flexShrink: 0, minWidth: 45, textAlign: 'right' }}>{s.slope.toFixed(2)}</span>
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

