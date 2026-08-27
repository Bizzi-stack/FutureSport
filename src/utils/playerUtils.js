/**
 * Player Identification & Registration Utilities
 * - Generates immutable, system-wide unique Player IDs (e.g. PID-2026-00104)
 * - Validates and flags duplicate player records by normalized name & Date of Birth / School
 */

/**
 * Generate a standardized, unique, system-generated Player ID string
 * @param {string|number} seed 
 * @param {string} prefix 
 * @returns {string} e.g. "PID-2026-00142"
 */
export function generatePlayerId(seed, prefix = 'PID-2026') {
    if (!seed) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        return `${prefix}-${randomNum}`;
    }
    const cleanId = String(seed).replace(/[^0-9]/g, '');
    if (cleanId) {
        return `${prefix}-${cleanId.padStart(5, '0')}`;
    }
    const hash = String(seed).split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 90000 + 10000, 0);
    return `${prefix}-${hash}`;
}

/**
 * Ensures a player object has a valid, permanent `playerId` property
 * @param {Object} player 
 * @returns {Object} Player with guaranteed `playerId`
 */
export function ensurePlayerId(player) {
    if (!player) return player;
    if (player.playerId) return player;

    const pid = generatePlayerId(player.id || player.name);
    return {
        ...player,
        playerId: pid
    };
}

/**
 * Normalizes string for name matching (removes spaces, punctuation, case-insensitive)
 * @param {string} str 
 * @returns {string}
 */
export function normalizeName(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if a registering player matches an existing player in the database
 * @param {Object} newPlayerData - { name, dob, schoolId, gender }
 * @param {Array} existingPlayers 
 * @returns {Object} { isDuplicate: boolean, duplicateReason: string|null, matchingPlayer: Object|null }
 */
export function checkDuplicatePlayer(newPlayerData, existingPlayers = []) {
    if (!newPlayerData || !newPlayerData.name || !Array.isArray(existingPlayers)) {
        return { isDuplicate: false, duplicateReason: null, matchingPlayer: null };
    }

    const normNewName = normalizeName(newPlayerData.name);
    if (!normNewName) return { isDuplicate: false, duplicateReason: null, matchingPlayer: null };

    const match = existingPlayers.find(p => {
        if (!p || !p.name) return false;
        const normExistingName = normalizeName(p.name);
        
        // Exact name match
        const isNameMatch = normNewName === normExistingName;

        // Date of birth match if provided
        const newDob = newPlayerData.dob || newPlayerData.dateOfBirth;
        const existingDob = p.dob || p.dateOfBirth;
        const isDobMatch = newDob && existingDob && String(newDob).trim() === String(existingDob).trim();

        // School match if provided
        const isSchoolMatch = newPlayerData.schoolId && p.schoolId && String(newPlayerData.schoolId) === String(p.schoolId);

        // Flag if name + DOB match OR exact name match within same school/club
        return (isNameMatch && isDobMatch) || (isNameMatch && isSchoolMatch);
    });

    if (match) {
        const pid = match.playerId || generatePlayerId(match.id);
        const matchDob = match.dob || match.dateOfBirth;
        const reason = `Matches existing registered player "${match.name}" (Player ID: ${pid}, DOB: ${matchDob || 'N/A'})`;
        return {
            isDuplicate: true,
            duplicateReason: reason,
            matchingPlayer: {
                id: match.id,
                playerId: pid,
                name: match.name,
                dob: match.dob,
                schoolId: match.schoolId
            }
        };
    }

    return { isDuplicate: false, duplicateReason: null, matchingPlayer: null };
}
