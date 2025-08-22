const assert = require('assert');
const { embed } = require('../components/message.js');

const secret = 'secret';
const rng = () => 0; // deterministic to target second word

const covers = [
  'hello  world again',
  'hello\tworld\tagain',
  'hello\nworld\nagain',
  'hello \t\nworld  \n\tagain',
];

covers.forEach((cover, idx) => {
  const result = embed(cover, secret, rng);
  const expected = cover.replace(/(\s+)(\S+)/, `$1${secret}$2`);
  assert.strictEqual(
    result,
    expected,
    `embed should preserve whitespace for case ${idx + 1}`
  );
});

console.log('All tests passed.');

process.exit(0);

