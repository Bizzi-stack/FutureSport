# Relevant Code Extracts & Implementation Reference

This document provides exact, sanitized code excerpts from the codebase illustrating the complete lifecycle of match data: action logging, undo mechanisms, score derivations, goalkeeper saves, end-game calculations, and persistence.

---

## 1. Action Recording

### A. Tile Click & Action Scoping (`src/components/match/TileDataCaptureControlPanel.jsx`)
```javascript
// Lines 205-244
const executeLogForPlayer = (player, actionKey) => {
    const isShotAction = ['goal', 'shotOnTarget', 'shotBlocked', 'shotMissed', 'headerShot', 'penaltyShot', 'freekickShot', 'ownGoal'].includes(actionKey);
    const isActionEnabled = isShotAction ? isShotsEnabled : isGeneralEnabled;
    if (!isActionEnabled) return;

    const student = resolvePlayer(player.id, [], studentsById);
    const name = resolvePlayerName(student || player, [], studentsById);
    const teamSide = player.team || (homePlayers.includes(player.id) ? 'home' : 'away');

    if (isShotAction && onShotModal) {
        let defaultGoalType = 'foot';
        let defaultResult = 'goal';

        if (actionKey === 'headerShot') defaultGoalType = 'header';
        if (actionKey === 'penaltyShot') defaultGoalType = 'penalty';
        if (actionKey === 'freekickShot') defaultGoalType = 'freekick';
        if (actionKey === 'ownGoal') defaultGoalType = 'own-goal';

        if (actionKey === 'shotOnTarget') defaultResult = 'saved';
        if (actionKey === 'shotBlocked') defaultResult = 'blocked';
        if (actionKey === 'shotMissed') defaultResult = 'miss';

        onShotModal({ ...player, name, team: teamSide }, defaultGoalType, defaultResult);
        setPendingAction(null);
        return;
    }

    // Direct Quick Log for General Events (Cards, Fouls, Corners)
    if (onQuickLogEvent) {
        onQuickLogEvent({
            type: actionKey,
            playerId: player.id,
            playerName: name,
            team: teamSide
        });
    }

    triggerToast(`Logged ${actionKey} for ${name}`);
    setPendingAction(null);
};
```

### B. Direct Quick Action Logging (`src/components/match/LiveMatch.jsx`)
```javascript
// Lines 581-667
const handleQuickAction = useCallback((playerId, actionKey) => {
    // Role-based filtering
    if (captureRole === 'possession') return;
    const isShotAction = ['goal', 'shotOnTarget', 'shotMissed', 'shotBlocked', 'headerShot', 'penaltyShot', 'freekickShot', 'ownGoal'].includes(actionKey);
    if (captureRole === 'shots' && !isShotAction) return;
    if (captureRole === 'general' && isShotAction) return;

    const student = resolvePlayer(playerId, allStudents, studentsById);
    const name = resolvePlayerName(playerId, allStudents, studentsById);
    const isHome = homePlayers.includes(playerId);
    const teammates = isHome 
        ? homePlayers.map(id => resolvePlayer(id, allStudents, studentsById)).filter(Boolean)
        : awayPlayers.map(id => resolvePlayer(id, allStudents, studentsById)).filter(Boolean);

    if (isShotAction) {
        let defaultGoalType = 'foot';
        let defaultOutcome = 'goal';

        if (actionKey === 'headerShot') defaultGoalType = 'header';
        if (actionKey === 'penaltyShot') defaultGoalType = 'penalty';
        if (actionKey === 'freekickShot') defaultGoalType = 'freekick';
        if (actionKey === 'ownGoal') defaultGoalType = 'own-goal';

        if (actionKey === 'shotOnTarget') defaultOutcome = 'saved';
        if (actionKey === 'shotBlocked') defaultOutcome = 'blocked';
        if (actionKey === 'shotMissed') defaultOutcome = 'miss';

        // Opens the interactive Goalmouth Modal
        setShotModalData({
            player: { id: playerId, name },
            defaultOutcome: defaultOutcome,
            defaultGoalType: defaultGoalType,
            teammates
        });
    } else {
        // Immediate timeline & player stat commit
        const elapsedMins = Math.floor(elapsed / 60) + 1;
        const newEvent = {
            id: `event-${Date.now()}`,
            elapsed: elapsed,
            minute: elapsedMins,
            period: period,
            type: actionKey,
            playerId,
            playerName: name,
            team: isHome ? 'home' : 'away',
            teamId: isHome ? matchData.homeTeamId : matchData.awayTeamId,
            teamName: isHome ? home.name : away.name
        };

        setTimeline(prev => [...prev, newEvent]);

        setPlayerStats(prev => {
            const ps = { ...prev };
            if (!ps[playerId]) ps[playerId] = initPlayerStats([playerId], isHome ? 'home' : 'away')[playerId];
            ps[playerId] = { ...ps[playerId] };

            if (actionKey === 'assist') ps[playerId].Assists = (ps[playerId].Assists || 0) + 1;
            if (actionKey === 'yellowCard') ps[playerId].yellowCards = (ps[playerId].yellowCards || 0) + 1;
            if (actionKey === 'redCard') ps[playerId].redCards = (ps[playerId].redCards || 0) + 1;
            if (actionKey === 'corner') ps[playerId]['Corners Taken'] = (ps[playerId]['Corners Taken'] || 0) + 1;
            if (actionKey === 'foul') ps[playerId]['Fouls Committed'] = (ps[playerId]['Fouls Committed'] || 0) + 1;

            return ps;
        });
    }
}, [elapsed, homePlayers, awayPlayers, studentsById, period, matchData.homeTeamId, matchData.awayTeamId, home.name, away.name, allStudents, captureRole]);
```

