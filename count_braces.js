const fs = require('fs');
const content = fs.readFileSync('./Vnmo/public/sidebar.js', 'utf8');

let braceCount = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Very naive, ignores comments and strings. Let's do a better parser if needed.
    // Better:
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inRegex = false;
    for(let j=0; j<line.length; j++) {
        const char = line[j];
        if (inString) {
             if (char === stringChar && line[j-1] !== '\\') inString = false;
             continue;
        }
        if (line.substring(j, j+2) === '//') break;
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
    }
    if (braceCount < 0) {
       console.log('Negative brace count at line', i+1);
       braceCount = 0;
    }
}
console.log('Final brace count:', braceCount);
