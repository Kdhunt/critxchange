# CritXChange

A modern, secure authentication platform with comprehensive features including registration, login, password reset, OAuth integration, and multi-factor authentication (MFA).

## Features

### 🔐 Authentication
- **User Registration** - Secure account creation with validation
- **Login System** - Email/password authentication with JWT tokens
- **Password Reset** - Token-based password reset via email
- **OAuth Integration** - Google OAuth 2.0 support
- **Multi-Factor Authentication** - TOTP-based MFA with QR code setup

### 🛡️ Security
- JWT-based authentication
- Password hashing with bcrypt
- MFA support for enhanced security
- Session management
- Protected API routes
- Input validation and sanitization

### 🎨 User Interface
- Modern, responsive design
- Beautiful authentication pages
- Mobile-friendly navigation
- Real-time form validation
- Password strength indicators
- Account administration center for managing profile, credentials, and account lifecycle events

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- (Optional) PostgreSQL for production
- (Optional) Google OAuth credentials
- (Optional) SMTP server for email

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd critxchange-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

5. **Access the application**
   - Home: http://localhost:3000
   - Register: http://localhost:3000/auth/register
   - Login: http://localhost:3000/auth/login

## Configuration

### Required Environment Variables

```env
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
PORT=3000
```

### Optional Environment Variables

**Google OAuth:**
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Email (Password Reset):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Database:**
```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
# OR
DB_NAME=dbname
DB_USERNAME=username
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres
```

See [SETUP.md](SETUP.md) for detailed configuration instructions.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new account | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/verify-mfa` | Verify MFA code | No (temp token) |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No (token) |

### MFA Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/setup-mfa` | Generate MFA secret & QR code | Yes |
| POST | `/api/auth/enable-mfa` | Enable MFA | Yes |
| POST | `/api/auth/disable-mfa` | Disable MFA | Yes |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |

### Account Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/accounts/me` | Get current user | Yes |
| GET | `/api/accounts` | Get all accounts | Yes |
| GET | `/api/accounts/:id` | Get account by ID | Yes |
| PUT | `/api/accounts/:id` | Update account | Yes (own account) |
| DELETE | `/api/accounts/:id` | Delete account | Yes (own account) |

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Or run the authentication tests specifically:

```bash
node scripts/test-auth.js
```

## Project Structure

```
critxchange-1/
├── backend/
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
│   ├── config/
│   │   └── passport.js     # OAuth configuration
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── validation.js   # Input validation
│   ├── models/
│   │   ├── account.js      # Account model
│   │   └── index.js       # Sequelize setup
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── account.js     # Account management routes
│   │   └── api.js         # API routes
│   ├── views/
│   │   ├── auth/         # Authentication pages
│   │   ├── components/   # Reusable components
│   │   ├── layouts/      # Layout templates
│   │   └── partials/     # Partial templates
│   └── public/
│       └── css/
│           └── style.css # Styles
├── migrations/            # Database migrations
├── scripts/              # Utility scripts
├── .env                  # Environment variables (not in git)
├── env.example           # Environment variables template
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restarts on file changes.

### Database Migrations

In development, the database auto-syncs. For production:

```bash
npm run migrate
```

### Code Quality

- ESLint configuration (if added)
- Prettier formatting (if added)
- Jest for testing

## Security Considerations

- ✅ Passwords are hashed using bcrypt
- ✅ JWT tokens with expiration
- ✅ MFA support for enhanced security
- ✅ Protected routes require authentication
- ✅ Input validation on all endpoints
- ✅ Password reset tokens expire after 1 hour
- ✅ Session management for OAuth flows
- ⚠️ Configure CORS properly for production
- ⚠️ Use HTTPS in production
- ⚠️ Set strong secrets for JWT and sessions
- ⚠️ Configure rate limiting for production

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Run migrations: `npm run migrate`
4. Set strong secrets for JWT and sessions
5. Configure CORS and security headers
6. Set up HTTPS
7. Configure email service for password resets
8. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

ISC

## Support

For setup help, see [SETUP.md](SETUP.md)

For code evaluation, see [CODE_EVALUATION.md](CODE_EVALUATION.md)