---

## 2. Shot & Save Recording (Failure Point for GK Saves)

### A. Saving Shots & Auto-Attributing Saves (`src/components/match/LiveMatch.jsx`)
```javascript
// Lines 671-775
const handleSaveShot = (shotData) => {
    if (!shotModalData) return;
    const { player } = shotModalData;
    const playerId = player.id;
    const isHome = homePlayers.includes(playerId);
    const { result, goalType, x, y, assistPlayerId } = shotData;

    const eventId = `event-${Date.now()}`;
    const elapsedMins = Math.floor(elapsed / 60) + 1;
    
    // Add shot event to timeline
    const eventType = result === 'goal' ? 'goal' : result === 'saved' ? 'shotOnTarget' : result === 'blocked' ? 'shotBlocked' : 'shotMissed';
    const assistPlayer = assistPlayerId ? resolvePlayer(assistPlayerId, allStudents, studentsById) : null;
    const assistPlayerName = assistPlayer ? resolvePlayerName(assistPlayer, allStudents, studentsById) : null;
    const resolvedShooterName = resolvePlayerName(player || playerId, allStudents, studentsById);

    const newEvent = {
        id: eventId,
        elapsed: elapsed,
        minute: elapsedMins,
        period: period,
        type: eventType,
        result: result,
        outcome: result === 'goal' ? 'Goal' : result === 'saved' ? 'Saved' : result === 'blocked' ? 'Blocked' : 'Off Target',
        playerId,
        playerName: resolvedShooterName,
        team: isHome ? 'home' : 'away',
        teamId: isHome ? matchData.homeTeamId : matchData.awayTeamId,
        teamName: isHome ? home.name : away.name,
        x: Math.round(x),
        y: Math.round(y),
        goalType: goalType || 'foot',
        shotType: goalType || 'foot',
        assistingPlayerId: assistPlayerId || null,
        assistingPlayerName: assistPlayerName || null
    };

    setTimeline(prev => [...prev, newEvent]);

    // Push shot log to student profile for shot map history
    const shooter = studentsById[playerId];
    if (shooter) {
        if (!shooter.shotLogs) shooter.shotLogs = [];
        shooter.shotLogs.push({
            id: `shot-${Date.now()}`,
            result: result,
            goalType: goalType,
            x: Math.round(x),
            y: Math.round(y),
            timestamp: Date.now()
        });
    }

    // Update player statistics
    setPlayerStats(prev => {
        const ps = { ...prev };
        
        // Scorer update
        if (!ps[playerId]) ps[playerId] = initPlayerStats([playerId], isHome ? 'home' : 'away')[playerId];
        const s = { ...ps[playerId] };

        if (result === 'goal') {
            if (goalType === 'own-goal') {
                s.ownGoals += 1;
            } else {
                s.Goals += 1;
                s['Shots on Target'] += 1;
                s.Shots += 1;
            }
        } else if (result === 'saved') {
            s['Shots on Target'] += 1;
            s.Shots += 1;

            // BUG IDENTIFIED: It pushes to in-memory studentsById, but does NOT increment ps[oppGkId].Saves!
            const oppPlayers = isHome ? awayPlayers : homePlayers;
            const oppGkId = oppPlayers.find(id => studentsById[id]?.position === 'Goalkeeper');
            if (oppGkId && studentsById[oppGkId]) {
                const oppGk = studentsById[oppGkId];
                if (!oppGk.saveLogs) oppGk.saveLogs = [];
                oppGk.saveLogs.push({
                    id: `gk-sv-${Date.now()}`,
                    year: '2024-2025',
                    term: 'Matchday 3',
                    result: 'save',
                    saveType: goalType === 'penalty' ? 'penalty' : goalType === 'freekick' ? 'freekick' : 'normal',
                    x: Math.round(x),
                    y: Math.round(y),
                    timestamp: Date.now()
                });
            }
            // MISSING:
            // if (oppGkId) {
            //     if (!ps[oppGkId]) ps[oppGkId] = initPlayerStats([oppGkId], isHome ? 'away' : 'home')[oppGkId];
            //     ps[oppGkId] = { ...ps[oppGkId], Saves: (ps[oppGkId].Saves || 0) + 1 };
            // }
        } else if (result === 'blocked') {
            s['Blocked Shots'] = (s['Blocked Shots'] || 0) + 1;
            s.Shots += 1;
        } else {
            s.Shots += 1;
        }
        ps[playerId] = s;

        // Assist update
        if (result === 'goal' && assistPlayerId && goalType !== 'own-goal') {
            if (!ps[assistPlayerId]) ps[assistPlayerId] = initPlayerStats([assistPlayerId], isHome ? 'home' : 'away')[assistPlayerId];
            ps[assistPlayerId] = {
                ...ps[assistPlayerId],
                Assists: (ps[assistPlayerId].Assists || 0) + 1
            };
        }

        return ps;
    });

    setShotModalData(null);
};
```

