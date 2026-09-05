/**
 * Real-Time Cross-Device Sync Engine for FutureSport
 * Powered by Supabase Cloud & BroadcastChannel for instant multi-device & multi-tab synchronization.
 */

const SUPABASE_URL = 'https://ayxcbvzeptwplidkwmob.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eGNidnplcHR3cGxpZGt3bW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjgxMjIsImV4cCI6MjA5OTc0NDEyMn0.gLn1Zd-1dXfJFjAD6Jyu66Sn9Hh6qHGnditwKhPfmjk';
const TABLE_URL = `${SUPABASE_URL}/rest/v1/pmc_matches_state`;

const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
        broadcastChannel = new BroadcastChannel('futuresport_demo_channel');
    } catch {
        broadcastChannel = null;
    }
}

let isPushing = false;
let queuedMatches = null;
let lastPushedCloudHash = '';

function computeMatchesHash(matches) {
    if (!Array.isArray(matches)) return '';
    try {
        return JSON.stringify(matches.map(m => ({
            id: m.id,
            status: m.status,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            homeSquad: !!m.homeSquadSelection,
            awaySquad: !!m.awaySquadSelection,
            homeSquadXI: m.homeSquadSelection?.startingXI?.join(','),
            awaySquadXI: m.awaySquadSelection?.startingXI?.join(','),
            possession: m.possession?.homePct != null 
                ? `${m.possession.homePct}-${m.possession.activeSide}` 
                : (m.liveState?.possession?.homePct != null ? `${m.liveState.possession.homePct}-${m.liveState.possession.activeSide}` : ''),
            livePeriod: m.liveState?.period,
            liveRunning: m.liveState?.isRunning,
            liveOffset: m.liveState?.elapsedOffset,
            liveTimelineLen: m.liveState?.timeline?.length || 0,
            liveLastId: m.liveState?.timeline?.[m.liveState?.timeline?.length - 1]?.id,
            timelineLen: m.timeline?.length || 0,
            timelineLastId: m.timeline?.[m.timeline?.length - 1]?.id,
            subReqCount: m.substitutionRequests?.length || 0,
            lastSubStatus: m.substitutionRequests?.[m.substitutionRequests.length - 1]?.status,
            warmupCount: m.warmupAmendments?.length || 0,
            lastWarmupStatus: m.warmupAmendments?.[m.warmupAmendments.length - 1]?.status
        })));
    } catch {
        return '';
    }
}

async function drainCloudPushQueue() {
    if (isPushing) return;
    isPushing = true;

    while (queuedMatches !== null) {
        const matchesToPush = queuedMatches;
        queuedMatches = null; // Clear so any updates arriving during fetch are queued

        const hash = computeMatchesHash(matchesToPush);
        if (hash === lastPushedCloudHash && lastPushedCloudHash !== '') {
            continue;
        }

        try {
            const res = await fetch(TABLE_URL, {
                method: 'POST',
                headers: {
                    ...HEADERS,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    id: 'global_matches',
                    data: { matches: matchesToPush, updatedAt: Date.now() },
                    updated_at: new Date().toISOString()
                })
            });
            if (res.ok) {
                lastPushedCloudHash = hash;
            }
        } catch (err) {
            console.warn('[RealtimeSync] Cloud push warning:', err);
        }
    }

    isPushing = false;
}

export async function pushMatchesToCloud(matchesList) {
    if (!matchesList || !Array.isArray(matchesList)) return;

    // 1. Instant local tab broadcast
    if (broadcastChannel) {
        try {
            broadcastChannel.postMessage({ type: 'MATCHES_UPDATED', matches: matchesList, timestamp: Date.now() });
        } catch {}
    }

    // 2. LocalStorage persistence across active v6 and legacy keys
    try {
        localStorage.setItem('eduvision-pmc-matches-v6', JSON.stringify(matchesList));
        localStorage.setItem('eduvision-pmc-matches', JSON.stringify(matchesList));
        localStorage.setItem('eduvision-sync-timestamp', String(Date.now()));
    } catch {}

    // 3. Supabase Cloud Sync via queue
    queuedMatches = matchesList;
    drainCloudPushQueue();
}

export async function fetchMatchesFromCloud() {
    try {
        const res = await fetch(`${TABLE_URL}?id=eq.global_matches&select=*`, {
            headers: HEADERS
        });
        if (!res.ok) return null;
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
            return rows[0]?.data?.matches || null;
        }
        return null;
    } catch {
        return null;
    }
}

export function subscribeToRealtimeSync(onMatchesUpdate) {
    if (typeof window === 'undefined') return () => {};

    let localHash = '';

    // BroadcastChannel listener for tabs
    if (broadcastChannel) {
        const handleBroadcast = (e) => {
            if (e.data?.type === 'MATCHES_UPDATED' && Array.isArray(e.data?.matches)) {
                const newHash = computeMatchesHash(e.data.matches);
                if (newHash !== localHash) {
                    localHash = newHash;
                    onMatchesUpdate(e.data.matches);
                }
            }
        };
        broadcastChannel.addEventListener('message', handleBroadcast);
    }

    // Supabase Cloud Polling (every 1.2s) for cross-device sync
    const pollMatches = async () => {
        const cloudMatches = await fetchMatchesFromCloud();
        if (cloudMatches && Array.isArray(cloudMatches) && cloudMatches.length > 0) {
            const newHash = computeMatchesHash(cloudMatches);
            if (newHash !== localHash) {
                localHash = newHash;
                onMatchesUpdate(cloudMatches);
            }
        }
    };

    pollMatches();
    const intervalId = setInterval(pollMatches, 1200);

    return () => {
        clearInterval(intervalId);
    };
}
