const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /(?<!["'])Games Played:/g, replacement: '"Games Played":' },
    { regex: /(?<!["'])Minutes Played:/g, replacement: '"Minutes Played":' },
    { regex: /(?<!["'])Yellow Cards:/g, replacement: '"Yellow Cards":' },
    { regex: /(?<!["'])Red Cards:/g, replacement: '"Red Cards":' },
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
console.log('Quote fix complete.');
