# 🏆 FutureSport / EduData Football Data Platform

> **Live Application URL**: [https://edudata-pmcup-app.surge.sh](https://edudata-pmcup-app.surge.sh)  
> **GitHub Repository**: [https://github.com/Bizzi-stack/FutureSport](https://github.com/Bizzi-stack/FutureSport)  
> **Active Testing Branch**: [`testing`](https://github.com/Bizzi-stack/FutureSport/tree/testing)  
> **Production Branch**: [`main`](https://github.com/Bizzi-stack/FutureSport/tree/main)  

---

## 📌 Project Overview

The **FutureSport / EduData Football Data Platform** is a high-performance, real-time sports management system built to digitize, record, and analyze elite football competitions in Barbados.

The platform powers two primary competition structures:
1. **Prime Minister's Cup (PMC)**: 25 Senior Men's Football Clubs (Wotton FC, Notre Dame, Paradise, Empire, UWI Blackbirds, Weymouth Wales, Ellerton FC, St. Andrew Lions, etc.) across 4 Matchdays and national stadium venues.
2. **National Schools League (NSSL)**: Primary & Secondary Schools across Barbados competing in U14, U16, and U19 divisions.

---

## 🌟 Key Features & Capabilities

### 1. Multi-Role Portals & Strict Session Isolation
- Supports **10 distinct user roles** with tailored views:
  - `🏆 PMC Super Administrator / Tournament Director`
  - `🏫 Schools League Super Administrator`
  - `🏫 School / Club Administrator`
  - `📋 Team Coach / Manager`
  - `⏱️ Match Referee`
  - `🚩 Fourth Official`
  - `📋 Match Commissioner`
  - `📡 Field Live Data Capturer / Statistician`
  - `📊 Data Analyst`
  - `⚽ Public Fan / Spectator`
- **Tournament Session Lock**: Header replaces toggle buttons with static session badges (e.g. `🏆 Prime Minister's Cup · 🔒 Active Session`) requiring a explicit logout to switch tournament contexts.

### 2. Matchday Squad Builder & Tactical Formations
- Coaches select 11 Starting XI + 7 Substitutes bench across **8 tactical formations**:
  - `4-3-3`, `4-4-2`, `4-2-3-1`, `3-5-2`, `3-4-3`, `4-5-1`, `5-3-2`, `4-1-4-1`
- One-click official roster submission (`✓ SENT`) broadcasting readiness to Referees and Officials.

### 3. Match Referee & Touchline Management
- **Whistle Kick-off Authority**: Referees initiate match kick-off, transitioning fixtures to `🔴 LIVE`.
- **Live Match Logging**: Record yellow cards, red cards, fouls, and goal timestamps.
- **Fourth Official Live Touchline Feed**: Real-time sub request approval feed executing automatic pitch lineup swaps and enforcing official FIFA single-entry sub rules.
- **Official Referee Report**: Post-match summary, pitch/weather condition reports, and digital signature sign-off.

### 4. Match Commissioner Verification & Score Authorization
- **Automated Discrepancy Detection**: Compares Statistician live event logs against Referee official reports to flag score or card conflicts.
- **`⛶ Expand Panel` Fullscreen Modal**: Opens a high-contrast modal workspace (`zIndex: 10000`) for inspecting logs, writing summary remarks, setting incident ratings (1–5 scale), and authorizing official scores into league standings.

### 5. Rapid Tile Data Capture Engine (Statistician Portal)
- **Direct Stat Action Tiles**:
  - `⚽ Shot / Goal`, `🟨 Yellow Card`, `🟥 Red Card`, `🅰️ Goal Assist`, `🧤 GK Save`, `🛑 Foul`, `🚩 Corner Kick`, `🎯 Penalty Kick`, `🚩 Offside`, `🔄 Substitution`
- **Live Team Possession Tracker Tiles**:
  - Two glowing side-by-side team tiles (`🟢 Home` vs `🔵 Away`).
  - Clicking a team tile switches active ball possession, calculates live possession percentages (e.g. `58%` vs `42%`), tracks accumulated possession time, and records possession transitions.
- **Friction-Free 1-Tap Workflow**: Stat-First flow with fast roster modal or Player-First flow with active target selection.

### 6. Real-Time Cloud & Multi-Tab Synchronization Engine
- Powered by **Supabase Cloud Relay** (`ayxcbvzeptwplidkwmob.supabase.co`) combined with browser **`BroadcastChannel`**.
- Sub-second updates across tablets, laptops, and phones for score changes, sub requests, and live ticker feeds.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 7, Modern Vanilla CSS Design System (Glassmorphism, HSL color tokens)
- **State & Realtime**: Supabase Client SDK, BroadcastChannel API, Custom Sync Relays
- **Charts & Spatial Analytics**: Recharts, Canvas 2D Spatial Pitch Mapper
- **Deployment**: Surge.sh Cloud (`https://edudata-pmcup-app.surge.sh`)
- **Version Control**: Git & GitHub (`https://github.com/Bizzi-stack/FutureSport.git`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Bizzi-stack/FutureSport.git
   cd FutureSport
   ```

2. **Checkout the Testing Branch**:
   ```bash
   git checkout testing
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Deploy to Surge Cloud**:
   ```bash
   Copy-Item ".\dist\index.html" ".\dist\200.html"; surge ./dist edudata-pmcup-app.surge.sh
   ```

---

## 🌿 Git Branching Strategy

- **`main`**: Production release branch.
- **`testing`**: Active feature testing and staging branch.

### Push Workflow for Testing Features
```bash
git checkout testing
git add .
git commit -m "feat: your feature description"
git push origin testing
```

---

## 🔗 Links & Resources

- **GitHub Repository**: [https://github.com/Bizzi-stack/FutureSport](https://github.com/Bizzi-stack/FutureSport)
- **Create Pull Request (`testing` ➔ `main`)**: [https://github.com/Bizzi-stack/FutureSport/pull/new/testing](https://github.com/Bizzi-stack/FutureSport/pull/new/testing)
- **Live Staging URL**: [https://edudata-pmcup-app.surge.sh](https://edudata-pmcup-app.surge.sh)
- **Master Password**: `password`
- **UAT Document**: [`FutureSport_EduData_UAT_Document.docx`](file:///c:/Users/noahb/OneDrive%20-%20The%20UWI%20-%20Cave%20Hill%20Campus/Desktop/EduData%20Project/FutureSport_EduData_UAT_Document.docx)