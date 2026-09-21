import fs from 'fs';

// Patch LiveMatch.jsx
let code = fs.readFileSync('src/components/match/LiveMatch.jsx', 'utf8');
code = code.replace(
  /period: isMasterLogger \? period : \(clockState\.period \|\| period\),/g,
  "period: isMasterLogger ? period : (clockState.period || period),\n                    clockUpdatedAt: isMasterLogger ? currentUpdatedAt : (clockState.clockUpdatedAt || 0),"
);
fs.writeFileSync('src/components/match/LiveMatch.jsx', code);

// Patch matchEngine.js
let engine = fs.readFileSync('src/utils/matchEngine.js', 'utf8');

const enginePatch = `    const localLiveTime = Number(localMatch.liveState?.updatedAt || 0);
    const incLiveTime = Number(incomingMatch.liveState?.updatedAt || 0);
    const latestLiveState = incLiveTime > localLiveTime ? incomingMatch.liveState : localMatch.liveState;
    
    // CRITICAL FIX: Safe Clock Merging
    const localClockTime = Number(localMatch.liveState?.clockUpdatedAt || 0);
    const incClockTime = Number(incomingMatch.liveState?.clockUpdatedAt || 0);
    let resolvedIsRunning = latestLiveState?.isRunning;
    let resolvedStartTime = latestLiveState?.startTime;
    let resolvedElapsedOffset = latestLiveState?.elapsedOffset;
    let resolvedPeriod = latestLiveState?.period;
    let resolvedClockUpdatedAt = latestLiveState?.clockUpdatedAt;

    if (incClockTime > localClockTime) {
        resolvedIsRunning = incomingMatch.liveState.isRunning;
        resolvedStartTime = incomingMatch.liveState.startTime;
        resolvedElapsedOffset = incomingMatch.liveState.elapsedOffset;
        resolvedPeriod = incomingMatch.liveState.period;
        resolvedClockUpdatedAt = incClockTime;
    } else if (localClockTime > incClockTime) {
        resolvedIsRunning = localMatch.liveState.isRunning;
        resolvedStartTime = localMatch.liveState.startTime;
        resolvedElapsedOffset = localMatch.liveState.elapsedOffset;
        resolvedPeriod = localMatch.liveState.period;
        resolvedClockUpdatedAt = localClockTime;
    }

    const merged = {
        ...base,
        status: finalStatus,
        updatedAt: Math.max(localTime, incTime),
        version: Math.max(Number(localMatch.version || 0), Number(incomingMatch.version || 0)) + 1,
        homeScore: homeScore ?? base.homeScore,
        awayScore: awayScore ?? base.awayScore,
        playerStats: mergedPlayerStats,
        timeline: mergedTimeline,
        tombstoneEventIds: mergedTombstones
    };

    if (latestLiveState) {
        merged.liveState = {
            ...latestLiveState,
            status: finalStatus,
            isRunning: terminalStatuses.includes(finalStatus) ? false : (resolvedIsRunning ?? false),
            startTime: resolvedStartTime,
            elapsedOffset: resolvedElapsedOffset,
            period: resolvedPeriod,
            clockUpdatedAt: resolvedClockUpdatedAt,`;

engine = engine.replace(
  /const localLiveTime = Number[\s\S]*?isRunning: terminalStatuses\.includes\(finalStatus\) \? false : \(latestLiveState\.isRunning \?\? false\),/m,
  enginePatch
);

fs.writeFileSync('src/utils/matchEngine.js', engine);
console.log('Patched clock logic!');
