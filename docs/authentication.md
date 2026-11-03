# Authentication

Watchdog signs people in with email and password. Administrators must add a second step.

## First run

The first time you open a new instance you create the owner account. You need the **setup token**: set `SETUP_TOKEN` in your environment, or read it from the server log (`First-run setup token`). Setup closes forever once the owner exists.

## Two-step verification

Choose one or more:

- **Authenticator app**: scan the QR code with any TOTP app.
- **Passkey**: use a fingerprint, face, device PIN or hardware key. Passkeys are tied to your server's address, so set `APP_URL` correctly before you create them. If the address changes later, passkeys stop working; keep a second method.
- **Code by email**: needs [SMTP settings](alerts/email.md).

You also get **recovery codes**. Each works once. Store them in a password manager. If you lose them, sign in with a remaining method and make new codes under **Security**.

## Locked out?

Use a recovery code on the sign-in screen. Repeated wrong codes end the sign-in attempt, and repeated wrong passwords lock the account for 15 minutes.
