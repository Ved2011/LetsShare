const { parse } = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('./Vnmo/public/sidebar.js', 'utf8');
try {
  parse(code, { ecmaVersion: 2020 });
  console.log("Syntax is OK!");
} catch (e) {
  console.log(e.message);
  // Just add a brace and try again
  for(let i = code.length - 1; i >= 0; i--) {
     const testCode = code.slice(0, i) + '}' + code.slice(i);
     try {
       parse(testCode, { ecmaVersion: 2020 });
       console.log("Missing brace can be fixed by inserting '}' at index", i);
       break;
     } catch(e2) {}
  }
}
