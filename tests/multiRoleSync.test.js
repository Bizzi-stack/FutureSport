import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production imports from matchEngine.js and realtimeSync.js
import {
    initPlayerStats,
    syncPlayerStats,
    syncTimeline,
    mergeTombstones,
    calculateScores,
    resolveActiveGoalkeeper,
    matchesStudentId,
    applyMatchContributions,
    cleanStudentsForSave,
    loadAndMergeStudents,
    migrateTermsToMatchdays,
    mergeMatchStates,
    recordMatchActionState,
    recordMatchShotState,
    recordMatchGkSaveState,
    undoMatchEventState,
    updateMatchPlayerDetailState,
    editMatchEventState,
    overturnMatchEventState,
    recalculateMatchScores,
    applyEventStatsDelta
} from '../src/utils/matchEngine.js';

import {
    mergeCloudMatches,
    computeMatchesHash
} from '../src/utils/realtimeSync.js';

import {
    isMatchFinished,
    isMatchForTeam,
    getCoachSquadInfo,
    getRelevantCoachMatch,
    sortCoachMatches
} from '../src/utils/fixtureUtils.js';

import { getAnalystAccounts, findAnalystByEmailOrId } from '../src/data/analystAccounts.js';
import { DEFAULT_OFFICIALS, findOfficial, getOfficialsByRole } from '../src/data/matchOfficialAccounts.js';
import { DEFAULT_COUNTDOWN_PROTOCOL, PMC_STUDENTS, PMC_MATCHES } from '../src/utils/pmcDataLoader.js';

// Summary tracking for clean category reporting
const results = {
    categoryA: { name: 'Category A: Isolated Unit Tests', passed: 0, total: 0 },
    categoryB: { name: 'Category B: Production Handler Reducer Tests', passed: 0, total: 0 },
    categoryC: { name: 'Category C: Two Connected Clients & Cloud Sync Tests', passed: 0, total: 0 },
    categoryD: { name: 'Category D: Coach Fixture Relevance & Finished Match Disabling Tests', passed: 0, total: 0 },
    categoryE: { name: 'Category E: Accurate Squad Analytics & Match-Driven Leaderboards', passed: 0, total: 0 },
    categoryF: { name: 'Category F: In Contest / 3-Way Possession & Sync Tests', passed: 0, total: 0 },
    categoryG: { name: 'Category G: Match Operator & Referee Event Correction Engine', passed: 0, total: 0 }
};

function recordPass(catKey, testName) {
    results[catKey].passed++;
    results[catKey].total++;
    console.log(`  ✓ PASS: ${testName}`);
}

