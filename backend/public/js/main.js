/**
 * Main Layout JavaScript
 * Handles mobile menu toggle and logout functionality
 * Uses modern ES6+ practices: arrow functions, optional chaining, destructuring
 */

/**
 * Clears all authentication data
 */
const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

/**
 * Handles logout functionality
 */
const handleLogout = async () => {
    try {
        await fetch('/api/dashboard/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuthData();
        window.location.href = '/';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userMenu = document.querySelector('.user-menu');

    // Mobile menu toggle
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (userMenuToggle && userMenu) {
        userMenuToggle.addEventListener('click', () => {
            const isOpen = userMenu.classList.toggle('open');
            userMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', (event) => {
            if (!userMenu.contains(event.target)) {
                userMenu.classList.remove('open');
                userMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
});
