/**
 * MFA Verification Form Handler
 * Handles MFA code verification form submission
 * Uses modern ES6+ practices: destructuring, optional chaining, nullish coalescing
 */

const MFA_CODE_LENGTH = 6;

/**
 * Clears form errors
 * @param {HTMLElement} mfaError - The MFA error element
 */
const clearError = (mfaError) => {
    mfaError?.classList.remove('show');
};

/**
 * Shows an error message
 * @param {HTMLElement} mfaError - The MFA error element
 * @param {string} message - The error message
 */
const showError = (mfaError, message) => {
    if (mfaError) {
        mfaError.textContent = message;
        mfaError.classList.add('show');
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
    const form = document.getElementById('verifyMfaForm');
    const codeInput = document.getElementById('mfaCode');
    const mfaError = document.getElementById('mfaError');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !submitBtn) {
        console.error('Required form elements not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    /**
     * Handles MFA verification form submission
     */
    const handleVerifyMFA = async () => {
        const code = codeInput?.value ?? '';

        if (code.length !== MFA_CODE_LENGTH) {
            showError(mfaError, 'Please enter a 6-digit code');
            return;
        }

        clearError(mfaError);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        try {
            // Get temp token from session
            const tokenResponse = await fetch('/auth/temp-token');
            if (!tokenResponse.ok) {
                showError(mfaError, 'Session expired. Please login again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify';
                return;
            }

            const { token: tempToken } = await tokenResponse.json();

            // Verify MFA code
            const response = await fetch('/api/auth/verify-mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tempToken, code }),
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok && result.token) {
                storeAuthData(result.token, result.user);
                showToast('Verification successful! Redirecting...', 'success');
                redirectAfterDelay('/dashboard');
            } else {
                const errorMsg = result.error ?? 'Invalid code. Please try again.';
                showError(mfaError, errorMsg);
                codeInput.value = '';
                codeInput.focus();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify';
            }
        } catch (error) {
            const errorMsg = error.message ?? 'An error occurred. Please try again.';
            showError(mfaError, errorMsg);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    };

    // Attach event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleVerifyMFA().catch((err) => {
            console.error('Error in handleVerifyMFA:', err);
        });
    };

    submitBtn.addEventListener('click', handleSubmit);

    // Auto-submit when 6 digits are entered
    if (codeInput) {
        codeInput.addEventListener('input', ({ target }) => {
            target.value = target.value.replace(/\D/g, ''); // Only numbers
            if (target.value.length === MFA_CODE_LENGTH) {
                handleVerifyMFA();
            }
        });
    }

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            handleSubmit(e);
        }
    });
});
