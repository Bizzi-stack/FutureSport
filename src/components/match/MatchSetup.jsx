import React, { useState, useMemo } from 'react';
import { SCHOOLS, TEAMS, AGE_GROUPS, TERMS, getTeamStudents } from '../../data/mockData';
import CustomSelect from '../CustomSelect';

const AGE_GROUP_META = {
  U14: { label: 'U14', icon: '🌱', desc: 'Under 14s', color: '#10b981' },
  U16: { label: 'U16', icon: '⚡', desc: 'Under 16s', color: '#3b82f6' },
  U19: { label: 'U19', icon: '🔥', desc: 'Under 19s', color: '#f59e0b' },
};

export default function MatchSetup({ allStudents, year, matchday: initialMatchday, onStartMatch, matches }) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchday, setMatchday] = useState(initialMatchday || TERMS[0]);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  const [fixturesDivisionFilter, setFixturesDivisionFilter] = useState('ALL');

  // Teams for the selected age group
  const ageGroupTeams = useMemo(() => {
    if (!selectedAgeGroup) return [];
    return TEAMS.filter(t => t.ageGroup === selectedAgeGroup);
  }, [selectedAgeGroup]);

  // Rosters
  const homePlayers = useMemo(() => {
    if (!homeTeamId || !year) return [];
    return getTeamStudents(allStudents, homeTeamId, year);
  }, [allStudents, homeTeamId, year]);

  const awayPlayers = useMemo(() => {
    if (!awayTeamId || !year) return [];
    return getTeamStudents(allStudents, awayTeamId, year);
  }, [allStudents, awayTeamId, year]);

  // School lookup helpers
  const getSchool = (teamId) => {
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return null;
    return SCHOOLS.find(s => s.id === team.schoolId);
  };

  const handleAgeGroupSelect = (ag) => {
    setSelectedAgeGroup(ag);
    setHomeTeamId('');
    setAwayTeamId('');
    setSelectedFixtureId(null);
  };

  const canKickOff = homeTeamId && awayTeamId && homeTeamId !== awayTeamId && matchday;

  const handleKickOff = () => {
    if (!canKickOff) return;
    const selectedFixture = (matches || []).find(m => m.id === selectedFixtureId);
    onStartMatch({
      id: selectedFixtureId, // Pass the scheduled match ID if selected
      homeTeamId,
      awayTeamId,
      homePlayers: homePlayers.map(p => p.id),
      awayPlayers: awayPlayers.map(p => p.id),
      ageGroup: selectedAgeGroup,
      matchday,
      homeSquadSelection: selectedFixture?.homeSquadSelection || null,
      awaySquadSelection: selectedFixture?.awaySquadSelection || null,
    });
  };

  // ── Styles ──────────────────────────────────────────────────────
  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px 16px',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: 'var(--text-primary)',
      marginBottom: '6px',
    },
    subtitle: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
    },

    // ── Setup Selection Card ──
    setupCard: {
      background: 'var(--bg-card)',
      border: 'var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: 'var(--shadow-sm)',
    },
    setupCardTitle: {
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-muted)',
      marginBottom: '16px',
    },
    matchdaySelect: {
      padding: '8px 16px',
      fontSize: '13px',
      fontFamily: 'inherit',
      fontWeight: '600',
      background: 'var(--bg-input)',
      border: 'var(--border)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      outline: 'none',
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238899bb' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: '36px',
    },

    // ── Team Picker Area ──
    versusLayout: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: '20px',
      marginBottom: '32px',
      flexWrap: 'wrap',
    },
    teamPickerCard: {
      flex: '1 1 340px',
      maxWidth: '460px',
      background: 'var(--bg-card)',
      border: 'var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    teamPickerAccent: (side) => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: side === 'home' ? 'var(--primary)' : 'var(--warning)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
    }),
    teamPickerLabel: {
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-muted)',
      marginBottom: '16px',
    },
    teamSelect: {
      width: '100%',
      padding: '12px 14px',
      fontSize: '14px',
      fontFamily: 'inherit',
      fontWeight: '600',
      background: 'var(--bg-input)',
      border: 'var(--border)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      outline: 'none',
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238899bb' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 14px center',
      paddingRight: '36px',
    },

    // ── Selected Team Display ──
    selectedTeamBanner: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      marginTop: '16px',
      padding: '12px 16px',
      background: 'var(--bg-card-hover)',
      borderRadius: 'var(--radius-md)',
      border: 'var(--border)',
    },
    teamLogo: {
      width: '36px',
      height: '36px',
      borderRadius: '6px',
      objectFit: 'contain',
      background: 'rgba(255,255,255,0.06)',
      padding: '4px',
    },
    teamName: {
      fontSize: '15px',
      fontWeight: '700',
      color: 'var(--text-primary)',
    },
    teamAgeGroup: {
      fontSize: '11px',
      fontWeight: '600',
      color: 'var(--text-secondary)',
      marginTop: '2px',
    },

    // ── VS Divider ──
    vsDivider: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      fontSize: '14px',
      fontWeight: '800',
      color: 'var(--text-muted)',
      padding: '10px 16px',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(255,255,255,0.02)',
      border: 'var(--border)',
      flexShrink: 0,
    },

    // ── Roster ──
    rosterSection: {
      marginTop: '20px',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    },
    rosterTitle: {
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-muted)',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    rosterCount: {
      fontSize: '11px',
      fontWeight: '600',
      color: 'var(--primary-light)',
      background: 'var(--primary-glow-sm)',
      padding: '2px 8px',
      borderRadius: '20px',
    },
    rosterList: {
      maxHeight: '260px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: 'var(--radius-md)',
      padding: '8px',
      border: 'var(--border)',
    },
    playerRow: (idx) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: 'var(--radius-sm)',
      background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
    }),
    playerName: {
      fontSize: '13px',
      fontWeight: '500',
      color: 'var(--text-primary)',
    },
    jerseyBadge: {
      fontSize: '11px',
      fontWeight: '700',
      color: 'var(--text-secondary)',
      background: 'var(--bg-input)',
      padding: '2px 8px',
      borderRadius: '4px',
      minWidth: '28px',
      textAlign: 'center',
    },

    // ── Kick Off Button ──
    kickOffRow: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '24px',
    },
    kickOffBtn: (enabled) => ({
      padding: '12px 48px',
      fontSize: '15px',
      fontWeight: '700',
      fontFamily: 'inherit',
      background: enabled ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
      color: enabled ? '#ffffff' : 'var(--text-muted)',
      border: 'none',
      borderRadius: '24px',
      cursor: enabled ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s ease',
      boxShadow: enabled ? 'var(--shadow-md)' : 'none',
    }),

    // ── Empty State ──
    emptyHint: {
      textAlign: 'center',
      padding: '48px 24px',
      color: 'var(--text-muted)',
      fontSize: '14px',
      background: 'var(--bg-card)',
      border: 'var(--border)',
      borderRadius: 'var(--radius-lg)',
    },
  };

  // ── Render helpers ──────────────────────────────────────────────

  const renderAgeGroupSelector = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {AGE_GROUPS.map(ag => {
        const meta = AGE_GROUP_META[ag.ageGroup];
        const isSelected = selectedAgeGroup === ag.ageGroup;
        return (
          <button
            key={ag.ageGroup}
            type="button"
            onClick={() => handleAgeGroupSelect(ag.ageGroup)}
            style={{
              fontFamily: 'inherit',
              cursor: 'pointer',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '20px',
              border: 'none',
              background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderTeamPicker = (side) => {
    const currentId = side === 'home' ? homeTeamId : awayTeamId;
    const players = side === 'home' ? homePlayers : awayPlayers;
    const school = getSchool(currentId);

    return (
      <div style={styles.teamPickerCard}>
        <div style={styles.teamPickerAccent(side)} />
        <div style={styles.teamPickerLabel}>
          {side === 'home' ? '🏠 Home Team' : '✈️ Away Team'}
        </div>

        {school && (
          <div style={styles.selectedTeamBanner}>
            <img
              src={school.logo}
              alt={school.name}
              style={styles.teamLogo}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div>
              <div style={styles.teamName}>{school.name}</div>
              <div style={styles.teamAgeGroup}>{selectedAgeGroup} Squad</div>
            </div>
          </div>
        )}

        {currentId && players.length > 0 && (() => {
          // Check if the selected fixture has a coach squad selection
          const selectedFixture = (matches || []).find(m => m.id === selectedFixtureId);
          const isHome = currentId === homeTeamId;
          const squadKey = isHome ? 'homeSquadSelection' : 'awaySquadSelection';
          const coachSquad = selectedFixture?.[squadKey];

          return (
            <div style={styles.rosterSection}>
              <div style={styles.rosterTitle}>
                <span>Squad</span>
                <span style={styles.rosterCount}>{players.length}</span>
              </div>
              {coachSquad && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '8px', fontSize: '11px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--success)' }}>✓ Coach Submitted ({coachSquad.formation})</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>• {coachSquad.startingXI?.length || 0} starters, {coachSquad.benchPlayers?.length || 0} bench</span>
                </div>
              )}
              <div style={styles.rosterList}>
                {coachSquad ? (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--success)', marginTop: '8px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⚽</span>
                      <span>Starting XI ({coachSquad.formation})</span>
                    </div>
                    {coachSquad.startingXI?.filter(Boolean).map((pid, idx) => {
                      const p = players.find(player => player.id === pid);
                      if (!p) return null;
                      return (
                        <div key={p.id} style={{ ...styles.playerRow(idx), borderLeft: '3px solid var(--success)' }}>
                          <span style={styles.playerName}>{p.name}</span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px' }}>XI</span>
                            {p.jerseyNumber != null && (
                              <span style={styles.jerseyBadge}>#{p.jerseyNumber}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {coachSquad.benchPlayers?.length > 0 && (
                      <>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--warning)', marginTop: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📋</span>
                          <span>Substitute Bench</span>
                        </div>
                        {coachSquad.benchPlayers.map((pid, idx) => {
                          const p = players.find(player => player.id === pid);
                          if (!p) return null;
                          return (
                            <div key={p.id} style={{ ...styles.playerRow(idx), borderLeft: '3px solid var(--warning)' }}>
                              <span style={styles.playerName}>{p.name}</span>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: '4px' }}>BENCH</span>
                                {p.jerseyNumber != null && (
                                  <span style={styles.jerseyBadge}>#{p.jerseyNumber}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {(() => {
                      const startersSet = new Set(coachSquad.startingXI);
                      const benchSet = new Set(coachSquad.benchPlayers);
                      const reserves = players.filter(p => !startersSet.has(p.id) && !benchSet.has(p.id));
                      if (reserves.length === 0) return null;
                      return (
                        <>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>👥</span>
                            <span>Reserves / Unassigned</span>
                          </div>
                          {reserves.map((p, idx) => (
                            <div key={p.id} style={{ ...styles.playerRow(idx), opacity: 0.5 }}>
                              <span style={styles.playerName}>{p.name}</span>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {p.jerseyNumber != null && (
                                  <span style={styles.jerseyBadge}>#{p.jerseyNumber}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  players.map((p, idx) => (
                    <div key={p.id} style={styles.playerRow(idx)}>
                      <span style={styles.playerName}>{p.name}</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {p.jerseyNumber != null && (
                          <span style={styles.jerseyBadge}>#{p.jerseyNumber}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {currentId && players.length === 0 && (
          <div style={{ ...styles.emptyHint, padding: '24px 0', fontSize: 13, background: 'transparent', border: 'none' }}>
            No players found for this team in {year}
          </div>
        )}
      </div>
    );
  };

  const getSchoolName = (teamId) => {
    const school = getSchool(teamId);
    return school ? school.name : teamId;
  };

  const scheduledFixtures = useMemo(() => {
    const list = (matches || []).filter(m => m.status === 'scheduled');
    if (fixturesDivisionFilter === 'ALL') return list;
    return list.filter(m => m.ageGroup === fixturesDivisionFilter);
  }, [matches, fixturesDivisionFilter]);

  const handleSelectFixture = (fixture) => {
    setSelectedFixtureId(fixture.id);
    setSelectedAgeGroup(fixture.ageGroup);
    setHomeTeamId(fixture.homeTeamId);
    setAwayTeamId(fixture.awayTeamId);
    setMatchday(fixture.matchday);
  };

  // ── Main Render ─────────────────────────────────────────────────

  const selectedFixture = (matches || []).find(m => m.id === selectedFixtureId);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Match Centre Setup</div>
        <div style={styles.subtitle}>Kick off scheduled league fixtures set up by the Match Commissioner</div>
      </div>

      {/* Fixtures list state (when no fixture is selected) */}
      {!selectedFixtureId && (
        <div style={{ marginBottom: '32px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
              📅 Scheduled League Fixtures
            </h3>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '20px', border: 'var(--border)' }}>
              {['ALL', 'U14', 'U16', 'U19'].map(div => (
                <button
                  key={div}
                  onClick={() => setFixturesDivisionFilter(div)}
                  style={{
                    padding: '4px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: '700', border: 'none', cursor: 'pointer',
                    background: fixturesDivisionFilter === div ? 'var(--primary)' : 'transparent',
                    color: fixturesDivisionFilter === div ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  {div === 'ALL' ? 'All Divisions' : div}
                </button>
              ))}
            </div>
          </div>
          
          {scheduledFixtures.length === 0 ? (
            <div style={{ ...styles.emptyHint, padding: '48px 24px', background: 'transparent', border: 'none' }}>
              📅 No scheduled matches available.<br />
              <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px', display: 'inline-block' }}>
                Please contact the Match Commissioner to schedule fixtures.
              </span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {scheduledFixtures.map(fixture => (
                <div
                  key={fixture.id}
                  style={{
                    padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: 'var(--border)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>
                    <span>{fixture.ageGroup} Division</span>
                    <span>{fixture.matchday}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getSchoolName(fixture.homeTeamId)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>vs</span>
                    <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getSchoolName(fixture.awayTeamId)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🏟️ Venue: {fixture.venue}</div>
                  <button
                    onClick={() => handleSelectFixture(fixture)}
                    style={{
                      marginTop: '4px', padding: '8px 12px', borderRadius: '20px', border: 'none', background: 'rgba(37,99,235,0.15)',
                      color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}
                  >
                    Select &amp; Verify Match 📋
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roster verification state (when a fixture has been selected) */}
      {selectedFixtureId && selectedFixture && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => {
                setSelectedFixtureId(null);
                setSelectedAgeGroup(null);
                setHomeTeamId('');
                setAwayTeamId('');
              }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: 'var(--border)',
                borderRadius: '20px',
                padding: '6px 16px',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              ← Back to Fixtures List
            </button>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
              🏟️ Venue: <span style={{ color: 'var(--text-primary)' }}>{selectedFixture.venue}</span>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
            Verify Team Rosters &amp; Kick Off
          </div>
          
          <div style={styles.versusLayout}>
            {renderTeamPicker('home')}
            <div style={styles.vsDivider}>VS</div>
            {renderTeamPicker('away')}
          </div>

          <div style={styles.kickOffRow}>
            <button
              style={styles.kickOffBtn(canKickOff)}
              disabled={!canKickOff}
              onClick={handleKickOff}
            >
              Start Match ⚽
            </button>
          </div>
        </>
      )}
    </div>
  );
}
