import CorrelationExplorerTab from './hub/CorrelationExplorerTab';

export default function DataHub({ year, term, selectedSchool, onClose, onStudentClick }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: '#040814',
            display: 'flex', flexDirection: 'column',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
        }}>
            {/* Header */}
            <div style={{
                height: '70px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 28px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(10,16,32,0.85)',
                backdropFilter: 'blur(24px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onClose} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        flexShrink: 0,
                        fontSize: '12px', fontWeight: '700',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '8px', padding: '6px 14px',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                        ← Back to Squad
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.4px', background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Raw Data Sandbox
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {year} · {term}
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '5px 12px', borderRadius: '15px', fontWeight: '600' }}>
                    Club Analyst Workspace
                </div>
            </div>

            {/* Correlation Explorer — full width */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 32px 48px',
                background: '#040814',
                minWidth: 0,
            }}>
                <CorrelationExplorerTab
                    year={year}
                    term={term}
                    selectedSchool={selectedSchool}
                    onStudentClick={onStudentClick}
                />
            </div>
        </div>
    );
}
