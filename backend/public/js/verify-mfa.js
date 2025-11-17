/**
 * MFA Verification Form Handler
 * Handles MFA code verification form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('verifyMfaForm');
    if (!form) {
        console.error('Verify MFA form not found');
        return;
    }

    // Prevent any form submission
    form.setAttribute('novalidate', 'novalidate');

    const codeInput = document.getElementById('mfaCode');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }

    const handleVerifyMFA = async () => {
        const code = codeInput.value;
        const mfaError = document.getElementById('mfaError');

        if (code.length !== 6) {
            const errorMsg = 'Please enter a 6-digit code';
            showToast(errorMsg, 'error');
            mfaError.textContent = errorMsg;
            mfaError.classList.add('show');
            return;
        }

        mfaError.classList.remove('show');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        try {
            // Get temp token from session
            const tokenResponse = await fetch('/auth/temp-token');
            if (!tokenResponse.ok) {
                const errorMsg = 'Session expired. Please login again.';
                showToast(errorMsg, 'error');
                mfaError.textContent = errorMsg;
                mfaError.classList.add('show');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify';
                return;
            }

            const { token: tempToken } = await tokenResponse.json();

            // Verify MFA code
            const response = await fetch('/api/auth/verify-mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: tempToken,
                    code: code
                })
            });

            const result = await response.json().catch(() => {
                throw new Error('Invalid response from server');
            });

            if (response.ok && result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Set cookie for server-side access
                document.cookie = `token=${result.token}; path=/; max-age=${24 * 60 * 60}`;

                showToast('Verification successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            } else {
                const errorMsg = result.error || 'Invalid code. Please try again.';
                showToast(errorMsg, 'error');
                mfaError.textContent = errorMsg;
                mfaError.classList.add('show');
                codeInput.value = '';
                codeInput.focus();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify';
            }
        } catch (error) {
            const errorMsg = error.message || 'An error occurred. Please try again.';
            showToast(errorMsg, 'error');
            mfaError.textContent = errorMsg;
            mfaError.classList.add('show');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    };

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleVerifyMFA().catch((err) => {
            console.error('Error in handleVerifyMFA:', err);
        });
    });

    // Auto-submit when 6 digits are entered
    if (codeInput) {
        codeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, ''); // Only numbers
            if (e.target.value.length === 6) {
                handleVerifyMFA();
            }
        });
    }

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleVerifyMFA().catch((err) => {
                console.error('Error in handleVerifyMFA:', err);
            });
        }
    });
});

