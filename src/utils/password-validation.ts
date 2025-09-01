// Password validation helper functions

/**
 * Checks if password meets minimum security requirements
 * @param password The password to check
 * @returns Object containing validation result and reasons for failure
 */
export function validatePassword(password: string): { 
  isValid: boolean;
  errors: string[];
} {
  const minLength = parseInt(process.env.NEXT_PUBLIC_MIN_PASSWORD_LENGTH || '8', 10);
  const enforceComplexity = process.env.NEXT_PUBLIC_ENFORCE_PASSWORD_COMPLEXITY === 'true';
  
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  // Only check complexity if enabled
  if (enforceComplexity) {
    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for numbers
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for special characters
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Estimates password strength
 * @param password The password to evaluate
 * @returns Score from 0 (very weak) to 4 (very strong)
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Length check (basic)
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Pattern checks (reduce score for common patterns)
  if (/^[A-Za-z]+\d+$/.test(password)) score--; // Common pattern: word followed by numbers
  if (/^[A-Za-z]+[^A-Za-z0-9]\d+$/.test(password)) score--; // Common pattern: word + symbol + numbers
  
  // Cap the score between 0-4
  return Math.max(0, Math.min(4, score));
}

/**
 * Get a descriptive label for password strength
 * @param strength Numeric strength from 0-4
 * @returns String label for the strength
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
  return labels[strength] || 'Unknown';
}

/**
 * Get a color for password strength visualization
 * @param strength Numeric strength from 0-4
 * @returns CSS color for the strength (tailwind classes)
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = [
    'bg-red-500', // Very Weak
    'bg-orange-500', // Weak
    'bg-yellow-500', // Moderate
    'bg-green-400', // Strong
    'bg-green-600'  // Very Strong
  ];
  return colors[strength] || 'bg-gray-300';
}
