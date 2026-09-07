import React, { useState, useEffect, useMemo } from 'react';

// Standard BFA / Concacaf Pre-Match Operational Protocol Milestones
export const DEFAULT_COUNTDOWN_PROTOCOL = [
    {
        id: 'cd-1',
        timeBefore: 'T-90 min',
        minutesBefore: 90,
        action: 'Team arrival, pitch inspection, and music choice',
        location: 'Stadium / Dressing Room',
        completed: false
    },
    {
        id: 'cd-2',
        timeBefore: 'T-75 min',
        minutesBefore: 75,
        action: 'Submit official team sheet to referee / opponents',
        location: 'Administration',
        completed: false
    },
    {
        id: 'cd-3',
        timeBefore: 'T-60 min',
        minutesBefore: 60,
        action: 'Warm-up begins (dynamic stretching and activation)',
        location: 'Pitch',
        completed: false
    },
    {
        id: 'cd-4',
        timeBefore: 'T-30 min',
        minutesBefore: 30,
        action: 'Tactical review, final lineup reminder, and hydration',
        location: 'Dressing Room',
        completed: false
    },
    {
        id: 'cd-5',
        timeBefore: 'T-15 min',
        minutesBefore: 15,
        action: 'Team leaves dressing room for final on-pitch warm-up',
        location: 'Tunnel / Pitch',
        completed: false
    },
    {
        id: 'cd-6',
        timeBefore: 'T-05 min',
        minutesBefore: 5,
        action: 'Final lineup check, gear check, and team huddle',
        location: 'Tunnel',
        completed: false
    },
    {
        id: 'cd-7',
        timeBefore: 'T-00 min',
        minutesBefore: 0,
        action: 'Kickoff',
        location: 'Pitch',
        completed: false
    }
];

