# Repository Overview
StegCloak is a JavaScript library for hiding messages inside text using zero-width Unicode characters. It can optionally encrypt the hidden payload and provides a command line interface for hiding and revealing secrets.

# Directory and File Structure
```
/ (root)
├── ANALYSIS.md
├── LICENSE
├── README.md
├── assets/
├── cli.js
├── components/
│   ├── compact.js
│   ├── encrypt.js
│   ├── message.js
│   └── util.js
├── config-samples/
├── dist/
├── package.json
├── stegcloak.js
├── test/
└── webpack.config.js
```
- **assets/**: Images and icons used for documentation.
- **cli.js**: Command line interface for hiding and revealing messages.
- **components/**: Core modules for compression, encryption, message handling, and utilities.
- **config-samples/**: Example configuration files for CLI usage.
- **dist/**: Browser-ready build artifacts.
- **stegcloak.js**: Main library module tying together components.
- **test/**: Node-based test scripts.
- **webpack.config.js**: Build configuration for bundling.

# Core Components
- **stegcloak.js**: Exposes a `StegCloak` class with `hide` and `reveal` methods that orchestrate compression, encryption, and zero-width embedding.
- **components/compact.js**: Handles compression of payloads and includes a Huffman-like scheme (`zwcHuffMan`) to shrink or expand zero-width streams.
- **components/encrypt.js**: Provides AES-256-CTR encryption/decryption with PBKDF2 key derivation and optional HMAC integrity checking.
- **components/message.js**: Converts between binary data and zero-width characters, embeds streams into cover text, and detects flags for encryption/integrity.
- **components/util.js**: Utility functions for buffer manipulation, binary conversions, and recursion helpers.
- **cli.js**: CLI wrapper using `commander`, `inquirer`, `chalk`, and related tools for interactive operations.

# Data Flow or Control Flow
```
Hide: message → compress → complement → (encrypt?) → binary → zero-width conversion → Huffman shrink → embed in cover
Reveal: detach from cover → expand → binary → (decrypt?) → complement → decompress → original message
```

# External Dependencies
- **ramda**: Functional programming utilities used across modules.
- **lzutf8**: Compression library for payloads.
- **browserify-cipher**, **pbkdf2**, **create-hmac**, **crypto-browserify**: Implement AES encryption and key derivation.
- **randombytes**, **safe-buffer**, **timing-safe-equal**: Security-related helpers.
- **commander**, **inquirer**, **chalk**, **clipboardy**, **ora**, **jsonfile**: Power the command line interface.

# Notable Design Decisions
- Uses a fixed set of zero-width Unicode characters to conceal data invisibly within text.
- Follows a functional style with `ramda`, minimizing side effects.
- Combines compression and encryption to reduce payload size and enhance security.
- CLI supports environment-provided passwords and configuration files for automation.

# Limitations or Warnings
- `hide` requires cover text of at least two words; otherwise an error is thrown.
- Security relies on users safeguarding passwords and hidden content; zero-width characters may still be detectable in some contexts.
- The library targets Node.js environments (>=8.0.0) and uses synchronous operations that may block the event loop for large inputs.

# Error Handling
- Invalid inputs (e.g., missing password when encryption is enabled, malformed payloads, or missing zero-width stream) throw descriptive errors.
- The CLI reports errors and exits non‑zero on failure.

