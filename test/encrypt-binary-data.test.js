// Verify encrypt/decrypt functions handle arbitrary binary data
const assert = require('assert')
const { encrypt, decrypt } = require('../components/encrypt.js')

const password = 'p@ssw0rd'
const secret = Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x01, 0x02])

const payload = encrypt({ password, data: secret, integrity: true })
const revealed = decrypt({ password, data: payload, integrity: true })

assert(secret.equals(revealed), 'binary data should round-trip through encrypt/decrypt')

console.log('Binary data encryption/decryption test passed')
process.exit(0)