### B. Dedicated Goalkeeper Save Handler (`src/components/match/LiveMatch.jsx`)
```javascript
// Lines 792-860
const handleSaveGkSave = (gkSaveDetails) => {
    if (!gkSaveModalData) return;
    const { player } = gkSaveModalData;
    const playerId = player.id;
    const isHome = homePlayers.includes(playerId);
    const { saveType, corner } = gkSaveDetails;

    const eventId = `event-${Date.now()}`;
    const resolvedGkName = resolvePlayerName(player || playerId, allStudents, studentsById);
    const newEvent = {
        id: eventId,
        elapsed: elapsed,
        minute: Math.floor(elapsed / 60) + 1,
        period: period,
        type: 'gkSave',
        playerId,
        playerName: resolvedGkName,
        team: isHome ? 'home' : 'away',
        teamId: isHome ? matchData.homeTeamId : matchData.awayTeamId,
        teamName: isHome ? home.name : away.name,
        saveType,
        corner
    };

    setTimeline(prev => [...prev, newEvent]);

    setPlayerStats(prev => {
        const ps = { ...prev };
        if (!ps[playerId]) ps[playerId] = initPlayerStats([playerId], isHome ? 'home' : 'away')[playerId];
        const s = { ...ps[playerId] };

        s.Saves = (s.Saves || 0) + 1;
        if (saveType === 'penalty') {
            s['Penalties Saved'] = (s['Penalties Saved'] || 0) + 1;
        } else if (saveType === 'freekick') {
            s['Free Kick Saves'] = (s['Free Kick Saves'] || 0) + 1;
        }

        ps[playerId] = s;
        return ps;
    });

    setGkSaveModalData(null);
};
```

---

## 3. Score Derivations & Synchronization (Failure Point for Undo)

### A. Dynamic Score Derivation (`src/components/match/LiveMatch.jsx`)
```javascript
// Lines 524-534
/* derived scores */
const homeScore = useMemo(() => {
    const goals = homePlayers.reduce((t, id) => t + (playerStats[id]?.Goals ?? 0), 0);
    const ownGoals = awayPlayers.reduce((t, id) => t + (playerStats[id]?.ownGoals ?? 0), 0);
    return goals + ownGoals;
}, [homePlayers, awayPlayers, playerStats]);

const awayScore = useMemo(() => {
    const goals = awayPlayers.reduce((t, id) => t + (playerStats[id]?.Goals ?? 0), 0);
    const ownGoals = homePlayers.reduce((t, id) => t + (playerStats[id]?.ownGoals ?? 0), 0);
    return goals + ownGoals;
}, [homePlayers, awayPlayers, playerStats]);
```

