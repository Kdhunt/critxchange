#!/usr/bin/env node

/**
 * MFA End-to-End Flow Test
 * Tests complete MFA setup, enable, and login flow
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const speakeasy = require('speakeasy');

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

async function testMFAFlow() {
    console.log('🔐 Testing MFA End-to-End Flow\n');
    console.log('='.repeat(50));

    const testEmail = `mfatest_${Date.now()}@example.com`;
    const testUsername = `mfatest_${Date.now()}`;
    const testPassword = 'TestPass123!';

    let token = null;
    let mfaSecret = null;

    try {
        // Step 1: Register a new user
        console.log('\n📝 Step 1: Registering new user...');
        const registerResponse = await makeRequest('POST', '/api/auth/register', {
            username: testUsername,
            email: testEmail,
            password: testPassword
        });

        if (registerResponse.status !== 201) {
            throw new Error(`Registration failed: ${JSON.stringify(registerResponse.data)}`);
        }
        token = registerResponse.data.token;
        console.log('✅ User registered successfully');

        // Step 2: Setup MFA
        console.log('\n🔑 Step 2: Setting up MFA...');
        const setupResponse = await makeRequest('POST', '/api/auth/setup-mfa', null, token);

        if (setupResponse.status !== 200 || !setupResponse.data.secret) {
            throw new Error(`MFA setup failed: ${JSON.stringify(setupResponse.data)}`);
        }
        mfaSecret = setupResponse.data.secret;
        console.log('✅ MFA secret generated');
        console.log(`   Secret: ${mfaSecret.substring(0, 10)}...`);
        console.log(`   QR Code: ${setupResponse.data.qrCode ? 'Generated ✓' : 'Missing ✗'}`);

        // Step 3: Generate TOTP code
        console.log('\n🔢 Step 3: Generating TOTP code...');
        const totpCode = speakeasy.totp({
            secret: mfaSecret,
            encoding: 'base32'
        });
        console.log(`✅ TOTP code generated: ${totpCode}`);

        // Step 4: Enable MFA
        console.log('\n✅ Step 4: Enabling MFA with verification code...');
        const enableResponse = await makeRequest('POST', '/api/auth/enable-mfa', {
            code: totpCode
        }, token);

        if (enableResponse.status !== 200) {
            throw new Error(`MFA enable failed: ${JSON.stringify(enableResponse.data)}`);
        }
        console.log('✅ MFA enabled successfully');

        // Step 5: Try to login (should require MFA)
        console.log('\n🔐 Step 5: Attempting login (should require MFA)...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            email: testEmail,
            password: testPassword
        });

        if (loginResponse.status !== 200 || !loginResponse.data.requiresMFA) {
            throw new Error(`Login should require MFA: ${JSON.stringify(loginResponse.data)}`);
        }
        const tempToken = loginResponse.data.tempToken;
        console.log('✅ Login correctly requires MFA');
        console.log(`   Temp token received: ${tempToken.substring(0, 20)}...`);

        // Step 6: Generate new TOTP code for verification
        console.log('\n🔢 Step 6: Generating new TOTP code for verification...');
        const verifyCode = speakeasy.totp({
            secret: mfaSecret,
            encoding: 'base32'
        });
        console.log(`✅ TOTP code generated: ${verifyCode}`);

        // Step 7: Verify MFA code
        console.log('\n✅ Step 7: Verifying MFA code...');
        const verifyResponse = await makeRequest('POST', '/api/auth/verify-mfa', {
            token: tempToken,
            code: verifyCode
        });

        if (verifyResponse.status !== 200 || !verifyResponse.data.token) {
            throw new Error(`MFA verification failed: ${JSON.stringify(verifyResponse.data)}`);
        }
        const finalToken = verifyResponse.data.token;
        console.log('✅ MFA verification successful');
        console.log(`   Final token received: ${finalToken.substring(0, 20)}...`);

        // Step 8: Verify final token works
        console.log('\n🔒 Step 8: Verifying final token works...');
        const meResponse = await makeRequest('GET', '/api/accounts/me', null, finalToken);

        if (meResponse.status !== 200 || meResponse.data.email !== testEmail) {
            throw new Error(`Token verification failed: ${JSON.stringify(meResponse.data)}`);
        }
        console.log('✅ Final token works correctly');
        console.log(`   User: ${meResponse.data.username} (${meResponse.data.email})`);
        console.log(`   MFA Enabled: ${meResponse.data.mfaEnabled}`);

        // Step 9: Test disabling MFA
        console.log('\n🔓 Step 9: Testing MFA disable...');
        const disableCode = speakeasy.totp({
            secret: mfaSecret,
            encoding: 'base32'
        });
        const disableResponse = await makeRequest('POST', '/api/auth/disable-mfa', {
            code: disableCode
        }, finalToken);

        if (disableResponse.status !== 200) {
            throw new Error(`MFA disable failed: ${JSON.stringify(disableResponse.data)}`);
        }
        console.log('✅ MFA disabled successfully');

        // Step 10: Verify login no longer requires MFA
        console.log('\n🔐 Step 10: Verifying login no longer requires MFA...');
        const finalLoginResponse = await makeRequest('POST', '/api/auth/login', {
            email: testEmail,
            password: testPassword
        });

        if (finalLoginResponse.status !== 200 || finalLoginResponse.data.requiresMFA) {
            throw new Error(`Login should not require MFA after disable: ${JSON.stringify(finalLoginResponse.data)}`);
        }
        console.log('✅ Login no longer requires MFA');

        console.log('\n' + '='.repeat(50));
        console.log('\n🎉 All MFA flow tests passed!\n');
        console.log('✅ MFA Setup');
        console.log('✅ MFA Enable');
        console.log('✅ Login with MFA');
        console.log('✅ MFA Verification');
        console.log('✅ MFA Disable');
        console.log('\n🔐 MFA system is fully functional!\n');

    } catch (error) {
        console.error('\n❌ MFA Flow Test Failed:');
        console.error(`   Error: ${error.message}`);
        console.error('\n' + '='.repeat(50));
        process.exit(1);
    }
}

testMFAFlow();

