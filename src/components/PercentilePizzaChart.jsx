import { useState, useMemo } from 'react';
import { YEARS, TERMS, STAT_RANGES, SUBJECTS } from '../data/mockData';

// ── Stat categories with colors ──────────────────────────────────────
const STAT_CATEGORIES = [
    // Attacking (orange/coral)
    { key: 'Goals',              label: 'Goals',       category: 'Attacking', color: '#f97316' },
    { key: 'Assists',            label: 'Assists',     category: 'Attacking', color: '#f97316' },
    { key: 'Shots on Target',    label: 'Shots on Target', category: 'Attacking', color: '#f97316' },
    { key: 'Shot Accuracy',      label: 'Shot Acc %',  category: 'Attacking', color: '#f97316' },
    // Possession (teal/cyan)
    { key: 'Pass Completed',     label: 'Passing',     category: 'Possession', color: '#06b6d4' },
    { key: 'Successful Dribbles',label: 'Dribbles',    category: 'Possession', color: '#06b6d4' },
    { key: 'Corners Taken',      label: 'Corners',     category: 'Possession', color: '#06b6d4' },
    { key: 'Freekicks Taken',    label: 'Free Kicks',  category: 'Possession', color: '#06b6d4' },
    // Defending (purple)
    { key: 'Successful Tackles', label: 'Tackles',     category: 'Defending', color: '#a855f7' },
    { key: 'Successful Clearances', label: 'Clearances', category: 'Defending', color: '#a855f7' },
    { key: 'Successful Blocks',  label: 'Blocks',      category: 'Defending', color: '#a855f7' },
    { key: 'Interceptions Per Game', label: 'Intercept.', category: 'Defending', color: '#a855f7' },
];

const CATEGORY_COLORS = {
    'Attacking': '#f97316',
    'Possession': '#06b6d4',
    'Defending': '#a855f7',
};

// ── Percentile calculator (squad-scoped) ─────────────────────────────
function computePercentileRanks(studentId, year, squadStudents) {
    // Build stat averages for every player in the squad
    const allStatValues = {};
    STAT_CATEGORIES.forEach(s => { allStatValues[s.key] = []; });

    const playersToCompare = squadStudents && squadStudents.length > 0 ? squadStudents : [];

    playersToCompare.forEach(st => {
        const yearPerf = st.performance?.[year];
        if (!yearPerf) return;

        STAT_CATEGORIES.forEach(stat => {
            const vals = TERMS.map(t => yearPerf[t]?.[stat.key]).filter(v => v !== undefined && v !== null);
            if (vals.length > 0) {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                allStatValues[stat.key].push({ id: st.id, value: avg });
            }
        });
    });

    // Compute percentile rank for the target student within the squad
    const result = {};
    STAT_CATEGORIES.forEach(stat => {
        const values = allStatValues[stat.key];
        const entry = values.find(v => String(v.id) === String(studentId));
        if (!entry || values.length === 0) {
            result[stat.key] = { percentile: 0, value: 0 };
            return;
        }
        // Percentile = % of squad players this student is better than
        const below = values.filter(v => v.value < entry.value).length;
        const pct = values.length > 1
            ? Math.round((below / (values.length - 1)) * 100)
            : 50; // if only 1 player, default to 50th
        result[stat.key] = {
            percentile: Math.min(99, pct), // cap at 99th
            value: Math.round(entry.value * 10) / 10,
        };
    });

    return result;
}

