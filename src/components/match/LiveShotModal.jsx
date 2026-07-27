import { useState, useRef } from 'react';
import CustomSelect from '../CustomSelect';

export default function LiveShotModal({ player, teammates, defaultOutcome, onSave, onClose }) {
    const [result, setResult] = useState(defaultOutcome || 'goal'); // 'goal' | 'saved' | 'miss'
    const [coords, setCoords] = useState(null); // { x, y }
    const [goalType, setGoalType] = useState('foot'); // 'foot' | 'header' | 'freekick' | 'penalty' | 'own-goal'
    const [assistPlayerId, setAssistPlayerId] = useState(''); // player ID
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
            // Default to goal/saved when clicking inside the net
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
        if (newResult !== 'goal' && goalType === 'own-goal') {
            setGoalType('foot');
        }
        // adjust coords based on inside/outside goalmouth
        if (coords && (newResult === 'goal' || newResult === 'saved')) {
            const isInside = coords.x >= 10 && coords.x <= 90 && coords.y >= 20 && coords.y <= 95;
            if (!isInside) {
                setCoords({ x: 50, y: 55 }); // Center of net
            }
        } else if (coords && newResult === 'miss') {
            const isInside = coords.x >= 10 && coords.x <= 90 && coords.y >= 20 && coords.y <= 95;
            if (isInside) {
                setCoords({ x: 50, y: 10 }); // Over crossbar
            }
        }
    };

    const handleSave = () => {
        if (!coords) {
            alert('Please click on the visual map to place the shot location.');
            return;
        }
        
        onSave({
            result,
            x: coords.x,
            y: coords.y,
            goalType: goalType,
            assistPlayerId: result === 'goal' && goalType !== 'own-goal' && assistPlayerId ? Number(assistPlayerId) : null
        });
    };

    const isInsideGoal = coords && coords.x >= 10 && coords.x <= 90 && coords.y >= 20 && coords.y <= 95;
    const dotColor = result === 'goal' ? '#22c55e' : result === 'saved' ? '#6366f1' : '#ef4444';

    const goalTypes = [
        { key: 'foot', label: '👟 Feet (Normal)' },
        { key: 'header', label: '🦪 Header' },
        { key: 'freekick', label: '🎯 Free Kick' },
        { key: 'penalty', label: '🥅 Penalty' },
        { key: 'own-goal', label: '⚠️ Own Goal' }
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(4, 8, 20, 0.85)', backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.25s ease',
            fontFamily: 'inherit',
            color: 'var(--text-primary)'
        }}>
            <div style={{
                background: 'rgba(10, 16, 32, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '28px',
                width: '580px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.4px', background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Log Match Shot
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            Registering shot details for <strong style={{ color: 'var(--text-primary)' }}>{player?.name}</strong>
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            width: '32px', height: '32px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                        ✕
                    </button>
                </div>

                {/* Grid controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Outcome Choice */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            1. Outcome
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            <button
                                onClick={() => handleResultChange('goal')}
                                disabled={coords && !isInsideGoal}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: result === 'goal' ? '#22c55e' : 'rgba(255,255,255,0.08)',
                                    background: result === 'goal' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.02)',
                                    color: result === 'goal' ? '#4ade80' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '13px', cursor: (coords && !isInsideGoal) ? 'not-allowed' : 'pointer',
                                    opacity: (coords && !isInsideGoal) ? 0.4 : 1,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                ⚽ Goal
                            </button>
                            <button
                                onClick={() => handleResultChange('saved')}
                                disabled={coords && !isInsideGoal}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: result === 'saved' ? '#6366f1' : 'rgba(255,255,255,0.08)',
                                    background: result === 'saved' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                                    color: result === 'saved' ? '#a5b4fc' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '13px', cursor: (coords && !isInsideGoal) ? 'not-allowed' : 'pointer',
                                    opacity: (coords && !isInsideGoal) ? 0.4 : 1,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                🧤 Saved
                            </button>
                            <button
                                onClick={() => handleResultChange('miss')}
                                disabled={coords && isInsideGoal}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: result === 'miss' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                    background: result === 'miss' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.02)',
                                    color: result === 'miss' ? '#f87171' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '13px', cursor: (coords && isInsideGoal) ? 'not-allowed' : 'pointer',
                                    opacity: (coords && isInsideGoal) ? 0.4 : 1,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                ❌ Missed
                            </button>
                        </div>
                    </div>

                    {/* Shot details - Type and Assists */}
                    <div style={{ display: 'grid', gridTemplateColumns: result === 'goal' ? '1fr 1fr' : '1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' }}>
                        {/* Shot/Goal Type */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                {result === 'goal' ? 'Goal Type' : 'Shot Type'}
                            </label>
                            <CustomSelect
                                value={goalType}
                                onChange={e => setGoalType(e.target.value)}
                                style={{ width: '100%' }}
                                options={goalTypes
                                    .filter(gt => result === 'goal' || gt.key !== 'own-goal')
                                    .map(gt => ({ value: gt.key, label: gt.label }))
                                }
                            />
                        </div>

                        {/* Assist player selection (Only for goals) */}
                        {result === 'goal' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                    {goalType === 'own-goal' ? 'Assisted By' : 'Assist (Teammate)'}
                                </label>
                                <CustomSelect
                                    value={assistPlayerId}
                                    onChange={e => setAssistPlayerId(e.target.value)}
                                    disabled={goalType === 'own-goal'}
                                    placeholder="— No Assist —"
                                    style={{ width: '100%' }}
                                    options={teammates
                                        .filter(t => t.id !== player.id)
                                        .map(t => ({
                                            value: t.id,
                                            label: `${t.jerseyNumber ? `#${t.jerseyNumber} ` : ''}${t.name}`
                                        }))
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* Goalmouth Map */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                2. Click goal grid to place shot
                            </label>
                            {coords && (
                                <span style={{ fontSize: '11px', color: dotColor, fontWeight: '700' }}>
                                    Placed: [{coords.x}%, {coords.y}%]
                                </span>
                            )}
                        </div>

                        {/* Outer Container */}
                        <div
                            ref={goalRef}
                            onClick={handleGoalClick}
                            style={{
                                width: '100%', height: '220px',
                                background: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                position: 'relative',
                                cursor: 'crosshair',
                                overflow: 'hidden',
                                boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
                            }}
                        >
                            {/* Off-target tags */}
                            <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', pointerEvents: 'none' }}>
                                Off Target (Over)
                            </div>
                            <div style={{ position: 'absolute', bottom: '50%', left: '4px', color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', writingMode: 'vertical-lr', transform: 'rotate(180deg) translateY(50%)', pointerEvents: 'none' }}>
                                Off Target (Wide)
                            </div>
                            <div style={{ position: 'absolute', bottom: '50%', right: '4px', color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', writingMode: 'vertical-lr', transform: 'translateY(50%)', pointerEvents: 'none' }}>
                                Off Target (Wide)
                            </div>

                            {/* Goalmouth Structure */}
                            {/* Spans from X: 10% to 90%, Y: 20% to 95% */}
                            <div style={{
                                position: 'absolute',
                                left: '10%', right: '10%',
                                top: '20%', bottom: '5%',
                                border: '4px solid #ffffff',
                                borderBottom: 'none',
                                background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px), 
                                             repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px)`,
                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                pointerEvents: 'none',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                            }}>
                                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)' }} />
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.04)', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                    ON TARGET
                                </div>
                            </div>

                            {/* Turf */}
                            <div style={{
                                position: 'absolute',
                                left: 0, right: 0,
                                bottom: 0, height: '5%',
                                background: '#144626',
                                borderTop: '1px solid #155e2d',
                                pointerEvents: 'none'
                            }} />

                            {/* Active Coord Indicator Dot */}
                            {coords && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${coords.x}%`,
                                    top: `${coords.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: '14px', height: '14px',
                                    borderRadius: '50%',
                                    background: dotColor,
                                    border: '2px solid #ffffff',
                                    boxShadow: `0 0 10px ${dotColor}, 0 2px 4px rgba(0,0,0,0.5)`,
                                    pointerEvents: 'none',
                                    animation: 'pulse 1.5s infinite ease-in-out',
                                    zIndex: 20
                                }} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 18px', borderRadius: '8px', border: 'none',
                            background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
                            fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!coords}
                        style={{
                            padding: '10px 22px', borderRadius: '8px', border: 'none',
                            background: coords ? 'var(--primary, #3763eb)' : 'rgba(255, 255, 255, 0.03)',
                            color: coords ? '#ffffff' : 'var(--text-muted)',
                            fontWeight: '700', fontSize: '13px',
                            cursor: coords ? 'pointer' : 'not-allowed',
                            boxShadow: coords ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Save Play
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.2); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.97); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />
        </div>
    );
}
