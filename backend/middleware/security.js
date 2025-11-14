const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Basic rate limiter: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
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
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
});

module.exports = [helmetConfig, limiter];