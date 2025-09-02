"use strict";

/**
 * Handles compression of the zero width character stream.  Compression is
 * important so that the invisible payload remains as small as possible.  The
 * module also provides a simple Huffman-like scheme to further reduce repeated
 * zero width characters.
 */

const { pipe, curry, sort, difference, __ } = require("ramda");

const { recursiveReplace } = require("./util");

const lzutf8 = require("lzutf8");

/**
 * Compress plain text into a Buffer using LZUTF8.
 *
 * @param {string} x Text to be compressed.
 * @returns {Buffer} Compressed representation of the input text.
 */
const compress = (x) =>
  lzutf8.compress(x, {
    outputEncoding: "Buffer",
  });

// Curried decompress function reused by callers
const _lzutf8Decompress = curry(lzutf8.decompress)(__, {
  inputEncoding: "Buffer",
  outputEncoding: "String",
});

/**
 * Decompress a Buffer back into a string.
 *
 * @param {Buffer|Uint8Array|string} x Compressed data produced by {@link compress}.
 * @returns {string} The original uncompressed text.
 */
const decompress = pipe(Buffer.from, _lzutf8Decompress);

/**
 * Build a ranking table to determine which two characters benefit most from
 * compression.
 *
 * Returns the optimal pair sorted alphabetically.
 *
 * @param {string} secret     Zero width character stream.
 * @param {string[]} characters Candidate zero width characters to analyse.
 * @returns {string[]} Two character array representing the best compression pair.
 */
const findOptimal = (secret, characters) => {
  const dict = characters.reduce((acc, data) => {
    acc[data] = {};
    return acc;
  }, {});
  const size = secret.length;
  for (let j = 0; j < size; j++) {
    let count = 1;
    while (j < size && secret[j] === secret[j + 1]) {
      count++;
      j++;
    }
    if (count >= 2) {
      let itr = count;
      while (itr >= 2) {
        dict[secret[j]][itr] =
          (dict[secret[j]][itr] || 0) + Math.floor(count / itr) * (itr - 1);
        itr--;
      }
    }
  }
  const getOptimal = [];
  for (const key in dict) {
    for (const count in dict[key]) {
      getOptimal.push([key + count, dict[key][count]]);
    }
  }
  const rankedTable = sort((a, b) => b[1] - a[1], getOptimal);

  // Filter out the two most frequently repeated characters that will yield
  // the best compression results.
  let reqZwc = rankedTable
    .filter((val) => val[0][1] === "2")
    .slice(0, 2)
    .map((chars) => chars[0][0]);

  if (reqZwc.length !== 2) {
    reqZwc = reqZwc.concat(
      difference(characters, reqZwc).slice(0, 2 - reqZwc.length)
    );
  }

  return reqZwc.slice().sort();
};

/**
 * Generate shrink/expand helpers for a given set of zero width characters.
 *
 * @param {string[]} zwc Array of zero width characters used for encoding.
 * @returns {{shrink: function(string): string, expand: function(string): string}} Object containing helper functions.
 */
const zwcHuffMan = (zwc) => {
  const tableMap = [
    zwc[0] + zwc[1],
    zwc[0] + zwc[2],
    zwc[0] + zwc[3],
    zwc[1] + zwc[2],
    zwc[1] + zwc[3],
    zwc[2] + zwc[3],
  ];

  // Given two repeated characters return the zero width flag that represents
  // them.  The inverse function extracts the original pair from the flag.
  const _getCompressFlag = (zwc1, zwc2) =>
    zwc[tableMap.indexOf(zwc1 + zwc2)]; // zwA,zwB => zwD

  const _extractCompressFlag = (zwc1) => tableMap[zwc.indexOf(zwc1)].split(""); // zwcD => zwA,zwcB

  // Replace repeated characters with flags to shrink the stream
  const shrink = (secret) => {
    const repeatChars = findOptimal(secret, zwc.slice(0, 4));
    return (
      _getCompressFlag(...repeatChars) +
      recursiveReplace(
        secret,
        repeatChars.map((x) => x + x),
        [zwc[4], zwc[5]]
      )
    );
  };

  // Expand a compressed stream back to its original form
  const expand = (secret) => {
    if (!secret) {
      return secret;
    }
    const flag = secret[0];
    if (!zwc.includes(flag)) {
      throw new Error("Unknown compression flag");
    }
    const invisibleStream = secret.slice(1);
    if (!invisibleStream) {
      return "";
    }
    const repeatChars = _extractCompressFlag(flag);
    return recursiveReplace(
      invisibleStream,
      [zwc[4], zwc[5]],
      repeatChars.map((x) => x + x)
    );
  };

  return {
    shrink,
    expand,
  };
};

module.exports = {
  compress,
  decompress,
  zwcHuffMan,
};
