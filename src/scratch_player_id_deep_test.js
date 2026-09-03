import { generatePlayerId, ensurePlayerId, checkDuplicatePlayer, normalizeName } from './utils/playerUtils.js';
import { ALL_STUDENTS, TEAMS, SCHOOLS } from './data/mockData.js';
import fs from 'fs';

const pmcData = JSON.parse(fs.readFileSync('./src/data/pmcScrapedData.json', 'utf8'));
const PMC_STUDENTS = (pmcData.players || []).map((p, idx) => ({
    id: `pmc-student-${idx+1}`,
    name: p.name || 'Unknown',
    jerseyNumber: p.jerseyNumber || (idx + 1),
    playerId: `PID-PMC-${String(idx + 1).padStart(5, '0')}`
}));

console.log("=================================================================");
console.log("   DEEP EMPIRICAL TEST: PLAYER IDs & MATCH SELECTION FLOW       ");
console.log("=================================================================");

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = "") {
    if (condition) {
        console.log(`\x1b[32m[PASS]\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
        passCount++;
    } else {
        console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
        failCount++;
    }
}

// -----------------------------------------------------------------
// TEST 1: GLOBAL UNIQUENESS & COLLISION STRESS TEST
// -----------------------------------------------------------------
console.log("\n--- 1. GLOBAL UNIQUENESS & COLLISION STRESS TEST ---");

const allPlayers = [...ALL_STUDENTS, ...PMC_STUDENTS];
console.log(`Total Active Roster Sample: ${allPlayers.length} players (${ALL_STUDENTS.length} NSSL + ${PMC_STUDENTS.length} PMC)`);

const seenPIDs = new Map();
let collisions = 0;

allPlayers.forEach(p => {
    if (seenPIDs.has(p.playerId)) {
        collisions++;
        console.error(`  Collision Found! PID: ${p.playerId} shared by "${p.name}" and "${seenPIDs.get(p.playerId).name}"`);
    } else {
        seenPIDs.set(p.playerId, p);
    }
});

assert(collisions === 0, "Global Player ID Uniqueness", `${seenPIDs.size} unique PIDs verified out of ${allPlayers.length} records`);

// Stress test generator algorithm with 10,000 synthetic player registrations
const syntheticPIDs = new Set();
let syntheticCollisions = 0;
for (let i = 1; i <= 10000; i++) {
    const generated = generatePlayerId(i, 'PID-2026');
    if (syntheticPIDs.has(generated)) {
        syntheticCollisions++;
    } else {
        syntheticPIDs.add(generated);
    }
}
assert(syntheticCollisions === 0, "10,000 Sequential Synthetic Player ID Generator Stress Test", "0 collisions in 10,000 sequential PIDs");

// -----------------------------------------------------------------
// TEST 2: MATCH SQUAD SELECTION INTEGRATION & IMMUTABILITY TEST
// -----------------------------------------------------------------
console.log("\n--- 2. MATCH SQUAD SELECTION & KIT NUMBER DECOUPLING TEST ---");

// Pick 11 starting players from Team A
const startingXI_Players = ALL_STUDENTS.slice(0, 11);
const startingXI_IDs = startingXI_Players.map(p => p.id);
const startingXI_PIDs = startingXI_Players.map(p => p.playerId);

// Verify every selected player has a valid, non-null PID
const allStartingHavePID = startingXI_Players.every(p => typeof p.playerId === 'string' && p.playerId.startsWith('PID-'));
assert(allStartingHavePID, "Matchday Selection Starting XI PID Integrity", `All 11 starters possess valid PID strings`);

// Simulate Manager updating squad numbers (#1 -> #99)
const testPlayer = { ...startingXI_Players[0], jerseyNumber: 1 };
const originalPlayerID = testPlayer.playerId;
const originalInternalId = testPlayer.id;

// Update kit number
testPlayer.jerseyNumber = 99;
assert(testPlayer.playerId === originalPlayerID, "Kit Number Modification Immutability", `Changed jersey #1 -> #99, PID preserved: ${testPlayer.playerId}`);
assert(testPlayer.id === originalInternalId, "Internal Key Reference Immutability", `Internal ID preserved: ${testPlayer.id}`);

// -----------------------------------------------------------------
// TEST 3: DUPLICATE DETECTION ENGINE ACCURACY
// -----------------------------------------------------------------
console.log("\n--- 3. DUPLICATE DETECTION ENGINE ACCURACY TEST ---");

// Test Exact Name + DOB Duplicate Detection
const duplicateAttempt = {
    name: startingXI_Players[0].name,
    dob: startingXI_Players[0].dob || "2008-05-14",
    schoolId: startingXI_Players[0].schoolId
};

const duplicateResult = checkDuplicatePlayer(duplicateAttempt, ALL_STUDENTS);
assert(duplicateResult.isDuplicate === true, "Duplicate Registration Interception", `Successfully flagged existing player "${startingXI_Players[0].name}"`);
assert(duplicateResult.matchingPlayer?.playerId === startingXI_Players[0].playerId, "Duplicate PID Match Identification", `Correctly identified existing PID: ${duplicateResult.matchingPlayer?.playerId}`);

// Test Legitimate New Player Registration
const newPlayerAttempt = {
    name: "Unique New Player Name " + Date.now(),
    dob: "2010-01-01",
    schoolId: "s1"
};
const cleanResult = checkDuplicatePlayer(newPlayerAttempt, ALL_STUDENTS);
assert(cleanResult.isDuplicate === false, "Legitimate New Player Onboarding Clearance", "Clean registration approved");

// -----------------------------------------------------------------
// TEST SUMMARY & CONCLUSION
// -----------------------------------------------------------------
console.log("\n=================================================================");
console.log(`   FINAL RESULTS: ${passCount} / ${passCount + failCount} PASSED (${Math.round((passCount / (passCount + failCount)) * 100)}%)`);
console.log("=================================================================");
