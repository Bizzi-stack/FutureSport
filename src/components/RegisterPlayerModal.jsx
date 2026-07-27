import { useState } from 'react';

export default function RegisterPlayerModal({ onAdd, onClose, existingNames }) {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('2010-01-01');
    const [gender, setGender] = useState('Boy');
    const [position, setPosition] = useState('Midfielder');
    const [preferredFoot, setPreferredFoot] = useState('Right');
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [medicalInfo, setMedicalInfo] = useState('None');
    const [emergencyContact, setEmergencyContact] = useState('');
    
    // Document Upload Toggles (simulated)
    const [hasBirthCert, setHasBirthCert] = useState(true);
    const [hasEnrollment, setHasEnrollment] = useState(true);
    
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('Player name is required.');
            return;
        }

        if (existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase())) {
            setError('A player with this name already exists in this squad.');
            return;
        }

        if (!jerseyNumber) {
            setError('Jersey number is required.');
            return;
        }

        if (!emergencyContact.trim()) {
            setError('Emergency contact is required.');
            return;
        }

        setError('');
        onAdd({
            name: name.trim(),
            dob,
            gender,
            position,
            preferredFoot,
            jerseyNumber: parseInt(jerseyNumber),
            medicalInfo,
            emergencyContact: emergencyContact.trim(),
            documents: {
                birthCertificate: hasBirthCert,
                schoolEnrollment: hasEnrollment
            },
            status: 'pending' // initial status is pending until admin approves
        });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div className="glass-panel" style={{
                width: '520px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
                boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Register New Player (Pending Approval)</h3>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="E.g. John Doe"
                            required
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* DOB */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Date of Birth</label>
                            <input
                                type="date"
                                value={dob}
                                onChange={e => setDob(e.target.value)}
                                required
                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                            />
                        </div>
                        {/* Gender */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Gender Division</label>
                            <select
                                value={gender}
                                onChange={e => setGender(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="Boy">Boy (Boys Division)</option>
                                <option value="Girl">Girl (Girls Division)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Position */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Position</label>
                            <select
                                value={position}
                                onChange={e => setPosition(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="Goalkeeper">Goalkeeper</option>
                                <option value="Defender">Defender</option>
                                <option value="Midfielder">Midfielder</option>
                                <option value="Forward">Forward</option>
                            </select>
                        </div>
                        {/* Preferred Foot */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Preferred Foot</label>
                            <select
                                value={preferredFoot}
                                onChange={e => setPreferredFoot(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="Right">Right Foot</option>
                                <option value="Left">Left Foot</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Jersey Number */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Jersey Number</label>
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={jerseyNumber}
                                onChange={e => setJerseyNumber(e.target.value)}
                                placeholder="E.g. 10"
                                required
                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                            />
                        </div>
                        {/* Emergency Contact */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Emergency Contact Details</label>
                            <input
                                type="text"
                                value={emergencyContact}
                                onChange={e => setEmergencyContact(e.target.value)}
                                placeholder="E.g. Jane Doe (Mother) - 555-1234"
                                required
                                style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Medical Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Medical Information / Allergies</label>
                        <input
                            type="text"
                            value={medicalInfo}
                            onChange={e => setMedicalInfo(e.target.value)}
                            placeholder="E.g. Asthma, Penicillin allergy (or 'None')"
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                        />
                    </div>

                    {/* Simulated Document Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Required Documents Checklist</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={hasBirthCert}
                                    onChange={e => setHasBirthCert(e.target.checked)}
                                />
                                Upload Birth Certificate (Required)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={hasEnrollment}
                                    onChange={e => setHasEnrollment(e.target.checked)}
                                />
                                Upload School Enrollment Letter (Required)
                            </label>
                        </div>
                    </div>

                    {/* Form Buttons */}
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
                            Submit Registration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