### B. Ceiling Merge Sync Effect (THE ROOT CAUSE OF UNDO REVERSION) (`src/components/match/LiveMatch.jsx`)
```javascript
// Lines 344-378
// Synchronize incoming player stats across data capturers to keep scores and stats unified
useEffect(() => {
    const incomingStats = matchData.playerStats || matchData.liveState?.playerStats;
    if (incomingStats && typeof incomingStats === 'object' && Object.keys(incomingStats).length > 0) {
        setPlayerStats(prev => {
            let hasChanges = false;
            const next = { ...prev };
            Object.keys(incomingStats).forEach(pId => {
                const inc = incomingStats[pId];
                const cur = prev[pId];
                if (!cur) {
                    next[pId] = inc;
                    hasChanges = true;
                } else {
                    let updated = false;
                    const mergedPlayer = { ...cur };
                    Object.keys(inc).forEach(k => {
                        if (typeof inc[k] === 'number') {
                            // ROOT CAUSE BUG: Math.max prevents stats from EVER decreasing!
                            // When an event is undone, cur[k] drops from 1 to 0.
                            // But incomingStats still holds 1 until next tick.
                            // Math.max(0, 1) returns 1, snapping the stat back and cancelling the undo!
                            const maxVal = Math.max(cur[k] || 0, inc[k]);
                            if (maxVal !== cur[k]) {
                                mergedPlayer[k] = maxVal;
                                updated = true;
                            }
                        }
                    });
                    if (updated) {
                        next[pId] = mergedPlayer;
                        hasChanges = true;
                    }
                }
            });
            return hasChanges ? next : prev;
        });
    }
}, [matchData.playerStats, matchData.liveState?.playerStats]);
```

### C. Live Match Parent State Sync (`src/components/match/LiveMatch.jsx`)
```javascript
// Lines 536-578
// Sync state to Match object whenever critical states change
useEffect(() => {
    if (onUpdateMatch) {
        if (isRefereeMode) {
            const updatedRefereeState = {
                ...eventState,
                playerStats,
                timeline
            };
            onUpdateMatch({
                ...matchDataRef.current,
                homeScore,
                awayScore,
                timeline,
                playerStats,
                refereeLiveState: updatedRefereeState
            });
        } else {
            const updatedLiveState = {
                ...clockState,
                isRunning: isMasterLogger ? !isPaused : (clockState.isRunning ?? !isPaused),
                startTime: isMasterLogger ? startTimeRef.current : (clockState.startTime || startTimeRef.current),
                elapsedOffset: isMasterLogger ? offsetRef.current : (clockState.elapsedOffset || offsetRef.current),
                period: isMasterLogger ? period : (clockState.period || period),
                playerStats,
                timeline,
                possession: livePossession
            };
            onUpdateMatch({
                ...matchDataRef.current,
                homeScore,
                awayScore,
                timeline,
                playerStats,
                possession: livePossession,
                liveState: updatedLiveState
            });
        }
    }
}, [isPaused, period, playerStats, timeline, homeScore, awayScore, isRefereeMode, livePossession, isMasterLogger]);
```

---

## 4. The Undo Mechanism (`src/components/match/LiveMatch.jsx`)

```javascript
// Lines 862-917
/* Undo/Delete Timeline Event */
const handleUndoEvent = (eventId) => {
    const ev = timeline.find(t => t.id === eventId);
    if (!ev) return;

    // Decrement stats
    setPlayerStats(prev => {
        const ps = { ...prev };
        const pId = ev.playerId;
        if (!ps[pId]) return prev;

        const s = { ...ps[pId] };

        if (ev.type === 'goal') {
            if (ev.goalType === 'own-goal') {
                s.ownGoals = Math.max(0, s.ownGoals - 1);
            } else {
                s.Goals = Math.max(0, s.Goals - 1);
                s['Shots on Target'] = Math.max(0, s['Shots on Target'] - 1);
                s.Shots = Math.max(0, s.Shots - 1);

                // Revert assist if any
                if (ev.assistingPlayerId && ps[ev.assistingPlayerId]) {
                    ps[ev.assistingPlayerId] = {
                        ...ps[ev.assistingPlayerId],
                        Assists: Math.max(0, ps[ev.assistingPlayerId].Assists - 1)
                    };
                }
            }
        } else if (ev.type === 'shotOnTarget') {
            s['Shots on Target'] = Math.max(0, s['Shots on Target'] - 1);
            s.Shots = Math.max(0, s.Shots - 1);
        } else if (ev.type === 'shotMissed') {
            s.Shots = Math.max(0, s.Shots - 1);
        } else if (ev.type === 'assist') {
            s.Assists = Math.max(0, s.Assists - 1);
        } else if (ev.type === 'yellowCard') {
            s.yellowCards = Math.max(0, s.yellowCards - 1);
        } else if (ev.type === 'redCard') {
            s.redCards = Math.max(0, s.redCards - 1);
        } else if (ev.type === 'gkSave') {
            s.Saves = Math.max(0, (s.Saves || 0) - 1);
            if (ev.saveType === 'penalty') {
                s['Penalties Saved'] = Math.max(0, (s['Penalties Saved'] || 0) - 1);
            } else if (ev.saveType === 'freekick') {
                s['Free Kick Saves'] = Math.max(0, (s['Free Kick Saves'] || 0) - 1);
            }
        }

        // NOTE: Does not handle 'foul', 'corner', or 'shotBlocked'

        ps[pId] = s;
        return ps;
    });

    // Remove from timeline
    setTimeline(prev => prev.filter(t => t.id !== eventId));
};
```

