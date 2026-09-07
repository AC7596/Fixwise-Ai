# FixWise AI — regression tests

Lightweight, dependency-free regression tests for FixWise AI's front-end
logic modules. These run directly under plain Node.js (no `npm install`,
no test framework, no build step) — consistent with this project's
GitHub-Pages-only, no-build-step constraint.

## Running

From the repository root:

```bash
node tests/regression-malfunction-signal.mjs
node tests/regression-co-vs-co2.mjs
node tests/regression-kids-progress.mjs
```

Each script exits with a non-zero status (via Node's built-in
`assert/strict`) if any check fails, so they can be wired into CI later
without any additional tooling.

## What each file covers

- **regression-malfunction-signal.mjs** — `hasMalfunctionSignal()` in
  `js/api/ai-client.js` uses whole-word/phrase matching (shared with
  `js/data/safety-data.js`) instead of plain substrings, so words like
  "spark" don't false-match inside "sparkling", "trip" inside "triple",
  "dead" inside "deadline", or "crack" inside "crackers". Also confirms the
  core PR fix: "I want to replace my outlets." is treated as an intentional
  replacement (asks a clarifying question) rather than an outlet
  malfunction.
- **regression-co-vs-co2.mjs** — the safety/risk classifier in
  `js/data/safety-data.js` treats carbon monoxide (CO) and carbon dioxide
  (CO2) as separate signals at different severities, so "CO2 alarm" can
  never trigger the carbon-monoxide STOP/emergency response just because
  "CO" is a substring of "CO2" — while genuine CO alarm language still
  reliably triggers it, including when CO2 is mentioned in the same
  sentence.
- **regression-kids-progress.mjs** — `awardActivity()` in
  `js/modules/kids-progress.js` only awards XP and counts an activity
  toward set-completion/badges on its *first* completion; replaying an
  already-completed activity (the "Do it again" flow) is a safe no-op for
  XP, uniqueness, and badge thresholds, and progress correctly persists to
  (and reloads from) `localStorage`.
