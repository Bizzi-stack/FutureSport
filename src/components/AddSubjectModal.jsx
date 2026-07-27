import { useState, useRef, useEffect } from 'react';

export default function AddSubjectModal({ onAdd, onClose, existingSubjects }) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();

        if (!trimmed) {
            setError('Metric name cannot be empty.');
            return;
        }
        if (existingSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            setError(`"${trimmed}" already exists.`);
            return;
        }

        onAdd(trimmed);
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
                    width: '400px',
                    padding: '32px',
                    animation: 'slideUp 0.25s ease'
                }}
            >
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                    Add New Metric
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Enter the name of the metric to add to the ratings table.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="e.g. Goals, Assists, Tackles"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(0,0,0,0.3)',
                            border: error ? '1px solid var(--danger)' : 'var(--border-glass)',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            marginBottom: '8px'
                        }}
                    />
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
                        >Add Metric</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
