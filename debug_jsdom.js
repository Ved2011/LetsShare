const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('./Vnmo/public/user_Dashboard.html', 'utf8');
const sidebarJs = fs.readFileSync('./Vnmo/public/sidebar.js', 'utf8');

const dom = new JSDOM(html, {
    url: "http://localhost:8085/user_Dashboard.html",
    runScripts: "dangerously"
});

const window = dom.window;
const document = window.document;

// Mock some things
window.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
window.matchMedia = () => ({ matches: false });
window.innerWidth = 1200; // Desktop

try {
    window.eval(sidebarJs);
} catch (e) {
    console.log("EVAL ERROR:", e.message, e.stack);
}
