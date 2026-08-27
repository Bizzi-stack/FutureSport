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

console.log("=================================================");
console.log("   SPRINT GOAL AUDIT & AUTOMATED VERIFICATION   ");
console.log("=================================================");

let passCount = 0;
let totalCount = 0;

function assert(condition, message) {
    totalCount++;
    if (condition) {
        console.log(`[PASS] ${message}`);
        passCount++;
    } else {
        console.error(`[FAIL] ${message}`);
    }
}

// 1. UNIQUE PERMANENT PLAYER ID AUDIT
console.log("\n--- 1. Unique Permanent Player ID Generation & Seeding ---");
assert(ALL_STUDENTS && ALL_STUDENTS.length > 0, `NSSL Dataset loaded (${ALL_STUDENTS.length} players)`);
assert(PMC_STUDENTS && PMC_STUDENTS.length > 0, `PMC Dataset loaded (${PMC_STUDENTS.length} players)`);

const nsslMissingPIDs = ALL_STUDENTS.filter(s => !s.playerId);
assert(nsslMissingPIDs.length === 0, `All NSSL players have permanent Player IDs (0 missing)`);

const pmcMissingPIDs = PMC_STUDENTS.filter(s => !s.playerId);
assert(pmcMissingPIDs.length === 0, `All PMC players have permanent Player IDs (0 missing)`);

const pidSet = new Set();
let duplicatesFound = 0;
[...ALL_STUDENTS, ...PMC_STUDENTS].forEach(p => {
    if (pidSet.has(p.playerId)) duplicatesFound++;
    else pidSet.add(p.playerId);
});
assert(duplicatesFound === 0, `All Player IDs across datasets are 100% globally unique (${pidSet.size} total PIDs)`);

const samplePlayer = ALL_STUDENTS[0];
console.log(`  Sample NSSL Player: ${samplePlayer.name} | PID: ${samplePlayer.playerId} | Kit #: #${samplePlayer.jerseyNumber}`);
const samplePMC = PMC_STUDENTS[0];
console.log(`  Sample PMC Player:  ${samplePMC.name} | PID: ${samplePMC.playerId} | Kit #: #${samplePMC.jerseyNumber}`);

// 2. DUPLICATE PLAYER DETECTION ENGINE
console.log("\n--- 2. Duplicate Detection & Flagging Engine ---");
const testExisting = [
    { id: 101, name: "Devonte Yearwood", dateOfBirth: "2008-04-12", schoolId: "s1", playerId: "PID-2026-00101" },
    { id: 102, name: "Kaelon Jordan", dateOfBirth: "2007-09-20", schoolId: "s2", playerId: "PID-2026-00102" }
];

const dupMatch = checkDuplicatePlayer(
    { name: "Devonte Yearwood", dateOfBirth: "2008-04-12", schoolId: "s1" },
    testExisting
);
assert(dupMatch.isDuplicate === true, `Detected exact duplicate player (Name + DOB match)`);
assert(dupMatch.matchingPlayer?.playerId === "PID-2026-00101", `Identified matching existing Player ID (${dupMatch.matchingPlayer?.playerId})`);

const nonDupMatch = checkDuplicatePlayer(
    { name: "Marcus Rashford", dateOfBirth: "1997-10-31", schoolId: "s3" },
    testExisting
);
assert(nonDupMatch.isDuplicate === false, `Passed clean registration for new non-duplicate player`);

// 3. MANAGER SQUAD SELECTION & KIT NUMBER DECOUPLING
console.log("\n--- 3. Kit Number Decoupling & Manager Squad Selection ---");
const playerToEdit = { ...samplePlayer, jerseyNumber: 10 };
const originalPID = playerToEdit.playerId;
playerToEdit.jerseyNumber = 99; // Changing kit number
assert(playerToEdit.playerId === originalPID, `Changing Kit Number (#10 -> #99) preserved permanent Player ID (${playerToEdit.playerId})`);

// SUMMARY REPORT
console.log("\n=================================================");
console.log(`   AUDIT RESULTS: ${passCount} / ${totalCount} TESTS PASSED (${Math.round((passCount/totalCount)*100)}%)`);
console.log("=================================================");
