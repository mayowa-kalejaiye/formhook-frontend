# Backend Authentication Security Guide

## Password Storage
- **NEVER** store passwords in plain text
- Use strong, modern hashing algorithms like Argon2id (preferred), bcrypt, or at minimum scrypt
- Always include a unique salt for each user
- Use appropriate work factors that balance security and performance

## Implementation Example (Python/FastAPI with Argon2)

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Initialize the password hasher with secure parameters
ph = PasswordHasher(
    time_cost=3,      # Number of iterations
    memory_cost=65536, # Memory usage in kibibytes (64 MB)
    parallelism=4,    # Degree of parallelism
    hash_len=32,      # Length of the hash in bytes
    salt_len=16       # Length of the salt in bytes
)

# Hashing a password when user registers
def create_user(email: str, password: str):
    hashed_password = ph.hash(password)
    # Store email and hashed_password in database
    # Never store the original password
    
# Verifying a password when user logs in
def verify_user(email: str, password: str):
    # Get the hashed_password from database for this email
    try:
        is_valid = ph.verify(hashed_password, password)
        return is_valid
    except VerifyMismatchError:
        return False
```

## JWT Token Security
- Use strong signing keys (at least 256 bits)
- Set appropriate expiration times (short-lived tokens)
- Include only necessary claims in the payload
- Consider using refresh tokens for better security

## HTTPS
- Always use HTTPS in production
- Set the Secure flag on cookies
- Implement HSTS headers

## Additional Security Measures
- Rate limit login attempts
- Implement account lockout after multiple failed attempts
- Log security events
- Consider implementing multi-factor authentication
