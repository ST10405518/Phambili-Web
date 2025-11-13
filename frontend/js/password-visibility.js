/**
 * Password Visibility Toggle Utility
 * Adds show/hide password functionality to all password fields
 */

class PasswordVisibilityManager {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPasswordFields());
        } else {
            this.setupPasswordFields();
        }
    }

    setupPasswordFields() {
        // Find all password input fields
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(field => {
            this.addPasswordToggle(field);
        });

        // Also setup for dynamically added password fields
        this.observeForNewPasswordFields();
    }

    addPasswordToggle(passwordField) {
        // Skip if already has toggle
        if (passwordField.parentElement.classList.contains('password-field-wrapper')) {
            return;
        }

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'password-field-wrapper';
        
        // Insert wrapper before the password field
        passwordField.parentNode.insertBefore(wrapper, passwordField);
        
        // Move password field into wrapper
        wrapper.appendChild(passwordField);
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle-btn';
        toggleButton.setAttribute('aria-label', 'Toggle password visibility');
        toggleButton.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
        
        // Add toggle button to wrapper
        wrapper.appendChild(toggleButton);
        
        // Add event listener
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePasswordVisibility(passwordField, toggleButton);
        });

        // Add keyboard support
        toggleButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.togglePasswordVisibility(passwordField, toggleButton);
            }
        });
    }

    togglePasswordVisibility(passwordField, toggleButton) {
        const isPassword = passwordField.type === 'password';
        const icon = toggleButton.querySelector('i');
        
        if (isPassword) {
            // Show password
            passwordField.type = 'text';
            icon.className = 'fas fa-eye-slash';
            toggleButton.setAttribute('aria-label', 'Hide password');
            toggleButton.title = 'Hide password';
        } else {
            // Hide password
            passwordField.type = 'password';
            icon.className = 'fas fa-eye';
            toggleButton.setAttribute('aria-label', 'Show password');
            toggleButton.title = 'Show password';
        }
    }

    observeForNewPasswordFields() {
        // Create a MutationObserver to watch for dynamically added password fields
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a password field
                        if (node.type === 'password') {
                            this.addPasswordToggle(node);
                        }
                        
                        // Check for password fields within the added node
                        const passwordFields = node.querySelectorAll && node.querySelectorAll('input[type="password"]');
                        if (passwordFields) {
                            passwordFields.forEach(field => this.addPasswordToggle(field));
                        }
                    }
                });
            });
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize password visibility manager
window.passwordVisibilityManager = new PasswordVisibilityManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordVisibilityManager;
}
