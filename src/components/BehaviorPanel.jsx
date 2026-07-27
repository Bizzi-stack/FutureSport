export default function BehaviorPanel({ students, year, term, settings = {}, onStudentClick }) {
    const thresholds = {
        gamesPlayedMin: settings.gamesPlayedMin ?? 10,
        minutesPlayedMin: settings.minutesPlayedMin ?? 800,
        yellowCardsMax: settings.yellowCardsMax ?? 3,
        redCardsMax: settings.redCardsMax ?? 1,
    };

    const behaviorData = students
        .map(s => { const b = s.matchStats?.[year]?.[term]; return b ? { ...s, beh: b } : null; })
        .filter(Boolean);

    if (behaviorData.length === 0) return (
        <div className="glass-panel" style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>No match statistics available.</div>
    );

    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const avgGames = avg(behaviorData.map(s => s.beh.gamesPlayed));
    const avgMinutes = avg(behaviorData.map(s => s.beh.minutesPlayed));
    const totalYellow = behaviorData.reduce((sum, s) => sum + s.beh.yellowCards, 0);
    const totalRed = behaviorData.reduce((sum, s) => sum + s.beh.redCards, 0);

    const flaggedStudents = behaviorData.filter(s =>
        s.beh.gamesPlayed < thresholds.gamesPlayedMin ||
        s.beh.minutesPlayed < thresholds.minutesPlayedMin ||
        s.beh.yellowCards >= thresholds.yellowCardsMax ||
        s.beh.redCards >= thresholds.redCardsMax
    ).sort((a, b) => {
        const count = s => (
            (s.beh.gamesPlayed < thresholds.gamesPlayedMin ? 1 : 0) +
            (s.beh.minutesPlayed < thresholds.minutesPlayedMin ? 1 : 0) +
            (s.beh.yellowCards >= thresholds.yellowCardsMax ? 1 : 0) +
            (s.beh.redCards >= thresholds.redCardsMax ? 1 : 0)
        );
        return count(b) - count(a);
    });

    const metrics = [
        {
            label: 'Games Played', value: `${avgGames.toFixed(1)}`, suffix: 'avg games',
            fill: (avgGames / 38) * 100, max: 100,
            color: avgGames >= 15 ? 'var(--success)' : avgGames >= 8 ? 'var(--warning)' : 'var(--danger)',
        },
        {
            label: 'Minutes Played', value: `${Math.round(avgMinutes)}`, suffix: 'avg mins',
            fill: (avgMinutes / 3420) * 100, max: 100,
            color: avgMinutes >= 1200 ? 'var(--success)' : avgMinutes >= 800 ? 'var(--warning)' : 'var(--danger)',
        },
        {
            label: 'Yellow Cards', value: totalYellow, suffix: 'total cards',
            fill: Math.min(100, (totalYellow / (students.length * 2)) * 100),
            color: totalYellow <= students.length ? 'var(--success)' : totalYellow <= students.length * 2 ? 'var(--warning)' : 'var(--danger)',
        },
        {
            label: 'Red Cards', value: totalRed, suffix: 'total cards',
            fill: Math.min(100, (totalRed / (students.length * 0.5)) * 100),
            color: totalRed <= students.length * 0.1 ? 'var(--success)' : totalRed <= students.length * 0.3 ? 'var(--warning)' : 'var(--danger)',
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className="section-title">Squad Performance Indicators</p>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {metrics.map(m => (
                    <div key={m.label} className="kpi-card" style={{ '--accent': m.color, padding: '16px 18px' }}>
                        <span className="kpi-label">{m.label}</span>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: m.color, letterSpacing: '-0.03em' }}>
                            {m.value}
                            {m.suffix && <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '4px' }}>{m.suffix}</span>}
                        </span>
                        <div className="progress-track" style={{ marginTop: '6px' }}>
                            <div className="progress-fill" style={{ width: `${m.fill}%`, background: m.color, opacity: 0.8 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Flagged Students */}
            {flaggedStudents.length > 0 && (
                <div>
                    <p className="section-title" style={{ marginBottom: '10px' }}>
                        Performance Flags ({flaggedStudents.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {flaggedStudents.map(s => (
                            <div key={s.id} style={{
                                background: 'rgba(245,158,11,0.06)',
                                borderLeft: '3px solid var(--warning)',
                                padding: '11px 14px',
                                borderRadius: '0 10px 10px 0',
                            }}>
                                <div className="clickable-name" onClick={() => onStudentClick?.(s)} style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>{s.name}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {s.beh.gamesPlayed < thresholds.gamesPlayedMin &&
                                        <span className="chip chip-danger">Games Played {s.beh.gamesPlayed}</span>}
                                    {s.beh.minutesPlayed < thresholds.minutesPlayedMin &&
                                        <span className="chip chip-warning">Mins {s.beh.minutesPlayed}</span>}
                                    {s.beh.yellowCards >= thresholds.yellowCardsMax &&
                                        <span className="chip chip-danger">Yellow Cards {s.beh.yellowCards}</span>}
                                    {s.beh.redCards >= thresholds.redCardsMax &&
                                        <span className="chip chip-danger">Red Cards {s.beh.redCards}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
