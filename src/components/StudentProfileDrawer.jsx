import { analyzeStudent } from '../utils/analysis';
import { YEARS, TERMS, SUBJECTS, TEAMS, SCHOOLS } from '../data/mockData';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ParentReportModal from './ParentReportModal';
import CustomSelect from './CustomSelect';
import PercentilePizzaChart from './PercentilePizzaChart';

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function getInitials(name) {
    if (!name || typeof name !== 'string') return 'PL';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PL';
    return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PL';
}

function Card({ title, children, style, headerExtra }) {
    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', ...style }}>
            <div style={{ padding: '16px 20px', borderBottom: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
                {headerExtra}
            </div>
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    );
}

// ── Contact Modal & Toast ──────────────────────────────────────────────
function ContactModal({ student, onClose, onSend }) {
    const [method, setMethod] = useState('Email');
    const [msg, setMsg] = useState('');
    const guardianSurname = (student?.name || '').split(' ').slice(1).join(' ') || student?.name || 'Guardian';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', width: '400px',
                boxShadow: 'var(--shadow-lg)', border: 'var(--border)'
            }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Contact Parent / Guardian</h2>
                
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>To:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '20px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>G</div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Guardian ({guardianSurname})</span>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Contact Method</label>
                    <CustomSelect 
                        value={method} onChange={e => setMethod(e.target.value)}
                        options={['Email', 'SMS', 'Phone Call']}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <textarea 
                        value={msg} onChange={e => setMsg(e.target.value)}
                        placeholder="Type your message here..."
                        style={{ width: '100%', height: '100px', padding: '12px 14px', borderRadius: '8px', border: 'var(--border)', background: 'var(--bg-input)', fontSize: '14px', color: 'var(--text-primary)', resize: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => onSend(method, msg)} style={{ padding: '8px 24px', background: 'var(--primary)', color: '#fff', borderRadius: '20px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>Send Message</button>
                </div>
            </div>
        </div>
    );
}

function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div style={{
            position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
            background: 'var(--bg-surface)', border: 'var(--border)', boxShadow: 'var(--shadow-lg)',
            padding: '12px 24px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'fadeSlideUp 0.3s ease'
        }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>✓</div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{message}</span>
        </div>
    );
}

function formatStatValue(sub, val) {
    if (val === undefined || val === null) return '--';
    if (sub.includes('Accuracy') || sub.includes('Completion') || sub === 'Pass Completed') {
        return `${val}%`;
    }
    return val;
}

// ── Main Component ────────────────────────────────────────────────
export default function StudentProfileDrawer({ student, subjects, onClose, settings = {}, onTransferStudent, selectedYear, allSquadStudents = [] }) {
    const [showContactModal, setShowContactModal] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [teacherNotes, setTeacherNotes] = useState(`${student?.name} is showing consistent improvement in match performance...`);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shots'
    const [shotFilter, setShotFilter] = useState('all'); // 'all' | 'year|term'

    if (!student) return null;

    const failGrade = settings.failingGrade ?? 50;
    const excellentGrade = settings.excellentGrade ?? 90;

    const handleSendMessage = (method, msg) => {
        setShowContactModal(false);
        const guardianSurname = (student?.name || '').split(' ').slice(1).join(' ') || student?.name || 'Guardian';
        setTimeout(() => {
            setToastMessage(`Message sent to Guardian (${guardianSurname})`);
        }, 500);
    };

    // Best subjects across all terms
    const latestYear = selectedYear || YEARS[YEARS.length - 1];
    const avgPerSubject = {};
    const safeSubjects = Array.isArray(subjects) && subjects.length ? subjects : SUBJECTS;
    safeSubjects.forEach(sub => {
        const vals = TERMS.map(t => student.performance?.[latestYear]?.[t]?.[sub]).filter(v => v !== undefined);
        if (vals.length) avgPerSubject[sub] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    });

    const sortedSubjects = Object.entries(avgPerSubject).sort((a, b) => b[1] - a[1]);
    const overallAvg = sortedSubjects.length
        ? (sortedSubjects.reduce((s, [, v]) => s + v, 0) / sortedSubjects.length)
        : null;

    const studentClass = TEAMS.find(c => c.id === student?.teamAssignments?.[latestYear]);
    
    // Determine standing based on overallAvg

    // Mock chart data points
    const chartPoints = TERMS.map((t, i) => {
        const vals = Object.values(student.performance?.[latestYear]?.[t] || {});
        if (!vals.length) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    });

    // Generate Year-Term filter options dynamically based on student data
    const filterOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Time' }];
        if (!student.performance) return options;
        Object.keys(student.performance).forEach(yr => {
            Object.keys(student.performance[yr]).forEach(t => {
                options.push({ value: `${yr}|${t}`, label: `${yr} - ${t}` });
            });
        });
        return options;
    }, [student]);

    // Filter shot logs based on selection
    const filteredShots = useMemo(() => {
        const logs = student.shotLogs || [];
        if (shotFilter === 'all') return logs;
        const [yr, tr] = shotFilter.split('|');
        return logs.filter(l => l.year === yr && l.term === tr);
    }, [student, shotFilter]);

    // Compute shot statistics for filtered logs
    const shotStats = useMemo(() => {
        const total = filteredShots.length;
        const goals = filteredShots.filter(l => l.result === 'goal').length;
        const saved = filteredShots.filter(l => l.result === 'saved').length;
        const missed = filteredShots.filter(l => l.result === 'miss').length;
        
        const onTarget = goals + saved;
        const accuracy = total > 0 ? Math.round((onTarget / total) * 100) : 0;
        const conversion = total > 0 ? Math.round((goals / total) * 100) : 0;

        // Zones: Left (x < 40), Center (x >= 40 && x <= 60), Right (x > 60)
        const leftShots = filteredShots.filter(l => l.x < 40);
        const centerShots = filteredShots.filter(l => l.x >= 40 && l.x <= 60);
        const rightShots = filteredShots.filter(l => l.x > 60);

        const leftCount = leftShots.length;
        const centerCount = centerShots.length;
        const rightCount = rightShots.length;

        const leftPct = total > 0 ? Math.round((leftCount / total) * 100) : 0;
        const centerPct = total > 0 ? Math.round((centerCount / total) * 100) : 0;
        const rightPct = total > 0 ? Math.round((rightCount / total) * 100) : 0;

        const leftGoals = leftShots.filter(l => l.result === 'goal').length;
        const centerGoals = centerShots.filter(l => l.result === 'goal').length;
        const rightGoals = rightShots.filter(l => l.result === 'goal').length;

        const leftConv = leftCount > 0 ? Math.round((leftGoals / leftCount) * 100) : 0;
        const centerConv = centerCount > 0 ? Math.round((centerGoals / centerCount) * 100) : 0;
        const rightConv = rightCount > 0 ? Math.round((rightGoals / rightCount) * 100) : 0;

        return {
            total, goals, saved, missed, accuracy, conversion,
            zones: {
                left: { count: leftCount, pct: leftPct, conv: leftConv, goals: leftGoals },
                center: { count: centerCount, pct: centerPct, conv: centerConv, goals: centerGoals },
                right: { count: rightCount, pct: rightPct, conv: rightConv, goals: rightGoals }
            }
        };
    }, [filteredShots]);

    // Generate dynamic shot insight
    const shotInsight = useMemo(() => {
        const { total, zones } = shotStats;
        if (total === 0) return "No shot logs recorded for this player in the selected time period.";

        const { left, center, right } = zones;
        
        let dominantZone = 'left';
        let dominantPct = left.pct;
        if (center.pct > dominantPct) {
            dominantZone = 'center';
            dominantPct = center.pct;
        }
        if (right.pct > dominantPct) {
            dominantZone = 'right';
            dominantPct = right.pct;
        }

        let zoneText = '';
        if (dominantZone === 'left') {
            zoneText = `takes a clear majority of their shots on the left side (${left.pct}%)`;
        } else if (dominantZone === 'right') {
            zoneText = `favors attacking the right side of the goal mouth (${right.pct}%)`;
        } else {
            zoneText = `takes mostly central shots (${center.pct}%)`;
        }

        let efficiencyText = '';
        const dominantStats = zones[dominantZone];
        if (dominantStats.conv > 40) {
            efficiencyText = `showing lethal accuracy from that sector with a ${dominantStats.conv}% conversion rate. Opposing keepers struggle to cover this angle.`;
        } else if (dominantStats.conv < 20) {
            efficiencyText = `but converts only ${dominantStats.conv}% of them. Developing shot variety or shifting closer to the corners would improve their goal output.`;
        } else {
            efficiencyText = `converting at a moderate ${dominantStats.conv}% rate. They show decent consistency but could benefit from targeting the corners more frequently.`;
        }

        return `${student.name} ${zoneText}, ${efficiencyText}`;
    }, [shotStats, student]);

    const isGk = student.position === 'Goalkeeper';

    // Filter save logs based on selection for GK
    const filteredSaves = useMemo(() => {
        const logs = student.saveLogs || [];
        if (shotFilter === 'all') return logs;
        const [yr, tr] = shotFilter.split('|');
        return logs.filter(l => l.year === yr && l.term === tr);
    }, [student, shotFilter]);

    // Compute save statistics for filtered logs
    const saveStats = useMemo(() => {
        const total = filteredSaves.length;
        const saves = filteredSaves.filter(l => l.result === 'save').length;
        const conceded = filteredSaves.filter(l => l.result === 'goal_conceded').length;
        
        const savePct = total > 0 ? Math.round((saves / total) * 100) : 0;

        // Zones: Left (x < 40), Center (x >= 40 && x <= 60), Right (x > 60)
        const leftSaves = filteredSaves.filter(l => l.x < 40);
        const centerSaves = filteredSaves.filter(l => l.x >= 40 && l.x <= 60);
        const rightSaves = filteredSaves.filter(l => l.x > 60);

        const leftCount = leftSaves.length;
        const centerCount = centerSaves.length;
        const rightCount = rightSaves.length;

        const leftPct = total > 0 ? Math.round((leftCount / total) * 100) : 0;
        const centerPct = total > 0 ? Math.round((centerCount / total) * 100) : 0;
        const rightPct = total > 0 ? Math.round((rightCount / total) * 100) : 0;

        const leftMade = leftSaves.filter(l => l.result === 'save').length;
        const centerMade = centerSaves.filter(l => l.result === 'save').length;
        const rightMade = rightSaves.filter(l => l.result === 'save').length;

        const leftSaveRate = leftCount > 0 ? Math.round((leftMade / leftCount) * 100) : 0;
        const centerSaveRate = centerCount > 0 ? Math.round((centerMade / centerCount) * 100) : 0;
        const rightSaveRate = rightCount > 0 ? Math.round((rightMade / rightCount) * 100) : 0;

        return {
            total, saves, conceded, savePct,
            zones: {
                left: { count: leftCount, pct: leftPct, saveRate: leftSaveRate, saves: leftMade },
                center: { count: centerCount, pct: centerPct, saveRate: centerSaveRate, saves: centerMade },
                right: { count: rightCount, pct: rightPct, saveRate: rightSaveRate, saves: rightMade }
            }
        };
    }, [filteredSaves]);

    // Generate dynamic save insight
    const saveInsight = useMemo(() => {
        const { total, savePct, zones } = saveStats;
        if (total === 0) return "No save logs recorded for this goalkeeper in the selected time period.";

        const { left, center, right } = zones;
        let bestZone = 'center';
        let bestRate = center.saveRate;
        if (left.saveRate > bestRate) { bestZone = 'left'; bestRate = left.saveRate; }
        if (right.saveRate > bestRate) { bestZone = 'right'; bestRate = right.saveRate; }

        return `${student.name} holds a ${savePct}% overall save rate. Highest stopping efficiency is on the ${bestZone} side of the goal with a ${bestRate}% save rate across all recorded shot events.`;
    }, [saveStats, student]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'var(--bg-panel)', backdropFilter: 'blur(24px)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            animation: 'fadeIn 0.2s ease',
        }}>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {showContactModal && <ContactModal student={student} onClose={() => setShowContactModal(false)} onSend={handleSendMessage} />}

            {/* Header */}
            <div style={{ padding: '40px 60px 20px', flexShrink: 0, position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '40px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <CloseIcon />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-glow-sm)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', border: 'var(--border)' }}>
                        {getInitials(student.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {student.name}
                            <span style={{
                                fontSize: '16px',
                                fontWeight: '800',
                                padding: '4px 10px',
                                borderRadius: '99px',
                                background: 'rgba(37,99,235,0.15)',
                                color: 'var(--primary-light)',
                                border: '1px solid rgba(37,99,235,0.25)'
                            }}>
                                #{student.jerseyNumber || '--'}
                            </span>
                        </h1>
                        <p style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {studentClass ? `${studentClass.name} Squad` : 'No Squad Assigned'}
                        </p>

                    </div>

                    {/* Tab Navigation Segment Control */}
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px', marginRight: '60px', border: 'var(--border)' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                                background: activeTab === 'overview' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.2s', border: 'none', outline: 'none'
                            }}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('shots')}
                            style={{
                                padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                                background: activeTab === 'shots' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                color: activeTab === 'shots' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.2s', border: 'none', outline: 'none'
                            }}
                        >
                            {isGk ? 'Save Analytics' : 'Shot Analytics'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div style={{ 
                padding: '0 60px 60px', 
                flex: 1, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gridTemplateRows: activeTab === 'overview' ? 'auto' : 'auto auto',
                gap: '24px' 
            }}>
                {activeTab === 'overview' ? (
                    <>
                        {/* Row 1: Pizza Chart + Stat Breakdown side by side */}
                        <Card title="Percentile Rank" style={{ gridColumn: 'span 2', minHeight: '520px' }}>
                            <PercentilePizzaChart student={student} year={latestYear} squadStudents={allSquadStudents} />
                        </Card>

                        <Card title="Stat Breakdown" style={{ gridColumn: 'span 1' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: 'var(--border)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>
                                        <th style={{ padding: '0 0 8px 0', fontWeight: '600' }}>Stat</th>
                                        <th style={{ padding: '0 0 8px 0', fontWeight: '600', textAlign: 'center' }}>Value</th>
                                        <th style={{ padding: '0 0 8px 0', fontWeight: '600', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedSubjects.map(([sub, grade]) => {
                                        const isExcellent = grade >= excellentGrade;
                                        const isFail = grade < failGrade;
                                        return (
                                            <tr key={sub} style={{ borderBottom: 'var(--border)' }}>
                                                <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{sub}</td>
                                                <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'center' }}>{formatStatValue(sub, grade)}</td>
                                                <td style={{ padding: '12px 0', textAlign: 'center' }}>
                                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isFail ? 'var(--danger)' : isExcellent ? 'var(--success)' : 'var(--warning)' }} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    </>
                ) : isGk ? (
                    <>
                        {/* Goalkeeper Save Map (spans 2 cols) */}
                        <Card 
                            title="Interactive Save Map" 
                            style={{ gridColumn: 'span 2', minHeight: '380px' }}
                            headerExtra={
                                <CustomSelect 
                                    value={shotFilter} 
                                    onChange={e => setShotFilter(e.target.value)}
                                    options={filterOptions}
                                    selectStyle={{
                                        padding: '5px 24px 5px 10px', borderRadius: '8px', border: 'var(--border)',
                                        fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', background: 'var(--bg-surface)',
                                        cursor: 'pointer', outline: 'none'
                                    }}
                                />
                            }
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Goal Frame Area */}
                                <div style={{
                                    width: '100%', height: '240px',
                                    background: '#090d16',
                                    border: 'var(--border-lg)',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
                                }}>
                                    {/* Goalposts Structure */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '10%', right: '10%',
                                        top: '20%', bottom: '5%',
                                        border: '5px solid #ffffff',
                                        borderBottom: 'none',
                                        background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px), 
                                                     repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px)`,
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)' }} />
                                    </div>

                                    {/* Ground Line */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0, right: 0,
                                        bottom: 0, height: '5%',
                                        background: '#14532d',
                                        borderTop: '2px solid #166534',
                                    }} />

                                    {/* Plot Save Dots */}
                                    {filteredSaves.map(save => {
                                        const isSaved = save.result === 'save';
                                        const color = isSaved ? 'var(--success)' : 'var(--danger)';
                                        const label = isSaved ? 'Save Made' : 'Goal Conceded';
                                        
                                        const formatType = (type) => {
                                            if (!type || type === 'normal') return 'Open Play';
                                            if (type === '1v1') return '1v1 Breakaway';
                                            if (type === 'freekick') return 'Free Kick';
                                            if (type === 'penalty') return 'Penalty Kick';
                                            return type.charAt(0).toUpperCase() + type.slice(1);
                                        };
                                        const typeLabel = formatType(save.saveType);

                                        return (
                                            <div
                                                key={save.id}
                                                title={`${typeLabel} ${label} (${save.year} · ${save.term})`}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${save.x}%`,
                                                    top: `${save.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '10px', height: '10px',
                                                    borderRadius: '50%',
                                                    background: color,
                                                    border: '1.5px solid #ffffff',
                                                    boxShadow: `0 0 6px ${color}, 0 1px 2px rgba(0,0,0,0.5)`,
                                                    cursor: 'help',
                                                    zIndex: 10
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Map Legend */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                                        Saves Made ({saveStats.saves})
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }}></span>
                                        Goals Conceded ({saveStats.conceded})
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Save Statistics Card (spans 1 col) */}
                        <Card title="Goalkeeping Statistics" style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Big Numbers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: 'var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Save %</div>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', marginTop: '4px' }}>{saveStats.savePct}%</div>
                                    </div>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: 'var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Saves</div>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{saveStats.saves}</div>
                                    </div>
                                </div>
                                
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: 'var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', paddingBottom: '6px', borderBottom: 'var(--border)' }}>
                                        <span>Shots Faced:</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{saveStats.total}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', paddingTop: '6px' }}>
                                        <span>Goals Conceded:</span>
                                        <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{saveStats.conceded}</span>
                                    </div>
                                </div>

                                {/* Text Insight */}
                                <div style={{ 
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.03))',
                                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                                    borderRadius: '10px', padding: '14px', marginTop: '4px'
                                }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        🧤 Save Pattern Insight
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: '#a7f3d0', fontWeight: '500' }}>
                                        {saveInsight}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Zone Save Analysis Card (spans 2 cols) */}
                        <Card title="Zone Volume & Save % Analysis" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {/* Left Zone */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Left Zone</h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {saveStats.zones.left.count} shots
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Volume Share:</span>
                                        <span style={{ fontWeight: '700' }}>{saveStats.zones.left.pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{ width: `${saveStats.zones.left.pct}%`, height: '100%', background: '#34d399', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>
                                        <span>Save Rate:</span>
                                        <span>{saveStats.zones.left.saveRate}%</span>
                                    </div>
                                </div>

                                {/* Center Zone */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Center Zone</h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {saveStats.zones.center.count} shots
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Volume Share:</span>
                                        <span style={{ fontWeight: '700' }}>{saveStats.zones.center.pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{ width: `${saveStats.zones.center.pct}%`, height: '100%', background: '#34d399', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>
                                        <span>Save Rate:</span>
                                        <span>{saveStats.zones.center.saveRate}%</span>
                                    </div>
                                </div>

                                {/* Right Zone */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Right Zone</h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {saveStats.zones.right.count} shots
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Volume Share:</span>
                                        <span style={{ fontWeight: '700' }}>{saveStats.zones.right.pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{ width: `${saveStats.zones.right.pct}%`, height: '100%', background: '#34d399', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>
                                        <span>Save Rate:</span>
                                        <span>{saveStats.zones.right.saveRate}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Save Scenario Analysis Card (spans 1 col) */}
                        <Card title="Save Scenario Analysis" style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[
                                    { key: 'normal', label: '⚽ Open Play Shots', color: '#60a5fa' },
                                    { key: '1v1', label: '👟 1v1 Breakaways', color: '#f59e0b' },
                                    { key: 'freekick', label: '🎯 Free Kicks', color: '#10b981' },
                                    { key: 'penalty', label: '🥅 Penalties', color: '#ec4899' }
                                ].map(type => {
                                    const typeSaves = filteredSaves.filter(s => (s.saveType || 'normal') === type.key);
                                    const total = typeSaves.length;
                                    const savesMade = typeSaves.filter(s => s.result === 'save').length;
                                    const sRate = total > 0 ? Math.round((savesMade / total) * 100) : 0;
                                    const pct = saveStats.total > 0 ? Math.round((total / saveStats.total) * 100) : 0;

                                    return (
                                        <div key={type.key} style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{type.label}</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                    {total} event{total !== 1 ? 's' : ''} ({pct}%)
                                                </span>
                                            </div>
                                            
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: type.color, borderRadius: '2px' }} />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Saves: {savesMade}</span>
                                                <span style={{ color: sRate > 50 ? 'var(--success)' : 'var(--text-muted)' }}>Save Rate: {sRate}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </>
                ) : (
                    <>
                        {/* Shot Map (spans 2 cols) */}
                        <Card 
                            title="Interactive Shot Map" 
                            style={{ gridColumn: 'span 2', minHeight: '380px' }}
                            headerExtra={
                                <CustomSelect 
                                    value={shotFilter} 
                                    onChange={e => setShotFilter(e.target.value)}
                                    options={filterOptions}
                                    selectStyle={{
                                        padding: '5px 24px 5px 10px', borderRadius: '8px', border: 'var(--border)',
                                        fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', background: 'var(--bg-surface)',
                                        cursor: 'pointer', outline: 'none'
                                    }}
                                />
                            }
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Clickable Goal Overlay Area */}
                                <div style={{
                                    width: '100%', height: '240px',
                                    background: '#090d16',
                                    border: 'var(--border-lg)',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
                                }}>
                                    {/* Goalposts Structure (Goalmouth) */}
                                    {/* Spans from X: 10% to 90%, Y: 20% to 95% */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '10%', right: '10%',
                                        top: '20%', bottom: '5%',
                                        border: '5px solid #ffffff',
                                        borderBottom: 'none',
                                        // Net pattern using CSS grid mesh
                                        background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px), 
                                                     repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px)`,
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)' }} />
                                    </div>

                                    {/* Ground Line */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0, right: 0,
                                        bottom: 0, height: '5%',
                                        background: '#14532d',
                                        borderTop: '2px solid #166534',
                                    }} />

                                    {/* Plot Shot Dots */}
                                    {filteredShots.map(shot => {
                                        const color = shot.result === 'goal' ? 'var(--success)' : shot.result === 'saved' ? 'var(--primary-light)' : 'var(--danger)';
                                        const label = shot.result === 'goal' ? 'Goal' : shot.result === 'saved' ? 'Goalkeeper Save' : 'Off Target';
                                        
                                        const formatType = (type) => {
                                            if (!type) return 'Foot';
                                            if (type === 'freekick') return 'Free Kick';
                                            if (type === 'own-goal') return 'Own Goal';
                                            return type.charAt(0).toUpperCase() + type.slice(1);
                                        };
                                        const typeLabel = formatType(shot.goalType);

                                        return (
                                            <div
                                                key={shot.id}
                                                title={`${typeLabel} ${label} (${shot.year} · ${shot.term})`}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${shot.x}%`,
                                                    top: `${shot.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '10px', height: '10px',
                                                    borderRadius: '50%',
                                                    background: color,
                                                    border: '1.5px solid #ffffff',
                                                    boxShadow: `0 0 6px ${color}, 0 1px 2px rgba(0,0,0,0.5)`,
                                                    cursor: 'help',
                                                    zIndex: 10
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Map Legend */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                                        Goal ({shotStats.goals})
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-light)', display: 'inline-block' }}></span>
                                        Saved ({shotStats.saved})
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }}></span>
                                        Off Target ({shotStats.missed})
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Shot Stats & Insights Card (spans 1 col) */}
                        <Card title="Shot Statistics" style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Big Numbers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: 'var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accuracy</div>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{shotStats.accuracy}%</div>
                                    </div>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: 'var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Conversion</div>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', marginTop: '4px' }}>{shotStats.conversion}%</div>
                                    </div>
                                </div>
                                
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: 'var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', paddingBottom: '6px', borderBottom: 'var(--border)' }}>
                                        <span>Total Shots:</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{shotStats.total}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', paddingTop: '6px' }}>
                                        <span>Shots on Target:</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{shotStats.goals + shotStats.saved}</span>
                                    </div>
                                </div>

                                {/* Text Insight */}
                                <div style={{ 
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.03))',
                                    border: '1px dashed rgba(99, 102, 241, 0.3)',
                                    borderRadius: '10px', padding: '14px', marginTop: '4px'
                                }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        ⚽ Shot Pattern Insight
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: '#c7d2fe', fontWeight: '500' }}>
                                        {shotInsight}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Zone Analysis Card (spans 2 cols) */}
                        <Card title="Zone Volume & Conversion Analysis" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {/* Left Zone */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Left Zone</h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {shotStats.zones.left.count} shots
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Volume Share:</span>
                                        <span style={{ fontWeight: '700' }}>{shotStats.zones.left.pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{ width: `${shotStats.zones.left.pct}%`, height: '100%', background: 'var(--primary-light)', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>
                                        <span>Conversion Rate:</span>
                                        <span>{shotStats.zones.left.conv}%</span>
                                    </div>
                                </div>

                                {/* Center Zone */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Center Zone</h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {shotStats.zones.center.count} shots
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Volume Share:</span>
                                        <span style={{ fontWeight: '700' }}>{shotStats.zones.center.pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{ width: `${shotStats.zones.center.pct}%`, height: '100%', background: 'var(--primary-light)', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>
                                        <span>Conversion Rate:</span>
                                        <span>{shotStats.zones.center.conv}%</span>
                                    </div>
                                </div>

                                {/* Right Zone */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Right Zone</h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {shotStats.zones.right.count} shots
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Volume Share:</span>
                                        <span style={{ fontWeight: '700' }}>{shotStats.zones.right.pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{ width: `${shotStats.zones.right.pct}%`, height: '100%', background: 'var(--primary-light)', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>
                                        <span>Conversion Rate:</span>
                                        <span>{shotStats.zones.right.conv}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Shot Type Breakdown Card (spans 1 col) */}
                        <Card title="Shot Type Analysis" style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[
                                    { key: 'foot', label: '👟 Foot Shots', color: '#60a5fa' },
                                    { key: 'header', label: '🦪 Headers', color: '#f59e0b' },
                                    { key: 'freekick', label: '🎯 Free Kicks', color: '#10b981' },
                                    { key: 'penalty', label: '🥅 Penalties', color: '#ec4899' }
                                ].map(type => {
                                    const typeShots = filteredShots.filter(s => (s.goalType || 'foot') === type.key);
                                    const total = typeShots.length;
                                    const goals = typeShots.filter(s => s.result === 'goal').length;
                                    const conv = total > 0 ? Math.round((goals / total) * 100) : 0;
                                    const pct = shotStats.total > 0 ? Math.round((total / shotStats.total) * 100) : 0;

                                    return (
                                        <div key={type.key} style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border)', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{type.label}</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                    {total} shot{total !== 1 ? 's' : ''} ({pct}%)
                                                </span>
                                            </div>
                                            
                                            {/* Progress bar for shot volume share */}
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: type.color, borderRadius: '2px' }} />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Goals: {goals}</span>
                                                <span style={{ color: conv > 0 ? 'var(--success)' : 'var(--text-muted)' }}>Conv. Rate: {conv}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
