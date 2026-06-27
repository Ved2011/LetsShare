const fs = require('fs');
const content = fs.readFileSync('./V2.0/public_mobile/sidebar.js', 'utf8');

let braceCount = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let inString = false;
    let stringChar = '';
    for(let j=0; j<line.length; j++) {
        const char = line[j];
        if (inString) {
             if (char === stringChar && line[j-1] !== '\\') inString = false;
             continue;
        }
        if (char === "'" || char === '"' || char === "`") {
             inString = true;
             stringChar = char;
             continue;
        }
        if (line.substring(j, j+2) === '//') break;
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
    }
    if (braceCount < 0) {
       console.log('Negative brace count at line', i+1);
       console.log('Line content:', line);
       braceCount = 0; // reset to keep finding others
    }
}
console.log('Final brace count:', braceCount);
