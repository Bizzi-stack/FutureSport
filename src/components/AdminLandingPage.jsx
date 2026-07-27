import React, { useState } from 'react';
import { SCHOOLS } from '../data/mockData';
import DotField from './DotField';
import './landing.css';

const SparklesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18"/><path d="M3 12h18"/><path d="M16 16l-8-8"/><path d="M16 8l-8 8"/>
  </svg>
);

const AdminLandingPage = ({ onLogin, allTeams = [], allSchools = [] }) => {
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [selectedTeam, setSelectedTeam] = useState(allTeams[0]?.id || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'password') {
      setError('');
      onLogin(selectedRole, selectedRole === 'coach' ? selectedTeam : null); 
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
                    <option value="super_admin">Super Administrator</option>
                    <option value="league_admin">League Administrator</option>
                    <option value="school_admin">School Administrator</option>
                    <option value="coach">Coach / Team Manager</option>
                    <option value="referee">Referee</option>
                    <option value="fourth_official">Fourth Official</option>
                    <option value="statistician">Statistician (Live Data Entry)</option>
                    <option value="commissioner">Match Commissioner</option>
                  </select>
                </div>

                {selectedRole === 'coach' && (
                  <div className="login-form-group" style={{ marginBottom: '4px' }}>
                    <label htmlFor="team-select" style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Select Your Team</label>
                    <select 
                      id="team-select"
                      value={selectedTeam} 
                      onChange={(e) => setSelectedTeam(e.target.value)} 
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
                      {allTeams.map(team => {
                        const school = allSchools.find(s => s.id === team.schoolId);
                        return (
                          <option key={team.id} value={team.id}>
                            {school ? school.name : 'Unknown'} - {team.name || team.ageGroup}
                          </option>
                        );
                      })}
                    </select>
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
