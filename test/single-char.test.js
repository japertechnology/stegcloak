// Verify that shrink/expand handle a single character without out-of-bounds access
const assert = require('assert');
const StegCloak = require('../stegcloak.js');
const { zwcHuffMan } = require('../components/compact.js');

const zwc = StegCloak.zwc;
const { shrink, expand } = zwcHuffMan(zwc);

const secret = zwc[0];
const compressed = shrink(secret);
const decompressed = expand(compressed);

assert.strictEqual(
  decompressed,
  secret,
  'Single-character strings should round-trip'
);

console.log('Single-character test passed.');

process.exit(0);
