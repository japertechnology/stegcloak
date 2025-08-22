const assert = require('assert');
const StegCloak = require('../stegcloak.js');
const { zwcOperations } = require('../components/message.js');

const zwc = StegCloak.zwc;
const { detach } = zwcOperations(zwc);

// Ensure detach returns the first hidden segment when multiple are present
const first = zwc[0] + zwc[1];
const second = zwc[2] + zwc[3];

const covers = [
  `hello ${first}world ${second}again`,
  `hello\t${first}world\t${second}again`,
  `hello\n${first}world\n${second}again`,
  `hello \t\n${first}world  \n\t${second}again`,
];

covers.forEach((cover, idx) => {
  assert.strictEqual(
    detach(cover),
    first,
    `detach should return the first hidden segment for case ${idx + 1}`
  );
});

console.log('All tests passed.');

process.exit(0);

