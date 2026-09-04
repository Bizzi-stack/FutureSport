import { useMemo, useState } from 'react';
import { HubCard, SectionHeader, scoreColor, ResizableHSplit } from './HubShared';
import { ALL_STUDENTS, TEAMS, YEARS, TERMS, SUBJECTS as STATS } from '../../data/mockData';

// ── Build ordered timeline ───────────────────────────────────────────
const TIMELINE = [];
for (const y of YEARS) for (const t of TERMS) TIMELINE.push({ year: y, term: t, label: `${y.slice(2, 4)}/${y.slice(7)} ${t.replace('Matchday ', 'M')}` });

// ── Helpers ──────────────────────────────────────────────────────────
function momentumSymbol(v) {
    if (v == null) return '';
    if (v >= 5) return '↑↑';
    if (v > 0) return '↑';
    if (v === 0) return '—';
    if (v > -5) return '↓';
    return '↓↓';
}

function momentumBg(v) {
    if (v == null) return 'transparent';
    if (v >= 5) return 'rgba(16, 185, 129, 0.25)';  // Surging
    if (v > 0) return 'rgba(16, 185, 129, 0.08)';   // Gaining
    if (v === 0) return 'rgba(255, 255, 255, 0.02)'; // Flat
    if (v > -5) return 'rgba(245, 158, 11, 0.1)';   // Fading
    return 'rgba(239, 68, 68, 0.25)';               // Crashing
}

function momentumTextColor(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 5) return '#10b981';
    if (v > 0) return '#34d399';
    if (v === 0) return '#94a3b8';
    if (v > -5) return '#f59e0b';
    return '#ef4444';
}

