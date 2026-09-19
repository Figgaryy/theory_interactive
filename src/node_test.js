// Run core scripts (no DOM) in Node and execute FA.runTests()
const fs = require('fs'), path = require('path');
const dir = __dirname;
const strip = (f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
const src = ['10_model.js', '20_algorithms.js', '30_regex.js', '70_presets.js', '76_exam_ui.js', '80_tests.js'].map(strip).join('\n');
const vm = require('vm');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(src + '\n;globalThis.__r = FA.runTests();', ctx);
console.log(ctx.__r.text);
process.exit(ctx.__r.fail ? 1 : 0);
