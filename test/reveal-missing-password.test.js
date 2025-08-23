// Ensure reveal warns when password is omitted for encrypted payloads
const assert = require('assert');
const StegCloak = require('../stegcloak.js');

const stegcloak = new StegCloak();

const secret = stegcloak.hide('secret message', 'p@ssw0rd', 'hello world');

assert.throws(
  () => {
    stegcloak.reveal(secret);
  },
  /Password must be provided/i,
  'reveal should throw when password is missing for encrypted content'
);

console.log('Reveal missing password test passed');

process.exit(0);
