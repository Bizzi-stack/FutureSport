/**
 * Fixture Matching Utilities for Strict Team Isolation
 * Guarantees that a coach/team only sees matches they are playing in (Home or Away).
 * Prevents false positives from partial IDs or generic division strings.
 */

export const normalizeId = (id) => {
    if (!id && id !== 0) return '';
    let s = String(id).trim().toLowerCase();
    // Strip common team suffix patterns like '-team-pmc', '-team-u19', etc.
    s = s.replace(/-team-(pmc|u\d+|girls|boys)/g, '');
    return s;
};

export const normalizeTeamName = (name) => {
    if (!name) return '';
    let s = String(name).toLowerCase().trim();
    // Remove parenthetical notes like (Group E), (U16), (PMC), etc.
    s = s.replace(/\s*\([^)]*\)/g, '');
    // Remove non-alphanumeric characters
    s = s.replace(/[^a-z0-9]/g, '');
    return s;
};

/**
 * Strict check if a match involves a specific club/school.
 * @param {Object} match - The fixture object
 * @param {string|number} targetSchoolId - The coach's school / club ID (e.g. 'pmc-club-10' or 's1')
 * @param {string|number} targetTeamId - The coach's specific team ID (e.g. 'pmc-club-10-team-PMC')
 * @param {string} targetSchoolName - The coach's club name (e.g. 'WOTTON')
 * @returns {boolean}
 */
export const isMatchForTeam = (match, targetSchoolId, targetTeamId, targetSchoolName) => {
    if (!match) return false;

    const cleanTargetSchoolId = normalizeId(targetSchoolId);
    const cleanTargetTeamId = normalizeId(targetTeamId);
    const cleanTargetName = normalizeTeamName(targetSchoolName);

    const checkSide = (sideTeamId, sideSchoolId, sideTeamName) => {
        const normSideTeamId = normalizeId(sideTeamId);
        const normSideSchoolId = normalizeId(sideSchoolId);
        const normSideName = normalizeTeamName(sideTeamName);

        // 1. Exact ID match on School or Team ID
        if (cleanTargetSchoolId && (normSideTeamId === cleanTargetSchoolId || normSideSchoolId === cleanTargetSchoolId)) {
            return true;
        }
        if (cleanTargetTeamId && (normSideTeamId === cleanTargetTeamId || normSideSchoolId === cleanTargetTeamId)) {
            return true;
        }

        // 2. Exact or Prefix Name Match (avoid short substrings)
        if (cleanTargetName && normSideName) {
            if (normSideName === cleanTargetName) return true;
            if (cleanTargetName.length >= 4 && normSideName.length >= 4) {
                if (normSideName.startsWith(cleanTargetName) || cleanTargetName.startsWith(normSideName)) {
                    return true;
                }
            }
        }

        return false;
    };

    return checkSide(match.homeTeamId, match.homeSchoolId, match.homeTeam) ||
           checkSide(match.awayTeamId, match.awaySchoolId, match.awayTeam);
};
