import { useState } from 'react';
import NationalOverviewTab from './hub/NationalOverviewTab';
import NationalSubjectTab from './hub/NationalSubjectTab';
import NationalBehaviorTab from './hub/NationalBehaviorTab';
import NationalCohortTab from './hub/NationalCohortTab';

const TABS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'subjects',     label: 'Domain Specialization' },
    { id: 'matchStats',     label: 'Welfare & Engagement' },
    { id: 'cohort',       label: 'Cohort Dynamics' },
];

export default function NationalHub({ year, term, onClose, onStudentClick }) {
    const [tab, setTab] = useState(TABS[0].id);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#040814',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', background: '#0a1020', borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⚽</span>
                        <div>
                             <div style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
                                 National Academy Intelligence
                             </div>
                             <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                                 Inter-Academy Data Hub
                             </h2>
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                    background: tab === t.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                                    color: tab === t.id ? '#c4b5fd' : 'var(--text-muted)',
                                    border: tab === t.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                                    transition: 'all 0.15s', cursor: 'pointer',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {year} · {term}
                    </div>
                    <button onClick={onClose} style={{
                        padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                    }}>
                        Close Hub
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px', display: 'flex', flexDirection: 'column' }}>
                {tab === 'overview' && <NationalOverviewTab year={year} term={term} />}
                {tab === 'subjects' && <NationalSubjectTab year={year} term={term} />}
                {tab === 'matchStats' && <NationalBehaviorTab year={year} term={term} />}
                {tab === 'cohort'   && <NationalCohortTab year={year} term={term} />}
            </div>
        </div>
    );
}
