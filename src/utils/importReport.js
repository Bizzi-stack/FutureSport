/**
 * CSV Import Engine for Merit Grid
 * 
 * Supports two CSV formats:
 * 1. Merit Grid Export format (with metadata rows at top)
 * 2. Simple format: Student Name, Subject1, Subject2, ..., Games Played %, Minutes Played, Yellow Cards, Homework %
 * 
 * Returns parsed student data that can be merged into the app state.
 */

/**
 * Parse a raw CSV string into a 2D array of cells.
 * Handles quoted fields with commas and escaped quotes.
 */
function parseCsvString(raw) {
    const rows = [];
    let current = '';
    let inQuotes = false;
    let row = [];

    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const next = raw[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                current += '"';
                i++; // skip escaped quote
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(current.trim());
                current = '';
            } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
                row.push(current.trim());
                current = '';
                if (row.some(cell => cell !== '')) rows.push(row);
                row = [];
                if (ch === '\r') i++; // skip \n in \r\n
            } else {
                current += ch;
            }
        }
    }
    // Push last row
    row.push(current.trim());
    if (row.some(cell => cell !== '')) rows.push(row);

    return rows;
}

/**
 * Known matchStats columns in Merit Grid export format
 */
const BEHAVIOR_HEADERS = ['games played', 'minutes played', 'yellow cards', 'red cards', 'team status'];
const SKIP_COLUMNS = ['first name', 'last name', 'age group', 'average', 'risk level', 'failing subjects', 'behavior flags', 'team status'];

/**
 * Detect and parse a Football Data CSV.
 * 
 * @param {string} csvText - Raw CSV text content
 * @returns {{ students: Array, subjects: string[], year: string|null, term: string|null, className: string|null, errors: string[] }}
 */
export function parseImportCsv(csvText) {
    const errors = [];
    const rows = parseCsvString(csvText);

    if (rows.length < 2) {
        return { students: [], subjects: [], year: null, term: null, className: null, errors: ['CSV file is empty or has no data rows.'] };
    }

    // Find header row (looks for "Player #" or "Full Name")
    let headerRowIndex = 0;
    let headerRow = null;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const lower = rows[i].map(h => h.toLowerCase().trim());
        if (lower.includes('player #') || lower.includes('full name')) {
            headerRow = rows[i];
            headerRowIndex = i;
            break;
        }
    }

    if (!headerRow) {
        headerRow = rows[0];
        errors.push('Could not detect a standard header row. Assuming row 1 is headers.');
    }

    const headers = headerRow.map(h => h.trim());
    const headersLower = headers.map(h => h.toLowerCase());

    // Identify key columns
    let idCol = headersLower.indexOf('player #');
    let nameCol = headersLower.indexOf('full name');
    if (nameCol === -1) nameCol = headersLower.indexOf('name');

    if (nameCol === -1 && idCol === -1) {
        errors.push('No "Full Name" or "Player #" column detected.');
    }

    // Identify subjects (performance) and matchStats
    const subjectIndices = [];
    const subjects = [];
    const matchStatsIndices = {};

    for (let i = 0; i < headers.length; i++) {
        if (i === nameCol || i === idCol) continue;
        const lower = headersLower[i];
        if (SKIP_COLUMNS.includes(lower)) continue;

        if (lower === 'games played' || lower === 'games played %') {
            matchStatsIndices.gamesPlayed = i;
        } else if (lower === 'minutes played') {
            matchStatsIndices.minutesPlayed = i;
        } else if (lower === 'yellow cards') {
            matchStatsIndices.yellowCards = i;
        } else if (lower === 'red cards') {
            matchStatsIndices.redCards = i;
        } else if (headers[i]) {
            // Treat as a performance metric
            subjectIndices.push(i);
            subjects.push(headers[i]);
        }
    }

    // Parse data rows
    const students = [];
    let fallbackIdCounter = 9000;

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (row.length === 0 || row.every(c => !c.trim())) continue;

        let rawId = idCol !== -1 ? row[idCol]?.trim() : '';
        let name = nameCol !== -1 ? row[nameCol]?.trim() : '';

        // If no name but has ID, or no ID but has name, we keep it. If both empty, skip.
        if (!name && !rawId) continue;

        let id = parseInt(rawId, 10);
        if (isNaN(id)) {
            // Auto-generate an ID if Player # is blank
            id = fallbackIdCounter++;
        }

        if (!name) name = `Player #${id}`;

        const performance = {};
        for (let si = 0; si < subjectIndices.length; si++) {
            const val = parseFloat(row[subjectIndices[si]]);
            if (!isNaN(val)) {
                performance[subjects[si]] = val; // Store raw value for football stats, no 0-100 clamp
            }
        }

        const matchStats = {};
        if (matchStatsIndices.gamesPlayed !== undefined) {
            const v = parseFloat(row[matchStatsIndices.gamesPlayed]);
            if (!isNaN(v)) matchStats.gamesPlayed = v;
        }
        if (matchStatsIndices.minutesPlayed !== undefined) {
            const v = parseInt(row[matchStatsIndices.minutesPlayed]);
            if (!isNaN(v)) matchStats.minutesPlayed = v;
        }
        if (matchStatsIndices.yellowCards !== undefined) {
            const v = parseInt(row[matchStatsIndices.yellowCards]);
            if (!isNaN(v)) matchStats.yellowCards = v;
        }
        if (matchStatsIndices.redCards !== undefined) {
            const v = parseFloat(row[matchStatsIndices.redCards]);
            if (!isNaN(v)) matchStats.redCards = v;
        }

        students.push({
            id,
            name,
            performance,
            matchStats,
        });
    }

    if (students.length === 0) {
        errors.push('No valid student data rows found in the CSV.');
    }

    return {
        students,
        subjects,
        year: null,
        term: null,
        className: null,
        errors,
    };
}