// ── Main Component ───────────────────────────────────────────────────
export default function StatMomentumTab({ year, term, selectedSchool, onPlayerClick }) {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Context: current class list
    const classPlayers = useMemo(() => {
        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id));
    }, [year]);

    // Filter by search query
    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return classPlayers;
        const q = searchQuery.toLowerCase();
        return classPlayers.filter(s => typeof s?.name === 'string' && s.name.toLowerCase().includes(q));
    }, [classPlayers, searchQuery]);

    const targetPlayer = selectedPlayer ?? classPlayers[0];

    // Compute player's stat momentum over time
    const subjectData = useMemo(() => {
        if (!targetPlayer) return {};
        const data = {};
        for (const sub of STATS) {
            data[sub] = [];
            let prevScore = null;
            for (const tp of TIMELINE) {
                const score = targetPlayer.performance?.[tp.year]?.[tp.term]?.[sub] ?? null;
                if (score != null) {
                    const velocity = prevScore != null ? score - prevScore : 0;
                    data[sub].push({ ...tp, score, velocity });
                    prevScore = score;
                } else {
                    data[sub].push({ ...tp, score: null, velocity: null });
                }
            }
        }
        return data;
    }, [targetPlayer]);

    // Trim timeline to only show matchdays where the player has at least SOME data
    const activeTimeline = useMemo(() => {
        if (!targetPlayer) return [];
        let firstIdx = TIMELINE.length;
        let lastIdx = -1;
        for (const sub of STATS) {
            for (let i = 0; i < TIMELINE.length; i++) {
                if (subjectData[sub][i].score != null) {
                    if (i < firstIdx) firstIdx = i;
                    if (i > lastIdx) lastIdx = i;
                }
            }
        }
        if (lastIdx === -1) return []; // No data
        return TIMELINE.slice(firstIdx, lastIdx + 1);
    }, [subjectData, targetPlayer]);

    // Compute Current Momentum KPIs (latest term vs previous)
    const currentKPIs = useMemo(() => {
        if (!activeTimeline.length) return { surging: 0, fading: 0, best: null, worst: null };
        const lastTp = activeTimeline[activeTimeline.length - 1];
        let surgingCount = 0;
        let fadingCount = 0;
        let bestSub = { sub: '-', v: -Infinity };
        let worstSub = { sub: '-', v: Infinity };

        for (const sub of STATS) {
            const d = subjectData[sub].find(t => t.year === lastTp.year && t.term === lastTp.term);
            if (d && d.velocity != null) {
                if (d.velocity > 0) surgingCount++;
                if (d.velocity < 0) fadingCount++;
                if (d.velocity > bestSub.v) bestSub = { sub, v: d.velocity };
                if (d.velocity < worstSub.v) worstSub = { sub, v: d.velocity };
            }
        }
        return { surging: surgingCount, fading: fadingCount, best: bestSub, worst: worstSub };
    }, [subjectData, activeTimeline]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Explainer ── */}
            <HubCard style={{ flex: 'none', borderLeft: '3px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Stat Momentum Heatmap</div>
                        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                            Tracks granular <strong style={{ color: '#e2e8f0' }}>performance velocity</strong> across every stat over time. 
                            It visually flags surging momentum (<strong style={{ color: '#10b981' }}>↑↑</strong>) and early warning declines (<strong style={{ color: '#ef4444' }}>↓↓</strong>) long before a player's form collapses.
                            This provides immediate coaching insight into whether a player is fundamentally progressing or regressing.
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10 }}>
                            <code style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 8px', borderRadius: 4 }}>
                                ↑↑ Surging (≥ +5 pts)
                            </code>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '3px 8px', borderRadius: 4 }}>
                                ↑ Gaining
                            </code>
                            <code style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '3px 8px', borderRadius: 4 }}>
                                — Flat
                            </code>
                            <code style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 8px', borderRadius: 4 }}>
                                ↓ Fading
                            </code>
                            <code style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: 4 }}>
                                ↓↓ Crashing (≤ -5 pts)
                            </code>
                        </div>
                    </div>
                </div>
            </HubCard>

            {/* ── KPI Strip ── */}
            {targetPlayer && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <HubCard>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>Stats Surging</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{currentKPIs.surging}</div>
                    </HubCard>
                    <HubCard>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>Stats Fading</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>{currentKPIs.fading}</div>
                    </HubCard>
                    <HubCard>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>Best Momentum</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0' }}>{currentKPIs.best.sub}</div>
                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>+{currentKPIs.best.v} pts</div>
                    </HubCard>
                    <HubCard>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>Worst Momentum</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0' }}>{currentKPIs.worst.sub}</div>
                        <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>{currentKPIs.worst.v > 0 ? '+' : ''}{currentKPIs.worst.v} pts</div>
                    </HubCard>
                </div>
            )}

            {/* ── Layout Split ── */}
            <ResizableHSplit
                defaultSplit={25} min={20} max={40}
                left={
                    <div style={{ position: 'relative', height: '100%', display: 'flex', flex: 1 }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
                            <HubCard style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', margin: 0 }}>
                                <SectionHeader title="Cohort Selection" infoKey="subject-momentum" count={classPlayers.length} />
                                <input
                                    type="text"
                                    placeholder="Search player..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', padding: '8px 12px', marginBottom: '12px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none',
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                                    {filteredPlayers.map(s => (
                                        <div key={s.id} onClick={() => setSelectedPlayer(s)}
                                            style={{
                                                padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                                                background: targetPlayer?.id === s.id ? 'rgba(56,189,248,0.1)' : 'transparent',
                                                border: targetPlayer?.id === s.id ? '1px solid rgba(56,189,248,0.2)' : '1px solid transparent',
                                                color: targetPlayer?.id === s.id ? '#38bdf8' : 'var(--text-muted)',
                                                transition: 'all 0.1s',
                                                fontWeight: targetPlayer?.id === s.id ? 700 : 500,
                                                fontSize: 13
                                            }}>
                                            {s.name}
                                        </div>
                                    ))}
                                    {filteredPlayers.length === 0 && (
                                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No players found.</div>
                                    )}
                                </div>
                            </HubCard>
                        </div>
                    </div>
                }
                right={
                    <HubCard style={{ overflowX: 'auto', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <SectionHeader title={`Longitudinal Heatmap — ${targetPlayer?.name ?? 'Select Player'}`} />
                        </div>
                        
                        {activeTimeline.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', position: 'sticky', left: 0, zIndex: 10 }}>
                                            STAT
                                        </th>
                                        {activeTimeline.map(tp => (
                                            <th key={tp.label} style={{ padding: '12px 10px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                                                {tp.label.toUpperCase()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {STATS.map((sub, rIdx) => (
                                        <tr key={sub} style={{ borderBottom: rIdx === STATS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', position: 'sticky', left: 0, zIndex: 10, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                                {sub}
                                            </td>
                                            {activeTimeline.map((tp, cIdx) => {
                                                const dIdx = TIMELINE.findIndex(t => t.label === tp.label);
                                                const d = subjectData[sub][dIdx];
                                                
                                                if (d.score == null) {
                                                    return <td key={cIdx} style={{ padding: '10px', color: 'var(--text-muted)', fontSize: 12 }}>—</td>;
                                                }

                                                const isFirstTerm = d.velocity === 0 && (dIdx === 0 || subjectData[sub][dIdx - 1].score == null);

                                                return (
                                                    <td key={cIdx} style={{ padding: '4px' }}>
                                                        <div style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            background: isFirstTerm ? 'rgba(255,255,255,0.02)' : momentumBg(d.velocity),
                                                            border: `1px solid ${isFirstTerm ? 'transparent' : momentumBg(d.velocity).replace('0.25', '0.4').replace('0.08', '0.2').replace('0.1', '0.3')}`,
                                                            borderRadius: 6,
                                                            padding: '6px 4px',
                                                            minWidth: 50,
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor(d.score), lineHeight: 1 }}>
                                                                {d.score}
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: 10, fontWeight: 900, 
                                                                color: isFirstTerm ? '#64748b' : momentumTextColor(d.velocity),
                                                                marginTop: 4, letterSpacing: -0.5
                                                            }}>
                                                                {isFirstTerm ? 'BASE' : momentumSymbol(d.velocity)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No longitudinal data available for this player.</div>
                        )}
                    </HubCard>
                }
            />
        </div>
    );
}

