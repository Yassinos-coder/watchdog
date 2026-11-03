# Email and SMTP

Watchdog sends email through **your own** mail server, so no third party sees your alerts. The same settings send two-step verification codes.

## Add your SMTP settings

Open **Integrations → Email (SMTP)** and fill in:

| Field | Example | Notes |
| --- | --- | --- |
| Host | `smtp.example.com` | Your provider's SMTP server |
| Port | `587` | Use 587 with STARTTLS, or 465 with TLS |
| Secure | off for 587, on for 465 | "Secure" means TLS from the start |
| Username / password | | Leave the password empty to keep the saved one |
| From | `Watchdog <alerts@example.com>` | Must be allowed by your provider |

Select **Save**, then **Send test email** to confirm it works.

Settings saved here override the `SMTP_*` environment variables. Choose **Use environment settings** to go back to them.

## Add an email channel

1. Open **Integrations** and choose **Add channel → Email**.
2. Enter up to 10 recipient addresses.
3. Select **Send test** and check the inbox.

## Provider notes

- **Gmail or Google Workspace**: use `smtp.gmail.com`, port 587, and an [app password](https://support.google.com/accounts/answer/185833). Your normal password will not work.
- **Amazon SES, Mailgun, Postmark, Resend**: create SMTP credentials in the provider's dashboard and use those.

## Troubleshooting

- **Could not send email: Invalid login**: wrong username or password, or the provider needs an app password.
- **Connection timeout**: the port is blocked by your host. Some cloud providers block port 25 and 465; try 587.
- **Mail lands in spam**: use a From address on a domain with SPF and DKIM set up for your provider.
