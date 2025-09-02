// Ensure encrypt throws when password is missing or empty
const assert = require('assert');
const { encrypt } = require('../components/encrypt.js');

const data = Buffer.from('secret');

assert.throws(
  () => encrypt({ password: '', data }),
  /non-empty string/i,
  'encrypt should throw when password is empty'
);

assert.throws(
  () => encrypt({ data }),
  /non-empty string/i,
  'encrypt should throw when password is missing'
);

console.log('Encrypt invalid password test passed');
process.exit(0);
