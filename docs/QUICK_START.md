# Quick Start Guide

Get up and running with CritXChange in minutes!

## 🚀 Fastest Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
```bash
cp env.example .env
```

Edit `.env` and set at minimum:
```env
JWT_SECRET=your_random_secret_here_min_32_chars
SESSION_SECRET=another_random_secret_here
PORT=3000
```

### 3. Start Server
```bash
npm start
```

### 4. Test It!
- Visit: http://localhost:3000
- Register: http://localhost:3000/auth/register
- Login: http://localhost:3000/auth/login

**That's it!** You now have a working authentication system.

## 🧪 Run Tests

```bash
# Test all authentication features
npm run test:auth

# Test MFA flow end-to-end
npm run test:mfa
```

## 📚 Next Steps

### Add OAuth (Optional)
See [docs/OAUTH_SETUP.md](OAUTH_SETUP.md) for Google OAuth setup.

### Add Email (Optional)
See [docs/SMTP_SETUP.md](SMTP_SETUP.md) for password reset emails.

### Deploy to Production
See [docs/PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for deployment guide.

## 📖 Documentation

- **README.md** - Main project documentation
- **SETUP.md** - Detailed setup instructions
- **docs/OAUTH_SETUP.md** - Google OAuth configuration
- **docs/SMTP_SETUP.md** - Email configuration
- **docs/PRODUCTION_DEPLOYMENT.md** - Production deployment
- **TEST_RESULTS.md** - Test results and verification

## 🎯 Features Available

✅ User Registration  
✅ User Login  
✅ Password Reset  
✅ MFA (Multi-Factor Authentication)  
✅ OAuth (Google) - when configured  
✅ Protected API Routes  
✅ Session Management  

## 🆘 Need Help?

1. Check [SETUP.md](../SETUP.md) for detailed instructions
2. Review [TEST_RESULTS.md](../TEST_RESULTS.md) to verify features
3. Check server logs for errors
4. Ensure all environment variables are set

## ✨ Quick Commands

```bash
# Development
npm run dev          # Start with auto-reload

# Testing
npm run test:auth    # Run authentication tests
npm run test:mfa     # Test MFA flow

# Database
npm run migrate      # Run database migrations

# Production
npm start            # Start production server
```

Happy coding! 🎉

