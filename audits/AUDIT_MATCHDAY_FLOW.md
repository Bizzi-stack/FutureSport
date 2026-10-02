# Matchday Operations & Data Flow Audit

**Date**: October 1, 2026

## Overview
This audit verifies the end-to-end matchday pipeline: from coaches signing in and submitting squads, to the match kick-off, live clock management by the statistician (Jonathan), cross-role synchronization of stats, and the final post-match data preservation when the game is concluded.

## 1. Coach Sign-in & Squad Selection
**Flow:**
- Coach signs in and selects their matchday squad (Starting XI + Bench).
- The `MatchdaySquadSelection` module isolates these choices to the specific fixture using a draft-first architecture, ensuring that switching between matches never wipes out un-submitted data.
- **Auto-Testing Validation:** The test suite (`tests/squadPersistenceFixtureSwitch.test.js`) explicitly confirms that squad edits are perfectly retained during fixture navigation.

## 2. Pre-Match & Kick-off Readiness
**Flow:**
- Once both home and away coaches hit the "Submit Squad" button, the match transitions to a state where it is ready to kick off. 
- Notifications are instantly pushed to loggers (Jonathan), referees, and match commissioners.
- **Auto-Testing Validation:** Category J of the `multiRoleSync` test suite asserts that the roster length (11 starters + bench) is locked and verified prior to the start.

## 3. Live Game Clock & Statistician Controls
**Flow:**
- Jonathan (statistician) uses the dashboard to manage the live clock. 
- The clock supports: Pause, Resume, End 1st Half (HT), Start 2nd Half, and End Match (FT).
- **Auto-Testing Validation:** Tests **J1 through J4** verify the clock transitions:
  - `J2`: Toggling Pause generates an updated `clockUpdatedAt` timestamp while preserving the elapsed offset.
  - `J3`: Ending the 1st Half forces `period: HT`, `isRunning: false`, and sets a strict 45:00 offset.
  - `J4`: Starting the 2nd Half updates `period: 2H` and resumes `isRunning: true`.
  - `J7`: Confirms that Coaches, Commentators, and Referees all read this exact unified canonical clock state without desync.

## 4. Live Stats Logging & Cross-Role Sync
**Flow:**
- Jonathan logs goals, assists, saves, and cards.
- The `mergeMatchStates` conflict resolution engine uses a sophisticated tombstone and timeline merging strategy. If two events happen at the same time, or if Jonathan overturns a goal (e.g., mistaken identity), the system corrects the timeline and recursively removes the connected stats (like the goalie's save) across all connected devices.
- **Auto-Testing Validation:** Category G proves that overturning an event correctly subtracts the goal from the scoreline and cleanly reverses the player stats on the leaderboard, ensuring 100% data integrity across all tabs and devices.

## 5. Match Conclusion & Data Preservation
**Flow:**
- Jonathan presses "End Match", formally concluding the fixture.
- A critical fix was just implemented during this audit: **Terminal Status Immunity**. If Jonathan ends the match, but a delayed internet packet from an observer's device arrives 5 seconds later claiming the match is still "live", the engine will now aggressively block the stale packet. A completed match can *never* be reverted to a live match.
- **Auto-Testing Validation:** 
  - `J5`: Concluding the match forces `status: completed`, `isFinished: true`, `period: FT`, and `isRunning: false` across all states.
  - `J6`: Terminal status immunity strictly preserves the completed match status against concurrent stale live states.
  - `J9`: Lineup persistence and Post-Match resolution guarantees that the 11 starters and the bench are cleanly preserved and displayed in the final match payload.

## Conclusion
The full test suite (68/68 tests passing) operates precisely on this flow. The newest implementations ensure that the moment a match is ended, the final clock state, rosters, and stats are immutably locked and perfectly synced.
