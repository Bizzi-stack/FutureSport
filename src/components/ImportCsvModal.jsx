import { useState, useRef, useCallback } from 'react';
import { parseImportCsv } from '../utils/importReport';

// ── Icons ────────────────────────────────────────────────────────────
const UploadIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const AlertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const FileIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

// ── Modes ────────────────────────────────────────────────────────────
const MODE = { UPLOAD: 'upload', PREVIEW: 'preview', DONE: 'done' };

export default function ImportCsvModal({ onImport, onClose, selectedYear, selectedTerm, selectedClassroom, existingStudents }) {
    const [mode, setMode] = useState(MODE.UPLOAD);
    const [parsed, setParsed] = useState(null);
    const [fileName, setFileName] = useState('');
    const [importYear, setImportYear] = useState(selectedYear);
    const [importTerm, setImportTerm] = useState(selectedTerm);
    const [importStats, setImportStats] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // ── File Processing ──────────────────────────────────────────────
    const processFile = useCallback((file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('Please upload a .csv file');
            return;
        }
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = parseImportCsv(e.target.result);
            // If the CSV contained year/term metadata, use them
            if (result.year) setImportYear(result.year);
            if (result.term) setImportTerm(result.term);
            setParsed(result);
            setMode(MODE.PREVIEW);
        };
        reader.readAsText(file);
    }, []);

    // ── Drag & Drop ──────────────────────────────────────────────────
    const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        processFile(file);
    };

    // ── Commit Import ────────────────────────────────────────────────
    const handleConfirmImport = () => {
        if (!parsed || parsed.students.length === 0) return;

        let updated = 0;
        let created = 0;

        const mergedStudents = parsed.students.map(csvStudent => {
            // Try to match by ID (Player #)
            const existing = existingStudents.find(
                s => String(s.id) === String(csvStudent.id)
            );

            if (existing) {
                // Update existing student's performance and matchStats for the selected year/term
                updated++;
                const updatedStudent = { ...existing };

                // Merge performance
                if (Object.keys(csvStudent.performance).length > 0) {
                    if (!updatedStudent.performance) updatedStudent.performance = {};
                    if (!updatedStudent.performance[importYear]) updatedStudent.performance[importYear] = {};
                    updatedStudent.performance[importYear][importTerm] = {
                        ...(updatedStudent.performance[importYear]?.[importTerm] || {}),
                        ...csvStudent.performance,
                    };
                }

                // Merge matchStats
                if (Object.keys(csvStudent.matchStats).length > 0) {
                    if (!updatedStudent.matchStats) updatedStudent.matchStats = {};
                    if (!updatedStudent.matchStats[importYear]) updatedStudent.matchStats[importYear] = {};
                    updatedStudent.matchStats[importYear][importTerm] = {
                        ...(updatedStudent.matchStats[importYear]?.[importTerm] || {}),
                        ...csvStudent.matchStats,
                    };
                }

                return updatedStudent;
            } else {
                // Create new student
                created++;
                return {
                    id: csvStudent.id,
                    name: csvStudent.name,
                    teamAssignments: { [importYear]: selectedClassroom },
                    performance: Object.keys(csvStudent.performance).length > 0
                        ? { [importYear]: { [importTerm]: csvStudent.performance } }
                        : {},
                    matchStats: Object.keys(csvStudent.matchStats).length > 0
                        ? { [importYear]: { [importTerm]: csvStudent.matchStats } }
                        : {},
                    extracurriculars: [],
                };
            }
        });

        setImportStats({ updated, created, total: mergedStudents.length });
        onImport(mergedStudents, parsed.subjects);
        setMode(MODE.DONE);
    };

    // ── Styles ───────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px',
    };

    const panelStyle = {
        background: 'var(--bg-card, rgba(15,23,42,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        width: '100%', maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
    };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={panelStyle} onClick={e => e.stopPropagation()}>

                {/* ── Header ──────────────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px' }}>
                            Import CSV Data
                        </h2>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {mode === MODE.UPLOAD && 'Upload a CSV file to import student data'}
                            {mode === MODE.PREVIEW && `Preview — ${fileName}`}
                            {mode === MODE.DONE && 'Import complete'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: '34px', height: '34px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '18px',
                    }}>×</button>
                </div>

                {/* ── Body ────────────────────────────────────────── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                    {/* ═══ UPLOAD MODE ═══ */}
                    {mode === MODE.UPLOAD && (
                        <div>
                            {/* Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${isDragOver ? 'var(--primary-light)' : 'rgba(255,255,255,0.12)'}`,
                                    borderRadius: '14px',
                                    padding: '48px 24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s',
                                    background: isDragOver ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)',
                                }}
                            >
                                <div style={{ color: isDragOver ? 'var(--primary-light)' : 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                    <UploadIcon />
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                                    Drop your CSV file here
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    or <span style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>click to browse</span>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    style={{ display: 'none' }}
                                    onChange={(e) => processFile(e.target.files?.[0])}
                                />
                            </div>

                            {/* Format Hint */}
                            <div style={{
                                marginTop: '24px', padding: '16px 20px',
                                background: 'rgba(37,99,235,0.06)',
                                border: '1px solid rgba(37,99,235,0.15)',
                                borderRadius: '12px',
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                                    Supported Formats
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                    <div style={{ marginBottom: '6px' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>Merit Grid Export</strong> — Re-import any CSV exported from this platform
                                    </div>
                                    <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Custom CSV</strong> — Headers: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Student Name, Math, Science, ..., Games Played %, Homework %</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ PREVIEW MODE ═══ */}
                    {mode === MODE.PREVIEW && parsed && (
                        <div>
                            {/* Errors / Warnings */}
                            {parsed.errors.length > 0 && (
                                <div style={{
                                    padding: '14px 18px', marginBottom: '20px',
                                    background: 'rgba(245,158,11,0.08)',
                                    border: '1px solid rgba(245,158,11,0.25)',
                                    borderRadius: '10px',
                                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                                }}>
                                    <div style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}><AlertIcon /></div>
                                    <div style={{ fontSize: '13px', color: '#fbbf24', lineHeight: '1.6' }}>
                                        {parsed.errors.map((err, i) => <div key={i}>{err}</div>)}
                                    </div>
                                </div>
                            )}

                            {/* Summary Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    { label: 'Players', value: parsed.students.length, color: '#60a5fa' },
                                    { label: 'Subjects', value: parsed.subjects.length, color: '#a78bfa' },
                                    { label: 'Matched', value: parsed.students.filter(s => existingStudents.some(e => e.name.toLowerCase() === s.name.toLowerCase())).length, color: '#34d399' },
                                ].map(stat => (
                                    <div key={stat.label} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: '10px', padding: '14px 16px', textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Target Year/Term selectors */}
                            <div style={{
                                display: 'flex', gap: '12px', marginBottom: '20px',
                                padding: '14px 18px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '10px',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Import into Year</div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{importYear}</div>
                                </div>
                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Import into Matchday</div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{importTerm}</div>
                                </div>
                            </div>

                            {/* Detected Subjects */}
                            {parsed.subjects.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Detected Stats</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {parsed.subjects.map(sub => (
                                            <span key={sub} style={{
                                                fontSize: '12px', fontWeight: '600',
                                                padding: '5px 12px', borderRadius: '8px',
                                                background: 'rgba(99,102,241,0.1)',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                                color: '#a5b4fc',
                                            }}>{sub}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Student Preview Table */}
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                                    Player Preview
                                </div>
                                <div style={{
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    overflow: 'hidden',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Name</th>
                                                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Stats</th>
                                                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Match Stats</th>
                                                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsed.students.map((s, i) => {
                                                const isExisting = existingStudents.some(e => e.name.toLowerCase() === s.name.toLowerCase());
                                                return (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>{s.name}</td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                            {Object.keys(s.performance).length}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                            {Object.keys(s.matchStats).length > 0 ? '✓' : '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                            <span style={{
                                                                fontSize: '11px', fontWeight: '700',
                                                                padding: '3px 10px', borderRadius: '6px',
                                                                background: isExisting ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                                                                color: isExisting ? '#93c5fd' : '#34d399',
                                                                border: `1px solid ${isExisting ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
                                                            }}>
                                                                {isExisting ? 'UPDATE' : 'NEW'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ DONE MODE ═══ */}
                    {mode === MODE.DONE && importStats && (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(16,185,129,0.12)',
                                border: '2px solid rgba(16,185,129,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', color: '#34d399',
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Import Successful</h3>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                <span style={{ color: '#34d399', fontWeight: '700' }}>{importStats.total}</span> players processed
                            </div>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
                                <div style={{ padding: '12px 20px', background: 'rgba(59,130,246,0.08)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa' }}>{importStats.updated}</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Updated</div>
                                </div>
                                <div style={{ padding: '12px 20px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>{importStats.created}</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────────────── */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'flex-end', gap: '10px',
                }}>
                    {mode === MODE.PREVIEW && (
                        <>
                            <button onClick={() => { setMode(MODE.UPLOAD); setParsed(null); setFileName(''); }} style={{
                                padding: '9px 18px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)',
                                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                            }}>Back</button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={!parsed || parsed.students.length === 0}
                                style={{
                                    padding: '9px 22px', borderRadius: '8px',
                                    background: parsed?.students.length > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                    boxShadow: parsed?.students.length > 0 ? '0 0 18px var(--primary-glow)' : 'none',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}
                            >
                                <CheckIcon /> Import {parsed?.students.length ?? 0} Players
                            </button>
                        </>
                    )}
                    {mode === MODE.DONE && (
                        <button onClick={onClose} style={{
                            padding: '9px 22px', borderRadius: '8px',
                            background: 'var(--primary)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            boxShadow: '0 0 18px var(--primary-glow)',
                        }}>Done</button>
                    )}
                </div>
            </div>
        </div>
    );
}
