# Repository Overview
StegCloak hides textual secrets in plain sight by encoding data as zero width Unicode characters embedded within cover text. It provides optional AES-256 encryption, PBKDF2-based key derivation and HMAC integrity checks so hidden messages can be secured as well as concealed.

# Directory and File Structure
```
/ (root)
├── assets/              # Icons and diagram assets for documentation
├── components/          # Core modules for compression, encryption and message handling
├── config-samples/      # Example JSON configs and sample input/output files
├── dist/                # Prebuilt browser bundle and demo HTML
├── test/                # Node-based unit tests for public APIs and edge cases
├── cli.js               # Command line interface wiring
├── stegcloak.js         # Main library module combining all components
├── package.json         # npm metadata and dependencies
└── webpack.config.js    # Build configuration for browser bundle
```

# Core Components
| Module | Purpose |
| --- | --- |
| **components/compact.js** | Compresses and expands zero width streams using LZUTF8 and a custom Huffman-like scheme. |
| **components/encrypt.js** | Provides AES-256-CTR encryption/decryption with PBKDF2 key derivation and optional HMAC integrity. |
| **components/message.js** | Converts between binary data and zero width characters, embeds streams into cover text and detaches them during reveal. |
| **components/util.js** | Collection of pure helpers for buffer manipulation, binary conversion and recursive replacement. |
| **stegcloak.js** | Orchestrates compression, optional encryption and zero width embedding to hide or reveal messages. |
| **cli.js** | Exposes `hide` and `reveal` commands, prompting users and piping results to clipboard or files. |

# Data Flow or Control Flow
```
Hide: message → compress → compliment → [encrypt?] → binary → ZWC encode → shrink → embed into cover
Reveal: extract ZWC from cover → expand → ZWC decode → [decrypt?] → compliment → decompress → message
```

# External Dependencies
- **ramda** – functional utilities to compose pure operations.
- **lzutf8** – UTF‑8 compatible compression for shrinking secrets.
- **browserify-cipher**, **crypto-browserify**, **pbkdf2** – AES-256 encryption and key derivation.
- **timing-safe-equal** – constant time comparison used for HMAC verification.
- **commander**, **inquirer**, **chalk**, **clipboardy**, **ora** – power the interactive CLI experience.

# Notable Design Decisions
- Heavy use of functional programming patterns through Ramda keeps core algorithms pure and composable.
- Zero width characters (U+200C–U+2064) are selected to survive most copy/paste operations without rendering.
- Compression and a custom two-character substitution scheme minimize payload size to reduce suspicion.

# Limitations or Warnings
- Cover text must contain at least two words; otherwise hiding throws an error.
- A missing or empty password is rejected when encryption is enabled, preventing accidental insecure use.
- Invalid or corrupted payloads (wrong flags, malformed ciphertext) trigger descriptive exceptions rather than silent failure.

# Error Handling
- Functions validate inputs early (e.g., binary length checks, flag detection) and raise errors with clear messages.
- Decryption verifies the presence of salt, ciphertext and HMAC segments, throwing specific errors when data is missing or tampered.
- CLI commands exit with non-zero status on error and provide color-coded messages for quick feedback.
