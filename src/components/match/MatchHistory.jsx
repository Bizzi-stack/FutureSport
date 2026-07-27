import React, { useState, useMemo } from 'react';
import { SCHOOLS, TEAMS } from '../../data/mockData';

const AGE_FILTERS = ['All', 'U14', 'U16', 'U19'];

function getTeamDisplayName(teamId) {
  const team = TEAMS.find(t => t.id === teamId);
  if (!team) return teamId;
  const school = SCHOOLS.find(s => s.id === team.schoolId);
  return school ? `${school.name} ${team.name}` : team.name;
}

function getSchoolLogo(teamId) {
  const team = TEAMS.find(t => t.id === teamId);
  if (!team) return null;
  const school = SCHOOLS.find(s => s.id === team.schoolId);
  return school ? school.logo : null;
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MatchHistory({ matches = [], onSelectMatch }) {
  const [ageFilter, setAgeFilter] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = useMemo(() => {
    let list = matches.filter(m => ['completed', 'refereed', 'approved'].includes(m.status));
    if (ageFilter !== 'All') {
      list = list.filter(m => m.ageGroup === ageFilter);
    }
    return list.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()));
  }, [matches, ageFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Match History
          </h2>
          <span style={{
            background: 'var(--primary-glow-sm)',
            color: 'var(--primary-light)',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '999px',
            border: 'var(--border)',
          }}>
            {filtered.length}
          </span>
        </div>

        {/* Age group filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {AGE_FILTERS.map(ag => {
            const active = ageFilter === ag;
            return (
              <button
                key={ag}
                onClick={() => setAgeFilter(ag)}
                style={{
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'var(--primary-glow-sm)' : 'rgba(255,255,255,0.04)',
                  color: active ? 'var(--primary-light)' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                {ag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Match list */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: 'var(--border)',
          borderRadius: '16px',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '2.5rem' }}>⚽</span>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No matches played yet
          </p>
          {ageFilter !== 'All' && (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Try changing the age group filter
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(match => {
            const hovered = hoveredId === match.id;
            const homeWin = match.homeScore > match.awayScore;
            const awayWin = match.awayScore > match.homeScore;
            const isDraw = match.homeScore === match.awayScore;

            const homeName = getTeamDisplayName(match.homeTeamId);
            const awayName = getTeamDisplayName(match.awayTeamId);
            const homeLogo = getSchoolLogo(match.homeTeamId);
            const awayLogo = getSchoolLogo(match.awayTeamId);

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch && onSelectMatch(match)}
                onMouseEnter={() => setHoveredId(match.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: hovered ? '1px solid var(--primary)' : 'var(--border)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: 'none',
                }}
              >
                {/* Top row: date + badges */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {formatDate(match.date)}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      background: 'var(--primary-glow-sm)',
                      color: 'var(--primary-light)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: 'var(--border)',
                    }}>
                      {match.ageGroup}
                    </span>
                    <span style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {match.matchday}
                    </span>
                    <span style={{
                      background: match.status === 'approved' ? 'rgba(16,185,129,0.1)' : match.status === 'refereed' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                      color: match.status === 'approved' ? 'var(--success)' : match.status === 'refereed' ? 'var(--primary-light)' : 'var(--warning)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: match.status === 'approved' ? '1px solid rgba(16,185,129,0.2)' : match.status === 'refereed' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(245,158,11,0.2)',
                      textTransform: 'uppercase'
                    }}>
                      {match.status === 'approved' ? 'Approved' : match.status === 'refereed' ? 'Refereed' : 'Pending Report'}
                    </span>
                  </div>
                </div>

                {/* Score row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                }}>
                  {/* Home team */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                  }}>
                    <span style={{
                      color: homeWin ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      fontWeight: homeWin ? 700 : 500,
                      textAlign: 'right',
                    }}>
                      {homeName}
                    </span>
                    {homeLogo && (
                      <img
                        src={homeLogo}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* Score */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '80px',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: homeWin ? '#22c55e' : 'var(--text-primary)',
                      minWidth: '24px',
                      textAlign: 'right',
                    }}>
                      {match.homeScore}
                    </span>
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}>
                      –
                    </span>
                    <span style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: awayWin ? '#22c55e' : 'var(--text-primary)',
                      minWidth: '24px',
                      textAlign: 'left',
                    }}>
                      {match.awayScore}
                    </span>
                  </div>

                  {/* Away team */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '10px',
                  }}>
                    {awayLogo && (
                      <img
                        src={awayLogo}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <span style={{
                      color: awayWin ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      fontWeight: awayWin ? 700 : 500,
                    }}>
                      {awayName}
                    </span>
                  </div>
                </div>

                {/* Result label */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '10px',
                }}>
                  {isDraw ? (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 10px',
                      borderRadius: '6px',
                    }}>
                      Draw
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#22c55e',
                      background: 'rgba(34,197,94,0.1)',
                      padding: '2px 10px',
                      borderRadius: '6px',
                    }}>
                      {homeWin ? homeName : awayName} win
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
