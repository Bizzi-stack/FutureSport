import { useMemo, useState } from 'react';
import {
    HubCard, SectionHeader, scoreColor, CHART_COLORS, TT_STYLE,
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
    ScatterChart, Scatter, ZAxis, Cell,
    BarChart, Bar,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, getOverallAvg } from '../../data/mockData';

// ── Math Helpers ──────────────────────────────────────────────────────
function getMean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getStdDev(arr, mu) {
    if (arr.length <= 1) return 0;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / arr.length; // Population variance
    return Math.sqrt(variance);
}

// Standard Normal CDF (Approximation for Percentile)
function normalCDF(z) {
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2.0);
    const t = 1.0 / (1.0 + 0.3275911 * x);
    const erf = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * erf);
}

// Generate points for standard normal bell curve
const BELL_CURVE_DATA = [];
for (let i = -3.5; i <= 3.5; i += 0.1) {
    const z = Math.round(i * 10) / 10;
    const density = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
    BELL_CURVE_DATA.push({ z, density });
}

// ── Custom tooltips ───────────────────────────────────────────────────
function ZTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px', minWidth: 180,
        }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{d.name}</div>
            <div style={{ color: '#94a3b8' }}>{d.className}</div>
            <div style={{ marginTop: 4, color: '#94a3b8' }}>Score: <strong style={{ color: scoreColor(d.score) }}>{d.score}%</strong></div>
            <div style={{ color: '#94a3b8' }}>Z-Score: <strong style={{ color: zColor(d.z) }}>{d.z.toFixed(2)}σ</strong></div>
            <div style={{ color: '#94a3b8' }}>Percentile: <strong style={{ color: '#a78bfa' }}>{Math.round(d.percentile * 100)}th</strong></div>
        </div>
    );
}

function zColor(z) {
    if (z >= 1.5) return '#10b981';  // Exceptional (Top ~7%)
    if (z >= 0.5) return '#34d399';  // Above Avg
    if (z >= -0.5) return '#64748b'; // Average
    if (z >= -1.5) return '#f59e0b'; // Below Avg
    return '#ef4444';                // Outlier Underperformer (Bottom ~7%)
}

function zLabel(z) {
    if (z >= 1.5) return 'Exceptional';
    if (z >= 0.5) return 'Above Average';
    if (z >= -0.5) return 'Average';
    if (z >= -1.5) return 'Below Average';
    return 'Critical Risk';
}