---

## 5. End-Game Aggregations & Reports (`src/components/coach/CoachPostGameStatsHub.jsx`)

```javascript
// Lines 970-1011
let teamShots = 0;
let teamSot = 0;
let teamFouls = 0;
let teamCorners = 0;
let teamYc = 0;
let teamRc = 0;
let teamSaves = 0;

teamPlayerIds.forEach(id => {
    const ps = m.playerStats?.[id];
    if (ps) {
        teamShots += (ps.Shots || 0);
        teamSot += (ps['Shots on Target'] || 0);
        teamFouls += (ps['Fouls Committed'] || 0);
        teamCorners += (ps['Corners Taken'] || 0);
        teamYc += (ps.yellowCards || 0);
        teamRc += (ps.redCards || 0);
        teamSaves += (ps.Saves || 0); // Reliant on ps.Saves!
    }
});

let oppShots = 0;
let oppSot = 0;
let oppFouls = 0;
let oppCorners = 0;
let oppYc = 0;
let oppRc = 0;
let oppSaves = 0;

oppPlayerIds.forEach(id => {
    const ps = m.playerStats?.[id];
    if (ps) {
        oppShots += (ps.Shots || 0);
        oppSot += (ps['Shots on Target'] || 0);
        oppFouls += (ps['Fouls Committed'] || 0);
        oppCorners += (ps['Corners Taken'] || 0);
        oppYc += (ps.yellowCards || 0);
        oppRc += (ps.redCards || 0);
        oppSaves += (ps.Saves || 0); // Reliant on ps.Saves!
    }
});

// Rendering Comparative Bars (Lines 1104-1111)
<ComparativeStatBar label="Ball Possession" teamVal={teamPoss} oppVal={oppPoss} isPercentage={true} />
<ComparativeStatBar label="Total Shots" teamVal={teamShots} oppVal={oppShots} />
<ComparativeStatBar label="Shots on Target" teamVal={teamSot} oppVal={oppSot} />
<ComparativeStatBar label="Goalkeeper Saves" teamVal={teamSaves} oppVal={oppSaves} />
<ComparativeStatBar label="Corner Kicks" teamVal={teamCorners} oppVal={oppCorners} />
<ComparativeStatBar label="Fouls Committed" teamVal={teamFouls} oppVal={oppFouls} />
<ComparativeStatBar label="Yellow & Red Cards" teamVal={teamYc + teamRc} oppVal={oppYc + oppRc} />
```

---

## 6. Match Approval & Student Profile Propagation (`src/App.jsx`)