// ── Ordinal suffix ───────────────────────────────────────────────────
function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Pizza Chart Component ────────────────────────────────────────────
export default function PercentilePizzaChart({ student, year, squadStudents = [] }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const latestYear = year || YEARS[YEARS.length - 1];
    const squadCount = squadStudents.length;
    const ranks = useMemo(() => computePercentileRanks(student.id, latestYear, squadStudents), [student.id, latestYear, squadStudents]);

    const numSlices = STAT_CATEGORIES.length;
    const anglePerSlice = (2 * Math.PI) / numSlices;
    const cx = 220, cy = 220;  // center
    const outerR = 170;        // max radius for 100th percentile
    const innerR = 30;         // small center circle
    const labelR = outerR + 36; // label distance

    // ── Helper: polar to cartesian ───────────────────────────────────
    const polarToXY = (angle, r) => ({
        x: cx + r * Math.sin(angle),
        y: cy - r * Math.cos(angle),
    });

    // ── Build pizza slice paths ──────────────────────────────────────
    const slices = STAT_CATEGORIES.map((stat, i) => {
        const startAngle = i * anglePerSlice - anglePerSlice / 2;
        const endAngle = startAngle + anglePerSlice;
        const pctData = ranks[stat.key] || { percentile: 0, value: 0 };
        const pct = Math.max(2, pctData.percentile); // min 2 for visibility
        const sliceR = innerR + (outerR - innerR) * (pct / 100);

        // Arc points for the filled slice
        const outerStart = polarToXY(startAngle, sliceR);
        const outerEnd = polarToXY(endAngle, sliceR);
        const innerStart = polarToXY(startAngle, innerR);
        const innerEnd = polarToXY(endAngle, innerR);

        const largeArc = anglePerSlice > Math.PI ? 1 : 0;

        const path = [
            `M ${innerStart.x} ${innerStart.y}`,
            `L ${outerStart.x} ${outerStart.y}`,
            `A ${sliceR} ${sliceR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
            `L ${innerEnd.x} ${innerEnd.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
            'Z'
        ].join(' ');

        // Divider line (full radius)
        const divStart = polarToXY(startAngle, innerR);
        const divEnd = polarToXY(startAngle, outerR + 8);

        // Label position (at midpoint of slice, beyond outer ring)
        const midAngle = startAngle + anglePerSlice / 2;
        const labelPos = polarToXY(midAngle, labelR);
        
        // Percentile label (inside the slice)
        const pctLabelR = innerR + (outerR - innerR) * Math.min(0.85, (pct / 100) * 0.65 + 0.25);
        const pctLabelPos = polarToXY(midAngle, pctLabelR);

        return {
            ...stat,
            path,
            pctData,
            divStart,
            divEnd,
            labelPos,
            pctLabelPos,
            midAngle,
            startAngle,
            endAngle,
        };
    });

    // ── Ring circles for reference (25th, 50th, 75th, 100th) ─────────
    const rings = [25, 50, 75, 100].map(pct => ({
        pct,
        r: innerR + (outerR - innerR) * (pct / 100)
    }));

    // ── Category arc segments (outer decorative ring) ────────────────
    const arcPad = 0.015; // radians gap between arcs
    const arcR = outerR + 14;
    const categoryArcs = [];
    let prevCat = null;
    let arcStart = -anglePerSlice / 2;
    STAT_CATEGORIES.forEach((stat, i) => {
        const sliceStart = i * anglePerSlice - anglePerSlice / 2;
        const sliceEnd = sliceStart + anglePerSlice;
        if (stat.category !== prevCat) {
            if (prevCat !== null) {
                categoryArcs.push({ category: prevCat, start: arcStart + arcPad, end: sliceStart - arcPad, color: CATEGORY_COLORS[prevCat] });
            }
            arcStart = sliceStart;
            prevCat = stat.category;
        }
        if (i === numSlices - 1) {
            categoryArcs.push({ category: stat.category, start: arcStart + arcPad, end: sliceEnd - arcPad, color: CATEGORY_COLORS[stat.category] });
        }
    });

    const handleSliceHover = (idx, e) => {
        setHoveredIdx(idx);
        const rect = e.currentTarget.closest('svg').getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary-light)' }}>
                    Percentile Rank
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Per Season vs Squad Players
                </p>
            </div>

            {/* SVG Chart */}
            <div style={{ position: 'relative', width: '440px', height: '440px' }}>
                <svg
                    width="440"
                    height="440"
                    viewBox="0 0 440 440"
                    style={{ overflow: 'visible' }}
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {/* Background rings */}
                    {rings.map(ring => (
                        <circle
                            key={ring.pct}
                            cx={cx} cy={cy} r={ring.r}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.06)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Center solid circle */}
                    <circle cx={cx} cy={cy} r={innerR} fill="rgba(0, 0, 0, 0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    {/* Category arcs (outer decorative ring) */}
                    {categoryArcs.map((arc, i) => {
                        const s = polarToXY(arc.start, arcR);
                        const e = polarToXY(arc.end, arcR);
                        const sweep = arc.end - arc.start;
                        const large = sweep > Math.PI ? 1 : 0;
                        return (
                            <path
                                key={i}
                                d={`M ${s.x} ${s.y} A ${arcR} ${arcR} 0 ${large} 1 ${e.x} ${e.y}`}
                                fill="none"
                                stroke={arc.color}
                                strokeWidth="4"
                                strokeLinecap="round"
                                opacity="0.7"
                            />
                        );
                    })}

                    {/* Divider lines */}
                    {slices.map((slice, i) => (
                        <line
                            key={`div-${i}`}
                            x1={slice.divStart.x} y1={slice.divStart.y}
                            x2={slice.divEnd.x} y2={slice.divEnd.y}
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Filled pizza slices */}
                    {slices.map((slice, i) => (
                        <path
                            key={`slice-${i}`}
                            d={slice.path}
                            fill={slice.color}
                            fillOpacity={hoveredIdx === i ? 0.7 : 0.45}
                            stroke={hoveredIdx === i ? slice.color : 'rgba(255,255,255,0.1)'}
                            strokeWidth={hoveredIdx === i ? 2 : 0.5}
                            style={{ transition: 'fill-opacity 0.2s, stroke-width 0.2s', cursor: 'pointer' }}
                            onMouseEnter={(e) => handleSliceHover(i, e)}
                            onMouseMove={(e) => handleSliceHover(i, e)}
                        />
                    ))}

                    {/* Percentile labels inside slices */}
                    {slices.map((slice, i) => {
                        const pct = slice.pctData.percentile;
                        if (pct < 15) return null; // too small to show label
                        return (
                            <text
                                key={`pct-${i}`}
                                x={slice.pctLabelPos.x}
                                y={slice.pctLabelPos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="rgba(255,255,255,0.9)"
                                fontSize="11"
                                fontWeight="800"
                                style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                            >
                                {ordinal(pct)}
                            </text>
                        );
                    })}

                    {/* Stat labels around the outside */}
                    {slices.map((slice, i) => {
                        const isHovered = hoveredIdx === i;
                        return (
                            <g key={`label-${i}`}>
                                <text
                                    x={slice.labelPos.x}
                                    y={slice.labelPos.y - 7}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={isHovered ? '#ffffff' : 'var(--text-primary)'}
                                    fontSize="11"
                                    fontWeight="700"
                                    style={{ transition: 'fill 0.2s' }}
                                >
                                    {slice.label}
                                </text>
                                <text
                                    x={slice.labelPos.x}
                                    y={slice.labelPos.y + 8}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={slice.color}
                                    fontSize="10"
                                    fontWeight="600"
                                    opacity="0.8"
                                >
                                    {ordinal(slice.pctData.percentile)} · {slice.pctData.value}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip on hover */}
                {hoveredIdx !== null && (
                    <div style={{
                        position: 'absolute',
                        left: `${Math.min(340, Math.max(100, tooltipPos.x))}px`,
                        top: `${Math.min(380, tooltipPos.y - 60)}px`,
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: `1px solid ${slices[hoveredIdx].color}40`,
                        borderRadius: '10px',
                        padding: '10px 14px',
                        pointerEvents: 'none',
                        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${slices[hoveredIdx].color}20`,
                        zIndex: 50,
                        minWidth: '160px',
                        backdropFilter: 'blur(12px)',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: slices[hoveredIdx].color, marginBottom: '4px' }}>
                            {slices[hoveredIdx].label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            Category: {slices[hoveredIdx].category}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '6px' }}>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    {slices[hoveredIdx].pctData.value}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Percentile</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: slices[hoveredIdx].color }}>
                                    {ordinal(slices[hoveredIdx].pctData.percentile)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Legend */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, opacity: 0.7 }} />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>{cat}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
