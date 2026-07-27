// Shared primitives used across all DataHub tabs
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    ScatterChart, Scatter, ZAxis,
    LineChart, Line, ReferenceLine,
    AreaChart, Area,
    ComposedChart,
} from 'recharts';
export {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
    ScatterChart, Scatter, ZAxis,
    LineChart, Line, ReferenceLine,
    AreaChart, Area,
    ComposedChart,
};

// Refined, professional palette — no rainbow
export const CHART_COLORS = [
    '#3b82f6', // indigo (primary)
    '#0ea5e9', // sky
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#a78bfa', // violet
    '#64748b', // slate
    '#fb923c', // orange
    '#38bdf8', // light sky
    '#818cf8', // light indigo
    '#2dd4bf', // light teal
];

// Functional performance colours — subdued but clear
export function scoreColor(s) {
    if (s >= 75) return '#10b981';
    if (s >= 55) return '#f59e0b';
    return '#ef4444';
}

export function ScoreBar({ score, width = 80 }) {
    const c = scoreColor(score);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', minWidth: width }}>
                <div style={{ height: '100%', width: `${score}%`, background: c, borderRadius: '99px', transition: 'width 0.4s ease', opacity: 0.85 }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', minWidth: '34px', textAlign: 'right' }}>{score}%</span>
        </div>
    );
}

export function HubCard({ children, style = {} }) {
    return (
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', position: 'relative', ...style }}>
            {children}
        </div>
    );
}

