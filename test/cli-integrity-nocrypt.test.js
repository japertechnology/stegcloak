// Ensure CLI rejects --integrity when used with --nocrypt
const assert = require('assert');
const path = require('path');

const originalExit = process.exit;
const originalArgv = process.argv;
let exitCode = null;

process.exit = (code) => {
  exitCode = code;
  throw new Error('exit');
};

process.argv = ['node', path.join(__dirname, '../cli.js'), 'hide', 'secret', 'hello world', '--nocrypt', '--integrity'];

try {
  require('../cli.js');
} catch (e) {
  if (e.message !== 'exit') throw e;
}

process.exit = originalExit;
process.argv = originalArgv;

assert.strictEqual(exitCode, 1, 'CLI did not exit with code 1 when --integrity used with --nocrypt');
console.log('CLI integrity+nocrypt test passed');
process.exit(0);
