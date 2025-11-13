// form-validator.js - Comprehensive form validation utility
class FormValidator {
    constructor() {
        this.validators = {
            fullName: this.validateFullName.bind(this),
            email: this.validateEmail.bind(this),
            phone: this.validatePhone.bind(this),
            street: this.validateStreet.bind(this),
            city: this.validateCity.bind(this),
            state: this.validateState.bind(this),
            postalCode: this.validatePostalCode.bind(this),
            password: this.validatePassword.bind(this)
        };
        
        this.init();
    }

    init() {
        // Auto-initialize validation on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFormValidation();
        });
    }

    // Full Name validation - only letters, spaces, hyphens, apostrophes
    validateFullName(value) {
        const trimmed = value.trim();
        
        if (!trimmed) {
            return { isValid: false, message: 'Full name is required' };
        }
        
        if (trimmed.length < 2) {
            return { isValid: false, message: 'Full name must be at least 2 characters long' };
        }
        
        if (trimmed.length > 50) {
            return { isValid: false, message: 'Full name must not exceed 50 characters' };
        }
        
        // Only allow letters, spaces, hyphens, and apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(trimmed)) {
            return { isValid: false, message: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
        }
        
        // Check for consecutive spaces or special characters
        if (/\s{2,}/.test(trimmed) || /[-']{2,}/.test(trimmed)) {
            return { isValid: false, message: 'Full name cannot contain consecutive spaces or special characters' };
        }
        
        // Must contain at least one letter
        if (!/[a-zA-Z]/.test(trimmed)) {
            return { isValid: false, message: 'Full name must contain at least one letter' };
        }
        
        return { isValid: true, message: '' };
    }

    // Email validation - comprehensive email format check
    validateEmail(value) {
        const trimmed = value.trim().toLowerCase();
        
        if (!trimmed) {
            return { isValid: false, message: 'Email address is required' };
        }
        
        // Comprehensive email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(trimmed)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        // Additional checks
        if (trimmed.length > 254) {
            return { isValid: false, message: 'Email address is too long' };
        }
        
        // Check for common typos
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
        const domain = trimmed.split('@')[1];
        
        if (domain && domain.includes('..')) {
            return { isValid: false, message: 'Email address contains invalid characters' };
        }
        
        return { isValid: true, message: '' };
    }

    // Phone validation - South African format (10 digits)
    validatePhone(value) {
        const trimmed = value.trim();
        
        if (!trimmed) {
            return { isValid: false, message: 'Phone number is required' };
        }
        
        // Remove all non-digit characters for validation
        const digitsOnly = trimmed.replace(/\D/g, '');
        
        // South African phone numbers are 10 digits
        if (digitsOnly.length !== 10) {
            return { isValid: false, message: 'Phone number must be exactly 10 digits' };
        }
        
        // South African mobile numbers start with 0 followed by 6, 7, 8, or 9
        // Landline numbers start with 0 followed by 1, 2, 3, 4, or 5
        const saPhoneRegex = /^0[1-9][0-9]{8}$/;
        
        if (!saPhoneRegex.test(digitsOnly)) {
            return { isValid: false, message: 'Please enter a valid South African phone number' };
        }
        
        return { isValid: true, message: '', formatted: this.formatPhoneNumber(digitsOnly) };
    }

    // Format phone number for display
    formatPhoneNumber(digits) {
        // Format as 012 345 6789
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }

    // Street address validation
    validateStreet(value) {
        const trimmed = value.trim();
        
        if (!trimmed) {
            return { isValid: false, message: 'Street address is required' };
        }
        
        if (trimmed.length < 5) {
            return { isValid: false, message: 'Street address must be at least 5 characters long' };
        }
        
        if (trimmed.length > 100) {
            return { isValid: false, message: 'Street address must not exceed 100 characters' };
        }
        
        // Allow letters, numbers, spaces, and common punctuation
        const streetRegex = /^[a-zA-Z0-9\s\-.,#/]+$/;
        if (!streetRegex.test(trimmed)) {
            return { isValid: false, message: 'Street address contains invalid characters' };
        }
        
        return { isValid: true, message: '' };
    }

    // City validation
    validateCity(value) {
        const trimmed = value.trim();
        
        if (!trimmed) {
            return { isValid: false, message: 'City is required' };
        }
        
        if (trimmed.length < 2) {
            return { isValid: false, message: 'City name must be at least 2 characters long' };
        }
        
        if (trimmed.length > 50) {
            return { isValid: false, message: 'City name must not exceed 50 characters' };
        }
        
        // Only allow letters, spaces, hyphens, and apostrophes
        const cityRegex = /^[a-zA-Z\s\-']+$/;
        if (!cityRegex.test(trimmed)) {
            return { isValid: false, message: 'City name can only contain letters, spaces, hyphens, and apostrophes' };
        }
        
        return { isValid: true, message: '' };
    }

    // State/Province validation
    validateState(value) {
        const trimmed = value.trim();
        
        if (!trimmed) {
            return { isValid: false, message: 'State/Province is required' };
        }
        
        if (trimmed.length < 2) {
            return { isValid: false, message: 'State/Province must be at least 2 characters long' };
        }
        
        if (trimmed.length > 50) {
            return { isValid: false, message: 'State/Province must not exceed 50 characters' };
        }
        
        // Only allow letters, spaces, hyphens, and apostrophes
        const stateRegex = /^[a-zA-Z\s\-']+$/;
        if (!stateRegex.test(trimmed)) {
            return { isValid: false, message: 'State/Province can only contain letters, spaces, hyphens, and apostrophes' };
        }
        
        return { isValid: true, message: '' };
    }

    // Postal Code validation - South African format (4 digits)
    validatePostalCode(value) {
        const trimmed = value.trim();
        
        if (!trimmed) {
            return { isValid: false, message: 'Postal code is required' };
        }
        
        // Remove all non-digit characters
        const digitsOnly = trimmed.replace(/\D/g, '');
        
        // South African postal codes are 4 digits
        if (digitsOnly.length !== 4) {
            return { isValid: false, message: 'Postal code must be exactly 4 digits' };
        }
        
        // Must be all digits
        const postalRegex = /^[0-9]{4}$/;
        if (!postalRegex.test(digitsOnly)) {
            return { isValid: false, message: 'Postal code must contain only numbers' };
        }
        
        return { isValid: true, message: '' };
    }

    // Password validation
    validatePassword(value) {
        if (!value) {
            return { isValid: false, message: 'Password is required' };
        }
        
        if (value.length < 6) {
            return { isValid: false, message: 'Password must be at least 6 characters long' };
        }
        
        if (value.length > 128) {
            return { isValid: false, message: 'Password must not exceed 128 characters' };
        }
        
        return { isValid: true, message: '' };
    }

    // Setup validation for all forms on the page
    setupFormValidation() {
        // Find all forms and add validation
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            this.addFormValidation(form);
        });
    }

    // Add validation to a specific form
    addFormValidation(form) {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
        
        inputs.forEach(input => {
            this.addFieldValidation(input);
        });
        
        // Add form submission validation
        form.addEventListener('submit', (e) => this.validateForm(e, form));
    }

    // Add validation to a single field
    addFieldValidation(input) {
        // Add real-time validation
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
        
        // Add formatting for phone numbers
        if (this.isPhoneField(input)) {
            input.addEventListener('input', (e) => this.formatPhoneInput(e));
        }

        // Add input filtering to prevent invalid characters
        input.addEventListener('input', (e) => this.filterInput(e));
    }

    // Validate a single field
    validateField(input) {
        const fieldType = this.getFieldType(input);
        const validator = this.validators[fieldType];
        
        if (!validator) return true;
        
        const result = validator(input.value);
        
        if (result.isValid) {
            this.showFieldSuccess(input);
            // Apply formatting if available
            if (result.formatted) {
                input.value = result.formatted;
            }
        } else {
            this.showFieldError(input, result.message);
        }
        
        return result.isValid;
    }

    // Validate entire form
    validateForm(event, form) {
        let isFormValid = true;
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            event.preventDefault();
            this.showFormError(form, 'Please correct the errors above before submitting.');
            
            // Focus on first invalid field
            const firstError = form.querySelector('.field-error');
            if (firstError) {
                firstError.focus();
            }
        }
        
        return isFormValid;
    }

    // Determine field type based on input attributes
    getFieldType(input) {
        const id = input.id.toLowerCase();
        const name = input.name ? input.name.toLowerCase() : '';
        const placeholder = input.placeholder ? input.placeholder.toLowerCase() : '';
        
        // Full name fields
        if (id.includes('name') || id.includes('fullname') || name.includes('name') || 
            placeholder.includes('name') || id.includes('auth-fullname') || id.includes('customer-name')) {
            return 'fullName';
        }
        
        // Email fields
        if (input.type === 'email' || id.includes('email') || name.includes('email')) {
            return 'email';
        }
        
        // Phone fields
        if (input.type === 'tel' || id.includes('phone') || name.includes('phone') || 
            placeholder.includes('phone')) {
            return 'phone';
        }
        
        // Address fields
        if (id.includes('street') || name.includes('street') || name.includes('address_street')) {
            return 'street';
        }
        
        if (id.includes('city') || name.includes('city') || name.includes('address_city')) {
            return 'city';
        }
        
        if (id.includes('state') || name.includes('state') || name.includes('address_state') || 
            id.includes('province') || name.includes('province')) {
            return 'state';
        }
        
        if (id.includes('postal') || name.includes('postal') || id.includes('zip') || 
            name.includes('address_postal_code')) {
            return 'postalCode';
        }
        
        // Password fields
        if (input.type === 'password') {
            return 'password';
        }
        
        return null;
    }

    // Check if field is a phone field
    isPhoneField(input) {
        return this.getFieldType(input) === 'phone';
    }

    // Format phone input as user types
    formatPhoneInput(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        
        // Limit to 10 digits
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        
        // Format as user types: 012 345 6789
        if (value.length >= 6) {
            value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
        } else if (value.length >= 3) {
            value = `${value.slice(0, 3)} ${value.slice(3)}`;
        }
        
        input.value = value;
    }

    // Show field error
    showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.classList.add('field-error');
        
        // Create or update error message
        let errorElement = input.parentNode.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Show field success
    showFieldSuccess(input) {
        this.clearFieldError(input);
        input.classList.add('field-success');
        
        // Remove success class after a short delay
        setTimeout(() => {
            input.classList.remove('field-success');
        }, 2000);
    }

    // Clear field error
    clearFieldError(input) {
        input.classList.remove('field-error', 'field-success');
        
        const errorElement = input.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Show form error
    showFormError(form, message) {
        let errorElement = form.querySelector('.form-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error-message';
            form.insertBefore(errorElement, form.firstChild);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    // Public method to validate a specific field programmatically
    validateFieldById(fieldId) {
        const input = document.getElementById(fieldId);
        if (input) {
            return this.validateField(input);
        }
        return false;
    }

    // Public method to validate entire form programmatically
    validateFormById(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const event = { preventDefault: () => {} };
            return this.validateForm(event, form);
        }
        return false;
    }

    // Filter input to prevent invalid characters as user types
    filterInput(event) {
        const input = event.target;
        const fieldType = this.getFieldType(input);
        let value = input.value;
        let filteredValue = value;

        switch (fieldType) {
            case 'fullName':
            case 'city':
            case 'state':
                // Only allow letters, spaces, hyphens, and apostrophes
                filteredValue = value.replace(/[^a-zA-Z\s\-']/g, '');
                break;
            
            case 'phone':
                // Only allow digits and common phone separators, then format
                filteredValue = value.replace(/[^\d\s\-()]/g, '');
                break;
            
            case 'postalCode':
                // Only allow digits for postal code
                filteredValue = value.replace(/[^\d]/g, '');
                // Limit to 4 digits for South African postal codes
                if (filteredValue.length > 4) {
                    filteredValue = filteredValue.substring(0, 4);
                }
                break;
        }

        // Update the input value if it was filtered
        if (filteredValue !== value) {
            input.value = filteredValue;
        }
    }
}

// Initialize the validator
const formValidator = new FormValidator();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}

// Make available globally
window.FormValidator = FormValidator;
window.formValidator = formValidator;