// ── Methodology Glossary ──────────────────────────────────────────────
export const GLOSSARY = {
    // ── Overview Tab ──
    'overview': {
        title: 'Overview Dashboard',
        formula: 'Global Average = Σ(player averages) / N',
        explanation: 'The Overview tab provides a macro-level snapshot of the entire player population. It computes systemic momentum (the average slope of recent performance), mean drawdown from peak ratings, the percentage of players classified as "Quant High Potential" (composite factor score ≥ 80), and professional readiness projections. The Momentum Leaderboard ranks squad levels or clubs by their average matchday-over-matchday performance slope.',
    },
    'macro-trajectory': {
        title: 'Macro Trajectory',
        formula: 'Matchday Avg = Σ(all player averages for matchday) / N',
        explanation: 'This line chart plots the average performance across all active players for each matchday in the selected season. It reveals whether the cohort is trending upward, plateauing, or declining over the season. The area fill helps visualize the magnitude of change.',
    },
    'momentum-leaderboard': {
        title: 'Momentum Leaderboard',
        formula: 'Momentum = (Matchday 3 Avg − Matchday 1 Avg) / (number of matchdays − 1)',
        explanation: 'Each squad or academy is ranked by its average momentum — the mean slope of player performance across the season\'s matchdays. Positive momentum indicates an improving trend; negative momentum indicates decline. This helps identify which squads are accelerating vs stalling.',
    },
    'risk-distribution': {
        title: 'Multi-Factor Development Distribution',
        formula: 'Composite = PMF(25%) + Consistency(20%) + Recovery(15%) + Games Played(20%) + Match Stats(20%)',
        explanation: 'Players are scored on a composite index combining Player Momentum Factor (PMF), rating consistency (inverse variance), recent recovery trend, games played rate, and behavioral profile. Players scoring ≥ 80 are "Elite", those < 65 are "Volatile". The distribution chart shows how the cohort spreads across these development categories.',
    },

    // ── Interschool Tab ──
    'national-trajectory': {
        title: 'National Performance Trajectory',
        formula: 'Club Avg per Matchday = Σ(player avgs in club for that matchday) / N',
        explanation: 'This overlay chart plots each club\'s average player performance across all 15 data points (5 seasons × 3 matchdays). It reveals systemic national trends — whether clubs are converging, diverging, or moving in parallel. Crossing lines indicate shifts in relative performance.',
    },
    'subject-heatmap': {
        title: 'Stat Category Strength Map',
        formula: 'Cell Value = Σ(scores for metric at club) / N players',
        explanation: 'A color-coded matrix where each cell represents a club\'s average rating in a specific stat category. Green (≥75%) indicates strength, blue (≥60%) is adequate, yellow (≥50%) needs attention, and red (<50%) signals a systemic gap. The "Natl" column shows the national average for each metric, helping identify where training intervention may be needed system-wide.',
    },
    'matchStats-radar': {
        title: 'Squad Engagement Profile',
        formula: 'Discipline (Yellow) = 100 − (avg yellow cards × 15); Discipline (Red) = 100 − (avg red cards × 50)',
        explanation: 'A radar chart overlaying four match stats dimensions per club: Games Played (normalized %), Minutes Played (normalized %), Discipline (Yellow) (inverse of yellow cards), and Discipline (Red) (inverse of red cards). Clubs with larger radar areas have healthier player profiles. Contracting shapes signal systemic squad challenges.',
    },
    'grade-distribution': {
        title: 'National Rating Distribution',
        formula: 'Band %  = (players in band / total players) × 100. Bands: A ≥ 80, B ≥ 70, C ≥ 60, D ≥ 50, F < 50',
        explanation: 'A stacked bar chart showing the percentage of players falling into each rating band (A through F) per club. This reveals the "shape" of developmental outcomes — a healthy distribution should be top-heavy (more A/B than D/F). Bottom-heavy distributions indicate systemic development challenges.',
    },
    'csec-risk': {
        title: 'Pro Academy Readiness & Risk Landscape',
        formula: 'Academy Pro Readiness Rate = (players hitting ≥ 75% of performance metrics) / total players × 100',
        explanation: 'Circular gauges show each club\'s projected readiness rate — the percentage of players currently rating ≥ 50% in at least 75% of their metrics. The risk bars below show the High (avg < 50) / Moderate (avg 50–60) / Low (avg > 60) development risk distribution, indicating where academy coaching resources should be focused.',
    },

    // ── Multi-Factor Score Tab ──
    'factor-score': {
        title: 'Multi-Factor Score',
        formula: 'Composite = PMF(25%) + Consistency(20%) + Recovery(15%) + Games Played(20%) + Match Stats(20%)',
        explanation: 'Each player receives a composite score from 0–100 based on five weighted factors:\n\n• **PMF (Player Momentum Factor)**: Measures the slope of recent performance using linear regression over the last 4 matchdays. Positive slope = upward momentum.\n\n• **Consistency**: Inverse of rating variance — players who perform steadily score higher. Calculated as 100 − (σ × 2.5).\n\n• **Recovery**: Compares the two most recent matchdays. Improvement = higher recovery score.\n\n• **Games Played**: Raw games played percentage from match statistics.\n\n• **Match Stats**: 100 − (yellow cards × 15) − (red cards × 50).',
    },

    // ── Drawdown Tab ──
    'drawdown': {
        title: 'Drawdown Analysis',
        formula: 'Drawdown = Peak Rating − Current Rating; Depth % = Drawdown / Peak × 100',
        explanation: 'Borrowed from financial analytics, a "drawdown" measures how far a player\'s rating has fallen from their personal peak. A player who once averaged 85% but now averages 70% has a 15-point drawdown (17.6% depth). This identifies players who are underperforming relative to their own demonstrated capability, not just against an absolute benchmark. Deeper drawdowns suggest fatigue, slump, or external factors.',
    },

    // ── Cluster Tab ──
    'cluster': {
        title: 'K-Means Clustering',
        formula: 'K-Means with k=4, dimensions: X = current overall avg, Y = matchday-over-matchday momentum',
        explanation: 'Players are plotted in a 2D space where X = their current overall average rating and Y = their momentum (change from previous matchday). The K-Means algorithm partitions players into 4 clusters by iteratively assigning each player to the nearest centroid and recalculating centroids until convergence. The resulting clusters typically emerge as:\n\n• **High Rating + Positive Momentum** (thriving)\n• **High Rating + Negative Momentum** (declining stars)\n• **Low Rating + Positive Momentum** (recovering)\n• **Low Rating + Negative Momentum** (at-risk)',
    },

    // ── Elasticity Tab ──
    'elasticity': {
        title: 'Games Played-Rating Elasticity',
        formula: 'β = Cov(games played, performance) / Var(games played)',
        explanation: 'Elasticity (β coefficient) measures how sensitive a player\'s rating is to changes in their games played. A β of 0.8 means that for every 1% increase in games played, rating increases by 0.8%. High-β players are "games played-dependent" — small drops in minutes/games cause large rating drops. Low-β players maintain rating regardless of rotation. This is calculated using OLS regression across all available matchdays.',
    },

    // ── Momentum Tab ──
    'momentum': {
        title: 'Player Momentum Factor (PMF)',
        formula: 'PMF = slope of linear regression over last 4 matchday averages, scaled to 0–100',
        explanation: 'The PMF uses linear regression over a player\'s most recent 4 matchday averages to quantify their performance trajectory. A positive slope means improving; negative means declining. The "Velocity" is the raw slope value (points per matchday), while "Acceleration" is the change in velocity between consecutive periods. Players with high positive PMF and acceleration are "breakout candidates"; those with negative values need intervention.',
    },

    // ── Subject Momentum Tab ──
    'subject-momentum': {
        title: 'Metric-Level Momentum',
        formula: 'Per-stat trend = rating[current matchday] − rating[previous matchday] for each stat',
        explanation: 'This tab tracks individual metric performance over time using a longitudinal heatmap. Each cell represents a player\'s rating in a specific stat for a specific matchday, color-coded by performance level. This reveals stat-specific patterns invisible in overall averages — a player might be improving in Goals while declining in Successful Tackles.',
    },

    // ── Monte Carlo Simulation ──
    'simulation': {
        title: 'Monte Carlo Forecast',
        formula: 'Forecast = μ + σ × Z, where Z ~ Z(0,1), run 500 iterations',
        explanation: 'Monte Carlo simulation generates 500 possible future rating scenarios for each player based on their historical mean (μ) and standard deviation (σ). For each simulation, a random normal variable is added to the mean to model uncertainty. The result is a probability distribution of likely outcomes. The "pass probability" is the percentage of simulations where the player scores ≥ 50%. This quantifies uncertainty — a player averaging 55% with high variance has lower confidence than one averaging 55% with low variance.',
    },

    // ── Z-Score Tab ──
    'zscore': {
        title: 'Z-Score & Percentile Analysis',
        formula: 'Z = (player avg − squad mean) / squad standard deviation',
        explanation: 'The Z-Score measures how many standard deviations a player\'s rating is from their squad mean. A Z of +1.5 means the player is 1.5 standard deviations above average. Z-Scores normalize performance across different squads — a player scoring 70% in a strong squad (mean 75%) actually has a negative Z-Score, while 70% in a weaker squad (mean 55%) is a strong positive Z. The percentile map shows where each player falls in the overall distribution.',
    },

    // ── Pro Readiness Tab ──
    'csec': {
        title: 'Pro Academy Readiness Prediction',
        formula: 'Readiness Score = weighted sum of: overall rating, trend slope, metric volatility, games played',
        explanation: 'Pro Academy Readiness models each player\'s likelihood of transitioning to the professional academy. The readiness matrix plots players by current rating (X) vs development risk score (Y). Players are flagged as "Ready Now" (rating >= 70, positive trend, minimal drawdown), "On Track" (rating 50-70), or "At Risk" (rating < 50 or high volatility). "Early Promotion Candidates" identifies high-performing U14/U16 players who could potentially be promoted to the U19 squad early.',
    },

    // ── Correlation Explorer ──
    'correlation': {
        title: 'Correlation Explorer',
        formula: 'r = Σ((xi − x̄)(yi − ȳ)) / √(Σ(xi − x̄)² × Σ(yi − ȳ)²)',
        explanation: 'The Pearson correlation coefficient (r) measures the linear relationship between any two selected metrics. Values range from −1 (perfect negative correlation) to +1 (perfect positive correlation). The scatter plot shows individual players as dots, with the median lines dividing the space into four quadrants. This reveals hidden relationships — for example, whether games played truly correlates with performance ratings, or if discipline impacts stats.',
    },

    // ── Compare & STEM ──
    'class-compare': {
        title: 'Squad Comparison',
        formula: 'Per-stat avg = Σ(player ratings in stat) / N players per squad',
        explanation: 'Head-to-head comparison of two selected squads across all stats using radar charts and grouped bar charts. The radar overlay shows the "shape" of each squad\'s strengths and weaknesses. This helps directors understand squad-level dynamics and identify where specific squads may need additional training resources.',
    },
    'stem': {
        title: 'Attacking Stats Analysis',
        formula: 'Attacking Avg = (Goals + Assists + Shots on Target) / 3 per player',
        explanation: 'Analyzes attacking stats (Goals, Assists, Shots on Target) across the player body. The scatter plot compares each player\'s attacking average vs their overall rating — points above the diagonal outperform in attacking metrics relative to their general play. The stat breakdown shows which metrics are strongest, and the squad rankings identify which groups produce the best attacking outcomes.',
    },

    'trends': {
        title: 'Performance Trends',
        formula: 'Trend Slope = linear regression slope over selected matchdays; Plateau = |slope| < 0.5 for top performers',
        explanation: 'The Trends tab categorizes players by their performance trajectory: "Most Improved" (steepest positive slope), "Steepest Decline" (steepest negative slope), and "Plateaued" (high-performing players with near-zero slope). The momentum matrix scatter plot maps every player by their current rating (X) vs their momentum slope (Y), giving a system-wide view of squad dynamics.',
    },

    // ── National Hub ──
    'national-domains': {
        title: 'Attacking vs Defending Specialization',
        formula: 'Academy Bias = (Academy Attacking Avg) − (Academy Defending Avg)',
        explanation: 'Plots each academy\'s average attacking score against its average defending score. The diagonal dotted line represents perfect balance. Academies situated above the line lean towards defending dominance, while those below lean towards attacking dominance. This reveals the "playing style personality" of each institution at a macro level.',
    },
    'national-benchmarks': {
        title: 'National Stat Benchmarks',
        formula: 'Leader Score = Max(Academy Metric Average) over all academies',
        explanation: 'Identifies the highest performing academy for each individual metric category across the entire league system. The national average is provided as a baseline to demonstrate the performance gap between the system average and the leading institution.',
    },
    'national-gamesPlayed': {
        title: 'Systemic Games Played vs Ratings',
        formula: 'X = Avg Games Played per Squad per Academy, Y = Avg Rating per Squad per Academy',
        explanation: 'Plots specific squad groups (e.g. U16 at Academy C) to reveal the systemic correlation between games played (welfare/match experience) and performance ratings. The median lines divide the country into four quadrants, highlighting which cohorts are both highly active and highly rated, versus those suffering from low minutes and low performance.',
    },
    'national-discipline': {
        title: 'National Discipline Overview',
        formula: 'Avg Incidents = Total Incidents / Academy Size',
        explanation: 'Standardizes cards and disciplinary issues by squad size to allow fair comparison between large and small academies. Evaluates key conduct indicators: red cards and yellow cards per capita.',
    },
    'national-enrollment': {
        title: '5-Year Club Enrollment Trends',
        formula: 'Total = Σ(Players registered in club per year)',
        explanation: 'Tracks the historical player registration capacity across institutions over the past five years. Identifies macro-level shifts in player enrollment, revealing which academies are growing, shrinking, or remaining at maximum capacity.',
    },
    'national-demographics': {
        title: 'Club Cohort Squad Distributions',
        formula: 'Squad Size = Count of players per Team (U14 through U19)',
        explanation: 'Visualizes the internal demographic structure (squad age distribution) of each club. Top-heavy shapes (large senior squads) indicate high player retention but lower youth intake. Bottom-heavy shapes indicate high youth intake but potential drop-off or restructuring in senior levels.',
    },
    'national-progression': {
        title: 'Cross-Sectional Rating Progression',
        formula: 'Avg = Mean rating of all players in Team N for Academy X',
        explanation: 'Maps the average performance across all age groups for each academy. This helps identify systemic patterns in developmental journeys, such as the transition dip (a common dip in U16) or aggressive growth in promotion years (U19).',
    },
};

