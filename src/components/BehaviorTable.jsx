export default function BehaviorTable({ students, year, term, onDataUpdate, onRemoveStudent, onStudentClick }) {

    const METRICS = [
        { key: 'gamesPlayed', label: 'Games Played', min: 0, max: 38, suffix: '' },
        { key: 'minutesPlayed', label: 'Minutes Played', min: 0, max: 3420, suffix: 'm' },
        { key: 'yellowCards', label: 'Yellow Cards', min: 0, max: 10, suffix: '' },
        { key: 'redCards', label: 'Red Cards', min: 0, max: 5, suffix: '' },
    ];

    const handleChange = (studentId, metricKey, value, min, max) => {
        const numValue = Math.min(max, Math.max(min, Number(value) || 0));

        const updatedStudents = students.map(s => {
            if (String(s.id) === String(studentId)) {
                const newStudent = { ...s, matchStats: { ...s.matchStats } };
                if (!newStudent.matchStats[year]) newStudent.matchStats[year] = {};
                newStudent.matchStats[year] = {
                    ...newStudent.matchStats[year],
                    [term]: {
                        ...(newStudent.matchStats[year][term] || {}),
                        [metricKey]: numValue
                    }
                };
                return newStudent;
            }
            return s;
        });

        onDataUpdate(updatedStudents);
    };

    const getColor = (key, value) => {
        return '#ffffff';
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            Player
                        </th>
                        {METRICS.map(m => (
                            <th key={m.key} style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {m.label}
                            </th>
                        ))}
                        {onRemoveStudent && (
                            <th style={{ width: '40px', padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => {
                        const beh = student.matchStats?.[year]?.[term] || {};
                        return (
                            <tr key={student.id}
                                style={{ background: 'rgba(255, 255, 255, 0.02)', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                            >
                                <td style={{ padding: '6px 4px 6px 16px', fontWeight: '500', fontSize: '14px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                    <span className="clickable-name" onClick={() => onStudentClick?.(student)}>{student.name}</span>
                                </td>
                                {METRICS.map(m => {
                                    const val = beh[m.key] ?? '';
                                    const color = val !== '' ? getColor(m.key, val) : {};
                                    return (
                                        <td key={m.key} style={{ textAlign: 'center', padding: '6px 4px' }}>
                                            <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleChange(student.id, m.key, e.target.value, m.min, m.max)}
                                                style={{
                                                    width: '58px',
                                                    textAlign: 'center',
                                                    padding: '7px 4px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    border: '1px solid transparent',
                                                    color: '#ffffff',
                                                    fontWeight: 'normal',
                                                    fontSize: '14px',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                                            />
                                        </td>
                                    );
                                })}
                                {onRemoveStudent && (
                                    <td style={{ textAlign: 'center', padding: '6px 4px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                        <button
                                            onClick={() => onRemoveStudent(student.id)}
                                            title={`Remove ${student.name}`}
                                            style={{
                                                background: 'transparent',
                                                color: 'var(--text-muted)',
                                                fontSize: '14px',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                opacity: 0.3,
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.color = 'var(--danger)'; e.target.style.background = 'rgba(239,68,68,0.1)'; }}
                                            onMouseLeave={(e) => { e.target.style.opacity = '0.3'; e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'transparent'; }}
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
