# DFA-Based Login Password Validator

An educational, client-side password validation tool that demonstrates a Deterministic Finite Automaton (DFA). It checks minimum length and character-class requirements, shows the state reached after each character, and explains acceptance/rejection.

## Features
- DFA state simulation with a capped length counter and a 4-bit character-class mask.
- Live checks for minimum length, uppercase, lowercase, digit, and special character.
- Per-character transition trace and final accept/reject state.
- Responsive interface; no account, server, API key, or external dependency required.
- Password is processed locally in the browser and is never submitted to a server.

## Run locally
Open `index.html` in a modern browser. There is no build step or package installation.

## DFA model
Each state is represented as `q(length, mask)` where `length` is capped at 8 and `mask` records whether lowercase (bit 1), uppercase (bit 2), digit (bit 4), and special (bit 8) characters have appeared. Every input character advances the length counter (up to 8) and ORs the appropriate class bits into the mask. The accepting state is reached when the capped length is 8 and the mask is 15. This models a password of at least eight characters containing all four classes. Any string not ending in an accepting state is rejected.

## Deployment on Vercel
This is a static site. Import the GitHub repository into Vercel and keep the root directory as `./`. No build command is required; `index.html` is the entry point. `vercel.json` is included for static output and security headers.

## Important note
This is a teaching/demo validator, not production authentication. Real login systems must validate credentials on a secure server, hash passwords with a modern password-hashing algorithm, rate-limit attempts, and never store plaintext passwords.