// ── Info Button & Modal ───────────────────────────────────────────────
function InfoModal({ entry, onClose }) {
    if (!entry) return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
            <div onClick={onClose} style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)', animation: 'fadeIn 0.15s ease',
            }} />
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 'min(520px, 90vw)', maxHeight: '80vh', overflowY: 'auto',
                background: 'linear-gradient(160deg, #0f1d35 0%, #0a1020 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px', padding: '28px 32px',
                boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.08)',
                animation: 'fadeIn 0.2s ease',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '16px' }}>📐</span>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                                {entry.title}
                            </h3>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Methodology &amp; Calculation
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px',
                    }}>✕</button>
                </div>

                {/* Formula removed to reduce transparency theater / intimidation */}

                {/* Explanation */}
                <div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                        How It Works
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#cbd5e1' }}>
                        {entry.explanation.split('\n\n').map((para, i) => (
                            <p key={i} style={{ margin: '0 0 12px 0' }}>
                                {para.startsWith('• ') ? (
                                    <span style={{ display: 'block', paddingLeft: '12px' }}>
                                        <span style={{ color: '#818cf8', fontWeight: '700' }}>•</span>{' '}
                                        {para.slice(2).split('**').map((seg, j) =>
                                            j % 2 === 1
                                                ? <strong key={j} style={{ color: '#e2e8f0', fontWeight: '700' }}>{seg}</strong>
                                                : <span key={j}>{seg}</span>
                                        )}
                                    </span>
                                ) : (
                                    para.split('**').map((seg, j) =>
                                        j % 2 === 1
                                            ? <strong key={j} style={{ color: '#e2e8f0', fontWeight: '700' }}>{seg}</strong>
                                            : <span key={j}>{seg}</span>
                                    )
                                )}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export function InfoButton({ infoKey }) {
    const [open, setOpen] = useState(false);
    const entry = GLOSSARY[infoKey];
    if (!entry) return null;
    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                title="How is this calculated?"
                style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                    color: '#818cf8', fontSize: '10px', fontWeight: '800',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = '#a5b4fc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#818cf8'; }}
            >
                ⓘ
            </button>
            {open && <InfoModal entry={entry} onClose={() => setOpen(false)} />}
        </>
    );
}

