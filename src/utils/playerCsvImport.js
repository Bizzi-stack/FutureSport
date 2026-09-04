import { generatePlayerId } from './playerUtils';

/**
 * Parses raw CSV text into an array of rows (handling quotes and commas)
 */
export function parseRawCsv(csvText) {
    const rows = [];
    let current = '';
    let inQuotes = false;
    let row = [];

    for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        const next = csvText[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                current += '"';
                i++;
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
                if (ch === '\r') i++;
            } else {
                current += ch;
            }
        }
    }
    row.push(current.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
    return rows;
}

/**
 * Normalizes header string
 */
function cleanHeader(h) {
    return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parses a Coach/Admin Player Roster CSV file
 * Supported headers:
 * - First Name, Last Name (or Full Name / Name)
 * - Squad Number / Kit Number / Jersey Number / Number / No
 * - Age (or DOB / Date of Birth)
 * - Gender
 * - Position (optional)
 * - Club / Team / School (optional)
 */
export function parsePlayerRosterCsv(csvText, options = {}) {
    const {
        existingPlayers = [],
        targetSchoolId = null,
        targetTeamId = null,
        targetYear = '2026-2027',
        isPmc = true
    } = options;

    const rows = parseRawCsv(csvText);
    const errors = [];
    const warnings = [];

    if (rows.length < 2) {
        return {
            validPlayers: [],
            clashes: [],
            errors: ['The CSV file is empty or missing player data rows.'],
            warnings: []
        };
    }

    // Find header row
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const cleaned = rows[i].map(cleanHeader);
        if (
            cleaned.includes('firstname') || 
            cleaned.includes('fullname') || 
            cleaned.includes('name') || 
            cleaned.includes('squadnumber') || 
            cleaned.includes('kitnumber') || 
            cleaned.includes('jerseynumber')
        ) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        headerRowIdx = 0;
        warnings.push('Could not detect standard header names. Using row 1 as column headers.');
    }

    const headers = rows[headerRowIdx];
    const cleanedHeaders = headers.map(cleanHeader);

    // Identify column mappings
    let firstNameCol = cleanedHeaders.findIndex(h => h === 'firstname' || h === 'first');
    let lastNameCol = cleanedHeaders.findIndex(h => h === 'lastname' || h === 'last' || h === 'surname');
    let fullNameCol = cleanedHeaders.findIndex(h => h === 'fullname' || h === 'playername' || h === 'name' || h === 'player');
    
    let kitCol = cleanedHeaders.findIndex(h => 
        h === 'squadnumber' || h === 'kitnumber' || h === 'jerseynumber' || 
        h === 'squadno' || h === 'kitno' || h === 'number' || h === 'no' || h === 'jersey' || h === 'kit'
    );

    let ageCol = cleanedHeaders.findIndex(h => h === 'age' || h === 'playerage');
    let dobCol = cleanedHeaders.findIndex(h => h === 'dob' || h === 'dateofbirth' || h === 'birthdate');
    let genderCol = cleanedHeaders.findIndex(h => h === 'gender' || h === 'sex');
    let positionCol = cleanedHeaders.findIndex(h => h === 'position' || h === 'pos' || h === 'role');
    let teamCol = cleanedHeaders.findIndex(h => h === 'team' || h === 'club' || h === 'school');

    if (firstNameCol === -1 && fullNameCol === -1) {
        errors.push('Required column missing: Please provide "First Name" (and "Last Name") or "Full Name".');
    }
    if (kitCol === -1) {
        warnings.push('No "Squad Number" / "Kit Number" column detected. Kit numbers will be sequentially assigned.');
    }

    const existingPids = new Set(existingPlayers.map(p => String(p.playerId || p.id)));
    const existingKitNumbers = new Set(
        existingPlayers
            .filter(p => !targetSchoolId || p.schoolId === targetSchoolId)
            .map(p => Number(p.jerseyNumber))
            .filter(n => !isNaN(n) && n > 0)
    );

    const maxNumericId = existingPlayers.reduce((max, p) => {
        const n = Number(p.id);
        return (!isNaN(n) && n > max) ? n : max;
    }, 9000);

    const validPlayers = [];
    const usedKitNumbersInBatch = new Map(); // kitNumber -> count
    const kitClashes = [];

    let currentIdSeq = maxNumericId + 1;

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every(c => !c.trim())) continue;

        // Build Name
        let name = '';
        let firstName = '';
        let lastName = '';

        if (firstNameCol !== -1) {
            firstName = (row[firstNameCol] || '').trim();
            lastName = lastNameCol !== -1 ? (row[lastNameCol] || '').trim() : '';
            name = `${firstName} ${lastName}`.trim();
        } else if (fullNameCol !== -1) {
            name = (row[fullNameCol] || '').trim();
            const parts = name.split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        }

        if (!name) continue; // Skip empty row

        // Squad / Kit Number
        let kitNumber = null;
        if (kitCol !== -1 && row[kitCol]) {
            const parsedKit = parseInt(row[kitCol].replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedKit) && parsedKit > 0 && parsedKit <= 99) {
                kitNumber = parsedKit;
            }
        }

        // Detect kit clashes
        if (kitNumber !== null) {
            if (usedKitNumbersInBatch.has(kitNumber)) {
                kitClashes.push({
                    kitNumber,
                    playerName: name,
                    reason: `Kit #${kitNumber} is duplicated within this CSV batch.`
                });
            } else if (existingKitNumbers.has(kitNumber)) {
                kitClashes.push({
                    kitNumber,
                    playerName: name,
                    reason: `Kit #${kitNumber} clashes with an existing registered player in this team.`
                });
            }
            usedKitNumbersInBatch.set(kitNumber, (usedKitNumbersInBatch.get(kitNumber) || 0) + 1);
        }

        // Age & DOB calculation
        let age = 18;
        let dob = '2008-01-01';
        if (ageCol !== -1 && row[ageCol]) {
            const parsedAge = parseInt(row[ageCol].replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedAge) && parsedAge >= 10 && parsedAge <= 50) {
                age = parsedAge;
                const birthYear = 2026 - age;
                dob = `${birthYear}-01-01`;
            }
        } else if (dobCol !== -1 && row[dobCol]) {
            dob = row[dobCol].trim();
            const yearMatch = dob.match(/(19|20)\d{2}/);
            if (yearMatch) {
                age = 2026 - parseInt(yearMatch[0], 10);
            }
        }

        // Gender Normalization
        let rawGender = genderCol !== -1 ? (row[genderCol] || '').trim().toLowerCase() : 'boy';
        let gender = 'Boy';
        if (rawGender.startsWith('g') || rawGender.startsWith('f') || rawGender.includes('girl') || rawGender.includes('female')) {
            gender = 'Girl';
        }

        // Position Normalization
        let position = 'Midfielder';
        if (positionCol !== -1 && row[positionCol]) {
            const posClean = row[positionCol].trim().toLowerCase();
            if (posClean.includes('goal') || posClean.includes('gk') || posClean === 'keeper') position = 'Goalkeeper';
            else if (posClean.includes('def') || posClean.includes('cb') || posClean.includes('back') || posClean.includes('rb') || posClean.includes('lb')) position = 'Defender';
            else if (posClean.includes('for') || posClean.includes('str') || posClean.includes('fwd') || posClean.includes('att') || posClean.includes('wing')) position = 'Forward';
            else position = 'Midfielder';
        }

        // Generate guaranteed unique Player ID
        let prefix = isPmc ? 'PID-PMC' : 'PID-2026';
        let pidNum = currentIdSeq;
        let generatedPid = `${prefix}-${String(pidNum).padStart(5, '0')}`;
        while (existingPids.has(generatedPid)) {
            pidNum++;
            generatedPid = `${prefix}-${String(pidNum).padStart(5, '0')}`;
        }
        existingPids.add(generatedPid);

        const newPlayer = {
            id: currentIdSeq,
            playerId: generatedPid,
            name,
            firstName,
            lastName,
            jerseyNumber: kitNumber,
            age,
            dob,
            gender,
            position,
            preferredFoot: 'Right',
            schoolId: targetSchoolId || (teamCol !== -1 ? (row[teamCol] || '').trim() : 'pmc-club-weymouth-wales'),
            teamAssignments: { [targetYear]: targetTeamId || targetSchoolId || 'pmc-club-weymouth-wales' },
            performance: {},
            matchStats: {},
            documents: {
                birthCertificate: true,
                schoolEnrollment: true
            },
            status: 'approved',
            registeredVia: 'csv_upload',
            registeredAt: new Date().toISOString()
        };

        validPlayers.push(newPlayer);
        currentIdSeq++;
    }

    // If some players lacked kit numbers, auto-fill them without clashes
    let nextAvailableKit = 2;
    validPlayers.forEach(p => {
        if (p.jerseyNumber === null) {
            while (usedKitNumbersInBatch.has(nextAvailableKit) || existingKitNumbers.has(nextAvailableKit)) {
                nextAvailableKit++;
            }
            p.jerseyNumber = nextAvailableKit;
            usedKitNumbersInBatch.set(nextAvailableKit, 1);
            nextAvailableKit++;
        }
    });

    return {
        validPlayers,
        clashes: kitClashes,
        errors,
        warnings
    };
}

/**
 * Returns a standardized CSV template string ready for coaches/admins to fill out
 */
export function generatePlayerCsvTemplate() {
    return `First Name,Last Name,Squad Number,Age,Gender,Position
Tariq,Barker,9,18,Boy,Forward
Kevon,Alleyne,10,19,Boy,Midfielder
Jamar,Brathwaite,1,18,Boy,Goalkeeper
Tyrell,Downes,4,17,Boy,Defender
Rashad,Small,7,18,Boy,Forward
Sheran,Mayers,6,19,Boy,Midfielder
Devonte,Yearwood,11,18,Boy,Forward
Nathan,Forde,3,17,Boy,Defender
Dominic,Best,8,18,Boy,Midfielder
Zico,Edmee,2,19,Boy,Defender
Romario,Harewood,5,18,Boy,Defender`;
}

/**
 * Triggers a direct browser download of the CSV template
 */
export function downloadPlayerCsvTemplate(teamName = 'Team') {
    const csvContent = generatePlayerCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTeam = String(teamName).replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `pmc_player_roster_template_${cleanTeam}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
