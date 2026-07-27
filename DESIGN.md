# DESIGN.md - Merit Grid Design System

This document outlines the design system, core tokens, and component specifications for the **Merit Grid** (Football Data Platform).

---

## 1. Design Philosophy
Merit Grid is designed as a premium, data-dense analytics platform. It uses a **Deep Navy Dark Mode** scheme with **Glassmorphism** highlights, clean outlines, high-contrast typography, and subtle micro-animations (like pulsing live indicators).

---

## 2. Core Design Tokens (CSS Variables)

These tokens are defined globally in [`index.css`](file:///C:/Users/noahb/OneDrive%20-%20The%20UWI%20-%20Cave%20Hill%20Campus/Desktop/EduData%20Project/football-data-platform/src/index.css):

### Colors
*   **App Background:** `#080d1a` (`--bg-app`)
*   **Surface Panels:** `#0d1526` (`--bg-surface`)
*   **Glass Panels:** `rgba(13, 21, 38, 0.85)` (`--bg-panel`)
*   **Cards:** `rgba(255, 255, 255, 0.035)` (`--bg-card`)
*   **Card Hover:** `rgba(255, 255, 255, 0.06)` (`--bg-card-hover`)
*   **Input Background:** `rgba(255, 255, 255, 0.05)` (`--bg-input`)

### Typography
*   **Font Family:** `'Inter', system-ui, -apple-system, sans-serif` (`--font`)
*   **Primary Text:** `#e8edf8` (`--text-primary`) - Used for headers, core values.
*   **Secondary Text:** `#8899bb` (`--text-secondary`) - Used for subheadings, metrics.
*   **Muted Text:** `#4a5a7a` (`--text-muted`) - Used for captions, borders.

### Branding & Status
*   **Primary (Brand Blue):** `#2563eb` (`--primary`)
*   **Primary Light:** `#3b82f6` (`--primary-light`)
*   **Success (Active):** `#10b981` (`--success`)
*   **Warning (Alert):** `#f59e0b` (`--warning`)
*   **Danger (Error):** `#f43f5e` (`--danger`)

### Borders & Corners
*   **Borders:** `1px solid rgba(255, 255, 255, 0.07)` (`--border`)
*   **Outer Corners:** `20px` (`--radius-xl`)
*   **Card Corners:** `14px` (`--radius-lg`)
*   **Dropdown/Button Corners:** `10px` (`--radius-md`)
*   **Badge Corners:** `6px` (`--radius-sm`)

---

## 3. Core Components

### A. Custom Dropdowns (`CustomSelect`)
To prevent browser-default UI pollution, all selection dropdowns use [`CustomSelect.jsx`](file:///C:/Users/noahb/OneDrive%20-%20The%20UWI%20-%20Cave%20Hill%20Campus/Desktop/EduData%20Project/football-data-platform/src/components/CustomSelect.jsx):
*   **Closed State:** A border-based select box with a custom arrow indicator and `var(--bg-input)` background.
*   **Open State:** Renders an absolute-positioned overlay using `var(--bg-surface)` and `var(--border-lg)` with an active option highlight (`var(--primary-glow-sm)`).
*   **Behavior:** Auto-dismisses when clicking outside, maintains full compatibility with native React event payloads.

### B. Match Centre Layout (`MatchCentre.jsx`)
*   **Navigation:** Clean tab header styling using pill buttons and thin borders, avoiding flashy green/purple neon highlights.
*   **Match Setup:** Compact segmented control for age groups (U14/U16/U19). Team lists are presented inside scrollable rosters.
*   **Live Simulation:**
    *   **Pulsing State:** Pulse green animation (`pulse 1.5s infinite`) indicating an active match.
    *   **Paused State:** Green dot turns into solid gray `var(--text-muted)` and pauses the interval clock.
*   **Timeline:** Chronological list using left-bordered status lines (`#22c55e` for goals, `#14b8a6` for saves, etc.).
