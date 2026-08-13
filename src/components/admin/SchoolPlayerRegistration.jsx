import { useState, useMemo } from 'react';

export default function SchoolPlayerRegistration({ allPlayers, onDataUpdate, schools, teams, selectedTournament }) {
    const isPmc = selectedTournament === 'PMC';
    const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected' | 'incomplete'
    const [schoolFilter, setSchoolFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'Boy' | 'Girl'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null); // { player, docType, filename, label }

    // Calculate Summary Stats
    const stats = useMemo(() => {
        let total = allPlayers.length;
        let pending = allPlayers.filter(p => p.status === 'pending').length;
        let approved = allPlayers.filter(p => p.status === 'approved').length;
        let rejected = allPlayers.filter(p => p.status === 'rejected').length;
        return { total, pending, approved, rejected };
    }, [allPlayers]);

    // Filtered Players list
    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(p => {
            let matchesStatus = false;
            if (statusFilter === 'incomplete') {
                matchesStatus = !p.documents?.birthCertificate || !p.documents?.enrollmentLetter;
            } else {
                matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            }
            const matchesSchool = schoolFilter === 'all' || p.schoolId === schoolFilter;
            const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
            const matchesSearch = (typeof p?.name === 'string' && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
                                  (p?.jerseyNumber && String(p.jerseyNumber).includes(searchQuery));
            return matchesStatus && matchesSchool && matchesGender && matchesSearch;
        });
    }, [allPlayers, statusFilter, schoolFilter, genderFilter, searchQuery]);

    const handleApprove = (playerId) => {
        const player = allPlayers.find(p => String(p.id) === String(playerId));
        const hasMissingDocs = !player?.documents?.birthCertificate || !player?.documents?.enrollmentLetter;

        if (hasMissingDocs) {
            const confirmApprove = window.confirm(`⚠️ WARNING: ${player?.name} has incomplete/missing documents. Are you sure you want to approve this player's registration?`);
            if (!confirmApprove) return;
        }

        const updated = allPlayers.map(p => {
            if (String(p.id) === String(playerId)) {
                return { ...p, status: 'approved' };
            }
            return p;
        });
        onDataUpdate(updated);
        if (selectedPlayer && String(selectedPlayer.id) === String(playerId)) {
            setSelectedPlayer(prev => ({ ...prev, status: 'approved' }));
        }
    };

    const handleReject = () => {
        if (!selectedPlayer) return;
        const updated = allPlayers.map(p => {
            if (String(p.id) === String(selectedPlayer.id)) {
                return { ...p, status: 'rejected', rejectionReason };
            }
            return p;
        });
        onDataUpdate(updated);
        setSelectedPlayer(prev => ({ ...prev, status: 'rejected', rejectionReason }));
        setShowRejectModal(false);
        setRejectionReason('');
    };

    const getSchoolName = (schoolId) => {
        const sc = schools.find(s => s.id === schoolId);
        return sc ? sc.name : (isPmc ? 'Unknown Club' : 'Unknown School');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: 'calc(100vh - 260px)', minHeight: '550px' }}>
            
            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                    { label: isPmc ? 'Total Senior Registrations' : 'Total Registrations', value: stats.total, color: 'var(--primary-light)', bg: 'rgba(99, 102, 241, 0.08)' },
                    { label: 'Pending Review', value: stats.pending, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.08)' },
                    { label: 'Approved', value: stats.approved, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.08)' },
                    { label: 'Rejected / Flagged', value: stats.rejected, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.08)' }
                ].map((st, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: st.bg }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{st.label}</span>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: st.color }}>{st.value}</span>
                    </div>
                ))}
            </div>

            {/* Filter and Content Area */}
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
                
                {/* Left Panel: Filter & List */}
                <div className="glass-panel" style={{ width: '420px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                    
                    {/* Filter controls */}
                    <div style={{ padding: '16px 20px', borderBottom: 'var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Filters</h4>
                        
                        <input
                            type="text"
                            placeholder="Search by name or jersey..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                padding: '8px 12px', borderRadius: '8px', border: 'var(--border)',
                                background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                            }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{isPmc ? 'Club / Team' : 'School'}</label>
                                <select
                                    value={schoolFilter}
                                    onChange={e => setSchoolFilter(e.target.value)}
                                    style={{
                                        padding: '6px 10px', borderRadius: '6px', border: 'var(--border)',
                                        background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">{isPmc ? 'All Clubs' : 'All Schools'}</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Gender</label>
                                <select
                                    value={genderFilter}
                                    onChange={e => setGenderFilter(e.target.value)}
                                    style={{
                                        padding: '6px 10px', borderRadius: '6px', border: 'var(--border)',
                                        background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">All Genders</option>
                                    <option value="Boy">Boys</option>
                                    <option value="Girl">Girls</option>
                                </select>
                            </div>
                        </div>

                        {/* Status Tabs */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: 'var(--border)' }}>
                            {['pending', 'approved', 'rejected', 'incomplete', 'all'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        flex: 1, padding: '6px 0', border: 'none', background: statusFilter === status ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        color: statusFilter === status ? 'var(--text-primary)' : 'var(--text-muted)',
                                        fontSize: '10px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s'
                                    }}
                                >
                                    {status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : status === 'incomplete' ? 'Incomplete' : 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Roster list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {filteredPlayers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                No registrations match the filters.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredPlayers.map(player => (
                                    <div
                                        key={player.id}
                                        onClick={() => setSelectedPlayer(player)}
                                        style={{
                                            padding: '12px 14px', borderRadius: '10px', background: selectedPlayer?.id === player.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                                            border: selectedPlayer?.id === player.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.03)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { if (selectedPlayer?.id !== player.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseLeave={e => { if (selectedPlayer?.id !== player.id) e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                                    >
                                        {/* Jersey badge */}
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'var(--primary-light)'
                                        }}>
                                            {player.jerseyNumber || '-'}
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getSchoolName(player.schoolId)}</span>
                                                {(!player.documents?.birthCertificate || !player.documents?.enrollmentLetter) && (
                                                    <span style={{ fontSize: '9px', color: 'var(--warning)', fontWeight: '700' }}>⚠️ Incomplete</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <span style={{
                                            fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px',
                                            background: player.status === 'approved' ? 'var(--success-dim)' : player.status === 'rejected' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                                            color: player.status === 'approved' ? 'var(--success)' : player.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                                            border: player.status === 'approved' ? '1px solid rgba(16,185,129,0.2)' : player.status === 'rejected' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)'
                                        }}>
                                            {player.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Selected Player Details */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                    {selectedPlayer ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                            
                            {/* Card Header */}
                            <div style={{ padding: '20px 24px', borderBottom: 'var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                        {selectedPlayer.gender === 'Boy' ? '🏃‍♂️' : '🏃‍♀️'}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedPlayer.name}</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getSchoolName(selectedPlayer.schoolId)}</span>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px',
                                    background: selectedPlayer.status === 'approved' ? 'var(--success-dim)' : selectedPlayer.status === 'rejected' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                                    color: selectedPlayer.status === 'approved' ? 'var(--success)' : selectedPlayer.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                                }}>
                                    Status: {selectedPlayer.status}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Date of Birth</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedPlayer.dob || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Gender Division</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedPlayer.gender || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Playing Position</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedPlayer.position || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Preferred Foot</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedPlayer.preferredFoot || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Jersey Number</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedPlayer.jerseyNumber || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Medical Notes</span>
                                        <span style={{ fontSize: '13px', color: selectedPlayer.medicalInfo === 'None' ? 'var(--text-primary)' : 'var(--danger)', fontWeight: '700' }}>
                                            {selectedPlayer.medicalInfo || '—'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Emergency Contact</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedPlayer.emergencyContact || '—'}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Uploaded Documents</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {[
                                            { key: 'birthCertificate', label: 'Birth Certificate' },
                                            { key: 'enrollmentLetter', label: 'School Enrollment Letter' }
                                        ].map(doc => {
                                            const file = selectedPlayer.documents?.[doc.key];
                                            return (
                                                <div key={doc.key} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px',
                                                    background: file ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)', border: file ? '1px solid rgba(16,185,129,0.1)' : '1px solid rgba(239,68,68,0.1)',
                                                    fontSize: '12.5px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span>{file ? '📄' : '❌'}</span>
                                                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{doc.label}</span>
                                                        {file && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({file})</span>}
                                                    </div>
                                                    {file ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewDoc({ player: selectedPlayer, docType: doc.key, filename: file, label: doc.label })}
                                                            style={{
                                                                padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)',
                                                                color: 'var(--primary-light)', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                                                            }}
                                                        >
                                                            View Document
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '700' }}>Missing</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedPlayer.status === 'rejected' && selectedPlayer.rejectionReason && (
                                    <div style={{
                                        padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column', gap: '4px'
                                    }}>
                                        <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '700', textTransform: 'uppercase' }}>Rejection / Flags Reason</span>
                                        <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{selectedPlayer.rejectionReason}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer */}
                            {selectedPlayer.status === 'pending' && (
                                <div style={{ padding: '16px 24px', borderTop: 'var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        style={{
                                            padding: '8px 20px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        Flag / Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedPlayer.id)}
                                        style={{
                                            padding: '8px 24px', borderRadius: '20px', background: 'var(--success)',
                                            color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                                        }}
                                    >
                                        Approve Player
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', flexDirection: 'column', gap: '8px' }}>
                            <span>👉 Select a player from the list to review their registration details</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Reason Modal */}
            {showRejectModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-panel" style={{ padding: '24px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Flag / Reject Registration</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Reason for flag or rejection</label>
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="E.g. Incomplete document, age validation discrepancy, etc."
                                style={{
                                    height: '90px', padding: '10px 12px', borderRadius: '8px', border: 'var(--border)',
                                    background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', fontSize: '13px', resize: 'none', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                                style={{ padding: '6px 14px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                                style={{
                                    padding: '6px 16px', borderRadius: '20px', background: 'var(--danger)',
                                    color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    opacity: rejectionReason.trim() ? 1 : 0.5
                                }}
                            >
                                Submit Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Document Preview Modal */}
            {previewDoc && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '500px' }}>
                        {/* Document Sheet */}
                        <div style={{
                            background: '#fcfcf9', color: '#1c1917',
                            padding: '36px', borderRadius: '4px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            border: '12px double #d6d3d1',
                            fontFamily: 'Georgia, serif',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Watermark seal */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-12deg)',
                                fontSize: '80px', color: 'rgba(120,113,108,0.04)', fontWeight: '900', userSelect: 'none', pointerEvents: 'none',
                                textAlign: 'center', width: '100%'
                            }}>
                                OFFICIAL BSFL<br/>VALIDATED
                            </div>

                            {/* Header */}
                            <div style={{ textAlign: 'center', borderBottom: '2px solid #78716c', paddingBottom: '16px', marginBottom: '24px' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px', fontWeight: '800', textTransform: 'uppercase', color: '#44403c' }}>
                                    Barbados Schools Football League
                                </h2>
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#78716c', fontWeight: '600' }}>
                                    Eligibility Verification Services
                                </span>
                            </div>

                            {/* Title */}
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', textTransform: 'uppercase', color: '#78716c', textDecoration: 'underline' }}>
                                    {previewDoc.label}
                                </h3>
                            </div>

                            {/* Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6', color: '#44403c' }}>
                                <p style={{ margin: 0 }}>
                                    This certifies that the official record submitted for the participant below has been verified for league registration compatibility:
                                </p>
                                
                                <div style={{ background: '#f5f5f4', padding: '16px', borderRadius: '4px', border: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#78716c' }}>Full Name:</strong>
                                        <span style={{ fontWeight: '700' }}>{previewDoc.player.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#78716c' }}>Date of Birth:</strong>
                                        <span style={{ fontWeight: '700' }}>{previewDoc.player.dob}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#78716c' }}>Gender Division:</strong>
                                        <span style={{ fontWeight: '700' }}>{previewDoc.player.gender}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#78716c' }}>School Academy:</strong>
                                        <span style={{ fontWeight: '700' }}>{getSchoolName(previewDoc.player.schoolId)}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#78716c' }}>File Name:</div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>{previewDoc.filename}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', border: '2px dashed #a8a29e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', background: '#fafaf9', color: '#d97706', transform: 'rotate(-8deg)' }}>
                                            Seal
                                        </div>
                                        <div style={{ fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', fontWeight: 'bold', color: '#a8a29e' }}>BSFL REGISTRAR</div>
                                    </div>
                                </div>
                            </div>

                            {/* Barcode/Validation stamp */}
                            <div style={{ borderTop: '1px solid #e7e5e4', marginTop: '24px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#78716c', fontFamily: 'monospace' }}>
                                <span>STATUS: BSFL_VERIFIED</span>
                                <span>HASH: 8A9D92C4E5E1</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setPreviewDoc(null)}
                                style={{
                                    padding: '8px 32px', borderRadius: '24px', background: 'var(--primary)',
                                    color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                                }}
                            >
                                Close Document Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
