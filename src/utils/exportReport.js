import { analyzeStudent } from './analysis';

/**
 * Escapes a CSV field value — wraps in quotes if it contains commas, quotes, or newlines.
 */
function escapeCsv(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Exports a class report as a CSV file download.
 *
 * @param {Array} students - Array of student objects with performance and matchStats
 * @param {string[]} subjects - List of subject names
 * @param {string} year - Selected academic year (e.g. '2024-2025')
 * @param {string} term - Selected term (e.g. 'Term 1')
 * @param {string} teamName - Display name of the team (e.g. 'U14 A')
 * @param {object} settings - Analysis settings (thresholds)
 */
export function exportClassReport(students, subjects, year, term, teamName, settings) {
    if (!students || students.length === 0) {
        alert('No student data to export.');
        return;
    }

    // --- Build header row ---
    const headers = [
        'Student Name',
        ...subjects,
        'Average',
        'Risk Level',
        'Failing Subjects',
        'Games Played %',
        'Minutes Played',
        'Yellow Cards',
        'Homework %',
        'Match Stats Flags',
    ];

    // --- Build data rows ---
    const rows = students.map((student) => {
        const analysis = analyzeStudent(student, year, term, settings);
        const termGrades = student.performance?.[year]?.[term] || {};
        const matchStats = student.matchStats?.[year]?.[term] || {};

        return [
            student.name,
            ...subjects.map((sub) => termGrades[sub] ?? ''),
            analysis.average,
            analysis.riskLevel,
            analysis.risks.join('; ') || 'None',
            matchStats.gamesPlayed ?? '',
            matchStats.minutesPlayed ?? '',
            matchStats.yellowCards ?? '',
            matchStats.redCards ?? '',
            analysis.behaviorFlags.join('; ') || 'None',
        ];
    });

    // --- Metadata rows at the top ---
    const meta = [
        [`Team Report: ${teamName || 'Unknown'}`],
        [`Academic Year: ${year}`, `Term: ${term}`],
        [`Total Students: ${students.length}`, `Generated: ${new Date().toLocaleString()}`],
        [], // blank separator row
    ];

    // --- Assemble CSV string ---
    const allRows = [
        ...meta.map((row) => row.map(escapeCsv).join(',')),
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
    ];

    const csvContent = allRows.join('\r\n');

    // --- Trigger download ---
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeName = (teamName || 'Report').replace(/\s+/g, '_');
    link.href = url;
    link.download = `${safeName}_${year}_${term.replace(/\s+/g, '')}_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
