import { useState, useRef } from 'react';
import { parsePlayerRosterCsv, downloadPlayerCsvTemplate } from '../utils/playerCsvImport';

export default function UploadPlayerRosterModal({
    isOpen,
    onClose,
    onImportPlayers,
    existingPlayers = [],
    targetSchoolId,
    targetTeamId,
    targetYear = '2026-2027',
    teamName = 'Team Roster',
    isPmc = true
}) {
    const [file, setFile] = useState(null);
    const [csvText, setCsvText] = useState('');
    const [parseResult, setParseResult] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (selectedFile) => {
        if (!selectedFile) return;
        if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
            setError('Please select a valid .csv file.');
            return;
        }
        setError('');
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            setCsvText(content);
            const result = parsePlayerRosterCsv(content, {
                existingPlayers,
                targetSchoolId,
                targetTeamId,
                targetYear,
                isPmc
            });
            setParseResult(result);
        };
        reader.onerror = () => {
            setError('Failed to read the selected CSV file.');
        };
        reader.readAsText(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleConfirmImport = () => {
        if (!parseResult || !parseResult.validPlayers || parseResult.validPlayers.length === 0) {
            setError('No valid player rows to import.');
            return;
        }

        setIsSubmitting(true);
        try {
            onImportPlayers(parseResult.validPlayers);
            setIsSubmitting(false);
            onClose();
        } catch (err) {
            setIsSubmitting(false);
            setError('Error saving imported players: ' + err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div className="glass-panel" style={{
                width: '780px', maxWidth: '95vw', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', gap: '18px',
                padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-xl)',
                background: 'var(--bg-card, rgba(15,23,42,0.96))', border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '14px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📥</span> Bulk Player Registration via CSV
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            Register team players with unique permanent Player IDs, kit numbers, and roster assignments.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: 'none',
                            color: 'var(--text-secondary)', width: '32px', height: '32px',
                            borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Template Download & Instructions Strip */}
                <div style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                }}>
                    <div style={{ fontSize: '12px', color: '#c7d2fe' }}>
                        Required columns: <strong>First Name</strong>, <strong>Last Name</strong>, <strong>Squad Number</strong>, <strong>Age</strong>, <strong>Gender</strong>, <strong>Position</strong>
                    </div>
                    <button
                        type="button"
                        onClick={() => downloadPlayerCsvTemplate(teamName)}
                        style={{
                            padding: '6px 14px', borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #818cf8',
                            color: '#ffffff', fontSize: '11.5px', fontWeight: '700',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <span>📄</span> Download CSV Template
                    </button>
                </div>

                {/* Drag and Drop Box */}
                {!parseResult && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${isDragOver ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                            borderRadius: '14px', padding: '40px 20px', textAlign: 'center',
                            background: isDragOver ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileChange(e.target.files?.[0])}
                        />
                        <div style={{ fontSize: '36px' }}>📁</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            Click to upload or drag &amp; drop your CSV file
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Accepts .csv format containing player rosters
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171', fontSize: '12px', fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Parsed Preview Table */}
                {parseResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
                        {/* Summary & Kit Clash Warnings */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                                    ✓ {parseResult.validPlayers.length} Players Validated
                                </span>
                                {parseResult.clashes.length > 0 ? (
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)' }}>
                                        ⚠️ {parseResult.clashes.length} Kit Number Warning(s)
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                        ✓ 0 Kit Clashes
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setParseResult(null);
                                    setFile(null);
                                }}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer'
                                }}
                            >
                                Change CSV File
                            </button>
                        </div>

                        {/* Clashes Details */}
                        {parseResult.clashes.length > 0 && (
                            <div style={{
                                padding: '8px 12px', borderRadius: '8px',
                                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                                maxHeight: '60px', overflowY: 'auto', fontSize: '11px', color: '#fbbf24'
                            }}>
                                {parseResult.clashes.map((c, idx) => (
                                    <div key={idx}>• {c.playerName}: {c.reason}</div>
                                ))}
                            </div>
                        )}

                        {/* Scrollable Table */}
                        <div style={{
                            flex: 1, minHeight: '180px', maxHeight: '320px',
                            overflowY: 'auto', border: 'var(--border)', borderRadius: '10px',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: 'var(--border)', position: 'sticky', top: 0, zIndex: 2 }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Kit #</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Unique Player ID</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Full Name</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Position</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Age / Gender</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>Registration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parseResult.validPlayers.map((p, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px 12px', fontWeight: '800', color: '#ffffff' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '26px', height: '26px', borderRadius: '50%',
                                                    background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)',
                                                    color: '#93c5fd', fontSize: '11px', fontWeight: '900'
                                                }}>
                                                    #{p.jerseyNumber}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: '800', color: '#a5b4fc' }}>
                                                {p.playerId}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                                {p.name}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                                {p.position}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                                {p.age} yrs • {p.gender}
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '9.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px',
                                                    background: 'rgba(16,185,129,0.15)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.3)'
                                                }}>
                                                    ✓ CERTIFIED
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: 'var(--border)', paddingTop: '14px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '9px 18px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    {parseResult && parseResult.validPlayers.length > 0 && (
                        <button
                            type="button"
                            onClick={handleConfirmImport}
                            disabled={isSubmitting}
                            style={{
                                padding: '9px 24px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#ffffff', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(16,185,129,0.35)', transition: 'all 0.15s ease'
                            }}
                        >
                            {isSubmitting ? 'Registering...' : `✓ Confirm & Register ${parseResult.validPlayers.length} Players`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
