import { useMemo, useState } from 'react';
import {
    HubCard, SectionHeader, Empty, ScoreBar, scoreColor, RankBadge,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, YEARS, TERMS, AGE_GROUPS } from '../../data/mockData';

// ── Pro constants ───────────────────────────────────────────────────
const TRACKED_STAT = 'Goals';
const PRO_GROUP = 3;              // Normal Pro sitting
const EARLY_PROMOTE_GROUPS = [1, 2];   // Early sitting eligible
const PASS_THRESHOLD = 5;        // Target Met
const MERIT_THRESHOLD = 8;       // High Performer — quality pass
const DISTINCTION_THRESHOLD = 12; // Star Player

// ── Tier definitions ─────────────────────────────────────────────────
const TIERS = {
    READY:        { key: 'ready',        label: 'Ready Now',          color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    ON_TRACK:     { key: 'onTrack',      label: 'On Track',           color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    AT_RISK:      { key: 'atRisk',       label: 'At Risk',            color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    INTERVENTION: { key: 'intervention', label: 'Needs Intervention', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};
const TIER_ORDER = [TIERS.READY, TIERS.ON_TRACK, TIERS.AT_RISK, TIERS.INTERVENTION];

// ── Helpers ──────────────────────────────────────────────────────────
function getStatScore(s, year, term) {
    return s.performance?.[year]?.[term]?.[TRACKED_STAT] ?? 0;
}

function getStudentGroup(s, year) {
    const teamId = s.teamAssignments?.[year];
    if (!teamId) return null;
    const teamObj = TEAMS.find(c => c.id === teamId);
    return teamObj?.groupNum ?? null;
}

/** Compute the term-over-term Goals trajectory (slope in points per term). */
function computeTrajectory(s, year, term) {
    const points = [];
    for (const y of YEARS) {
        for (const t of TERMS) {
            const score = getStatScore(s, y, t);
            if (score > 0) points.push(score);
            if (y === year && t === term) break;
        }
        if (y === year) break;
    }
    if (points.length < 2) return { slope: 0, points };

    const recent = points.slice(-6);
    const n = recent.length;
    const xMean = (n - 1) / 2;
    const yMean = recent.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (i - xMean) * (recent[i] - yMean);
        den += (i - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    return { slope: Math.round(slope * 10) / 10, points: recent };
}

/** Compute Drawdown depth for Goals (Peak to Current) */
function getDrawdown(s, year, term) {
    let peak = 0;
    let current = 0;
    for (const y of YEARS) {
        for (const t of TERMS) {
            const score = getStatScore(s, y, t);
            if (score > peak) peak = score;
            if (y === year && t === term) {
                current = score;
                break;
            }
        }
        if (y === year) break;
    }
    return peak > 0 ? (peak - current) : 0;
}

function termsToThreshold(currentScore, slope, threshold) {
    if (currentScore >= threshold) return 0;
    if (slope <= 0) return Infinity;
    return Math.ceil((threshold - currentScore) / slope);
}

function projectedGrade(currentGrade, termsAway) {
    if (termsAway === 0) return currentGrade;
    if (termsAway === Infinity) return null;
    const gradesAway = Math.ceil(termsAway / 3);
    const projected = currentGrade + gradesAway;
    return projected <= PRO_GROUP ? projected : null;
}

// ── Main Component ───────────────────────────────────────────────────
export default function ProReadinessTab({ year, term, selectedSchool, onStudentClick }) {

    const analysis = useMemo(() => {
        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .map(s => {
                const grade = getStudentGroup(s, year);
                if (!grade) return null;

                const statScore = getStatScore(s, year, term);
                if (statScore <= 0) return null;

                const { slope, points } = computeTrajectory(s, year, term);
                const drawdown = getDrawdown(s, year, term);
                
                const termsToPass = termsToThreshold(statScore, slope, PASS_THRESHOLD);
                const termsToMerit = termsToThreshold(statScore, slope, MERIT_THRESHOLD);
                const passGrade = projectedGrade(grade, termsToPass);
                const meritGrade = projectedGrade(grade, termsToMerit);

                // Classify into tier
                let tier;
                if (statScore >= MERIT_THRESHOLD && slope >= -1) {
                    tier = TIERS.READY;
                } else if (statScore >= PASS_THRESHOLD || (passGrade != null && passGrade <= PRO_GROUP)) {
                    tier = TIERS.ON_TRACK;
                } else if (statScore >= 40) {
                    tier = TIERS.AT_RISK;
                } else {
                    tier = TIERS.INTERVENTION;
                }

                const earlyPromote = EARLY_PROMOTE_GROUPS.includes(grade)
                    && statScore >= MERIT_THRESHOLD
                    && slope >= -1;

                let proBand = 'Below Target';
                if (statScore >= DISTINCTION_THRESHOLD) proBand = 'Star Player';
                else if (statScore >= MERIT_THRESHOLD) proBand = 'High Performer';
                else if (statScore >= PASS_THRESHOLD) proBand = 'Target Met';

                return {
                    ...s,
                    grade, statScore, slope, drawdown, points, tier, earlyPromote, passGrade, meritGrade, proBand,
                };
            })
            .filter(Boolean);
    }, [year, term]);

    // ── Derived stats ────────────────────────────────────────────────
    const tierCounts = useMemo(() => {
        const counts = {};
        TIER_ORDER.forEach(t => { counts[t.key] = 0; });
        analysis.forEach(s => { counts[s.tier.key]++; });
        return counts;
    }, [analysis]);

    const earlyCandidates = useMemo(() =>
        analysis.filter(s => s.earlyPromote).sort((a, b) => b.statScore - a.statScore),
    [analysis]);

    const [tableFilter, setTableFilter] = useState('all');
    const [camera, setCamera] = useState({ eye: { x: 1.5, y: -1.5, z: 0.8 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } });
    
    const filteredStudents = useMemo(() => {
        let list = analysis;
        if (tableFilter !== 'all') list = list.filter(s => s.tier.key === tableFilter);
        return list.sort((a, b) => b.statScore - a.statScore);
    }, [analysis, tableFilter]);

    // ── Recharts 2D Data ───────────────────────────────────────────────
    const scatterData = useMemo(() => {
        return analysis.map(s => ({
            ...s,
            x: s.statScore,
            y: s.slope,
            z: Math.max(0.1, s.drawdown) // Use small non-zero value if drawdown is 0
        }));
    }, [analysis]);

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const s = payload[0].payload;
        return (
            <div style={{ background: '#0d1526', border: `1px solid ${s.tier.color}50`, borderRadius: 10, padding: '10px 14px', fontSize: 12, minWidth: 180 }}>
                <div style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: 2 }}>{s.name}</div>
                <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>Group {s.grade===1?'U14':s.grade===2?'U16':'U19'}</div>
                <div style={{ color: '#94a3b8' }}>Status: <strong style={{ color: s.tier.color }}>{s.tier.label}</strong></div>
                <div style={{ marginTop: 6, color: '#94a3b8' }}>Goals Score: <strong style={{ color: scoreColor(s.statScore) }}>{s.statScore}%</strong></div>
                <div style={{ color: '#94a3b8' }}>Momentum: <strong style={{ color: s.slope > 0 ? '#10b981' : s.slope < 0 ? '#ef4444' : '#64748b' }}>{s.slope > 0 ? '+' : ''}{s.slope} pts/term</strong></div>
                <div style={{ color: '#94a3b8' }}>Drawdown Risk: <strong style={{ color: s.drawdown >= 10 ? '#ef4444' : s.drawdown > 0 ? '#f59e0b' : '#10b981' }}>-{s.drawdown} pts</strong></div>
            </div>
        );
    };

    // ── Filter button style ──────────────────────────────────────────
    const filterBtn = (key, label, color) => (
        <button
            key={key}
            onClick={() => setTableFilter(key)}
            style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                background: tableFilter === key ? `${color}22` : 'transparent',
                color: tableFilter === key ? color : 'var(--text-muted)',
                border: tableFilter === key ? `1px solid ${color}44` : '1px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── KPI Row ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                <HubCard>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Players Assessed</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#e2e8f0' }}>{analysis.length}</div>
                </HubCard>
                {TIER_ORDER.map(t => (
                    <HubCard key={t.key}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>{t.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: t.color }}>{tierCounts[t.key]}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {analysis.length ? Math.round(tierCounts[t.key] / analysis.length * 100) : 0}%
                        </div>
                    </HubCard>
                ))}
            </div>

            {/* ── 2D Visualization Split ────────────────────────────── */}
            <ResizableHSplit
                defaultSplit={30} min={25} max={40} gap={16}
                left={
                    <HubCard style={{ height: 450, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <div>
                                <SectionHeader title="Readiness Risk Matrix" infoKey="csec" />
                                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0, marginTop: 8 }}>
                                    We synthesize insights from the <strong style={{ color: '#e2e8f0' }}>Momentum</strong> and <strong style={{ color: '#e2e8f0' }}>Drawdown</strong> models into a unified 2D Risk Matrix to predict Pro promotion outcomes.
                                </p>
                                <ul style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 16, marginTop: 12, lineHeight: 1.8 }}>
                                    <li><strong style={{ color: '#e2e8f0' }}>X-Axis:</strong> Goals Scored.</li>
                                    <li><strong style={{ color: '#e2e8f0' }}>Y-Axis:</strong> Momentum Trajectory (Up/Down).</li>
                                    <li><strong style={{ color: '#e2e8f0' }}>Bubble Size:</strong> Drawdown (Risk of collapse from peak).</li>
                                </ul>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, fontStyle: 'italic' }}>
                                    Look for large bubbles on the lower left—these are players who have suffered massive drawdowns and are continuing to crash.
                                </p>
                            </div>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard style={{ height: 450, padding: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis type="number" dataKey="x" name="Score" domain={[20, 100]} unit="%"
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    label={{ value: 'Goals Score', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                                />
                                <YAxis type="number" dataKey="y" name="Momentum" domain={[-15, 15]}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    label={{ value: 'Trajectory Vector', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }}
                                />
                                <ZAxis type="number" dataKey="z" range={[40, 500]} />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                                <ReferenceLine x={MERIT_THRESHOLD} stroke="rgba(16,185,129,0.3)" strokeDasharray="4 4" />
                                <ReferenceLine x={PASS_THRESHOLD} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />

                                {TIER_ORDER.map(t => (
                                    <Scatter key={t.key} name={t.label} data={scatterData.filter(s => s.tier.key === t.key)} fill={t.color} fillOpacity={0.7} />
                                ))}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </HubCard>
                }
            />

            {/* ── Early Promotion Candidates ────────────────────────────── */}
            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Early Promotion Candidates (U14 & U16)" infoKey="csec" count={earlyCandidates.length} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Players in U14/U16 scoring <strong style={{ color: '#10b981' }}>60%+ in Goals</strong> with a stable or improving trajectory. These players could be promoted to the senior squad <strong>ahead of schedule</strong>.
                </p>
                {!earlyCandidates.length ? <Empty msg="No early-promote candidates for the selected period." /> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px', paddingBottom: '4px' }}>
                        {earlyCandidates.map((s, i) => (
                            <div key={s.id} style={{
                                padding: '12px 14px', borderRadius: '10px',
                                background: 'rgba(16,185,129,0.04)',
                                border: '1px solid rgba(16,185,129,0.12)',
                                display: 'flex', flexDirection: 'column', gap: '8px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RankBadge rank={i} />
                                    <span className="clickable-name" onClick={() => onStudentClick?.(s)}
                                        style={{ flex: 1, fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.name}
                                    </span>
                                    <span style={{
                                        fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px',
                                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                                    }}>
                                        Group {s.grade===1?'U14':s.grade===2?'U16':'U19'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>Goals Score</div>
                                        <ScoreBar score={s.statScore} />
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trajectory</div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: s.slope >= 0 ? '#10b981' : '#f59e0b' }}>
                                            {s.slope >= 0 ? '+' : ''}{s.slope} pts/term
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: '4px', fontWeight: '600' }}>
                                        Projected: {s.proBand}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </HubCard>

            {/* ── Full Player Table ──────────────────────────────── */}
            <HubCard style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <SectionHeader title="All Players — Goals Promotion Readiness" count={filteredStudents.length} />
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {filterBtn('all', 'All', '#94a3b8')}
                        {TIER_ORDER.map(t => filterBtn(t.key, t.label, t.color))}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>#</th>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Player</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Squad</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Goals Score</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Trajectory</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Drawdown</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Pro Band</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Status</th>
                                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Ready By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.slice(0, 60).map((s, i) => (
                                <tr key={s.id} style={{
                                    background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                                    transition: 'background 0.15s',
                                }}>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>{i + 1}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                        <span className="clickable-name" onClick={() => onStudentClick?.(s)}
                                            style={{ fontWeight: '700', cursor: 'pointer' }}>
                                            {s.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                        {s.grade === 1 ? 'U14' : s.grade === 2 ? 'U16' : 'U19'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={{ fontWeight: '800', color: scoreColor(s.statScore) }}>{s.statScore}%</span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={{
                                            fontWeight: '700', fontSize: '11px',
                                            color: s.slope > 0 ? '#10b981' : s.slope < -1 ? '#ef4444' : '#64748b',
                                        }}>
                                            {s.slope > 0 ? '↑' : s.slope < -1 ? '↓' : '→'} {s.slope > 0 ? '+' : ''}{s.slope}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={{
                                            fontWeight: '700', fontSize: '11px',
                                            color: s.drawdown >= 10 ? '#ef4444' : s.drawdown > 0 ? '#f59e0b' : '#64748b',
                                        }}>
                                            -{s.drawdown}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                                            background: s.proBand === 'Star Player' ? 'rgba(16,185,129,0.12)' :
                                                s.proBand === 'High Performer' ? 'rgba(59,130,246,0.12)' :
                                                s.proBand === 'Target Met' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: s.proBand === 'Star Player' ? '#10b981' :
                                                s.proBand === 'High Performer' ? '#3b82f6' :
                                                s.proBand === 'Target Met' ? '#f59e0b' : '#ef4444',
                                        }}>
                                            {s.proBand}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px',
                                            background: s.tier.bg, color: s.tier.color,
                                        }}>
                                            {s.tier.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {s.tier === TIERS.READY ? (
                                            <span style={{ color: '#10b981' }}>Now{s.earlyPromote ? ' (Early)' : ''}</span>
                                        ) : s.passGrade ? (
                                            `Squad ${s.passGrade === 1 ? 'U14' : s.passGrade === 2 ? 'U16' : 'U19'}`
                                        ) : (
                                            <span style={{ color: '#ef4444' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStudents.length > 60 && (
                        <div style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            Showing 60 of {filteredStudents.length} players
                        </div>
                    )}
                </div>
            </HubCard>
        </div>
    );
}

