import { STAT_RANGES } from '../data/mockData';

// Default settings for when no settings object is passed
const DEFAULTS = {
    failingGrade: 25, // using 25 as a normalized low stat threshold (bottom 25%)
    excellentGrade: 75,
    highRiskAverage: 40,
    highRiskFailCount: 4,
    moderateRiskAverage: 50,
    attendanceWarning: 5, // minimum games played
    lateArrivalWarning: 0, // unused for now or we could use low minutes
    conductWarning: 3, // yellow cards
    homeworkWarning: 1, // red cards
};

export function analyzeStudent(student, year, term, settings = {}) {
    const cfg = { ...DEFAULTS, ...settings };

    // Extract performance for the specific year/term
    let gradesObj = student.performance;

    if (year && term) {
        gradesObj = student.performance?.[year]?.[term] || {};
    }

    const subjects = Object.keys(gradesObj);

    if (subjects.length === 0) return { average: 0, risks: [], strengths: [], riskLevel: 'Low', isAtRisk: false, behaviorFlags: [] };

    let totalNormalized = 0;
    const risks = [];
    const strengths = [];

    for (const sub of subjects) {
        const val = Number(gradesObj[sub]);
        if (isNaN(val)) continue;
        
        const range = STAT_RANGES[sub] || { min: 0, max: 100 };
        const span = (range.max - range.min) || 1;
        
        // Normalize the stat to a 0-100 score relative to its max capacity
        let normalized = ((val - range.min) / span) * 100;
        // Clamp it just in case
        normalized = Math.max(0, Math.min(100, isNaN(normalized) ? 0 : normalized));
        
        totalNormalized += normalized;

        if (normalized < cfg.failingGrade) {
            risks.push(sub);
        }
        if (normalized >= cfg.excellentGrade) {
            strengths.push(sub);
        }
    }

    const validSubjectCount = subjects.length || 1;
    const average = totalNormalized / validSubjectCount;

    // Behavioral data for this term
    const matchStats = student.matchStats?.[year]?.[term];
    const behaviorFlags = [];

    if (matchStats) {
        if (matchStats.gamesPlayed < cfg.attendanceWarning) behaviorFlags.push('Low Match Time');
        if (matchStats.yellowCards >= cfg.conductWarning) behaviorFlags.push('Disciplinary Risk');
        if (matchStats.redCards >= cfg.homeworkWarning) behaviorFlags.push('Suspension Risk');
    }

    // Dropout Risk Logic using configurable thresholds
    let riskLevel = 'Low';

    if (average < cfg.highRiskAverage || risks.length >= cfg.highRiskFailCount) {
        riskLevel = 'High';
    } else if (average < cfg.moderateRiskAverage || risks.length >= 2) {
        riskLevel = 'Moderate';
    }

    // Escalate risk if behavioral flags exist
    if (behaviorFlags.length >= 2 && riskLevel === 'Low') {
        riskLevel = 'Moderate';
    } else if (behaviorFlags.length >= 1 && riskLevel === 'Moderate') {
        riskLevel = 'High';
    }

    return {
        average: average.toFixed(1),
        riskLevel,
        risks,
        strengths,
        behaviorFlags,
        isAtRisk: riskLevel !== 'Low'
    };
}

export function analyzeClass(students, year, term, settings) {
    const analyzedStudents = students.map(s => analyzeStudent(s, year, term, settings));
    const atRiskCount = analyzedStudents.filter(s => s.isAtRisk).length;

    const validStudents = analyzedStudents.filter(s => parseFloat(s.average) > 0);
    const classAverage = validStudents.length > 0
        ? validStudents.reduce((sum, s) => sum + parseFloat(s.average), 0) / validStudents.length
        : 0;

    return {
        atRiskCount,
        classAverage: classAverage.toFixed(1),
        totalStudents: students.length
    };
}
