import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SCHOOLS } from '../data/mockData';
import { getAnalystAccounts } from '../data/analystAccounts';
import DotField from './DotField';
import './landing.css';

const SparklesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18"/><path d="M3 12h18"/><path d="M16 16l-8-8"/><path d="M16 8l-8 8"/>
  </svg>
);

const AdminLandingPage = ({ 
  onLogin, 
  allTeams = [], 
  allSchools = [], 
  pmcTeams = [], 
  pmcSchools = [], 
  nsslTeams = [], 
  nsslSchools = [],
  selectedTournament = 'PMC',
  setSelectedTournament = () => {}
}) => {
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const analystAccounts = useMemo(() => getAnalystAccounts(), []);
  const [selectedAnalystId, setSelectedAnalystId] = useState(analystAccounts[0]?.id || 'analyst_1');
  const [deepLinkedMatchId, setDeepLinkedMatchId] = useState(null);
  
  const activeTeamsList = useMemo(() => {
    return selectedTournament === 'PMC' ? (pmcTeams.length ? pmcTeams : allTeams) : (nsslTeams.length ? nsslTeams : allTeams);
  }, [selectedTournament, pmcTeams, nsslTeams, allTeams]);

  const activeSchoolsList = useMemo(() => {
    return selectedTournament === 'PMC' ? (pmcSchools.length ? pmcSchools : allSchools) : (nsslSchools.length ? nsslSchools : allSchools);
  }, [selectedTournament, pmcSchools, nsslSchools, allSchools]);

  const [selectedTeam, setSelectedTeam] = useState(activeTeamsList[0]?.id || '');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamComboboxRef = useRef(null);

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check URL query parameters for deep linking (e.g. from email notifications)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const analystIdParam = params.get('analystId');
      const analystEmailParam = params.get('analystEmail');
      const matchIdParam = params.get('matchId');

      if (roleParam) {
        setSelectedRole(roleParam);
      }
      if (matchIdParam) {
        setDeepLinkedMatchId(matchIdParam);
      }
      if (analystIdParam) {
        setSelectedAnalystId(analystIdParam);
      } else if (analystEmailParam) {
        const found = analystAccounts.find(a => a.email.toLowerCase() === analystEmailParam.toLowerCase());
        if (found) setSelectedAnalystId(found.id);
      }
    } catch { /* ignored */ }
  }, [analystAccounts]);

  // Update default selected team and sanitize selectedRole when tournament mode switches
  useEffect(() => {
    if (activeTeamsList.length > 0) {
      setSelectedTeam(activeTeamsList[0].id);
      setTeamSearchQuery('');
    }
    if (selectedTournament === 'PMC') {
      if (['school_admin', 'league_admin', 'commissioner'].includes(selectedRole)) {
        setSelectedRole('coach');
      }
    }
  }, [selectedTournament, activeTeamsList]);

  // Handle outside click to close team dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (teamComboboxRef.current && !teamComboboxRef.current.contains(e.target)) {
        setIsTeamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getTeamLabel = (team) => {
    if (!team) return '';
    const school = activeSchoolsList.find(s => s.id === team.schoolId);
    return school ? `${school.name} - ${team.name || team.ageGroup}` : (team.name || team.ageGroup);
  };

  const selectedTeamObj = useMemo(() => {
    const team = activeTeamsList.find(t => t.id === selectedTeam);
    if (!team) return null;
    const school = activeSchoolsList.find(s => s.id === team.schoolId);
    return { ...team, school };
  }, [activeTeamsList, activeSchoolsList, selectedTeam]);

  const filteredTeamsList = useMemo(() => {
    if (!teamSearchQuery.trim()) return activeTeamsList;
    const q = teamSearchQuery.toLowerCase();
    return activeTeamsList.filter(team => {
      const school = activeSchoolsList.find(s => s.id === team.schoolId);
      const label = school ? `${school.name} ${team.name || team.ageGroup}` : (team.name || team.ageGroup);
      return label.toLowerCase().includes(q);
    });
  }, [activeTeamsList, activeSchoolsList, teamSearchQuery]);

  const handleSelectTeam = (teamId) => {
    setSelectedTeam(teamId);
    setIsTeamDropdownOpen(false);
    setTeamSearchQuery('');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedAnalystObj = selectedRole === 'statistician' 
      ? (analystAccounts.find(a => a.id === selectedAnalystId) || analystAccounts[0])
      : null;

    if (password === 'password' || (selectedAnalystObj && password === selectedAnalystObj.password)) {
      setError('');
      onLogin(selectedRole, selectedRole === 'coach' ? selectedTeam : null, selectedAnalystObj, deepLinkedMatchId); 
    } else {
      setError('Invalid password.');
    }
  };

  return (
    <div className="admin-landing-page" style={{ position: 'relative', width: '100vw', minHeight: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#030712' }}>
      
      {/* Interactive DotField Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}>
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={75}
          glowRadius={180}
          sparkle={true}
          waveAmplitude={3}
          gradientFrom="rgba(99, 102, 241, 0.4)"
          gradientTo="rgba(168, 85, 247, 0.2)"
          glowColor="#090514"
        />
      </div>

      {/* Foreground Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh', pointerEvents: 'none' }}>
        


        {/* Hero Section Container */}
        <div className="hero-container" style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 80px', gap: '40px' }}>
          <div className="hero-text" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', pointerEvents: 'auto' }}>
            




            {/* Glassmorphic Login Card */}
            <div className="login-card-wrapper" style={{ margin: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>


              {error && (
                <div style={{
                  color: '#f43f5e',
                  backgroundColor: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Tournament Selector */}
                <div className="login-form-group" style={{ marginBottom: '4px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Tournament Competition
                  </label>
                  <div style={{ display: 'flex', gap: '8px', background: 'rgba(3, 7, 18, 0.65)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTournament('PMC')}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '800',
                        background: selectedTournament === 'PMC' ? '#FFC726' : 'transparent',
                        color: selectedTournament === 'PMC' ? '#00267F' : 'rgba(255, 255, 255, 0.7)',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      🏆 Prime Minister's Cup
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTournament('NSSL')}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '800',
                        background: selectedTournament === 'NSSL' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: selectedTournament === 'NSSL' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      ⚽ National League
                    </button>
                  </div>
                </div>

                <div className="login-form-group" style={{ marginBottom: '4px' }}>
                  <label htmlFor="role-select" style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Select Portal Role</label>
                  <select 
                    id="role-select"
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)} 
                    style={{ 
                      width: '100%',
                      height: '42px', 
                      padding: '0 12px',
                      borderRadius: '8px',
                      fontSize: '14px', 
                      background: 'rgba(3, 7, 18, 0.65)', 
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="super_admin">
                      {selectedTournament === 'PMC' ? "🏆 PMC Tournament Director / Super Admin" : "🏫 Schools League Super Administrator"}
                    </option>
                    {selectedTournament !== 'PMC' && <option value="league_admin">League Administrator</option>}
                    {selectedTournament !== 'PMC' && <option value="school_admin">School Administrator</option>}
                    <option value="coach">Coach / Team Manager</option>
                    <option value="referee">Referee</option>
                    <option value="fourth_official">Fourth Official</option>
                    <option value="statistician">Statistician (Live Data Entry)</option>
                    {selectedTournament !== 'PMC' && <option value="commissioner">Match Commissioner</option>}
                  </select>
                </div>

                {selectedRole === 'coach' && (
                  <div className="login-form-group" ref={teamComboboxRef} style={{ marginBottom: '4px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Select Your Team / Club
                    </label>
                    
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      {selectedTeamObj && selectedTeamObj.school?.logo && !isTeamDropdownOpen && (
                        <img 
                          src={selectedTeamObj.school.logo} 
                          alt="" 
                          style={{ position: 'absolute', left: '12px', width: '22px', height: '22px', objectFit: 'contain', pointerEvents: 'none' }} 
                        />
                      )}
                      <input
                        type="text"
                        value={isTeamDropdownOpen ? teamSearchQuery : (selectedTeamObj ? getTeamLabel(selectedTeamObj) : teamSearchQuery)}
                        onFocus={() => {
                          setIsTeamDropdownOpen(true);
                          setTeamSearchQuery('');
                        }}
                        onChange={(e) => {
                          setTeamSearchQuery(e.target.value);
                          setIsTeamDropdownOpen(true);
                        }}
                        placeholder="Type club name (e.g. UWI, Wotton, Notre Dame...)"
                        style={{
                          width: '100%',
                          height: '42px',
                          paddingLeft: (selectedTeamObj && selectedTeamObj.school?.logo && !isTeamDropdownOpen) ? '42px' : '14px',
                          paddingRight: '32px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: 'rgba(3, 7, 18, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          outline: 'none'
                        }}
                      />
                      <span style={{ position: 'absolute', right: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', pointerEvents: 'none' }}>
                        ▼
                      </span>
                    </div>

                    {isTeamDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        background: '#0b1120',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '10px',
                        zIndex: 1000,
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8)',
                        padding: '6px'
                      }}>
                        {filteredTeamsList.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                            No matching teams found
                          </div>
                        ) : (
                          filteredTeamsList.map(team => {
                            const school = activeSchoolsList.find(s => s.id === team.schoolId);
                            const isSelected = selectedTeam === team.id;
                            return (
                              <div
                                key={team.id}
                                onClick={() => handleSelectTeam(team.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(255, 199, 38, 0.15)' : 'transparent',
                                  color: isSelected ? '#FFC726' : '#ffffff',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                {school?.logo && (
                                  <img src={school.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{school ? school.name : 'Club'}</span>
                                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{team.name || team.ageGroup}</span>
                                </div>
                                {isSelected && <span style={{ fontSize: '12px', fontWeight: '800' }}>✓</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Dedicated Analyst Account Selector */}
                {selectedRole === 'statistician' && (
                  <div className="login-form-group" style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Select Analyst Account
                      </label>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', background: 'rgba(56,189,248,0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                        5 Registered Profiles
                      </span>
                    </div>

                    <select
                      value={selectedAnalystId}
                      onChange={(e) => setSelectedAnalystId(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: 'rgba(3, 7, 18, 0.65)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {analystAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.avatar} {a.name} ({a.email}) · {a.venue}
                        </option>
                      ))}
                    </select>

                    {/* Quick switch chips for seamless testing */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {analystAccounts.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedAnalystId(a.id)}
                          style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700',
                            background: selectedAnalystId === a.id ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.03)',
                            color: selectedAnalystId === a.id ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                            border: selectedAnalystId === a.id ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer'
                          }}
                        >
                          {a.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deep Link Match Alert Notification */}
                {deepLinkedMatchId && selectedRole === 'statistician' && (
                  <div style={{
                    padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                    color: '#4ade80', fontSize: '11.5px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <span>🔗</span> Deep Link Activated: Auto-routing to assigned match upon sign-in.
                  </div>
                )}

                <div className="login-form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="password-input" style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Password</label>
                  <input 
                    type="password" 
                    id="password-input"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    style={{ height: '42px', fontSize: '14px', background: 'rgba(3, 7, 18, 0.45)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                </div>



                <button type="submit" className="submit" style={{ height: '44px', fontSize: '14px', fontWeight: '700', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', marginTop: 0 }}>
                  Log in to Dashboard
                </button>

              </form>
            </div>



          </div>



        </div>

      </div>
    </div>
  );
};

export default AdminLandingPage;
