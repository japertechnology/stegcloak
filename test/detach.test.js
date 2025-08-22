const assert = require('assert');
const StegCloak = require('../stegcloak.js');
const { zwcOperations } = require('../components/message.js');

const zwc = StegCloak.zwc;
const { detach } = zwcOperations(zwc);

// Ensure detach returns the first hidden segment when multiple are present
const first = zwc[0] + zwc[1];
const second = zwc[2] + zwc[3];
const cover = `hello ${first}world ${second}again`;

assert.strictEqual(detach(cover), first, 'detach should return the first hidden segment');

console.log('All tests passed.');
