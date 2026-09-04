import { useState } from 'react';
import GradeTable from './GradeTable';
import BehaviorTable from './BehaviorTable';
import { GK_SUBJECTS } from '../data/mockData';

// ── Icons (inline SVG) ──────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Tab Button ──────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
      color: active ? 'var(--primary-light)' : 'var(--text-muted)',
      border: active ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

export default function DataEntryPanel({
    students,
    year,
    term,
    subjects,
    settings,
    onDataUpdate,
    onRemoveSubject,
    onRemoveStudent,
    onStudentClick,
    onAddSubjectClick,
    onOpenLogShotModal
}) {
    const [statRole, setStatRole] = useState('player'); // 'player' | 'goalkeeper'

    return (
        <div className="glass-panel animate-fade-up" style={{ padding: '0', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Panel Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {/* Title + Sub-Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'transparent' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-light)', fontWeight: '600' }}>Performance Data</h3>
                    
                    {/* Toggle tabs */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        padding: '2px',
                        gap: '2px'
                    }}>
                        <button
                            onClick={() => setStatRole('player')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '18px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: statRole === 'player' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: statRole === 'player' ? 'var(--primary-light)' : 'var(--text-muted)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            Player
                        </button>
                        <button
                            onClick={() => setStatRole('goalkeeper')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '18px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: statRole === 'goalkeeper' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: statRole === 'goalkeeper' ? 'var(--primary-light)' : 'var(--text-muted)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            Goalkeeper
                        </button>
                    </div>
                </div>

                {/* Right meta + action */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {term && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{year} · {term}</span>}
                    {!term && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{year}</span>}
                    {statRole === 'player' && (
                        <button
                            onClick={onAddSubjectClick}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '12px',
                                color: 'var(--primary-light)',
                                background: 'rgba(37,99,235,0.1)',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(37,99,235,0.25)',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.1)'}
                        >
                            <PlusIcon /> Add Metric
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, padding: '4px 0', display: 'flex', flexDirection: 'column' }}>
                <GradeTable
                    students={statRole === 'goalkeeper' ? students.filter(s => s.position === 'Goalkeeper') : students}
                    onDataUpdate={onDataUpdate}
                    year={year}
                    term={term}
                    subjects={statRole === 'player' ? subjects : GK_SUBJECTS}
                    onRemoveSubject={statRole === 'player' ? onRemoveSubject : null}
                    onRemoveStudent={onRemoveStudent}
                    onStudentClick={onStudentClick}
                    settings={settings}
                    onOpenLogShotModal={onOpenLogShotModal}
                />
            </div>
        </div>
    );
}
