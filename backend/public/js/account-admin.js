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

const notificationState = {
    items: [],
    activeId: null,
};

const previewFromBody = (body) => {
    if (!body) return '';
    const condensed = body.replace(/\s+/g, ' ').trim();
    return condensed.length > 140 ? `${condensed.slice(0, 140)}…` : condensed;
};

const setUnreadBadge = (count = 0) => {
    const badge = document.getElementById('unreadBadge');
    if (!badge) return;
    const safeCount = Number(count) || 0;
    badge.textContent = `${safeCount} unread`;
};

const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const renderNotificationList = () => {
    const list = document.getElementById('notificationList');
    const empty = document.getElementById('notificationEmptyState');
    if (!list || !empty) return;

    list.innerHTML = '';

    if (!notificationState.items.length) {
        empty.textContent = 'No notifications yet. New messages from admins, systems, and integrations will appear here.';
        list.appendChild(empty);
        return;
    }

    notificationState.items.forEach((notification) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('notification-item');
        if (notification.id === notificationState.activeId) {
            button.classList.add('is-active');
        }

        const badgeClass = notification.category === 'admin'
            ? 'badge admin'
            : notification.category === 'external'
                ? 'badge external'
                : 'badge';

        button.innerHTML = `
            <div class="title-row">
                <h3>${notification.title || 'Untitled'} <span class="${badgeClass}">${notification.category}</span></h3>
                ${notification.isRead ? '' : '<span class="unread-dot" aria-label="Unread"></span>'}
            </div>
            <p class="preview">${notification.preview || previewFromBody(notification.body)}</p>
            <div class="meta-row">
                <span>${notification.sender || 'Unknown sender'}</span>
                <span aria-hidden="true">•</span>
                <span>${formatDateTime(notification.createdAt)}</span>
            </div>
        `;

        button.addEventListener('click', () => {
            notificationState.activeId = notification.id;
            renderNotificationList();
            renderNotificationDetail(notification);
        });

        list.appendChild(button);
    });
};

const renderReplies = (metadata = {}) => {
    const replies = Array.isArray(metadata.replies) ? metadata.replies : [];
    if (!replies.length) return '';

    return `
        <div class="message-replies">
            ${replies.map((reply) => `
                <div class="reply">
                    <small>${reply.sender || 'You'} · ${formatDateTime(reply.createdAt)}</small>
                    <p>${escapeHtml(reply.body)}</p>
                </div>
            `).join('')}
        </div>
    `;
};

