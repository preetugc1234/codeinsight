# Brevo SMTP Setup for Supabase Password Reset

This guide will help you connect Brevo (formerly Sendinblue) SMTP to Supabase for sending password reset emails.

## Step 1: Get Brevo SMTP Credentials

1. Go to [Brevo Dashboard](https://app.brevo.com/)
2. Navigate to **SMTP & API** → **SMTP**
3. You'll find your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (recommended) or `465` (SSL)
   - **Login**: Your Brevo account email
   - **SMTP Key**: Click "Generate a new SMTP key" if you don't have one

## Step 2: Configure Supabase SMTP Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/cblgjjbpfpimrrpjlkhp
2. Navigate to **Settings** → **Authentication** → **Email**
3. Scroll down to **SMTP Settings**
4. Click **Enable Custom SMTP**
5. Fill in the following details:

```
Sender Email: noreply@yourdomain.com (or your verified Brevo sender email)
Sender Name: Code Insight

SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP Username: [Your Brevo account email]
SMTP Password: [Your Brevo SMTP key]

Enable TLS: Yes (checked)
```

6. Click **Save**

## Step 3: Configure Email Templates in Supabase

1. In the same **Authentication** → **Email** section
2. Find **Email Templates** section
3. Customize the **Reset Password** template:

### Subject Line:
```
Reset your Code Insight password
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Code Insight</h1>
  </div>

  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>

    <p style="color: #4b5563; font-size: 16px;">
      We received a request to reset your password for your Code Insight account.
    </p>

    <p style="color: #4b5563; font-size: 16px;">
      Click the button below to reset your password:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                font-weight: 600;
                font-size: 16px;">
        Reset Password
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      This link will expire in 1 hour for security reasons.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #667eea;">{{ .ConfirmationURL }}</span>
    </p>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
      © 2025 Code Insight. Powered by Claude Sonnet 4.5.
    </p>
  </div>
</body>
</html>
```

4. Click **Save** to update the template

## Step 4: Verify Sender Email in Brevo (Important!)

For production use, you need to verify your sender email:

1. In Brevo Dashboard, go to **Senders & IP**
2. Click **Add a Sender**
3. Enter your sender email (e.g., `noreply@yourdomain.com`)
4. Verify the email through the confirmation link sent to that address

**Note**: For testing, you can use your Brevo account email as the sender.

## Step 5: Test the Configuration

1. Go to https://codeinsight4.vercel.app/reset-password
2. Enter your email address
3. Click "Send reset link"
4. Check your email inbox (and spam folder)
5. Click the reset link in the email
6. You should be redirected to the update password page

## Configuration Variables

The redirect URL in `reset-password/page.tsx` is already configured:
```typescript
redirectTo: `${window.location.origin}/update-password`
```

This ensures users are sent to the correct password update page after clicking the email link.

## Troubleshooting

### Email not received?
1. Check Brevo Dashboard → **Statistics** to see if email was sent
2. Check spam/junk folder
3. Verify SMTP credentials are correct in Supabase
4. Ensure sender email is verified in Brevo

### "Invalid SMTP credentials" error?
- Double-check your SMTP key in Brevo
- Make sure you're using the SMTP key, not your account password
- Verify the username is your Brevo account email

### Email sent but link doesn't work?
- Check that the redirect URL matches your app's domain
- Ensure the update-password page exists and is accessible
- Verify the link hasn't expired (1 hour expiry by default)

## Production Checklist

- [ ] Verify sender email domain in Brevo
- [ ] Set up DKIM and SPF records for better deliverability
- [ ] Customize email template with your branding
- [ ] Test password reset flow end-to-end
- [ ] Monitor email delivery rates in Brevo dashboard
- [ ] Set up email alerts for failed deliveries

## Brevo Free Tier Limits

- **300 emails per day**
- Unlimited contacts
- Email support
- Basic templates

This should be sufficient for initial testing and early users. Upgrade to paid plan as you scale.
