const assert = require('assert');
const StegCloak = require('../stegcloak.js');

const stegcloak = new StegCloak();

assert.throws(
  () => {
    stegcloak.hide('secret message');
  },
  /non-empty string/i,
  'hide should throw when password is missing while encryption is enabled'
);

console.log('Hide missing password test passed');

process.exit(0);
