# Portfolio-Wide Release Standard — 10 December 2026

**Applies to:** AtlasForge and every other project intended for the December 10 portfolio release.  
**Purpose:** Make projects demonstrable and credible for internship/CV review without adding unnecessary infrastructure.

## 1. Universal definition of CV-ready

- [ ] Public or appropriately shareable source repository with readable, meaningful commit history.
- [ ] Public working demo **for web apps**; versioned reproducible installation/demo for libraries and CLIs.
- [ ] CI passes lint/tests/build (or project-appropriate checks).
- [ ] README explains problem, technical decisions, features, setup, usage and limitations.
- [ ] Architecture diagram or concise component overview.
- [ ] Screenshots or a short recorded demonstration.
- [ ] Secure environment configuration; no leaked keys or credentials.
- [ ] Fresh-environment build/run verified.
- [ ] Tagged release and verified links.
- [ ] Clear evidence of what the author independently understands and can explain.

## 2. Delivery principle

**Deploy first, improve continuously.** A tested vertical slice in production beats a complex unshipped application. Freeze major features after **5 December**; use **6–10 December** for deployment reliability, documentation and demonstrations.

## 3. Project-appropriate deployment

| Type | Acceptable release evidence |
|---|---|
| Next.js frontend | Live Vercel URL, green CI, usable demo. |
| Full-stack app | Public frontend and reachable backend, documented env vars, health check, no exposed secrets. |
| Simulation engine | Public visualization or reproducible executable plus sample traces, benchmarks and tests. |
| CLI/library | Tagged package/release, documented installation, example commands, tests; website optional. |
| AI-powered app | Demonstrable provider integration, limits/fallback, disclosure of external dependency and cost. |

Do not invent a website for a CLI just to satisfy a checkbox. Do not claim a deployment is live before verifying it.

## 4. Suggested release tracker fields

Project | Repo URL | Demo/release URL | CI status | Build verified | Tests | README | Screenshot/demo | Security checked | Release tag | P0 blockers | Last checked

The existing goals spreadsheet is the execution tracker; this file defines **what qualifies as complete**. Mark each item with evidence, not optimism.

## 5. CV selection

All projects can be linked from GitHub/portfolio, but select **the three strongest** for CV emphasis. Describe measurable engineering outcomes (e.g., deterministic geometry, tests, request validation, performance, deployment), not generic “AI built an app” statements.

## 6. Cross-project release dates

- **By 23 Nov:** Every active project has an identified runnable demo path.
- **By 30 Nov:** Every web app has at least an initial hosted vertical slice; CLIs/libraries have reproducible run instructions.
- **By 5 Dec:** All intended releases build and pass core tests; major feature freeze.
- **6–9 Dec:** Production smoke tests, docs, screenshots, security and fixes.
- **10 Dec:** Verify links, publish tags/releases, update CV/portfolio.

These are targets, not evidence of completed work.
