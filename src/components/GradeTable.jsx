import { analyzeStudent } from '../utils/analysis';

export default function GradeTable({ students, year, term, onDataUpdate, subjects, onRemoveSubject, onRemoveStudent, onStudentClick, settings = {}, onOpenLogShotModal }) {
    const failingGrade = settings.failingGrade ?? 50;
    const excellentGrade = settings.excellentGrade ?? 90;

    const handleGradeChange = (studentId, subject, value) => {
        const numValue = Math.min(100, Math.max(0, Number(value)));
        const updated = students.map(s => {
            if (String(s.id) !== String(studentId)) return s;
            const newS = { ...s, performance: { ...s.performance } };
            if (!newS.performance[year]) newS.performance[year] = {};
            newS.performance[year] = { ...newS.performance[year], [term]: { ...newS.performance[year][term] } };
            newS.performance[year][term][subject] = numValue;
            return newS;
        });
        onDataUpdate(updated);
    };

    const handleJerseyChange = (studentId, value) => {
        const updated = students.map(s => {
            if (String(s.id) !== String(studentId)) return s;
            return { ...s, jerseyNumber: value };
        });
        onDataUpdate(updated);
    };

    const gradeColor = (g) => {
        return { color: '#ffffff' };
    };

    return (
        <div style={{ width: '100%', minWidth: 0, overflowX: 'auto', padding: '0 0 8px 0' }}>
            <table className="mg-table">
                <thead>
                    <tr>
                        <th style={{ 
                            textAlign: 'left', 
                            paddingLeft: '20px', 
                            position: 'sticky', 
                            left: 0, 
                            background: 'var(--bg-app)', 
                            zIndex: 10,
                            boxShadow: '1px 0 0 rgba(0,0,0,0.05)'
                        }}>Full name</th>
                        {subjects.map(sub => (
                            <th key={sub} style={{ position: 'relative', paddingBottom: '12px' }}>
                                {sub}
                                {onRemoveSubject && (
                                    <button
                                        onClick={() => onRemoveSubject(sub)}
                                        title={`Remove ${sub}`}
                                        style={{
                                            position: 'absolute', top: '0', right: '2px',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            fontSize: '10px',
                                            padding: '2px 4px',
                                            borderRadius: '4px',
                                            opacity: 0.3,
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.color = 'var(--danger)'; }}
                                        onMouseLeave={e => { e.target.style.opacity = '0.3'; e.target.style.color = 'var(--text-muted)'; }}
                                    >✕</button>
                                )}
                            </th>
                        ))}
                        {onRemoveStudent && <th style={{ width: '40px' }} />}
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => {
                        const currentGrades = student.performance?.[year]?.[term] || {};
                        const analysis = analyzeStudent(student, year, term, settings);
                        const riskLevel = analysis.riskLevel;

                        return (
                            <tr key={student.id}>
                                {/* Name */}
                                <td style={{ 
                                    padding: '6px 4px 6px 20px', 
                                    fontWeight: '600', 
                                    fontSize: '13px', 
                                    whiteSpace: 'nowrap',
                                    position: 'sticky',
                                    left: 0,
                                    background: 'var(--bg-surface)',
                                    zIndex: 10,
                                    boxShadow: '1px 0 0 rgba(0,0,0,0.05)',
                                    borderRadius: '6px 0 0 6px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {/* Jersey Number Input */}
                                        <input
                                            type="text"
                                            value={student.jerseyNumber ?? ''}
                                            onChange={e => handleJerseyChange(student.id, e.target.value)}
                                            placeholder="-"
                                            title="Jersey Number"
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                                background: 'rgba(37,99,235,0.2)',
                                                border: '1px solid rgba(37,99,235,0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '11px', fontWeight: '700', color: 'var(--primary-light)',
                                                textAlign: 'center', padding: 0, outline: 'none'
                                            }}
                                        />
                                        <button
                                            onClick={() => onStudentClick?.(student)}
                                            style={{
                                                background: 'none', border: 'none', padding: 0,
                                                fontWeight: '600', fontSize: '13px',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer', textAlign: 'left',
                                                transition: 'color 0.15s',
                                            }}
                                            onMouseEnter={e => { e.target.style.color = 'var(--primary-light)'; e.target.style.textDecoration = 'underline'; }}
                                            onMouseLeave={e => { e.target.style.color = 'var(--text-primary)'; e.target.style.textDecoration = 'none'; }}
                                        >
                                            {student.name}
                                        </button>
                                    </div>
                                </td>

                                {/* Grade inputs */}
                                {subjects.map(sub => {
                                    const isShots = sub === 'Shots';
                                    return (
                                        <td key={sub} style={{ textAlign: 'center', padding: '6px 4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <input
                                                    type="number"
                                                    className="grade-input"
                                                    value={currentGrades[sub] ?? ''}
                                                    onChange={e => handleGradeChange(student.id, sub, e.target.value)}
                                                    style={{ 
                                                        ...gradeColor(currentGrades[sub]),
                                                        width: isShots && onOpenLogShotModal ? '44px' : '52px'
                                                    }}
                                                />
                                                {isShots && onOpenLogShotModal && (
                                                    <button
                                                        onClick={() => onOpenLogShotModal(student, year, term)}
                                                        title="Log Spatial Shot"
                                                        style={{
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            border: '1px solid rgba(59, 130, 246, 0.25)',
                                                            borderRadius: '6px',
                                                            width: '24px', height: '24px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '12px', cursor: 'pointer', outline: 'none', padding: 0
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                                    >
                                                        ⚽
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}

                                {/* Remove */}
                                {onRemoveStudent && (
                                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                                        <button
                                            onClick={() => onRemoveStudent(student.id)}
                                            style={{
                                                background: 'transparent', color: 'var(--text-muted)',
                                                fontSize: '13px', padding: '4px 8px', borderRadius: '6px',
                                                opacity: 0.3, transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.color = 'var(--danger)'; e.target.style.background = 'var(--danger-dim)'; }}
                                            onMouseLeave={e => { e.target.style.opacity = '0.3'; e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'transparent'; }}
                                        >✕</button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
