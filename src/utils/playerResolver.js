/**
 * Player and Student Resolution Engine
 * Guarantees consistent player identification, aliasing, and human-readable names
 * across all matchday roles (Data Capturer, Coach, Referee, Match Commissioner).
 */

/**
 * Creates a comprehensive multi-key lookup map for fast player retrieval.
 * Supports:
 * - Exact string IDs ('pmc-p-10-1', 'pmc-student-10', '1', 1)
 * - Alias IDs from scraped data
 * - Cross-prefix compatibility ('pmc-p-' <-> 'pmc-student-')
 */
export function createPlayerLookupMap(playersList = []) {
    const map = {};
    if (!Array.isArray(playersList)) return map;

    playersList.forEach(p => {
        if (!p) return;

        // 1. Direct ID matches
        if (p.id !== undefined && p.id !== null) {
            map[String(p.id)] = p;
            map[p.id] = p;
        }

        // 2. Player ID / Registration code (e.g. 'PID-PMC-00010')
        if (p.playerId) {
            map[String(p.playerId)] = p;
        }

        // 3. Raw scraped ID
        if (p.rawId) {
            map[String(p.rawId)] = p;
        }

        // 4. Scraped uid
        if (p.uid) {
            map[String(p.uid)] = p;
        }

        // 5. Explicit aliases array
        if (Array.isArray(p.aliasIds)) {
            p.aliasIds.forEach(alias => {
                if (alias) map[String(alias)] = p;
            });
        }

        // 6. Cross-format PMC ID mapping
        if (typeof p.id === 'string') {
            if (p.id.startsWith('pmc-p-')) {
                // 'pmc-p-10-1' -> 'pmc-student-10-1' and 'pmc-student-pmc-club-10-1'
                const suffix = p.id.replace('pmc-p-', '');
                map[`pmc-student-${suffix}`] = p;
                map[`pmc-student-pmc-club-${suffix}`] = p;
            } else if (p.id.startsWith('pmc-student-')) {
                // 'pmc-student-pmc-club-10-1' -> 'pmc-p-10-1'
                const cleanSuffix = p.id.replace('pmc-student-pmc-club-', '').replace('pmc-student-', '');
                map[`pmc-p-${cleanSuffix}`] = p;
            }
        }
    });

    return map;
}

/**
 * Resolves a player object from an ID or partial object.
 */
export function resolvePlayer(playerOrId, playersList = [], lookupMap = null) {
    if (!playerOrId) return null;

    // If already a valid player object with real human name
    if (typeof playerOrId === 'object' && playerOrId.name && !playerOrId.name.startsWith('Player #') && !playerOrId.name.startsWith('PMC P-')) {
        return playerOrId;
    }

    const id = typeof playerOrId === 'object' ? playerOrId.id : playerOrId;
    if (id === undefined || id === null) return null;
    let strId = String(id).trim();
    if (/^player\s*#?\s*/i.test(strId)) {
        strId = strId.replace(/^player\s*#?\s*/i, '').trim();
    }

    // 1. Fast lookup from map if provided
    if (lookupMap && lookupMap[strId]) {
        return lookupMap[strId];
    }

    // 2. Direct search in list
    if (Array.isArray(playersList) && playersList.length > 0) {
        const found = playersList.find(p => {
            if (!p) return false;
            if (String(p.id) === strId || String(p.playerId) === strId || String(p.rawId) === strId) return true;
            if (Array.isArray(p.aliasIds) && p.aliasIds.some(a => String(a) === strId)) return true;

            // Normalized PMC ID comparison
            if (typeof p.id === 'string' && typeof strId === 'string') {
                const normP = p.id.replace('pmc-student-pmc-club-', '').replace('pmc-student-', '').replace('pmc-p-', '');
                const normTarget = strId.replace('pmc-student-pmc-club-', '').replace('pmc-student-', '').replace('pmc-p-', '');
                if (normP === normTarget && normP.length > 0) return true;
            }
            return false;
        });

        if (found) return found;
    }

    return typeof playerOrId === 'object' ? playerOrId : null;
}

/**
 * Resolves a clean, displayable player name.
 * NEVER returns raw strings like 'Player #pmc-p-10-1' or 'PMC P-'.
 */
export function resolvePlayerName(playerOrId, playersList = [], lookupMap = null, fallback = '') {
    if (!playerOrId) return fallback || 'Player';

    // If passed an object with a real human name
    if (typeof playerOrId === 'object' && playerOrId.name) {
        const n = String(playerOrId.name).trim();
        if (n && !n.startsWith('Player #') && !n.startsWith('player #') && !n.startsWith('PMC P-') && !n.startsWith('pmc-p-')) {
            return n;
        }
    }

    const resolved = resolvePlayer(playerOrId, playersList, lookupMap);
    if (resolved && resolved.name) {
        const n = String(resolved.name).trim();
        if (n && !n.startsWith('Player #') && !n.startsWith('player #') && !n.startsWith('PMC P-') && !n.startsWith('pmc-p-')) {
            return n;
        }
    }

    // Fallback: If player is a PMC ID like 'pmc-p-10-1', format cleanly rather than showing raw key
    const rawId = typeof playerOrId === 'object' ? playerOrId.id : playerOrId;
    let cleanId = typeof rawId === 'string' ? rawId.replace(/^player\s*#?\s*/i, '').trim() : rawId;
    if (typeof cleanId === 'string' && (cleanId.startsWith('pmc-p-') || cleanId.startsWith('pmc-student-'))) {
        const parts = cleanId.split('-');
        const playerNum = parts[parts.length - 1];
        return `Player #${playerNum}`;
    }

    if (fallback) return fallback;
    return typeof cleanId === 'number' ? `Player #${cleanId}` : 'Player';
}
