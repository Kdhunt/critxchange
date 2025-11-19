const getTokenFromStorage = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1] || null;
};

const authorizedFetch = async (url, options = {}) => {
    const token = getTokenFromStorage();
    if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        throw new Error(payload?.error || 'Unable to process your request');
    }

    return payload;
};

const slugify = (value = '') => value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const setStatus = (element, message, isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('error', 'success');
    if (message) {
        element.classList.add(isError ? 'error' : 'success');
    }
};

const hydrateServices = (selectedServices = []) => {
    const checkboxes = document.querySelectorAll('input[name="services"]');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = selectedServices.includes(checkbox.value);
    });
};

const updatePreviewUrl = (slug) => {
    const slugInput = document.getElementById('profileSlug');
    const urlDisplay = document.getElementById('profileUrl');
    if (slugInput) {
        slugInput.value = slug ? `/profiles/${slug}` : '';
    }
    if (urlDisplay) {
        urlDisplay.textContent = slug ? `${window.location.origin}/profiles/${slug}` : 'Set a display name to generate your URL';
    }
};

const updateBioCount = () => {
    const bioInput = document.getElementById('bio');
    const counter = document.getElementById('bioCount');
    if (!bioInput || !counter) return;
    counter.textContent = `${bioInput.value.length} / 1000`;
};

const updateAvatarPreview = (src) => {
    const preview = document.getElementById('avatarPreview');
    if (preview) {
        preview.src = src || '/images/profile-placeholder.svg';
    }
};

const hydrateProfile = async () => {
    try {
        const profile = await authorizedFetch('/api/profiles/me');
        const displayNameInput = document.getElementById('displayName');
        const bioInput = document.getElementById('bio');

        if (displayNameInput) displayNameInput.value = profile.displayName;
        if (bioInput) bioInput.value = profile.bio || '';
        updateBioCount();
        hydrateServices(profile.services || []);
        updatePreviewUrl(profile.slug);
        if (profile.avatarUrl) {
            updateAvatarPreview(profile.avatarUrl);
        }
    } catch (error) {
        console.error('Unable to hydrate profile:', error);
    }
};

const wireForm = () => {
    const form = document.getElementById('profileManagerForm');
    const status = document.getElementById('profileManagerStatus');
    if (!form) return;

    const displayNameInput = document.getElementById('displayName');
    const bioInput = document.getElementById('bio');
    const avatarInput = document.getElementById('avatar');

    if (displayNameInput) {
        displayNameInput.addEventListener('input', (event) => {
            const slug = slugify(event.target.value);
            updatePreviewUrl(slug);
        });
    }

    if (bioInput) {
        bioInput.addEventListener('input', updateBioCount);
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', () => {
            if (avatarInput.files && avatarInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => updateAvatarPreview(e.target.result);
                reader.readAsDataURL(avatarInput.files[0]);
            }
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData();
        const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked')).map((input) => input.value);

        formData.append('displayName', displayNameInput.value.trim());
        formData.append('bio', bioInput.value.trim());
        formData.append('services', JSON.stringify(selectedServices));

        if (avatarInput.files && avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }

        try {
            const updatedProfile = await authorizedFetch('/api/profiles/me', {
                method: 'PUT',
                body: formData,
            });
            setStatus(status, 'Profile updated successfully');
            updatePreviewUrl(updatedProfile.slug);
            if (updatedProfile.avatarUrl) {
                updateAvatarPreview(updatedProfile.avatarUrl);
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            setStatus(status, error.message || 'Unable to update profile', true);
        }
    });
};

window.addEventListener('DOMContentLoaded', () => {
    wireForm();
    hydrateProfile();
});
