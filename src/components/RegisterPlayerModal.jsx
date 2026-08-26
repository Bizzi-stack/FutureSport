import { useState, useMemo } from 'react';
import { generatePlayerId, checkDuplicatePlayer } from '../utils/playerUtils';

export default function RegisterPlayerModal({ onAdd, onClose, existingNames = [], existingPlayers = [] }) {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('2010-01-01');
    const [gender, setGender] = useState('Boy');
    const [position, setPosition] = useState('Midfielder');
    const [preferredFoot, setPreferredFoot] = useState('Right');
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [medicalInfo, setMedicalInfo] = useState('None');
    const [emergencyContact, setEmergencyContact] = useState('');
    
    // System-generated permanent Player ID
    const systemPlayerId = useMemo(() => generatePlayerId(), []);
    
    // Document Upload Toggles (simulated)
    const [hasBirthCert, setHasBirthCert] = useState(true);
    const [hasEnrollment, setHasEnrollment] = useState(true);
    
    const [error, setError] = useState('');

    // Check duplicate player status dynamically
    const duplicateCheck = useMemo(() => {
        if (!name.trim()) return { isDuplicate: false };
        return checkDuplicatePlayer({ name: name.trim(), dob }, existingPlayers);
    }, [name, dob, existingPlayers]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('Player name is required.');
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
            playerId: systemPlayerId,
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
            status: 'pending', // initial status is pending until admin approves
            isDuplicateFlagged: duplicateCheck.isDuplicate,
            duplicateReason: duplicateCheck.duplicateReason || null,
            matchingPlayer: duplicateCheck.matchingPlayer || null
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
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Register New Player</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Permanent System-Generated Registration</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>

                {/* System Generated Player ID Card */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)'
                }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.08em' }}>System-Generated Permanent Player ID</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace' }}>{systemPlayerId}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#818cf8', background: 'rgba(99,102,241,0.2)', padding: '4px 8px', borderRadius: '6px' }}>PERMANENT</span>
                </div>

                {/* Duplicate Registration Warning Banner */}
                {duplicateCheck.isDuplicate && (
                    <div style={{
                        padding: '12px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '12px'
                    }}>
                        <div style={{ fontWeight: '800', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚠️ Duplicate Record Detected</span>
                        </div>
                        <div>{duplicateCheck.duplicateReason}</div>
                        <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>This record will be flagged for administrator review to prevent duplicate registration IDs.</div>
                    </div>
                )}

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
