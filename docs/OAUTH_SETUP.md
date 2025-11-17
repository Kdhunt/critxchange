# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for CritXChange.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `CritXChange` (or your preferred name)
5. Click **"Create"**

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on **"Google+ API"** or **"Google Identity Services API"**
4. Click **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**

**Fill in the required information:**
- **App name**: `CritXChange`
- **User support email**: Your email address
- **Developer contact information**: Your email address
- Click **"Save and Continue"**

**Scopes:**
- Click **"Add or Remove Scopes"**
- Select:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Click **"Update"** then **"Save and Continue"**

**Test users (for development):**
- Add test users if your app is in testing mode
- Click **"Add Users"** and add your email
- Click **"Save and Continue"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name: `CritXChange Web Client`

**Authorized JavaScript origins:**
- For development: `http://localhost:3000`
- For production: `https://yourdomain.com`

**Authorized redirect URIs:**
- For development: `http://localhost:3000/auth/google/callback`
- For production: `https://yourdomain.com/auth/google/callback`

5. Click **"Create"**

### 5. Copy Credentials

After creating, you'll see a popup with:
- **Client ID**: Copy this
- **Client Secret**: Copy this (click "Show" if hidden)

### 6. Configure Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**For production:**
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

### 7. Restart Your Server

```bash
npm start
# or
npm run dev
```

### 8. Test OAuth

1. Navigate to `http://localhost:3000/auth/login`
2. Click **"Continue with Google"**
3. You should be redirected to Google's login page
4. After logging in, you'll be redirected back to your app

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution:**
- Make sure the redirect URI in your `.env` matches exactly what's in Google Cloud Console
- Check for trailing slashes
- Verify the protocol (http vs https)
- Ensure the port number matches

### Error: "access_denied"

**Solution:**
- Check if your app is in testing mode and your email is in the test users list
- Verify OAuth consent screen is properly configured
- Check that required scopes are added

### Error: "invalid_client"

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces in your `.env` file
- Restart your server after changing environment variables

### OAuth Button Not Showing

**Solution:**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check server logs for any errors
- Verify passport configuration is loading correctly

## Production Checklist

- [ ] App is published (not in testing mode) or test users are added
- [ ] OAuth consent screen is verified
- [ ] Production redirect URI is configured
- [ ] HTTPS is enabled (required for production)
- [ ] Environment variables are set in production environment
- [ ] CORS is properly configured for your domain

## Security Notes

1. **Never commit** `.env` file to version control
2. **Use different credentials** for development and production
3. **Rotate secrets** periodically
4. **Monitor** OAuth usage in Google Cloud Console
5. **Set up alerts** for unusual activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