export default function MatchdayCountdownSheetModal({
    match,
    onClose,
    onUpdateMatch,
    userRole = 'commissioner'
}) {
    // Determine storage key for persistence
    const storageKey = useMemo(() => {
        return match?.id ? `eduvision-countdown-${match.id}` : 'eduvision-countdown-default';
    }, [match?.id]);

    // Initialize milestones from match data, local storage, or default standard
    const [milestones, setMilestones] = useState(() => {
        if (Array.isArray(match?.countdownProtocol) && match.countdownProtocol.length > 0) {
            return match.countdownProtocol;
        }
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {
            // ignore
        }
        return DEFAULT_COUNTDOWN_PROTOCOL;
    });

    const [isEditing, setIsEditing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [diffMinutesRemaining, setDiffMinutesRemaining] = useState(null);
    const [newRow, setNewRow] = useState({ timeBefore: '', action: '', location: '' });
    const [showAddRow, setShowAddRow] = useState(false);
    const [saveNotice, setSaveNotice] = useState('');

    // Kickoff date resolution
    const kickoffDate = useMemo(() => {
        if (!match) return new Date();
        if (match.date) {
            const timeStr = match.time || '18:00';
            return new Date(`${match.date}T${timeStr}:00`);
        }
        const d = new Date();
        d.setHours(18, 0, 0, 0);
        return d;
    }, [match]);

    // Format target milestone clock time based on kickoff
    const formatTargetClockTime = (timeBeforeStr, minutesBefore) => {
        let mins = typeof minutesBefore === 'number' ? minutesBefore : null;
        if (mins === null && typeof timeBeforeStr === 'string') {
            const matchMins = timeBeforeStr.match(/\d+/);
            mins = matchMins ? parseInt(matchMins[0], 10) : 0;
        }
        if (mins === null) return '';

        const targetDate = new Date(kickoffDate.getTime() - (mins * 60 * 1000));
        return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Live T-minus clock calculation
    useEffect(() => {
        if (!match) return;

        const updateClock = () => {
            const now = new Date();
            const diffMs = kickoffDate - now;
            const totalSec = Math.floor(diffMs / 1000);
            const totalMins = Math.floor(totalSec / 60);
            setDiffMinutesRemaining(totalMins);

            if (diffMs <= 0) {
                const elapsedSec = Math.abs(totalSec);
                const hrs = Math.floor(elapsedSec / 3600);
                const mins = Math.floor((elapsedSec % 3600) / 60);
                const secs = elapsedSec % 60;
                setTimeRemaining(`T+${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} (IN PROGRESS)`);
            } else {
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const secs = totalSec % 60;
                setTimeRemaining(`T-${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            }
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, [match, kickoffDate]);

    // Persist milestones to match & localStorage
    const saveMilestones = (updatedList) => {
        setMilestones(updatedList);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedList));
        } catch {
            // ignore
        }

        if (onUpdateMatch && match) {
            const updatedMatch = {
                ...match,
                countdownProtocol: updatedList
            };
            onUpdateMatch(updatedMatch);
        }

        setSaveNotice('Protocol saved');
        setTimeout(() => setSaveNotice(''), 2000);
    };

    // Toggle Task Completed
    const toggleTaskCompleted = (id) => {
        const updated = milestones.map(m => {
            if (m.id === id) {
                return { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null };
            }
            return m;
        });
        saveMilestones(updated);
    };

    // Update specific field on a row
    const handleFieldChange = (id, field, value) => {
        const updated = milestones.map(m => {
            if (m.id === id) {
                const row = { ...m, [field]: value };
                if (field === 'timeBefore') {
                    const matchMins = value.match(/\d+/);
                    row.minutesBefore = matchMins ? parseInt(matchMins[0], 10) : 0;
                }
                return row;
            }
            return m;
        });
        saveMilestones(updated);
    };

    // Delete a milestone
    const handleDeleteRow = (id) => {
        const updated = milestones.filter(m => m.id !== id);
        saveMilestones(updated);
    };

    // Move row up or down
    const handleMoveRow = (index, direction) => {
        const newIdx = index + direction;
        if (newIdx < 0 || newIdx >= milestones.length) return;
        const updated = [...milestones];
        const temp = updated[index];
        updated[index] = updated[newIdx];
        updated[newIdx] = temp;
        saveMilestones(updated);
    };

    // Add new custom row
    const handleAddRow = (e) => {
        e?.preventDefault();
        if (!newRow.timeBefore.trim() || !newRow.action.trim()) return;

        const matchMins = newRow.timeBefore.match(/\d+/);
        const mins = matchMins ? parseInt(matchMins[0], 10) : 0;

        const created = {
            id: `cd-${Date.now()}`,
            timeBefore: newRow.timeBefore.trim().toUpperCase().startsWith('T-') ? newRow.timeBefore.trim() : `T-${newRow.timeBefore.trim()}`,
            minutesBefore: mins,
            action: newRow.action.trim(),
            location: newRow.location.trim() || 'Venue',
            completed: false
        };

        const updated = [...milestones, created];
        saveMilestones(updated);
        setNewRow({ timeBefore: '', action: '', location: '' });
        setShowAddRow(false);
    };

    // Reset to Standard Defaults
    const handleResetDefaults = () => {
        if (window.confirm('Reset this matchday countdown schedule to standard BFA / Concacaf defaults?')) {
            saveMilestones(DEFAULT_COUNTDOWN_PROTOCOL);
            setIsEditing(false);
        }
    };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };

    // Export PDF formatted download simulation
    const handleDownloadPDF = () => {
        const content = document.getElementById('printable-countdown-schedule');
        if (!content) return;

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html>
                <head>
                    <title>Countdown_Schedule_Match_${match?.id || 'Match'}.pdf</title>
                    <style>
                        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #000; background: #fff; }
                        h1, h2, h3, h4 { margin: 0 0 8px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                        th, td { border: 1px solid #94a3b8; padding: 10px 12px; font-size: 12px; text-align: left; }
                        th { background: #f1f5f9; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                        .no-print { display: none !important; }
                        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
                        .completed { text-decoration: line-through; color: #64748b; }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                </body>
            </html>
        `);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
            printWin.print();
        }, 300);
    };

    // Progress statistics
    const completedCount = milestones.filter(m => m.completed).length;
    const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

    const isOperator = userRole === 'commissioner' || userRole === 'admin' || userRole === 'referee' || userRole === 'statistician';

    if (!match) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10500,
            background: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto'
        }}>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-countdown-schedule, #printable-countdown-schedule * {
                        visibility: visible;
                    }
                    #printable-countdown-schedule {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 20px !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #64748b !important;
                        padding: 8px 10px !important;
                        color: #000000 !important;
                    }
                }
            `}</style>

            <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(37,99,235,0.2)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '1020px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: '#000000',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}>

                {/* Top Control Bar (Hidden on Print) */}
                <div className="no-print" style={{
                    padding: '14px 24px',
                    background: '#0f172a',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>⏱️</span>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                                    Official Matchday Countdown Sheet
                                </h3>
                                {saveNotice && (
                                    <span style={{
                                        fontSize: '11px',
                                        background: 'rgba(34,197,94,0.2)',
                                        border: '1px solid #22c55e',
                                        color: '#4ade80',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontWeight: '700'
                                    }}>
                                        ✓ {saveNotice}
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                Operational Matchday Timetable & Protocol Checklist
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Live Countdown Badge */}
                        <div style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: 'rgba(37,99,235,0.25)',
                            border: '1px solid rgba(37,99,235,0.5)',
                            color: '#60a5fa',
                            fontSize: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            ⏱️ {timeRemaining}
                        </div>

                        {/* Edit Mode Toggle for Operators */}
                        {isOperator && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    background: isEditing ? '#f59e0b' : 'rgba(255, 199, 38, 0.15)',
                                    color: isEditing ? '#000' : '#FFC726',
                                    border: isEditing ? '1px solid #d97706' : '1px solid rgba(255, 199, 38, 0.4)',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isEditing ? '✓ Done Editing' : '✏️ Edit Schedule'}
                            </button>
                        )}

                        {/* Reset Defaults */}
                        {isOperator && isEditing && (
                            <button
                                onClick={handleResetDefaults}
                                title="Reset to standard BFA 7-milestone protocol"
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                ↺ Reset Defaults
                            </button>
                        )}

                        {/* Print Button */}
                        <button
                            onClick={handlePrint}
                            style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: 'rgba(16,185,129,0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16,185,129,0.3)',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            🖨️ Print Sheet
                        </button>

                        {/* PDF Export Button */}
                        <button
                            onClick={handleDownloadPDF}
                            style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: 'rgba(37,99,235,0.15)',
                                color: '#60a5fa',
                                border: '1px solid rgba(37,99,235,0.3)',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            📥 Export PDF
                        </button>

                        {/* Close Modal */}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#cbd5e1',
                                fontSize: '20px',
                                cursor: 'pointer',
                                padding: '2px 6px'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Printable Document Container */}
                <div
                    id="printable-countdown-schedule"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                        background: '#ffffff',
                        color: '#000000'
                    }}
                >
                    {/* Header Document Banner */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #00267F 0%, #0d1526 100%)',
                        border: '1px solid #00267F',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#FFC726', letterSpacing: '1px' }}>
                                BARBADOS FOOTBALL ASSOCIATION • {match.ageGroup || 'PMC'} COMPETITION
                            </div>
                            <h1 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                                OFFICIAL MATCHDAY COUNTDOWN SHEET
                            </h1>
                            <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>
                                {match.homeTeam || 'Home Team'} vs {match.awayTeam || 'Away Team'} • Match ID: <strong>{match.id}</strong>
                            </div>
                        </div>

                        {/* Status & Kickoff Details */}
                        <div style={{
                            textAlign: 'right',
                            borderLeft: '2px solid rgba(255, 199, 38, 0.4)',
                            paddingLeft: '16px'
                        }}>
                            <div style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#dcfce7',
                                border: '1px solid #86efac',
                                color: '#166534',
                                fontSize: '11px',
                                fontWeight: '800',
                                display: 'inline-block'
                            }}>
                                {completedCount} / {milestones.length} COMPLETED ({progressPercent}%)
                            </div>
                            <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '4px' }}>
                                Scheduled Kickoff: <strong style={{ color: '#FFC726' }}>{match.time || '18:00'} AST</strong> ({match.date || 'Today'})
                            </div>
                        </div>
                    </div>

                    {/* Match Overview Ribbon */}
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        fontSize: '11.5px',
                        color: '#000'
                    }}>
                        <div>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Venue:</span><br />
                            <strong style={{ color: '#000000', fontSize: '12.5px' }}>{match.venue || 'Barbados National Stadium'}</strong>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Match Commissioner:</span><br />
                            <strong style={{ color: '#000000' }}>{match.commissioner || 'Sarah Rollins'}</strong>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Referee:</span><br />
                            <strong style={{ color: '#000000' }}>{match.referee || 'Adrian Hunte'}</strong>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Fourth Official:</span><br />
                            <strong style={{ color: '#000000' }}>{match.fourthOfficial || 'Marcus Yearwood'}</strong>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="no-print" style={{ width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${progressPercent}%`,
                            background: progressPercent === 100 ? '#10b981' : '#2563eb',
                            height: '100%',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>

                    {/* Protocol Schedule Table */}
                    <div style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff'
                    }}>
                        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', color: '#000000' }}>
                            <thead>
                                <tr style={{ background: '#00267F', color: '#ffffff', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '12px 14px', width: '190px' }}>Time Before Kickoff</th>
                                    <th style={{ padding: '12px 14px' }}>Action / Task</th>
                                    <th style={{ padding: '12px 14px', width: '220px' }}>Location / Focus</th>
                                    {isEditing && (
                                        <th className="no-print" style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {milestones.map((m, idx) => {
                                    const clockTime = formatTargetClockTime(m.timeBefore, m.minutesBefore);

                                    // Check if this is the active phase (within 15 mins of window)
                                    const isActiveMilestone = diffMinutesRemaining !== null &&
                                        typeof m.minutesBefore === 'number' &&
                                        !m.completed &&
                                        diffMinutesRemaining <= m.minutesBefore &&
                                        (idx === milestones.length - 1 || diffMinutesRemaining > (milestones[idx + 1]?.minutesBefore ?? -1));

                                    return (
                                        <tr
                                            key={m.id || idx}
                                            style={{
                                                borderBottom: '1px solid #e2e8f0',
                                                background: m.completed
                                                    ? '#f8fafc'
                                                    : isActiveMilestone
                                                    ? 'rgba(254, 243, 199, 0.7)'
                                                    : (idx % 2 === 0 ? '#ffffff' : '#fcfcfd'),
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            {/* Status / Checkbox */}
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleTaskCompleted(m.id)}
                                                    title={m.completed ? 'Mark pending' : 'Mark completed'}
                                                    style={{
                                                        background: m.completed ? '#10b981' : '#ffffff',
                                                        border: m.completed ? '2px solid #10b981' : '2px solid #94a3b8',
                                                        borderRadius: '6px',
                                                        width: '24px',
                                                        height: '24px',
                                                        color: '#ffffff',
                                                        fontSize: '13px',
                                                        fontWeight: '900',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {m.completed ? '✓' : ''}
                                                </button>
                                            </td>

                                            {/* Time Before Kickoff */}
                                            <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={m.timeBefore}
                                                        onChange={(e) => handleFieldChange(m.id, 'timeBefore', e.target.value)}
                                                        placeholder="e.g. T-90 min"
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #94a3b8',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            color: '#00267F'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <strong style={{
                                                                fontSize: '13px',
                                                                fontWeight: '800',
                                                                color: m.completed ? '#64748b' : '#00267F'
                                                            }}>
                                                                {m.timeBefore}
                                                            </strong>
                                                            {isActiveMilestone && (
                                                                <span style={{
                                                                    fontSize: '9.5px',
                                                                    fontWeight: '900',
                                                                    background: '#f59e0b',
                                                                    color: '#000',
                                                                    padding: '1px 6px',
                                                                    borderRadius: '4px',
                                                                    letterSpacing: '0.5px'
                                                                }}>
                                                                    CURRENT
                                                                </span>
                                                            )}
                                                        </div>
                                                        {clockTime && (
                                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                                                                ({clockTime})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Action / Task */}
                                            <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={m.action}
                                                        onChange={(e) => handleFieldChange(m.id, 'action', e.target.value)}
                                                        placeholder="Describe task or action..."
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #94a3b8',
                                                            fontSize: '12.5px',
                                                            color: '#0f172a'
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{
                                                        fontSize: '12.5px',
                                                        fontWeight: m.completed ? '500' : '600',
                                                        color: m.completed ? '#64748b' : '#0f172a',
                                                        textDecoration: m.completed ? 'line-through' : 'none'
                                                    }}>
                                                        {m.action}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Location / Focus */}
                                            <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={m.location}
                                                        onChange={(e) => handleFieldChange(m.id, 'location', e.target.value)}
                                                        placeholder="e.g. Stadium / Pitch"
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #94a3b8',
                                                            fontSize: '12px',
                                                            color: '#0f172a'
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{
                                                        fontSize: '11.5px',
                                                        fontWeight: '700',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        background: m.completed ? '#f1f5f9' : '#e0e7ff',
                                                        color: m.completed ? '#64748b' : '#3730a3',
                                                        display: 'inline-block'
                                                    }}>
                                                        📍 {m.location}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Reorder / Delete Actions in Edit Mode */}
                                            {isEditing && (
                                                <td className="no-print" style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            disabled={idx === 0}
                                                            onClick={() => handleMoveRow(idx, -1)}
                                                            title="Move Up"
                                                            style={{
                                                                background: '#f1f5f9',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: '4px',
                                                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                                opacity: idx === 0 ? 0.4 : 1,
                                                                padding: '2px 5px',
                                                                fontSize: '11px'
                                                            }}
                                                        >
                                                            ▲
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={idx === milestones.length - 1}
                                                            onClick={() => handleMoveRow(idx, 1)}
                                                            title="Move Down"
                                                            style={{
                                                                background: '#f1f5f9',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: '4px',
                                                                cursor: idx === milestones.length - 1 ? 'not-allowed' : 'pointer',
                                                                opacity: idx === milestones.length - 1 ? 0.4 : 1,
                                                                padding: '2px 5px',
                                                                fontSize: '11px'
                                                            }}
                                                        >
                                                            ▼
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRow(m.id)}
                                                            title="Delete Milestone"
                                                            style={{
                                                                background: '#fee2e2',
                                                                border: '1px solid #fca5a5',
                                                                borderRadius: '4px',
                                                                color: '#dc2626',
                                                                cursor: 'pointer',
                                                                padding: '2px 6px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Milestone Form for Match Operators */}
                    {isOperator && isEditing && (
                        <div className="no-print" style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px dashed #94a3b8'
                        }}>
                            {!showAddRow ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAddRow(true)}
                                    style={{
                                        background: '#00267F',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    ➕ Add Operational Milestone
                                </button>
                            ) : (
                                <form onSubmit={handleAddRow} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#00267F' }}>
                                        ➕ New Milestone Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1.5fr 1fr auto', gap: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="e.g. T-45 min"
                                            value={newRow.timeBefore}
                                            onChange={(e) => setNewRow({ ...newRow, timeBefore: e.target.value })}
                                            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Action / Task description..."
                                            value={newRow.action}
                                            onChange={(e) => setNewRow({ ...newRow, action: e.target.value })}
                                            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Location / Focus..."
                                            value={newRow.location}
                                            onChange={(e) => setNewRow({ ...newRow, location: e.target.value })}
                                            style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                type="submit"
                                                style={{
                                                    background: '#10b981',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '7px 14px',
                                                    borderRadius: '6px',
                                                    fontWeight: '800',
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddRow(false)}
                                                style={{
                                                    background: '#e2e8f0',
                                                    color: '#334155',
                                                    border: 'none',
                                                    padding: '7px 10px',
                                                    borderRadius: '6px',
                                                    fontWeight: '700',
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Official Sign-off Box (Included in Print & PDF) */}
                    <div style={{
                        marginTop: '6px',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '20px',
                        fontSize: '11px',
                        color: '#000000'
                    }}>
                        <div>
                            <div>Match Commissioner Sign-Off:</div>
                            <div style={{ borderBottom: '1px solid #000000', height: '24px', marginTop: '10px' }}></div>
                            <div style={{ marginTop: '4px', fontWeight: '700' }}>{match.commissioner || 'Sarah Rollins'}</div>
                        </div>
                        <div>
                            <div>Referee Sign-Off:</div>
                            <div style={{ borderBottom: '1px solid #000000', height: '24px', marginTop: '10px' }}></div>
                            <div style={{ marginTop: '4px', fontWeight: '700' }}>{match.referee || 'Adrian Hunte'}</div>
                        </div>
                        <div>
                            <div>Venue Coordinator Sign-Off:</div>
                            <div style={{ borderBottom: '1px solid #000000', height: '24px', marginTop: '10px' }}></div>
                            <div style={{ marginTop: '4px', fontWeight: '700' }}>{match.fourthOfficial || 'Marcus Yearwood'}</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