const renderAttachments = (metadata = {}) => {
    const attachments = Array.isArray(metadata.attachments) ? metadata.attachments : [];
    if (!attachments.length) return '';

    return `
        <div class="message-attachments">
            <p class="eyebrow">Attachments</p>
            <ul>
                ${attachments.map((file) => `
                    <li>
                        <a href="${file.url}" target="_blank" rel="noopener noreferrer">${file.originalName || file.fileName}</a>
                        <span class="attachment-size">${file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
};

const escapeHtml = (value = '') => {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const renderNotificationDetail = (notification) => {
    const detail = document.getElementById('notificationDetail');
    if (!detail) return;

    if (!notification) {
        detail.innerHTML = `
            <div class="message-detail-empty">
                <p class="eyebrow">No messages</p>
                <p class="panel-copy">Your message center will display new notifications from admins, system monitors, and external integrations.</p>
            </div>
        `;
        return;
    }

    const badgeClass = notification.category === 'admin'
        ? 'badge admin'
        : notification.category === 'external'
            ? 'badge external'
            : 'badge';

    detail.innerHTML = `
        <div class="detail-meta">
            <span class="${badgeClass}">${notification.category}</span>
            <span>From ${notification.sender || 'Unknown sender'}</span>
            <span>${formatDateTime(notification.createdAt)}</span>
        </div>
        <h3>${notification.title}</h3>
        <div class="message-body">
            <p>${escapeHtml(notification.body)}</p>
        </div>
        ${renderAttachments(notification.metadata)}
        <div class="message-actions">
            <button type="button" class="btn-primary" id="markReadToggle">
                ${notification.isRead ? 'Mark as unread' : 'Mark as read'}
            </button>
            <button type="button" class="btn-danger" id="deleteNotification">Delete</button>
        </div>
        <div class="message-reply-block">
            <form class="reply-form" id="replyForm">
                <label for="replyMessage">Reply to ${notification.sender || 'this message'}</label>
                <textarea id="replyMessage" name="replyMessage" placeholder="Write your response" required></textarea>
                <div class="form-footer">
                    <p class="form-status" id="replyStatus" role="status" aria-live="polite"></p>
                    <button type="submit" class="btn-ghost">Send reply</button>
                </div>
            </form>
        </div>
        ${renderReplies(notification.metadata)}
    `;

    const markButton = document.getElementById('markReadToggle');
    const deleteButton = document.getElementById('deleteNotification');
    const replyForm = document.getElementById('replyForm');
    const replyStatus = document.getElementById('replyStatus');
    const replyMessage = document.getElementById('replyMessage');

    if (markButton) {
        markButton.addEventListener('click', async () => {
            try {
                const payload = await authorizedFetch(`/api/notifications/${notification.id}/read`, {
                    method: 'PATCH',
                    body: JSON.stringify({ isRead: !notification.isRead }),
                });

                const updated = {
                    ...notification,
                    ...payload.notification,
                    preview: notification.preview || previewFromBody(payload.notification.body),
                };

                notificationState.items = notificationState.items.map((item) => (
                    item.id === updated.id ? updated : item
                ));

                const unread = notificationState.items.filter((item) => !item.isRead).length;
                setUnreadBadge(unread);
                renderNotificationList();
                renderNotificationDetail(updated);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const confirmed = window.confirm('Delete this notification? This action cannot be undone.');
            if (!confirmed) return;

            try {
                await authorizedFetch(`/api/notifications/${notification.id}`, { method: 'DELETE' });
                notificationState.items = notificationState.items.filter((item) => item.id !== notification.id);
                notificationState.activeId = notificationState.items[0]?.id || null;
                const unread = notificationState.items.filter((item) => !item.isRead).length;
                setUnreadBadge(unread);
                renderNotificationList();
                renderNotificationDetail(notificationState.items.find((item) => item.id === notificationState.activeId));
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (replyForm && replyStatus && replyMessage) {
        replyForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const message = replyMessage.value.trim();
                if (!message) {
                    setStatusMessage(replyStatus, 'Please enter a reply message.', true);
                    return;
                }

                const payload = await authorizedFetch(`/api/notifications/${notification.id}/reply`, {
                    method: 'POST',
                    body: JSON.stringify({ body: message }),
                });

                const updated = {
                    ...notification,
                    ...payload.notification,
                    preview: notification.preview || previewFromBody(payload.notification.body),
                };

                notificationState.items = notificationState.items.map((item) => (
                    item.id === updated.id ? updated : item
                ));

                setStatusMessage(replyStatus, 'Reply sent.', false);
                replyMessage.value = '';
                renderNotificationDetail(updated);
            } catch (error) {
                console.error('Reply failed:', error);
                setStatusMessage(replyStatus, error.message, true);
            }
        });
    }
};

const loadNotifications = async () => {
    const empty = document.getElementById('notificationEmptyState');
    if (empty) {
        empty.textContent = 'Loading your notifications…';
    }

    try {
        const payload = await authorizedFetch('/api/notifications');
        notificationState.items = payload.notifications || [];

        if (!notificationState.activeId && notificationState.items.length) {
            notificationState.activeId = notificationState.items[0].id;
        }

        if (notificationState.activeId && !notificationState.items.find((item) => item.id === notificationState.activeId)) {
            notificationState.activeId = notificationState.items[0]?.id || null;
        }

        setUnreadBadge(payload.unreadCount || 0);
        renderNotificationList();
        renderNotificationDetail(notificationState.items.find((item) => item.id === notificationState.activeId));
    } catch (error) {
        console.error('Unable to load notifications:', error);
        if (empty) {
            empty.textContent = error.message;
        }
    }
};

const registerMessageCenterHandlers = () => {
    const refreshButton = document.getElementById('refreshNotifications');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadNotifications);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    attachProfileFormHandler();
    attachPasswordFormHandler();
    attachDeleteHandler();
    hydrateAccountData();
    registerMessageCenterHandlers();
    loadNotifications();
});
