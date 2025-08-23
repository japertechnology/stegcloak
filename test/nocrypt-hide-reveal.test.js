const assert = require('assert');
const StegCloak = require('../stegcloak.js');

const stegcloak = new StegCloak(false); // disable encryption
const message = 'secret message';
const cover = 'hello world again';

const hidden = stegcloak.hide(message, '', cover);
const revealed = stegcloak.reveal(hidden);

assert.strictEqual(revealed, message, 'reveal should return original message when encryption is disabled');

console.log('NoCrypt hide/reveal test passed');

process.exit(0);
