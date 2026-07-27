import { analyzeStudent, analyzeClass } from '../utils/analysis';

const RANK_COLORS = ['#3b82f6', '#0ea5e9', '#14b8a6'];
const RANK_BG    = ['rgba(37,99,235,0.07)', 'rgba(14,165,233,0.06)', 'rgba(20,184,166,0.06)'];

function RankCircle({ rank }) {
    return (
        <div style={{
            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
            background: rank === 0 ? '#3b82f6' : rank === 1 ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '800',
            color: rank === 0 ? '#fff' : '#a5b4fc',
        }}>
            {rank + 1}
        </div>
    );
}

function AccentHeader({ title }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '3px', height: '13px', background: '#3b82f6', borderRadius: '2px', opacity: 0.65, flexShrink: 0 }} />
            <p className="section-title" style={{ margin: 0 }}>{title}</p>
        </div>
    );
}

export default function InsightsPanel({ students, year, term, settings = {}, onStudentClick }) {
    const classStats = analyzeClass(students, year, term, settings);

    const analyzedStudents = students.map(s => ({ ...s, analysis: analyzeStudent(s, year, term, settings) }));

    const atRiskStudents = analyzedStudents
        .filter(s => s.analysis.isAtRisk)
        .sort((a, b) => parseFloat(a.analysis.average) - parseFloat(b.analysis.average));

    const topStudents = analyzedStudents
        .filter(s => parseFloat(s.analysis.average) > 0)
        .sort((a, b) => parseFloat(b.analysis.average) - parseFloat(a.analysis.average))
        .slice(0, 3);

    const avgNum   = parseFloat(classStats.classAverage);
    const avgColor = avgNum >= 75 ? 'var(--success)' : avgNum >= 55 ? 'var(--warning)' : 'var(--danger)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* KPI Cards */}
            <div>
                <AccentHeader title="Squad Analytics" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="kpi-card" style={{ '--accent': avgColor }}>
                        <span className="kpi-label">Squad Avg Rating</span>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', justifyContent: 'space-between' }}>
                            <span className="kpi-value" style={{ color: avgColor }}>
                                {classStats.classAverage}
                                <span className="kpi-suffix"></span>
                            </span>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{students.length} players</div>
                                <div className="progress-track" style={{ width: '80px' }}>
                                    <div className="progress-fill" style={{ width: `${classStats.classAverage}%`, background: avgColor }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="kpi-card" style={{ '--accent': classStats.atRiskCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            <span className="kpi-label">Needs Review</span>
                            <span className="kpi-value" style={{ color: classStats.atRiskCount > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '28px' }}>
                                {classStats.atRiskCount}
                                <span className="kpi-suffix">/ {classStats.totalStudents}</span>
                            </span>
                        </div>
                        <div className="kpi-card" style={{ '--accent': atRiskStudents.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            <span className="kpi-label">Review</span>
                            <span className="kpi-value" style={{ color: atRiskStudents.length > 0 ? 'var(--warning)' : 'var(--success)', fontSize: '22px' }}>
                                {atRiskStudents.length > 0 ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* At Risk Students */}
            {atRiskStudents.length > 0 && (
                <div>
                    <AccentHeader title="Players Needing Review" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {atRiskStudents.map(student => {
                            const isHigh    = student.analysis.riskLevel === 'High';
                            const borderCol = isHigh ? 'var(--danger)' : 'var(--warning)';
                            return (
                                <div key={student.id} style={{
                                    background: isHigh ? 'rgba(244,63,94,0.05)' : 'rgba(245,158,11,0.05)',
                                    borderLeft: `2px solid ${borderCol}`,
                                    padding: '12px 14px',
                                    borderRadius: '0 8px 8px 0',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span className="clickable-name" onClick={() => onStudentClick?.(student)} style={{ fontWeight: '600', fontSize: '13px' }}>{student.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={`badge badge-${student.analysis.riskLevel.toLowerCase()}`}>{student.analysis.riskLevel}</span>
                                            <span style={{ fontSize: '16px', fontWeight: '800', color: borderCol }}>
                                                {student.analysis.average}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '11px' }}>
                                        {student.analysis.risks.length > 0 && (
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                Low Stats: <span style={{ color: 'var(--danger)' }}>{student.analysis.risks.join(', ')}</span>
                                            </span>
                                        )}
                                        {student.analysis.behaviorFlags.map(flag => (
                                            <span key={flag} className="chip chip-warning">{flag}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Top Performers */}
            {topStudents.length > 0 && (
                <div>
                    <AccentHeader title="Top Rated Players" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topStudents.map((student, i) => (
                            <div key={student.id} style={{
                                background: RANK_BG[i],
                                borderLeft: `2px solid ${RANK_COLORS[i]}`,
                                padding: '12px 14px',
                                borderRadius: '0 8px 8px 0',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <RankCircle rank={i} />
                                        <span className="clickable-name" onClick={() => onStudentClick?.(student)} style={{ fontWeight: '600', fontSize: '13px' }}>{student.name}</span>
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: '800', color: RANK_COLORS[i] }}>
                                        {student.analysis.average}
                                    </span>
                                </div>
                                <div className="progress-track" style={{ marginBottom: '6px' }}>
                                    <div className="progress-fill" style={{ width: `${student.analysis.average}%`, background: RANK_COLORS[i], opacity: 0.65 }} />
                                </div>
                                {student.analysis.strengths.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Strong in:</span>
                                        {student.analysis.strengths.map(sub => (
                                            <span key={sub} className="chip" style={{
                                                background: `${RANK_COLORS[i]}14`,
                                                color: RANK_COLORS[i],
                                                fontSize: '10px',
                                            }}>{sub}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
