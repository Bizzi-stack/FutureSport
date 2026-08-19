// ── Unified Match Official & Field Staff Accounts ───────────────────────

export const DEFAULT_OFFICIALS = {
    referee: [
        {
            id: 'ref_1',
            username: 'adrian.hunte',
            name: 'Adrian Hunte',
            email: 'referee1.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'FIFA / BFA National Referee',
            assignedVenue: 'National Stadium',
            avatar: '🟨'
        },
        {
            id: 'ref_2',
            username: 'michael.beckles',
            name: 'Michael Beckles',
            email: 'referee2.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'Senior Match Official',
            assignedVenue: 'Usain Bolt Sports Complex',
            avatar: '🟨'
        },
        {
            id: 'ref_3',
            username: 'dave.yearwood',
            name: 'Dave Yearwood',
            email: 'referee3.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'BFA Premier Official',
            assignedVenue: 'Wildey Turf',
            avatar: '🟨'
        },
        {
            id: 'ref_4',
            username: 'trevor.taylor',
            name: 'Trevor Taylor',
            email: 'referee4.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'Regional Match Official',
            assignedVenue: 'RBC Field',
            avatar: '🟨'
        },
        {
            id: 'ref_5',
            username: 'shawn.best',
            name: 'Shawn Best',
            email: 'referee5.pmcup@gmail.com',
            password: 'password',
            role: 'referee',
            badge: 'National Referee',
            assignedVenue: 'Combermere Grounds',
            avatar: '🟨'
        }
    ],
    fourth_official: [
        {
            id: 'fo_1',
            username: 'kevin.stewart',
            name: 'Kevin Stewart',
            email: 'fourthoff1.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'National Stadium',
            avatar: '📟'
        },
        {
            id: 'fo_2',
            username: 'jamal.goddard',
            name: 'Jamal Goddard',
            email: 'fourthoff2.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Usain Bolt Sports Complex',
            avatar: '📟'
        },
        {
            id: 'fo_3',
            username: 'chloe.prescod',
            name: 'Chloe Prescod',
            email: 'fourthoff3.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Wildey Turf',
            avatar: '📟'
        },
        {
            id: 'fo_4',
            username: 'darren.layne',
            name: 'Darren Layne',
            email: 'fourthoff4.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'RBC Field',
            avatar: '📟'
        },
        {
            id: 'fo_5',
            username: 'kyle.holder',
            name: 'Kyle Holder',
            email: 'fourthoff5.pmcup@gmail.com',
            password: 'password',
            role: 'fourth_official',
            assignedVenue: 'Combermere Grounds',
            avatar: '📟'
        }
    ],
    statistician: [
        {
            id: 'analyst_1',
            username: 'marcus.thorne',
            name: 'Marcus Thorne',
            email: 'analyst1.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'National Stadium',
            assignedMatchIds: ['match-pmc-1', 'scheduled-seed-1', 'scheduled-seed-4'],
            avatar: '👨🏽‍💻'
        },
        {
            id: 'analyst_2',
            username: 'devon.clarke',
            name: 'Devon Clarke',
            email: 'analyst2.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'Usain Bolt Sports Complex',
            assignedMatchIds: ['match-pmc-2', 'scheduled-seed-2', 'scheduled-seed-5'],
            avatar: '👨🏾‍💻'
        },
        {
            id: 'analyst_3',
            username: 'aaliyah.brathwaite',
            name: 'Aaliyah Brathwaite',
            email: 'analyst3.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'Wildey Turf',
            assignedMatchIds: ['match-pmc-3', 'scheduled-seed-3'],
            avatar: '👩🏽‍💻'
        },
        {
            id: 'analyst_4',
            username: 'jaden.sealy',
            name: 'Jaden Sealy',
            email: 'analyst4.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'RBC Field',
            assignedMatchIds: ['match-pmc-4'],
            avatar: '👨🏿‍💻'
        },
        {
            id: 'analyst_5',
            username: 'rico.alleyne',
            name: 'Rico Alleyne',
            email: 'analyst5.pmcup@gmail.com',
            password: 'password',
            role: 'statistician',
            assignedVenue: 'Combermere Grounds',
            assignedMatchIds: ['match-pmc-5'],
            avatar: '👨🏽‍💻'
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
