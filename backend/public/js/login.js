/**
 * Login Form Handler
 * Handles user login form submission with MFA support
 * Uses modern ES6+ practices: destructuring, optional chaining, nullish coalescing
 */

const ERROR_MESSAGES = {
    session_expired: 'Your session has expired. Please login again.',
    account_not_found: 'Account not found. Please try again.',
    oauth_failed: 'OAuth authentication failed. Please try again.',
    oauth_not_configured: 'Google OAuth is not configured. Please use email/password login.',
    dashboard_error: 'Error loading dashboard. Please try again.',
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Clears all form errors
 */
const clearFormErrors = () => {
    document.querySelectorAll('.form-error').forEach((el) => {
        el.classList.remove('show');
        el.textContent = '';
    });
};

/**
 * Shows an error message for a specific field
 * @param {string} fieldId - The ID of the error field
 * @param {string} message - The error message
 */
const showFieldError = (fieldId, message) => {
    const errorField = document.getElementById(fieldId);
    if (errorField) {
        errorField.textContent = message;
        errorField.classList.add('show');
    }
    showToast(message, 'error');
};

/**
 * Stores authentication data
 * @param {string} token - The JWT token
 * @param {Object} user - The user object
 */
const storeAuthData = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`;
};

/**
 * Redirects to a URL after a delay
 * @param {string} url - The URL to redirect to
 * @param {number} delay - Delay in milliseconds
 */
const redirectAfterDelay = (url, delay = 500) => {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const mfaGroup = document.getElementById('mfaGroup');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !submitBtn) {
        console.error('Required form elements not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    let requiresMFA = false;
    let tempToken = null;

    /**
     * Handles login form submission
     */
    const handleLogin = async () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const { email, password, mfaCode } = data;

        clearFormErrors();

        // Client-side validation
        if (!email || !isValidEmail(email)) {
            showFieldError('emailError', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            showFieldError('passwordError', 'Please enter your password');
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
                    body: JSON.stringify({ token: tempToken, code: mfaCode }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
                    throw new Error(errorData.error ?? 'Invalid verification code');
                }

                result = await response.json();
            } else {
                // Initial login
                response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                result = await response.json().catch(() => {
                    throw new Error('Invalid response from server');
                });

                if (response.status === 200 && result.requiresMFA) {
                    requiresMFA = true;
                    tempToken = result.tempToken;
                    mfaGroup?.classList.add('show');
                    document.getElementById('mfaCode')?.focus();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Verify Code';
                    showToast('Please enter your MFA code', 'success');
                    return;
                }

                if (!response.ok) {
                    throw new Error(result.error ?? 'Login failed');
                }
            }

            // Success - redirect to dashboard
            if (response.ok && result.token) {
                storeAuthData(result.token, result.user);
                showToast('Login successful! Redirecting...', 'success');
                redirectAfterDelay('/dashboard');
            } else {
                throw new Error(result.error ?? 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);

            const errorMessage = error.message ?? 'An error occurred. Please try again.';
            const errorField = errorMessage.toLowerCase().includes('password')
                || errorMessage.toLowerCase().includes('invalid')
                ? 'passwordError' : 'emailError';

            if (requiresMFA) {
                showFieldError('mfaError', errorMessage);
            } else {
                showFieldError(errorField, errorMessage);
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    };

    // Attach event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleLogin().catch((err) => {
            console.error('Error in handleLogin:', err);
        });
    };

    submitBtn.addEventListener('click', handleSubmit);

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            handleSubmit(e);
        }
    });

    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam && ERROR_MESSAGES[errorParam]) {
        showToast(ERROR_MESSAGES[errorParam], 'error');
    }
});
