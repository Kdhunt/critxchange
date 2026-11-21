/**
 * Reset Password Form Handler
 * Handles password reset form submission
 * Uses modern ES6+ practices: destructuring, optional chaining, nullish coalescing
 */

const MIN_PASSWORD_LENGTH = 6;
const STRONG_PASSWORD_LENGTH = 8;

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {string} - 'weak', 'medium', or 'strong'
 */
const getPasswordStrength = (password) => {
    if (!password) return 'weak';
    if (password.length >= STRONG_PASSWORD_LENGTH
        && /[A-Z]/.test(password)
        && /[a-z]/.test(password)
        && /[0-9]/.test(password)) {
        return 'strong';
    }
    if (password.length >= MIN_PASSWORD_LENGTH) {
        return 'medium';
    }
    return 'weak';
};

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
 * Redirects to a URL after a delay
 * @param {string} url - The URL to redirect to
 * @param {number} delay - Delay in milliseconds
 */
const redirectAfterDelay = (url, delay = 1000) => {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrength');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !submitBtn) {
        console.error('Required form elements not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    // Password strength indicator
    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', ({ target }) => {
            const strength = getPasswordStrength(target.value);
            strengthBar.className = `password-strength-bar password-strength-${strength}`;
        });
    }

    /**
     * Handles reset password form submission
     */
    const handleResetPassword = async () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const { token, password, confirmPassword } = data;

        clearFormErrors();

        // Client-side validation
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            showFieldError('passwordError', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showFieldError('confirmPasswordError', 'Passwords do not match');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting Password...';

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok) {
                showToast('Password reset successfully! Redirecting to login...', 'success');
                redirectAfterDelay('/auth/login');
            } else {
                const errorMsg = result.error ?? 'Password reset failed';
                const errorField = errorMsg.toLowerCase().includes('password')
                    ? 'passwordError' : 'confirmPasswordError';
                showFieldError(errorField, errorMsg);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
            }
        } catch (error) {
            const errorMsg = error.message ?? 'An error occurred. Please try again.';
            showFieldError('passwordError', errorMsg);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    };

    // Attach event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleResetPassword().catch((err) => {
            console.error('Error in handleResetPassword:', err);
        });
    };

    submitBtn.addEventListener('click', handleSubmit);

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            handleSubmit(e);
        }
    });
});
