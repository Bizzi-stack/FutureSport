import { useMemo } from 'react';
import {
    HubCard, SectionHeader, Empty, ScoreBar, scoreColor, RankBadge,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ZAxis, ReferenceLine,
    ResizableHSplit, ResizableVSplit
} from './HubShared';
import { ALL_STUDENTS, TEAMS, YEARS, TERMS, getOverallAvg } from '../../data/mockData';

// ── Trends & Trajectory Tab ──────────────────────────────────────────
export default function TrendsTab({ year, term, selectedSchool, onStudentClick }) {
    
    // Ordered list of all historical terms
    const allTerms = useMemo(() => {
        const list = [];
        for (const y of YEARS) {
            for (const t of TERMS) {
                list.push({ year: y, term: t });
            }
        }
        return list;
    }, []);

    // Compute trajectory
    const trajectoryData = useMemo(() => {
        // Find index of current term
        const currentIndex = allTerms.findIndex(t => t.year === year && t.term === term);
        if (currentIndex < 1) return []; // No history available for the very first term

        const currentTermInfo = allTerms[currentIndex];
        const prevTermInfo = allTerms[currentIndex - 1];

        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))
            .filter(s => TEAMS.some(c => s.teamAssignments?.[currentTermInfo.year] === c.id))
            .map(s => {
                const currentAvg = getOverallAvg(s, currentTermInfo.year, currentTermInfo.term);
                const prevAvg = getOverallAvg(s, prevTermInfo.year, prevTermInfo.term);

                if (currentAvg === 0 || prevAvg === 0) return null;

                const change = currentAvg - prevAvg;
                
                // Historical standard deviation / variance check for plateau
                let plateauScore = 0;
                if (currentIndex >= 2) {
                    const prev2Info = allTerms[currentIndex - 2];
                    const prev2Avg = getOverallAvg(s, prev2Info.year, prev2Info.term);
                    if (prev2Avg > 0) {
                        const variance = Math.abs(currentAvg - prevAvg) + Math.abs(prevAvg - prev2Avg);
                        if (variance <= 3) plateauScore = currentAvg; // high score = stable and high
                    }
                }

                return {
                    ...s,
                    currentAvg,
                    prevAvg,
                    change,
                    plateauScore
                };
            })
            .filter(Boolean);

    }, [year, term, allTerms]);

    const mostImproved = [...trajectoryData].sort((a, b) => b.change - a.change).slice(0, 8);
    const steepestDecline = [...trajectoryData].sort((a, b) => a.change - b.change).slice(0, 8);
    const plateaued = [...trajectoryData].filter(s => s.plateauScore >= 70).sort((a, b) => b.plateauScore - a.plateauScore).slice(0, 8);

    if (!trajectoryData.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <HubCard>
                    <SectionHeader title="Performance Momentum" infoKey="trends" />
                    <Empty msg={`Insufficient historical data for ${term} ${year} to compute trajectories. Select a later matchday.`} />
                </HubCard>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <HubCard>
                <SectionHeader title="Performance Momentum Matrix" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Plotting each player's <strong>Current Average</strong> against their <strong>Matchday-over-Matchday Change</strong>. 
                    <span style={{ color: '#10b981', marginLeft: '6px' }}>Above 0 = Improving.</span> 
                    <span style={{ color: '#ef4444', marginLeft: '6px' }}>Below 0 = Declining.</span>
                </p>
                
                <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis 
                            type="number" dataKey="currentAvg" name="Current Avg" 
                            domain={[30, 100]} unit="%"
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                            label={{ value: 'Current Average Score', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis 
                            type="number" dataKey="change" name="Change" 
                            domain={[-30, 30]} unit=" pts"
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                        />
                        <ZAxis type="number" range={[40, 40]} />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const isPositive = data.change >= 0;
                                return (
                                    <div style={{ ...TT_STYLE, padding: '10px 14px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '6px' }}>{data.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                            Average: <span style={{ color: '#fff', fontWeight: '600' }}>{data.currentAvg}%</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Trajectory: <span style={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: '700' }}>{isPositive ? '+' : ''}{data.change} pts</span>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
                        <ReferenceLine x={65} stroke="rgba(245,158,11,0.2)" strokeDasharray="3 3" />
                        <Scatter data={trajectoryData} onClick={(data) => onStudentClick?.(data)}>
                            {trajectoryData.map((s, i) => {
                                const fillColor = s.change >= 5 ? '#10b981' : s.change <= -5 ? '#ef4444' : '#64748b';
                                return (
                                    <Cell key={s.id} fill={fillColor} fillOpacity={0.6} style={{ cursor: 'pointer', transition: 'all 0.2s' }} />
                                );
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</span>
                    {[['Improving (≥ +5)', '#10b981'], ['Stable (-4 to +4)', '#64748b'], ['Declining (≤ -5)', '#ef4444']].map(([label, color]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', background: color, borderRadius: '50%', opacity: 0.6 }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                        </div>
                    ))}
                </div>
            </HubCard>

            <ResizableHSplit 
                defaultSplit={33.33} min={20} max={50} gap={16}
                left={
                    <HubCard>
                        <SectionHeader title="Most Improved" infoKey="trends" count={mostImproved.length} />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Largest positive jump from previous matchday.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {mostImproved.map((s, i) => (
                                <div key={s.id} style={{
                                    padding: '8px 10px', borderRadius: '7px',
                                    background: i < 3 ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <RankBadge rank={i} color="#10b981" />
                                        <span className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ flex: 1, fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.name}
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', flexShrink: 0 }}>+{s.change}</span>
                                    </div>
                                    <div style={{ paddingLeft: '30px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{s.prevAvg}%</span> → <span style={{ color: scoreColor(s.currentAvg), fontWeight: '600' }}>{s.currentAvg}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </HubCard>
                }
                right={
                    <ResizableHSplit 
                        defaultSplit={50} min={30} max={70} gap={16}
                        left={
                            <HubCard>
                                <SectionHeader title="Steepest Decline" infoKey="trends" count={steepestDecline.length} />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Largest drop from previous matchday — may need coaching attention.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {steepestDecline.map((s, i) => (
                                        <div key={s.id} style={{
                                            padding: '8px 10px', borderRadius: '7px',
                                            background: i < 3 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                <RankBadge rank={i} color="#ef4444" />
                                                <span className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ flex: 1, fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.name}
                                                </span>
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', flexShrink: 0 }}>{s.change}</span>
                                            </div>
                                            <div style={{ paddingLeft: '30px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{s.prevAvg}%</span> → <span style={{ color: scoreColor(s.currentAvg), fontWeight: '600' }}>{s.currentAvg}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </HubCard>
                        }
                        right={
                            <HubCard>
                                <SectionHeader title="Plateaued (High Performers)" infoKey="trends" count={plateaued.length} />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Averaging ≥70% but showing ≤3% variance over the last 3 matchdays.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {plateaued.length === 0 ? <Empty msg="No plateaued top performers." /> :
                                        plateaued.map((s, i) => (
                                            <div key={s.id} style={{
                                                padding: '8px 10px', borderRadius: '7px',
                                                background: 'rgba(255,255,255,0.02)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                    <span className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ flex: 1, fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {s.name}
                                                    </span>
                                                    <span style={{ fontSize: '12px', fontWeight: '800', color: scoreColor(s.currentAvg), flexShrink: 0 }}>{s.currentAvg}%</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                                    Stagnant across last 3 matchdays
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </HubCard>
                        }
                    />
                }
            />
            
        </div>
    );
}

