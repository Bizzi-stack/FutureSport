import { useState } from 'react';

export default function CreateSquadModal({ schoolId, schools, onAdd, onClose, existingSquads }) {
    const [ageGroup, setAgeGroup] = useState('U14');
    const [gender, setGender] = useState('Boys');
    const [error, setError] = useState('');

    const getSchoolName = () => {
        const sc = schools.find(s => s.id === schoolId);
        return sc ? sc.name : 'Your School';
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const schoolName = getSchoolName();
        // Construct standard squad name, e.g. "Harrison College U16 Girls"
        const constructedName = `${schoolName} ${ageGroup} ${gender}`;

        if (existingSquads.some(s => s.name.toLowerCase() === constructedName.toLowerCase())) {
            setError(`The squad "${constructedName}" already exists!`);
            return;
        }

        setError('');
        onAdd({
            name: ageGroup, // matches the division age category (U14, U16, U19)
            customName: constructedName, // readable name
            schoolId,
            gender: gender === 'Boys' ? 'Boy' : 'Girl',
            ageGroup
        });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Create New School Squad</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>

                {error && (
                    <div style={{
                        padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: '13px', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>School Academy</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{getSchoolName()}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Division Age Group</label>
                        <select
                            value={ageGroup}
                            onChange={e => setAgeGroup(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="U14">Under 14 (U14)</option>
                            <option value="U16">Under 16 (U16)</option>
                            <option value="U19">Under 19 (U19)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Gender division</label>
                        <select
                            value={gender}
                            onChange={e => setGender(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="Boys">Boys Squad</option>
                            <option value="Girls">Girls Squad</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '8px 24px', borderRadius: '20px', background: 'var(--primary)',
                                color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                            }}
                        >
                            Create Squad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
