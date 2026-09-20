import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncTimeline, mergeMatchStates, undoMatchEventState } from '../src/utils/matchEngine.js';

test('old cloud event cannot undo a newer referee correction in either merge direction', () => {
    const original = { id: 'g1', type: 'goal', playerId: 'p1', team: 'home', timestamp: 100 };
    const corrected = { ...original, overturned: true, overturnedAt: 200 };
    assert.deepEqual(syncTimeline([corrected], [original]), [corrected]);
    assert.deepEqual(syncTimeline([original], [corrected]), [corrected]);
});

test('same-millisecond corrections respect event sequence', () => {
    const a = { id: 'g1', type: 'goal', timestamp: 100, editedAt: 200, _eventSeq: 2, playerId: 'p1' };
    const b = { ...a, _eventSeq: 3, playerId: 'p2' };
    assert.deepEqual(syncTimeline([b], [a]), [b]);
    assert.deepEqual(syncTimeline([a], [b]), [b]);
});

test('merging a timeline-only match preserves a recorded score', () => {
    const match = { id: 'm1', updatedAt: 100, timeline: [{ id: 'g1', type: 'goal', team: 'home', playerId: 'p1' }] };
    const merged = mergeMatchStates(match, { ...match, updatedAt: 200 });
    assert.equal(merged.homeScore, 1);
    assert.equal(merged.awayScore, 0);
});

test('undo updates legacy goal and assist aliases alongside canonical fields', () => {
    const state = undoMatchEventState({
        playerStats: { p1: { Goals: 1, goals: 1, Shots: 1, shots: 1, 'Shots on Target': 1, shotsOnTarget: 1 }, p2: { Assists: 1, assists: 1 } },
        timeline: [{ id: 'g1', type: 'goal', playerId: 'p1', assistingPlayerId: 'p2' }], eventId: 'g1', now: 200, seq: 2,
    });
    assert.equal(state.playerStats.p1.goals, 0);
    assert.equal(state.playerStats.p1.shots, 0);
    assert.equal(state.playerStats.p2.assists, 0);
    assert.equal(state.playerStats.p1._statUpdatedAt.goals, 200);
});

test('deleting an already-overturned goal does not subtract another valid goal', () => {
    const state = undoMatchEventState({
        playerStats: { p1: { Goals: 1, Shots: 1, 'Shots on Target': 1 } },
        timeline: [{ id: 'g1', type: 'goal', playerId: 'p1', overturned: true }, { id: 'g2', type: 'goal', playerId: 'p1' }],
        eventId: 'g1', now: 200, seq: 2,
    });
    assert.equal(state.playerStats.p1.Goals, 1);
    assert.deepEqual(state.timeline.map(e => e.id), ['g2']);
    assert.ok(state.tombstoneEventIds.includes('g1'));
});

test('undo a linked save updates the keeper alias and leaves unrelated saves intact', () => {
    const state = undoMatchEventState({
        playerStats: { p1: { Shots: 1, 'Shots on Target': 1 }, keeper: { Saves: 2, saves: 2 } },
        timeline: [{ id: 's1', type: 'shotOnTarget', playerId: 'p1', linkedSaveEventId: 'sv1' }, { id: 'sv1', type: 'gkSave', playerId: 'keeper', linkedShotEventId: 's1' }],
        eventId: 's1', now: 200, seq: 2,
    });
    assert.equal(state.playerStats.keeper.Saves, 1);
    assert.equal(state.playerStats.keeper.saves, 1);
    assert.equal(state.timeline.length, 0);
});
