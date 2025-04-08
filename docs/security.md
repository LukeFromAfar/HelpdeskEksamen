# Security Implementation Documentation

## Helmet Implementation

The application uses a simplified Helmet configuration to work in HTTP environments.

### What is Helmet?

Helmet is a collection of middleware functions that set HTTP response headers to help protect the application from web vulnerabilities.

### Current Helmet Configuration

For HTTP compatibility, we've simplified our Helmet configuration:

```javascript
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for HTTP compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  xssFilter: true,
  hidePoweredBy: true
}));
```

This configuration:
- Disables Content Security Policy which can be problematic in HTTP environments
- Disables Cross-Origin policies that might interfere with resources loading
- Keeps XSS filtering enabled for basic protection
- Hides the X-Powered-By header to reduce information disclosure

## Authentication Security

### JWT Implementation

We use JSON Web Tokens (JWT) for maintaining user sessions:

- Tokens are stored in HTTP-only cookies to prevent client-side JavaScript access
- Cookies are configured with SameSite=Strict to mitigate CSRF attacks
- Short expiration time (1 hour) reduces the risk of token abuse if stolen
- Server-side validation on each protected route

```javascript
res.cookie('token', token, {
  httpOnly: true,
  maxAge: 3600000, // 1 hour
  sameSite: 'strict'
});
```

### Password Security

- Passwords are hashed using Argon2, a modern and secure password hashing algorithm
- Argon2 provides better resistance against GPU-accelerated attacks than bcrypt or PBKDF2
- Password validation enforces minimum length of 8 characters

## Input Validation

The application uses express-validator for basic input validation and sanitization.

### What is express-validator?

Express-validator is a set of express.js middlewares that provides string validation and sanitization.

### Sanitization Strategies

1. **Trimming** - Remove whitespace from start and end of strings
2. **Normalization** - Basic standardization of inputs like email addresses
3. **Escaping** - Converting special characters to prevent injection attacks

### Implemented Middleware

We've configured several middleware functions:

1. **sanitizeTicket** - Basic validation for ticket form inputs
2. **sanitizeComment** - Basic validation for comment text
3. **sanitizeUserRegistration** - Basic validation for user registration data
4. **sanitizeLogin** - Basic validation for login credentials
5. **sanitizeParams** - Basic validation for URL parameters

## Rate Limiting

To protect against brute force and DoS attacks, rate limiting has been implemented:

### Login Rate Limiting
```javascript
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 20, // 20 attempts per window
  message: 'For mange påloggingsforsøk. Vennligst prøv igjen senere.',
});
```

### API Rate Limiting
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'For mange forespørsler. Vennligst prøv igjen senere.',
});
```

## Route Protection

Access to protected routes is controlled through middleware:

1. **Authentication Middleware** - Verifies JWT token validity
2. **Role-based Authorization** - Restricts certain routes to admins only
3. **Resource Ownership Checks** - Ensures users can only access their own tickets

## XSS Protection

In addition to the built-in XSS protection from Helmet, we implement:

1. **Input Sanitization** - Cleaning user inputs through express-validator
2. **Output Encoding** - EJS templates automatically encode HTML special characters
3. **Custom XSS Protection Middleware** - Additional layer of protection for specific routes

## Security Best Practices

Despite simplified security for HTTP compatibility, the application still maintains:

1. **HTTP-Only Cookies** - JWT tokens stored in HTTP-only cookies to limit client-side script access
2. **Rate Limiting** - Basic protection against brute-force attacks
3. **Route Protection** - Role-based middleware for authorization
4. **Password Security** - Using Argon2 for password hashing
5. **Input Validation** - Basic server-side validation of user inputs 
6. **SameSite Cookie Protection** - Mitigates CSRF attacks
7. **Error Handling** - Limited error information exposed to clients in production

## Recommended Future Enhancements

For future versions of this application, consider implementing:

1. **Full HTTPS Support** - Enable complete Helmet protection with CSP
2. **CSRF Tokens** - Additional CSRF protection for sensitive operations
3. **Multi-Factor Authentication** - For enhanced login security
4. **Enhanced Password Requirements** - Enforce stronger password complexity
5. **IP-based Rate Limiting** - More sophisticated rate limiting strategies
6. **Security Auditing** - Automated scanning for vulnerabilities
7. **Database Query Parameterization** - Ensure all MongoDB queries are properly parameterized

## Security Tests

Basic security checks can be performed using:

1. **OWASP ZAP** - For vulnerability scanning
2. **npm audit** - To check for vulnerabilities in dependencies
3. **Helmet's Security Headers Test** - https://securityheaders.com/
