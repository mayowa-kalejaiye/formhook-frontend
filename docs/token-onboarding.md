# Token Auth — Onboarding & Quick Start

This document explains how to use FormHook's token-based form authentication, typical usage patterns, and security best practices.

## Why use token auth
- Restrict submissions to trusted services or partners.
- Enable server-to-server integrations (CRMs, ingestion jobs, partner APIs).
- Prevent public abuse or spam for sensitive intake forms.
- Provide auditability for programmatic submissions.

## Generating and storing a token
1. Generate a secure random token (recommended: 32+ bytes, hex/base64 encoded).
2. Store the token in a secure location (secret manager, environment variable). Do NOT commit to source control.

Example (generate locally using Node):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Submit examples

### Server-to-server (recommended)

This is the recommended approach for programmatic submissions. The token is sent in the `Authorization` header.

```bash
curl -X POST https://api.yourdomain.com/forms/<FORM_ID>/submit \
  -H "Authorization: Bearer <FORM_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"data":{"email":"user@example.com"}}'
```

### Browser + Server Proxy (keeps token secret)

If you need to collect data from a browser but keep the token secret, post from the browser to your server, then have your server forward the request to FormHook including the token.

```js
// On your server
fetch('https://api.yourdomain.com/forms/<FORM_ID>/submit', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <FORM_TOKEN>', 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

## Security best practices
- Store tokens server-side only (env vars or secret manager).
- Rotate tokens periodically and revoke compromised tokens.
- Log usage (do not log token values) and monitor for unusual activity.
- Use short-lived tokens or scoped tokens if your backend supports them.
- Rate limit token usage and consider IP allowlists for high-sensitivity forms.

## Server-side proxy (example)
- Our frontend includes an example proxy at `/api/public/forms/[formId]` which can call the private backend submit endpoint using a server-side service token. The proxy reads `FORMHOOK_SERVICE_TOKEN` from the server environment. Keep that token secret.

## Troubleshooting
- 401/403 on submit: verify the token is correct and has required permissions.
- 404: confirm the target form exists and the correct endpoint is used.
- If public submit fails but private works when calling directly with token, ensure your frontend service has the token env var set and redeploy.

---

If you want, I can add a short help panel directly inside the Form Settings UI (already added) and add an audit log entry when the proxy uses the service token (also added). If you'd like a per-account token design, I can draft the backend schema and API endpoints next.
