#!/usr/bin/env node
'use strict'

// Command line interface for StegCloak.  This script wires the library into a
// user friendly CLI that can hide or reveal messages and interactively prompt
// for required inputs.

const {
  program
} = require('commander')
const StegCloak = require('./stegcloak')
const chalk = require('chalk')
const clipboardy = require('clipboardy')
var inquirer = require('inquirer')
const ora = require('ora')
const fs = require('fs')
const jsonfile = require('jsonfile');
const { zwcHuffMan } = require('./components/compact')
const { zwcOperations } = require("./components/message");
// Precompute helpers reused by the CLI
const { expand } = zwcHuffMan(StegCloak.zwc)
const { detach } = zwcOperations(StegCloak.zwc);


/**
 * Hide a secret message using supplied options and optionally copy or write
 * the result. Acts as the implementation behind the `hide` command.
 * @param {string} secret Message to conceal.
 * @param {string} password Password used for encryption when `crypt` is true.
 * @param {string} cover Visible cover text.
 * @param {boolean} crypt Whether to encrypt the message.
 * @param {boolean} integrity Enable HMAC integrity protection.
 * @param {string} [op] Optional output file path.
 */
function cliHide(secret, password, cover, crypt, integrity, op) {
  const stegcloak = new StegCloak(crypt, integrity)

  if (crypt && !password) {
    console.log(chalk.red('Error: A password is required for encryption'))
    process.exit(1)
  }

  const spinner = ora(chalk.cyan.bold('Hiding your text'))
  spinner.start()
  let payload
  try {
    payload = stegcloak.hide(secret, password, cover)
  } catch (e) {
    spinner.stop()
    console.log('\n')
    console.log(chalk.red(e))
    process.exit(1)
  }
  try {
    clipboardy.writeSync(payload)
  } catch (e) {
    spinner.stop()
    console.log('\n')
    console.log(chalk.red(`Error writing to clipboard: ${e.message}`))
    process.exit(1)
  }
  setTimeout(() => {
    spinner.stop()
    if (op) {
      try {
        fs.writeFileSync(op, payload)
      } catch (e) {
        console.log('\n')
        console.log(chalk.red(`Error writing file ${op}: ${e.message}`))
        process.exit(1)
      }
      console.log(chalk.grey(`\n Written to ${op} \n`))
      process.exit(0)
    }
    console.log(chalk.grey('\nCopied to clipboard\n'))
    process.exit(0)
  }, 300)
};

/**
 * Small helper to build Inquirer question objects.
 * @param {string} str Prompt message.
 * @param {string} nameIt Name of the property for the answer object.
 * @returns {Object} Inquirer question configuration.
 */
function createStringQuestion(str, nameIt) {
  return { type: 'input', message: str, name: nameIt }
}

/**
 * Reveal and display a hidden message. Mirrors {@link cliHide} but for extraction.
 * @param {string} payload Text containing the concealed secret.
 * @param {string} [password] Password used for decryption.
 * @param {string} [op] Optional output file path for the revealed secret.
 */
function cliReveal(payload, password, op) {
  const stegcloak = new StegCloak()
  var spinner = ora(chalk.cyan.bold('Decrypting'))
  spinner.start()
  let secret
  try {
    secret = stegcloak.reveal(payload, password)
  } catch (e) {
    spinner.stop()
    console.log('\n')
    console.log(chalk.red(e))
    process.exit(1)
  }
  setTimeout(() => {
    spinner.stop()
    if (op) {
      try {
        fs.writeFileSync(op, secret)
      } catch (e) {
        console.log('\n')
        console.log(chalk.red(`Error writing file ${op}: ${e.message}`))
        process.exit(1)
      }
      console.log(chalk.grey(`\n Written to ${op} \n`))
    }
    console.log('\n')
    console.log(chalk.cyan.bold('         Secret: ') + chalk.green.bold(secret))
    console.log('\n')
    process.exit(0)
  }, 300)
};

