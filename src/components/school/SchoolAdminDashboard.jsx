import { useState, useMemo, useEffect } from 'react';
import LeagueTable from '../LeagueTable';

export default function SchoolAdminDashboard({ schoolId, schools, allPlayers, allTeams, matches, onUpdateSchool, onDataUpdate }) {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'roster'
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
    const [uploadingPlayerDoc, setUploadingPlayerDoc] = useState(null); // { player, docType, label }
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

    const handleConfirmUpload = () => {
        if (!uploadingPlayerDoc || !uploadFileName) return;
        const { player, docType } = uploadingPlayerDoc;

        const updatedPlayers = allPlayers.map(p => {
            if (String(p.id) === String(player.id)) {
                const updatedDocs = {
                    ...(p.documents || {}),
                    [docType]: uploadFileName
                };
                const updatedStatus = p.status === 'rejected' ? 'pending' : (p.status || 'pending');
                return {
                    ...p,
                    documents: updatedDocs,
                    status: updatedStatus,
                    rejectionReason: p.status === 'rejected' ? '' : p.rejectionReason
                };
            }
            return p;
        });

        onDataUpdate(updatedPlayers);
        setUploadSuccessMsg('✓ File uploaded successfully!');
        
        setTimeout(() => {
            setUploadingPlayerDoc(null);
            setUploadFileName('');
            setUploadSuccessMsg('');
        }, 1500);
    };
    
    // Get current school profile
    const school = useMemo(() => {
        return schools.find(s => s.id === schoolId) || { name: 'Your Academy', colors: ['#3b82f6', '#1e3a8a'] };
    }, [schools, schoolId]);

    // Local profile form states
    const [primaryColor, setPrimaryColor] = useState(school.colors?.[0] || '#3b82f6');
    const [secondaryColor, setSecondaryColor] = useState(school.colors?.[1] || '#1e3a8a');
    const [logoBase64, setLogoBase64] = useState(school.logo || '');
    const [email, setEmail] = useState(`${school.id.replace('school-', '')}@bsfl.edu.bb`);
    const [phone, setPhone] = useState('246-426-0290');
    const [address, setAddress] = useState('St. Michael, Barbados');
    const [profileSaved, setProfileSaved] = useState(false);

    useEffect(() => {
        setPrimaryColor(school.colors?.[0] || '#3b82f6');
        setSecondaryColor(school.colors?.[1] || '#1e3a8a');
        setLogoBase64(school.logo || '');
    }, [school]);

    // Get school's teams/squads
    const schoolTeams = useMemo(() => {
        return allTeams.filter(t => t.schoolId === schoolId);
    }, [allTeams, schoolId]);

    // Get school's players
    const schoolPlayers = useMemo(() => {
        return allPlayers.filter(p => p.schoolId === schoolId);
    }, [allPlayers, schoolId]);

    // Group players by status
    const stats = useMemo(() => {
        const total = schoolPlayers.length;
        const pending = schoolPlayers.filter(p => p.status === 'pending').length;
        const approved = schoolPlayers.filter(p => p.status === 'approved').length;
        const rejected = schoolPlayers.filter(p => p.status === 'rejected').length;
        return { total, pending, approved, rejected };
    }, [schoolPlayers]);

    const handleSaveProfile = (e) => {
        e.preventDefault();
        onUpdateSchool(schoolId, {
            colors: [primaryColor, secondaryColor],
            logo: logoBase64,
            email,
            phone,
            address
        });
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%', minHeight: 0 }}>
            {/* Header / School Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: 'var(--border)', paddingBottom: '16px' }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    border: '3px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: '#ffffff'
                }}>
                    {school.name ? school.name.charAt(0) : 'S'}
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {school.name} Admin Panel
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Barbados Schools Football League Portal</span>
                </div>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border)', paddingBottom: '10px' }}>
                {[
                    { id: 'profile', label: 'School Profile' },
                    { id: 'roster', label: 'Roster Registrations' },
                    { id: 'standings', label: 'League Standings' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                            background: activeTab === tab.id ? 'rgba(37,99,235,0.18)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-secondary)',
                            border: activeTab === tab.id ? '1px solid rgba(37,99,235,0.35)' : '1px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Views */}
            <div style={{ flex: 1, minHeight: 0 }}>
                {activeTab === 'profile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                        
                        {/* Profile form */}
                        <form onSubmit={handleSaveProfile} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>School Information</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Primary Team Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{primaryColor.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Secondary Team Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={e => setSecondaryColor(e.target.value)}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{secondaryColor.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '16px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>School Crest / Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '60px', height: '60px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.02)', border: 'var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {logoBase64 ? (
                                            <img src={logoBase64} alt="Crest Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Crest</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (uploadEvent) => {
                                                        setLogoBase64(uploadEvent.target.result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                                        />
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Supports PNG, JPG, or SVG. Max 2MB.</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Contact Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Phone Number</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: 'var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            {profileSaved && (
                                <div style={{
                                    padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                                }}>
                                    ✓ School Profile updated successfully!
                                </div>
                            )}

                            <button
                                type="submit"
                                style={{
                                    padding: '10px', borderRadius: '24px', background: 'var(--primary)', border: 'none',
                                    color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                                }}
                            >
                                Save School Settings
                            </button>
                        </form>

                        {/* Roster & Squad summary */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Squads card */}
                            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>Active Squads</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {schoolTeams.length === 0 ? (
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No squads currently created. Tell your Head Coach to initialize a squad!</div>
                                    ) : (
                                        schoolTeams.map(team => (
                                            <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', borderRadius: '8px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{team.customName || `${school.name} ${team.name}`}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--primary-light)', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                                    {team.gender === 'Boy' ? 'Boys' : 'Girls'} {team.ageGroup}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Registration Summary Card */}
                            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderBottom: 'var(--border)', paddingBottom: '8px' }}>Roster Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {[
                                        { label: 'Total Registered', value: stats.total, color: 'var(--text-primary)' },
                                        { label: 'Pending Approval', value: stats.pending, color: 'var(--warning)' },
                                        { label: 'Approved Eligible', value: stats.approved, color: 'var(--success)' },
                                        { label: 'Flagged / Rejected', value: stats.rejected, color: 'var(--danger)' }
                                    ].map((sum, i) => (
                                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{sum.label}</span>
                                            <span style={{ fontSize: '18px', fontWeight: '800', color: sum.color }}>{sum.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'roster' && (() => {
                    const missingDocsCount = schoolPlayers.filter(p => !p.documents?.birthCertificate || !p.documents?.enrollmentLetter).length;

                    const filtered = schoolPlayers.filter(p => {
                        const matchesSearch = (typeof p?.name === 'string' && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
                                              (p?.jerseyNumber && String(p.jerseyNumber).includes(searchQuery));
                        const matchesIncomplete = !showOnlyIncomplete || (!p?.documents?.birthCertificate || !p?.documents?.enrollmentLetter);
                        return matchesSearch && matchesIncomplete;
                    });

                    return (
                        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border)', paddingBottom: '10px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Eligibility Status Tracker</h3>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Track registrations and upload verification documents</span>
                                </div>
                                {missingDocsCount > 0 && (
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                        {missingDocsCount} players missing documents
                                    </span>
                                )}
                            </div>

                            {/* Search & Filter Bar */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Search roster by name..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        padding: '8px 12px', borderRadius: '8px', border: 'var(--border)',
                                        background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                                        width: '260px'
                                    }}
                                />

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showOnlyIncomplete}
                                        onChange={e => setShowOnlyIncomplete(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                    />
                                    <span>Show players missing documents</span>
                                </label>
                            </div>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: 'var(--border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Jersey &amp; Player Name</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>DOB / Position</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Birth Certificate</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Enrollment Letter</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(player => {
                                        const status = player.status || 'pending';
                                        const docs = player.documents || {};
                                        return (
                                            <tr key={player.id} style={{ borderBottom: 'var(--border)' }}>
                                                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800'
                                                        }}>
                                                            {player.jerseyNumber || '-'}
                                                        </div>
                                                        {player.name}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>
                                                    <div>{player.position}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DOB: {player.dob}</div>
                                                </td>
                                                
                                                {/* Birth Certificate Col */}
                                                <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                                                    {docs.birthCertificate ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                                                            <span>Verified</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({docs.birthCertificate})</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setUploadingPlayerDoc({ player, docType: 'birthCertificate', label: 'Birth Certificate' })}
                                                            style={{
                                                                padding: '4px 10px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)',
                                                                border: 'none', color: 'var(--warning)', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                                                            }}
                                                        >
                                                            Upload
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Enrollment Letter Col */}
                                                <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                                                    {docs.enrollmentLetter ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                                                            <span>Verified</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({docs.enrollmentLetter})</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setUploadingPlayerDoc({ player, docType: 'enrollmentLetter', label: 'Enrollment Letter' })}
                                                            style={{
                                                                padding: '4px 10px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)',
                                                                border: 'none', color: 'var(--warning)', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                                                            }}
                                                        >
                                                            Upload
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Status Col */}
                                                <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{
                                                            fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px',
                                                            background: status === 'approved' ? 'var(--success-dim)' : status === 'rejected' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                                                            color: status === 'approved' ? 'var(--success)' : status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                                                        }}>
                                                            {status}
                                                        </span>
                                                        {status === 'rejected' && player.rejectionReason && (
                                                            <span style={{ fontSize: '10px', color: 'var(--danger)', fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={player.rejectionReason}>
                                                                {player.rejectionReason}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}

            {activeTab === 'standings' && (
                <LeagueTable matches={matches} teams={allTeams} schools={schools} />
            )}

            {/* Upload Document Modal */}
            {uploadingPlayerDoc && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-panel" style={{ padding: '24px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            Upload {uploadingPlayerDoc.label}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            Select the document to upload for <strong>{uploadingPlayerDoc.player.name}</strong> to verify their league eligibility.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Choose File (PDF or image)</label>
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) setUploadFileName(file.name);
                                }}
                                style={{
                                    padding: '10px', borderRadius: '8px', border: 'var(--border)',
                                    background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                                }}
                            />
                        </div>

                        {uploadSuccessMsg && (
                            <div style={{
                                padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '12px', fontWeight: '600', textAlign: 'center'
                            }}>
                                {uploadSuccessMsg}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    setUploadingPlayerDoc(null);
                                    setUploadFileName('');
                                    setUploadSuccessMsg('');
                                }}
                                style={{ padding: '6px 14px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={!uploadFileName}
                                style={{
                                    padding: '6px 16px', borderRadius: '20px', background: 'var(--primary)',
                                    color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    opacity: uploadFileName ? 1 : 0.5
                                }}
                            >
                                Submit Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
