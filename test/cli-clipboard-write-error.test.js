// Ensure cliHide handles clipboard write failures
const assert = require('assert')
const Module = require('module')

const originalLoad = Module._load
const originalExit = process.exit
let exitCode = null

Module._load = function (request, parent, isMain) {
  if (request === 'clipboardy') {
    return { writeSync () { throw new Error('clipboard write fail') } }
  }
  if (request === './stegcloak') {
    function FakeStegCloak () {}
    FakeStegCloak.zwc = ['\u200c', '\u200d', '\u200b']
    FakeStegCloak.prototype.hide = () => 'payload'
    return FakeStegCloak
  }
  if (request === 'ora') {
    return () => ({ start () {}, stop () {} })
  }
  if (request === 'commander') {
    return { program: { command () { return this }, option () { return this }, action () { return this }, parse () {} } }
  }
  return originalLoad(request, parent, isMain)
}

process.exit = (code) => {
  exitCode = code
  throw new Error('exit')
}

const { cliHide } = require('../cli.js')

try {
  cliHide('secret', 'password', 'cover', true, false)
} catch (e) {
  if (e.message !== 'exit') throw e
}

process.exit = originalExit
Module._load = originalLoad

assert.strictEqual(exitCode, 1, 'cliHide did not exit with code 1 on clipboard write error')
console.log('CLI clipboard write error test passed')
process.exit(0)

