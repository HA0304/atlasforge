# AtlasForge — Deployment and Release Runbook

**Target:** Public, CV-ready production deployment by **10 December 2026**.

## 1. Environment

- Next.js app deployed to **Vercel** from GitHub.
- Use GitHub Actions for pull-request CI.
- Keep maps in localStorage and downloadable JSON files; no database needed.
- AI generation requires a server-side model provider key. The editor and procedural generator must still work without it.

## 2. Local verification

From repository root:

```bash
npm ci
npm run lint
npm run test
npm run build
npm run dev
```

If the repo uses a different test script, document the actual script in `package.json` and update CI accordingly. Do not claim a check passed without running it.

## 3. Environment variables

Document actual variable names used by the code. Example:

```dotenv
# Server-side only. NEVER prefix a secret with NEXT_PUBLIC_.
OPENROUTER_API_KEY=replace-with-real-secret
# Optional, if implemented:
AI_MODEL=provider/model-id
```

- Put real values in Vercel project **Environment Variables** and in a local untracked `.env.local`.
- Add `.env.local` to `.gitignore` and provide a safe `.env.example` without secrets.
- Avoid binding the application to a particular model's availability; configure the provider/model and handle missing/quota errors.
- Public demo AI requests need **enforceable rate/budget limits** (e.g. managed rate limiting or provider quota). Do not rely on in-memory rate limiting in serverless hosting.

## 4. GitHub Actions

The PR workflow must:

1. Check out source.
2. Install the project-supported Node LTS version.
3. Run `npm ci`.
4. Run `npm run lint`, `npm run test`, `npm run build`.
5. Fail on errors. Build should not need a live provider call; mock AI in tests.

Protect `main` if available. Feature branches get Vercel previews; production deploys from `main` after review.

## 5. Manual production smoke test

In a fresh browser session:

- [ ] App loads with no console-blocking errors.
- [ ] Create blank map, polygon and label.
- [ ] Pan/zoom and drag objects at multiple zoom levels.
- [ ] Run seeded procedural generation twice with same settings; verify equivalent output.
- [ ] Run one prompt-to-map request with configured AI provider.
- [ ] Edit an AI-generated region and settlement.
- [ ] Export JSON, reimport, verify geometry/IDs.
- [ ] Export PNG; confirm it excludes editor UI.
- [ ] Refresh; verify autosave.
- [ ] Simulate AI unavailable; confirm clear error and procedural fallback.
- [ ] Confirm no secrets appear in browser JS, responses or repository.

## 6. Release artifacts

- Live URL in README and portfolio.
- GitHub repository and tagged `v1.0.0` release.
- Architecture and feature explanation; install/build/deploy instructions.
- At least one high-quality screenshot and example map.
- Limitations and model-provider dependency explained.
- Demo script showing prompt → editable map → JSON save → PNG export.

## 7. Incident and rollback

If production breaks: stop merging, identify last green commit, redeploy a known-good Vercel deployment or revert the faulty commit via PR, verify smoke tests, and record the cause. Never expose API keys while debugging. If provider quota is exhausted, retain editor and procedural mode and show AI as temporarily unavailable.

## 8. Portfolio proof

A CV-ready claim requires an actual working URL (or for CLI/library projects, reproducible versioned installation), not merely a green local build. Keep a dated release checklist with links to production, CI and release tag.