// Clean section header: indigo accent bar + uppercase label + optional info
export function SectionHeader({ title, count, infoKey }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '3px', height: '14px', background: '#3b82f6', borderRadius: '2px', flexShrink: 0, opacity: 0.7 }} />
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</span>
            {infoKey && <InfoButton infoKey={infoKey} />}
            {count != null && (
                <span style={{ marginLeft: 'auto', fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 9px', borderRadius: '99px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {count}
                </span>
            )}
        </div>
    );
}

export function Empty({ msg }) {
    return (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
            {msg}
        </div>
    );
}

export const TT_STYLE = {
    contentStyle: { background: '#0d1526', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', fontSize: '12px' },
    labelStyle: { color: '#94a3b8', fontWeight: '600' },
    itemStyle: { color: '#cbd5e1' },
};

// Rank circle — clean numbered badge
export function RankBadge({ rank }) {
    const isTop = rank < 3;
    const bg = rank === 0 ? '#3b82f6' : rank === 1 ? 'rgba(37,99,235,0.4)' : 'rgba(37,99,235,0.2)';
    return (
        <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: isTop ? bg : 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '800',
            color: rank === 0 ? '#fff' : rank < 3 ? '#a5b4fc' : '#64748b',
            flexShrink: 0,
        }}>
            {rank + 1}
        </div>
    );
}

