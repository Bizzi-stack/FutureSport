// ── Dedicated Analyst & Field Data Logger Accounts ─────────────────────

export const DEFAULT_ANALYSTS = [
    {
        id: 'analyst_johnathan',
        username: 'johnathan',
        name: 'Johnathan Cumberbatch (Lead Match Controller)',
        email: 'johnathan.cumberbatch@gmail.com',
        password: 'password',
        role: 'statistician',
        captureRole: 'all',
        isMasterLogger: true,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '👑',
        badgeColor: '#10b981'
    },
    {
        id: 'analyst_noah',
        username: 'noah',
        name: 'Noah (Data Capturer)',
        email: 'noah@futurebarbados.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'all',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3', 'scheduled-seed-4', 'scheduled-seed-5'],
        avatar: 'N',
        badgeColor: '#38bdf8'
    },
    {
        id: 'guest_possession',
        username: 'guest.possession',
        name: 'Guest - Possession Logger',
        email: 'possession.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'possession',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '⏱️',
        badgeColor: '#22c55e'
    },
    {
        id: 'guest_shots_1',
        username: 'guest.shots1',
        name: 'Guest - Shot Logger 1',
        email: 'shots1.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'shots',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '⚽',
        badgeColor: '#3b82f6'
    },
    {
        id: 'guest_shots_2',
        username: 'guest.shots2',
        name: 'Guest - Shot Logger 2',
        email: 'shots2.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'shots',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '⚽',
        badgeColor: '#60a5fa'
    },
    {
        id: 'guest_events_1',
        username: 'guest.events1',
        name: 'Guest - Match Events 1',
        email: 'events1.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '📋',
        badgeColor: '#f59e0b'
    },
    {
        id: 'guest_events_2',
        username: 'guest.events2',
        name: 'Guest - Match Events 2',
        email: 'events2.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '📋',
        badgeColor: '#fbbf24'
    },
    {
        id: 'guest_events_3',
        username: 'guest.events3',
        name: 'Guest - Match Events 3',
        email: 'events3.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '📋',
        badgeColor: '#a78bfa'
    },
    {
        id: 'guest_events_4',
        username: 'guest.events4',
        name: 'Guest - Match Events 4',
        email: 'events4.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        isMasterLogger: false,
        venue: 'Friendship, St. Michael',
        assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
        avatar: '📋',
        badgeColor: '#c084fc'
    }
];

const ANALYST_STORAGE_KEY = 'eduvision-analyst-accounts-v3';

export function getAnalystAccounts() {
    try {
        const saved = localStorage.getItem(ANALYST_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const str = JSON.stringify(parsed);
            if (!str.includes('guest.possession') || !str.includes('johnathan.cumberbatch@gmail.com') || str.includes('tariq@futurebarbados.bb') || str.includes('jakob@futurebarbados.bb')) {
                localStorage.setItem(ANALYST_STORAGE_KEY, JSON.stringify(DEFAULT_ANALYSTS));
                return DEFAULT_ANALYSTS;
            }
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to load analyst accounts from localStorage:', e);
    }
    return DEFAULT_ANALYSTS;
}

export function saveAnalystAccounts(accounts) {
    try {
        localStorage.setItem(ANALYST_STORAGE_KEY, JSON.stringify(accounts));
        return accounts;
    } catch (e) {
        console.error('Failed to save analyst accounts:', e);
        return accounts;
    }
}

export function findAnalystByEmailOrId(query) {
    if (!query) return null;
    const list = getAnalystAccounts();
    const clean = String(query).trim().toLowerCase();
    return list.find(a => 
        a.id.toLowerCase() === clean || 
        a.email.toLowerCase() === clean ||
        a.username?.toLowerCase() === clean ||
        (clean === 'jonathan' && a.username === 'johnathan') ||
        (clean === 'johnathan' && a.username === 'jonathan') ||
        a.name.toLowerCase() === clean ||
        a.name.toLowerCase().includes(clean)
    ) || null;
}

export function getAssignedAnalystForMatch(match) {
    const list = getAnalystAccounts();
    if (!match) return list[0];
    
    // Check direct match ID assignment
    const direct = list.find(a => (a.assignedMatchIds || []).includes(match.id));
    if (direct) return direct;

    // Check venue match
    if (match.venue) {
        const byVenue = list.find(a => a.venue && match.venue.toLowerCase().includes(a.venue.toLowerCase().replace(' field', '').replace(' oval', '').replace(' grounds', '').replace(' turf', '')));
        if (byVenue) return byVenue;
    }

    // Default to first analyst
    return list[0];
}
