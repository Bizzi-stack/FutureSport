import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { analyzeStudent } from '../utils/analysis';
import { YEARS, TERMS, SUBJECTS } from '../data/mockData';

const printStyles = `
@media print {
    /* Hide the entire React app */
    #root {
        display: none !important;
    }
    
    /* Make sure body can expand indefinitely */
    html, body {
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        position: static !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
    /* Reset the overlay so it flows as a normal document */
    .parent-report-overlay {
        position: static !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
        background: white !important;
        padding: 0 !important;
        display: block !important;
        z-index: 9999 !important;
    }
    .parent-report-content {
        position: static !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        width: 100% !important;
        max-width: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .no-print {
        display: none !important;
    }
}
`;

function gradeColorPrint(g) {
    if (g >= 90) return '#166534'; // dark green
    if (g >= 75) return '#1e40af'; // dark blue
    if (g >= 50) return '#854d0e'; // dark yellow/orange
    return '#991b1b'; // dark red
}

export default function ParentReportModal({ student, onClose, settings = {} }) {
    if (!student) return null;

    const latestYear = YEARS[YEARS.length - 1];
    
    // Get latest term
    const latestTerm = TERMS[TERMS.length - 1];
    const latestAnalysis = analyzeStudent(student, latestYear, latestTerm, settings);
    const matchStats = student.matchStats?.[latestYear]?.[latestTerm] || {};
    
    // Calculate Subject Averages for the latest year
    const avgPerSubject = {};
    SUBJECTS.forEach(sub => {
        const vals = TERMS.map(t => student.performance?.[latestYear]?.[t]?.[sub]).filter(v => v !== undefined);
        if (vals.length) avgPerSubject[sub] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    });
    const sortedSubjects = Object.entries(avgPerSubject).sort((a, b) => b[1] - a[1]);

    // Calculate Trend Data across the year
    const trendData = useMemo(() => {
        return TERMS.map(t => {
            const gradesObj = student.performance?.[latestYear]?.[t] || {};
            const vals = Object.values(gradesObj).filter(v => v > 0);
            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
            return { term: t, average: avg };
        }).filter(d => d.average !== null);
    }, [student, latestYear]);

    // Generate plain-english progress insight
    const progressInsights = useMemo(() => {
        if (trendData.length < 2) return "Continuing to build baseline performance data.";
        const first = trendData[0].average;
        const last = trendData[trendData.length - 1].average;
        const diff = last - first;
        
        if (diff >= 3) return `Showing positive growth (+${diff}% since ${trendData[0].term}).`;
        if (diff <= -3) return `Experiencing a slight dip (${diff}% since ${trendData[0].term}). Monitoring recommended.`;
        return "Maintaining stable and consistent performance.";
    }, [trendData]);

    // Calculate Subject Momentum for Strengths & Focus Areas
    const subjectMomentums = useMemo(() => {
        return SUBJECTS.map(sub => {
            const points = TERMS.map(t => student.performance?.[latestYear]?.[t]?.[sub]).filter(v => v !== undefined);
            if (points.length < 2) return null;
            const diff = points[points.length - 1] - points[0];
            return { subject: sub, diff, latest: points[points.length - 1] };
        }).filter(Boolean).sort((a, b) => b.diff - a.diff);
    }, [student, latestYear]);

    const strengths = subjectMomentums.filter(s => s.diff > 0).slice(0, 2);
    const focusAreas = subjectMomentums.filter(s => s.diff < 0).reverse().slice(0, 2);

    // Calculate Holistic Profile Data for Radar Chart
    const radarData = useMemo(() => {
        if (!trendData.length) return [];
        
        // Academics
        const academicScore = latestAnalysis.average;
        
        // Consistency (Inverse of variance)
        const recent = trendData.map(d => d.average);
        const yMean = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((a, b) => a + Math.pow(b - yMean, 2), 0) / recent.length;
        const consistencyScore = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) * 2.5)));

        // Resilience (Latest term bounce)
        let resilienceScore = 70;
        if (recent.length >= 2) {
            const diff = recent[recent.length - 1] - recent[recent.length - 2];
            resilienceScore = Math.max(0, Math.min(100, 70 + (diff * 15)));
        }

        // Match Stats / Games Played
        const att = matchStats.gamesPlayed ?? 80;
        const cond = matchStats.yellowCards ?? 0;
        const late = matchStats.minutesPlayed ?? 0;
        const behScore = Math.max(0, Math.min(100, 100 - (cond * 10) - (late * 2)));

        return [
            { subject: 'Academics', score: Math.round(academicScore) },
            { subject: 'Consistency', score: Math.round(consistencyScore) },
            { subject: 'Resilience', score: Math.round(resilienceScore) },
            { subject: 'Games Played', score: Math.round(att) },
            { subject: 'Conduct', score: Math.round(behScore) }
        ];
    }, [latestAnalysis, trendData, matchStats]);

    // Generate Automated Teacher Note
    const teacherNote = useMemo(() => {
        let note = `${student.name} has completed ${latestTerm} of the ${latestYear} academic year. `;
        if (latestAnalysis.average >= 80) {
            note += `They have demonstrated outstanding academic performance with an overall average of ${latestAnalysis.average}%. `;
        } else if (latestAnalysis.average >= 60) {
            note += `They have shown solid effort with an overall average of ${latestAnalysis.average}%. `;
        } else {
            note += `Their overall average is ${latestAnalysis.average}%. Additional support may be beneficial. `;
        }

        if (matchStats.gamesPlayed >= 90) {
            note += `Games Played has been excellent. `;
        } else if (matchStats.gamesPlayed < 75) {
            note += `We encourage improving gamesPlayed for better engagement. `;
        }

        if (sortedSubjects.length > 0) {
            note += `Their strongest subject is ${sortedSubjects[0][0]}, where they scored ${sortedSubjects[0][1]}%. `;
        }

        if (latestAnalysis.risks && latestAnalysis.risks.length > 0) {
            note += `Please review their performance in ${latestAnalysis.risks.join(', ')} as these areas require attention. `;
        }

        note += `Keep up the great work and continue to support their extracurricular interests!`;
        return note;
    }, [student, latestAnalysis, matchStats, sortedSubjects, latestYear, latestTerm]);

    const modalContent = (
        <div className="parent-report-overlay" style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px',
        }}>
            <style>{printStyles}</style>

            <div className="parent-report-content" style={{
                background: '#ffffff',
                color: '#1e293b',
                width: '100%', maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '16px',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}>
                {/* ── Control Bar (No Print) ──────────────────────────────── */}
                <div className="no-print" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 24px', borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc', borderRadius: '16px 16px 0 0',
                    position: 'sticky', top: 0, zIndex: 10
                }}>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>Parent Report Preview</div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => window.print()} style={{
                            padding: '8px 16px', background: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                        }}>
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} style={{
                            padding: '8px 16px', background: '#e2e8f0', color: '#475569',
                            border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                        }}>
                            Close
                        </button>
                    </div>
                </div>

                {/* ── Printable Report Area ──────────────────────────────── */}
                <div id="parent-report-printable" style={{ padding: '40px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '20px', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Merit Grid</h1>
                            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Official Parent Insight Report</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#334155' }}>{student.name}</div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Academic Year: {latestYear}</div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Latest Record: {latestTerm}</div>
                        </div>
                    </div>

                    {/* Summary KPI */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Overall Average</div>
                            <div style={{ fontSize: '36px', fontWeight: '900', color: gradeColorPrint(latestAnalysis.average) }}>{latestAnalysis.average}%</div>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Games Played</div>
                            <div style={{ fontSize: '36px', fontWeight: '900', color: matchStats.gamesPlayed >= 85 ? '#166534' : '#991b1b' }}>{matchStats.gamesPlayed}%</div>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Homework</div>
                            <div style={{ fontSize: '36px', fontWeight: '900', color: matchStats.redCards >= 80 ? '#166534' : '#991b1b' }}>{matchStats.redCards}%</div>
                        </div>
                    </div>

                    {/* Progress Trend Tracker */}
                    {trendData.length >= 1 && (
                        <div style={{ marginBottom: '40px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Academic Progress Tracker</h2>
                                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                        Trajectory: <span style={{ color: '#0f172a' }}>{progressInsights}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                                        <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                                        <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={3} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Holistic Profile & Insights */}
                    {radarData.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                            {/* Radar Chart */}
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>Holistic Student Profile</h2>
                                <div style={{ height: '240px', width: '100%', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Student" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.4} isAnimationActive={false} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Strengths & Focus Areas */}
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>Momentum Insights</h2>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>Developing Strengths</div>
                                    {strengths.length > 0 ? strengths.map(s => (
                                        <div key={s.subject} style={{ display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', border: '1px solid #dcfce3' }}>
                                            <span style={{ fontWeight: '700', color: '#166534', fontSize: '14px' }}>{s.subject}</span>
                                            <span style={{ fontWeight: '800', color: '#15803d', fontSize: '14px' }}>+{s.diff}%</span>
                                        </div>
                                    )) : (
                                        <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>Performance is stable across subjects.</div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', marginBottom: '8px' }}>Areas for Focus</div>
                                    {focusAreas.length > 0 ? focusAreas.map(s => (
                                        <div key={s.subject} style={{ display: 'flex', justifyContent: 'space-between', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', border: '1px solid #fee2e2' }}>
                                            <span style={{ fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>{s.subject}</span>
                                            <span style={{ fontWeight: '800', color: '#b91c1c', fontSize: '14px' }}>{s.diff}%</span>
                                        </div>
                                    )) : (
                                        <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No significant performance dips detected.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subject Breakdown */}
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Subject Performance ({latestYear})</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x: 40px, y: 16px', columnGap: '40px', rowGap: '16px' }}>
                            {sortedSubjects.map(([sub, avg]) => (
                                <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>{sub}</span>
                                    <span style={{ fontSize: '16px', fontWeight: '800', color: gradeColorPrint(avg) }}>{avg}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Automated Insights & Extracurriculars */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Counselor Insights</h2>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', fontSize: '15px', lineHeight: '1.6', color: '#334155', fontStyle: 'italic' }}>
                                "{teacherNote}"
                            </div>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Activities</h2>
                            {student.extracurriculars && student.extracurriculars.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', lineHeight: '1.8', fontSize: '15px', fontWeight: '600' }}>
                                    {student.extracurriculars.map(act => (
                                        <li key={act.name}>{act.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>No registered activities.</div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        Generated automatically by Merit Grid platform. If you have any concerns, please contact the school administration.
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
