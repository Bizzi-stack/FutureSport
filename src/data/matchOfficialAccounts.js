// ── Unified Match Official & Field Staff Accounts ───────────────────────

export const DEFAULT_OFFICIALS = {
    statistician: [
        {
            id: 'analyst_noah',
            username: 'noah',
            name: 'Noah',
            email: 'noah@futurebarbados.bb',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3', 'scheduled-seed-4', 'scheduled-seed-5'],
            avatar: 'N'
        },
        {
            id: 'analyst_marcus',
            username: 'marcus.thorne',
            name: 'Marcus Thorne',
            email: 'analyst1.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'RBC Field',
            assignedMatchIds: ['match-pmc-4'],
            avatar: 'M'
        },
        {
            id: 'analyst_devon',
            username: 'devon.clarke',
            name: 'Devon Clarke',
            email: 'analyst2.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'Combermere Grounds',
            assignedMatchIds: ['match-pmc-5'],
            avatar: 'D'
        }
    ],
    referee: [
        {
            id: 'ref_adrian',
            username: 'adrian.hunte',
            name: 'Adrian Hunte',
            email: 'ralphjamesjr00@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'FIFA / BFA National Referee',
            assignedVenue: 'National Stadium',
            avatar: 'REF'
        },
        {
            id: 'ref_michael',
            username: 'michael.beckles',
            name: 'Michael Beckles',
            email: 'ralphjamesjr00@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'Senior Match Official',
            assignedVenue: 'Usain Bolt Sports Complex',
            avatar: 'REF'
        },
        {
            id: 'ref_dave',
            username: 'dave.yearwood',
            name: 'Dave Yearwood',
            email: 'ralphjamesjr00@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'BFA Premier Official',
            assignedVenue: 'Wildey Turf',
            avatar: 'REF'
        },
        {
            id: 'ref_trevor',
            username: 'trevor.taylor',
            name: 'Trevor Taylor',
            email: 'ralphjamesjr00@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'FIFA Official',
            assignedVenue: 'RBC Field',
            avatar: 'REF'
        },
        {
            id: 'ref_shawn',
            username: 'shawn.best',
            name: 'Shawn Best',
            email: 'ralphjamesjr00@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'National Referee',
            assignedVenue: 'Combermere Grounds',
            avatar: 'REF'
        }
    ],
    fourth_official: [
        {
            id: 'fo_noah',
            username: 'fo.noah',
            name: 'Noah (Fourth Official)',
            email: 'noah@futurebarbados.bb',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'National Stadium',
            avatar: 'FO'
        },

        {
            id: 'fo_kevin',
            username: 'kevin.stewart',
            name: 'Kevin Stewart',
            email: 'fourthoff1.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'RBC Field',
            avatar: 'FO'
        },
        {
            id: 'fo_jamal',
            username: 'jamal.goddard',
            name: 'Jamal Goddard',
            email: 'fourthoff2.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Combermere Grounds',
            avatar: 'FO'
        }
    ]
};

const OFFICIALS_STORAGE_KEY = 'eduvision-match-officials';

export function getOfficialsByRole(role) {
    try {
        const saved = localStorage.getItem(OFFICIALS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const str = JSON.stringify(parsed);
            if (str.includes('tariq@futurebarbados.bb') || str.includes('jakob@futurebarbados.bb')) {
                localStorage.setItem(OFFICIALS_STORAGE_KEY, JSON.stringify(DEFAULT_OFFICIALS));
                return DEFAULT_OFFICIALS[role] || [];
            }
            if (parsed && parsed[role] && parsed[role].length > 0) {
                return parsed[role];
            }
        }
    } catch { /* ignored */ }
    return DEFAULT_OFFICIALS[role] || [];
}

export function getAllOfficials() {
    try {
        const saved = localStorage.getItem(OFFICIALS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed) return parsed;
        }
    } catch { /* ignored */ }
    return DEFAULT_OFFICIALS;
}

export function findOfficial(role, identifier) {
    if (!identifier) return null;
    const list = getOfficialsByRole(role);
    const clean = String(identifier).trim().toLowerCase();
    return list.find(o => 
        o.id?.toLowerCase() === clean || 
        o.username?.toLowerCase() === clean || 
        o.email?.toLowerCase() === clean ||
        o.name?.toLowerCase() === clean
    ) || null;
}
