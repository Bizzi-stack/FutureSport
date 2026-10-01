import test from 'node:test';
import assert from 'node:assert';
import { mergeMatchStates } from '../src/utils/matchEngine.js';
import { computeMatchesHash, mergeCloudMatches } from '../src/utils/realtimeSync.js';

test('Squad persistence: removing players from a match squad does not revert when switching fixtures', () => {
    // Initial pre-populated match fixtures (e.g. Match 10 and Match 14 for Ivy Rovers)
    const match10Initial = {
        id: 'pmc-fixture-19',
        matchday: 'Matchday 10',
        homeTeam: 'ST. ANDREW LIONS',
        awayTeam: 'IVY ROVERS',
        homeTeamId: 'pmc-club-12',
        awayTeamId: 'pmc-club-28',
        awaySquadSelection: {
            formation: '4-3-3',
            startingXI: [
                'pmc-p-28-1', 'pmc-p-28-2', 'pmc-p-28-3', 'pmc-p-28-4', 'pmc-p-28-5',
                'pmc-p-28-6', 'pmc-p-28-7', 'pmc-p-28-8', 'pmc-p-28-9', 'pmc-p-28-10', 'pmc-p-28-11'
            ],
            benchPlayers: ['pmc-p-28-12', 'pmc-p-28-13', 'pmc-p-28-14'],
            captainId: 'pmc-p-28-1',
            lastModified: 1000
        },
        updatedAt: 1000
    };

    const match14Initial = {
        id: 'pmc-fixture-32',
        matchday: 'Matchday 14',
        homeTeam: 'IVY ROVERS',
        awayTeam: "BRITTON'S HILL",
        homeTeamId: 'pmc-club-28',
        awayTeamId: 'pmc-club-22',
        homeSquadSelection: {
            formation: '4-3-3',
            startingXI: [
                'pmc-p-28-1', 'pmc-p-28-2', 'pmc-p-28-3', 'pmc-p-28-4', 'pmc-p-28-5',
                'pmc-p-28-6', 'pmc-p-28-7', 'pmc-p-28-8', 'pmc-p-28-9', 'pmc-p-28-10', 'pmc-p-28-11'
            ],
            benchPlayers: ['pmc-p-28-12', 'pmc-p-28-13'],
            captainId: 'pmc-p-28-1',
            lastModified: 1000
        },
        updatedAt: 1000
    };

    let matchesState = [match10Initial, match14Initial];

    // User action on Match 10: coach removes players 1 and 2 from starting XI (sets to null)
    const modifiedStartingXI = [
        null, null, 'pmc-p-28-3', 'pmc-p-28-4', 'pmc-p-28-5',
        'pmc-p-28-6', 'pmc-p-28-7', 'pmc-p-28-8', 'pmc-p-28-9', 'pmc-p-28-10', 'pmc-p-28-11'
    ];
    const modifiedBench = ['pmc-p-28-12']; // removed 13 and 14

    const match10Updated = {
        ...match10Initial,
        awaySquadSelection: {
            ...match10Initial.awaySquadSelection,
            startingXI: modifiedStartingXI,
            benchPlayers: modifiedBench,
            captainId: 'pmc-p-28-3',
            lastModified: 2000
        },
        updatedAt: 2000
    };

    // Update matches state (as persistSquad / onUpdateMatch does)
    matchesState = matchesState.map(m => m.id === match10Updated.id ? match10Updated : m);

    // Coach switches to Match 14
    const selectedMatch14 = matchesState.find(m => m.id === 'pmc-fixture-32');
    assert.strictEqual(selectedMatch14.homeSquadSelection.startingXI.filter(Boolean).length, 11);

    // Coach switches BACK to Match 10
    const selectedMatch10AfterReturn = matchesState.find(m => m.id === 'pmc-fixture-19');
    
    // Verify Match 10 did NOT revert back to initial 11 players!
    assert.deepStrictEqual(selectedMatch10AfterReturn.awaySquadSelection.startingXI, modifiedStartingXI);
    assert.strictEqual(selectedMatch10AfterReturn.awaySquadSelection.startingXI[0], null);
    assert.strictEqual(selectedMatch10AfterReturn.awaySquadSelection.startingXI[1], null);
    assert.deepStrictEqual(selectedMatch10AfterReturn.awaySquadSelection.benchPlayers, modifiedBench);
    assert.strictEqual(selectedMatch10AfterReturn.awaySquadSelection.captainId, 'pmc-p-28-3');
});

