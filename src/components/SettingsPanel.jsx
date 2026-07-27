import { useState } from 'react';

const DEFAULT_SETTINGS = {
    // Academy Info
    schoolName: 'Elite Academy',
    principalName: '',
    schoolYear: '2024-2025',

    // Risk Thresholds (Internal Defaults - No longer configured by user)
    failingGrade: 50,
    excellentGrade: 90,
    highRiskAverage: 50,
    highRiskFailCount: 2,
    moderateRiskAverage: 60,

    // Behavioral Thresholds (Internal Defaults - No longer configured by user)
    attendanceWarning: 80,
    attendanceCritical: 70,
    lateArrivalWarning: 5,
    conductWarning: 3,
    homeworkWarning: 60,

    // Display Options
    showBehaviorPanel: true,
    compactRows: false,
    highlightAtRisk: true,
    showStrengths: true,
};

export function useSettings() {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('eduvision-settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem('eduvision-settings', JSON.stringify(newSettings));
        } catch { /* localStorage not available */ }
    };

    const resetSettings = () => {
        updateSettings(DEFAULT_SETTINGS);
    };

    return { settings, updateSettings, resetSettings };
}

export default function SettingsPanel({ settings, onUpdate, onReset, onClose }) {
    const [local, setLocal] = useState({ ...settings });
    const [activeSection, setActiveSection] = useState('school');
    const [hasChanges, setHasChanges] = useState(false);

    const update = (key, value) => {
        const updated = { ...local, [key]: value };
        setLocal(updated);
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate(local);
        setHasChanges(false);
    };

    const handleReset = () => {
        if (!window.confirm('Reset all settings to defaults? This cannot be undone.')) return;
        onReset();
        onClose();
    };

    const sections = [
        { key: 'school',  label: 'Academy Info' },
        { key: 'display', label: 'Display' },
        { key: 'data',    label: 'Data' },
    ];

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{
                    width: '680px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 28px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Settings</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Configure display and academy information</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-secondary)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >✕</button>
                </div>

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '2px',
                    padding: '12px 28px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {sections.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            style={{
                                padding: '10px 16px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: activeSection === s.key ? 'var(--primary)' : 'var(--text-secondary)',
                                background: activeSection === s.key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                borderRadius: '8px 8px 0 0',
                                borderBottom: activeSection === s.key ? '2px solid var(--primary)' : '2px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >{s.label}</button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {activeSection === 'school' && (
                        <SectionSchool local={local} update={update} />
                    )}
                    {activeSection === 'display' && (
                        <SectionDisplay local={local} update={update} />
                    )}
                    {activeSection === 'data' && (
                        <SectionData onReset={handleReset} />
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: '12px', color: hasChanges ? '#f59e0b' : 'var(--text-muted)' }}>
                        {hasChanges ? '● Unsaved changes' : 'All settings saved'}
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '9px 18px',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                borderRadius: '8px',
                                border: 'var(--border-glass)',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}
                        >Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            style={{
                                padding: '9px 22px',
                                background: hasChanges ? 'var(--primary)' : 'rgba(59,130,246,0.3)',
                                color: hasChanges ? 'white' : 'rgba(255,255,255,0.4)',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                boxShadow: hasChanges ? '0 0 15px var(--primary-glow)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Section Components ---

function SectionSchool({ local, update }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader title="Academy Information" desc="General club and director details" />
            <Field label="Academy / Club Name" value={local.schoolName} onChange={v => update('schoolName', v)} placeholder="e.g. Elite Academy" />
            <Field label="Director / Head Coach Name" value={local.principalName} onChange={v => update('principalName', v)} placeholder="e.g. Coach Smith" />
            <Field label="Current Season" value={local.schoolYear} onChange={v => update('schoolYear', v)} placeholder="e.g. 2024-2025" />
        </div>
    );
}

function SectionDisplay({ local, update }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader title="Display Preferences" desc="Customize the dashboard layout and visual indicators" />
            <Toggle label="Show Match Stats Panel" desc="Display the match statistics summary on the left sidebar" checked={local.showBehaviorPanel} onChange={v => update('showBehaviorPanel', v)} />
            <Toggle label="Compact Table Rows" desc="Use smaller row heights in ratings and stats tables" checked={local.compactRows} onChange={v => update('compactRows', v)} />
            <Toggle label="Highlight Underperforming Players" desc="Visually emphasize players flagged as needing support" checked={local.highlightAtRisk} onChange={v => update('highlightAtRisk', v)} />
            <Toggle label="Show Strengths in Profile" desc="Include metrics where players excel in the insights panel" checked={local.showStrengths} onChange={v => update('showStrengths', v)} />
        </div>
    );
}

function SectionData({ onReset }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader title="Data Management" desc="Manage application data and settings" />
            <div className="glass-panel" style={{
                padding: '20px',
                borderLeft: '4px solid var(--danger)',
                background: 'rgba(239, 68, 68, 0.05)',
            }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--danger)', marginBottom: '6px' }}>Danger Zone</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Reset all settings to factory defaults. This will not affect player data.
                </p>
                <button
                    onClick={onReset}
                    style={{
                        padding: '8px 18px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--danger)',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.25)'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                >Reset All Settings</button>
            </div>
        </div>
    );
}

// --- Shared UI Primitives ---

function SectionHeader({ title, desc }) {
    return (
        <div style={{ marginBottom: '4px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{desc}</p>
        </div>
    );
}

function Field({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: '500' }}>{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.25)',
                    border: 'var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                }}
            />
        </div>
    );
}

function NumberField({ label, value, onChange, min, max, hint, style }) {
    return (
        <div style={style}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: '500' }}>{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
                min={min}
                max={max}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.25)',
                    border: 'var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                }}
            />
            {hint && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{hint}</span>}
        </div>
    );
}

function Toggle({ label, desc, checked, onChange }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.15)',
                border: 'var(--border-glass)',
                cursor: 'pointer',
                transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
        >
            <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{label}</div>
                {desc && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>}
            </div>
            <div style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                position: 'relative',
                transition: 'background 0.25s',
                flexShrink: 0,
                marginLeft: '16px',
                boxShadow: checked ? '0 0 10px var(--primary-glow)' : 'none',
            }}>
                <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: checked ? '23px' : '3px',
                    transition: 'left 0.25s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
            </div>
        </div>
    );
}

function Divider() {
    return <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />;
}