// Definition for the `hide` command.  The command accepts optional secret and
// cover parameters directly but can also source them from files or a config.
// Additional flags allow disabling encryption, enabling integrity checks and
// writing the result to disk instead of the clipboard.
program
  .command('hide [secret] [cover]')
  // Source cover text or secret from external files
  .option('-fc, --fcover <fcover> ', 'Extract cover text from file')
  .option('-fs, --fsecret <fsecret> ', 'Extract secret text from file')
  // Toggle encryption/integrity behaviour
  .option('-n, --nocrypt', "If you don't need encryption", false)
  .option('-i, --integrity', 'If additional security of preventing tampering is needed', false)
  // Control where the hidden payload is written
  .option('-o, --output <output> ', 'Stream the results to an output file')
  // Allow providing all inputs via JSON config file
  .option('-c, --config <config>', 'Config file')
  .action(async (secret, cover, args) => {
    if (args.integrity && args.nocrypt) {
      console.log(chalk.red('Error: Integrity checks require encryption'))
      process.exit(1)
    }
    if (args.config) {
      jsonfile.readFile(args.config)
        .then(obj => {
        if (!("secret" in obj && "cover" in obj)) {
          console.error(chalk.red("Config Parse error") + " : Missing inputs");
          process.exit(1);
        }
          secret = obj.secret;
          cover = obj.cover;
          let password = obj.password || process.env["STEGCLOAK_PASSWORD"];
          if (!obj.password && process.env["STEGCLOAK_PASSWORD"]) {
            console.warn(chalk.yellow("Warning:") + " using password from environment variable");
          }
          let integrity = obj.integrity || false;
          let nocrypt = obj.nocrypt || false;
          if (integrity && nocrypt) {
            console.log(chalk.red('Error: Integrity checks require encryption'))
            process.exit(1)
          }
          let output = obj.output || false;
          cliHide(secret, password, cover, !nocrypt, integrity, output);
        })
        .catch(error => { console.error(error); process.exit(1); })
      return;
    }

    // Build interactive prompts for missing inputs.  When a password is
    // supplied through the environment, avoid prompting the user again.
    const questions = process.env["STEGCLOAK_PASSWORD"] ? (console.warn(chalk.yellow("Warning:") + " using password from environment variable\n"), []) : [{
      type: 'password',
      message: 'Enter password :',
      name: 'password',
      mask: true
    }];

    const qsecret = "What's your secret? :"

    const qcover = 'Enter the text you want to hide your secret within? (Minimum 2 words):'

    if (args.nocrypt) questions.pop()

      if (args.fcover) {
        try {
          cover = fs.readFileSync(args.fcover, 'utf-8');
        } catch (e) {
          console.log(chalk.red(`Error reading file ${args.fcover}: ${e.message}`))
          process.exit(1)
        }
      }

      if (args.fsecret) {
        try {
          secret = fs.readFileSync(args.fsecret, 'utf-8')
        } catch (e) {
          console.log(chalk.red(`Error reading file ${args.fsecret}: ${e.message}`))
          process.exit(1)
        }
      }

    if (!secret && !cover) {
      questions.push(createStringQuestion(qsecret, 'secret'), createStringQuestion(qcover, 'cover'))
    } else if (!secret) {
      questions.push(createStringQuestion(qsecret, 'secret'))
    } else if (!cover) {
      questions.push(createStringQuestion(qcover, 'cover'))
    }
      let answers = {};
      if (questions.length) {
        answers = await inquirer.prompt(questions);
      }
      if (args.integrity && args.nocrypt) {
        console.log(chalk.red('Error: Integrity checks require encryption'))
        process.exit(1)
      }
      cliHide(answers.secret || secret, answers.password || process.env["STEGCLOAK_PASSWORD"], cover || answers.cover, !args.nocrypt, args.integrity, args.output)
    })

// CLI

// Definition for the `reveal` command.  Supports reading the payload from a
// file, the clipboard or via a config object.  The secret can optionally be
// written to disk instead of printed.
program
  .command('reveal [message]')
  // Source the message from a file or clipboard
  .option('-f, --file <file> ', 'Extract message to be revealed from file')
  .option('-cp, --clip', 'Copy message directly from clipboard')
  // Optionally store the revealed message
  .option('-o, --output <output> ', 'Stream the secret to an output file')
  .option('-c, --config <config>', 'Config file')
  .action((data, args) => {

    if (args.config) {
      jsonfile.readFile(args.config)
        .then(obj => {
        if (!("message" in obj)) {
          console.error(chalk.red("Config Parse error") + " : Missing inputs");
          process.exit(1);
        }
          data = obj.message;
          if (!obj.password && process.env["STEGCLOAK_PASSWORD"]) {
            console.warn(chalk.yellow("Warning:") + " using password from environment variable");
          }
          let password = obj.password || process.env["STEGCLOAK_PASSWORD"];
          let output = obj.output || false;
          cliReveal(data, password, output)
        })
        .catch(error => { console.error(error); process.exit(1); });
      return;
    }

    // Interactive prompts for the message and password when they are not
    // supplied through flags or configuration.
    const questions = [{ type: 'input', message: 'Enter message to decrypt:', name: 'payload' }, {
      type: 'password',
      message: 'Enter password :',
      name: 'password',
      mask: true
    }];


      if (args.file) {
        try {
          data = fs.readFileSync(args.file, 'utf-8')
          console.log(chalk.cyan(`Extracted text from ${args.file} to be decrypted !`))
          console.log()
        } catch (e) {
          console.log(chalk.red(`Error reading file ${args.file}: ${e.message}`))
          process.exit(1)
        }
      }

    if (args.clip || data) {
        const mutatedQuestions = questions.slice(1)

        if (!data) {
          try {
            data = clipboardy.readSync()
          } catch (e) {
            console.log(chalk.red(`Error reading from clipboard: ${e.message}`))
            process.exit(1)
          }
        }

      let stream
      try {
        stream = expand(detach(data))
      } catch (e) {
        console.log(chalk.red('No hidden payload found in provided text.'))
        process.exit(0)
      }

      if (stream[0] === StegCloak.zwc[2] || process.env["STEGCLOAK_PASSWORD"]) {
        if (process.env["STEGCLOAK_PASSWORD"]) {
          console.warn(chalk.yellow("Warning:") + " using password from environment variable");
        }
        mutatedQuestions.pop()
      }

      if (mutatedQuestions.length) {
        inquirer.prompt(mutatedQuestions).then(answers => {
          cliReveal(data, answers.password || process.env["STEGCLOAK_PASSWORD"], args.output)
        })
      } else {
        cliReveal(data, process.env["STEGCLOAK_PASSWORD"] || null, args.output)
      }
    }

    else {
      inquirer.prompt([questions[0]]).then(answers => {
        let stream
        try {
          stream = expand(detach(answers.payload))
        } catch (e) {
          console.log(chalk.red('No hidden payload found in provided text.'))
          process.exit(0)
        }

        if (stream[0] === StegCloak.zwc[2]) {
          cliReveal(answers.payload, null, args.output)
        } else {
          if (!process.env["STEGCLOAK_PASSWORD"]) {
            inquirer.prompt([questions[1]]).then(ans => {
              cliReveal(answers.payload, ans.password, args.output)
            })
          } else {
            cliReveal(answers.payload, process.env["STEGCLOAK_PASSWORD"], args.output)
          }

        }
      })
    }
  })

program.parse(process.argv)

module.exports = { cliHide, cliReveal }
