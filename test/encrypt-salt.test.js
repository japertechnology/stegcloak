const assert = require('assert');
const { encrypt, decrypt } = require('../components/encrypt.js');

const password = 'p@ssw0rd';
const secret = 'top secret';

const payload = encrypt({ password, data: secret, integrity: true });

assert.strictEqual(payload.slice(0, 16).length, 16, 'salt should be 16 bytes');

const revealed = decrypt({ password, data: payload, integrity: true });
assert.strictEqual(revealed.toString(), secret, 'decrypt should return original secret');

assert.throws(
  () => decrypt({ password, data: Buffer.alloc(15), integrity: true }),
  /Invalid payload: missing salt/,
  'decrypt should require a 16-byte salt'
);

console.log('Encryption/decryption with 16-byte salt test passed');
process.exit(0);
