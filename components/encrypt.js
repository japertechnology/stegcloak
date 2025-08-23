"use strict";

/**
 * Implements symmetric encryption and decryption using AES-256-CTR along with
 * PBKDF2 based key derivation and optional HMAC integrity protection.  These
 * helpers are used by the main StegCloak module to secure the hidden payload.
 */

const aes = require("browserify-cipher");
const { createCipheriv, createDecipheriv } = aes;
const randomBytes = require("randombytes");
const pbkdf2Sync = require("pbkdf2").pbkdf2Sync;
const createHmac = require("create-hmac");
const { curry } = require("ramda");
const timeSafeCheck = require("timing-safe-equal");
const { toBuffer, concatBuff, buffSlice } = require("./util.js");

// Derive a 48 byte key from the password and salt using PBKDF2.  The first
// 16 bytes are used as the IV and the remaining 32 bytes as the AES key.
const _genKey = (password, salt) =>
  pbkdf2Sync(password, salt, 10000, 48, "sha512");

// AES stream cipher with random salt and IV.  Expects an object
// `{password, data, integrity}` and returns an encrypted Buffer.  When
// `integrity` is true, an HMAC of the plaintext is prepended to the output.
const encrypt = (config) => {
  // Impure function – generates random bytes for salt and IV.
  const salt = randomBytes(16);
  const { iv, key, secret } = _bootEncrypt(config, salt);
  const cipher = createCipheriv("aes-256-ctr", key, iv);
  const payload = concatBuff([cipher.update(secret, "utf8"), cipher.final()]);
  if (config.integrity) {
    const hmac = createHmac("sha256", key).update(secret).digest();
    return concatBuff([salt, hmac, payload]);
  }
  return concatBuff([salt, payload]);
};

// Reverse of `encrypt`. Validates HMAC when requested and returns the
// decrypted Buffer. Throws on integrity failure or malformed input.
const decrypt = (config) => {
  const { iv, key, secret, hmacData } = _bootDecrypt(config, null);
  const decipher = createDecipheriv("aes-256-ctr", key, iv);
  const decrypted = concatBuff([
    decipher.update(secret, "utf8"),
    decipher.final(),
  ]);
  if (config.integrity) {
    const vHmac = createHmac("sha256", key).update(decrypted).digest();
    if (!timeSafeCheck(hmacData, vHmac)) {
      throw new Error(
        "Wrong password or Wrong payload (Hmac Integrity failure) "
      );
    }
  }
  return decrypted;
};

// Extract parameters for encryption/decryption from the provided config.
// Handles parsing of salt, HMAC and ciphertext depending on the mode.
const _extract = (mode, config, salt) => {
  const data = toBuffer(config.data);
  const output = {};
  if (mode === "encrypt") {
    output.secret = data;
  } else if (mode === "decrypt") {
    if (data.length < 16) {
      throw new Error("Invalid payload: missing salt");
    }
    salt = buffSlice(data, 0, 16);
    if (config.integrity) {
      if (data.length < 48) {
        throw new Error("Invalid payload: missing HMAC");
      }
      output.hmacData = buffSlice(data, 16, 48);
      if (data.length <= 48) {
        throw new Error("Invalid payload: missing ciphertext");
      }
      output.secret = buffSlice(data, 48);
    } else {
      if (data.length <= 16) {
        throw new Error("Invalid payload: missing ciphertext");
      }
      output.secret = buffSlice(data, 16);
    }
  }

  const ivKey = _genKey(config.password, salt);
  output.iv = buffSlice(ivKey, 0, 16);
  output.key = buffSlice(ivKey, 16);
  return output;
};

// Curried helpers used internally by the public `encrypt`/`decrypt` APIs
// to partially apply the mode.
const _bootEncrypt = curry(_extract)("encrypt");

const _bootDecrypt = curry(_extract)("decrypt");

module.exports = {
  encrypt,
  decrypt,
};
