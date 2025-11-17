# Testing Documentation

## Test Suite Overview

The CritXChange authentication system includes comprehensive test coverage for all authentication functions and validations.

## Test Structure

### Jest Test Suites

Located in `backend/tests/`:

1. **auth.test.js** - Authentication API tests (40+ tests)
   - User registration
   - User login
   - MFA setup, enable, disable, verification
   - Password reset flow
   - JWT token validation

2. **validation.test.js** - Input validation tests (8 tests)
   - Email format validation
   - Password strength validation
   - Username validation
   - Required fields validation
   - MFA code format validation

3. **account.test.js** - Account management tests (8 tests)
   - Account CRUD operations
   - Authentication requirements
   - Authorization checks
   - Password exclusion from responses

4. **app.test.js** - Application tests (1 test)
   - Basic route testing

### Standalone Test Scripts

Located in `scripts/`:

1. **test-auth.js** - End-to-end authentication flow tests
   - Registration → Login → Protected routes
   - Error handling
   - Security checks

2. **test-mfa-flow.js** - Complete MFA flow tests
   - Setup → Enable → Login with MFA → Disable

## Running Tests

### All Tests

```bash
# Run all Jest tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run all tests (Jest + standalone)
npm run test:all
```

### CI/CD Tests

```bash
# Run tests in CI mode (with coverage, optimized for CI)
npm run test:ci
```

### Individual Test Suites

```bash
# Authentication tests only
npm test -- auth.test.js

# Validation tests only
npm test -- validation.test.js

# Account tests only
npm test -- account.test.js
```

### Standalone Scripts

```bash
# Authentication flow tests
npm run test:auth

# MFA flow tests
npm run test:mfa
```

## Build Process Integration

### Build Command

The build process automatically runs all tests:

```bash
npm run build
```

This command:
1. Runs Jest tests with CI configuration
2. Generates coverage reports
3. Validates all authentication functions
4. Fails if any test fails

### Pre-commit Hook

The `precommit` script runs tests before commits:

```bash
npm run precommit
```

This ensures code quality before committing.

### CI/CD Integration

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Runs on push and pull requests
- Tests on Node.js 18.x and 20.x
- Runs all test suites
- Generates coverage reports
- Validates build process

## Test Coverage

Current coverage: **66%** (target: 80%+)

### Coverage by Module

- **Models**: 100%
- **Middleware**: 79%
- **Routes**: 71%
- **Config**: 26% (OAuth optional)

### Coverage Reports

Coverage reports are generated in:
- `coverage/lcov.info` - LCOV format
- `coverage/index.html` - HTML report

View HTML report:
```bash
open coverage/index.html
```

## Test Categories

### 1. Authentication Tests

**Registration:**
- ✅ Valid registration
- ✅ Missing fields validation
- ✅ Invalid email format
- ✅ Short password rejection
- ✅ Duplicate email/username prevention
- ✅ Password hashing verification

**Login:**
- ✅ Valid credentials
- ✅ Missing fields
- ✅ Invalid credentials
- ✅ MFA requirement when enabled

**MFA:**
- ✅ Setup (secret + QR code generation)
- ✅ Enable with verification
- ✅ Disable with verification
- ✅ Login flow with MFA
- ✅ Code verification
- ✅ Invalid code rejection

**Password Reset:**
- ✅ Reset request
- ✅ Token generation
- ✅ Token validation
- ✅ Token expiration
- ✅ Password update
- ✅ Token cleanup

### 2. Validation Tests

- ✅ Email format validation
- ✅ Password length validation
- ✅ Username validation
- ✅ Required fields validation
- ✅ MFA code format validation

### 3. Security Tests

- ✅ Password exclusion from responses
- ✅ Authentication requirements
- ✅ Authorization checks (own account only)
- ✅ JWT token validation
- ✅ Invalid token rejection
- ✅ Missing token rejection

## Test Environment

Tests run in isolated environment:
- Separate test database (SQLite in-memory)
- Test-specific environment variables
- Automatic cleanup between tests
- No side effects on development data

## Writing New Tests

### Test Template

```javascript
const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Feature Name', () => {
    it('should do something', async () => {
        const res = await request(app)
            .post('/api/endpoint')
            .send({ data: 'value' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('expected');
    });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeAll`/`afterAll` for setup/teardown
3. **Assertions**: Test both success and failure cases
4. **Security**: Always test authentication/authorization
5. **Validation**: Test input validation thoroughly

## Continuous Integration

Tests automatically run:
- On every push to main/develop
- On pull requests
- Before deployment
- In CI/CD pipeline

## Test Results

### Current Status

✅ **55 tests passing**
- Authentication: 40 tests
- Validation: 8 tests
- Account: 8 tests
- App: 1 test

### Test Performance

- Average test suite time: ~8 seconds
- Individual test: < 500ms average
- Total test time: ~8-10 seconds

## Troubleshooting

### Tests Failing Locally

1. Check environment variables are set
2. Ensure database is clean
3. Run `npm install` to update dependencies
4. Check for port conflicts

### Coverage Issues

1. Run `npm run test:coverage` to see detailed coverage
2. Check uncovered lines in report
3. Add tests for uncovered code paths

### CI Failures

1. Check GitHub Actions logs
2. Verify environment variables in CI
3. Ensure all dependencies are in package.json
4. Check Node.js version compatibility

## Next Steps

- [ ] Increase coverage to 80%+
- [ ] Add integration tests for complete user flows
- [ ] Add performance tests
- [ ] Add security penetration tests
- [ ] Add load testing

