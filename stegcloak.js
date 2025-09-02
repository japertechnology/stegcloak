"use strict";

/**
 * Main StegCloak module.
 *
 * This file wires together all sub-components responsible for compression,
 * encryption and zero width character manipulation in order to hide and reveal
 * messages.  The implementation remains unchanged; only documentation has been
 * enhanced for clarity and maintenance.
 */

const R = require("ramda");

// Crypto utilities responsible for encrypting and decrypting payloads
const { encrypt, decrypt } = require("./components/encrypt");

// Compression helpers and zero width Huffman utilities
const { compress, decompress, zwcHuffMan } = require("./components/compact");

// Message level operations such as embedding and extracting zero width data
const { zwcOperations, embed } = require("./components/message");

// Zero width characters used for steganography.
// 200c,200d,2061,2062,2063,2064 – this is where the magic happens!
const zwc = ["‌", "‍", "⁡", "⁢", "⁣", "⁤"]; // 200c,200d,2061,2062,2063,2064

const { toConceal, toConcealHmac, concealToData, noCrypt, detach } =
  zwcOperations(zwc);

const { shrink, expand } = zwcHuffMan(zwc);

const { byteToBin, compliment } = require("./components/util");

/**
 * StegCloak orchestrates the hiding and revealing of messages.
 *
 * @class
 * @param {boolean} [_encrypt=true]   Whether payloads should be encrypted.
 * @param {boolean} [_integrity=false] Whether HMAC integrity protection is applied.
 */
class StegCloak {
  constructor(_encrypt = true, _integrity = false) {
    // By default encryption is enabled and integrity (HMAC) disabled
    this.encrypt = _encrypt;

    // Whether an HMAC should be generated and verified
    this.integrity = _integrity;
  }

  static get zwc() {
    return zwc;
  }

  /**
   * Conceal a message within the provided cover text.
   *
   * @param {string} message   Text that should be hidden.
   * @param {string} password  Password used for optional encryption.
   * @param {string} [cover="This is a confidential text"] Visible text used to embed the secret.
   * @returns {string} Cover text with invisible payload embedded.
   * @throws {Error} If cover text is too short or password is invalid when encryption is enabled.
   */
  hide(message, password, cover = "This is a confidential text") {
    cover = cover.trim();
    const tokens = cover.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) {
      throw new Error("Minimum two words required");
    }

    const integrity = this.integrity;

    const crypt = this.encrypt;

    if (crypt && (typeof password !== "string" || password.length === 0)) {
      throw new Error(
        "Password must be a non-empty string when encryption is enabled"
      );
    }

    const secret = R.pipe(compress, compliment)(message); // Compress and compliment to prepare the secret

    const payload = crypt
      ? encrypt({
          password: password,
          data: secret,
          integrity,
        })
      : secret; // Encrypt if needed or proxy secret

    const invisibleStream = R.pipe(
      byteToBin,
      integrity && crypt ? toConcealHmac : crypt ? toConceal : noCrypt,
      shrink
    )(payload); // Create an optimal invisible stream of secret

    return embed(cover, invisibleStream); // Embed stream  with cover text
  }

  /**
   * Extract a hidden message from text produced by {@link hide}.
   *
   * @param {string} secret   Cover text containing the invisible payload.
   * @param {string} password Password if encryption/integrity were enabled.
   * @returns {string} Revealed secret message.
   * @throws {Error} If the message cannot be revealed or a required password is missing.
   */
  reveal(secret, password) {
    // Detach invisible characters from the cover and recover the binary stream.
    // Also returns analysis of whether encryption or an integrity check was performed.

    let data, integrity, encrypt;
    try {
      ({ data, integrity, encrypt } = R.pipe(
        detach,
        expand,
        concealToData
      )(secret));
    } catch (err) {
      throw new Error(`Failed to reveal message: ${err.message}`);
    }

    if (encrypt && (typeof password !== "string" || password.length === 0)) {
      throw new Error("Password must be provided to reveal this message");
    }

    const decryptStream = encrypt
      ? decrypt({
          password,
          data,
          integrity,
        })
      : data; // Decrypt if needed or proxy secret

    return R.pipe(compliment, decompress)(decryptStream); // Receive the secret
  }
}

module.exports = StegCloak;
