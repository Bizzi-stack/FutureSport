// ── Dedicated Analyst & Field Data Logger Accounts ─────────────────────

export const DEFAULT_ANALYSTS = [
    {
        id: 'analyst_noah',
        username: 'noah',
        name: 'Noah',
        email: 'noah@futurebarbados.bb',
        password: 'password',
        role: 'statistician',
        venue: 'National Stadium',
        assignedMatchIds: ['match-pmc-1', 'scheduled-seed-1', 'scheduled-seed-4'],
        avatar: '👨🏽‍💻',
        badgeColor: '#38bdf8'
    },
    {
        id: 'analyst_tariq',
        username: 'tariq',
        name: 'Tariq',
        email: 'tariq@futurebarbados.bb',
        password: 'password',
        role: 'statistician',
        venue: 'Usain Bolt Sports Complex',
        assignedMatchIds: ['match-pmc-2', 'scheduled-seed-2', 'scheduled-seed-5'],
        avatar: '👨🏾‍💻',
        badgeColor: '#4ade80'
    },
    {
        id: 'analyst_jakob',
        username: 'jakob',
        name: 'Jakob',
        email: 'jakob@futurebarbados.bb',
        password: 'password',
        role: 'statistician',
        venue: 'Wildey Turf',
        assignedMatchIds: ['match-pmc-3', 'scheduled-seed-3'],
        avatar: '👨🏼‍💻',
        badgeColor: '#fbbf24'
    },
    {
        id: 'analyst_marcus',
        username: 'marcus.thorne',
        name: 'Marcus Thorne',
        email: 'analyst1.pmcup@gmail.com',
        password: 'password',
        role: 'statistician',
        venue: 'RBC Field',
        assignedMatchIds: ['match-pmc-4'],
        avatar: '👨🏽‍💻',
        badgeColor: '#f472b6'
    },
    {
        id: 'analyst_devon',
        username: 'devon.clarke',
        name: 'Devon Clarke',
        email: 'analyst2.pmcup@gmail.com',
        password: 'password',
        role: 'statistician',
        venue: 'Combermere Grounds',
        assignedMatchIds: ['match-pmc-5'],
        avatar: '👨🏾‍💻',
        badgeColor: '#a78bfa'
    }
];

const ANALYST_STORAGE_KEY = 'eduvision-analyst-accounts';

export function getAnalystAccounts() {
    try {
        const saved = localStorage.getItem(ANALYST_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
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
        a.name.toLowerCase() === clean
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
