const fs = require('fs');
const files = [
    'ClusterTab.jsx',
    'CompareAndStemTab.jsx',
    'CsecReadinessTab.jsx',
    'DrawdownTab.jsx',
    'ElasticityTab.jsx',
    'MomentumTab.jsx',
    'TrendsTab.jsx',
    'ZScoreTab.jsx'
];

for (const f of files) {
    const path = 'src/components/hub/' + f;
    let content = fs.readFileSync(path, 'utf8');
    
    let original = content;
    // We want to replace ALL_STUDENTS followed by optional whitespace and a dot method
    // But ONLY if it's not preceded by : or ?
    content = content.replace(/(?<!:\s*|\?\s*)ALL_STUDENTS(\s*\.(?:filter|map|forEach|find|reduce))/g, "(selectedSchool === 'ALL' ? ALL_STUDENTS : ALL_STUDENTS.filter(s => s.schoolId === selectedSchool))$1");
    
    // For cases like `const activeStudents = ALL_STUDENTS`
    // And `for (const s of ALL_STUDENTS)` which was caught in my previous PS script but let's make sure
    
    if (original !== content) {
        fs.writeFileSync(path, content);
        console.log('Patched ' + f);
    } else {
        console.log('No changes needed for ' + f);
    }
}