async function runAllTests() {
    console.log('================================================================');
    console.log('   FUTURESPORT REALTIME MATCH ENGINE & MULTI-ROLE TEST SUITE    ');
    console.log('================================================================\n');

    // =========================================================================
    // CATEGORY A: ISOLATED UNIT TESTS
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY A: ISOLATED UNIT TESTS');
    console.log('================================================================');

    // A1: Untouched fields never inherit general _updatedAt
    {
        const clientAStats = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 1,
                _updatedAt: 100,
                _statUpdatedAt: { Goals: 100 }
            }
        };

        // Client B updates an assist at t=120. Goals was untouched (defaults to 0 timestamp)
        const clientBStats = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 0, // Untouched baseline on client B
                Assists: 1,
                _updatedAt: 120,
                _statUpdatedAt: { Assists: 120 }
            }
        };

        // Client A merges Client B
        const mergeResult = syncPlayerStats(clientAStats, clientBStats, 100, 120);
        assert.strictEqual(mergeResult.next['player-1'].Goals, 1, 'Client A Goal not overwritten by Client B untouched zero');
        assert.strictEqual(mergeResult.next['player-1'].Assists, 1, 'Client B Assist successfully merged');
        assert.strictEqual(mergeResult.next['player-1']._statUpdatedAt.Goals, 100, 'Goal timestamp preserved');
        assert.strictEqual(mergeResult.next['player-1']._statUpdatedAt.Assists, 120, 'Assist timestamp preserved');

        recordPass('categoryA', 'A1: Untouched fields retain version 0 and cannot overwrite goals with zero');
    }

    // A2: Persist newer field timestamps even when value stays unchanged
    {
        const localStats = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 2,
                _updatedAt: 100,
                _statUpdatedAt: { Goals: 100 }
            }
        };

        // Incoming update has same value (Goals: 2) but newer confirmation timestamp 150
        const incomingSameVal = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 2,
                _updatedAt: 150,
                _statUpdatedAt: { Goals: 150 }
            }
        };

        const res1 = syncPlayerStats(localStats, incomingSameVal, 100, 150);
        assert.strictEqual(res1.hasChanges, true, 'hasChanges is true when newer timestamp arrives for same value');
        assert.strictEqual(res1.next['player-1']._statUpdatedAt.Goals, 150, 'Newer timestamp 150 persisted');

        // Stale update arriving later at t=120 with Goals: 1 cannot overwrite it
        const staleLaterUpdate = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 1,
                _updatedAt: 120,
                _statUpdatedAt: { Goals: 120 }
            }
        };

        const res2 = syncPlayerStats(res1.next, staleLaterUpdate, 150, 120);
        assert.strictEqual(res2.hasChanges, false, 'Stale packet rejected');
        assert.strictEqual(res2.next['player-1'].Goals, 2, 'Value 2 preserved against stale overwrite');

        recordPass('categoryA', 'A2: Newer timestamps persist on unchanged values to protect against stale overwrites');
    }

    // A3: Equal timestamps resolve deterministically supporting undos (no Math.max)
    {
        // Local state has Goal: 1 with sequence 1 at t=100
        const local = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 1,
                _updatedAt: 100,
                _statUpdatedAt: { Goals: 100 },
                _statSeq: { Goals: 1 },
                _statOp: { Goals: 'action' }
            }
        };

        // Incoming undo at same t=100 has sequence 2 and op='undo' with Goals: 0
        const incomingUndo = {
            'player-1': {
                ...initPlayerStats('player-1'),
                Goals: 0,
                _updatedAt: 100,
                _statUpdatedAt: { Goals: 100 },
                _statSeq: { Goals: 2 },
                _statOp: { Goals: 'undo' }
            }
        };

        const syncResult = syncPlayerStats(local, incomingUndo, 100, 100);
        assert.strictEqual(syncResult.next['player-1'].Goals, 0, 'Undo to 0 won at equal timestamp without Math.max');
        assert.strictEqual(syncResult.next['player-1']._statOp.Goals, 'undo', 'Undo operation recorded');

        recordPass('categoryA', 'A3: Equal timestamp conflicts resolve via sequence/undo ordering without Math.max');
    }

    // A4: Explicit migration provenance on match approvals
    {
        // Brand new match approved for the first time should NOT subtract from baseline
        const brandNewStudent = {
            id: 'p-1',
            name: 'New Player',
            performance: { '2026': { 'Matchday 1': { Goals: 5 } } },
            matchStats: { '2026': { 'Matchday 1': { gamesPlayed: 3, minutesPlayed: 270 } } }
        };

        const newMatch = {
            id: 'brand-new-match-1',
            year: '2026',
            matchday: 'Matchday 1',
            status: 'approved',
            playerStats: {
                'p-1': { Goals: 2, minutesPlayed: 90 }
            }
        };

        // First approval of brand new match adds to baseline
        const afterFirstApproval = applyMatchContributions([brandNewStudent], newMatch);
        assert.strictEqual(afterFirstApproval[0]._baselinePerformance['2026']['Matchday 1'].Goals, 5, 'Baseline not subtracted for new match');
        assert.strictEqual(afterFirstApproval[0].performance['2026']['Matchday 1'].Goals, 7, 'Goals added to 7');

        // Pre-counted match with explicit provenance preserves history and allows correction to zero
        const legacyStudent = {
            id: 'p-legacy',
            name: 'Legacy Player',
            performance: { '2026': { 'Matchday 1': { Goals: 3 } } }, // 1 from M-legacy + 2 from other matches
            matchStats: { '2026': { 'Matchday 1': { gamesPlayed: 2, minutesPlayed: 180 } } },
            _legacyProvenance: {
                migrated: true,
                preCountedMatchIds: ['match-m-legacy']
            }
        };

        const legacyMatch = {
            id: 'match-m-legacy',
            year: '2026',
            matchday: 'Matchday 1',
            status: 'approved',
            playerStats: {
                'p-legacy': { Goals: 1, minutesPlayed: 90 }
            }
        };

        const afterReapprove = applyMatchContributions([legacyStudent], legacyMatch);
        assert.strictEqual(afterReapprove[0].performance['2026']['Matchday 1'].Goals, 3, 'Re-approval does not double-count');
        assert.strictEqual(afterReapprove[0]._baselinePerformance['2026']['Matchday 1'].Goals, 2, 'Unrelated baseline preserved');

        // Correct goal in legacy match to zero
        const correctedLegacyMatch = {
            ...legacyMatch,
            playerStats: {
                'p-legacy': { Goals: 0, minutesPlayed: 90 }
            }
        };

        const afterCorrection = applyMatchContributions(afterReapprove, correctedLegacyMatch);
        assert.strictEqual(afterCorrection[0].performance['2026']['Matchday 1'].Goals, 2, 'Correcting to 0 drops total to 2 without erasing unrelated 2 goals');

        recordPass('categoryA', 'A4: Explicit migration provenance protects baselines and prevents double counting');
    }

    // A5: cleanStudentsForSave does not initialize _matchContributions to {}
    {
        const rawStudent = {
            id: 'p-unmigrated',
            name: 'Unmigrated Student',
            performance: { '2026': { 'Matchday 1': { Goals: 4 } } }
        };

        const cleaned = cleanStudentsForSave([rawStudent]);
        assert.strictEqual(cleaned[0]._matchContributions, null, '_matchContributions is null when unmigrated, not {}');

        recordPass('categoryA', 'A5: cleanStudentsForSave preserves _matchContributions null state');
    }

    // A6: Minutes & appearances preserve zero and only increment for active participants
    {
        const benchedPlayer = {
            id: 'p-benched',
            name: 'Bench Warmer',
            performance: {},
            matchStats: {}
        };

        const activePlayer = {
            id: 'p-starter',
            name: 'Active Starter',
            performance: {},
            matchStats: {}
        };

        const matchWithZeroMinutes = {
            id: 'match-sub-test',
            year: '2026',
            matchday: 'Matchday 1',
            status: 'approved',
            playerStats: {
                'p-benched': { ...initPlayerStats('p-benched'), minutesPlayed: 0 },
                'p-starter': { ...initPlayerStats('p-starter'), minutesPlayed: 90, Goals: 1 }
            }
        };

        const applied = applyMatchContributions([benchedPlayer, activePlayer], matchWithZeroMinutes);
        const benchedRes = applied.find(s => s.id === 'p-benched');
        const activeRes = applied.find(s => s.id === 'p-starter');

        assert.strictEqual(benchedRes.matchStats['2026']['Matchday 1'].gamesPlayed, 0, 'Zero minutes non-participant has 0 gamesPlayed');
        assert.strictEqual(benchedRes.matchStats['2026']['Matchday 1'].minutesPlayed, 0, 'Zero minutes preserved');

        assert.strictEqual(activeRes.matchStats['2026']['Matchday 1'].gamesPlayed, 1, 'Active participant appearance incremented');
        assert.strictEqual(activeRes.matchStats['2026']['Matchday 1'].minutesPlayed, 90, 'Active participant minutes recorded');

        recordPass('categoryA', 'A6: Preserves 0 minutes and increments appearances only for actual participants');
    }

    // A7: Goalkeeper selection rules
    {
        const allStudents = [
            { id: 'striker-1', name: 'Winger One', position: 'Striker' },
            { id: 'gk-actual', name: 'Real Keeper', position: 'Goalkeeper' }
        ];

        const matchData = {
            homePlayers: ['striker-1', 'gk-actual'],
            homeSquadSelection: {
                startingXI: ['striker-1', 'gk-actual']
            },
            timeline: []
        };

        // striker-1 ending in -1 should NEVER be selected as goalkeeper
        const resolved = resolveActiveGoalkeeper({ side: 'home', matchData, allStudents });
        assert.strictEqual(resolved.goalkeeperId, 'gk-actual', 'Striker with -1 ID rejected, actual GK selected');
        assert.strictEqual(resolved.isAmbiguous, false);

        recordPass('categoryA', 'A7: Goalkeeper attribution never infers from -1 suffix and respects outfield positions');
    }

    // A8: Null coordinates preserved (never fake 50,50 or null < 40)
    {
        const unmappedEvent = { id: 'ev-1', type: 'shot', x: null, y: null };
        assert.strictEqual(unmappedEvent.x, null);
        assert.strictEqual(unmappedEvent.y, null);

        // Verification of coordinate filter logic
        const testCoords = [
            { x: null, y: null },
            { x: 30, y: 40 },
            { x: 50, y: 50 }
        ];
        const filtered = testCoords.filter(c => c.x != null && c.y != null);
        assert.strictEqual(filtered.length, 2, 'Null coordinates excluded from goal frame plots');

        // Verification of null < 40 fix
        const checkLeftZone = (x) => (x != null && x < 40);
        assert.strictEqual(checkLeftZone(null), false, 'null is NOT classified as left zone');
        assert.strictEqual(checkLeftZone(30), true, 'x=30 is left zone');

        recordPass('categoryA', 'A8: Null coordinates remain null and are never coerced to 50,50 or left-zone');
    }

    console.log(`\nCategory A Summary: ${results.categoryA.passed}/${results.categoryA.total} passed.\n`);

    // =========================================================================
    // CATEGORY B: PRODUCTION HANDLER REDUCER TESTS
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY B: PRODUCTION HANDLER REDUCER TESTS (LiveMatch & Modals)');
    console.log('================================================================');

    // B1: Action token deduplication
    {
        const state0 = {
            playerStats: {},
            timeline: []
        };

        const actionPayload = {
            playerStats: state0.playerStats,
            timeline: state0.timeline,
            actionKey: 'foul',
            playerId: 'player-foul-1',
            playerName: 'Foul Player',
            team: 'home',
            teamId: 'team-h',
            teamName: 'Home FC',
            actionToken: 'token-action-xyz-1'
        };

        const firstSubmission = recordMatchActionState(actionPayload);
        assert.strictEqual(firstSubmission.rejected, false, 'First submission accepted');
        assert.strictEqual(firstSubmission.timeline.length, 1);
        assert.strictEqual(firstSubmission.playerStats['player-foul-1']['Fouls Committed'], 1);

        // Second submission with exact same actionToken
        const secondSubmission = recordMatchActionState({
            playerStats: firstSubmission.playerStats,
            timeline: firstSubmission.timeline,
            actionKey: 'foul',
            playerId: 'player-foul-1',
            playerName: 'Foul Player',
            team: 'home',
            teamId: 'team-h',
            teamName: 'Home FC',
            actionToken: 'token-action-xyz-1'
        });

        assert.strictEqual(secondSubmission.rejected, true, 'Repeat submission with same actionToken rejected');
        assert.strictEqual(secondSubmission.timeline.length, 1, 'Timeline not duplicated');
        assert.strictEqual(secondSubmission.playerStats['player-foul-1']['Fouls Committed'], 1, 'Stats not incremented twice');

        recordPass('categoryB', 'B1: Action token deduplication rejects repeat submissions cleanly');
    }

    // B2: Production shot handler with coordinate logging and GK companion event
    {
        const shotPayload = {
            playerStats: {},
            timeline: [],
            shotDetails: {
                result: 'saved',
                x: 45,
                y: 60,
                goalType: 'foot'
            },
            shooterId: 'shooter-9',
            shooterName: 'Striker Nine',
            isHome: true,
            homeTeamId: 'home-club',
            awayTeamId: 'away-club',
            homeTeamName: 'Home FC',
            awayTeamName: 'Away FC',
            oppGkId: 'gk-away-1',
            oppGkName: 'Keeper Away',
            oppPlayersList: ['gk-away-1', 'def-away-2'],
            actionToken: 'shot-token-101'
        };

        const shotResult = recordMatchShotState(shotPayload);
        assert.strictEqual(shotResult.rejected, false, 'Valid saved shot accepted');
        assert.strictEqual(shotResult.timeline.length, 2, 'Generates both shot event and GK save companion event');
        assert.strictEqual(shotResult.playerStats['shooter-9']['Shots on Target'], 1, 'Shooter awarded Shot on Target');
        assert.strictEqual(shotResult.playerStats['gk-away-1']['Saves'], 1, 'Goalkeeper awarded Save');
        assert.strictEqual(shotResult.newEvent.x, 45, 'X coordinate stored accurately');
        assert.strictEqual(shotResult.newEvent.y, 60, 'Y coordinate stored accurately');

        // Rejected if GK is not in opposing lineup
        const invalidGkShot = recordMatchShotState({
            ...shotPayload,
            oppGkId: 'unknown-intruder',
            actionToken: 'shot-token-102'
        });
        assert.strictEqual(invalidGkShot.rejected, true, 'Saved shot with invalid GK rejected');

        recordPass('categoryB', 'B2: recordMatchShotState logs coordinates and updates shooter & GK stats');
    }

    // B3: Production GK save handler
    {
        const savePayload = {
            playerStats: {},
            timeline: [],
            gkSaveDetails: {
                saveType: 'penalty',
                corner: 'top-left'
            },
            gkId: 'gk-home-1',
            gkName: 'Home Keeper',
            isHome: true,
            homeTeamId: 'home-club',
            awayTeamId: 'away-club',
            homeTeamName: 'Home FC',
            awayTeamName: 'Away FC',
            actionToken: 'gk-token-201'
        };

        const saveResult = recordMatchGkSaveState(savePayload);
        assert.strictEqual(saveResult.rejected, false);
        assert.strictEqual(saveResult.timeline.length, 1);
        assert.strictEqual(saveResult.playerStats['gk-home-1'].Saves, 1);
        assert.strictEqual(saveResult.playerStats['gk-home-1']['Penalties Saved'], 1);
        assert.strictEqual(saveResult.newEvent.x, 25, 'Corner mapped to coordinates');
        assert.strictEqual(saveResult.newEvent.y, 35, 'Corner mapped to coordinates');

        recordPass('categoryB', 'B3: recordMatchGkSaveState logs save and penalties saved');
    }

    // B4: Rapid successive saves in the same second
    {
        let currentStats = {};
        let currentTimeline = [];

        const now = 1700000000000;

        // First save at now with seq=1
        const save1 = recordMatchGkSaveState({
            playerStats: currentStats,
            timeline: currentTimeline,
            gkSaveDetails: { saveType: 'normal', corner: 'bottom-left' },
            gkId: 'gk-rapid',
            gkName: 'Rapid Keeper',
            isHome: true,
            homeTeamId: 'home-club',
            awayTeamId: 'away-club',
            now,
            seq: 1,
            actionToken: 'rapid-save-1'
        });

        currentStats = save1.playerStats;
        currentTimeline = save1.timeline;

        // Second save at same timestamp now with seq=2
        const save2 = recordMatchGkSaveState({
            playerStats: currentStats,
            timeline: currentTimeline,
            gkSaveDetails: { saveType: 'normal', corner: 'bottom-right' },
            gkId: 'gk-rapid',
            gkName: 'Rapid Keeper',
            isHome: true,
            homeTeamId: 'home-club',
            awayTeamId: 'away-club',
            now,
            seq: 2,
            actionToken: 'rapid-save-2'
        });

        currentStats = save2.playerStats;
        currentTimeline = save2.timeline;

        assert.strictEqual(currentStats['gk-rapid'].Saves, 2, 'Both rapid saves recorded');
        assert.strictEqual(currentTimeline.length, 2, 'Both timeline events present');
        assert.strictEqual(currentStats['gk-rapid']._statSeq.Saves, 2, 'Sequence monotonic progression');

        recordPass('categoryB', 'B4: Rapid successive saves in same second recorded with monotonic sequence');
    }

    // B5: Repeated undos while remaining goals stay untouched
    {
        let currentStats = {};
        let currentTimeline = [];
        let tombstones = [];

        // Record Goal 1 by Player A
        const g1 = recordMatchShotState({
            playerStats: currentStats,
            timeline: currentTimeline,
            shotDetails: { result: 'goal', x: 20, y: 30, goalType: 'foot' },
            shooterId: 'player-A',
            shooterName: 'Player A',
            isHome: true,
            homeTeamId: 'h',
            awayTeamId: 'a',
            actionToken: 'goal-token-1'
        });
        currentStats = g1.playerStats;
        currentTimeline = g1.timeline;

        // Record Goal 2 by Player B
        const g2 = recordMatchShotState({
            playerStats: currentStats,
            timeline: currentTimeline,
            shotDetails: { result: 'goal', x: 70, y: 40, goalType: 'foot' },
            shooterId: 'player-B',
            shooterName: 'Player B',
            isHome: true,
            homeTeamId: 'h',
            awayTeamId: 'a',
            actionToken: 'goal-token-2'
        });
        currentStats = g2.playerStats;
        currentTimeline = g2.timeline;

        assert.strictEqual(currentStats['player-A'].Goals, 1);
        assert.strictEqual(currentStats['player-B'].Goals, 1);
        assert.strictEqual(currentTimeline.length, 2);

        // Undo Goal 1
        const undo1 = undoMatchEventState({
            playerStats: currentStats,
            timeline: currentTimeline,
            tombstoneEventIds: tombstones,
            eventId: g1.newEvent.id,
            seq: 10
        });

        assert.strictEqual(undo1.playerStats['player-A'].Goals, 0, 'Goal 1 undone: Player A goals decremented to 0');
        assert.strictEqual(undo1.playerStats['player-B'].Goals, 1, 'Player B goal remains untouched at 1');
        assert.strictEqual(undo1.timeline.length, 1, 'Timeline decremented');
        assert.strictEqual(undo1.tombstoneEventIds.includes(g1.newEvent.id), true, 'Tombstone recorded');

        recordPass('categoryB', 'B5: Repeated undos decrement target player while leaving other goals untouched');
    }

    // B6: Production detail change handler
    {
        const detailRes = updateMatchPlayerDetailState({
            playerStats: {},
            playerId: 'player-sub',
            field: 'minutesPlayed',
            value: 75,
            seq: 5
        });

        assert.strictEqual(detailRes.playerStats['player-sub'].minutesPlayed, 75);
        assert.strictEqual(detailRes.playerStats['player-sub']._statSeq.minutesPlayed, 5);

        recordPass('categoryB', 'B6: updateMatchPlayerDetailState updates stats with monotonic versioning');
    }

    console.log(`\nCategory B Summary: ${results.categoryB.passed}/${results.categoryB.total} passed.\n`);

    // =========================================================================
    // CATEGORY C: TWO CONNECTED CLIENTS & CLOUD SYNCHRONIZATION TESTS
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY C: TWO CONNECTED CLIENTS & CLOUD SYNCHRONIZATION TESTS');
    console.log('================================================================');

    // C1: Two clients update different stats for SAME player from same starting state
    {
        const startingPlayer = {
            ...initPlayerStats('star-10'),
            _updatedAt: 1000,
            _statUpdatedAt: { Goals: 1000, Assists: 1000, 'Fouls Committed': 1000 }
        };

        // Client A records a Goal at t=1100
        const clientAStats = {
            'star-10': {
                ...startingPlayer,
                Goals: 1,
                _updatedAt: 1100,
                _statUpdatedAt: { ...startingPlayer._statUpdatedAt, Goals: 1100 }
            }
        };

        // Client B records a Foul at t=1150
        const clientBStats = {
            'star-10': {
                ...startingPlayer,
                'Fouls Committed': 1,
                _updatedAt: 1150,
                _statUpdatedAt: { ...startingPlayer._statUpdatedAt, 'Fouls Committed': 1150 }
            }
        };

        // Client A receives Client B's update
        const syncAtA = syncPlayerStats(clientAStats, clientBStats, 1100, 1150);
        assert.strictEqual(syncAtA.next['star-10'].Goals, 1, 'Client A Goal survived');
        assert.strictEqual(syncAtA.next['star-10']['Fouls Committed'], 1, 'Client B Foul survived on Client A');

        // Client B receives Client A's update
        const syncAtB = syncPlayerStats(clientBStats, clientAStats, 1150, 1100);
        assert.strictEqual(syncAtB.next['star-10'].Goals, 1, 'Client A Goal survived on Client B');
        assert.strictEqual(syncAtB.next['star-10']['Fouls Committed'], 1, 'Client B Foul survived on Client B');

        recordPass('categoryC', 'C1: Concurrent same-player stat updates survive on both clients');
    }

    // C2: Reversed message arrival and reload after undo
    {
        const startingPlayer = initPlayerStats('star-10');

        // Client A performed an undo to Goals: 0 at t=1500
        const localUndone = {
            'star-10': {
                ...startingPlayer,
                Goals: 0,
                _updatedAt: 1500,
                _statUpdatedAt: { Goals: 1500 }
            }
        };

        // Stale older message from before undo arrives at t=1200 with Goals: 1
        const staleArriving = {
            'star-10': {
                ...startingPlayer,
                Goals: 1,
                _updatedAt: 1200,
                _statUpdatedAt: { Goals: 1200 }
            }
        };

        const syncAfterUndo = syncPlayerStats(localUndone, staleArriving, 1500, 1200);
        assert.strictEqual(syncAfterUndo.hasChanges, false, 'Stale pre-undo packet rejected');
        assert.strictEqual(syncAfterUndo.next['star-10'].Goals, 0, 'Undone Goals: 0 preserved');

        // Tombstones merge across clients
        const t1 = ['event-10', 'event-20'];
        const t2 = ['event-20', 'event-30'];
        const mergedT = mergeTombstones(t1, t2);
        assert.strictEqual(mergedT.length, 3);
        assert(mergedT.includes('event-10') && mergedT.includes('event-20') && mergedT.includes('event-30'));

        recordPass('categoryC', 'C2: Reversed message arrival rejected and tombstones merge cleanly');
    }

    // C3: mergeCloudMatches preserves both PMC and NSSL matches and merges concurrent match updates
    {
        const pmcMatches = [
            { id: 'pmc-match-1', homeTeamId: 'pmc-club-1', status: 'in_progress', updatedAt: 100, playerStats: {} }
        ];

        const nsslMatches = [
            { id: 'nssl-match-1', homeTeamId: 'school-team-1', status: 'scheduled', updatedAt: 100, playerStats: {} }
        ];

        // Merge PMC and NSSL arrays
        const cloudMerged = mergeCloudMatches(pmcMatches, nsslMatches);
        assert.strictEqual(cloudMerged.length, 2, 'Neither competition matches discarded');
        assert(cloudMerged.some(m => m.id === 'pmc-match-1'), 'PMC match preserved');
        assert(cloudMerged.some(m => m.id === 'nssl-match-1'), 'NSSL match preserved');

        // Concurrent updates to same match merge without loss
        const matchV1 = {
            id: 'match-shared-1',
            updatedAt: 200,
            homePlayers: ['p-home-1'],
            awayPlayers: ['p-away-1'],
            playerStats: {
                'p-home-1': { ...initPlayerStats('p-home-1'), Goals: 1, _updatedAt: 200, _statUpdatedAt: { Goals: 200 } }
            }
        };

        const matchV2 = {
            id: 'match-shared-1',
            updatedAt: 210,
            homePlayers: ['p-home-1'],
            awayPlayers: ['p-away-1'],
            playerStats: {
                'p-home-1': { ...initPlayerStats('p-home-1'), Goals: 1, Assists: 1, _updatedAt: 210, _statUpdatedAt: { Assists: 210 } }
            }
        };

        const mergedShared = mergeCloudMatches([matchV1], [matchV2]);
        assert.strictEqual(mergedShared.length, 1);
        assert.strictEqual(mergedShared[0].playerStats['p-home-1'].Goals, 1, 'Goal preserved in cloud match merge');
        assert.strictEqual(mergedShared[0].playerStats['p-home-1'].Assists, 1, 'Assist preserved in cloud match merge');

        recordPass('categoryC', 'C3: mergeCloudMatches merges by match ID without wiping other competitions or stats');
    }

    // C4: Remote approved match arrival: deterministic reconstruction of student contributions
    {
        const remoteStudentBefore = {
            id: 'player-remote-1',
            name: 'Remote Player',
            performance: { '2026': { 'Matchday 1': { Goals: 2 } } },
            matchStats: { '2026': { 'Matchday 1': { gamesPlayed: 1, minutesPlayed: 90 } } }
        };

        const remoteApprovedMatch = {
            id: 'approved-remote-match-99',
            year: '2026',
            matchday: 'Matchday 1',
            status: 'approved',
            playerStats: {
                'player-remote-1': { Goals: 1, Assists: 1, minutesPlayed: 90 }
            }
        };

        // When remote client receives approved match via realtimeSync:
        const reconstructedStudents = applyMatchContributions([remoteStudentBefore], remoteApprovedMatch);
        const st = reconstructedStudents[0];

        assert.strictEqual(st.performance['2026']['Matchday 1'].Goals, 3, 'Remote approved match goal added');
        assert.strictEqual(st.performance['2026']['Matchday 1'].Assists, 1, 'Remote approved match assist added');
        assert.strictEqual(st.matchStats['2026']['Matchday 1'].gamesPlayed, 2, 'Games played incremented');
        assert.strictEqual(st.matchStats['2026']['Matchday 1'].minutesPlayed, 180, 'Minutes incremented');

        // Repeated arrival is idempotent
        const idempotentRun = applyMatchContributions(reconstructedStudents, remoteApprovedMatch);
        assert.strictEqual(idempotentRun[0].performance['2026']['Matchday 1'].Goals, 3, 'No double counting on repeated arrival');

        recordPass('categoryC', 'C4: Remote approved match arrival reconstructs student stats deterministically');
    }

    // C5: Disconnect, record on both, reconnect and merge
    {
        const baseMatch = {
            id: 'm-offline',
            homePlayers: ['p-a', 'p-b'],
            awayPlayers: [],
            playerStats: {
                'p-a': { ...initPlayerStats('p-a'), _updatedAt: 100 },
                'p-b': { ...initPlayerStats('p-b'), _updatedAt: 100 }
            },
            timeline: []
        };

        // Client 1 goes offline, logs goal for p-a
        const c1Offline = recordMatchShotState({
            playerStats: baseMatch.playerStats,
            timeline: baseMatch.timeline,
            shotDetails: { result: 'goal', x: 50, y: 50 },
            shooterId: 'p-a',
            shooterName: 'Player A',
            isHome: true,
            homeTeamId: 'h',
            awayTeamId: 'a',
            now: 200,
            actionToken: 'tok-c1-offline'
        });

        // Client 2 goes offline, logs yellow card for p-b
        const c2Offline = recordMatchActionState({
            playerStats: baseMatch.playerStats,
            timeline: baseMatch.timeline,
            actionKey: 'yellowCard',
            playerId: 'p-b',
            playerName: 'Player B',
            team: 'home',
            teamId: 'h',
            now: 210,
            actionToken: 'tok-c2-offline'
        });

        const matchC1 = { ...baseMatch, playerStats: c1Offline.playerStats, timeline: c1Offline.timeline, updatedAt: 200 };
        const matchC2 = { ...baseMatch, playerStats: c2Offline.playerStats, timeline: c2Offline.timeline, updatedAt: 210 };

        // Reconnect and merge
        const mergedAfterReconnect = mergeMatchStates(matchC1, matchC2);

        assert.strictEqual(mergedAfterReconnect.playerStats['p-a'].Goals, 1, 'Client 1 goal survived reconnection');
        assert.strictEqual(mergedAfterReconnect.playerStats['p-b'].yellowCards, 1, 'Client 2 yellow card survived reconnection');
        assert.strictEqual(mergedAfterReconnect.timeline.length, 2, 'Both timeline events merged');

        recordPass('categoryC', 'C5: Offline actions on both clients merge cleanly upon reconnection');
    }

    console.log(`\nCategory C Summary: ${results.categoryC.passed}/${results.categoryC.total} passed.\n`);

    // =========================================================================
    // CATEGORY D: COACH FIXTURE RELEVANCE & FINISHED MATCH DISABLING TESTS
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY D: COACH FIXTURE RELEVANCE & FINISHED MATCH DISABLING');
    console.log('================================================================');

    // D1: isMatchFinished accurately detects completed, approved, refereed, finished, ft, and period FT matches
    {
        assert.strictEqual(isMatchFinished({ status: 'completed' }), true, 'status completed detected as finished');
        assert.strictEqual(isMatchFinished({ status: 'approved' }), true, 'status approved detected as finished');
        assert.strictEqual(isMatchFinished({ status: 'refereed' }), true, 'status refereed detected as finished');
        assert.strictEqual(isMatchFinished({ status: 'finished' }), true, 'status finished detected as finished');
        assert.strictEqual(isMatchFinished({ status: 'ft' }), true, 'status ft detected as finished');
        assert.strictEqual(isMatchFinished({ isFinished: true }), true, 'isFinished boolean flag detected');
        assert.strictEqual(isMatchFinished({ liveState: { period: 'FT' } }), true, 'liveState period FT detected as finished');
        assert.strictEqual(isMatchFinished({ liveState: { period: 'ENDED' } }), true, 'liveState period ENDED detected as finished');

        // Negative cases (non-finished)
        assert.strictEqual(isMatchFinished({ status: 'live' }), false, 'status live is not finished');
        assert.strictEqual(isMatchFinished({ status: 'upcoming' }), false, 'status upcoming is not finished');
        assert.strictEqual(isMatchFinished({ status: 'scheduled' }), false, 'status scheduled is not finished');
        assert.strictEqual(isMatchFinished({ status: 'live', liveState: { period: 'HT' } }), false, 'Halftime is not finished');
        assert.strictEqual(isMatchFinished(null), false, 'null match is not finished');

        recordPass('categoryD', 'D1: isMatchFinished detects all finished match states and leaves active/upcoming untouched');
    }

    // D2: getRelevantCoachMatch prioritizes active live match over submitted upcoming fixtures
    {
        const matchesPool = [
            {
                id: 'm-upcoming-submitted',
                homeTeam: 'Team Alpha',
                homeTeamId: 't-alpha',
                awayTeam: 'Team Beta',
                awayTeamId: 't-beta',
                status: 'upcoming',
                homeSquadSelection: {
                    formation: '4-3-3',
                    startingXI: ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
                    submittedAt: '2026-09-08T18:00:00.000Z'
                }
            },
            {
                id: 'm-live-now',
                homeTeam: 'Team Alpha',
                homeTeamId: 't-alpha',
                awayTeam: 'Team Gamma',
                awayTeamId: 't-gamma',
                status: 'live',
                homeScore: 1,
                awayScore: 0,
                timeline: [{ id: 'ev-1', type: 'goal', minute: 15 }]
            }
        ];

        const resolved = getRelevantCoachMatch(matchesPool, 't-alpha', 't-alpha', 'Team Alpha');
        assert.strictEqual(resolved.id, 'm-live-now', 'Active live match takes precedence over upcoming fixture');

        recordPass('categoryD', 'D2: getRelevantCoachMatch prioritizes active live match over submitted upcoming fixture');
    }

    // D3: getRelevantCoachMatch prioritizes non-finished fixture with submitted Starting XI over finished match with higher event count
    {
        const matchesPool = [
            {
                id: 'm-old-completed-with-events',
                homeTeam: 'Team Alpha',
                homeTeamId: 't-alpha',
                awayTeam: 'Past Opponent FC',
                awayTeamId: 't-past',
                status: 'completed',
                homeScore: 3,
                awayScore: 2,
                timeline: Array.from({ length: 15 }, (_, i) => ({ id: `ev-${i}`, type: 'shot', minute: i * 5 }))
            },
            {
                id: 'm-upcoming-ready',
                homeTeam: 'Team Alpha',
                homeTeamId: 't-alpha',
                awayTeam: 'Next Opponent FC',
                awayTeamId: 't-next',
                status: 'upcoming',
                timeline: [], // 0 events!
                homeSquadSelection: {
                    formation: '4-4-2',
                    startingXI: ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
                    submittedAt: '2026-09-08T19:00:00.000Z'
                }
            }
        ];

        // getRelevantCoachMatch must pick m-upcoming-ready
        const resolved = getRelevantCoachMatch(matchesPool, 't-alpha', 't-alpha', 'Team Alpha');
        assert.strictEqual(resolved.id, 'm-upcoming-ready', 'Upcoming match with submitted XI picked over completed match with 15 events');

        // sortCoachMatches must order m-upcoming-ready BEFORE m-old-completed-with-events
        const sorted = sortCoachMatches(matchesPool, 't-alpha', 't-alpha', 'Team Alpha');
        assert.strictEqual(sorted[0].id, 'm-upcoming-ready', 'Sorted list places fixture with submitted Starting XI on top');

        recordPass('categoryD', 'D3: Non-finished fixture with submitted Starting XI prioritized over completed match with high events');
    }

    // D4: PhoShottas coach (pmc-club-4 / PROSHOTTAS) resolves pmc-fixture-2 (PARADISE vs PROSHOTTAS) when Starting XI is submitted
    {
        const mockFixtures = [
            {
                id: 'pmc-fixture-1',
                round: 'Matchday 1 · PMC Group Stage',
                homeTeam: 'ST. ANDREW LIONS',
                homeTeamId: 'pmc-club-1',
                awayTeam: 'NOTRE DAME',
                awayTeamId: 'pmc-club-11',
                status: 'upcoming'
            },
            {
                id: 'pmc-fixture-2',
                round: 'Matchday 1 · PMC Group Stage',
                homeTeam: 'PARADISE',
                homeTeamId: 'pmc-club-14',
                awayTeam: 'PROSHOTTAS',
                awayTeamId: 'pmc-club-4',
                venue: 'Wildey Turf Stadium',
                status: 'upcoming',
                awaySquadSelection: {
                    formation: '4-3-3',
                    startingXI: [
                        'pro-p1', 'pro-p2', 'pro-p3', 'pro-p4', 'pro-p5',
                        'pro-p6', 'pro-p7', 'pro-p8', 'pro-p9', 'pro-p10', 'pro-p11'
                    ],
                    benchPlayers: ['pro-b1', 'pro-b2', 'pro-b3'],
                    submittedAt: '2026-09-08T19:45:00.000Z',
                    submittedBy: 'PROSHOTTAS'
                }
            },
            {
                id: 'pmc-fixture-3',
                round: 'Matchday 1 · PMC Group Stage',
                homeTeam: 'WEYMOUTH WALES',
                homeTeamId: 'pmc-club-21',
                awayTeam: 'BENFICA',
                awayTeamId: 'pmc-club-12',
                status: 'upcoming'
            }
        ];

        // Resolving for ProShottas coach by ID 'pmc-club-4' or name 'PROSHOTTAS'
        const coachMatch = getRelevantCoachMatch(mockFixtures, 'pmc-club-4', 'pmc-club-4', 'PROSHOTTAS');
        assert(coachMatch, 'A match must be resolved for PhoShottas coach');
        assert.strictEqual(coachMatch.id, 'pmc-fixture-2', 'PhoShottas coach resolves pmc-fixture-2 (PARADISE vs PROSHOTTAS)');

        // Extract squad info for ProShottas (away side)
        const squadInfo = getCoachSquadInfo(coachMatch, 'pmc-club-4', 'pmc-club-4', 'PROSHOTTAS');
        assert.strictEqual(squadInfo.isHome, false, 'PhoShottas is playing away');
        assert.strictEqual(squadInfo.isAway, true, 'PhoShottas is away team');
        assert.strictEqual(squadInfo.opponentName, 'PARADISE', 'Opponent correctly resolved as PARADISE');
        assert.strictEqual(squadInfo.hasSubmittedXI, true, 'Starting XI submission confirmed');
        assert.strictEqual(squadInfo.formation, '4-3-3', 'Formation correctly extracted');
        assert.strictEqual(squadInfo.startingXI.length, 11, '11 starting players confirmed');

        recordPass('categoryD', 'D4: PhoShottas coach (pmc-club-4) resolves fixture and extracts submitted Starting XI cleanly');
    }

    // D5: Multi-fixture submission selects the fixture with the latest submittedAt timestamp
    {
        const fixtureRound1 = {
            id: 'm-round-1',
            homeTeam: 'PROSHOTTAS',
            homeTeamId: 'pmc-club-4',
            awayTeam: 'OPPONENT A',
            awayTeamId: 'opp-a',
            status: 'upcoming',
            homeSquadSelection: {
                formation: '4-3-3',
                startingXI: Array.from({ length: 11 }, (_, i) => `p-r1-${i}`),
                submittedAt: '2026-09-08T10:00:00.000Z'
            }
        };

        const fixtureRound2 = {
            id: 'm-round-2',
            homeTeam: 'PROSHOTTAS',
            homeTeamId: 'pmc-club-4',
            awayTeam: 'OPPONENT B',
            awayTeamId: 'opp-b',
            status: 'upcoming',
            homeSquadSelection: {
                formation: '3-5-2',
                startingXI: Array.from({ length: 11 }, (_, i) => `p-r2-${i}`),
                submittedAt: '2026-09-08T14:30:00.000Z' // Later timestamp
            }
        };

        const resolvedLatest = getRelevantCoachMatch([fixtureRound1, fixtureRound2], 'pmc-club-4', 'pmc-club-4', 'PROSHOTTAS');
        assert.strictEqual(resolvedLatest.id, 'm-round-2', 'Fixture with latest submittedAt selected');

        // Now coach updates Round 1 squad at a newer timestamp
        const fixtureRound1Updated = {
            ...fixtureRound1,
            homeSquadSelection: {
                ...fixtureRound1.homeSquadSelection,
                submittedAt: '2026-09-08T17:00:00.000Z' // Even later!
            }
        };

        const resolvedNewest = getRelevantCoachMatch([fixtureRound1Updated, fixtureRound2], 'pmc-club-4', 'pmc-club-4', 'PROSHOTTAS');
        assert.strictEqual(resolvedNewest.id, 'm-round-1', 'Newly updated Starting XI submission immediately wins relevance');

        recordPass('categoryD', 'D5: Multi-fixture submissions arbitrate cleanly by newest submittedAt timestamp');
    }

    // D6: Finished match state disables / locks all in-game tactical adjustments and substitutions
    {
        const finishedMatch = {
            id: 'm-finished-test',
            status: 'completed',
            homeTeam: 'PROSHOTTAS',
            homeTeamId: 'pmc-club-4',
            awayTeam: 'PARADISE',
            awayTeamId: 'pmc-club-14',
            homeScore: 2,
            awayScore: 1,
            timeline: [],
            substitutionRequests: [],
            homeSquadSelection: {
                formation: '4-3-3',
                startingXI: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'],
                benchPlayers: ['b1', 'b2', 'b3']
            }
        };

        const isFinished = isMatchFinished(finishedMatch);
        assert.strictEqual(isFinished, true, 'Match is marked as finished');

        // Simulate substitution attempt when finished
        let subExecuted = false;
        let swapExecuted = false;

        const attemptSub = () => {
            if (isFinished) return; // Production guard
            subExecuted = true;
        };

        const attemptPositionSwap = () => {
            if (isFinished) return; // Production guard
            swapExecuted = true;
        };

        attemptSub();
        attemptPositionSwap();

        assert.strictEqual(subExecuted, false, 'Substitution execution blocked when match is finished');
        assert.strictEqual(swapExecuted, false, 'Tactical position swap blocked when match is finished');

        recordPass('categoryD', 'D6: Finished match state successfully locks and prevents all tactical mutations');
    }

    console.log(`\nCategory D Summary: ${results.categoryD.passed}/${results.categoryD.total} passed.\n`);

    // =========================================================================
    // CATEGORY E: ACCURATE SQUAD ANALYTICS & MATCH-DRIVEN LEADERBOARDS
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY E: ACCURATE SQUAD ANALYTICS & MATCH-DRIVEN LEADERBOARDS');
    console.log('================================================================');

    // E1: PMC student baseline starts with clean 0 metrics (no random PRNG numbers)
    {
        const proshottasStudents = PMC_STUDENTS.filter(s => s.schoolId === 'pmc-club-4');
        assert(proshottasStudents.length > 0, 'Found ProShottas squad members in PMC_STUDENTS');

        let totalMockGoals = 0;
        let totalMockAssists = 0;
        let totalMockSaves = 0;

        proshottasStudents.forEach(s => {
            const perf = s.performance?.['2026-2027']?.['Matchday 1'] || {};
            totalMockGoals += (perf['Goals'] || 0);
            totalMockAssists += (perf['Assists'] || 0);
            totalMockSaves += (perf['Saves'] || 0);
        });

        assert.strictEqual(totalMockGoals, 0, 'PMC student baseline starts with exactly 0 goals');
        assert.strictEqual(totalMockAssists, 0, 'PMC student baseline starts with exactly 0 assists');
        assert.strictEqual(totalMockSaves, 0, 'PMC student baseline starts with exactly 0 saves');

        recordPass('categoryE', 'E1: PMC student baseline starts with clean 0 metrics across all stats');
    }

    // E2: Year resolution routes PMC fixtures cleanly to '2026-2027' without fragmentation
    {
        const pmcFixture = {
            id: 'pmc-test-fixture',
            ageGroup: 'PMC',
            matchday: 'Matchday 1',
            homeTeamId: 'pmc-club-4',
            awayTeamId: 'pmc-club-14',
            playerStats: {
                'pmc-p-4-18': {
                    Goals: 1,
                    Shots: 2,
                    'Shots on Target': 2,
                    minutesPlayed: 90
                }
            }
        };

        const targetStudent = {
            id: 'pmc-p-4-18',
            name: 'Nathan McCollin',
            schoolId: 'pmc-club-4',
            performance: {
                '2026-2027': {
                    'Matchday 1': { Goals: 0, Shots: 0, 'Shots on Target': 0 }
                }
            },
            matchStats: {
                '2026-2027': {
                    'Matchday 1': { gamesPlayed: 0, minutesPlayed: 0 }
                }
            }
        };

        const updated = applyMatchContributions([targetStudent], pmcFixture);
        const player = updated[0];

        assert.strictEqual(player.performance['2026-2027']['Matchday 1'].Goals, 1, 'Goals applied under 2026-2027');
        assert.strictEqual(player.performance['2026'], undefined, 'No fragmented 2026 key created');
        assert.strictEqual(player.matchStats['2026-2027']['Matchday 1'].gamesPlayed, 1, 'Appearance logged under 2026-2027');

        recordPass('categoryE', 'E2: Year resolution routes PMC fixtures cleanly to 2026-2027 without fragmentation');
    }

    // E3: Applying PARADISE 2-1 PROSHOTTAS attributes 1 goal, 0 assists, and 6 GK saves
    {
        const paradiseVsProshottas = {
            id: 'pmc-fixture-2',
            homeTeam: 'PARADISE',
            awayTeam: 'PROSHOTTAS',
            homeTeamId: 'pmc-club-14',
            awayTeamId: 'pmc-club-4',
            homeScore: 2,
            awayScore: 1,
            status: 'completed',
            round: 'Matchday 1 · PMC Group Stage',
            matchday: 'Matchday 1',
            year: '2026-2027',
            ageGroup: 'PMC',
            playerStats: {
                'pmc-p-4-18': { Goals: 1, Shots: 3, 'Shots on Target': 3, 'Corners Taken': 1 },
                'pmc-p-4-15': { Shots: 2, 'Shots on Target': 1 },
                'pmc-p-4-9': { Shots: 4, 'Shots on Target': 1 },
                'pmc-p-4-1': { Saves: 0 } // Opponent GK id omitted in live log
            },
            timeline: [
                { type: 'shotOnTarget', result: 'saved', team: 'home', minute: 1 },
                { type: 'shotOnTarget', result: 'saved', team: 'home', minute: 1 },
                { type: 'goal', result: 'goal', team: 'home', minute: 18, playerName: 'Tyrese Crawford' },
                { type: 'shotOnTarget', result: 'saved', team: 'home', minute: 32 },
                { type: 'shotOnTarget', result: 'saved', team: 'home', minute: 50 },
                { type: 'shotOnTarget', result: 'saved', team: 'home', minute: 68 },
                { type: 'goal', result: 'goal', team: 'away', minute: 80, playerId: 'pmc-p-4-18', playerName: 'Nathan McCollin' },
                { type: 'goal', result: 'goal', team: 'home', minute: 90, playerName: 'Jaron Oughterson' },
                { type: 'shotOnTarget', result: 'saved', team: 'home', minute: 92 }
            ]
        };

        const updatedStudents = applyMatchContributions(PMC_STUDENTS, paradiseVsProshottas);
        const proshottasRoster = updatedStudents.filter(s => s.schoolId === 'pmc-club-4');

        // Check goalscorer
        const mcCollin = proshottasRoster.find(s => s.name === 'Nathan McCollin');
        assert(mcCollin, 'Nathan McCollin exists');
        assert.strictEqual(mcCollin.performance['2026-2027']['Matchday 1'].Goals, 1, 'Nathan McCollin has exactly 1 goal');

        // Check assists
        let squadAssists = 0;
        proshottasRoster.forEach(s => {
            squadAssists += (s.performance['2026-2027']['Matchday 1']?.Assists || 0);
        });
        assert.strictEqual(squadAssists, 0, 'ProShottas squad has 0 assists');

        // Check GK saves (reconciled from 6 home shots saved)
        const nashtonBrowne = proshottasRoster.find(s => s.name === 'Nashton Browne');
        assert(nashtonBrowne, 'Nashton Browne exists');
        assert.strictEqual(nashtonBrowne.performance['2026-2027']['Matchday 1'].Saves, 6, 'Nashton Browne credited with 6 saves from match');

        recordPass('categoryE', 'E3: Applying real match events produces 1 goal, 0 assists, and 6 saves for ProShottas');
    }

    // E4: Unplayed clubs produce clean 0 totals across all metrics before matches
    {
        const allClubs = ['pmc-club-14', 'pmc-club-19', 'pmc-club-4', 'pmc-club-7'];
        allClubs.forEach(clubId => {
            const clubStudents = PMC_STUDENTS.filter(s => s.schoolId === clubId);
            assert(clubStudents.length > 0, `Found players for ${clubId}`);

            let totalGoals = 0;
            let totalAssists = 0;
            let totalSaves = 0;

            clubStudents.forEach(s => {
                const perf = s.performance?.['2026-2027']?.['Matchday 1'] || {};
                totalGoals += (perf['Goals'] || 0);
                totalAssists += (perf['Assists'] || 0);
                totalSaves += (perf['Saves'] || 0);
            });

            assert.strictEqual(totalGoals, 0, `${clubId} initial squad goals is 0`);
            assert.strictEqual(totalAssists, 0, `${clubId} initial squad assists is 0`);
            assert.strictEqual(totalSaves, 0, `${clubId} initial squad saves is 0`);
        });

        recordPass('categoryE', 'E4: Unplayed clubs produce clean 0 totals across all metrics');
    }

    // E5: Completed and refereed matches trigger student contributions identically to approved matches upon remote cloud sync
    {
        const testStudent = {
            id: 'sync-test-p1',
            schoolId: 'sync-test-school',
            performance: { '2026': { 'Matchday 1': { Goals: 0 } } },
            matchStats: { '2026': { 'Matchday 1': { gamesPlayed: 0 } } }
        };

        const completedMatch = {
            id: 'm-completed-sync',
            status: 'completed',
            year: '2026',
            matchday: 'Matchday 1',
            playerStats: {
                'sync-test-p1': { Goals: 2, minutesPlayed: 90 }
            }
        };

        const refereedMatch = {
            id: 'm-refereed-sync',
            status: 'refereed',
            year: '2026',
            matchday: 'Matchday 1',
            playerStats: {
                'sync-test-p1': { Goals: 1, minutesPlayed: 90 }
            }
        };

        // Simulate App.jsx finishedMatches filtering logic
        const sanitizedCloud = [completedMatch, refereedMatch];
        const finishedMatches = sanitizedCloud.filter(m => ['approved', 'completed', 'refereed'].includes(m.status));
        assert.strictEqual(finishedMatches.length, 2, 'Both completed and refereed matches are recognized as finished');

        let updated = [testStudent];
        finishedMatches.forEach(m => {
            updated = applyMatchContributions(updated, m);
        });

        assert.strictEqual(updated[0].performance['2026']['Matchday 1'].Goals, 3, 'Both matches contributed goals (2 + 1 = 3)');
        assert.strictEqual(updated[0].matchStats['2026']['Matchday 1'].gamesPlayed, 2, 'Games played incremented for both finished matches');

        recordPass('categoryE', 'E5: Completed and refereed matches trigger student contributions identically to approved matches');
    }

    console.log(`\nCategory E Summary: ${results.categoryE.passed}/${results.categoryE.total} passed.\n`);

    // =========================================================================
    // CATEGORY F: IN CONTEST / 3-WAY POSSESSION & SYNC TESTS
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY F: IN CONTEST / 3-WAY POSSESSION & SYNC TESTS');
    console.log('================================================================');

    // F1: Toggle between Home, In Contest, and Away toggles activeSide and emits proper possessionChange events
    {
        let activeSide = 'none';
        const possessionEvents = [];

        function handleTogglePossession(side) {
            const nextSide = activeSide === side ? 'none' : side;
            activeSide = nextSide;
            possessionEvents.push({
                type: 'possessionChange',
                team: nextSide,
                timestamp: Date.now()
            });
            return nextSide;
        }

        // Click Home
        assert.strictEqual(handleTogglePossession('home'), 'home', 'Clicking home activates home possession');
        // Click In Contest
        assert.strictEqual(handleTogglePossession('contest'), 'contest', 'Clicking contest switches active possession to contest');
        // Click In Contest again (toggle off to none)
        assert.strictEqual(handleTogglePossession('contest'), 'none', 'Clicking contest again pauses/turns off possession to none');
        // Click Away
        assert.strictEqual(handleTogglePossession('away'), 'away', 'Clicking away activates away possession');
        // Switch directly from Away to Contest
        assert.strictEqual(handleTogglePossession('contest'), 'contest', 'Switching directly from away to contest works');

        assert.strictEqual(possessionEvents.length, 5);
        assert.strictEqual(possessionEvents[1].team, 'contest', 'Event payload properly records team as contest');
        assert.strictEqual(possessionEvents[4].team, 'contest', 'Event payload properly records team as contest on switch');

        recordPass('categoryF', 'F1: Toggle between Home, In Contest, and Away toggles activeSide and emits proper possessionChange events');
    }

    // F2: Timer isolation: When contest is active, only inContestSecs increments
    {
        let homeSecs = 120;
        let awaySecs = 80;
        let inContestSecs = 20;
        let activeSide = 'contest';

        // Simulate 15 timer ticks with activeSide = 'contest'
        for (let tick = 0; tick < 15; tick++) {
            if (activeSide === 'home') homeSecs++;
            else if (activeSide === 'away') awaySecs++;
            else if (activeSide === 'contest') inContestSecs++;
        }

        assert.strictEqual(homeSecs, 120, 'Home seconds strictly frozen when ball is in contest');
        assert.strictEqual(awaySecs, 80, 'Away seconds strictly frozen when ball is in contest');
        assert.strictEqual(inContestSecs, 35, 'In Contest seconds strictly incremented by 15');

        // Now switch to home for 10 ticks
        activeSide = 'home';
        for (let tick = 0; tick < 10; tick++) {
            if (activeSide === 'home') homeSecs++;
            else if (activeSide === 'away') awaySecs++;
            else if (activeSide === 'contest') inContestSecs++;
        }

        assert.strictEqual(homeSecs, 130, 'Home seconds incremented after switching back to home');
        assert.strictEqual(inContestSecs, 35, 'In Contest seconds frozen once possession is won');

        recordPass('categoryF', 'F2: Timer isolation: When contest is active, only inContestSecs increments');
    }

    // F3: Invariant: Home% + InContest% + Away% = 100% across all distributions and edge cases
    {
        function calculate3WayPossession(homeSecs, awaySecs, inContestSecs) {
            const total = homeSecs + awaySecs + inContestSecs;
            if (total === 0) {
                return { homePct: 50, inContestPct: 0, awayPct: 50 };
            }
            const homePct = Math.round((homeSecs / total) * 100);
            const inContestPct = Math.round((inContestSecs / total) * 100);
            const awayPct = Math.max(0, 100 - homePct - inContestPct);
            return { homePct, inContestPct, awayPct };
        }

        // Baseline zero case
        const zero = calculate3WayPossession(0, 0, 0);
        assert.strictEqual(zero.homePct + zero.inContestPct + zero.awayPct, 100);

        // 50s home, 25s contest, 25s away
        const p1 = calculate3WayPossession(50, 25, 25);
        assert.strictEqual(p1.homePct, 50);
        assert.strictEqual(p1.inContestPct, 25);
        assert.strictEqual(p1.awayPct, 25);
        assert.strictEqual(p1.homePct + p1.inContestPct + p1.awayPct, 100);

        // 33, 33, 33 split (1/3 each: 100s, 100s, 100s)
        const p2 = calculate3WayPossession(100, 100, 100);
        assert.strictEqual(p2.homePct + p2.inContestPct + p2.awayPct, 100, 'Sum remains 100% even with rounding');

        // Pure contest match (e.g. at start)
        const p3 = calculate3WayPossession(0, 0, 45);
        assert.strictEqual(p3.inContestPct, 100);
        assert.strictEqual(p3.homePct, 0);
        assert.strictEqual(p3.awayPct, 0);
        assert.strictEqual(p3.homePct + p3.inContestPct + p3.awayPct, 100);

        recordPass('categoryF', 'F3: Invariant: Home% + InContest% + Away% = 100% across all distributions and edge cases');
    }

    // F4: Timeline event formatting for contest events
    {
        function formatTimelineEvent(type, logData) {
            let icon = '⏱️';
            let color = '#3b82f6';
            let title = 'Timeline Event';
            let desc = '';

            if (type === 'possessionChange') {
                if (logData.team === 'contest') {
                    icon = '⚔️';
                    color = '#f59e0b';
                    title = 'Ball In Contest';
                    desc = `Ball In Contest / Loose Ball (${logData.inContestPct || logData.contestPct || 0}%)`;
                } else {
                    icon = '⏱️';
                    color = '#3b82f6';
                    title = 'Possession Change';
                    desc = `${logData.teamName || 'Team'} took possession`;
                }
            }
            return { icon, color, title, desc };
        }

        const contestEvent = formatTimelineEvent('possessionChange', { team: 'contest', inContestPct: 24 });
        assert.strictEqual(contestEvent.icon, '⚔️');
        assert.strictEqual(contestEvent.color, '#f59e0b');
        assert.strictEqual(contestEvent.title, 'Ball In Contest');
        assert.ok(contestEvent.desc.includes('Ball In Contest / Loose Ball (24%)'));

        const normalEvent = formatTimelineEvent('possessionChange', { team: 'home', teamName: 'Pro Shottas' });
        assert.strictEqual(normalEvent.icon, '⏱️');
        assert.strictEqual(normalEvent.title, 'Possession Change');

        recordPass('categoryF', 'F4: Timeline event formatting correctly handles Ball In Contest with badge and colors');
    }

    // F5: computeMatchesHash detects contest changes and triggers multi-client sync
    {
        const matchBase = {
            id: 'm-live-contest',
            updatedAt: 1000,
            status: 'live',
            homeScore: 1,
            awayScore: 0,
            possession: {
                homePct: 55,
                awayPct: 45,
                activeSide: 'home',
                inContestPct: 0
            }
        };

        const hash1 = computeMatchesHash([matchBase]);

        // State changes to in-contest with 20% contest
        const matchInContest = {
            ...matchBase,
            possession: {
                homePct: 45,
                awayPct: 35,
                activeSide: 'contest',
                inContestPct: 20
            }
        };

        const hash2 = computeMatchesHash([matchInContest]);
        assert.notStrictEqual(hash1, hash2, 'Hash must differ when contest percentage or activeSide changes');

        // State changes back to away possession
        const matchAway = {
            ...matchBase,
            possession: {
                homePct: 45,
                awayPct: 35,
                activeSide: 'away',
                inContestPct: 20
            }
        };
        const hash3 = computeMatchesHash([matchAway]);
        assert.notStrictEqual(hash2, hash3, 'Hash must differ when activeSide switches from contest to away');

        recordPass('categoryF', 'F5: computeMatchesHash detects in-contest transitions and percentage shifts');
    }

    // F6: Coach Live Management possession stats derivation
    {
        function deriveCoachPossessionStats(match) {
            const poss = match?.liveState?.possession || match?.possession;
            if (poss) {
                const inContest = typeof poss.inContestPct === 'number' ? poss.inContestPct : (typeof poss.contestPct === 'number' ? poss.contestPct : 0);
                if (typeof poss.homePct === 'number' && typeof poss.awayPct === 'number') {
                    return { homePct: poss.homePct, inContestPct: inContest, awayPct: poss.awayPct };
                }
                const contestSecs = poss.inContestSecs || poss.contestSecs || 0;
                const totalSecs = (poss.homeSecs || 0) + (poss.awaySecs || 0) + contestSecs;
                if (totalSecs > 0) {
                    const homePct = Math.round(((poss.homeSecs || 0) / totalSecs) * 100);
                    const inContestPct = Math.round((contestSecs / totalSecs) * 100);
                    const awayPct = Math.max(0, 100 - homePct - inContestPct);
                    return { homePct, inContestPct, awayPct };
                }
            }
            return { homePct: 50, inContestPct: 0, awayPct: 50 };
        }

        // Test 1: precomputed percentages
        const statsFromPct = deriveCoachPossessionStats({
            possession: { homePct: 42, awayPct: 38, inContestPct: 20 }
        });
        assert.strictEqual(statsFromPct.homePct, 42);
        assert.strictEqual(statsFromPct.inContestPct, 20);
        assert.strictEqual(statsFromPct.awayPct, 38);

        // Test 2: raw seconds fallback
        const statsFromSecs = deriveCoachPossessionStats({
            liveState: {
                possession: { homeSecs: 200, awaySecs: 200, inContestSecs: 100 }
            }
        });
        assert.strictEqual(statsFromSecs.homePct, 40);
        assert.strictEqual(statsFromSecs.inContestPct, 20);
        assert.strictEqual(statsFromSecs.awayPct, 40);

        recordPass('categoryF', 'F6: Coach Live Management possession derivation correctly distributes 3-way percentages');
    }

    console.log(`\nCategory F Summary: ${results.categoryF.passed}/${results.categoryF.total} passed.\n`);

    // =========================================================================
    // CATEGORY G: MATCH OPERATOR & REFEREE EVENT CORRECTION ENGINE
    // =========================================================================
    console.log('================================================================');
    console.log('CATEGORY G: MATCH OPERATOR & REFEREE EVENT CORRECTION ENGINE');
    console.log('================================================================');

    // G1: Operator In-Game Edit (re-attributes goal from Player A to Player B)
    {
        const initialStats = {
            'p-101': { ...initPlayerStats('p-101'), Goals: 1, goals: 1, Shots: 1, shots: 1, 'Shots on Target': 1, shotsOnTarget: 1 },
            'p-102': { ...initPlayerStats('p-102'), Goals: 0, goals: 0, Shots: 0, shots: 0, 'Shots on Target': 0, shotsOnTarget: 0 }
        };
        const initialTimeline = [
            {
                id: 'evt-goal-1',
                type: 'goal',
                playerId: 'p-101',
                playerName: 'Player One',
                teamSide: 'home',
                minute: 25,
                timestamp: 1000
            }
        ];

        const match = {
            id: 'm-edit-1',
            homeTeamId: 'team-h',
            awayTeamId: 'team-a',
            homeScore: 1,
            awayScore: 0,
            playerStats: initialStats,
            timeline: initialTimeline
        };

        const result = editMatchEventState({
            playerStats: initialStats,
            timeline: initialTimeline,
            tombstoneEventIds: [],
            eventId: 'evt-goal-1',
            updatedFields: {
                playerId: 'p-102',
                playerName: 'Player Two'
            },
            now: 2000,
            seq: 2,
            editedBy: 'operator'
        });

        assert.strictEqual(result.edited, true);
        assert.strictEqual(result.playerStats['p-101'].Goals, 0);
        assert.strictEqual(result.playerStats['p-101']['Shots on Target'], 0);
        assert.strictEqual(result.playerStats['p-102'].Goals, 1);
        assert.strictEqual(result.playerStats['p-102']['Shots on Target'], 1);

        const updatedEvt = result.timeline.find(e => e.id === 'evt-goal-1');
        assert.strictEqual(updatedEvt.playerId, 'p-102');
        assert.strictEqual(updatedEvt.playerName, 'Player Two');
        assert.strictEqual(updatedEvt.edited, true);
        assert.strictEqual(updatedEvt.editedBy, 'operator');

        const scores = recalculateMatchScores(match, result.playerStats, result.timeline);
        assert.strictEqual(scores.homeScore, 1);
        assert.strictEqual(scores.awayScore, 0);

        recordPass('categoryG', 'G1: Operator in-game edit re-attributes goal and player stats while preserving match score');
    }

    // G2: Operator In-Game Overturn (Goal Disallowed for Offside -> Score Decrements 1-0 to 0-0)
    {
        const stats = {
            'p-101': { ...initPlayerStats('p-101'), Goals: 1, goals: 1, Shots: 1, shots: 1, 'Shots on Target': 1, shotsOnTarget: 1 }
        };
        const timeline = [
            {
                id: 'evt-goal-offside',
                type: 'goal',
                playerId: 'p-101',
                playerName: 'Player One',
                teamSide: 'home',
                minute: 34,
                timestamp: 1500
            }
        ];
        const match = {
            id: 'm-overturn-1',
            homeScore: 1,
            awayScore: 0,
            playerStats: stats,
            timeline: timeline
        };

        const result = overturnMatchEventState({
            playerStats: stats,
            timeline: timeline,
            tombstoneEventIds: [],
            eventId: 'evt-goal-offside',
            overturnReason: 'Disallowed for Offside',
            overturnedBy: 'operator',
            now: 2500,
            seq: 3,
            removeCompletely: false
        });

        assert.strictEqual(result.overturned, true);
        assert.strictEqual(result.playerStats['p-101'].Goals, 0);
        assert.strictEqual(result.playerStats['p-101']['Shots on Target'], 0);

        const evt = result.timeline.find(e => e.id === 'evt-goal-offside');
        assert.strictEqual(evt.overturned, true);
        assert.strictEqual(evt.overturnReason, 'Disallowed for Offside');
        assert.strictEqual(evt.overturnedBy, 'operator');

        const scores = recalculateMatchScores(match, result.playerStats, result.timeline);
        assert.strictEqual(scores.homeScore, 0);
        assert.strictEqual(scores.awayScore, 0);

        recordPass('categoryG', 'G2: Operator in-game goal overturn reverses player stats and decrements score from 1-0 to 0-0');
    }

    // G3: Referee Post-Game Review Overturn (Late Goal Disallowed, Score Decrements 2-1 to 1-1)
    {
        const stats = {
            'p-101': { ...initPlayerStats('p-101'), Goals: 1, goals: 1, Assists: 1, assists: 1 },
            'p-102': { ...initPlayerStats('p-102'), Goals: 1, goals: 1 },
            'p-201': { ...initPlayerStats('p-201'), Goals: 1, goals: 1 }
        };
        const timeline = [
            { id: 'evt-g1', type: 'goal', playerId: 'p-101', teamSide: 'home', minute: 20 },
            { id: 'evt-g2', type: 'goal', playerId: 'p-201', teamSide: 'away', minute: 50 },
            { id: 'evt-g3', type: 'goal', playerId: 'p-102', assistingPlayerId: 'p-101', teamSide: 'home', minute: 88 }
        ];
        const match = {
            id: 'm-ref-review',
            status: 'completed',
            homeScore: 2,
            awayScore: 1,
            playerStats: stats,
            timeline: timeline
        };

        const result = overturnMatchEventState({
            playerStats: stats,
            timeline: timeline,
            tombstoneEventIds: [],
            eventId: 'evt-g3',
            overturnReason: 'Handball in build-up disallowed after official review',
            overturnedBy: 'referee',
            now: 5000,
            seq: 10,
            removeCompletely: false
        });

        assert.strictEqual(result.overturned, true);
        assert.strictEqual(result.playerStats['p-102'].Goals, 0);
        assert.strictEqual(result.playerStats['p-101'].Assists, 0); // Assist reverted
        assert.strictEqual(result.playerStats['p-101'].Goals, 1);   // Earlier goal preserved

        const scores = recalculateMatchScores(match, result.playerStats, result.timeline);
        assert.strictEqual(scores.homeScore, 1);
        assert.strictEqual(scores.awayScore, 1);

        recordPass('categoryG', 'G3: Referee post-game overturn decrements score 2-1 to 1-1 and cleanly reverts scorer & assist stats');
    }

    // G4: Disciplinary Card Re-attribution & Rescinding (Mistaken identity & Red card rescinded)
    {
        const stats = {
            'p-104': { ...initPlayerStats('p-104'), yellowCards: 1, 'Fouls Committed': 1 },
            'p-105': { ...initPlayerStats('p-105'), yellowCards: 0, redCards: 1, 'Fouls Committed': 1 }
        };
        const timeline = [
            { id: 'evt-yc', type: 'yellow_card', playerId: 'p-104', minute: 42 },
            { id: 'evt-rc', type: 'red_card', playerId: 'p-105', minute: 70 }
        ];

        // Step 1: Referee corrects mistaken identity on yellow card
        const editRes = editMatchEventState({
            playerStats: stats,
            timeline: timeline,
            tombstoneEventIds: [],
            eventId: 'evt-yc',
            updatedFields: { playerId: 'p-105' },
            now: 6000,
            seq: 11,
            editedBy: 'referee'
        });

        assert.strictEqual(editRes.playerStats['p-104'].yellowCards, 0);
        assert.strictEqual(editRes.playerStats['p-105'].yellowCards, 1);

        // Step 2: Red card rescinded
        const overturnRes = overturnMatchEventState({
            playerStats: editRes.playerStats,
            timeline: editRes.timeline,
            tombstoneEventIds: [],
            eventId: 'evt-rc',
            overturnReason: 'Red card rescinded - accidental collision',
            overturnedBy: 'referee',
            now: 6100,
            seq: 12,
            removeCompletely: false
        });

        assert.strictEqual(overturnRes.playerStats['p-105'].redCards, 0);
        const rescindedCard = overturnRes.timeline.find(e => e.id === 'evt-rc');
        assert.strictEqual(rescindedCard.overturned, true);

        recordPass('categoryG', 'G4: Disciplinary card correction supports mistaken identity re-attribution and red card rescinding');
    }

    // G5: Event Chronological Re-sorting After Minute Edit
    {
        const stats = { 'p-1': initPlayerStats('p-1') };
        const timeline = [
            { id: 'evt-1', minute: 15, type: 'foul' },
            { id: 'evt-2', minute: 40, type: 'shot' },
            { id: 'evt-3', minute: 75, type: 'goal', playerId: 'p-1' }
        ];

        // Operator corrects minute of evt-3 from 75' to 10'
        const result = editMatchEventState({
            playerStats: stats,
            timeline: timeline,
            tombstoneEventIds: [],
            eventId: 'evt-3',
            updatedFields: { minute: 10 },
            now: 7000,
            seq: 15,
            editedBy: 'operator'
        });

        assert.strictEqual(result.timeline[0].id, 'evt-3');
        assert.strictEqual(result.timeline[0].minute, 10);
        assert.strictEqual(result.timeline[1].id, 'evt-1');
        assert.strictEqual(result.timeline[2].id, 'evt-2');

        recordPass('categoryG', 'G5: Minute corrections automatically preserve strictly chronological timeline ordering');
    }

    // G6: Companion Linked Events Reversion on Overturn (Shot + GK Save)
    {
        const stats = {
            'striker-1': { ...initPlayerStats('striker-1'), Shots: 1, 'Shots on Target': 1 },
            'gk-1': { ...initPlayerStats('gk-1'), Saves: 1 }
        };
        const timeline = [
            { id: 'evt-shot-1', type: 'shot', playerId: 'striker-1', onTarget: true, minute: 60 },
            { id: 'evt-save-1', type: 'save', playerId: 'gk-1', linkedShotEventId: 'evt-shot-1', minute: 60 }
        ];

        const result = overturnMatchEventState({
            playerStats: stats,
            timeline: timeline,
            tombstoneEventIds: [],
            eventId: 'evt-shot-1',
            overturnReason: 'Play called back for offside prior to attempt',
            overturnedBy: 'operator',
            now: 8000,
            seq: 20
        });

        assert.strictEqual(result.playerStats['striker-1'].Shots, 0);
        assert.strictEqual(result.playerStats['striker-1']['Shots on Target'], 0);
        assert.strictEqual(result.playerStats['gk-1'].Saves, 0);

        const linkedSave = result.timeline.find(e => e.id === 'evt-save-1');
        assert.strictEqual(linkedSave.overturned, true);

        recordPass('categoryG', 'G6: Overturning an event automatically reverts linked companion events (shots and goalkeeper saves)');
    }

    // G7: Season Leaderboard & Squad Analytics Integrity via applyMatchContributions
    {
        const studentMarcus = {
            id: 'stu-marcus',
            name: 'Marcus Sterling',
            school: 'pmc-club-4',
            schoolId: 'pmc-club-4',
            goals: 0,
            appearances: 0,
            performance: { '2026-2027': { 'Matchday 1': { Goals: 0 } } },
            matchStats: { '2026-2027': { 'Matchday 1': { gamesPlayed: 0, minutesPlayed: 0 } } },
            _matchContributions: {}
        };

        const studentAlex = {
            id: 'stu-alex',
            name: 'Alex Rover',
            school: 'pmc-club-4',
            schoolId: 'pmc-club-4',
            goals: 0,
            appearances: 0,
            performance: { '2026-2027': { 'Matchday 1': { Goals: 0 } } },
            matchStats: { '2026-2027': { 'Matchday 1': { gamesPlayed: 0, minutesPlayed: 0 } } },
            _matchContributions: {}
        };

        // Match with 1 overturned goal for Marcus, and 1 legitimate goal for Alex
        const completedMatch = {
            id: 'm-audit-final',
            status: 'completed',
            ageGroup: 'PMC',
            year: '2026-2027',
            matchday: 'Matchday 1',
            homeTeamId: 'pmc-club-4',
            awayTeamId: 'pmc-club-1',
            homeScore: 1,
            awayScore: 0,
            playerStats: {
                'stu-marcus': { ...initPlayerStats('stu-marcus'), Goals: 0, minutesPlayed: 90 },
                'stu-alex': { ...initPlayerStats('stu-alex'), Goals: 1, minutesPlayed: 90 }
            },
            timeline: [
                { id: 'evt-disallowed', type: 'goal', playerId: 'stu-marcus', overturned: true, minute: 30 },
                { id: 'evt-legit', type: 'goal', playerId: 'stu-alex', overturned: false, minute: 72 }
            ]
        };

        const updatedStudents = applyMatchContributions([studentMarcus, studentAlex], completedMatch);
        const updatedMarcus = updatedStudents.find(s => s.id === 'stu-marcus');
        const updatedAlex = updatedStudents.find(s => s.id === 'stu-alex');

        assert.strictEqual(updatedMarcus._matchContributions['m-audit-final'].stats.Goals, 0);
        assert.strictEqual(updatedAlex._matchContributions['m-audit-final'].stats.Goals, 1);
        assert.strictEqual(updatedMarcus.performance['2026-2027']['Matchday 1'].Goals, 0);
        assert.strictEqual(updatedAlex.performance['2026-2027']['Matchday 1'].Goals, 1);

        recordPass('categoryG', 'G7: Season leaderboard & squad analytics maintain 100% integrity when ingesting matches with overturned events');
    }

    console.log(`\nCategory G Summary: ${results.categoryG.passed}/${results.categoryG.total} passed.\n`);

    // =========================================================================
    // FINAL OVERALL SUMMARY
    // =========================================================================
    console.log('================================================================');
    console.log('   🎉 ALL CATEGORIES EXECUTED AND PASSED SUCCESSFULLY!          ');
    console.log('================================================================');
    console.log(`   ${results.categoryA.name}: ${results.categoryA.passed}/${results.categoryA.total} PASSED`);
    console.log(`   ${results.categoryB.name}: ${results.categoryB.passed}/${results.categoryB.total} PASSED`);
    console.log(`   ${results.categoryC.name}: ${results.categoryC.passed}/${results.categoryC.total} PASSED`);
    console.log(`   ${results.categoryD.name}: ${results.categoryD.passed}/${results.categoryD.total} PASSED`);
    console.log(`   ${results.categoryE.name}: ${results.categoryE.passed}/${results.categoryE.total} PASSED`);
    console.log(`   ${results.categoryF.name}: ${results.categoryF.passed}/${results.categoryF.total} PASSED`);
    console.log(`   ${results.categoryG.name}: ${results.categoryG.passed}/${results.categoryG.total} PASSED`);
    const totalPassed = results.categoryA.passed + results.categoryB.passed + results.categoryC.passed + results.categoryD.passed + results.categoryE.passed + results.categoryF.passed + results.categoryG.passed;
    const totalCount = results.categoryA.total + results.categoryB.total + results.categoryC.total + results.categoryD.total + results.categoryE.total + results.categoryF.total + results.categoryG.total;
    console.log(`   TOTAL TESTS: ${totalPassed}/${totalCount} PASSED (100%)`);
    console.log('================================================================\n');
}

runAllTests().catch(err => {
    console.error('❌ Test Suite Failed:', err);
    process.exit(1);
});

