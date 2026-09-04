// ── Dedicated Analyst & Field Data Logger Accounts ─────────────────────

export const DEFAULT_ANALYSTS = [
    {
        id: 'analyst_johnathan',
        username: 'johnathan',
        name: 'Johnathan Cumberbatch (Data Analyst)',
        email: 'johnathan.cumberbatch@gmail.com',
        password: 'password',
        role: 'statistician',
        captureRole: 'all', // 'all' | 'possession' | 'shots' | 'general'
        venue: 'National Stadium',
        assignedMatchIds: ['pmc-fixture-25', 'pmc-fixture-26', 'pmc-fixture-27', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3', 'scheduled-seed-4', 'scheduled-seed-5'],
        avatar: 'JC',
        badgeColor: '#10b981'
    },
    {
        id: 'analyst_noah',
        username: 'noah',
        name: 'Noah (Master Lead Analyst)',
        email: 'noah@futurebarbados.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'all', // 'all' | 'possession' | 'shots' | 'general'
        venue: 'National Stadium',
        assignedMatchIds: ['pmc-fixture-25', 'pmc-fixture-26', 'pmc-fixture-27', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3', 'scheduled-seed-4', 'scheduled-seed-5'],
        avatar: 'N',
        badgeColor: '#38bdf8'
    },
    {
        id: 'capturer_possession',
        username: 'logger.possession',
        name: 'Capturer 1 (Possession Specialist)',
        email: 'possession.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'possession',
        venue: 'National Stadium',
        assignedMatchIds: ['pmc-fixture-25', 'pmc-fixture-26', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5'],
        avatar: 'P',
        badgeColor: '#22c55e'
    },
    {
        id: 'capturer_shots_1',
        username: 'logger.shots1',
        name: 'Capturer 2 (Shot Specialist A)',
        email: 'shots1.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'shots',
        venue: 'National Stadium',
        assignedMatchIds: ['pmc-fixture-25', 'pmc-fixture-26', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5'],
        avatar: 'S1',
        badgeColor: '#3b82f6'
    },
    {
        id: 'capturer_shots_2',
        username: 'logger.shots2',
        name: 'Capturer 3 (Shot Specialist B)',
        email: 'shots2.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'shots',
        venue: 'National Stadium',
        assignedMatchIds: ['match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5'],
        avatar: 'S2',
        badgeColor: '#60a5fa'
    },
    {
        id: 'capturer_general_1',
        username: 'logger.general1',
        name: 'Capturer 4 (General Events A)',
        email: 'general1.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        venue: 'National Stadium',
        assignedMatchIds: ['match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5'],
        avatar: 'G1',
        badgeColor: '#f59e0b'
    },
    {
        id: 'capturer_general_2',
        username: 'logger.general2',
        name: 'Capturer 5 (General Events B)',
        email: 'general2.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        venue: 'National Stadium',
        assignedMatchIds: ['match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5'],
        avatar: 'G2',
        badgeColor: '#fbbf24'
    },
    {
        id: 'capturer_general_3',
        username: 'logger.general3',
        name: 'Capturer 6 (General Events C)',
        email: 'general3.logger@pmcup.bb',
        password: 'password',
        role: 'statistician',
        captureRole: 'general',
        venue: 'National Stadium',
        assignedMatchIds: ['match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5'],
        avatar: 'G3',
        badgeColor: '#a78bfa'
    }
];

const ANALYST_STORAGE_KEY = 'eduvision-analyst-accounts';

export function getAnalystAccounts() {
    try {
        const saved = localStorage.getItem(ANALYST_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const str = JSON.stringify(parsed);
            if (!str.includes('johnathan.cumberbatch@gmail.com') || str.includes('tariq@futurebarbados.bb') || str.includes('jakob@futurebarbados.bb')) {
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
