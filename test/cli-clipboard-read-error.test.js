// Ensure CLI handles clipboard read failures gracefully
const assert = require('assert')
const Module = require('module')
const path = require('path')

const originalLoad = Module._load
const originalExit = process.exit
const originalArgv = process.argv
let exitCode = null

Module._load = function (request, parent, isMain) {
  if (request === 'clipboardy') {
    return { readSync () { throw new Error('clipboard read fail') }, writeSync () {} }
  }
  return originalLoad(request, parent, isMain)
}

process.exit = (code) => {
  exitCode = code
  throw new Error('exit')
}

process.argv = ['node', path.join(__dirname, '../cli.js'), 'reveal', '--clip']

try {
  require('../cli.js')
} catch (e) {
  if (e.message !== 'exit') throw e
}

process.exit = originalExit
process.argv = originalArgv
Module._load = originalLoad

assert.strictEqual(exitCode, 1, 'CLI did not exit with code 1 on clipboard read error')
console.log('CLI clipboard read error test passed')
process.exit(0)

