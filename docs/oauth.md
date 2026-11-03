# Sign in with Google or GitHub

OAuth is an extra way to sign in. It never creates accounts on its own: the email on the Google or GitHub account must already belong to a user, or have a pending [invite](team.md). Only **verified** emails are accepted. If the user has two-step verification, it is still required.

## Google

1. In Google Cloud Console, create an OAuth client of type **Web application**.
2. Add the redirect URI `https://<your-host>/api/oauth/google/callback`.
3. Set `OAUTH_GOOGLE_CLIENT_ID` and `OAUTH_GOOGLE_CLIENT_SECRET`.

## GitHub

1. Under Settings, Developer settings, create an **OAuth App**.
2. Set the callback URL to `https://<your-host>/api/oauth/github/callback`.
3. Set `OAUTH_GITHUB_CLIENT_ID` and `OAUTH_GITHUB_CLIENT_SECRET`.

Make sure `APP_URL` matches the address people use, since the callback is built from it. The login page shows a button for each configured provider.
