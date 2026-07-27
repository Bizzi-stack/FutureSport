const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /\battendance\b/g, replacement: 'gamesPlayed' },
    { regex: /\blateArrivals\b/g, replacement: 'minutesPlayed' },
    { regex: /\bconductIncidents\b/g, replacement: 'yellowCards' },
    { regex: /\bhomeworkCompletion\b/g, replacement: 'redCards' },
    { regex: /\bAttendance\b/g, replacement: 'Games Played' },
    { regex: /\bLate Arrivals\b/g, replacement: 'Minutes Played' },
    { regex: /\bConduct Incidents\b/g, replacement: 'Yellow Cards' },
    { regex: /\bHomework Completion\b/g, replacement: 'Red Cards' },
    { regex: /\bHomework %\b/g, replacement: 'Red Cards' },
    { regex: /\battendance %\b/gi, replacement: 'games played' },
    { regex: /\blate arrivals\b/gi, replacement: 'minutes played' },
    { regex: /\bconduct incidents\b/gi, replacement: 'yellow cards' },
    { regex: /\bhomework %\b/gi, replacement: 'red cards' },
    { regex: /\bBehavior\b/g, replacement: 'Match Stats' },
    { regex: /\bbehavior\b/g, replacement: 'matchStats' },
    { regex: /\bGrades\b/g, replacement: 'Performance' },
    { regex: /\bgrades\b/g, replacement: 'performance' },
];

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            replacements.forEach(({ regex, replacement }) => {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(directoryPath);
console.log('Behavior/Grades replacement complete.');
