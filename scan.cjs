const fs = require('fs');
const dir = 'src/components/hub';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
for (const f of files) {
    const c = fs.readFileSync(dir + '/' + f, 'utf8');
    const re = /SectionHeader\s+title=["'{]([^"'}]+)/g;
    let m;
    const titles = [];
    while ((m = re.exec(c)) !== null) titles.push(m[1]);
    // Also find KPI labels
    const kpiRe = /(?:fontSize.*?fontWeight.*?marginBottom.*?>|title=")([A-Z][^<"]+)/g;
    if (titles.length) console.log(f + ': ' + titles.join(' | '));
}
