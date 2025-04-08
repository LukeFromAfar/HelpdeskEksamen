# Security Implementation Documentation

## Helmet Implementation

The application uses Helmet to enhance security by setting various HTTP headers.

### What is Helmet?

Helmet is a collection of 15 smaller middleware functions that set HTTP response headers to help protect the application from well-known web vulnerabilities.

### Headers Set by Helmet

The following security headers are set by our Helmet configuration:

1. **Content-Security-Policy (CSP)** - Controls resources the user agent is allowed to load
   - Restricts script sources to our domain and trusted CDNs
   - Restricts style sources to our domain and trusted CDNs
   - Limits image sources to our domain and data URIs
   - Controls font sources and connection endpoints

2. **X-XSS-Protection** - Enables browser's built-in XSS filters

3. **X-Content-Type-Options: nosniff** - Prevents browsers from interpreting files as a different MIME type

4. **X-Frame-Options: SAMEORIGIN** - Prevents clickjacking by not allowing our pages to be embedded in frames on other sites

5. **Referrer-Policy** - Controls how much referrer information is included with requests

6. **Strict-Transport-Security** - Enforces HTTPS connections

7. **X-Powered-By** - Removed to hide information about the server technology

### Custom Configuration

Our Helmet configuration includes customizations to allow specific trusted resources:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"],
      styleSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'ws:', 'wss:']
    }
  },
  crossOriginEmbedderPolicy: false,
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true
}));
```

This configuration:
- Allows scripts and styles from cdn.jsdelivr.net (for Bootstrap)
- Permits inline scripts and styles needed for the application
- Allows websocket connections for real-time notifications
- Disables the Cross-Origin Embedder Policy for compatibility

## Input Sanitization

The application uses express-validator to sanitize all user inputs before processing.

### What is express-validator?

Express-validator is a set of express.js middlewares that wraps validator.js, a library that provides string validation and sanitization.

### Sanitization Strategies

1. **HTML Escaping** - Convert HTML special characters to prevent script injection
2. **Trimming** - Remove whitespace from start and end of strings
3. **Normalization** - Standardize inputs like email addresses

### Implemented Middleware

We've created several specialized middleware functions:

1. **sanitizeTicket** - Sanitizes all ticket form inputs
2. **sanitizeComment** - Sanitizes comment text
3. **sanitizeUserRegistration** - Sanitizes user registration data
4. **sanitizeLogin** - Sanitizes login credentials
5. **sanitizeParams** - Sanitizes URL parameters

Example implementation:

```javascript
const sanitizeTicket = [
  body('title').trim().escape(),
  body('description').trim(),
  body('category').trim().escape(),
  body('priority').trim().escape(),
  body('status').trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];
```

## Additional XSS Protection

Beyond Helmet's built-in XSS filter, we've added a custom middleware that sets the X-XSS-Protection header for browsers that still support it.

```javascript
const xssProtection = (req, res, next) => {
  // Set X-XSS-Protection header
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};
```

## Security Best Practices

In addition to Helmet and input sanitization, the application implements several other security measures:

1. **HTTP-Only Cookies** - JWT tokens are stored in HTTP-only cookies to prevent client-side script access
2. **CSRF Protection** - Through same-site cookie attributes
3. **Rate Limiting** - Protection against brute-force attacks
4. **Secure Password Storage** - Using Argon2 for password hashing
5. **Input Validation** - Server-side validation of all user inputs
6. **Role-Based Access Control** - Ensuring users can only access authorized resources
