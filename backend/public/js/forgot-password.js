/**
 * Forgot Password Form Handler
 * Handles password reset request form submission
 * Uses modern ES6+ practices: destructuring, optional chaining, nullish coalescing
 */

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Clears form messages
 * @param {HTMLElement} emailError - The email error element
 * @param {HTMLElement} successMessage - The success message element
 */
const clearMessages = (emailError, successMessage) => {
    emailError?.classList.remove('show');
    successMessage?.classList.remove('show');
};

/**
 * Shows an error message
 * @param {HTMLElement} emailError - The email error element
 * @param {string} message - The error message
 */
const showError = (emailError, message) => {
    if (emailError) {
        emailError.textContent = message;
        emailError.classList.add('show');
    }
    showToast(message, 'error');
};

/**
 * Shows a success message
 * @param {HTMLElement} successMessage - The success message element
 * @param {string} message - The success message
 */
const showSuccess = (successMessage, message) => {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
    }
    showToast(message, 'success');
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !submitBtn) {
        console.error('Required form elements not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    /**
     * Handles forgot password form submission
     */
    const handleForgotPassword = async () => {
        const email = emailInput?.value ?? '';

        clearMessages(emailError, successMessage);

        // Validation
        if (!email || !isValidEmail(email)) {
            showError(emailError, 'Please enter a valid email address');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok) {
                const successMsg = 'Password reset link has been sent to your email.';
                showSuccess(successMessage, successMsg);
                form.reset();
            } else {
                const errorMsg = result.error ?? 'An error occurred. Please try again.';
                showError(emailError, errorMsg);
            }
        } catch (error) {
            const errorMsg = error.message ?? 'An error occurred. Please try again.';
            showError(emailError, errorMsg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    };

    // Attach event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleForgotPassword().catch((err) => {
            console.error('Error in handleForgotPassword:', err);
        });
    };

    submitBtn.addEventListener('click', handleSubmit);

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            handleSubmit(e);
        }
    });
});
