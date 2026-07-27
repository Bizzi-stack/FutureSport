import { useState, useRef, useEffect } from 'react';

export default function AddStudentModal({ onAdd, onClose, existingNames }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const first = firstName.trim();
        const last = lastName.trim();

        if (!first || !last) {
            setError('Both first and last name are required.');
            return;
        }

        const fullName = `${first} ${last}`;
        if (existingNames.some(n => n.toLowerCase() === fullName.toLowerCase())) {
            setError(`"${fullName}" already exists in this class.`);
            return;
        }

        onAdd(fullName);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{
                    width: '420px',
                    padding: '32px',
                    animation: 'slideUp 0.25s ease'
                }}
            >
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                    Add New Player
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Enter the player's name to add them to the current class.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>First Name</label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                                placeholder="e.g. John"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: error ? '1px solid var(--danger)' : 'var(--border-glass)',
                                    color: 'var(--text-primary)',
                                    fontSize: '15px',
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => { setLastName(e.target.value); setError(''); }}
                                placeholder="e.g. Doe"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: error ? '1px solid var(--danger)' : 'var(--border-glass)',
                                    color: 'var(--text-primary)',
                                    fontSize: '15px',
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                border: 'var(--border-glass)',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >Cancel</button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 24px',
                                background: 'var(--primary)',
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '14px',
                                fontWeight: '600',
                                boxShadow: '0 0 15px var(--primary-glow)'
                            }}
                        >Add Player</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
