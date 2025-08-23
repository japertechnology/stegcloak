// Validate the behaviour of the expand helper from zwcHuffMan
const assert = require('assert');
const StegCloak = require('../stegcloak.js');
const { zwcHuffMan } = require('../components/compact.js');

const zwc = StegCloak.zwc;
const { expand } = zwcHuffMan(zwc);

assert.strictEqual(expand(), undefined, 'expand should return undefined when input is missing');
assert.strictEqual(expand(''), '', 'expand should return empty string for empty input');
assert.strictEqual(expand(zwc[0]), '', 'expand should return empty string when data is missing after flag');
assert.throws(() => expand('x' + zwc[4]), /Unknown compression flag/, 'expand should throw when flag is invalid');

console.log('All tests passed.');

process.exit(0);
