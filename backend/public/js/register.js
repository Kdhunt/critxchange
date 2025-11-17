/**
 * Registration Form Handler
 * Handles user registration form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) {
        console.error('Register form not found');
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

    // Handle button click instead of form submission
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }

    const handleRegistration = async () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });

        // Client-side validation
        if (!data.username || data.username.length < 3) {
            const errorMsg = 'Username must be at least 3 characters';
            showToast(errorMsg, 'error');
            document.getElementById('usernameError').textContent = errorMsg;
            document.getElementById('usernameError').classList.add('show');
            return;
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            const errorMsg = 'Please enter a valid email address';
            showToast(errorMsg, 'error');
            document.getElementById('emailError').textContent = errorMsg;
            document.getElementById('emailError').classList.add('show');
            return;
        }

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
        submitBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    password: data.password
                })
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok && result.token) {
                // Store token and user info
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Set cookie for server-side access
                document.cookie = `token=${result.token}; path=/; max-age=${24 * 60 * 60}`;

                // Show success toast
                showToast('Account created successfully! Redirecting...', 'success');

                // Redirect to dashboard after brief delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            } else {
                // Show error
                const errorMessage = result.error || 'Registration failed';
                showToast(errorMessage, 'error');

                const errorField = errorMessage.toLowerCase().includes('email') ? 'emailError' :
                                 errorMessage.toLowerCase().includes('username') ? 'usernameError' :
                                 'passwordError';
                document.getElementById(errorField).textContent = errorMessage;
                document.getElementById(errorField).classList.add('show');

                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.message || 'An error occurred. Please try again.';
            showToast(errorMessage, 'error');
            document.getElementById('emailError').textContent = errorMessage;
            document.getElementById('emailError').classList.add('show');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    };

    // Attach click handler to button
    try {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleRegistration().catch((err) => {
                console.error('Error in handleRegistration:', err);
            });
        });

        // Also handle Enter key in form fields
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !submitBtn.disabled) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                handleRegistration().catch((err) => {
                    console.error('Error in handleRegistration:', err);
                });
            }
        });
    } catch (error) {
        console.error('Error attaching event handlers:', error);
    }
});

