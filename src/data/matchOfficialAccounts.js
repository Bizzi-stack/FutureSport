// ── Unified Match Official & Field Staff Accounts ───────────────────────

export const DEFAULT_OFFICIALS = {
    statistician: [
        {
            id: 'analyst_johnathan',
            username: 'johnathan',
            name: 'Johnathan Cumberbatch (Lead Match Controller)',
            email: 'johnathan.cumberbatch@gmail.com',
            password: 'password',
            role: 'statistician',
            captureRole: 'all',
            isMasterLogger: true,
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '👑'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3', 'scheduled-seed-4', 'scheduled-seed-5'],
            avatar: 'N'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '⏱️'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '⚽'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '⚽'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '📋'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '📋'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '📋'
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
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2', 'pmc-fixture-3', 'pmc-fixture-4', 'match-pmc-1', 'match-pmc-2', 'match-pmc-3', 'match-pmc-4', 'match-pmc-5', 'scheduled-seed-1', 'scheduled-seed-2', 'scheduled-seed-3'],
            avatar: '📋'
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
    ],
    commissioner: [
        {
            id: 'comm_wren',
            username: 'wren',
            name: 'Wren (Senior Match Coordinator)',
            email: 'wren@pmcup.bb',
            password: 'password',
            role: 'commissioner',
            assignedVenue: 'Friendship, St. Michael',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2'],
            avatar: 'MC'
        },
        {
            id: 'comm_aundrea',
            username: 'aundrea',
            name: 'Aundrea (Match Operator)',
            email: 'aundrea@pmcup.bb',
            password: 'password',
            role: 'commissioner',
            assignedVenue: 'Friendship, St. Michael',
            assignedMatchIds: ['pmc-fixture-1', 'pmc-fixture-2'],
            avatar: 'MO'
        }
    ]
};

const OFFICIALS_STORAGE_KEY = 'eduvision-match-officials-v4';

export function getOfficialsByRole(role) {
    try {
        const saved = localStorage.getItem(OFFICIALS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const str = JSON.stringify(parsed);
            if (!str.includes('guest.possession') || str.includes('analyst_marcus') || !str.includes('johnathan.cumberbatch@gmail.com') || str.includes('tariq@futurebarbados.bb') || str.includes('jakob@futurebarbados.bb') || str.includes('Sarah Rollins') || str.includes('Charles White') || !str.includes('Wren') || !str.includes('Aundrea')) {
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
        (clean === 'jonathan' && o.username === 'johnathan') ||
        (clean === 'johnathan' && o.username === 'jonathan') ||
        ((clean === 'sarah' || clean === 'sarah.rollins') && o.username === 'wren') ||
        ((clean === 'charles' || clean === 'charles.white') && o.username === 'aundrea') ||
        o.email?.toLowerCase() === clean ||
        o.name?.toLowerCase() === clean ||
        o.name?.toLowerCase().includes(clean)
    ) || null;
}
