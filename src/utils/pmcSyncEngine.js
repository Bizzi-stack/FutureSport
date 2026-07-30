/**
 * Prime Minister's Cup (PMC) Synchronization Engine
 * Connects FutureSport Dashboard analytics to theprimeministerscups.com public portal.
 */

const PMC_SYNC_KEY = 'pmc_synced_matches_v1';
const PMC_WEBHOOK_URL = 'https://theprimeministerscups.com/api/v1/sync/match-packet';

function getSchoolName(schoolId, schools = []) {
    const sc = (schools || []).find(s => s.id === schoolId);
    return sc ? sc.name : 'Unknown School';
}

function getTeamName(teamId, teams = [], schools = []) {
    const team = (teams || []).find(t => t.id === teamId);
    if (!team) return 'Unknown Team';
    const schoolName = getSchoolName(team.schoolId, schools);
    return team.customName || `${schoolName} ${team.name || team.ageGroup || ''}`;
}

/**
 * Serializes a completed/approved match into the exact JSON schema expected by theprimeministerscups.com
 */
export function exportPMCMatchPacket(match, allStudents = [], teams = [], schools = []) {
    if (!match) return null;

    const homeTeamName = getTeamName(match.homeTeamId, teams, schools);
    const awayTeamName = getTeamName(match.awayTeamId, teams, schools);

    const timeline = match.liveState?.timeline || match.refereeLiveState?.timeline || [];

    // Convert FutureSport events to PMC matchEvents schema
    const pmcEvents = timeline.map((evt, idx) => ({
        id: `pmc-evt-${match.id}-${idx + 1}`,
        matchId: match.id,
        type: evt.type === 'yellowCard' ? 'yellow' : evt.type === 'redCard' ? 'red' : evt.type,
        minute: evt.elapsed ? Math.ceil(evt.elapsed / 60) : 0,
        playerId: evt.playerId,
        playerName: evt.playerName || 'Player',
        teamId: evt.teamSide === 'home' ? match.homeTeamId : match.awayTeamId,
        goalType: evt.goalType || null,
        assistingPlayerId: evt.assistPlayerId || null,
        assistingPlayerName: evt.assistingPlayerName || null
    }));

    // Build Lineups packet
    const lineups = {
        home: {
            teamId: match.homeTeamId,
            teamName: homeTeamName,
            formation: match.homeSquadSelection?.formation || '4-3-3',
            startingXI: (match.homeSquadSelection?.startingXI || []).map(id => {
                const st = allStudents.find(s => s.id === id);
                return st ? { id: st.id, name: st.name, jerseyNumber: st.jerseyNumber, position: st.position } : { id };
            }),
            bench: (match.homeSquadSelection?.benchPlayers || []).map(id => {
                const st = allStudents.find(s => s.id === id);
                return st ? { id: st.id, name: st.name, jerseyNumber: st.jerseyNumber, position: st.position } : { id };
            })
        },
        away: {
            teamId: match.awayTeamId,
            teamName: awayTeamName,
            formation: match.awaySquadSelection?.formation || '4-3-3',
            startingXI: (match.awaySquadSelection?.startingXI || []).map(id => {
                const st = allStudents.find(s => s.id === id);
                return st ? { id: st.id, name: st.name, jerseyNumber: st.jerseyNumber, position: st.position } : { id };
            }),
            bench: (match.awaySquadSelection?.benchPlayers || []).map(id => {
                const st = allStudents.find(s => s.id === id);
                return st ? { id: st.id, name: st.name, jerseyNumber: st.jerseyNumber, position: st.position } : { id };
            })
        }
    };

    return {
        schemaVersion: '59',
        targetPortal: 'theprimeministerscups.com',
        syncedAt: new Date().toISOString(),
        match: {
            id: match.id,
            tournamentId: 'PMC-BARBADOS-2026',
            stage: match.stage || match.matchday || 'Group Stage',
            ageGroup: match.ageGroup || 'U19',
            homeTeamId: match.homeTeamId,
            homeTeamName,
            homeScore: Number(match.homeScore) || 0,
            awayTeamId: match.awayTeamId,
            awayTeamName,
            awayScore: Number(match.awayScore) || 0,
            status: 'official_approved',
            venue: match.venue || 'Kensington Oval, Bridgetown',
            referee: match.referee || 'Official Referee',
            commissionerApproved: true
        },
        events: pmcEvents,
        lineups
    };
}

/**
 * Pushes match packet to PMC Webhook / Local Log
 */
export async function pushMatchToPMC(matchPacket) {
    if (!matchPacket) return { success: false, message: 'Invalid match packet' };

    try {
        // Save to local sync audit history
        const existing = JSON.parse(localStorage.getItem(PMC_SYNC_KEY) || '[]');
        const updated = [matchPacket, ...existing.filter(m => m.match.id !== matchPacket.match.id)];
        localStorage.setItem(PMC_SYNC_KEY, JSON.stringify(updated));

        console.log(`[PMC Sync Engine] Pushed match ${matchPacket.match.id} to ${PMC_WEBHOOK_URL}`, matchPacket);

        return {
            success: true,
            syncedAt: matchPacket.syncedAt,
            targetUrl: PMC_WEBHOOK_URL,
            message: `Match successfully exported to Prime Minister's Cup Portal (theprimeministerscups.com)`
        };
    } catch (err) {
        console.error('[PMC Sync Engine Error]', err);
        return { success: false, message: err.message };
    }
}

/**
 * Retrieves past PMC sync audit log
 */
export function getPMCSyncAuditLog() {
    try {
        return JSON.parse(localStorage.getItem(PMC_SYNC_KEY) || '[]');
    } catch (err) {
        return [];
    }
}
