export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Modal management utilities
 */
export class Modal {
    static show(content, options = {}) {
        const {
            title = '',
            size = 'medium',
            closable = true,
            onClose = null
        } = options;

        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        const modalHTML = `
            <div class="modal modal-${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                ${closable ? `
                <div class="modal-header">
                    <h2 id="modal-title" class="modal-title">${title}</h2>
                    <button class="modal-close" aria-label="Close modal">&times;</button>
                </div>
                ` : ''}
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalHTML;
        modalContainer.classList.add('show');
        modalContainer.setAttribute('aria-hidden', 'false');

        // Focus management
        const focusableElements = modalContainer.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (firstFocusable) firstFocusable.focus();

        // Event listeners
        const closeModal = () => {
            modalContainer.classList.remove('show');
            modalContainer.setAttribute('aria-hidden', 'true');
            modalContainer.innerHTML = '';
            if (onClose) onClose();
        };

        if (closable) {
            const closeBtn = modalContainer.querySelector('.modal-close');
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
        }

        // Close on backdrop click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) closeModal();
        });

        // Close on Escape key
        const handleKeydown = (e) => {
            if (e.key === 'Escape' && closable) {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }

            // Tab trap
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeydown);

        return {
            close: closeModal
        };
    }

    static close() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.classList.remove('show');
            modalContainer.setAttribute('aria-hidden', 'true');
            modalContainer.innerHTML = '';
        }
    }
}

/**
 * Notification management utilities
 */
export class Notification {
    static show(message, options = {}) {
        const {
            type = 'info',
            title = '',
            duration = 5000,
            closable = true
        } = options;

        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;

        const notificationId = `notification-${Date.now()}`;
        const icon = this.getIcon(type);

        const notificationHTML = `
            <div class="notification ${type}" id="${notificationId}" role="alert">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    ${title ? `<div class="notification-title">${title}</div>` : ''}
                    <p class="notification-message">${message}</p>
                </div>
                ${closable ? `<button class="notification-close" aria-label="Close notification">&times;</button>` : ''}
            </div>
        `;

        notificationContainer.insertAdjacentHTML('beforeend', notificationHTML);
        const notification = document.getElementById(notificationId);

        // Auto remove after duration
        let timeoutId;
        if (duration > 0) {
            timeoutId = setTimeout(() => this.remove(notificationId), duration);
        }

        // Close button
        if (closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                clearTimeout(timeoutId);
                this.remove(notificationId);
            });
        }

        return notificationId;
    }

    static remove(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    static getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

/**
 * Form validation utilities
 */
export function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    let isValid = true;
    const errors = {};

    inputs.forEach(input => {
        const errorElement = input.parentNode.querySelector('.form-error');
        if (errorElement) errorElement.remove();

        const value = input.value.trim();
        const fieldName = input.name || input.id;

        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errors[fieldName] = 'This field is required';
            showFieldError(input, 'This field is required');
        }

        if (input.type === 'email' && value && !isValidEmail(value)) {
            isValid = false;
            errors[fieldName] = 'Please enter a valid email address';
            showFieldError(input, 'Please enter a valid email address');
        }

        if (input.type === 'date' && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                isValid = false;
                errors[fieldName] = 'Please enter a valid date';
                showFieldError(input, 'Please enter a valid date');
            }
        }
    });

    return { isValid, errors };
}

function showFieldError(input, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    input.parentNode.appendChild(errorElement);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorElement.id);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
