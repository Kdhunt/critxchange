/**
 * Login Form Handler
 * Handles user login form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) {
        console.error('Login form not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    const mfaGroup = document.getElementById('mfaGroup');
    let requiresMFA = false;
    let tempToken = null;

    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }

    const handleLogin = async () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });

        // Client-side validation
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            const errorMsg = 'Please enter a valid email address';
            showToast(errorMsg, 'error');
            document.getElementById('emailError').textContent = errorMsg;
            document.getElementById('emailError').classList.add('show');
            return;
        }

        if (!data.password) {
            const errorMsg = 'Please enter your password';
            showToast(errorMsg, 'error');
            document.getElementById('passwordError').textContent = errorMsg;
            document.getElementById('passwordError').classList.add('show');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            let response;
            let result;

            if (requiresMFA && tempToken) {
                // Verify MFA code
                submitBtn.textContent = 'Verifying...';
                response = await fetch('/api/auth/verify-mfa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: tempToken,
                        code: data.mfaCode
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
                    throw new Error(errorData.error || 'Invalid verification code');
                }

                result = await response.json();
            } else {
                // Initial login
                response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: data.email,
                        password: data.password
                    })
                });

                // Parse response
                result = await response.json().catch(() => {
                    throw new Error('Invalid response from server');
                });

                if (response.status === 200 && result.requiresMFA) {
                    requiresMFA = true;
                    tempToken = result.tempToken;
                    mfaGroup.classList.add('show');
                    document.getElementById('mfaCode').focus();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Verify Code';
                    showToast('Please enter your MFA code', 'success');
                    return;
                }

                // Check for errors
                if (!response.ok) {
                    throw new Error(result.error || 'Login failed');
                }
            }

            // Success - redirect to dashboard
            if (response.ok && result.token) {
                // Store token and user info
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Set cookie for server-side access
                document.cookie = `token=${result.token}; path=/; max-age=${24 * 60 * 60}`;

                // Show success toast
                showToast('Login successful! Redirecting...', 'success');

                // Redirect to dashboard after brief delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);

            // Show error toast
            const errorMessage = error.message || 'An error occurred. Please try again.';
            showToast(errorMessage, 'error');

            // Also show in form field
            const errorField = errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid') ? 'passwordError' : 'emailError';
            if (requiresMFA) {
                document.getElementById('mfaError').textContent = errorMessage;
                document.getElementById('mfaError').classList.add('show');
            } else {
                document.getElementById(errorField).textContent = errorMessage;
                document.getElementById(errorField).classList.add('show');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    };

    // Attach click handler to button
    try {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleLogin().catch((err) => {
                console.error('Error in handleLogin:', err);
            });
        });

        // Also handle Enter key in form fields
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !submitBtn.disabled) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                handleLogin().catch((err) => {
                    console.error('Error in handleLogin:', err);
                });
            }
        });
    } catch (error) {
        console.error('Error attaching event handlers:', error);
    }

    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
        const errorMessages = {
            'session_expired': 'Your session has expired. Please login again.',
            'account_not_found': 'Account not found. Please try again.',
            'oauth_failed': 'OAuth authentication failed. Please try again.',
            'dashboard_error': 'Error loading dashboard. Please try again.'
        };
        showToast(errorMessages[errorParam] || 'An error occurred', 'error');
    }
});