```javascript
// Lines 936-1031
const updateFn = prev => {
  const next = prev.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m);
  pushMatchesToCloud(next);
  return next;
};

if (isPmc) {
  setPmcMatches(updateFn);
} else {
  setMatches(updateFn);
}

// Propagate statistics only if the match transitions to 'approved'
if (updatedMatch.status === 'approved') {
  const { playerStats, matchday } = updatedMatch;
  if (playerStats) {
    setAllStudents(prev => prev.map(student => {
      const stats = playerStats[String(student.id)];
      if (!stats) return student;

      const newStudent = { ...student };
      if (!newStudent.performance) newStudent.performance = {};
      if (!newStudent.performance[selectedYear]) newStudent.performance[selectedYear] = {};
      const md = matchday || selectedTerm;
      if (!newStudent.performance[selectedYear][md]) newStudent.performance[selectedYear][md] = {};
      const perf = { ...newStudent.performance[selectedYear][md] };

      const perfStats = ['Goals', 'Assists', 'Shots on Target', 'Shots', 'Pass Completed',
        'Successful Dribbles', 'Successful Clearances', 'Successful Blocks',
        'Corners Taken', 'Freekicks Taken', 'Penalties Taken', 'Successful Tackles',
        'Saves', 'Penalties Saved', 'Free Kick Saves', 'Goals Conceded', 'Punches', 'High Claims'];
      perfStats.forEach(stat => {
        if (stats[stat]) perf[stat] = (perf[stat] || 0) + stats[stat];
      });

      // Float stats
      ['Tackles Per Game', 'Interceptions Per Game', 'Shots Per Game'].forEach(stat => {
        if (stats[stat]) perf[stat] = (perf[stat] || 0) + stats[stat];
      });

      // Recalculate Shot Accuracy
      if (perf['Shots'] > 0) {
        perf['Shot Accuracy'] = Math.round(((perf['Shots on Target'] || 0) / perf['Shots']) * 100);
      }
      newStudent.performance[selectedYear] = { ...newStudent.performance[selectedYear], [md]: perf };

      // Merge matchStats (discipline + playtime)
      if (!newStudent.matchStats) newStudent.matchStats = {};
      if (!newStudent.matchStats[selectedYear]) newStudent.matchStats[selectedYear] = {};
      if (!newStudent.matchStats[selectedYear][md]) newStudent.matchStats[selectedYear][md] = {};
      const ms = { ...newStudent.matchStats[selectedYear][md] };
      ms.gamesPlayed = (ms.gamesPlayed || 0) + 1;
      if (stats.minutesPlayed) ms.minutesPlayed = (ms.minutesPlayed || 0) + stats.minutesPlayed;
      if (stats.yellowCards) ms.yellowCards = (ms.yellowCards || 0) + stats.yellowCards;
      if (stats.redCards) ms.redCards = (ms.redCards || 0) + stats.redCards;
      newStudent.matchStats[selectedYear] = { ...newStudent.matchStats[selectedYear], [md]: ms };

      // Merge shot logs from timeline
      const playerShots = (updatedMatch.timeline || [])
        .filter(event => Number(event.playerId) === Number(student.id) && (event.type === 'goal' || event.type === 'shotOnTarget' || event.type === 'shotMissed'))
        .map((event, index) => {
          let resultType = 'miss';
          if (event.type === 'goal') {
            resultType = event.goalType === 'own-goal' ? 'miss' : 'goal';
          } else if (event.type === 'shotOnTarget') {
            resultType = 'saved';
          }

          return {
            id: `${student.id}-${selectedYear}-${md}-u-${Date.now()}-${index}`,
            year: selectedYear,
            term: md,
            result: resultType,
            x: event.x != null ? event.x : 50,
            y: event.y != null ? event.y : 50,
            goalType: event.goalType || null,
            timestamp: Date.now()
          };
        });

      if (playerShots.length > 0) {
        newStudent.shotLogs = [...(newStudent.shotLogs || []), ...playerShots];
      }

      // NOTE: Missing merge for goalkeeper saveLogs!

      return newStudent;
    }));
  }
}
```

---

## 7. Cloud Sync Engine (`src/utils/realtimeSync.js`)

```javascript
// Sanitized URL and Key
const SUPABASE_URL = 'https://[YOUR_SUPABASE_PROJECT].supabase.co';
const SUPABASE_KEY = '[REDACTED_SUPABASE_ANON_KEY]';
const TABLE_URL = `${SUPABASE_URL}/rest/v1/pmc_matches_state`;

const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

export async function pushMatchesToCloud(matchesList) {
    if (!matchesList || !Array.isArray(matchesList)) return;

    // 1. Instant local tab broadcast
    if (broadcastChannel) {
        try {
            broadcastChannel.postMessage({ type: 'MATCHES_UPDATED', matches: matchesList, timestamp: Date.now() });
        } catch {}
    }

    // 2. LocalStorage persistence across active v7 and legacy keys
    try {
        localStorage.setItem('eduvision-pmc-matches-v8', JSON.stringify(matchesList));
        localStorage.setItem('eduvision-pmc-matches', JSON.stringify(matchesList));
        localStorage.setItem('eduvision-sync-timestamp', String(Date.now()));
    } catch {}

    // 3. Supabase Cloud Sync via queue
    queuedMatches = matchesList;
    await drainCloudPushQueue();
}
```
