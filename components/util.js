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
 * Slice a buffer.
 *
 * @param {Buffer|Uint8Array} x Source buffer.
 * @param {number} y Start index.
 * @param {number} [z=x.length] End index (non-inclusive).
 * @returns {Buffer} New buffer containing the requested slice.
 */
const buffSlice = (x, y, z = x.length) => pipe(byarr, slice(y, z), toBuffer)(x);

/**
 * Concatenate multiple buffers.
 *
 * @type {function(Buffer[]): Buffer}
 */
const concatBuff = Buffer.concat;

/**
 * Convert a byte array into a Buffer instance.
 *
 * @type {function(Array|ArrayBuffer|Uint8Array|string): Buffer}
 */
const toBuffer = Buffer.from;

/**
 * Convert buffer to byte array.
 *
 * @param {Buffer|Uint8Array} x Buffer to convert.
 * @returns {Uint8Array} Byte array representation.
 */
const byarr = (x) => Uint8Array.from(x); // Cannot be point-free since Uint8Array.from() needs to be bound to its prototype

/**
 * Number to binary string conversion.
 *
 * @param {number} x Number to convert.
 * @returns {string} Binary representation of the number.
 */
const nTobin = (x) => x.toString(2);

/**
 * Convert input to a byte array and apply bitwise complement.
 *
 * @param {Buffer|Uint8Array|string} x Data to complement.
 * @returns {Uint8Array} Complemented byte array.
 */
const compliment = pipe(byarr, map(_not));

/**
 * Map over an array in fixed-size steps.
 *
 * @param {function} callback Function applied to each step.
 * @param {number} step Size of each step.
 * @param {Array} array Input array.
 * @returns {Array} Result of mapping.
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
 * Pure recursive regular expression replace.
 *
 * @param {string} data         Source string.
 * @param {string[]} patternArray  Patterns to replace.
 * @param {string[]} replaceArray  Replacement strings.
 * @returns {string} Mutated string with replacements applied.
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
 * Pad a number with leading zeroes to achieve the required length.
 *
 * @param {number} x   Desired length.
 * @param {number|string} num Number to pad.
 * @returns {string} Padded string.
 */
const zeroPad = curry((x, num) => {
  var zero = "";
  for (let i = 0; i < x; i++) {
    zero += "0";
  }
  return zero.slice(String(num).length) + num;
});

/**
 * Byte array to binary string conversion. Ensures input bytes are unsigned.
 *
 * @param {Buffer|Uint8Array|string} x Data to convert.
 * @returns {string} Binary string representation.
 */
const byteToBin = pipe(byarr, Array.from, map(nTobin), map(zeroPad(8)), join(""));

/**
 * Binary string to byte array conversion.
 *
 * @param {string} str Binary string.
 * @returns {Uint8Array} Byte array.
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
