// Configuration for different environments
class Config {
    constructor() {
        this.environment = this.detectEnvironment();
        this.baseURL = this.getBaseURL();
        // Log configuration in all environments for debugging
        console.log('🔧 App Config Initialized:', {
            environment: this.environment,
            baseURL: this.baseURL,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            host: window.location.host
        });
    }

    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('.onrender.com')) {
            return 'production';
        } else {
            return 'production'; // Default to production for safety
        }
    }

    getBaseURL() {
        if (this.environment === 'development') {
            return 'http://localhost:5001/api';
        } else {
            // In production, API is served from the same domain
            // Use the current origin instead of localhost
            const baseURL = `${window.location.protocol}//${window.location.host}/api`;
            console.log('🌐 Production baseURL:', baseURL);
            return baseURL;
        }
    }

    getImageURL(imagePath) {
        if (!imagePath) return '';
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) return imagePath;
        
        if (this.environment === 'development') {
            if (imagePath.startsWith('/upload/')) {
                return `http://localhost:5001${imagePath}`;
            }
            return `http://localhost:5001/upload/services/${imagePath}`;
        } else {
            // In production, images are served from the same domain
            if (imagePath.startsWith('/upload/')) {
                return `${window.location.protocol}//${window.location.host}${imagePath}`;
            }
            return `${window.location.protocol}//${window.location.host}/upload/services/${imagePath}`;
        }
    }

    isDevelopment() {
        return this.environment === 'development';
    }

    isProduction() {
        return this.environment === 'production';
    }
}

// Create global config instance
// Ensure it's created immediately when script loads
window.appConfig = new Config();

// Verify config is accessible
if (!window.appConfig || !window.appConfig.baseURL) {
    console.error('❌ Config initialization failed! Falling back to localhost');
    window.appConfig = {
        baseURL: 'http://localhost:5001/api',
        environment: 'development',
        getImageURL: (path) => path
    };
}
