import { useMemo, useState } from 'react';
import {
    HubCard, SectionHeader, Empty, ScoreBar, scoreColor, RankBadge,
    CHART_COLORS, TT_STYLE,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ResizableHSplit,
} from './HubShared';
import { ALL_STUDENTS, TEAMS, SUBJECTS, YEARS, TERMS } from '../../data/mockData';

// ── Helpers ──────────────────────────────────────────────────────────

// Normalize momentum (-2 to +2 typical) -> (0 to 100)
function normalizeAMF(slope) {
    return Math.max(0, Math.min(100, 75 + (slope * 10)));
}

// Normalize volatility (0 to 20) -> (100 to 0)
function normalizeConsistency(volatility) {
    return Math.max(0, Math.min(100, 100 - (volatility * 2.5)));
}

// Factor Weights
const WEIGHTS = {
    AMF: 0.25,
    CONSISTENCY: 0.20,
    RECOVERY: 0.15,
    ATTENDANCE: 0.20,
    BEHAVIOR: 0.20,
};

export default function FactorScoreTab({ year, term, selectedSchool, onStudentClick }) {
    const [searchQuery, setSearchQuery] = useState('');

    const analysis = useMemo(() => {
        return (selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool)).map(s => {
            const teamId = s.teamAssignments?.[year];
            if (!teamId) return null;
            const teamObj = TEAMS.find(c => c.id === teamId);

            const bData = s.matchStats?.[year]?.[term];
            const gamesPlayed = bData?.gamesPlayed ?? 0;
            const conduct = bData?.yellowCards ?? 0;
            const late = bData?.minutesPlayed ?? 0;
            // Discipline Score out of 100: Deduct 10 points per conduct incident, 2 points per late arrival
            const matchStats = Math.max(0, Math.min(100, 100 - (conduct * 10) - (late * 2)));

            // Gather all historical avg performance to compute AMF and Volatility
            const points = [];
            for (const y of YEARS) {
                for (const t of TERMS) {
                    const performance = SUBJECTS.map(sub => s.performance?.[y]?.[t]?.[sub]).filter(v => v > 0);
                    if (performance.length > 0) {
                        const avg = performance.reduce((a, b) => a + b, 0) / performance.length;
                        points.push(avg);
                    }
                    if (y === year && t === term) break;
                }
                if (y === year) break;
            }

            if (points.length < 2) return null;

            // AMF (Slope)
            const recent = points.slice(-4); // Last 4 terms
            const n = recent.length;
            const xMean = (n - 1) / 2;
            const yMean = recent.reduce((a, b) => a + b, 0) / n;
            let num = 0, den = 0;
            for (let i = 0; i < n; i++) {
                num += (i - xMean) * (recent[i] - yMean);
                den += (i - xMean) ** 2;
            }
            const slope = den === 0 ? 0 : num / den;
            const rawAMF = Math.round(slope * 10) / 10;
            const amfScore = normalizeAMF(rawAMF);

            // Volatility (Std Dev)
            const variance = recent.reduce((a, b) => a + Math.pow(b - yMean, 2), 0) / n;
            const volatility = Math.sqrt(variance);
            const consistencyScore = normalizeConsistency(volatility);

            // Bounce Back (Short-term bounce back)
            let recoveryScore = 70; // default base
            if (n >= 2) {
                const diff = recent[n - 1] - recent[n - 2];
                recoveryScore = Math.max(0, Math.min(100, 70 + (diff * 15)));
            }

            // Calculate Composite Score
            const composite = (
                (amfScore * WEIGHTS.AMF) +
                (consistencyScore * WEIGHTS.CONSISTENCY) +
                (recoveryScore * WEIGHTS.RECOVERY) +
                (gamesPlayed * WEIGHTS.ATTENDANCE) +
                (matchStats * WEIGHTS.BEHAVIOR)
            );

            return {
                ...s,
                grade: teamObj?.gradeNum,
                className: teamObj?.name,
                gamesPlayed,
                matchStats,
                rawAMF,
                amfScore,
                consistencyScore,
                recoveryScore,
                composite: Math.round(composite * 10) / 10,
                factors: [
                    { factor: 'Trajectory (PMF)', value: Math.round(amfScore) },
                    { factor: 'Consistency', value: Math.round(consistencyScore) },
                    { factor: 'Bounce Back', value: Math.round(recoveryScore) },
                    { factor: 'Games Played', value: Math.round(gamesPlayed) },
                    { factor: 'Discipline', value: Math.round(matchStats) },
                ]
            };
        }).filter(Boolean).sort((a, b) => b.composite - a.composite);
    }, [year, term]);

    // Derived Groupings
    const tiers = useMemo(() => {
        return [
            { label: 'Elite Potential (90+)', min: 90, max: 100, color: '#8b5cf6' },
            { label: 'High Potential (80-89)', min: 80, max: 89.9, color: '#3b82f6' },
            { label: 'Stable Core (65-79)', min: 65, max: 79.9, color: '#10b981' },
            { label: 'Volatile Risk (<65)', min: 0, max: 64.9, color: '#f59e0b' },
        ];
    }, []);

    const tierDistribution = useMemo(() => {
        return tiers.map(t => {
            const count = analysis.filter(s => s.composite >= t.min && s.composite <= t.max).length;
            return { name: t.label, value: count, color: t.color };
        });
    }, [analysis, tiers]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return analysis;
        const q = searchQuery.toLowerCase();
        return analysis.filter(s => s.name.toLowerCase().includes(q));
    }, [analysis, searchQuery]);

    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const selectedStudent = analysis.find(s => s.id === selectedStudentId) || analysis[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            
            <ResizableHSplit
                defaultSplit={65} min={50} max={80} gap={16}
                left={
                    <HubCard style={{ flex: 'none', height: 480, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <SectionHeader title="Quantified Player Profiles" infoKey="factor-score" count={filteredStudents.length} />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#e2e8f0', width: '200px', outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                                {filteredStudents.map((s, i) => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setSelectedStudentId(s.id)}
                                        style={{
                                            padding: '12px 16px', borderRadius: '10px',
                                            background: selectedStudentId === s.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                                            border: selectedStudentId === s.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            display: 'flex', flexDirection: 'column', gap: '8px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <RankBadge rank={i} />
                                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#e2e8f0' }}>{s.name}</span>
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: '900', color: scoreColor(s.composite) }}>
                                                {s.composite}
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                                            <div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PMF Score</div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: s.amfScore > 50 ? '#10b981' : '#f59e0b' }}>{Math.round(s.amfScore)} <span style={{fontSize: '9px', fontWeight: 'normal'}}>({s.rawAMF > 0 ? '+' : ''}{s.rawAMF})</span></div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consistency</div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6' }}>{Math.round(s.consistencyScore)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bounce Back</div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#f43f5e' }}>{Math.round(s.recoveryScore)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Games Played</div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8' }}>{s.gamesPlayed}%</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <Empty msg="No profiles match your search." />
                                )}
                            </div>
                        </div>
                    </HubCard>
                }
                right={
                    <HubCard style={{ flex: 'none', height: 480, display: 'flex', flexDirection: 'column' }}>
                        {selectedStudent ? (
                            <>
                                <SectionHeader title="Factor Model Breakdown" infoKey="factor-score" />
                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#e2e8f0' }}>{selectedStudent.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedStudent.className} · Squad {selectedStudent.grade === 1 ? 'U14' : selectedStudent.grade === 2 ? 'U16' : 'U19'}</div>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedStudent.factors}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                                            <Radar name={selectedStudent.name} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ marginTop: '16px', background: 'rgba(99,102,241,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Multi-Factor Score</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: '900', color: scoreColor(selectedStudent.composite) }}>{selectedStudent.composite}</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>out of 100</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                                        Model: <strong style={{ color: '#a5b4fc' }}>25%</strong> Momentum + <strong style={{ color: '#a5b4fc' }}>20%</strong> Consistency + <strong style={{ color: '#a5b4fc' }}>15%</strong> Bounce Back + <strong style={{ color: '#a5b4fc' }}>20%</strong> Games Played + <strong style={{ color: '#a5b4fc' }}>20%</strong> Discipline
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Empty msg="Select a player to view factor breakdown." />
                        )}
                    </HubCard>
                }
            />

            <HubCard style={{ flex: 'none' }}>
                <SectionHeader title="Cohort Factor Distribution" infoKey="factor-score" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '8px' }}>
                    {tierDistribution.map(t => (
                        <div key={t.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', borderTop: `3px solid ${t.color}` }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{t.name}</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#e2e8f0', marginTop: '8px' }}>{t.value}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {Math.round((t.value / analysis.length) * 100)}% of cohort
                            </div>
                        </div>
                    ))}
                </div>
            </HubCard>
        </div>
    );
}

