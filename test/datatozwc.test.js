const assert = require('assert');
const StegCloak = require('../stegcloak.js');
const { zwcOperations } = require('../components/message.js');

const zwc = StegCloak.zwc;
const { toConceal } = zwcOperations(zwc);

assert.throws(
  () => toConceal('1'),
  /Binary string length must be even/,
  'toConceal should reject odd-length binary input'
);

console.log('Odd-length binary input rejection test passed');

process.exit(0);
