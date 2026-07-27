import { useMemo, useState } from 'react';
import CustomSelect from '../CustomSelect';
import {
    HubCard, SectionHeader, scoreColor, CHART_COLORS, TT_STYLE,
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from './HubShared';
import { ALL_STUDENTS, SUBJECTS, TEAMS, SCHOOLS } from '../../data/mockData';

// ── Math Helpers ──────────────────────────────────────────────────────
function getMean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getStdDev(arr, mu) {
    if (arr.length <= 1) return 2; // Default small volatility if not enough data
    const variance = arr.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / (arr.length - 1); // Sample variance
    return Math.sqrt(variance);
}

// Box-Muller transform to generate random normal variables
function randomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

// ── Custom Tooltip ────────────────────────────────────────────────────
function PDFTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px', minWidth: 160,
        }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Score: {d.score}</div>
            <div style={{ color: '#94a3b8' }}>Probability: <strong style={{ color: '#a78bfa' }}>{(d.probability * 100).toFixed(2)}%</strong></div>
        </div>
    );
}

export default function SimulationTab({ year, term, selectedSchool, onStudentClick }) {
    const [selectedClassId, setSelectedClassId] = useState('ALL');
    const [selectedStudentId, setSelectedStudentId] = useState('ALL');
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);

    // Filter students by current year and optionally by selected class
    const activeStudents = useMemo(() => {
        let students = ALL_STUDENTS.filter(s => TEAMS.some(c => s.teamAssignments?.[year] === c.id));
        if (selectedSchool !== 'ALL') {
            students = students.filter(s => s.schoolId === selectedSchool);
        }
        if (selectedClassId !== 'ALL') {
            students = students.filter(s => s.teamAssignments?.[year] === selectedClassId);
        }
        // Always sort alphabetically for easier finding
        return students.sort((a, b) => a.name.localeCompare(b.name));
    }, [year, selectedSchool, selectedClassId]);

    const activeTeams = useMemo(() => {
        return selectedSchool === 'ALL' ? [] : TEAMS.filter(c => c.schoolId === selectedSchool);
    }, [selectedSchool]);

    // Initial selected student logic
    // If the student list changes (e.g. class filter applied) and the current student isn't in it, pick the first one
    if (selectedStudentId === 'ALL' || (activeStudents.length > 0 && !activeStudents.some(s => s.id === selectedStudentId))) {
        setSelectedStudentId(activeStudents[0]?.id || 'ALL');
    }

    const { metrics, pdfData } = useMemo(() => {
        if (selectedStudentId === 'ALL') return { metrics: null, pdfData: [] };

        const student = ALL_STUDENTS.find(s => s.id === selectedStudentId);
        if (!student) return { metrics: null, pdfData: [] };

        // 1. Gather historical data for the selected subject
        const historicalScores = [];
        // Look through all years up to current (simplified: just grab all available performance for this student)
        if (student.performance) {
            Object.values(student.performance).forEach(yearGrades => {
                Object.values(yearGrades).forEach(termGrades => {
                    if (termGrades[selectedSubject] !== undefined) {
                        historicalScores.push(termGrades[selectedSubject]);
                    }
                });
            });
        }

        const currentMean = getMean(historicalScores);
        // If they only have 1 grade, assume a default standard deviation (e.g. 5) to allow simulation
        const currentStdDev = historicalScores.length > 1 ? getStdDev(historicalScores, currentMean) : 5;

        // 2. Monte Carlo Simulation (10,000 iterations)
        const iterations = 10000;
        const results = [];
        let passCount = 0;
        let distinctionCount = 0;

        for (let i = 0; i < iterations; i++) {
            // Generate a simulated score
            let simScore = randomNormal(currentMean, currentStdDev);
            // Bound the score between 0 and 100
            simScore = Math.max(0, Math.min(100, simScore));
            results.push(simScore);
            
            if (simScore >= 50) passCount++;
            if (simScore >= 90) distinctionCount++;
        }

        const simMean = getMean(results);
        const simStdDev = getStdDev(results, simMean);
        const startingXiProb = passCount / iterations;
        const starPlayerProb = distinctionCount / iterations;

        // 3. Bin results into a Probability Density Function (PDF)
        // Create bins from 0 to 100
        const bins = new Array(101).fill(0);
        results.forEach(score => {
            const bucket = Math.round(score);
            if (bucket >= 0 && bucket <= 100) bins[bucket]++;
        });

        // Convert counts to probabilities and smooth it out slightly
        const pdf = [];
        for (let i = 0; i <= 100; i++) {
            pdf.push({
                score: i,
                probability: bins[i] / iterations,
                // Add a second data key to use split gradients
                startingXiProb: i >= 50 ? bins[i] / iterations : 0,
                failProb: i < 50 ? bins[i] / iterations : 0,
            });
        }

        return {
            metrics: {
                mean: simMean,
                stdDev: simStdDev,
                startingXiProb,
                starPlayerProb,
                historicalCount: historicalScores.length
            },
            pdfData: pdf
        };
    }, [selectedStudentId, selectedSubject]);

    if (!metrics) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* Header / Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <SectionHeader 
                    title="Monte Carlo Projection" infoKey="simulation" 
                    subtitle="10,000 randomized iterations projecting future ratings/performance based on historical volatility" 
                />
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Squad</div>
                        <CustomSelect 
                            value={selectedClassId} 
                            onChange={e => setSelectedClassId(e.target.value)}
                            options={[
                                { value: 'ALL', label: selectedSchool === 'ALL' ? 'Select a School First' : 'All Squads' },
                                ...activeTeams.map(c => ({ value: c.id, label: c.name }))
                            ]}
                            style={{ minWidth: '150px' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Player</div>
                        <CustomSelect 
                            value={selectedStudentId} 
                            onChange={e => setSelectedStudentId(Number(e.target.value))}
                            options={activeStudents.map(s => ({ value: s.id, label: s.name }))}
                            style={{ minWidth: '150px' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metric</div>
                        <CustomSelect 
                            value={selectedSubject} 
                            onChange={e => setSelectedSubject(e.target.value)}
                            options={SUBJECTS}
                            style={{ minWidth: '130px' }}
                        />
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                    { label: 'Expected Rating', value: `${metrics.mean.toFixed(1)}%`, color: scoreColor(metrics.mean) },
                    { label: 'Volatility (StdDev)', value: `±${metrics.stdDev.toFixed(1)}`, color: metrics.stdDev > 15 ? 'var(--danger)' : metrics.stdDev > 10 ? 'var(--warning)' : 'var(--success)' },
                    { label: 'Prob of Starting XI', value: `${(metrics.startingXiProb * 100).toFixed(1)}%`, color: metrics.startingXiProb >= 0.8 ? 'var(--success)' : metrics.startingXiProb >= 0.5 ? 'var(--warning)' : 'var(--danger)' },
                    { label: 'Prob of Star Player', value: `${(metrics.starPlayerProb * 100).toFixed(1)}%`, color: '#a78bfa' },
                ].map(kpi => (
                    <HubCard key={kpi.label} style={{ padding: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                            {kpi.label}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: kpi.color, letterSpacing: '-1px' }}>
                            {kpi.value}
                        </div>
                    </HubCard>
                ))}
            </div>

            {/* Distribution Chart */}
            <HubCard style={{ padding: '24px', flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.05em' }}>Probability Density Curve</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Based on {metrics.historicalCount} historical data points</div>
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pdfData} margin={{ top: 25, right: 20, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.0}/>
                                </linearGradient>
                                <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                                dataKey="score" 
                                type="number"
                                domain={[0, 100]}
                                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                minTickGap={20}
                            />
                            <YAxis 
                                tick={false} // hide y-axis labels as density probability numbers aren't intuitive for users
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<PDFTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                            
                            {/* The failing area */}
                            <Area 
                                type="monotone" 
                                dataKey="failProb" 
                                stroke="var(--danger)" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorFail)" 
                                isAnimationActive={false}
                            />
                            
                            {/* The passing area */}
                            <Area 
                                type="monotone" 
                                dataKey="startingXiProb" 
                                stroke="var(--success)" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorPass)" 
                                isAnimationActive={false}
                            />

                            <ReferenceLine x={50} stroke="var(--danger)" strokeDasharray="4 4" label={{ position: 'top', value: 'Starting XI (50%)', fill: 'var(--danger)', fontSize: 12, fontWeight: 700 }} />
                            <ReferenceLine x={metrics.mean} stroke="var(--primary-light)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Expected', fill: 'var(--primary-light)', fontSize: 12, fontWeight: 700 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </HubCard>
        </div>
    );
}
