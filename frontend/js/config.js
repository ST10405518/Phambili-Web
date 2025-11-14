// Configuration for different environments
class Config {
    constructor() {
        this.environment = this.detectEnvironment();
        this.baseURL = this.getBaseURL();
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
            return `${window.location.protocol}//${window.location.host}/api`;
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
window.appConfig = new Config();

// Log configuration in development
if (window.appConfig.isDevelopment()) {
    console.log('🔧 App Config:', {
        environment: window.appConfig.environment,
        baseURL: window.appConfig.baseURL,
        hostname: window.location.hostname
    });
}
