/**
 * Account administration client helpers
 * Handles profile updates, password changes, and account deletion flows
 */

const getTokenFromStorage = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1] || null;
};

const setStatusMessage = (element, message, isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('error', 'success');
    if (message) {
        element.classList.add(isError ? 'error' : 'success');
    }
};

const authorizedFetch = async (url, options = {}) => {
    const token = getTokenFromStorage();
    if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 204) {
        return null;
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const errMessage = payload?.error || payload?.errors?.join(', ') || 'Unable to process your request';
        throw new Error(errMessage);
    }

    return payload;
};

const refreshAccountSummary = (account) => {
    if (!account) return;
    const summary = document.getElementById('accountSummary');
    const updatedAt = document.getElementById('accountUpdatedAt');

    if (summary) {
        summary.innerHTML = `
            <div>
                <dt>Username</dt>
                <dd>${account.username}</dd>
            </div>
            <div>
                <dt>Email</dt>
                <dd>${account.email}</dd>
            </div>
            <div>
                <dt>Account ID</dt>
                <dd>${account.id}</dd>
            </div>
        `;
    }

    if (updatedAt && account.updatedAt) {
        updatedAt.textContent = `Last updated ${new Date(account.updatedAt).toLocaleString()}`;
    }

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    if (usernameInput) usernameInput.value = account.username;
    if (emailInput) emailInput.value = account.email;
};

const attachProfileFormHandler = () => {
    const form = document.getElementById('profileForm');
    const statusEl = document.getElementById('profileStatus');

    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accountId = form.dataset.accountId;
        const username = form.username.value.trim();
        const email = form.email.value.trim();

        try {
            const payload = await authorizedFetch(`/api/accounts/${accountId}`, {
                method: 'PUT',
                body: JSON.stringify({ username, email }),
            });
            setStatusMessage(statusEl, 'Profile updated successfully.', false);
            refreshAccountSummary(payload);
        } catch (error) {
            console.error('Profile update failed:', error);
            setStatusMessage(statusEl, error.message, true);
        }
    });
};

const attachPasswordFormHandler = () => {
    const form = document.getElementById('passwordForm');
    const statusEl = document.getElementById('passwordStatus');

    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accountId = form.dataset.accountId;
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            setStatusMessage(statusEl, 'New passwords do not match.', true);
            return;
        }

        if (newPassword.length < 6) {
            setStatusMessage(statusEl, 'Password must be at least 6 characters.', true);
            return;
        }

        try {
            await authorizedFetch(`/api/accounts/${accountId}`, {
                method: 'PUT',
                body: JSON.stringify({ password: newPassword, currentPassword }),
            });
            setStatusMessage(statusEl, 'Password updated successfully.', false);
            form.reset();
        } catch (error) {
            console.error('Password update failed:', error);
            setStatusMessage(statusEl, error.message, true);
        }
    });
};

const attachDeleteHandler = () => {
    const form = document.getElementById('deleteAccountForm');
    const statusEl = document.getElementById('deleteStatus');

    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accountId = form.dataset.accountId;
        const deleteConfirm = form.deleteConfirm.value.trim();
        const currentPassword = form.deletePassword.value;

        if (deleteConfirm !== 'DELETE') {
            setStatusMessage(statusEl, 'Please type DELETE to confirm.', true);
            return;
        }

        if (!currentPassword) {
            setStatusMessage(statusEl, 'Password confirmation is required.', true);
            return;
        }

        const confirmed = window.confirm('This will permanently delete your account. Continue?');
        if (!confirmed) {
            return;
        }

        try {
            await authorizedFetch(`/api/accounts/${accountId}`, {
                method: 'DELETE',
                body: JSON.stringify({ currentPassword }),
            });
            setStatusMessage(statusEl, 'Account deleted. Redirecting...', false);
            if (typeof clearAuthData === 'function') {
                clearAuthData();
            }
            setTimeout(() => {
                window.location.href = '/auth/register';
            }, 1500);
        } catch (error) {
            console.error('Account deletion failed:', error);
            setStatusMessage(statusEl, error.message, true);
        }
    });
};

const hydrateAccountData = async () => {
    try {
        const account = await authorizedFetch('/api/accounts/me');
        refreshAccountSummary(account);
    } catch (error) {
        console.error('Unable to refresh account data:', error);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    attachProfileFormHandler();
    attachPasswordFormHandler();
    attachDeleteHandler();
    hydrateAccountData();
});
