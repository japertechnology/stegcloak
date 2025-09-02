"use strict";

/**
 * Collection of small utility helpers used across the StegCloak codebase.
 * They operate on buffers, binary strings and arrays while avoiding any
 * side effects.
 */

const Buffer = require("safe-buffer").Buffer;

const {
  map,
  join,
  pipe,
  slice,
  curry,
  flip,
  dropLast,
  isEmpty,
  takeLast,
} = require("ramda");

// Compliment a byte and ensure values stay in the 0-255 range
const _not = (x) => (~x) & 0xff;

/**
 * Slice a buffer or byte array.
 * @param {Buffer|Uint8Array} x Source buffer.
 * @param {number} y Start index (inclusive).
 * @param {number} [z=x.length] End index (exclusive).
 * @returns {Buffer} New sliced buffer.
 */
const buffSlice = (x, y, z = x.length) => pipe(byarr, slice(y, z), toBuffer)(x);

/**
 * Concatenate an array of Buffers into a single Buffer.
 * @type {Function}
 */
const concatBuff = Buffer.concat;

/**
 * Convert a byte array into a Buffer.
 * @type {Function}
 */
const toBuffer = Buffer.from;

/**
 * Convert a Buffer into a Uint8Array.
 * Cannot be point-free since {@link Uint8Array.from} must be bound.
 * @param {Buffer} x Source buffer.
 * @returns {Uint8Array} Byte array representation.
 */
const byarr = (x) => Uint8Array.from(x);

/**
 * Convert a number into its binary string representation.
 * @param {number} x Number to convert.
 * @returns {string} Binary string.
 */
const nTobin = (x) => x.toString(2);

/**
 * Compliment the bytes in a buffer.
 * @param {Buffer} input Buffer to compliment.
 * @returns {Uint8Array} Complimented byte array.
 */
const compliment = pipe(byarr, map(_not));

/**
 * Map over an array in fixed-size steps.
 * @param {Function} callback Function executed for each step.
 * @param {number} step Number of elements to skip per iteration.
 * @param {Array} array Array to iterate over.
 * @returns {Array} New array containing mapped values.
 */
const stepMap = curry((callback, step, array) => {
  return array
    .map((d, i, array) => {
      if (i % step === 0) {
        return callback(d, i, array);
      }
    })
    .filter((d, i) => i % step === 0);
});

/**
 * Recursively perform global replacements on a string.
 * @param {string} data Source string.
 * @param {string[]} patternArray Patterns to replace, processed from end to start.
 * @param {string[]} replaceArray Replacement strings corresponding to patterns.
 * @returns {string} Resulting string after all replacements.
 */
const recursiveReplace = (data, patternArray, replaceArray) => {
  if (isEmpty(patternArray) && isEmpty(replaceArray)) {
    return data;
  }
  const [pattern] = takeLast(1, patternArray);
  const [replaceTo] = takeLast(1, replaceArray);
  data = data.replace(new RegExp(pattern, "g"), replaceTo);
  return recursiveReplace(
    data,
    dropLast(1, patternArray),
    dropLast(1, replaceArray)
  );
};

/**
 * Pad a number with leading zeroes to a specified width.
 * @param {number} x Desired width.
 * @param {number} num Number to pad.
 * @returns {string} Zero-padded string.
 */
const zeroPad = curry((x, num) => {
  var zero = "";
  for (let i = 0; i < x; i++) {
    zero += "0";
  }
  return zero.slice(String(num).length) + num;
});

/**
 * Convert a Buffer into a binary string. Input bytes are treated as unsigned.
 * @param {Buffer|Uint8Array} input Buffer to convert.
 * @returns {string} Binary representation.
 */
const byteToBin = pipe(byarr, Array.from, map(nTobin), map(zeroPad(8)), join(""));

/**
 * Convert a binary string into a Uint8Array of bytes.
 * @param {string} str Binary string where length is a multiple of eight.
 * @returns {Uint8Array} Parsed bytes.
 */
const binToByte = (str) => {
  var arr = [];
  for (let i = 0; i < str.length; i += 8) {
    arr.push(pipe(slice(i, i + 8), flip(parseInt)(2))(str));
  }
  return new Uint8Array(arr);
};

module.exports = {
  toBuffer,
  byarr,
  compliment,
  byteToBin,
  nTobin,
  zeroPad,
  binToByte,
  concatBuff,
  buffSlice,
  stepMap,
  recursiveReplace,
};
