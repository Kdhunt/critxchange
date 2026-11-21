const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

const getTokenFromStorage = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1] || null;
};

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
};

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('messageModal');
    const openBtn = document.getElementById('contactProfileBtn');
    const closeBtn = document.getElementById('closeMessageModal');
    const cancelBtn = document.getElementById('cancelMessageModal');
    const overlay = document.getElementById('messageModalOverlay');
    const form = document.getElementById('profileMessageForm');
    const attachmentsInput = document.getElementById('messageAttachments');
    const attachmentStatus = document.getElementById('attachmentStatus');
    const messageStatus = document.getElementById('messageStatus');
    const submitBtn = form?.querySelector('button[type="submit"]');

    const setStatus = (element, message, isError = false) => {
        if (!element) return;
        element.textContent = message;
        element.classList.remove('error', 'success');
        if (message) {
            element.classList.add(isError ? 'error' : 'success');
        }
    };

    const toggleModal = (isOpen) => {
        if (!modal) return;
        modal.classList.toggle('open', isOpen);
        modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        document.body.classList.toggle('no-scroll', isOpen);
        if (isOpen) {
            document.getElementById('messageSubject')?.focus();
        }
    };

    const resetForm = () => {
        if (!form) return;
        form.reset();
        setStatus(attachmentStatus, '');
        setStatus(messageStatus, '');
    };

    const validateAttachments = () => {
        if (!attachmentsInput || !attachmentStatus) return true;
        const files = Array.from(attachmentsInput.files || []);
        if (!files.length) {
            setStatus(attachmentStatus, '');
            return true;
        }

        const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
        if (totalBytes > MAX_TOTAL_BYTES) {
            setStatus(attachmentStatus, `Attachments are too large (${formatBytes(totalBytes)}). The maximum total size is 5 MB.`, true);
            return false;
        }

        const fileList = files.map((file) => `${file.name} (${formatBytes(file.size)})`).join(', ');
        setStatus(attachmentStatus, `Attached: ${fileList}`);
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!form) return;
        const token = getTokenFromStorage();
        if (!token) {
            setStatus(messageStatus, 'Please log in again to send a message.', true);
            return;
        }

        const isValidAttachments = validateAttachments();
        if (!isValidAttachments) return;

        const subject = form.subject.value.trim();
        const body = form.body.value.trim();

        if (!subject || !body) {
            setStatus(messageStatus, 'Please add both a subject and message.', true);
            return;
        }

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('body', body);
        formData.append('profileSlug', form.dataset.profileSlug || '');

        Array.from(attachmentsInput?.files || []).forEach((file) => {
            formData.append('attachments', file);
        });

        setStatus(messageStatus, 'Sending your message…');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Unable to send your message');
            }

            setStatus(messageStatus, payload?.message || 'Message sent successfully.', false);
            setTimeout(() => {
                toggleModal(false);
                resetForm();
            }, 600);
        } catch (error) {
            setStatus(messageStatus, error.message || 'Unable to send your message', true);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    };

    if (attachmentsInput) {
        attachmentsInput.addEventListener('change', validateAttachments);
    }

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (openBtn) {
        openBtn.addEventListener('click', () => toggleModal(true));
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleModal(false));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            resetForm();
            toggleModal(false);
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => toggleModal(false));
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal?.classList.contains('open')) {
            toggleModal(false);
        }
    });
});
