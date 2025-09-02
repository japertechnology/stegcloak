// Ensure decrypt throws when password is missing or empty
const assert = require('assert');
const { encrypt, decrypt } = require('../components/encrypt.js');

const password = 'p@ssw0rd';
const data = Buffer.from('secret');
const payload = encrypt({ password, data, integrity: false });

assert.throws(
  () => decrypt({ password: '', data: payload, integrity: false }),
  /non-empty string/i,
  'decrypt should throw when password is empty'
);

assert.throws(
  () => decrypt({ data: payload, integrity: false }),
  /non-empty string/i,
  'decrypt should throw when password is missing'
);

console.log('Decrypt invalid password test passed');
process.exit(0);
