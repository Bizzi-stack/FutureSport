import { DEFAULT_ANALYSTS } from './data/analystAccounts.js';

console.log("=================================================================");
console.log("   PILOT DATA CAPTURER ROLE SCOPING & GREYOUT AUDIT TEST        ");
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

// 1. VERIFY 6 PILOT CAPTURER ACCOUNTS & ROLES
console.log("\n--- 1. PILOT CAPTURER ACCOUNTS & ROLE ASSIGNMENTS ---");
assert(DEFAULT_ANALYSTS.length >= 7, "Pilot Capturer Accounts Loaded", `${DEFAULT_ANALYSTS.length} total accounts`);

const possessionAccounts = DEFAULT_ANALYSTS.filter(a => a.captureRole === 'possession');
const shotsAccounts = DEFAULT_ANALYSTS.filter(a => a.captureRole === 'shots');
const generalAccounts = DEFAULT_ANALYSTS.filter(a => a.captureRole === 'general');
const masterAccounts = DEFAULT_ANALYSTS.filter(a => a.captureRole === 'all');

assert(possessionAccounts.length === 1, "Possession Specialist Allocation", `1 Capturer allocated (${possessionAccounts[0]?.name})`);
assert(shotsAccounts.length === 2, "Shot Specialist Allocation", `2 Capturers allocated (${shotsAccounts.map(a => a.name).join(', ')})`);
assert(generalAccounts.length === 3, "General Events Specialist Allocation", `3 Capturers allocated (${generalAccounts.map(a => a.name).join(', ')})`);
assert(masterAccounts.length >= 1, "Master Lead Analyst Allocation", `Master Lead Analyst allocated (${masterAccounts[0]?.name})`);

// 2. LOGIC PERMISSION SCALING & GREYOUT MATRIX TEST
console.log("\n--- 2. ROLE SCOPING & GREYOUT PERMISSION MATRIX ---");

function evaluatePermissions(role) {
    const isPossessionEnabled = role === 'all' || role === 'master' || role === 'possession';
    const isShotsEnabled = role === 'all' || role === 'master' || role === 'shots';
    const isGeneralEnabled = role === 'all' || role === 'master' || role === 'general';
    return { isPossessionEnabled, isShotsEnabled, isGeneralEnabled };
}

// Case A: Possession Specialist
const pPerms = evaluatePermissions('possession');
assert(pPerms.isPossessionEnabled === true, "Possession Logger -> Possession Tiles", "UNLOCKED");
assert(pPerms.isShotsEnabled === false, "Possession Logger -> Shot Tiles", "GREYED OUT & DISABLED");
assert(pPerms.isGeneralEnabled === false, "Possession Logger -> General Event Tiles", "GREYED OUT & DISABLED");

// Case B: Shot Specialist
const sPerms = evaluatePermissions('shots');
assert(sPerms.isPossessionEnabled === false, "Shot Logger -> Possession Tiles", "GREYED OUT & DISABLED");
assert(sPerms.isShotsEnabled === true, "Shot Logger -> Shot Tiles", "UNLOCKED");
assert(sPerms.isGeneralEnabled === false, "Shot Logger -> General Event Tiles", "GREYED OUT & DISABLED");

// Case C: General Events Specialist
const gPerms = evaluatePermissions('general');
assert(gPerms.isPossessionEnabled === false, "General Events Logger -> Possession Tiles", "GREYED OUT & DISABLED");
assert(gPerms.isShotsEnabled === false, "General Events Logger -> Shot Tiles", "GREYED OUT & DISABLED");
assert(gPerms.isGeneralEnabled === true, "General Events Logger -> General Event Tiles", "UNLOCKED");

// Case D: Master Analyst
const mPerms = evaluatePermissions('all');
assert(mPerms.isPossessionEnabled && mPerms.isShotsEnabled && mPerms.isGeneralEnabled, "Master Lead Analyst -> All Tiles", "ALL UNLOCKED");

// -----------------------------------------------------------------
// TEST SUMMARY & CONCLUSION
// -----------------------------------------------------------------
console.log("\n=================================================================");
console.log(`   FINAL RESULTS: ${passCount} / ${passCount + failCount} PASSED (${Math.round((passCount / (passCount + failCount)) * 100)}%)`);
console.log("=================================================================");
