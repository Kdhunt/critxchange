# Setup Guide for CritXChange

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Copy `env.example` to `.env` and update with your values:
   ```bash
   cp env.example .env
   ```
   
   Required variables:
   - `JWT_SECRET` - Secret key for JWT tokens (use a strong random string)
   - `SESSION_SECRET` - Secret for session management (can be same as JWT_SECRET)
   - `PORT` - Server port (default: 3000)
   
   Optional (for OAuth):
   - `GOOGLE_CLIENT_ID` - Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `GOOGLE_CALLBACK_URL` - OAuth callback URL (default: http://localhost:3000/auth/google/callback)
   
   Optional (for Password Reset Emails):
   - `SMTP_HOST` - SMTP server host (default: smtp.gmail.com)
   - `SMTP_PORT` - SMTP port (default: 587)
   - `SMTP_USER` - SMTP username/email
   - `SMTP_PASS` - SMTP password/app password

3. **Database Setup**
   
   The app uses SQLite in-memory database by default in development. For production:
   - Set `DATABASE_URL` or configure `DB_*` environment variables
   - Run migrations: `npm run migrate`

4. **Start the Server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - Application name: CritXChange
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Email Configuration (Password Reset)

### Gmail Setup:
1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → App passwords
   - Generate password for "Mail"
3. Use your Gmail address as `SMTP_USER` and the app password as `SMTP_PASS`

### Other Email Providers:
Update `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `.env`

## Testing the Application

### 1. Test Registration
- Navigate to `http://localhost:3000/auth/register`
- Fill in the form and submit
- Should redirect to home page with token stored

### 2. Test Login
- Navigate to `http://localhost:3000/auth/login`
- Use registered credentials
- If MFA is enabled, you'll be prompted for code

### 3. Test Password Reset
- Click "Forgot password" on login page
- Enter email address
- Check email (or console logs in dev mode) for reset link
- Click link and set new password

### 4. Test OAuth (if configured)
- Click "Continue with Google" on login/register page
- Complete Google authentication
- Should redirect back to app

### 5. Test MFA Setup
1. Login to your account
2. Call `POST /api/auth/setup-mfa` with your JWT token
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Call `POST /api/auth/enable-mfa` with verification code
5. Logout and login again - you'll be prompted for MFA code

## API Endpoints

### Authentication
- `GET /auth/login` - Login page
- `GET /auth/register` - Registration page
- `GET /auth/forgot-password` - Forgot password page
- `GET /auth/reset-password?token=...` - Reset password page
- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### MFA Management (Protected)
- `POST /api/auth/setup-mfa` - Generate MFA secret and QR code
- `POST /api/auth/enable-mfa` - Enable MFA
- `POST /api/auth/disable-mfa` - Disable MFA

### OAuth
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback

## Development Notes

- Database auto-syncs in development mode
- Password reset tokens are logged to console in dev mode (if SMTP not configured)
- Use `npm run dev` for auto-reload during development
- Check browser console for any JavaScript errors

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use proper database (PostgreSQL recommended)
3. Run migrations: `npm run migrate`
4. Configure secure session storage
5. Use HTTPS
6. Set strong secrets for JWT_SECRET and SESSION_SECRET
7. Configure proper CORS settings
8. Set up email service for password resets

