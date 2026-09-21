import { mergeMatchStates } from '../src/utils/matchEngine.js';

// Base Match State (Time 0)
const baseMatch = {
    id: 'test-match-1',
    status: 'live',
    updatedAt: 1000,
    liveState: {
        updatedAt: 1000,
        clockUpdatedAt: 1000,
        isRunning: true,
        startTime: 1000,
        elapsedOffset: 0,
        period: '1H',
        playerStats: {},
        timeline: []
    }
};

// SCENARIO:
// Jonathan pauses the clock at Time 5000.
const jonathanMatch = {
    ...baseMatch,
    updatedAt: 5000,
    liveState: {
        ...baseMatch.liveState,
        updatedAt: 5000,
        clockUpdatedAt: 5000,
        isRunning: false, // PAUSED
        elapsedOffset: 4, // 4 seconds elapsed
    }
};

// A Guest Logger was on a slow connection. Their React state still has the Time 1000 clock (isRunning: true).
// At Time 6000, they log a Goal. Their payload includes their stale clock + the new Goal.
const guestMatch = {
    ...baseMatch,
    updatedAt: 6000,
    liveState: {
        ...baseMatch.liveState,
        updatedAt: 6000, // They send a higher timestamp for the liveState
        clockUpdatedAt: 1000, // BUT their clock state is originally from Time 1000
        isRunning: true, // STALE CLOCK STATE!
        elapsedOffset: 0,
        timeline: [
            { id: 'event-1', type: 'goal', minute: 1, team: 'home' }
        ]
    }
};

// Realtime system merges Guest's payload with Jonathan's payload in the Cloud
const merged = mergeMatchStates(jonathanMatch, guestMatch);

console.log("=== MERGE RESULT ===");
console.log("Expected isRunning: false (Jonathan's master clock should win)");
console.log("Actual isRunning:", merged.liveState.isRunning);
console.log("Expected elapsedOffset: 4");
console.log("Actual elapsedOffset:", merged.liveState.elapsedOffset);
console.log("Timeline events:", merged.liveState.timeline.length);