// ── Main Component ───────────────────────────────────────────────────
export default function ZScoreTab({ year, term, selectedSchool, onStudentClick }) {
    const [selectedStudent, setSelectedStudent] = useState(null);

    // 1. Get all students and calculate cohort stats
    const { students, mu, sigma } = useMemo(() => {
        // Find all students with performance this term
        const activeStudents = (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id))
            .map(s => {
                const score = getOverallAvg(s, year, term);
                const teamObj = TEAMS.find(c => s.teamAssignments?.[year] === c.id);
                return { ...s, score, className: teamObj?.name ?? '', gradeNum: teamObj?.gradeNum ?? 0 };
            })
            .filter(s => s.score > 0);

        // Group by grade (U14, U15, etc.) to calculate relative Z-scores within their peer cohort
        const forms = [1, 2, 3, 4, 5];
        const cohortStats = {};
        forms.forEach(f => {
            const scores = activeStudents.filter(s => s.gradeNum === f).map(s => s.score);
            const m = getMean(scores);
            const std = getStdDev(scores, m);
            cohortStats[f] = { mu: m, sigma: std };
        });

        // Overall stats (for general display)
        const allScores = activeStudents.map(s => s.score);
        const overallMu = getMean(allScores);
        const overallSigma = getStdDev(allScores, overallMu);

        // Apply Z-scores
        const evaluatedStudents = activeStudents.map(s => {
            const stats = cohortStats[s.gradeNum];
            // If standard deviation is 0, everyone got the same score (z = 0)
            const z = stats.sigma === 0 ? 0 : (s.score - stats.mu) / stats.sigma;
            const percentile = normalCDF(z);
            return { ...s, z, percentile, cohortMu: stats.mu, cohortSigma: stats.sigma };
        });

        return { students: evaluatedStudents, mu: overallMu, sigma: overallSigma };
    }, [year, term]);

    // 2. Sort & KPIs
    const exceptional = students.filter(s => s.z >= 1.5).length;
    const aboveAvg = students.filter(s => s.z >= 0.5 && s.z < 1.5).length;
    const avg = students.filter(s => s.z > -0.5 && s.z < 0.5).length;
    const belowAvg = students.filter(s => s.z > -1.5 && s.z <= -0.5).length;
    const critical = students.filter(s => s.z <= -1.5).length;

    // Ordered by Percentile
    const rankedStudents = [...students].sort((a, b) => b.z - a.z);
    const topPerformers = rankedStudents.slice(0, 8);
    const underPerformers = rankedStudents.slice(-8).reverse();

    // Setup drill-down
    const drillStudent = selectedStudent ?? topPerformers[0] ?? students[0];

    // Format scatter data for Percentile Map (X: Percentile, Y: Z-Score)
    // Add jitter so overlapping students are visible
    const scatterData = students.map((s, i) => ({
        ...s,
        percentile100: s.percentile * 100,
        jitterY: s.z + (i % 2 === 0 ? 0.05 : -0.05) // minor visual jitter
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Explainer ── */}
            <HubCard style={{ flex: 'none', borderLeft: '3px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Squad Relative Performance (Peer Normalization)</div>
                        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                            Z-Scores measure how many <strong style={{ color: '#e2e8f0' }}>standard deviations (σ)</strong> a player is away from their cohort's mean. 
                            This allows us to identify true statistical outliers—both exceptional talent and critical underperformers—regardless of match difficulty.
                            The Z-Score maps directly to a <strong style={{ color: '#a78bfa' }}>percentile ranking Φ(z)</strong>.
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10 }}>
                            <code style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', padding: '3px 8px', borderRadius: 4 }}>
                                z = (x − μ) / σ
                            </code>
                            <code style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '3px 8px', borderRadius: 4 }}>
                                μ (Mean) ≈ {mu.toFixed(1)}
                            </code>
                            <code style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6', padding: '3px 8px', borderRadius: 4 }}>
                                σ (Std Dev) ≈ {sigma.toFixed(1)}
                            </code>
                            <code style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 8px', borderRadius: 4 }}>
                                Φ(1.2) ≈ 88.5th Percentile
                            </code>
                        </div>
                    </div>
                </div>
            </HubCard>

            {/* ── KPI Strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                    { label: 'Exceptional (≥+1.5σ)', value: exceptional, color: '#10b981', sub: 'Top ~7%' },
                    { label: 'Above Avg (+0.5σ…)', value: aboveAvg, color: '#34d399', sub: '69th–93rd %' },
                    { label: 'Average (±0.5σ)', value: avg, color: '#64748b', sub: 'Middle 38%' },
                    { label: 'Below Avg (-0.5σ…)', value: belowAvg, color: '#f59e0b', sub: '7th–31st %' },
                    { label: 'Critical Risk (≤-1.5σ)', value: critical, color: '#ef4444', sub: 'Bottom ~7%' },
                ].map(k => (
                    <HubCard key={k.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{k.sub}</div>
                    </HubCard>
                ))}
            </div>

            {/* ── Percentile Map Scatter ── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Percentile Map & Z-Score Distribution" count={scatterData.length} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Each dot represents a player normalized against their specific squad's mean and variance. 
                    The S-curve shape visually proves the normal cumulative distribution.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" dataKey="percentile100" name="Percentile" domain={[0, 100]} unit="th"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Cohort Percentile Rank Φ(z)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis type="number" dataKey="jitterY" name="Z-Score" domain={[-3.5, 3.5]}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Z-Score (σ)', angle: -90, position: 'insideLeft', offset: 10, fill: '#a78bfa', fontSize: 11 }}
                        />
                        <ZAxis type="number" range={[36, 36]} />
                        <Tooltip content={<ZTooltip />} />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        <ReferenceLine x={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                        <ReferenceLine y={1.5} stroke="rgba(16,185,129,0.2)" strokeDasharray="4 4" />
                        <ReferenceLine y={-1.5} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" />
                        <Scatter data={scatterData} onClick={(d) => setSelectedStudent(d)} style={{ cursor: 'pointer' }}>
                            {scatterData.map((s) => (
                                <Cell key={s.id} fill={zColor(s.z)} fillOpacity={0.7} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </HubCard>

            {/* ── Individual Drill-Down: Bell Curve ── */}
            <HubCard style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <SectionHeader title={`Statistical Profile — ${drillStudent?.name ?? 'Select a Player'}`} />
                    {drillStudent && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Z-Score:</span>
                            <span style={{ fontWeight: 900, color: zColor(drillStudent.z), fontSize: 18 }}>{drillStudent.z > 0 ? '+' : ''}{drillStudent.z.toFixed(2)}σ</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${zColor(drillStudent.z)}18`, color: zColor(drillStudent.z), fontWeight: 700 }}>
                                {zLabel(drillStudent.z)}
                            </span>
                        </div>
                    )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Visualizing the player's position within the standard normal probability density function (PDF).
                </p>

                {drillStudent && (
                    <div style={{ display: 'flex', gap: 20 }}>
                        {/* Stats Box */}
                        <div style={{ flex: 'none', width: '220px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>RAW SCORE</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#e2e8f0' }}>{drillStudent.score}%</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>PERCENTILE RANK</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa' }}>{Math.round(drillStudent.percentile * 100)}th</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>COHORT CONTEXT</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Squad {drillStudent.gradeNum === 1 ? 'U14' : drillStudent.gradeNum === 2 ? 'U16' : 'U19'} Mean: <strong style={{ color: '#fff' }}>{drillStudent.cohortMu.toFixed(1)}</strong></div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Std Dev (σ): <strong style={{ color: '#fff' }}>{drillStudent.cohortSigma.toFixed(1)}</strong></div>
                            </div>
                        </div>

                        {/* Bell Curve */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={BELL_CURVE_DATA} margin={{ top: 25, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="z" type="number" domain={[-3.5, 3.5]} tick={{ fontSize: 10, fill: '#64748b' }} tickCount={8} 
                                        label={{ value: 'Standard Deviations (σ)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                                    />
                                    <YAxis hide />
                                    <Area type="monotone" dataKey="density" stroke="#3b82f6" fill="url(#bellGradient)" fillOpacity={1} strokeWidth={2} isAnimationActive={false} />
                                    
                                    <defs>
                                        <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>

                                    {/* Player Position Line */}
                                    <ReferenceLine x={drillStudent.z} stroke={zColor(drillStudent.z)} strokeWidth={2} label={{ position: 'top', value: 'Player', fill: zColor(drillStudent.z), fontSize: 12, fontWeight: 700 }} />
                                    {/* Mean Line */}
                                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.4)" strokeDasharray="3 3" />
                                    <ReferenceLine x={-1.5} stroke="rgba(239,68,68,0.2)" strokeDasharray="2 2" />
                                    <ReferenceLine x={1.5} stroke="rgba(16,185,129,0.2)" strokeDasharray="2 2" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </HubCard>

            {/* ── Outlier Cohort Rankings ── */}
            <ResizableHSplit
                defaultSplit={50} min={25} max={75}
                left={
                    <HubCard>
                        <SectionHeader title="Exceptional Outliers" infoKey="zscore" count={topPerformers.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Statistically anomalous high-performers (Right Tail).</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {topPerformers.map((s, i) => (
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
                                        <span style={{ fontSize: 11, color: '#a78bfa', flexShrink: 0, fontWeight: 600 }}>{Math.round(s.percentile * 100)}th %</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: zColor(s.z), flexShrink: 0, minWidth: 45, textAlign: 'right' }}>+{s.z.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard>
                        <SectionHeader title="Critical Underperformers" infoKey="zscore" count={underPerformers.length} />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Statistically anomalous low-performers (Left Tail).</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {underPerformers.map((s, i) => (
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
                                        <span style={{ fontSize: 11, color: '#a78bfa', flexShrink: 0, fontWeight: 600 }}>{Math.round(s.percentile * 100)}th %</span>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: zColor(s.z), flexShrink: 0, minWidth: 45, textAlign: 'right' }}>{s.z.toFixed(2)}</span>
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

