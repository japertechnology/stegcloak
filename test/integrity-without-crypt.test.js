// Verify that integrity cannot be enabled when encryption is disabled
const assert = require('assert');
const StegCloak = require('../stegcloak.js');

const stegcloak = new StegCloak(false, true); // encryption disabled, integrity enabled

assert.throws(
  () => {
    stegcloak.hide('secret message', '', 'hello world');
  },
  /Integrity checks require encryption/i,
  'hide should throw when integrity is enabled without encryption'
);

console.log('Integrity without encryption test passed');
process.exit(0);
