/**
 * Toast Notification System
 * Provides toast notifications for user feedback
 * Uses modern ES6+ practices: arrow functions, template literals, optional chaining
 */

const TOAST_DURATION = 5000;
const TOAST_REMOVE_DELAY = 300;
const TOAST_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success',
};

const TOAST_ICONS = {
    [TOAST_TYPES.ERROR]: '❌',
    [TOAST_TYPES.SUCCESS]: '✅',
};

const TOAST_TITLES = {
    [TOAST_TYPES.ERROR]: 'Error',
    [TOAST_TYPES.SUCCESS]: 'Success',
};

/**
 * Creates and displays a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('error' or 'success')
 */
const showToast = (message, type = TOAST_TYPES.ERROR) => {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = TOAST_ICONS[type] ?? TOAST_ICONS[TOAST_TYPES.ERROR];
    const title = TOAST_TITLES[type] ?? TOAST_TITLES[TOAST_TYPES.ERROR];

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close notification">×</button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), TOAST_REMOVE_DELAY);
    }, TOAST_DURATION);
};

/**
 * Removes a toast notification
 * @param {HTMLElement} toast - The toast element to remove
 */
const removeToast = (toast) => {
    toast?.classList.add('hiding');
    setTimeout(() => toast?.remove(), TOAST_REMOVE_DELAY);
};

// Event delegation for toast close buttons (for dynamically created toasts)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('toast-close')) {
            const toast = e.target.closest('.toast');
            removeToast(toast);
        }
    });
});
