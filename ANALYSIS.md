# StegCloak Repository Analysis

## Overview
StegCloak is a JavaScript library, command-line tool and web build for hiding and revealing text using invisible Unicode characters. Secrets are compressed, optionally encrypted and then embedded into cover text using zero width characters. The repository exposes an API (`stegcloak.js`), a CLI (`cli.js`) and a browser bundle (`dist/`).

## Core Library (`stegcloak.js`)
The `StegCloak` class orchestrates the main hiding and revealing workflow. It wires together helpers from the `components/` directory:

1. **Compression & Huffman encoding** – `components/compact.js` wraps the `lzutf8` library and provides a `zwcHuffMan` helper that shrinks/expands repeated zero width characters.
2. **Encryption** – `components/encrypt.js` performs AES-256-CTR encryption with keys derived via PBKDF2. A random salt and IV are generated and an optional HMAC provides integrity verification.
3. **Zero width operations** – `components/message.js` translates between binary data and zero width characters, embeds the hidden stream into cover text and detaches it during reveal.
4. **Utilities** – `components/util.js` contains functional helpers for buffer manipulation, binary conversions, complementing bytes and recursive replacements.

`hide()` compresses and complements the message, encrypts and HMACs it when requested, converts the bytes to a zero width stream, compresses repeated sequences and embeds the result into the cover text. `reveal()` reverses these steps by detaching the hidden stream, expanding and decoding it and finally decrypting and decompressing the payload.

## Command Line Interface (`cli.js`)
The CLI built with `commander` exposes `hide` and `reveal` sub-commands. It prompts for missing inputs using `inquirer`, displays progress with `ora`, copies results to the clipboard (`clipboardy`) and can read or write files and JSON configs. The CLI reuses the library’s helpers (`detach` and `expand`) to validate inputs before revealing.

## Distribution & Build
A browser bundle lives in `dist/` (`stegcloak.min.js` and `index.html`), built via `webpack.config.js`. `package.json` defines the project metadata, dependencies and a test script that runs the Node test files under `test/`.

## Tests
The `test/` directory contains unit tests for embedding and detaching zero width streams, compression/expansion, CLI behaviour and error handling for missing passwords or payloads. The `npm test` script runs all test files sequentially.

## Additional Assets
Static assets such as the logo and demo GIF live under `assets/`. Example configuration files reside in `config-samples/` to demonstrate CLI JSON inputs.

Overall, the codebase is organized into small, functional modules with a clear data flow:

```
compress → compliment → encrypt → binary→zero width → shrink → embed
embed⁻¹ → expand → zero width→binary → decrypt → compliment → decompress
```

This architecture keeps each concern isolated while allowing the same primitives to power both the API and CLI layers.
