import http  from 'k6/http';
import { check } from 'k6';
import { API }   from '../config.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Login and return the access token, or null on failure.
 */
export function login(identifier, password) {
  const res = http.post(
    `${API}/auth/login`,
    JSON.stringify({ identifier, password }),
    { headers: JSON_HEADERS, tags: { name: 'auth/login' } },
  );

  const ok = check(res, {
    'login → 200':        (r) => r.status === 200,
    'login → has token':  (r) => {
      try { return !!JSON.parse(r.body).accessToken; } catch { return false; }
    },
  });

  if (!ok || res.status !== 200) return null;
  return JSON.parse(res.body).accessToken;
}

/**
 * Register a new test user.  Returns true on success.
 * Silently ignores 409 Conflict (user already exists).
 */
export function registerUser(fullName, identifier, password, phone) {
  const res = http.post(
    `${API}/auth/register`,
    JSON.stringify({ fullName, email: identifier, password, phone }),
    { headers: JSON_HEADERS, tags: { name: 'auth/register' } },
  );
  return res.status === 200 || res.status === 201 || res.status === 409;
}

/**
 * Return Authorization header for subsequent authenticated requests.
 */
export function authHeaders(token) {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
