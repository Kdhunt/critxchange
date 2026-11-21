# Dashboard Documentation

## Overview

The dashboard is a protected page that users are redirected to after successful login. It provides an overview of the user's account and quick access to account management features.

## Access

**URL:** `/dashboard`

**Authentication:** Required (redirects to login if not authenticated)

**Redirect Flow:**
1. User logs in successfully → Redirected to `/dashboard`
2. User registers successfully → Redirected to `/dashboard`
3. User completes MFA verification → Redirected to `/dashboard`
4. User completes OAuth login → Redirected to `/dashboard`

## Features

### Dashboard Cards

1. **Profile Card**
   - View and edit profile information
   - Link to account settings

2. **Security Card**
   - MFA status indicator
   - Security settings access

3. **Account Settings Card**
   - Update account preferences
   - Manage account details

4. **Activity Card**
   - Account activity overview
   - (Coming soon)

### Account Information Panel

Displays:
- Email address
- Username
- Member since date
- MFA status (Enabled/Disabled)

## Authentication

The dashboard uses the `requireAuth` middleware which:
- Checks for JWT token in cookies, session, or query params
- Verifies token validity
- Fetches user data from database
- Redirects to login if not authenticated

## User Interface

### Header Updates

When logged in, the header shows:
- Dashboard link (active when on dashboard)
- Username display
- Logout button

When not logged in, the header shows:
- Login button
- Sign Up button

### Logout Functionality

Clicking the logout button:
1. Calls `/api/dashboard/logout` endpoint
2. Clears token from localStorage
3. Clears token cookie
4. Destroys session
5. Redirects to home page

## Token Management

Tokens are stored in multiple places for reliability:
- **Cookie**: For server-side access (httpOnly: false for client access)
- **Session**: For server-side session management
- **localStorage**: For client-side JavaScript access

## Redirect Handling

### After Login

All successful login flows redirect to dashboard:
- Email/password login
- OAuth login (Google)
- MFA verification
- Registration

### Redirect Parameter

If user tries to access dashboard without being logged in:
- Redirected to: `/auth/login?redirect=/dashboard`
- After login, can redirect back to original destination

## Security

- Dashboard route is protected by `requireAuth` middleware
- Invalid or expired tokens redirect to login
- User data is fetched fresh from database on each request
- Passwords and sensitive data excluded from user object

## Customization

### Adding Dashboard Cards

Edit `backend/views/components/dashboard-body.ejs`:

```ejs
<div class="dashboard-card">
    <div class="card-icon">
        <!-- Your icon SVG -->
    </div>
    <h3 class="card-title">Your Feature</h3>
    <p class="card-description">Description</p>
    <a href="/your-link" class="card-link">Action →</a>
</div>
```

### Styling

Dashboard styles are in `backend/public/css/style.css`:
- `.dashboard-section` - Main container
- `.dashboard-card` - Individual cards
- `.info-card` - Account information panel

## Testing

To test dashboard access:

1. **Login and redirect:**
   ```bash
   # Login via API
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   
   # Use token to access dashboard
   curl http://localhost:3000/dashboard?token=YOUR_TOKEN
   ```

2. **Protected route test:**
   ```bash
   # Should redirect to login
   curl http://localhost:3000/dashboard
   ```

## Troubleshooting

### Dashboard redirects to login immediately

**Possible causes:**
- Token expired
- Token not in cookie/session
- Invalid token format

**Solutions:**
- Check browser cookies
- Verify token is being set after login
- Check server logs for authentication errors

### User info not showing

**Possible causes:**
- User object not passed to view
- Database query failing

**Solutions:**
- Check `req.user` in dashboard route
- Verify database connection
- Check middleware is attaching user correctly

### Logout not working

**Possible causes:**
- Cookie not clearing
- Session not destroying
- JavaScript error

**Solutions:**
- Check browser console for errors
- Verify logout endpoint is accessible
- Check cookie settings (path, domain)

