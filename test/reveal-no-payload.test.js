const assert = require('assert');
const StegCloak = require('../stegcloak.js');

const stegcloak = new StegCloak();

assert.throws(() => {
  stegcloak.reveal('nothing hidden here');
}, /Invisible stream not detected/, 'reveal should throw when no hidden payload is present');

console.log('Reveal without hidden payload test passed');

process.exit(0);
