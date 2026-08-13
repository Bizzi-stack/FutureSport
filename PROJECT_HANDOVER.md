# FutureSport / EduData Football Data Platform — Project Handover & Context Blueprint

> **Live Application URL**: [https://edudata-pmcup-app.surge.sh](https://edudata-pmcup-app.surge.sh)  
> **Primary Cloud Sync Engine**: Supabase DB (`ayxcbvzeptwplidkwmob.supabase.co`)  
> **Tech Stack**: React 19, Vite, Vanilla CSS (Glassmorphism Design System), Recharts, Plotly.js  

---

## 1. Project Overview & Scope
The **FutureSport Football Data Platform** is an enterprise-grade sports management & analytics system built for youth and senior football competitions in Barbados, specifically powering:
1. **The Prime Minister's Cup (PMC)**: 25 Senior Men's Football Clubs (Wotton FC, Notre Dame, Paradise, Empire, UWI Blackbirds, Weymouth Wales, Ellerton, Britton's Hill, etc.).
2. **The National Schools League**: Primary and Secondary School Competitions across Barbados.

The platform provides end-to-end matchday operations connecting **Team Coaches**, **Referees**, **Fourth Officials**, **Statisticians**, **Tournament Commissioners**, and **Parents/Scouts**.

---

## 2. Key Architecture & Codebase Structure

```
football-data-platform/
├── src/
│   ├── App.jsx                                # Main app shell, global state, tournament switcher
│   ├── index.css                              # Glassmorphism design system & CSS tokens
│   ├── components/
│   │   ├── TeacherDashboard.jsx               # Coach & Team Manager Portal
│   │   ├── MatchdaySquadSelection.jsx         # Pre-match formation & squad builder
│   │   ├── match/
│   │   │   ├── CoachLiveManagement.jsx        # Live substitution request panel for coaches
│   │   │   └── LiveMatch.jsx                  # Interactive pitch map & live event ticker
│   │   ├── referee/
│   │   │   ├── RefereeDashboard.jsx           # Referee schedule, whistle kick-off & match reports
│   │   │   └── FourthOfficialDashboard.jsx    # Touchline sub approval feed & official timekeeping
│   │   ├── statistician/
│   │   │   └── StatisticianDashboard.jsx      # Spatial shot/save pitch logger & heatmaps
│   │   └── commissioner/
│   │       └── CommissionerDashboard.jsx      # Standings, disciplinary logs & competition admin
│   ├── utils/
│   │   ├── pmcDataLoader.js                   # Scraped PMC data loader & fixture/roster generator
│   │   └── realtimeSync.js                    # Supabase Cloud & BroadcastChannel real-time sync engine
│   └── data/
│       ├── pmcScrapedData.json                # Scraped Prime Minister's Cup source dataset
│       └── mockData.js                        # National Schools League mock dataset
```

---

## 3. Real-Time Cross-Device Synchronization Engine

Location: `src/utils/realtimeSync.js`

Cross-device real-time state synchronization operates on a **hybrid dual-channel mechanism**:
1. **Supabase Cloud Relay**:
   - Table: `public.pmc_matches_state` (`https://ayxcbvzeptwplidkwmob.supabase.co`)
   - Method: HTTP POST with `Prefer: resolution=merge-duplicates`
   - Polling frequency: `1.2s` interval with SHA/object hash comparison to minimize re-renders.
2. **Local Multi-Tab BroadcastChannel**:
   - Channel: `futuresport_demo_channel`
   - Instant 0ms broadcast across multiple browser tabs on the same device.

### Crucial Note on Cloud Persistence
`App.jsx` syncs match updates directly to Supabase via `pushMatchesToCloud(matches)`.  
`subscribeToRealtimeSync` listens for cloud updates and keeps all connected devices (Referees on laptops, Coaches on phones, Fourth Officials on tablets) in sync within ~1 second.

---

## 4. User Roles & Workflows Implemented

### A. Team Coach / Manager (`TeacherDashboard.jsx`)
- **Squad Builder (`MatchdaySquadSelection.jsx`)**:
  - Select 11 Starting XI + 7 Bench substitutes across 8 tactical formations (4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 3-4-3, 4-5-1, 5-3-2, 4-1-4-1).
  - Fixtures list displays all matches (`✓ SENT`, `🔴 LIVE`, `✓ FINISHED`).
- **Live Match Management (`CoachLiveManagement.jsx`)**:
  - Automatically switches coach to `🔴 LIVE MATCH` tab when referee kicks off.
  - Dynamically calculates `currentOnFieldPlayers` vs `currentBenchPlayers`.
  - Subbed-off players are **permanently removed** from selection lists according to official FIFA/tournament rules.
  - Coaches tap a player to come off + a substitute to bring on, then click **Submit Substitution Request**.

### B. Referee (`RefereeDashboard.jsx`)
- Displays all scheduled matches under **📅 Scheduled — Awaiting Kick-Off**.
- Shows Home/Away squad readiness badges (`✅ Home` / `✅ Away`).
- Sole authority to blow the whistle and **KICK OFF** matches.
- Officiating timer, card/foul tracking, and post-match referee report submission.

### C. Fourth Official (`FourthOfficialDashboard.jsx`)
- Displays active live matches in **Active Matches In Progress**.
- Live feed of **Pending Substitution Requests** from team coaches.
- Single-tap **Approve** or **Reject** with sub minute logging.
- Lineup swap: subbed-on player joins active 11 on the pitch, subbed-off player leaves the match.

### D. Statistician (`StatisticianDashboard.jsx`)
- Spatial shot & save logging on an interactive 2D pitch map with target zones and heatmaps.

---

## 5. Data Specifications & Entity Standards

1. **Clubs**: ID format `pmc-club-{id}` (e.g. `pmc-club-10` Wotton, `pmc-club-11` Notre Dame, `pmc-club-14` Paradise, `pmc-club-15` Empire, `pmc-club-17` UWI Blackbirds).
2. **Teams**: ID format `${club.id}-team-PMC` (e.g. `pmc-club-10-team-PMC`).
3. **Players**: Every club in `PMC_SCHOOLS` has **exactly 25 registered players** (2 Goalkeepers, 8 Defenders, 8 Midfielders, 7 Forwards) with `teamAssignments['2026-2027'] = ${club.id}-team-PMC`.
4. **Fixtures**: `PMC_MATCHES` in `pmcDataLoader.js` generates **45 fixtures across 4 Matchdays** (Matchday 1 to Matchday 4) rotated across Barbados stadiums (Kensington Oval, Wildey Turf, Usain Bolt Sports Complex, National Stadium, Speightstown Field).
5. **Match Statuses**:
   - `'upcoming'` / `'scheduled'`: Awaiting squad submission & referee kick-off.
   - `'live'`: Match in progress.
   - `'completed'` / `'refereed'`: Match finished, final score & referee report saved.

---

## 6. Recent Fixes & Resolutions Log

| Issue / Feature | Status | Resolution Detail |
|---|---|---|
| **Raw ID Discrepancies** | Fixed | Replaced raw IDs (`pmc-club-10`) with clean full team names (**WOTTON vs NOTRE DAME**) in match headers & fixture lists. |
| **Live Match Reset Bug** | Fixed | Removed legacy `if (status === 'live') status = 'completed'` line inside `sanitizeMatchState` in `App.jsx`. Live matches now remain live during sync. |
| **Cross-Device Sync Rate Limit** | Fixed | Migrated real-time sync from public mock API (`api.restful-api.dev`) to a dedicated Supabase Cloud table (`pmc_matches_state`). |
| **Illegal Re-Substitution Bug** | Fixed | Rewrote `CoachLiveManagement.jsx` and `FourthOfficialDashboard.jsx` so subbed-off players are permanently removed from selection lists and cannot re-enter the match. |
| **Empty Roster Bug** | Fixed | Refactored `pmcDataLoader.js` to generate guaranteed 25-player balanced rosters for all 25 Prime Minister's Cup clubs. |
| **Missing Referee Schedule Fixtures** | Fixed | Seeded Supabase Cloud DB with 45 multi-matchday fixtures across Matchday 1 through Matchday 4. |

---

## 7. Developer & Build Commands

```bash
# Start local development server
npm run dev

# Build production bundle
npm run build

# Deploy build to Surge
Copy-Item ".\dist\index.html" ".\dist\200.html"; npx surge ./dist edudata-pmcup-app.surge.sh
```

---

## 8. Recommended Next Steps for Future Iterations
1. **Whistle Audio Effects**: Add synthetic Web Audio API whistle sound when referee kicks off or ends a half.
2. **PDF Referee Report Export**: Add a print/PDF export feature for completed match referee reports in `RefereeDashboard.jsx`.
3. **Public Fan Match Centre**: Enhance `MatchCentre.jsx` for public spectator live score updates.
