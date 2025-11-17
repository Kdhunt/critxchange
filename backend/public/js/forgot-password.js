/**
 * Forgot Password Form Handler
 * Handles password reset request form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    if (!form) {
        console.error('Forgot password form not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }

    const handleForgotPassword = async () => {
        const email = document.getElementById('email').value;
        const emailError = document.getElementById('emailError');
        const successMessage = document.getElementById('successMessage');

        // Clear previous messages
        emailError.classList.remove('show');
        successMessage.classList.remove('show');

        // Validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            const errorMsg = 'Please enter a valid email address';
            showToast(errorMsg, 'error');
            emailError.textContent = errorMsg;
            emailError.classList.add('show');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok) {
                const successMsg = 'Password reset link has been sent to your email.';
                showToast(successMsg, 'success');
                successMessage.textContent = successMsg;
                successMessage.classList.add('show');
                form.reset();
            } else {
                const errorMsg = result.error || 'An error occurred. Please try again.';
                showToast(errorMsg, 'error');
                emailError.textContent = errorMsg;
                emailError.classList.add('show');
            }
        } catch (error) {
            const errorMsg = error.message || 'An error occurred. Please try again.';
            showToast(errorMsg, 'error');
            emailError.textContent = errorMsg;
            emailError.classList.add('show');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    };

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleForgotPassword().catch((err) => {
            console.error('Error in handleForgotPassword:', err);
        });
    });

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleForgotPassword().catch((err) => {
                console.error('Error in handleForgotPassword:', err);
            });
        }
    });
});

