# Signup failure investigation — 2026-07-19

## Reported symptom

Submitting an email from the public Chévere newsletter form displayed “Something went wrong.”

## Root cause

The production subscribe API, CORS preflight, active-address path, and new-address insert path all succeeded. A fresh production browser also completed a new signup without console errors. The remaining failure was a stale cached copy of the shared public `site.js` from the earlier broken deployment. Most public pages still referenced cache version `20260719-3`, while only the homepage had been bumped to `20260719-4`.

## Fix

- Bumped every public page to `site.js?v=20260719-5`.
- Marked the signup POST as `cache: 'no-store'`.
- Parsed API error responses and replaced the unhelpful generic message with actionable button text.
- Added regression coverage that verifies every public HTML page references the current script version.

## Verification

- Live CORS preflight: passed for `https://www.itschevere.com`.
- Live active-address request: passed.
- Live new-address request: passed.
- Fresh browser signup: passed with no console warnings or errors.
- Disposable test subscriber records: removed after verification.
- Automated tests: 12 passed.
- ESLint: passed.
- Production Next.js build: passed.
