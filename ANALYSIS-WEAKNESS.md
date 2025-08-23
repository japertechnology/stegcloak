# Weakness Report

## Security

### Weak PBKDF2 iteration count and key reuse for HMAC
- **Severity**: High
- **Affected Files/Locations**: components/encrypt.js lines 18-21, 33-34, 49
- **Description**: Key derivation uses PBKDF2 with only 10,000 iterations and the same derived key is reused for both AES-256-CTR encryption and the HMAC. The HMAC is computed over the plaintext and appended before encryption, providing limited resistance to brute-force attacks and key separation issues.
- **Recommendation**: Increase the iteration count or adopt a stronger KDF such as scrypt/Argon2, derive independent keys for encryption and authentication, and MAC the ciphertext instead of the plaintext.

### Non-cryptographic RNG for message embedding
- **Severity**: Medium
- **Affected Files/Locations**: components/message.js lines 123-133
- **Description**: The `embed` helper relies on `Math.random` to choose where the hidden payload is inserted. This RNG is predictable and not suitable when the location needs to remain hard to guess.
- **Recommendation**: Use a cryptographically secure RNG (`crypto.randomInt`/`crypto.randomBytes`) or a deterministic algorithm seeded from the password.

### Secrets exposed through clipboard and filesystem operations
- **Severity**: Medium
- **Affected Files/Locations**: cli.js lines 47-55, 82-83
- **Description**: Hidden messages are automatically copied to the clipboard and may be written to disk without setting restrictive permissions, potentially leaking sensitive information.
- **Recommendation**: Offer options to avoid clipboard interaction, ensure written files have minimal permissions, and warn users to clear the clipboard after use.

## Code Quality

### Blocking synchronous I/O and abrupt process termination
- **Severity**: Medium
- **Affected Files/Locations**: cli.js lines 47-56, 82-89, 213-214
- **Description**: The CLI performs synchronous file operations (`fs.writeFileSync`) and exits using `process.exit`, which blocks the event loop and complicates reuse in other tools or libraries.
- **Recommendation**: Replace synchronous I/O with asynchronous equivalents and return errors instead of exiting abruptly, allowing the caller to decide how to handle failures.

### Complex compression logic with minimal documentation
- **Severity**: Low
- **Affected Files/Locations**: components/compact.js lines 31-75
- **Description**: The Huffman-like compression algorithm uses nested loops and mutable state, making the code hard to follow and maintain.
- **Recommendation**: Refactor the compression routine into smaller functions, add comments explaining the algorithm, and add unit tests to cover edge cases.

## Interface

### Reliance on interactive prompts and environment variables for passwords
- **Severity**: Low
- **Affected Files/Locations**: cli.js lines 131-138, 231-236
- **Description**: The CLI frequently prompts for input and may automatically consume passwords from environment variables, which can be insecure and difficult to automate.
- **Recommendation**: Provide fully non-interactive command options and encourage more secure secret management mechanisms such as reading from protected files or using keychains.

## Architecture

### Hard‑coded zero width character set limits extensibility
- **Severity**: Low
- **Affected Files/Locations**: stegcloak.js lines 31-33
- **Description**: The list of zero width characters is embedded as a constant and cannot be customized without modifying the library, reducing flexibility for different threat models or character sets.
- **Recommendation**: Accept the character set as a configurable parameter or provide extension points so users can supply their own set without altering core code.

