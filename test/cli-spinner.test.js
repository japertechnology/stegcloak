const assert = require('assert')
const Module = require('module')

const originalLoad = Module._load
const originalExit = process.exit
const originalArgv = process.argv

let current = null
let hideStopped = false
let revealStopped = false

Module._load = function (request, parent, isMain) {
  if (request === 'ora') {
    return () => ({
      start () {},
      stop () {
        if (current === 'hide') hideStopped = true
        if (current === 'reveal') revealStopped = true
      }
    })
  }
  if (request === './stegcloak') {
    function FakeStegCloak () {}
    FakeStegCloak.zwc = ['\u200c', '\u200d', '\u200b']
    FakeStegCloak.prototype.hide = () => { throw new Error('fail hide') }
    FakeStegCloak.prototype.reveal = () => { throw new Error('fail reveal') }
    return FakeStegCloak
  }
  if (request === 'clipboardy') {
    return { writeSync () {}, readSync () { return '' } }
  }
  if (request === 'commander') {
    return {
      program: {
        command () { return this },
        option () { return this },
        action () { return this },
        parse () {}
      }
    }
  }
  return originalLoad(request, parent, isMain)
}

process.exit = () => { throw new Error('exit') }

const { cliHide, cliReveal } = require('../cli.js')

try {
  current = 'hide'
  cliHide('secret', 'password', 'cover', true, false)
} catch (e) {
  if (e.message !== 'exit') throw e
}

try {
  current = 'reveal'
  cliReveal('payload', 'password')
} catch (e) {
  if (e.message !== 'exit') throw e
}

process.exit = originalExit
process.argv = originalArgv
Module._load = originalLoad

assert.ok(hideStopped, 'cliHide did not stop spinner on error')
assert.ok(revealStopped, 'cliReveal did not stop spinner on error')
console.log('CLI spinner error handling tests passed')
