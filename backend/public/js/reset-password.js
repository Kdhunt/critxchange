/**
 * Reset Password Form Handler
 * Handles password reset form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    if (!form) {
        console.error('Reset password form not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrength');

    // Password strength indicator
    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            let strength = 'weak';

            if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
                strength = 'strong';
            } else if (password.length >= 6) {
                strength = 'medium';
            }

            strengthBar.className = `password-strength-bar password-strength-${strength}`;
        });
    }

    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }

    const handleResetPassword = async () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });

        // Client-side validation
        if (!data.password || data.password.length < 6) {
            const errorMsg = 'Password must be at least 6 characters';
            showToast(errorMsg, 'error');
            document.getElementById('passwordError').textContent = errorMsg;
            document.getElementById('passwordError').classList.add('show');
            return;
        }

        if (data.password !== data.confirmPassword) {
            const errorMsg = 'Passwords do not match';
            showToast(errorMsg, 'error');
            document.getElementById('confirmPasswordError').textContent = errorMsg;
            document.getElementById('confirmPasswordError').classList.add('show');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting Password...';

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: data.token,
                    password: data.password
                })
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok) {
                showToast('Password reset successfully! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 1000);
            } else {
                const errorMsg = result.error || 'Password reset failed';
                showToast(errorMsg, 'error');
                const errorField = errorMsg.toLowerCase().includes('password') ? 'passwordError' : 'confirmPasswordError';
                document.getElementById(errorField).textContent = errorMsg;
                document.getElementById(errorField).classList.add('show');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
            }
        } catch (error) {
            const errorMsg = error.message || 'An error occurred. Please try again.';
            showToast(errorMsg, 'error');
            document.getElementById('passwordError').textContent = errorMsg;
            document.getElementById('passwordError').classList.add('show');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    };

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleResetPassword().catch((err) => {
            console.error('Error in handleResetPassword:', err);
        });
    });

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleResetPassword().catch((err) => {
                console.error('Error in handleResetPassword:', err);
            });
        }
    });
});

