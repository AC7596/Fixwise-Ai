# Connecting a Secure AI Backend to FixWise AI

FixWise AI's front end is currently hosted on **GitHub Pages**, which only
serves static files (HTML, CSS, JavaScript, images). Static hosting **cannot
securely hold API keys or secrets** — anything placed in browser-side code
is publicly visible to anyone who views the page source. This document
explains what is needed to connect a real AI diagnosis and photo-analysis
service without exposing credentials.

## Why this matters

If an AI provider API key were placed directly in `js/api/ai-client.js` (or
any other HTML/CSS/JS file), anyone visiting the site could copy it and use
it — potentially running up usage costs or abusing the account. This is why
FixWise AI's diagnosis logic currently runs entirely client-side as a demo,
with no network calls and no keys anywhere in the repository.

## What a production backend needs

1. **A backend service that is not GitHub Pages.** Options include:
   - A serverless function (Azure Functions, AWS Lambda, Cloudflare
     Workers, Vercel/Netlify functions).
   - A small dedicated API server (Node.js/Express, Python/FastAPI, etc.)
     hosted somewhere that supports server-side secrets.
2. **Secret storage on the backend**, such as environment variables or a
   secrets manager, holding the AI provider's API key. The key is never
   sent to or stored in the browser.
3. **An HTTPS API endpoint** the front end can call, for example:
   - `POST /api/diagnose` — accepts category, problem description, and
     symptom fields (what the user sees/hears/smells) and optionally photo
     files; returns a diagnosis object.
   - `POST /api/analyze-photos` — accepts one or more images and returns
     image-analysis results (once real image analysis is available).
4. **Input validation and rate limiting** on the backend to prevent abuse
   and control cost (e.g. limit request size, photo count/size, and
   requests per user/IP).
5. **CORS configuration** on the backend to allow requests from the
   GitHub Pages origin (e.g. `https://<user>.github.io`).
6. **(Optional, for future features) A database and authentication
   provider** for user accounts, saved repair projects, repair history,
   and parent/child linked Fixy activities. This is not required to launch
   basic AI diagnosis, but is needed for the "Product Foundation" roadmap
   items described in the README.

## Response shape the front end expects

To avoid reworking the UI when a real backend is connected, keep the same
shape currently used by the demo logic in `js/api/ai-client.js`:

```jsonc
{
  "matched": true,
  "hasDanger": false,
  "dangerConfig": { "message": "string", "badge": "string" },
  "issue": {
    "causes": ["string", "..."],
    "otherCauses": ["string", "..."],
    "clarifyingQuestions": ["string", "..."],
    "nextCheck": "string",
    "steps": ["string", "..."],
    "tools": ["string", "..."],
    "parts": ["string", "..."],
    "time": "string",
    "difficulty": "easy-check | beginner | intermediate | advanced | professional | emergency",
    "tips": ["string", "..."],
    "stopWhen": "string",
    "safety": "string",
    "pro": "string"
  },
  "category": "string"
}
```

## Steps to connect the real backend

1. Build and deploy the backend endpoint(s) described above.
2. In `js/api/ai-client.js`, set `BACKEND_BASE_URL` to the deployed HTTPS
   URL.
3. Replace the body of `diagnoseProblem()` and `analyzePhotos()` with
   `fetch()` calls to the backend (example code is already sketched in
   comments in that file).
4. Remove or keep `localDemoDiagnosis()` as an offline fallback — your
   choice, but make sure the UI never claims a real AI analyzed something
   when it did not.
5. Test thoroughly, especially error states (network failure, backend
   downtime, invalid responses) since `js/modules/diagnosis.js` already
   has loading/error handling wired up to support this.

## What is intentionally NOT built yet

- No AI provider integration code (this requires choosing a provider and
  backend platform, which is a product/infrastructure decision).
- No authentication/user accounts backend.
- No database for saved projects, repair history, or Fixy progress.
- No real image analysis — this requires an image-capable AI model and
  the same secure-backend pattern described above.

These are deliberately left as documented next steps rather than partial,
insecure implementations.
