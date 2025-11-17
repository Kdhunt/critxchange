#!/usr/bin/env node

/**
 * Authentication System Test Script
 * Tests all authentication features
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const testResults = [];

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function test(name, fn) {
    try {
        console.log(`\n🧪 Testing: ${name}`);
        const result = await fn();
        if (result.success) {
            console.log(`✅ ${name}: PASSED`);
            testResults.push({ name, status: 'PASSED', details: result.details });
        } else {
            console.log(`❌ ${name}: FAILED - ${result.error}`);
            testResults.push({ name, status: 'FAILED', error: result.error });
        }
    } catch (error) {
        console.log(`❌ ${name}: ERROR - ${error.message}`);
        testResults.push({ name, status: 'ERROR', error: error.message });
    }
}

async function runTests() {
    console.log('🚀 Starting Authentication System Tests\n');
    console.log('=' .repeat(50));

    let testToken = null;
    let testUserId = null;
    const testEmail = `test_${Date.now()}@example.com`;
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = 'TestPass123!';

    // Test 1: Registration
    await test('User Registration', async () => {
        const response = await makeRequest('POST', '/api/auth/register', {
            username: testUsername,
            email: testEmail,
            password: testPassword
        });

        if (response.status === 201 && response.data.token) {
            testToken = response.data.token;
            testUserId = response.data.user.id;
            return { success: true, details: `User created with ID: ${testUserId}` };
        }
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
    });

    // Test 2: Login
    await test('User Login', async () => {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: testEmail,
            password: testPassword
        });

        if (response.status === 200 && response.data.token) {
            testToken = response.data.token;
            return { success: true, details: 'Login successful' };
        }
        return { success: false, error: `Status: ${response.status}` };
    });

    // Test 3: Protected Route Access
    await test('Protected Route Access', async () => {
        const response = await makeRequest('GET', '/api/accounts/me', null, testToken);

        if (response.status === 200 && response.data.id === testUserId) {
            return { success: true, details: 'Protected route accessible' };
        }
        return { success: false, error: `Status: ${response.status}` };
    });

    // Test 4: Invalid Credentials
    await test('Invalid Login Credentials', async () => {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: testEmail,
            password: 'wrongpassword'
        });

        if (response.status === 401) {
            return { success: true, details: 'Correctly rejected invalid credentials' };
        }
        return { success: false, error: `Expected 401, got ${response.status}` };
    });

    // Test 5: Password Reset Request
    await test('Password Reset Request', async () => {
        const response = await makeRequest('POST', '/api/auth/forgot-password', {
            email: testEmail
        });

        if (response.status === 200) {
            return { success: true, details: 'Password reset request accepted' };
        }
        return { success: false, error: `Status: ${response.status}` };
    });

    // Test 6: MFA Setup
    await test('MFA Setup', async () => {
        const response = await makeRequest('POST', '/api/auth/setup-mfa', null, testToken);

        if (response.status === 200 && response.data.secret && response.data.qrCode) {
            return { success: true, details: 'MFA secret and QR code generated' };
        }
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
    });

    // Test 7: Unauthorized Access
    await test('Unauthorized Access Protection', async () => {
        const response = await makeRequest('GET', '/api/accounts/me');

        if (response.status === 401) {
            return { success: true, details: 'Correctly blocked unauthorized access' };
        }
        return { success: false, error: `Expected 401, got ${response.status}` };
    });

    // Test 8: Duplicate Registration
    await test('Duplicate Registration Prevention', async () => {
        const response = await makeRequest('POST', '/api/auth/register', {
            username: testUsername,
            email: testEmail,
            password: testPassword
        });

        if (response.status === 409) {
            return { success: true, details: 'Correctly prevented duplicate registration' };
        }
        return { success: false, error: `Expected 409, got ${response.status}` };
    });

    // Print Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary\n');
    
    const passed = testResults.filter(t => t.status === 'PASSED').length;
    const failed = testResults.filter(t => t.status === 'FAILED').length;
    const errors = testResults.filter(t => t.status === 'ERROR').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log(`📈 Total: ${testResults.length}`);

    if (failed > 0 || errors > 0) {
        console.log('\n❌ Failed Tests:');
        testResults
            .filter(t => t.status !== 'PASSED')
            .forEach(t => {
                console.log(`  - ${t.name}: ${t.error || 'Unknown error'}`);
            });
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

