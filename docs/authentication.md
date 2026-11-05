# Authentication

Watchdog signs people in with email and password. Administrators must add a second step.

## First run

The first time you open a new instance you create the owner account. You need the **setup token**: set `SETUP_TOKEN` in your environment, or read it from the server log (`First-run setup token`). Setup closes forever once the owner exists.

## Two-step verification

Choose one or more:

- **Authenticator app**: scan the QR code with any TOTP app.
- **Passkey**: use a fingerprint, face, device PIN or hardware key. Passkeys are tied to your server host name, so set `APP_URL` correctly before you create them. If the address changes later, passkeys made on the old one stop working; keep a second method and some recovery codes, then add a new passkey on the new address. If Watchdog is open on a different host than `APP_URL`, the **Security** page shows a warning and adding a passkey fails with a message that names both. See [moving to a custom domain](railway.md#moving-to-a-custom-domain).
- **Code by email**: needs [SMTP settings](alerts/email.md).

You also get **recovery codes**. Each works once. Store them in a password manager. If you lose them, sign in with a remaining method and make new codes under **Security**.

## Locked out?

Use a recovery code on the sign-in screen. Repeated wrong codes end the sign-in attempt, and repeated wrong passwords lock the account for 15 minutes.

If the app says **Access temporarily blocked**, your network address was blocked for sending too many rejected requests. It clears by itself after the time shown. If you host Watchdog, see [Blocked by the shield](railway.md#blocked-by-the-shield-temporary-ip-ban) to lift it sooner.
