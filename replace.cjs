const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /\bClassroom\b/g, replacement: 'Team' },
    { regex: /\bclassroom\b/g, replacement: 'team' },
    { regex: /\bCLASSROOMS\b/g, replacement: 'TEAMS' },
    { regex: /\bCLASSROOM\b/g, replacement: 'TEAM' },
    { regex: /\bYear group\b/g, replacement: 'Age group' },
    { regex: /\bYear Group\b/g, replacement: 'Age Group' },
    { regex: /\byear group\b/g, replacement: 'age group' },
    { regex: /\bForm 1\b/g, replacement: 'U14' },
    { regex: /\bForm 2\b/g, replacement: 'U15' },
    { regex: /\bForm 3\b/g, replacement: 'U16' },
    { regex: /\bForm 4\b/g, replacement: 'U17' },
    { regex: /\bForm 5\b/g, replacement: 'U19' },
    { regex: /\bclassAssignments\b/g, replacement: 'teamAssignments' },
    { regex: /\bGRADE_GROUPS\b/g, replacement: 'AGE_GROUPS' },
    { regex: /\bClass Report\b/g, replacement: 'Team Report' },
    { regex: /\bgetClassStudents\b/g, replacement: 'getTeamStudents' },
    { regex: /-class-/g, replacement: '-team-' },
    { regex: /\bClass (\d)([a-zA-Z])\b/g, replacement: (match, num, sec) => {
        const uMap = { '1': 'U14', '2': 'U15', '3': 'U16', '4': 'U17', '5': 'U19' };
        return `${uMap[num] || 'U'} ${sec}`;
    }}
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

            if (/\bcls\b/g.test(content)) {
                content = content.replace(/\bcls\b/g, 'teamObj');
                modified = true;
            }
            if (/\bclassroomId\b/g.test(content)) {
                content = content.replace(/\bclassroomId\b/g, 'teamId');
                modified = true;
            }
            if (/\bclassroomName\b/g.test(content)) {
                content = content.replace(/\bclassroomName\b/g, 'teamName');
                modified = true;
            }
            if (/\bactiveClassrooms\b/g.test(content)) {
                content = content.replace(/\bactiveClassrooms\b/g, 'activeTeams');
                modified = true;
            }
            if (/\bclassId\b/g.test(content)) {
                content = content.replace(/\bclassId\b/g, 'teamId');
                modified = true;
            }

            // specific for mockData.js
            if (fullPath.endsWith('mockData.js')) {
                 if (content.includes("classes: []")) {
                     content = content.replace(/classes: \[\]/g, "teams: []");
                     modified = true;
                 }
                 if (content.includes("gr.classes.push")) {
                     content = content.replace(/gr\.classes\.push/g, "gr.teams.push");
                     modified = true;
                 }
                 if (content.includes("grade: '")) {
                     content = content.replace(/grade: '/g, "ageGroup: '");
                     modified = true;
                 }
                 if (content.includes("gradeNum: ")) {
                     content = content.replace(/gradeNum: /g, "groupNum: ");
                     modified = true;
                 }
                 // for createCohort profile
                 if (content.includes("grade: `Form")) {
                     // will have been changed by Form replacement, but just in case
                     content = content.replace(/grade: `U/g, "ageGroup: `U");
                     modified = true;
                 }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(directoryPath);
console.log('Replacement complete.');
