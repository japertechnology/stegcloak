# Weakness Report

## Security

### Weak PBKDF2 iteration count and key reuse for HMAC
- **Severity**: High
- **Affected Files/Locations**: components/encrypt.js lines 18-36
- **Description**: Key derivation uses PBKDF2 with only 10,000 iterations and reuses the same derived material for both the AES-256-CTR key and IV. The HMAC is computed with the same key material and appended before encryption, providing limited resistance to brute-force and key separation weaknesses.
- **Recommendation**: Increase the iteration count or switch to a modern KDF such as scrypt/Argon2, derive separate keys for encryption and authentication, and MAC the ciphertext or adopt an AEAD mode like AES-GCM.

### Outdated Node.js engine and dependencies
- **Severity**: High
- **Affected Files/Locations**: package.json lines 13-15, 47-60
- **Description**: The project targets Node.js >=8.0.0 and pins numerous dependencies released several years ago. Node 8 is end-of-life and these versions may contain known vulnerabilities.
- **Recommendation**: Upgrade to a supported LTS version of Node.js and update dependencies to maintained releases with security patches.

### Non-cryptographic RNG for message embedding
- **Severity**: Medium
- **Affected Files/Locations**: components/message.js lines 125-133
- **Description**: The `embed` helper relies on `Math.random` to choose the insertion point for hidden data. This generator is predictable, allowing attackers to guess the location of the payload.
- **Recommendation**: Use a cryptographically secure RNG (e.g., `crypto.randomInt` or `crypto.randomBytes`) or a deterministic algorithm seeded from the password.

### Secrets exposed through clipboard and filesystem operations
- **Severity**: Medium
- **Affected Files/Locations**: cli.js lines 47-56, 80-85
- **Description**: Hidden messages are automatically copied to the clipboard and may be written to disk without adjusting file permissions, which can leak sensitive information to other processes or users.
- **Recommendation**: Provide options to avoid clipboard interaction, ensure written files use restrictive permissions, and warn users to clear the clipboard when finished.

## Code Quality

### Blocking synchronous I/O and abrupt process termination
- **Severity**: Medium
- **Affected Files/Locations**: cli.js lines 47-56, 80-89
- **Description**: The CLI performs synchronous file operations (`fs.writeFileSync`) and calls `process.exit`, blocking the event loop and making the commands hard to reuse programmatically.
- **Recommendation**: Replace synchronous I/O with asynchronous equivalents and return errors instead of exiting abruptly to allow callers to handle failures.

### Complex compression logic with minimal documentation
- **Severity**: Low
- **Affected Files/Locations**: components/compact.js lines 31-75
- **Description**: The Huffman-like compression routine relies on nested loops and mutable state, making the algorithm difficult to follow and maintain.
- **Recommendation**: Refactor into smaller, well-named functions, add explanatory comments, and expand unit tests to cover edge cases.

## Interface

### Reliance on interactive prompts and environment variables for passwords
- **Severity**: Low
- **Affected Files/Locations**: cli.js lines 131-138, 231-243, 260-266
- **Description**: The CLI frequently prompts for input and may automatically read passwords from environment variables, which is insecure and complicates automation.
- **Recommendation**: Offer fully non-interactive command options and encourage the use of secure secret management mechanisms instead of environment variables.

## Architecture

### Hard-coded zero width character set limits extensibility
- **Severity**: Low
- **Affected Files/Locations**: stegcloak.js lines 31-33
- **Description**: The list of zero width characters is embedded as a constant and cannot be customized without modifying the library, reducing flexibility for different character sets or threat models.
- **Recommendation**: Accept the character set as a configurable parameter or provide extension points so users can supply their own set without altering core code.

