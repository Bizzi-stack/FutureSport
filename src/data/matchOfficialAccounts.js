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
            assignedMatchIds: ['match-pmc-1', 'scheduled-seed-1', 'scheduled-seed-4'],
            avatar: '👨🏽‍💻'
        },
        {
            id: 'analyst_tariq',
            username: 'tariq',
            name: 'Tariq',
            email: 'tariq@futurebarbados.bb',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'Usain Bolt Sports Complex',
            assignedMatchIds: ['match-pmc-2', 'scheduled-seed-2', 'scheduled-seed-5'],
            avatar: '👨🏾‍💻'
        },
        {
            id: 'analyst_jakob',
            username: 'jakob',
            name: 'Jakob',
            email: 'jakob@futurebarbados.bb',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'Wildey Turf',
            assignedMatchIds: ['match-pmc-3', 'scheduled-seed-3'],
            avatar: '👨🏼‍💻'
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
            avatar: '👨🏽‍💻'
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
            avatar: '👨🏾‍💻'
        }
    ],
    referee: [
        {
            id: 'ref_noah',
            username: 'ref.noah',
            name: 'Noah (Lead Referee)',
            email: 'noah@futurebarbados.bb',
            password: 'password',
            role: 'referee',
            badge: 'FIFA / BFA National Referee',
            assignedVenue: 'National Stadium',
            avatar: '🟨'
        },
        {
            id: 'ref_tariq',
            username: 'ref.tariq',
            name: 'Tariq (Match Official)',
            email: 'tariq@futurebarbados.bb',
            password: 'password',
            role: 'referee',
            badge: 'Senior Match Official',
            assignedVenue: 'Usain Bolt Sports Complex',
            avatar: '🟨'
        },
        {
            id: 'ref_jakob',
            username: 'ref.jakob',
            name: 'Jakob (Match Official)',
            email: 'jakob@futurebarbados.bb',
            password: 'password',
            role: 'referee',
            badge: 'BFA Premier Official',
            assignedVenue: 'Wildey Turf',
            avatar: '🟨'
        },
        {
            id: 'ref_adrian',
            username: 'adrian.hunte',
            name: 'Adrian Hunte',
            email: 'referee1.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'FIFA Official',
            assignedVenue: 'RBC Field',
            avatar: '🟨'
        },
        {
            id: 'ref_michael',
            username: 'michael.beckles',
            name: 'Michael Beckles',
            email: 'referee2.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'National Referee',
            assignedVenue: 'Combermere Grounds',
            avatar: '🟨'
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
            avatar: '📟'
        },
        {
            id: 'fo_tariq',
            username: 'fo.tariq',
            name: 'Tariq (Fourth Official)',
            email: 'tariq@futurebarbados.bb',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Usain Bolt Sports Complex',
            avatar: '📟'
        },
        {
            id: 'fo_jakob',
            username: 'fo.jakob',
            name: 'Jakob (Fourth Official)',
            email: 'jakob@futurebarbados.bb',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Wildey Turf',
            avatar: '📟'
        },
        {
            id: 'fo_kevin',
            username: 'kevin.stewart',
            name: 'Kevin Stewart',
            email: 'fourthoff1.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'RBC Field',
            avatar: '📟'
        },
        {
            id: 'fo_jamal',
            username: 'jamal.goddard',
            name: 'Jamal Goddard',
            email: 'fourthoff2.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Combermere Grounds',
            avatar: '📟'
        }
    ]
};

const OFFICIALS_STORAGE_KEY = 'eduvision-match-officials';

export function getOfficialsByRole(role) {
    try {
        const saved = localStorage.getItem(OFFICIALS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
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
