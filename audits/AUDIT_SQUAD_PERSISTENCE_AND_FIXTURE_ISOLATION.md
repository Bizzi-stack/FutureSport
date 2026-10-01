# Audit Report: Squad Persistence and Fixture Isolation Fixes

**Date**: October 1, 2026
**Target Issue**: A critical bug where modifying a matchday squad (e.g., removing players) and switching to another fixture would cause the squad to revert to its original prepopulated state when returning to the modified fixture.

## The Bug: Why Squad Edits Kept Reverting
The root cause was a combination of race conditions and stale closure reads spanning the React component lifecycle and the 1.2-second Supabase cloud sync polling interval:

1.  **Stale Closure over `pmcMatches`**: In `App.jsx`, `handleUpdateMatch` used a direct state setter (`setPmcMatches(nextMatches)`) while reading `pmcMatches` from the closure instead of utilizing a React functional state updater (`setPmcMatches(prev => ...)`). When cloud sync occurred between rapid user edits, the closure still held a stale `pmcMatches` array, which then overwrote the latest cloud and local state.
2.  **Match Merging Timestamps (`resolveSquad`)**: In `matchEngine.js` -> `resolveSquad`, the conflict resolution logic favoured the incoming cloud match if both the local and cloud squad selections were missing explicit `lastModified` timestamps (which was true for prepopulated cloud matches). Thus, an unedited cloud squad would often clobber local edits containing newly assigned null slots.
3.  **React Re-render vs. LocalStorage Hierarchy**: In `MatchdaySquadSelection.jsx`, the squad sync `useEffect` attempted complex timestamp comparisons against the `selectedMatch` prop to decide whether to load from the `localStorage` draft. Because the parent prop (`pmcMatches`) could reflect stale data due to the issues above, the comparison fell through, discarding the draft and loading the reverted cloud state.

## The Resolution

### 1. `App.jsx` - Fixed Stale Closure
Refactored `handleUpdateMatch` to use a functional updater. This ensures that rapid squad modifications, when pushed to the state, always build upon the absolute latest React state instead of an orphaned closure.
```javascript
setPmcMatches(prev => {
  const nextMatches = (prev || []).map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m);
  pushMatchesToCloud(nextMatches);
  return nextMatches;
});
```

### 2. `matchEngine.js` - Strengthened Conflict Resolution
Modified `resolveSquad` to explicitly check for the presence of a `lastModified` or `submittedAt` timestamp. A local squad containing a timestamp (indicating actual user interaction) now inherently trumps an incoming squad that lacks one (prepopulated), regardless of the overarching match object's `updatedAt` field.

### 3. `MatchdaySquadSelection.jsx` - Draft-First Architecture
Rewrote the sync `useEffect`. Instead of conditionally attempting to resolve timestamps between the local draft and the reactive `selectedMatch` prop, the application now treats the `localStorage` draft as the authoritative **Single Source of Truth** for unsaved edits. The effect now unconditionally prefers a valid draft (one with a `startingXI` or `formation`) and only falls back to the cloud-synced prop if a draft for that specific fixture and school does not exist. The draft is strictly cleared only upon an official submission.

## Conclusion and Verification
The `tests/squadPersistenceFixtureSwitch.test.js` was updated to explicitly mock prepopulated matches lacking `lastModified` properties to verify the engine handles this gracefully. All 68 tests (including multiRoleSync and correctionRegression) pass successfully, and a local Vite build compiles cleanly with zero warnings regarding the new data flow. The browser state accurately isolates and preserves un-submitted squad edits per fixture.
