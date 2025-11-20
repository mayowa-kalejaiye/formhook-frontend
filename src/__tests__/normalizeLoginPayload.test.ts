// Minimal tests for normalizeLoginPayload
// Run with a TypeScript-aware test runner (jest/ts-jest) or `ts-node`
import { normalizeLoginPayload } from '../services/api';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Format A: user object nested
const formatA = {
  access_token: 'tokA',
  token_type: 'bearer',
  user: {
    id: '123',
    email: 'a@example.com',
    is_verified: true
  }
};

const resA = normalizeLoginPayload(formatA);
assert(resA.access_token === 'tokA', 'access_token mismatch for A');
assert(resA.user && resA.user.userId === '123', 'userId mismatch for A');
assert(resA.user && resA.user.email === 'a@example.com', 'email mismatch for A');

// Format B: user fields at root
const formatB = {
  access_token: 'tokB',
  id: '456',
  email: 'b@example.com',
  verified: false
};

const resB = normalizeLoginPayload(formatB);
assert(resB.access_token === 'tokB', 'access_token mismatch for B');
assert(resB.user && resB.user.userId === '456', 'userId mismatch for B');
assert(resB.user && resB.user.email === 'b@example.com', 'email mismatch for B');

console.log('normalizeLoginPayload tests passed');
