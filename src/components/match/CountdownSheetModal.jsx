import React, { useState, useEffect } from 'react';
import PreKickoffCorrectionModal from './PreKickoffCorrectionModal';

export default function CountdownSheetModal({
    match,
    allPlayers = [],
    schools = [],
    onClose,
    onApplyCorrection,
    userRole = 'commissioner'
}) {
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');

    // Pre-match operations standard FIFA/Concacaf protocol timeline
    const protocolTimeline = [
        { time: 'T-90 min', event: 'Teams arrive at stadium & access dressing rooms', role: 'Dressing Room Officer' },
        { time: 'T-75 min', event: 'Matchday Squad lists submitted & Match Commissioner verification', role: 'Match Commissioner' },
        { time: 'T-60 min', event: 'Pitch Inspection, Match Ball check & Referees coordination', role: 'Referee & 4th Official' },
        { time: 'T-40 min', event: 'Official Team Warm-Up commences on designated pitch halves', role: 'Team Head Coaches' },
        { time: 'T-15 min', event: 'Warm-Up ends. Teams return to dressing rooms for final call', role: 'Match Commissioner' },
        { time: 'T-10 min', event: 'Equipment, Shin-Guards & Jersey inspection in Player Tunnel', role: '4th Official' },
        { time: 'T-05 min', event: 'Teams & Officials march onto pitch / Coin toss & Anthem', role: 'Referees & Captains' },
        { time: 'T-00 min', event: 'Whistle Kick-Off Authority — Match commences', role: 'Referee' }
    ];

    // Helper to format player name as "LAST NAME, First Name" with Last Name in bold
    const renderPlayerName = (p) => {
        if (!p) return '';
        let firstName = p.firstName || '';
        let lastName = p.lastName || '';

        if (!firstName && !lastName) {
            if (p.name) {
                const parts = String(p.name).trim().split(/\s+/);
                if (parts.length > 1) {
                    lastName = parts.pop();
                    firstName = parts.join(' ');
                } else {
                    lastName = parts[0] || p.name;
                    firstName = '';
                }
            } else {
                return <span>Player #{p.id}</span>;
            }
        }

        return (
            <span>
                <strong style={{ fontWeight: '800' }}>{lastName}</strong>{firstName ? `, ${firstName}` : ''}
            </span>
        );
    };

    // Calculate T-minus countdown to kickoff
    useEffect(() => {
        if (!match) return;

        const updateClock = () => {
            const now = new Date();
            let kickoffDate = new Date();

            if (match.date) {
                const timeStr = match.time || '18:00';
                kickoffDate = new Date(`${match.date}T${timeStr}:00`);
            } else {
                kickoffDate.setHours(18, 0, 0, 0);
            }

            const diffMs = kickoffDate - now;
            if (diffMs <= 0) {
                setTimeRemaining('T-00:00 (KICK-OFF / IN PROGRESS)');
            } else {
                const totalSec = Math.floor(diffMs / 1000);
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const secs = totalSec % 60;
                setTimeRemaining(`T-${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            }
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, [match]);

    if (!match) return null;

    // Resolve Player Object helper
    const getPlayer = (idOrObj, defaultTeamPlayers = []) => {
        if (!idOrObj) return null;
        if (typeof idOrObj === 'object') return idOrObj;

        let found = allPlayers.find(p => String(p.id) === String(idOrObj));
        if (found) return found;

        found = defaultTeamPlayers.find(p => String(p.id) === String(idOrObj));
        if (found) return found;

        return { id: idOrObj, name: `Player #${idOrObj}`, jerseyNumber: String(idOrObj).replace(/\D/g, '') || '?' };
    };

    // Home Squad Data
    const homeSquad = match.homeSquadSelection || {};
    const homeStartingXI = (homeSquad.startingXI || []).map(p => getPlayer(p, match.homePlayers || [])).filter(Boolean);
    const homeBench = (homeSquad.benchPlayers || []).map(p => getPlayer(p, match.homePlayers || [])).filter(Boolean);

    // Away Squad Data
    const awaySquad = match.awaySquadSelection || {};
    const awayStartingXI = (awaySquad.startingXI || []).map(p => getPlayer(p, match.awayPlayers || [])).filter(Boolean);
    const awayBench = (awaySquad.benchPlayers || []).map(p => getPlayer(p, match.awayPlayers || [])).filter(Boolean);

    // Kit colors defaults
    const homeKit = match.homeKit || { shirt: '#00267F', shorts: '#00267F', socks: '#FFC726', gk: '#10b981' };
    const awayKit = match.awayKit || { shirt: '#dc2626', shorts: '#ffffff', socks: '#dc2626', gk: '#f59e0b' };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };

    // Download PDF / Formatted document simulation
    const handleDownloadPDF = () => {
        const content = document.getElementById('printable-countdown-sheet');
        if (!content) return;

        // Open print view in new window styled for PDF download
        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html>
                <head>
                    <title>Countdown_Sheet_Match_${match.id}.pdf</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
                        h1, h2, h3 { margin: 0 0 10px 0; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11px; text-align: left; color: #000; }
                        th { background: #f1f5f9; font-weight: bold; }
                        .header-bar { border-bottom: 2px solid #00267F; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-space-between; }
                        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #dcfce7; color: #166534; font-weight: bold; }
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

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10500,
            background: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            {/* Embedded Print CSS */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-countdown-sheet, #printable-countdown-sheet * {
                        visibility: visible !important;
                    }
                    #printable-countdown-sheet {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-border {
                        border: 1px solid #cbd5e1 !important;
                    }
                    .print-text-dark {
                        color: #0f172a !important;
                    }
                    .print-bg-light {
                        background: #f8fafc !important;
                    }
                }
            `}</style>

            <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(37,99,235,0.2)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '960px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: '#000000',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}>

                {/* Top Control Bar (Hidden on Print) */}
                <div className="no-print" style={{
                    padding: '14px 24px',
                    background: '#0f172a',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>📋</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                                Official Matchday Countdown Sheet
                            </h3>
                            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                Auto-generated from Commissioner Approved Match Data
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Live Countdown Badge */}
                        <div style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'rgba(37,99,235,0.2)',
                            border: '1px solid rgba(37,99,235,0.4)',
                            color: '#60a5fa',
                            fontSize: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            ⏱️ {timeRemaining}
                        </div>

                        {/* Authorized Correction Button */}
                        {(userRole === 'commissioner' || userRole === 'referee' || userRole === 'admin') && (
                            <button
                                onClick={() => setShowCorrectionModal(true)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(245,158,11,0.2)',
                                    border: '1px solid rgba(245,158,11,0.4)',
                                    color: '#fbbf24',
                                    fontSize: '11.5px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                ✏️ Authorized Correction
                            </button>
                        )}

                        {/* Print Button */}
                        <button
                            onClick={handlePrint}
                            style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: 'rgba(16,185,129,0.2)',
                                border: '1px solid rgba(16,185,129,0.4)',
                                color: '#34d399',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            🖨️ Print Sheet
                        </button>

                        {/* Export PDF */}
                        <button
                            onClick={handleDownloadPDF}
                            style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#ffffff',
                                fontSize: '11.5px',
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
                        >✕</button>
                    </div>
                </div>

                {/* Printable Document Container */}
                <div
                    id="printable-countdown-sheet"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
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
                        justify: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#FFC726', letterSpacing: '1px' }}>
                                BARBADOS FOOTBALL ASSOCIATION • {match.ageGroup || 'PMC'} COMPETITION
                            </div>
                            <h1 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                                OFFICIAL MATCHDAY COUNTDOWN & ROSTER SHEET
                            </h1>
                            <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>
                                Match ID: <strong>{match.id}</strong> • Round: <strong>{match.matchday || match.round || 'Group Stage'}</strong>
                            </div>
                        </div>

                        {/* Official Stamp */}
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
                                ✓ COMMISSIONER APPROVED
                            </div>
                            <div style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '4px' }}>
                                Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    {/* Match Overview & Officials Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>

                        {/* Match Logistics */}
                        <div style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#000000'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#00267F', textTransform: 'uppercase' }}>
                                📍 Match Details & Logistics
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Venue / Pitch:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.venue || 'Barbados National Stadium'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Scheduled Kickoff:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.date || '2026-08-26'} @ {match.time || '18:00'} AST</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Weather Condition:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.weather || 'Clear · 28°C · Wind 12 km/h'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Pitch Surface:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.pitchCondition || 'Natural Grass (Watered)'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Match Officials */}
                        <div style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#000000'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#00267F', textTransform: 'uppercase' }}>
                                ⏱️ Designated Match Officials
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Match Commissioner:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.commissioner || 'Sarah Rollins'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Referee:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.referee || 'Adrian Hunte'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Assistant Referee 1:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.assistantReferee1 || 'Kevon Alleyne'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Assistant Referee 2:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.assistantReferee2 || 'Dario Beckles'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Fourth Official:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.fourthOfficial || 'Marcus Yearwood'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#000000', fontWeight: '600' }}>Data Assessor:</span><br />
                                    <strong style={{ color: '#000000' }}>{match.statistician || 'EduData Official'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side-by-Side Teams Roster Comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                        {/* HOME TEAM COLUMN */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: '#f0f7ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            color: '#000000'
                        }}>
                            {/* Home Header */}
                            <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '10px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#1d4ed8', letterSpacing: '0.5px' }}>HOME TEAM</div>
                                <h3 style={{ margin: '2px 0', fontSize: '16px', fontWeight: '800', color: '#000000' }}>
                                    {match.homeTeam || 'Home Team'}
                                </h3>
                                <div style={{ fontSize: '11px', color: '#000000' }}>
                                    Tactical Formation: <strong style={{ color: '#1d4ed8' }}>{homeSquad.formation || '4-3-3'}</strong>
                                </div>

                                {/* Kit Colors */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10.5px', color: '#000000' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>Shirt:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: homeKit.shirt, border: '1px solid #000' }}></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>Shorts:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: homeKit.shorts, border: '1px solid #000' }}></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>Socks:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: homeKit.socks, border: '1px solid #000' }}></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>GK:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: homeKit.gk, border: '1px solid #000' }}></span>
                                    </div>
                                </div>
                            </div>

                            {/* Starting XI */}
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '11.5px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>
                                    Starting XI (11 Players)
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', color: '#000000' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #93c5fd', color: '#000000', textAlign: 'left' }}>
                                            <th style={{ padding: '4px 6px' }}>#</th>
                                            <th style={{ padding: '4px 6px' }}>Player Name</th>
                                            <th style={{ padding: '4px 6px' }}>Pos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {homeStartingXI.map((p, idx) => (
                                            <tr key={p.id || idx} style={{ borderBottom: '1px solid #dbeafe' }}>
                                                <td style={{ padding: '4px 6px', fontWeight: '800', color: '#1d4ed8' }}>
                                                    {p.jerseyNumber || (idx + 1)}
                                                </td>
                                                <td style={{ padding: '4px 6px', color: '#000000' }}>
                                                    {renderPlayerName(p)}
                                                    {((homeSquad.captainId ? String(p.id) === String(homeSquad.captainId) : idx === 0)) && (
                                                        <span style={{ marginLeft: '4px', padding: '1px 5px', borderRadius: '4px', background: '#FFC726', color: '#000000', fontSize: '9.5px', fontWeight: '900' }}>C</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '4px 6px', color: '#000000', fontSize: '10.5px' }}>
                                                    {p.position || (idx === 0 ? 'GK' : idx < 5 ? 'DEF' : idx < 9 ? 'MID' : 'FWD')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bench Substitutes */}
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '11.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase' }}>
                                    Substitutes Bench (7 Players)
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#000000' }}>
                                    <tbody>
                                        {homeBench.map((p, idx) => (
                                            <tr key={p.id || idx} style={{ borderBottom: '1px solid #dbeafe' }}>
                                                <td style={{ padding: '3px 6px', fontWeight: '700', color: '#000000', width: '24px' }}>
                                                    {p.jerseyNumber || (idx + 12)}
                                                </td>
                                                <td style={{ padding: '3px 6px', color: '#000000' }}>
                                                    {renderPlayerName(p)}
                                                    {homeSquad.captainId && String(p.id) === String(homeSquad.captainId) && (
                                                        <span style={{ marginLeft: '4px', padding: '1px 4px', borderRadius: '4px', background: '#FFC726', color: '#000000', fontSize: '9px', fontWeight: '900' }}>C</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '3px 6px', color: '#000000', fontSize: '10px', textAlign: 'right' }}>
                                                    {p.position || 'SUB'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* AWAY TEAM COLUMN */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            color: '#000000'
                        }}>
                            {/* Away Header */}
                            <div style={{ borderBottom: '1px solid #fecaca', paddingBottom: '10px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', letterSpacing: '0.5px' }}>AWAY TEAM</div>
                                <h3 style={{ margin: '2px 0', fontSize: '16px', fontWeight: '800', color: '#000000' }}>
                                    {match.awayTeam || 'Away Team'}
                                </h3>
                                <div style={{ fontSize: '11px', color: '#000000' }}>
                                    Tactical Formation: <strong style={{ color: '#dc2626' }}>{awaySquad.formation || '4-2-3-1'}</strong>
                                </div>

                                {/* Kit Colors */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10.5px', color: '#000000' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>Shirt:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: awayKit.shirt, border: '1px solid #000' }}></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>Shorts:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: awayKit.shorts, border: '1px solid #000' }}></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>Socks:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: awayKit.socks, border: '1px solid #000' }}></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>GK:</span>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: awayKit.gk, border: '1px solid #000' }}></span>
                                    </div>
                                </div>
                            </div>

                            {/* Starting XI */}
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '11.5px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase' }}>
                                    Starting XI (11 Players)
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', color: '#000000' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #fca5a5', color: '#000000', textAlign: 'left' }}>
                                            <th style={{ padding: '4px 6px' }}>#</th>
                                            <th style={{ padding: '4px 6px' }}>Player Name</th>
                                            <th style={{ padding: '4px 6px' }}>Pos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {awayStartingXI.map((p, idx) => (
                                            <tr key={p.id || idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                                                <td style={{ padding: '4px 6px', fontWeight: '800', color: '#dc2626' }}>
                                                    {p.jerseyNumber || (idx + 1)}
                                                </td>
                                                <td style={{ padding: '4px 6px', color: '#000000' }}>
                                                    {renderPlayerName(p)}
                                                    {((awaySquad.captainId ? String(p.id) === String(awaySquad.captainId) : idx === 0)) && (
                                                        <span style={{ marginLeft: '4px', padding: '1px 5px', borderRadius: '4px', background: '#FFC726', color: '#000000', fontSize: '9.5px', fontWeight: '900' }}>C</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '4px 6px', color: '#000000', fontSize: '10.5px' }}>
                                                    {p.position || (idx === 0 ? 'GK' : idx < 5 ? 'DEF' : idx < 9 ? 'MID' : 'FWD')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bench Substitutes */}
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '11.5px', fontWeight: '800', color: '#000000', textTransform: 'uppercase' }}>
                                    Substitutes Bench (7 Players)
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#000000' }}>
                                    <tbody>
                                        {awayBench.map((p, idx) => (
                                            <tr key={p.id || idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                                                <td style={{ padding: '3px 6px', fontWeight: '700', color: '#000000', width: '24px' }}>
                                                    {p.jerseyNumber || (idx + 12)}
                                                </td>
                                                <td style={{ padding: '3px 6px', color: '#000000' }}>
                                                    {renderPlayerName(p)}
                                                    {awaySquad.captainId && String(p.id) === String(awaySquad.captainId) && (
                                                        <span style={{ marginLeft: '4px', padding: '1px 4px', borderRadius: '4px', background: '#FFC726', color: '#000000', fontSize: '9px', fontWeight: '900' }}>C</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '3px 6px', color: '#000000', fontSize: '10px', textAlign: 'right' }}>
                                                    {p.position || 'SUB'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Pre-Kickoff Corrections Audit History (If any exist) */}
                    {Array.isArray(match.preKickoffCorrections) && match.preKickoffCorrections.length > 0 && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            fontSize: '11.5px',
                            color: '#000000'
                        }}>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '11.5px', fontWeight: '800', color: '#d97706' }}>
                                ✏️ Authorized Pre-Kickoff Corrections Log
                            </h4>
                            {match.preKickoffCorrections.map((c, idx) => (
                                <div key={idx} style={{ marginTop: '4px', color: '#000000' }}>
                                    • [{new Date(c.timestamp).toLocaleTimeString()}] <strong>{c.teamName}</strong>: {c.details} — <em>"{c.reason}"</em> ({c.authorizedBy})
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer Sign-off Section */}
                    <div style={{
                        marginTop: '10px',
                        padding: '16px',
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
                            <div style={{ borderBottom: '1px solid #000000', height: '24px', marginTop: '12px' }}></div>
                            <div style={{ marginTop: '4px', fontWeight: '700', color: '#000000' }}>{match.commissioner || 'Sarah Rollins'}</div>
                        </div>
                        <div>
                            <div>Referee Sign-Off:</div>
                            <div style={{ borderBottom: '1px solid #000000', height: '24px', marginTop: '12px' }}></div>
                            <div style={{ marginTop: '4px', fontWeight: '700', color: '#000000' }}>{match.referee || 'Adrian Hunte'}</div>
                        </div>
                        <div>
                            <div>Fourth Official Verification:</div>
                            <div style={{ borderBottom: '1px solid #000000', height: '24px', marginTop: '12px' }}></div>
                            <div style={{ marginTop: '4px', fontWeight: '700', color: '#000000' }}>{match.fourthOfficial || 'Marcus Yearwood'}</div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Pre-Kickoff Authorized Correction Modal Child */}
            {showCorrectionModal && (
                <PreKickoffCorrectionModal
                    match={match}
                    allPlayers={allPlayers}
                    onClose={() => setShowCorrectionModal(false)}
                    onApplyCorrection={onApplyCorrection}
                />
            )}
        </div>
    );
}
