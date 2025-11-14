const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiter that skips static files
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static files (CSS, JS, images, fonts, etc.)
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.map'];
    const path = req.path.toLowerCase();
    const isStaticFile = staticExtensions.some(ext => path.endsWith(ext));
    
    // Also skip if it's a static file path
    const isStaticPath = path.startsWith('/css/') || 
                        path.startsWith('/js/') || 
                        path.startsWith('/images/') || 
                        path.startsWith('/fonts/') ||
                        path.startsWith('/upload/');
    
    return isStaticFile || isStaticPath;
  }
});

// Configure Helmet with proper CSP for production
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        // In production, allow same-origin only (frontend and backend on same domain)
        // In development, allow localhost connections
        ...(process.env.NODE_ENV === 'production' 
          ? [] 
          : ["http://localhost:*", "ws://localhost:*", "ws://127.0.0.1:*"])
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://storage.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Needed for some frontend frameworks
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
        "data:"
      ],
      mediaSrc: [
        "'self'",
        "https://storage.googleapis.com",
        "https://*.firebasestorage.app",
        "blob:",
        "data:"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
});

module.exports = [helmetConfig, limiter];