/**
 * Registration Form Handler
 * Handles user registration form submission
 * Uses modern ES6+ practices: destructuring, optional chaining, nullish coalescing
 */

const MIN_USERNAME_LENGTH = 3;
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
    const form = document.getElementById('registerForm');
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
     * Handles registration form submission
     */
    const handleRegistration = async () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const { username, email, password, confirmPassword } = data;

        clearFormErrors();

        // Client-side validation
        if (!username || username.length < MIN_USERNAME_LENGTH) {
            showFieldError('usernameError', 'Username must be at least 3 characters');
            return;
        }

        if (!email || !isValidEmail(email)) {
            showFieldError('emailError', 'Please enter a valid email address');
            return;
        }

        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            showFieldError('passwordError', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showFieldError('confirmPasswordError', 'Passwords do not match');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok && result.token) {
                storeAuthData(result.token, result.user);
                showToast('Account created successfully! Redirecting...', 'success');
                redirectAfterDelay('/dashboard');
            } else {
                const errorMessage = result.error ?? 'Registration failed';
                const errorField = errorMessage.toLowerCase().includes('email') ? 'emailError'
                    : errorMessage.toLowerCase().includes('username') ? 'usernameError'
                        : 'passwordError';
                showFieldError(errorField, errorMessage);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.message ?? 'An error occurred. Please try again.';
            showFieldError('emailError', errorMessage);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    };

    // Attach event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleRegistration().catch((err) => {
            console.error('Error in handleRegistration:', err);
        });
    };

    submitBtn.addEventListener('click', handleSubmit);

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            handleSubmit(e);
        }
    });
});
