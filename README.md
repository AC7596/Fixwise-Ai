# FixWise AI

**Know what's wrong before you call a pro.**

FixWise AI is a front-end product foundation for an AI-powered home repair
assistant. It helps homeowners describe a repair problem, get informational
guidance on likely causes and next steps, browse a library of repair guides,
and — through **FixWise Kids** and its mascot **Fixy** — turn real repairs
into safe, age-appropriate learning moments for kids.

> "Fix it together. Learn it together." — FixWise Kids
> "I don't know yet — let's figure it out!" — Fixy

This is a **static site** (HTML/CSS/JavaScript, ES modules, no build step)
designed to run on **GitHub Pages**.

---

## What FixWise AI currently does

- **AI Home Diagnosis (front-end demo):** homeowners pick a category and
  describe what they see, hear, smell, and notice, optionally attach photos,
  and get a structured result: most likely causes, other possible causes,
  clarifying questions, step-by-step troubleshooting, tools/parts needed,
  estimated time, DIY difficulty, safety warnings, stop conditions, and
  when to call a professional.
- **Photo upload:** select multiple photos, preview them, and remove any
  before submitting. Photos are attached to the request/demo response but
  are **not** analyzed by AI yet (see below).
- **Repair Guides library:** searchable/filterable guides across Plumbing,
  Electrical, Heating & Cooling, Doors & Windows, Appliances, Walls &
  Drywall, Flooring, Bathrooms, Kitchens, and Basic Home Maintenance. Each
  guide includes symptoms, causes, tools, parts, safety warnings, steps,
  time, difficulty, tips, stop conditions, and when to call a pro.
- **FixWise Kids / Fixy:** a mascot and concept explaining how a child can
  safely follow along with a real repair a parent is doing, with a roadmap
  of future learning activities.
- **Safety system:** a dedicated section calling out high-risk situations
  (electrical, gas/CO, fire, structural, hazardous materials, major leaks,
  sewage, mold, fall hazards) where users should stop and call a professional.
- **DIY vs. Professional level system:** a shared, color-coded scale (Easy
  homeowner check → Beginner DIY → Intermediate DIY → Advanced repair →
  Professional recommended → Emergency/stop immediately) used consistently
  across diagnosis results and repair guides.
- Responsive layout (phone/tablet/desktop), mobile navigation, loading/
  error/empty states, and client-side form validation.

## What is a front-end demonstration (no AI backend yet)

- The diagnosis engine (`js/api/ai-client.js` → `localDemoDiagnosis`) is a
  **keyword-matching stand-in**, not a real AI model. It mirrors the shape
  of a response a real AI backend would return so it can be swapped later
  without changing the UI code.
- Photo analysis is **not performed**. Photos are previewed, attached, and
  passed along in the request, but `analyzePhotos()` honestly reports that
  automatic image analysis is not yet connected — the site never pretends
  to have analyzed an image.
- FixWise Kids features beyond the current mascot/concept (levels, badges,
  parent-linked activities, animated Fixy content, etc.) are shown as a
  "coming soon" roadmap, not working features.
- User accounts, saved projects, repair history, professional referrals,
  parts recommendations, and cost estimates are represented as roadmap
  cards only.

## What requires a secure backend

See **[BACKEND.md](BACKEND.md)** for full details. In short: real AI
diagnosis, real photo analysis, user accounts, saved data, and any feature
that needs an API key or persistent storage requires a secure backend that
GitHub Pages (static hosting) cannot provide directly. **No API keys or
secrets are stored in this repository or any browser-side file.**

## Project structure

```
index.html              Page markup for all sections
styles.css               All styles (mobile-first, responsive)
js/
  main.js                Entry point — wires up all modules
  modules/
    nav.js                Mobile navigation menu
    photo-upload.js        Multi-photo select/preview/remove
    diagnosis.js            Diagnosis form + results rendering
    guides.js                Repair guide search/filter/render
    kids.js                   Fixy interactivity
  data/
    levels.js               Shared DIY/professional level definitions
    diagnosis-data.js        Diagnosis knowledge base (demo logic)
    guides-data.js            Repair guide content (easy to extend)
  api/
    ai-client.js              Placeholder API layer for a future AI backend
```

Adding a new repair guide is a matter of adding one object to the array in
`js/data/guides-data.js` — the search, filter, and rendering code picks it
up automatically.

## How to preview the website

1. Clone or download this repository.
2. Open `index.html` directly in a browser, **or** serve the folder with
   any static server (recommended, since ES modules work more reliably over
   `http://` than `file://`), for example:
   ```bash
   python3 -m http.server 8080
   ```
   then visit `http://localhost:8080`.

## GitHub Pages deployment

This site is published from the `main` branch and requires no build step —
GitHub Pages serves `index.html`, `styles.css`, and the `js/` folder as-is.
All scripts are loaded as ES modules (`<script type="module" src="js/main.js">`),
which GitHub Pages supports without any additional configuration.

## Connecting real AI diagnosis (next step)

1. Build a small secure backend (serverless function or API) that holds the
   real AI provider key **server-side only**.
2. Set the backend URL in `js/api/ai-client.js` (`BACKEND_BASE_URL`).
3. Replace the demo logic in `diagnoseProblem()` / `analyzePhotos()` with a
   `fetch()` call to that backend, keeping the same request/response shape
   already used by `js/modules/diagnosis.js` so no UI code needs to change.
4. See [BACKEND.md](BACKEND.md) for the full checklist.

## Brand note

The product name "FixWise AI" and mascot "Fixy" are kept as-is for this
version. Brand-specific strings are centralized (e.g. level labels in
`js/data/levels.js`) so a future rename would touch a small, well-defined
set of files rather than the whole codebase.
