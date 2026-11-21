# SMTP Email Configuration Guide

This guide explains how to configure email sending for password reset functionality in CritXChange.

## Supported Email Providers

- Gmail
- Outlook/Hotmail
- Yahoo Mail
- Custom SMTP servers
- SendGrid
- Mailgun
- Amazon SES

## Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **"2-Step Verification"** if not already enabled

### Step 2: Generate App Password

1. Go to [Google Account](https://myaccount.google.com/)
2. Click **"Security"** in the left sidebar
3. Under **"Signing in to Google"**, click **"2-Step Verification"**
4. Scroll down and click **"App passwords"**
5. Select app: **"Mail"**
6. Select device: **"Other (Custom name)"**
7. Enter name: `CritXChange`
8. Click **"Generate"**
9. **Copy the 16-character password** (you won't see it again!)

### Step 3: Configure Environment Variables

Add to your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
```

### Step 4: Test Configuration

Restart your server and test password reset:

```bash
pnpm start
```

Then visit `http://localhost:3000/auth/forgot-password` and request a reset.

## Outlook/Hotmail Setup

### Configuration

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

**Note:** You may need to enable "Less secure app access" or use an app password.

## Yahoo Mail Setup

### Configuration

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

**Note:** Generate an app password from Yahoo Account Security settings.

## SendGrid Setup

### Step 1: Create SendGrid Account

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your account

### Step 2: Create API Key

1. Go to **Settings** > **API Keys**
2. Click **"Create API Key"**
3. Name it: `CritXChange`
4. Select permissions: **"Full Access"** or **"Mail Send"**
5. Copy the API key

### Step 3: Configure

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

## Mailgun Setup

### Step 1: Create Mailgun Account

1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Verify your domain or use sandbox domain

### Step 2: Get SMTP Credentials

1. Go to **Sending** > **Domain Settings**
2. Click on your domain
3. Go to **"SMTP credentials"** tab
4. Copy username and password

### Step 3: Configure

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your_mailgun_username
SMTP_PASS=your_mailgun_password
```

## Amazon SES Setup

### Step 1: Set Up Amazon SES

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verify your email address or domain
3. Move out of sandbox mode (if needed)

### Step 2: Get SMTP Credentials

1. Go to **SMTP Settings**
2. Click **"Create SMTP Credentials"**
3. Create IAM user for SMTP
4. Copy the credentials

### Step 3: Configure

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
```

**Note:** Replace `us-east-1` with your AWS region.

## Custom SMTP Server

For any other SMTP server:

```env
SMTP_HOST=your_smtp_server.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
```

### Common Ports

- **587** - TLS/STARTTLS (recommended)
- **465** - SSL/TLS
- **25** - Usually blocked by ISPs

## Testing Email Configuration

### Method 1: Request Password Reset

1. Start your server
2. Visit `http://localhost:3000/auth/forgot-password`
3. Enter a registered email
4. Check your email inbox (and spam folder)

### Method 2: Check Server Logs

In development mode, if SMTP is not configured, the reset token will be logged to console:

```
Password reset token (dev mode): abc123...
Reset URL: http://localhost:3000/auth/reset-password?token=abc123...
```

### Method 3: Test Script

Create a test script to verify SMTP:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ SMTP Error:', error);
    } else {
        console.log('✅ SMTP Server is ready to send emails');
    }
});
```

## Troubleshooting

### Error: "Invalid login"

**Solutions:**
- Verify username and password are correct
- For Gmail, use app password (not regular password)
- Check for extra spaces in `.env` file
- Ensure 2FA is enabled (for Gmail)

### Error: "Connection timeout"

**Solutions:**
- Check firewall settings
- Verify SMTP host and port are correct
- Try different port (587 vs 465)
- Check if your ISP blocks port 25

### Error: "Authentication failed"

**Solutions:**
- Verify credentials are correct
- Check if "Less secure app access" needs to be enabled
- For Gmail, ensure you're using app password
- Verify account is not locked

### Emails Going to Spam

**Solutions:**
- Use a verified domain (not free email for production)
- Set up SPF, DKIM, and DMARC records
- Use a reputable email service (SendGrid, Mailgun, SES)
- Avoid spam trigger words in email content

## Security Best Practices

1. **Never commit** `.env` file
2. **Use app passwords** instead of main passwords
3. **Rotate credentials** periodically
4. **Use environment-specific** credentials
5. **Monitor** email sending for abuse
6. **Rate limit** password reset requests
7. **Use HTTPS** in production

## Production Recommendations

- Use a dedicated email service (SendGrid, Mailgun, SES)
- Set up proper SPF/DKIM records
- Monitor email delivery rates
- Set up bounce handling
- Implement rate limiting
- Use a verified domain
- Set up email templates
- Monitor for abuse

## Email Template Customization

The password reset email template is in `backend/routes/auth.js`. You can customize:

- Email subject
- Email body HTML
- Reset link format
- Expiration message

## Rate Limiting

Consider adding rate limiting for password reset requests:

```javascript
// Example: Limit to 3 requests per hour per IP
const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset requests, please try again later.'
});
```