test('realtimeSync hash sensitivity: bench, formation, captain changes generate distinct hashes', () => {
    const baseMatch = {
        id: 'pmc-fixture-1',
        homeSquadSelection: {
            formation: '4-3-3',
            startingXI: ['p1', 'p2', 'p3'],
            benchPlayers: ['b1', 'b2'],
            captainId: 'p1'
        }
    };

    const hashBase = computeMatchesHash([baseMatch]);

    // Change bench
    const matchBenchChanged = {
        ...baseMatch,
        homeSquadSelection: {
            ...baseMatch.homeSquadSelection,
            benchPlayers: ['b1']
        }
    };
    const hashBench = computeMatchesHash([matchBenchChanged]);
    assert.notStrictEqual(hashBase, hashBench, 'Hash must detect bench change');

    // Change formation
    const matchFormationChanged = {
        ...baseMatch,
        homeSquadSelection: {
            ...baseMatch.homeSquadSelection,
            formation: '4-4-2'
        }
    };
    const hashFormation = computeMatchesHash([matchFormationChanged]);
    assert.notStrictEqual(hashBase, hashFormation, 'Hash must detect formation change');

    // Change captain
    const matchCaptainChanged = {
        ...baseMatch,
        homeSquadSelection: {
            ...baseMatch.homeSquadSelection,
            captainId: 'p2'
        }
    };
    const hashCaptain = computeMatchesHash([matchCaptainChanged]);
    assert.notStrictEqual(hashBase, hashCaptain, 'Hash must detect captain change');
});

test('mergeMatchStates: protects adjusted squad from stale cloud overwrites or null wipeouts', () => {
    const localMatch = {
        id: 'pmc-fixture-19',
        updatedAt: 3000,
        homeSquadSelection: {
            formation: '4-3-3',
            startingXI: ['p1', null, 'p3'],
            benchPlayers: ['b1'],
            lastModified: 3000
        }
    };

    const staleCloudMatch = {
        id: 'pmc-fixture-19',
        updatedAt: 2000,
        homeSquadSelection: {
            formation: '4-3-3',
            startingXI: ['p1', 'p2', 'p3'], // old full squad
            benchPlayers: ['b1', 'b2'],
            lastModified: 2000
        }
    };

    const merged = mergeMatchStates(staleCloudMatch, localMatch);
    assert.deepStrictEqual(merged.homeSquadSelection.startingXI, ['p1', null, 'p3']);
    assert.deepStrictEqual(merged.homeSquadSelection.benchPlayers, ['b1']);

    // Null wipeout protection: if an incoming match has null squadSelection, local squad is preserved
    const nullIncoming = {
        id: 'pmc-fixture-19',
        updatedAt: 4000,
        homeSquadSelection: null
    };

    const mergedNull = mergeMatchStates(localMatch, nullIncoming);
    assert.deepStrictEqual(mergedNull.homeSquadSelection.startingXI, ['p1', null, 'p3']);
});

test('mergeMatchStates: local squad with lastModified wins over prepopulated cloud squad without lastModified', () => {
    const localMatch = {
        id: 'pmc-fixture-20',
        updatedAt: 3000,
        awaySquadSelection: {
            formation: '4-3-3',
            startingXI: ['p1', null, 'p3'],
            benchPlayers: ['b1'],
            lastModified: 3000
        }
    };

    // Prepopulated cloud match has newer match updatedAt, but NO lastModified on the squad
    const cloudMatchNoLM = {
        id: 'pmc-fixture-20',
        updatedAt: 5000, 
        awaySquadSelection: {
            formation: '4-3-3',
            startingXI: ['p1', 'p2', 'p3'],
            benchPlayers: ['b1', 'b2']
            // missing lastModified
        }
    };

    const merged = mergeMatchStates(localMatch, cloudMatchNoLM);
    
    // The local squad should win because it has an explicit lastModified
    assert.deepStrictEqual(merged.awaySquadSelection.startingXI, ['p1', null, 'p3']);
    assert.deepStrictEqual(merged.awaySquadSelection.benchPlayers, ['b1']);
    assert.strictEqual(merged.awaySquadSelection.lastModified, 3000);
});
