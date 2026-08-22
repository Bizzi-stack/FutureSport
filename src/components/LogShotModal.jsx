import { useState, useRef } from 'react';

export default function LogShotModal({ student, year, term, onSave, onClose }) {
    const [result, setResult] = useState('goal'); // 'goal' | 'saved' | 'miss'
    const [coords, setCoords] = useState(null); // { x, y }
    const [goalType, setGoalType] = useState('foot'); // 'foot' | 'header' | 'freekick' | 'penalty'
    const goalRef = useRef(null);

    const handleGoalClick = (e) => {
        if (!goalRef.current) return;
        const rect = goalRef.current.getBoundingClientRect();
        
        // Calculate raw relative percentages (0 to 100)
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Clamp between 0 and 100
        x = Math.max(0, Math.min(100, Math.round(x)));
        y = Math.max(0, Math.min(100, Math.round(y)));

        setCoords({ x, y });

        // Goalposts are defined as:
        // Left post = 10%
        // Right post = 90%
        // Crossbar = 20%
        // Ground = 95%
        const isInside = x >= 10 && x <= 90 && y >= 20 && y <= 95;

        if (isInside) {
            // Default to goal when clicking inside the net
            if (result === 'miss') {
                setResult('goal');
            }
        } else {
            // Force off-target when clicking outside posts
            setResult('miss');
        }
    };

    const handleResultChange = (newResult) => {
        setResult(newResult);
        // If they select goal/saved but coords are outside, reset or prompt
        if (coords && (newResult === 'goal' || newResult === 'saved')) {
            const isInside = coords.x >= 10 && coords.x <= 90 && coords.y >= 20 && coords.y <= 95;
            if (!isInside) {
                // Move coords inside the goal mouth (e.g. center)
                setCoords({ x: 50, y: 55 });
            }
        } else if (coords && newResult === 'miss') {
            const isInside = coords.x >= 10 && coords.x <= 90 && coords.y >= 20 && coords.y <= 95;
            if (isInside) {
                // Move coords outside (e.g. over the crossbar)
                setCoords({ x: 50, y: 10 });
            }
        }
    };

    const handleSave = () => {
        if (!coords) {
            alert('Please click on the visual map to place the shot location.');
            return;
        }
        onSave(result, coords.x, coords.y, goalType);
    };

    const isInsideGoal = coords && coords.x >= 10 && coords.x <= 90 && coords.y >= 20 && coords.y <= 95;

    // Dot color mapping
    const dotColor = result === 'goal' ? '#10b981' : result === 'saved' ? '#3b82f6' : '#ef4444';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div className="glass-panel" style={{
                background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', width: '560px',
                boxShadow: 'var(--shadow-lg)', border: 'var(--border)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                            Log New Shot
                        </h2>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {student.name} · {year} · {term}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                </div>

                {/* Shot Result Selector */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        1. Select Shot Outcome
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {/* Goal Button */}
                        <button
                            type="button"
                            onClick={() => handleResultChange('goal')}
                            disabled={coords && !isInsideGoal}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                padding: '10px 4px', borderRadius: '10px', border: '2px solid',
                                borderColor: result === 'goal' ? 'var(--success)' : 'rgba(255,255,255,0.08)',
                                background: result === 'goal' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                                color: result === 'goal' ? 'var(--success)' : 'var(--text-secondary)',
                                fontWeight: '700', fontSize: '12px', cursor: (coords && !isInsideGoal) ? 'not-allowed' : 'pointer',
                                opacity: (coords && !isInsideGoal) ? 0.4 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>⚽</span>
                            Goal
                        </button>

                        {/* Saved Button */}
                        <button
                            type="button"
                            onClick={() => handleResultChange('saved')}
                            disabled={coords && !isInsideGoal}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                padding: '10px 4px', borderRadius: '10px', border: '2px solid',
                                borderColor: result === 'saved' ? 'var(--primary-light)' : 'rgba(255,255,255,0.08)',
                                background: result === 'saved' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                color: result === 'saved' ? 'var(--primary-light)' : 'var(--text-secondary)',
                                fontWeight: '700', fontSize: '12px', cursor: (coords && !isInsideGoal) ? 'not-allowed' : 'pointer',
                                opacity: (coords && !isInsideGoal) ? 0.4 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>🧤</span>
                            Saved
                        </button>

                        {/* Blocked Button */}
                        <button
                            type="button"
                            onClick={() => handleResultChange('blocked')}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                padding: '10px 4px', borderRadius: '10px', border: '2px solid',
                                borderColor: result === 'blocked' ? '#a855f7' : 'rgba(255,255,255,0.08)',
                                background: result === 'blocked' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                                color: result === 'blocked' ? '#c084fc' : 'var(--text-secondary)',
                                fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>🛡️</span>
                            Blocked
                        </button>

                        {/* Off Target Button */}
                        <button
                            type="button"
                            onClick={() => handleResultChange('miss')}
                            disabled={coords && isInsideGoal}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                padding: '10px 4px', borderRadius: '10px', border: '2px solid',
                                borderColor: result === 'miss' ? 'var(--danger)' : 'rgba(255,255,255,0.08)',
                                background: result === 'miss' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.02)',
                                color: result === 'miss' ? 'var(--danger)' : 'var(--text-secondary)',
                                fontWeight: '700', fontSize: '12px', cursor: (coords && isInsideGoal) ? 'not-allowed' : 'pointer',
                                opacity: (coords && isInsideGoal) ? 0.4 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>💥</span>
                            Off Target
                        </button>
                    </div>
                </div>

                {/* Shot Type Selector */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        2. Select Shot Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {[
                            { key: 'foot', label: '👟 Foot' },
                            { key: 'header', label: '🦪 Header' },
                            { key: 'freekick', label: '🎯 Free Kick' },
                            { key: 'penalty', label: '🥅 Penalty' }
                        ].map(type => (
                            <button
                                key={type.key}
                                type="button"
                                onClick={() => setGoalType(type.key)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                    padding: '10px', borderRadius: '10px', border: '2px solid',
                                    borderColor: goalType === type.key ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                    background: goalType === type.key ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                    color: goalType === type.key ? 'var(--primary-light)' : 'var(--text-secondary)',
                                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>{type.label.split(' ')[0]}</span>
                                <span style={{ fontSize: '11px', marginTop: '2px' }}>{type.label.split(' ').slice(1).join(' ')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Visual Goalpost Map */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        3. Click Goal Area to Place Shot
                    </label>

                    {/* Outer Stadium Area */}
                    <div
                        ref={goalRef}
                        onClick={handleGoalClick}
                        style={{
                            width: '100%', height: '240px',
                            background: '#090d16',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            position: 'relative',
                            cursor: 'crosshair',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
                        }}
                    >
                        {/* Out of bounds indicators / labels */}
                        <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', pointerEvents: 'none' }}>
                            Off Target (Over)
                        </div>
                        <div style={{ position: 'absolute', bottom: '50%', left: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', writingMode: 'vertical-lr', transform: 'rotate(180deg) translateY(50%)', pointerEvents: 'none' }}>
                            Off Target (Wide)
                        </div>
                        <div style={{ position: 'absolute', bottom: '50%', right: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', writingMode: 'vertical-lr', transform: 'translateY(50%)', pointerEvents: 'none' }}>
                            Off Target (Wide)
                        </div>

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
                            pointerEvents: 'none',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                        }}>
                            {/* Inner Net Shadows */}
                            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)' }} />
                            
                            {/* Target label inside net */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.07)', fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                ON TARGET
                            </div>
                        </div>

                        {/* Ground Line */}
                        <div style={{
                            position: 'absolute',
                            left: 0, right: 0,
                            bottom: 0, height: '5%',
                            background: '#14532d',
                            borderTop: '2px solid #166534',
                            pointerEvents: 'none'
                        }} />

                        {/* Active Coordinate Dot */}
                        {coords && (
                            <div style={{
                                position: 'absolute',
                                left: `${coords.x}%`,
                                top: `${coords.y}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '16px', height: '16px',
                                borderRadius: '50%',
                                background: dotColor,
                                border: '2px solid #ffffff',
                                boxShadow: `0 0 12px ${dotColor}, 0 2px 4px rgba(0,0,0,0.5)`,
                                pointerEvents: 'none',
                                animation: 'pulse 1.5s infinite ease-in-out',
                                zIndex: 20
                            }} />
                        )}
                    </div>
                </div>

                {/* Footer buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)',
                            fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!coords}
                        style={{
                            padding: '10px 24px', borderRadius: '10px', border: 'none',
                            background: coords ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: coords ? '#ffffff' : 'var(--text-muted)',
                            fontWeight: '700', fontSize: '13px',
                            cursor: coords ? 'pointer' : 'not-allowed',
                            boxShadow: coords ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { if (coords) e.currentTarget.style.background = 'var(--primary-light)'; }}
                        onMouseLeave={e => { if (coords) e.currentTarget.style.background = 'var(--primary)'; }}
                    >
                        Save Shot
                    </button>
                </div>
            </div>
            
            {/* Embedded styles for animation */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.2); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
            `}} />
        </div>
    );
}
