/**
 * Security utilities for input validation, sanitization, and security checks
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeInput(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Escape special characters that could be used in XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitize name input (allows letters, spaces, hyphens, apostrophes)
 */
export function sanitizeName(name: string, maxLength: number = 100): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let sanitized = name.trim().slice(0, maxLength);

  // Allow only letters, spaces, hyphens, apostrophes, and common name characters
  sanitized = sanitized.replace(/[^a-zA-Z\s\-'\.]/g, '');

  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Normalize email (lowercase, trim)
  let sanitized = email.toLowerCase().trim();

  // Remove any whitespace
  sanitized = sanitized.replace(/\s/g, '');

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  // Limit length (RFC 5321: 320 characters max)
  if (sanitized.length > 320) {
    return '';
  }

  return sanitized;
}

/**
 * Check if password is in common passwords list
 */
const COMMON_PASSWORDS = [
  'password', '12345678', '123456789', '1234567890', 'qwerty123',
  'password123', 'admin123', 'letmein', 'welcome123', 'monkey123',
  '123456789a', 'password1', 'abc123', 'Password1', 'Password123',
  'admin', 'root', 'test123', 'guest', 'user123'
];

export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some(common => lowerPassword.includes(common));
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  issues: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];
  let score = 0;

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters');
  } else {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number');
  } else {
    score++;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password must contain at least one special character');
  } else {
    score++;
  }

  if (isCommonPassword(password)) {
    issues.push('Password is too common. Please choose a more unique password');
    score = Math.max(0, score - 2);
  }

  // Check for repeated characters (e.g., "aaaaaa")
  if (/(.)\1{3,}/.test(password)) {
    issues.push('Password contains too many repeated characters');
    score = Math.max(0, score - 1);
  }

  // Check for sequential characters (e.g., "12345", "abcde")
  if (/01234|12345|23456|34567|45678|56789|abcdef|bcdefg|cdefgh|defghi|efghij|fghijk|ghijkl|hijklm|ijklmn|jklmno|klmnop|lmnopq|mnopqr|nopqrs|opqrst|pqrstu|qrstuv|rstuvw|stuvwx|tuvwxy|uvwxyz/i.test(password)) {
    issues.push('Password contains sequential characters');
    score = Math.max(0, score - 1);
  }

  return {
    isValid: issues.length === 0 && score >= 4,
    score: Math.min(4, score),
    issues
  };
}

/**
 * Validate request body size to prevent DoS
 */
export function validateRequestBodySize(body: string, maxSize: number = 1024 * 10): boolean {
  return body.length <= maxSize;
}

/**
 * Check for SQL injection patterns (basic check)
 */
export function containsSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(\+)|(%)|(\|)|(&)|(\^)|(\()|(\)))/i,
    /(\bOR\b.*=.*=)/i,
    /(\bAND\b.*=.*=)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate input doesn't contain dangerous patterns
 */
export function validateInputSecurity(input: string): { isValid: boolean; reason?: string } {
  if (containsSQLInjection(input)) {
    return { isValid: false, reason: 'Input contains potentially dangerous patterns' };
  }

  // Check for script tags
  if (/<script/i.test(input)) {
    return { isValid: false, reason: 'Input contains script tags' };
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(input)) {
    return { isValid: false, reason: 'Input contains javascript protocol' };
  }

  // Check for data: protocol (can be used for XSS)
  if (/data:text\/html/i.test(input)) {
    return { isValid: false, reason: 'Input contains data protocol' };
  }

  return { isValid: true };
}
