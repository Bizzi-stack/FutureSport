// Evaluates player data to generate event-driven alerts for the Active Intervention Backlog

function getOverall(s, year, term) {
    const g = s.performance?.[year]?.[term];
    if (!g) return null;
    const v = Object.values(g).filter(x => x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

export function generateTeacherAlerts(students, year, currentTerm) {
    const alerts = [];
    let alertId = 1;

    // Compare Matchdays
    const prevTerm = currentTerm === 'Matchday 2' ? 'Matchday 1' : currentTerm === 'Matchday 3' ? 'Matchday 2' : null;

    let totalCurrentGrade = 0, currentGradeCount = 0;
    let totalPrevGrade = 0, prevGradeCount = 0;

    students.forEach(s => {
        const currentGrade = getOverall(s, year, currentTerm);
        const prevGrade = prevTerm ? getOverall(s, year, prevTerm) : null;

        if (currentGrade !== null) {
            totalCurrentGrade += currentGrade;
            currentGradeCount++;
        }
        if (prevGrade !== null) {
            totalPrevGrade += prevGrade;
            prevGradeCount++;
        }

        // 1. Momentum / Drawdown check
        if (currentGrade !== null && prevGrade !== null) {
            const drop = prevGrade - currentGrade;
            if (drop >= 8) {
                alerts.push({
                    id: `alert-${alertId++}`,
                    type: 'momentum',
                    studentId: s.id,
                    studentName: s.name,
                    title: 'Significant Momentum Drop',
                    message: `${s.name}'s average dropped by ${drop}% since last matchday. Schedule a check-in to identify roadblocks.`,
                    priority: drop >= 12 ? 'high' : 'medium',
                    timestamp: new Date().toISOString(),
                });
            }
        }

        // 2. Games Played / Match Stats check
        const matchStats = s.matchStats?.[year]?.[currentTerm];
        if (matchStats) {
            if (matchStats.gamesPlayed < 85) {
                alerts.push({
                    id: `alert-${alertId++}`,
                    type: 'gamesPlayed',
                    studentId: s.id,
                    studentName: s.name,
                    title: 'Low Match Participation Risk',
                    message: `${s.name}'s games played rate has fallen to ${matchStats.gamesPlayed}%. Review match rotation.`,
                    priority: 'high',
                    timestamp: new Date().toISOString(),
                });
            }
            if (matchStats.yellowCards >= 3) {
                alerts.push({
                    id: `alert-${alertId++}`,
                    type: 'matchStats',
                    studentId: s.id,
                    studentName: s.name,
                    title: 'Discipline Alert',
                    message: `${s.name} has accumulated ${matchStats.yellowCards} yellow cards this matchday. Review discipline on the pitch.`,
                    priority: 'medium',
                    timestamp: new Date().toISOString(),
                });
            }
        }
    });

    // 3. Class-wide anomaly check
    if (currentGradeCount > 5 && prevGradeCount > 5) {
        const avgCurrent = totalCurrentGrade / currentGradeCount;
        const avgPrev = totalPrevGrade / prevGradeCount;
        const classDrop = avgPrev - avgCurrent;

        if (classDrop >= 5) {
            alerts.unshift({
                id: `alert-${alertId++}`,
                type: 'class-anomaly',
                studentId: null,
                studentName: 'Entire Squad',
                title: 'Squad Average Anomaly',
                message: `The squad average rating has dropped by ${classDrop.toFixed(1)}% compared to last matchday. Consider reviewing squad tactics.`,
                priority: 'high',
                timestamp: new Date().toISOString(),
            });
        }
    }

    return alerts;
}
