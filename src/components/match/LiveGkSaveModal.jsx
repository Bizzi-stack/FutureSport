import { useState } from 'react';

const CORNERS = [
    { id: 'top-left', label: '↖️ Top Left', x: 25, y: 35 },
    { id: 'top-right', label: '↗️ Top Right', x: 75, y: 35 },
    { id: 'center', label: '🎯 Center', x: 50, y: 57 },
    { id: 'bottom-left', label: '↙️ Bottom Left', x: 25, y: 80 },
    { id: 'bottom-right', label: '↘️ Bottom Right', x: 75, y: 80 }
];

export default function LiveGkSaveModal({ player, onSave, onClose }) {
    const [saveType, setSaveType] = useState('normal'); // 'normal' | 'penalty' | 'freekick'
    const [selectedCorner, setSelectedCorner] = useState(null); // id of CORNERS

    const handleSave = () => {
        if (!selectedCorner) {
            alert('Please select a corner zone where the save was made.');
            return;
        }
        
        onSave({
            saveType,
            corner: selectedCorner
        });
    };

    const activeCorner = CORNERS.find(c => c.id === selectedCorner);

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
                padding: '20px',
                width: '100%',
                maxWidth: 'min(580px, calc(100vw - 24px))',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.4px', background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Log Goalkeeper Save
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            Registering save statistics for <strong style={{ color: 'var(--text-primary)' }}>{player?.name}</strong>
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
                    
                    {/* Save Type */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            1. Save Category
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            <button
                                onClick={() => setSaveType('normal')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: saveType === 'normal' ? '#10b981' : 'rgba(255,255,255,0.08)',
                                    background: saveType === 'normal' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
                                    color: saveType === 'normal' ? '#34d399' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                🧤 Normal Save
                            </button>
                            <button
                                onClick={() => setSaveType('penalty')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: saveType === 'penalty' ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                                    background: saveType === 'penalty' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                                    color: saveType === 'penalty' ? '#fbbf24' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                🥅 Penalty Save
                            </button>
                            <button
                                onClick={() => setSaveType('freekick')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: saveType === 'freekick' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                                    background: saveType === 'freekick' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                                    color: saveType === 'freekick' ? '#60a5fa' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                🎯 Free Kick Save
                            </button>
                        </div>
                    </div>

                    {/* Goalmouth Grid Map */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                2. Click Net Zone of the Save
                            </label>
                            {selectedCorner && (
                                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>
                                    Selected: {activeCorner?.label}
                                </span>
                            )}
                        </div>

                        {/* Goalmouth Structure */}
                        <div style={{
                            width: '100%', height: '220px',
                            background: '#070b13',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
                        }}>
                            {/* Visual Goalpost Net Overlay */}
                            <div style={{
                                position: 'absolute',
                                left: '10%', right: '10%',
                                top: '20%', bottom: '5%',
                                border: '4px solid #ffffff',
                                borderBottom: 'none',
                                background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px), 
                                             repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px)`,
                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                pointerEvents: 'none'
                            }} />

                            {/* Turf */}
                            <div style={{
                                position: 'absolute',
                                left: 0, right: 0,
                                bottom: 0, height: '5%',
                                background: '#144626',
                                borderTop: '1px solid #155e2d',
                                pointerEvents: 'none'
                            }} />

                            {/* Clickable Zone Grids */}
                            <div 
                                onClick={() => setSelectedCorner('top-left')}
                                style={{
                                    position: 'absolute', left: '10%', top: '20%', width: '26.6%', height: '37.5%',
                                    borderRight: '1px dashed rgba(255,255,255,0.15)', borderBottom: '1px dashed rgba(255,255,255,0.15)',
                                    background: selectedCorner === 'top-left' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            />
                            <div 
                                onClick={() => setSelectedCorner('top-right')}
                                style={{
                                    position: 'absolute', right: '10%', top: '20%', width: '26.6%', height: '37.5%',
                                    borderLeft: '1px dashed rgba(255,255,255,0.15)', borderBottom: '1px dashed rgba(255,255,255,0.15)',
                                    background: selectedCorner === 'top-right' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            />
                            <div 
                                onClick={() => setSelectedCorner('bottom-left')}
                                style={{
                                    position: 'absolute', left: '10%', bottom: '5%', width: '26.6%', height: '37.5%',
                                    borderRight: '1px dashed rgba(255,255,255,0.15)', borderTop: '1px dashed rgba(255,255,255,0.15)',
                                    background: selectedCorner === 'bottom-left' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            />
                            <div 
                                onClick={() => setSelectedCorner('bottom-right')}
                                style={{
                                    position: 'absolute', right: '10%', bottom: '5%', width: '26.6%', height: '37.5%',
                                    borderLeft: '1px dashed rgba(255,255,255,0.15)', borderTop: '1px dashed rgba(255,255,255,0.15)',
                                    background: selectedCorner === 'bottom-right' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            />
                            <div 
                                onClick={() => setSelectedCorner('center')}
                                style={{
                                    position: 'absolute', left: '36.6%', right: '36.6%', top: '20%', bottom: '5%',
                                    background: selectedCorner === 'center' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            />

                            {/* Render visual markers */}
                            {CORNERS.map(c => {
                                const active = selectedCorner === c.id;
                                return (
                                    <div 
                                        key={c.id}
                                        style={{
                                            position: 'absolute',
                                            left: `${c.x}%`,
                                            top: `${c.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: active ? '#10b981' : 'rgba(0, 0, 0, 0.6)',
                                            border: active ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                                            fontSize: '9px',
                                            fontWeight: '800',
                                            color: '#fff',
                                            pointerEvents: 'none',
                                            boxShadow: active ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {c.label}
                                    </div>
                                );
                            })}
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
                        disabled={!selectedCorner}
                        style={{
                            padding: '10px 22px', borderRadius: '8px', border: 'none',
                            background: selectedCorner ? 'var(--primary, #3763eb)' : 'rgba(255, 255, 255, 0.03)',
                            color: selectedCorner ? '#ffffff' : 'var(--text-muted)',
                            fontWeight: '700', fontSize: '13px',
                            cursor: selectedCorner ? 'pointer' : 'not-allowed',
                            boxShadow: selectedCorner ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Save Save
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.97); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />
        </div>
    );
}
