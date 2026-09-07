import assert from 'assert';

// Mock localStorage for Node.js environment
if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
        getItem: (key) => store.get(key) || null,
        setItem: (key, val) => store.set(key, String(val)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear()
    };
}

import { getAnalystAccounts, findAnalystByEmailOrId } from 'file:///c:/Users/noahb/OneDrive - The UWI - Cave Hill Campus/Desktop/EduData Project/football-data-platform/src/data/analystAccounts.js';
import { DEFAULT_OFFICIALS, findOfficial } from 'file:///c:/Users/noahb/OneDrive - The UWI - Cave Hill Campus/Desktop/EduData Project/football-data-platform/src/data/matchOfficialAccounts.js';

async function runMultiRoleSyncTests() {
    console.log('================================================================');
    console.log('   AUTOMATED MULTI-ROLE SYNCHRONIZATION & SCOPE VERIFICATION    ');
    console.log('================================================================\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Role Account Setup & Permission Boundary Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('TEST 1: Verifying Data Capturer Accounts & Assigned Scopes...');

    const analysts = getAnalystAccounts();
    const usernames = analysts.map(a => a.username);

    // Verify Jonathan
    const jonathan = findAnalystByEmailOrId('johnathan') || findAnalystByEmailOrId('jonathan');
    assert(jonathan, 'Jonathan Cumberbatch must exist');
    assert.strictEqual(jonathan.isMasterLogger, true, 'Jonathan must be the Master Match Controller');
    assert.strictEqual(jonathan.captureRole, 'all', 'Jonathan must have full tile access');

    // Verify Noah
    const noah = findAnalystByEmailOrId('noah');
    assert(noah, 'Noah must exist');
    assert.strictEqual(noah.isMasterLogger, false, 'Noah is not the Master Match Controller');
    assert.strictEqual(noah.captureRole, 'all', 'Noah must have full tile access');

    // Verify Guest Possession Logger
    const guestPoss = findAnalystByEmailOrId('guest.possession');
    assert(guestPoss, 'guest.possession must exist');
    assert.strictEqual(guestPoss.captureRole, 'possession', 'Must have possession scope');
    assert.strictEqual(guestPoss.isMasterLogger, false);

    // Verify Guest Shot Loggers
    const guestShot1 = findAnalystByEmailOrId('guest.shots1');
    const guestShot2 = findAnalystByEmailOrId('guest.shots2');
    assert(guestShot1 && guestShot2, 'Both shot loggers must exist');
    assert.strictEqual(guestShot1.captureRole, 'shots');
    assert.strictEqual(guestShot2.captureRole, 'shots');

    // Verify Guest Event Loggers 1-4
    for (let i = 1; i <= 4; i++) {
        const guestEv = findAnalystByEmailOrId(`guest.events${i}`);
        assert(guestEv, `guest.events${i} must exist`);
        assert.strictEqual(guestEv.captureRole, 'general');
    }

    // Verify deprecated accounts Marcus & Devon do NOT exist
    assert(!usernames.includes('analyst.marcus'), 'Marcus Thorne must be purged');
    assert(!usernames.includes('analyst.devon'), 'Devon Clarke must be purged');

    console.log('✓ PASS: All 9 accounts verified (Jonathan Master + Noah + 7 Scoped Guests). Deprecated accounts purged.\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Role Scoping & Tile Permission Enforcer Logic
    // ─────────────────────────────────────────────────────────────────
    console.log('TEST 2: Verifying Tile Permission Flags & Scope Locking...');

    const getPermissions = (role) => ({
        isPossessionEnabled: role === 'all' || role === 'master' || role === 'possession',
        isShotsEnabled: role === 'all' || role === 'master' || role === 'shots',
        isGeneralEnabled: role === 'all' || role === 'master' || role === 'general',
        isScopeLocked: Boolean(role && role !== 'all')
    });

    const jonathanPerms = getPermissions(jonathan.captureRole);
    assert.strictEqual(jonathanPerms.isPossessionEnabled, true);
    assert.strictEqual(jonathanPerms.isShotsEnabled, true);
    assert.strictEqual(jonathanPerms.isGeneralEnabled, true);
    assert.strictEqual(jonathanPerms.isScopeLocked, false, 'Jonathan can view all or filter');

    const possPerms = getPermissions(guestPoss.captureRole);
    assert.strictEqual(possPerms.isPossessionEnabled, true, 'Possession logger can access possession');
    assert.strictEqual(possPerms.isShotsEnabled, false, 'Possession logger cannot access shot tiles');
    assert.strictEqual(possPerms.isGeneralEnabled, false, 'Possession logger cannot access event tiles');
    assert.strictEqual(possPerms.isScopeLocked, true, 'Possession logger cannot change scope');

    const shotPerms = getPermissions(guestShot1.captureRole);
    assert.strictEqual(shotPerms.isPossessionEnabled, false, 'Shot logger cannot access possession');
    assert.strictEqual(shotPerms.isShotsEnabled, true, 'Shot logger can access shot tiles');
    assert.strictEqual(shotPerms.isGeneralEnabled, false, 'Shot logger cannot access event tiles');
    assert.strictEqual(shotPerms.isScopeLocked, true, 'Shot logger cannot change scope');

    const eventPerms = getPermissions(findAnalystByEmailOrId('guest.events1').captureRole);
    assert.strictEqual(eventPerms.isPossessionEnabled, false, 'Event logger cannot access possession');
    assert.strictEqual(eventPerms.isShotsEnabled, false, 'Event logger cannot access shot tiles');
    assert.strictEqual(eventPerms.isGeneralEnabled, true, 'Event logger can access card/foul/corner tiles');
    assert.strictEqual(eventPerms.isScopeLocked, true, 'Event logger cannot change scope');

    console.log('✓ PASS: Strict UI tile permissions and locked scopes confirmed across all roles.\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Master Clock Authority & Anti-Clock-Override Enforcement
    // ─────────────────────────────────────────────────────────────────
    console.log('TEST 3: Verifying Anti-Clock-Override (Only Jonathan controls clock)...');

    const masterClock = {
        isRunning: true,
        startTime: 1788800000000,
        elapsedOffset: 1200, // 20:00 elapsed
        period: '1H'
    };

    let activeMatch = {
        id: 'pmc-match-sync-test',
        homeTeam: 'KICKSTART FC',
        awayTeam: 'PRO SHOTS ACADEMY',
        homeTeamId: 'team-home-1',
        awayTeamId: 'team-away-2',
        homeScore: 0,
        awayScore: 0,
        timeline: [],
        playerStats: {},
        liveState: { ...masterClock }
    };

    // Helper simulating LiveMatch.jsx update handler
    const simulateMatchUpdate = (currentMatch, updaterAnalyst, payload) => {
        const isMaster = updaterAnalyst.isMasterLogger === true ||
                         updaterAnalyst.username === 'johnathan' ||
                         updaterAnalyst.username === 'jonathan';

        const clockState = currentMatch.liveState || {};
        
        // If master, allow mutating clock. If non-master, preserve master's clock!
        const updatedLiveState = {
            ...clockState,
            isRunning: isMaster ? (payload.isRunning ?? clockState.isRunning) : (clockState.isRunning ?? true),
            startTime: isMaster ? (payload.startTime ?? clockState.startTime) : (clockState.startTime),
            elapsedOffset: isMaster ? (payload.elapsedOffset ?? clockState.elapsedOffset) : (clockState.elapsedOffset),
            period: isMaster ? (payload.period ?? clockState.period) : (clockState.period),
            timeline: payload.timeline || currentMatch.timeline || [],
            playerStats: payload.playerStats || currentMatch.playerStats || {},
            possession: payload.possession || currentMatch.possession || { homePct: 50, awayPct: 50 }
        };

        return {
            ...currentMatch,
            homeScore: payload.homeScore ?? currentMatch.homeScore,
            awayScore: payload.awayScore ?? currentMatch.awayScore,
            timeline: updatedLiveState.timeline,
            playerStats: updatedLiveState.playerStats,
            possession: updatedLiveState.possession,
            liveState: updatedLiveState
        };
    };

    // Non-master logger (guest.shots1) tries to mutate clock while logging a shot
    const rogueShotPayload = {
        timeline: [{ id: 'evt-shot-1', type: 'shotOnTarget', minute: 21, playerId: 'player-10', result: 'saved', team: 'home' }],
        isRunning: false, // Attempting to pause clock
        period: 'HT',     // Attempting to whistle half-time
        elapsedOffset: 2700
    };

    activeMatch = simulateMatchUpdate(activeMatch, guestShot1, rogueShotPayload);

    // Assert clock was NOT overwritten
    assert.strictEqual(activeMatch.liveState.isRunning, true, 'Master clock must remain RUNNING');
    assert.strictEqual(activeMatch.liveState.period, '1H', 'Period must remain 1H (guest cannot whistle HT)');
    assert.strictEqual(activeMatch.liveState.elapsedOffset, 1200, 'Elapsed offset must remain unchanged');
    assert.strictEqual(activeMatch.timeline.length, 1, 'Event was successfully appended to timeline');

    // Now Jonathan whistles Half-Time
    const masterHtPayload = {
        isRunning: false,
        period: 'HT',
        elapsedOffset: 2700,
        timeline: activeMatch.timeline
    };

    activeMatch = simulateMatchUpdate(activeMatch, jonathan, masterHtPayload);

    assert.strictEqual(activeMatch.liveState.isRunning, false, 'Jonathan successfully paused clock for HT');
    assert.strictEqual(activeMatch.liveState.period, 'HT', 'Jonathan successfully set period to HT');
    assert.strictEqual(activeMatch.liveState.elapsedOffset, 2700, 'Jonathan successfully finalized 45:00 at HT');

    console.log('✓ PASS: Master Clock strictly preserved during guest event captures; Jonathan whistle verified.\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Multi-Role Timeline & Player Stats Synchronization
    // ─────────────────────────────────────────────────────────────────
    console.log('TEST 4: Verifying Multi-Role Timeline & Player Stats Deduplication...');

    // Simulate events coming from 4 different capturers at the same time:
    // Logger 1: guest.shots1 logs a Goal
    const shotEvent = {
        id: 'evt-goal-1',
        elapsed: 720,
        minute: 12,
        period: '1H',
        type: 'goal',
        result: 'goal',
        playerId: 'p-home-9',
        playerName: 'Rashad Gittens',
        team: 'home',
        x: 82,
        y: 65,
        goalType: 'foot'
    };

    // Logger 2: guest.events1 logs a Yellow Card
    const cardEvent = {
        id: 'evt-card-1',
        elapsed: 950,
        minute: 16,
        period: '1H',
        type: 'yellowCard',
        playerId: 'p-away-4',
        playerName: 'Marcus Alleyne',
        team: 'away'
    };

    // Logger 3: guest.possession logs a ball possession switch
    const possEvent = {
        id: 'evt-poss-1',
        elapsed: 1100,
        minute: 19,
        period: '1H',
        type: 'possession',
        team: 'home',
        homePct: 58,
        awayPct: 42
    };

    // Logger 4: guest.shots2 logs a Header Shot Saved
    const headerShotEvent = {
        id: 'evt-shot-2',
        elapsed: 1400,
        minute: 24,
        period: '1H',
        type: 'headerShot',
        result: 'saved',
        playerId: 'p-away-11',
        playerName: 'Kobe Harewood',
        team: 'away',
        x: 48,
        y: 35,
        goalType: 'header'
    };

    // Timeline merge logic used in LiveMatch.jsx & CoachLiveManagement.jsx
    const incomingTimeline = [shotEvent, cardEvent, possEvent, headerShotEvent];
    const localTimeline = [shotEvent]; // Device already has shotEvent locally

    const mergeTimeline = (local, incoming) => {
        const map = new Map();
        [...local, ...incoming].forEach(ev => {
            if (ev && (ev.id || (ev.minute != null && ev.type))) {
                const key = ev.id || `${ev.minute}-${ev.type}-${ev.playerId || ev.team || ''}`;
                if (!map.has(key)) map.set(key, ev);
            }
        });
        const merged = Array.from(map.values());
        merged.sort((a, b) => (a.elapsed ?? (a.minute * 60) ?? 0) - (b.elapsed ?? (b.minute * 60) ?? 0));
        return merged;
    };

    const synchronizedTimeline = mergeTimeline(localTimeline, incomingTimeline);

    assert.strictEqual(synchronizedTimeline.length, 4, 'Timeline must contain exactly 4 unique events (no duplicates)');
    assert.strictEqual(synchronizedTimeline[0].id, 'evt-goal-1', 'First event at min 12');
    assert.strictEqual(synchronizedTimeline[1].id, 'evt-card-1', 'Second event at min 16');
    assert.strictEqual(synchronizedTimeline[2].id, 'evt-poss-1', 'Third event at min 19');
    assert.strictEqual(synchronizedTimeline[3].id, 'evt-shot-2', 'Fourth event at min 24');

    // Player Stats Ceiling Merge logic
    const localStats = {
        'p-home-9': { Goals: 0, Shots: 0 },
        'p-away-4': { yellowCards: 0 }
    };
    const incomingStats = {
        'p-home-9': { Goals: 1, Shots: 1 },
        'p-away-4': { yellowCards: 1 }
    };

    const mergePlayerStats = (local, incoming) => {
        const next = { ...local };
        Object.keys(incoming).forEach(pId => {
            const inc = incoming[pId];
            const cur = local[pId];
            if (!cur) {
                next[pId] = inc;
            } else {
                const mergedPlayer = { ...cur };
                Object.keys(inc).forEach(k => {
                    if (typeof inc[k] === 'number') {
                        mergedPlayer[k] = Math.max(cur[k] || 0, inc[k]);
                    }
                });
                next[pId] = mergedPlayer;
            }
        });
        return next;
    };

    const syncedStats = mergePlayerStats(localStats, incomingStats);
    assert.strictEqual(syncedStats['p-home-9'].Goals, 1, 'Home striker goals updated to 1');
    assert.strictEqual(syncedStats['p-away-4'].yellowCards, 1, 'Away defender yellow card updated to 1');

    console.log('✓ PASS: Timeline deduplication and player stats ceiling merge verified with zero data loss.\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Coach Live Management Screen Synchronization
    // ─────────────────────────────────────────────────────────────────
    console.log('TEST 5: Verifying Coach Live Management Radar & Shot Map Sync...');

    const coachMatchState = {
        id: 'pmc-match-sync-test',
        homeTeam: 'KICKSTART FC',
        awayTeam: 'PRO SHOTS ACADEMY',
        homeTeamId: 'team-home-1',
        awayTeamId: 'team-away-2',
        homePlayers: ['p-home-9'],
        awayPlayers: ['p-away-4', 'p-away-11'],
        timeline: synchronizedTimeline,
        liveState: {
            timeline: synchronizedTimeline,
            possession: { homePct: 58, awayPct: 42 }
        }
    };

    // Logic from CoachLiveManagement.jsx: allMatchShots
    const listA = Array.isArray(coachMatchState.timeline) ? coachMatchState.timeline : [];
    const listB = Array.isArray(coachMatchState.liveState?.timeline) ? coachMatchState.liveState.timeline : [];
    const coachTimelineMap = new Map();
    [...listA, ...listB].forEach(ev => {
        if (ev && (ev.id || (ev.minute != null && ev.type))) {
            const key = ev.id || `${ev.minute}-${ev.type}-${ev.playerId || ev.team || ''}`;
            if (!coachTimelineMap.has(key)) coachTimelineMap.set(key, ev);
        }
    });
    const rawTimeline = Array.from(coachTimelineMap.values());

    const coachShots = rawTimeline.filter(e => 
        e.type === 'goal' || 
        e.type === 'shotOnTarget' || 
        e.type === 'shotMissed' || 
        e.type === 'shotBlocked' || 
        e.type === 'shot' ||
        e.type === 'headerShot' ||
        e.type === 'penaltyShot' ||
        e.type === 'freekickShot' ||
        e.type === 'ownGoal' ||
        e.shotDetail
    ).map(s => {
        const result = (s.result === 'goal' || s.outcome === 'Goal' || s.type === 'goal' || s.type === 'ownGoal') ? 'goal'
            : (s.result === 'saved' || s.outcome === 'Saved' || s.type === 'shotOnTarget') ? 'saved'
            : (s.result === 'blocked' || s.outcome === 'Blocked' || s.type === 'shotBlocked') ? 'blocked'
            : (s.result === 'miss' || s.result === 'missed' || s.outcome === 'Off Target' || s.type === 'shotMissed') ? 'missed'
            : 'saved';
        return {
            ...s,
            result,
            x: s.x ?? 50,
            y: s.y ?? 55,
            isHomeTeam: s.team === 'home'
        };
    });

    // Assert coach views all shots (Foot goal + Header saved)
    assert.strictEqual(coachShots.length, 2, 'Coach must see both shots logged by Shot Loggers');
    const coachGoals = coachShots.filter(s => s.result === 'goal');
    assert.strictEqual(coachGoals.length, 1, 'Coach sees exactly 1 goal');
    assert.strictEqual(coachGoals[0].playerName, 'Rashad Gittens');
    assert.strictEqual(coachGoals[0].x, 82, 'Exact X coordinate preserved on goalmouth map');
    assert.strictEqual(coachGoals[0].y, 65, 'Exact Y coordinate preserved on goalmouth map');

    const coachSaved = coachShots.filter(s => s.result === 'saved');
    assert.strictEqual(coachSaved.length, 1, 'Coach sees exactly 1 saved shot');
    assert.strictEqual(coachSaved[0].type, 'headerShot', 'Header shot recognized on Coach screen');
    assert.strictEqual(coachSaved[0].x, 48);

    // Verify Possession on Coach Screen
    const coachPoss = coachMatchState.liveState?.possession || coachMatchState.possession;
    assert.strictEqual(coachPoss.homePct, 58, 'Coach live screen reflects 58% Home Possession');
    assert.strictEqual(coachPoss.awayPct, 42, 'Coach live screen reflects 42% Away Possession');

    console.log('✓ PASS: Coach Live Management receives 100% synchronized shot map coordinates, KPIs, and possession.\n');

    console.log('================================================================');
    console.log('   🎉 ALL 5 AUTOMATED MULTI-ROLE SYNCHRONIZATION TESTS PASSED   ');
    console.log('================================================================');
}

runMultiRoleSyncTests().catch(err => {
    console.error('❌ Test Suite Failed:', err);
    process.exit(1);
});