export function RadarLabel({ x, y, payload }) {
    return <text x={x} y={y} textAnchor="middle" fontSize={10} fill="#94a3b8">{payload.value}</text>;
}

// ── Drag handle shared style ──────────────────────────────────────────
const HANDLE_HOVER_STYLE = `
.hub-h-handle:hover .hub-handle-pill { opacity: 1 !important; }
.hub-v-handle:hover .hub-handle-pill { opacity: 1 !important; }
.hub-h-handle { cursor: col-resize; }
.hub-v-handle { cursor: row-resize; }
`;

// Inject style once
if (typeof document !== 'undefined' && !document.getElementById('hub-resize-style')) {
    const s = document.createElement('style');
    s.id = 'hub-resize-style';
    s.textContent = HANDLE_HOVER_STYLE;
    document.head.appendChild(s);
}

// ── Horizontal split (left | right) ──────────────────────────────────
export function ResizableHSplit({ left, right, defaultSplit = 50, min = 20, max = 80, gap = 16 }) {
    const [split, setSplit] = useState(defaultSplit);
    const dragging = useRef(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const onMove = (e) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setSplit(Math.min(max, Math.max(min, pct)));
        };
        const onUp = () => { dragging.current = false; document.body.style.cursor = ''; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }, [min, max]);

    return (
        <div ref={containerRef} style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
            <div style={{ width: `calc(${split}% - ${gap / 2}px)`, flexShrink: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {left}
            </div>

            {/* Drag handle */}
            <div
                className="hub-h-handle"
                onMouseDown={() => { dragging.current = true; document.body.style.cursor = 'col-resize'; }}
                style={{ width: `${gap}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', userSelect: 'none' }}
            >
                <div className="hub-handle-pill" style={{
                    width: '3px', height: '36px', borderRadius: '99px',
                    background: 'rgba(37,99,235,0.45)', opacity: 0.3,
                    transition: 'opacity 0.15s',
                }} />
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {right}
            </div>
        </div>
    );
}

// ── Vertical split (top / bottom) ─────────────────────────────────────
export function ResizableVSplit({ top, bottom, defaultSplit = 50, min = 20, max = 80, gap = 16 }) {
    const [split, setSplit] = useState(defaultSplit);
    const dragging = useRef(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const onMove = (e) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((e.clientY - rect.top) / rect.height) * 100;
            setSplit(Math.min(max, Math.max(min, pct)));
        };
        const onUp = () => { dragging.current = false; document.body.style.cursor = ''; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }, [min, max]);

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
            <div style={{ height: `calc(${split}% - ${gap / 2}px)`, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {top}
            </div>

            {/* Drag handle */}
            <div
                className="hub-v-handle"
                onMouseDown={() => { dragging.current = true; document.body.style.cursor = 'row-resize'; }}
                style={{ height: `${gap}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
            >
                <div className="hub-handle-pill" style={{
                    height: '3px', width: '48px', borderRadius: '99px',
                    background: 'rgba(37,99,235,0.45)', opacity: 0.3,
                    transition: 'opacity 0.15s',
                }} />
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {bottom}
            </div>
        </div>
    );
}
