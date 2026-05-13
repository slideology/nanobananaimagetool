# AGENTS.md

This file is for AI coding agents and contributors working in this repository.

## 1. Project Directory Guide

- `app/`: Main React Router v7 application.
- `app/root.tsx`: App root, global layout wrapper, auth bootstrap, and error boundary.
- `app/app.css`: Tailwind CSS 4 and DaisyUI theme setup.
- `app/.server/`: Server-only code for Cloudflare Workers.
- `app/.server/aisdk/`: AI provider clients, including ApiMart image/video generation and Kie AI compatibility paths.
- `app/.server/drizzle/`: Drizzle schema, config, and generated database migrations.
- `app/.server/model/`: Database model helpers.
- `app/.server/services/`: Business services such as AI tasks, credits, orders, R2 storage, GA4, and daily reports.
- `app/components/`: Shared React components, icons, markdown components, and UI primitives.
- `app/features/`: Feature-level UI modules, including image generator, video generator, layout, OAuth, and document shell.
- `app/hooks/`: Shared React hooks.
- `app/routes/`: React Router routes. API routes live in `_api`, webhook routes in `webhooks`, legal pages in `_legal`, metadata routes in `_meta`, and public pages in `base`.
- `app/store/`: Zustand client-side state.
- `app/utils/`: Shared client-safe utilities.
- `workers/`: Cloudflare Worker entrypoint and scheduled handler.
- `test/`: Vitest unit and integration tests.
- `scripts/`: Operational scripts for database queries, reporting, credits, task updates, and prompt scraping.
- `docs/`: Additional engineering, monitoring, and API/database references.
- `public/`: Static public assets, favicon, and ads metadata.
- `migrations/`: Top-level migration history/snapshots kept for compatibility.
- `.github/workflows/`: GitHub Actions documentation. There are no active workflow YAML files in this checkout.

## 2. Startup Commands

- Install dependencies: `npm install`
- Start local development server: `npm run dev`
- Local app URL: `http://localhost:3004`
- Preview production build locally: `npm run preview`

The repository also contains `pnpm-lock.yaml`, and some docs use `pnpm`. Prefer the existing `package.json` scripts; use one package manager consistently within a change.

## 3. Build, Test, and Lint Commands

- Build: `npm run build`
- Type check: `npm run typecheck`
- Generate Cloudflare types: `npm run cf-typegen`
- Run all tests: `npx vitest run`
- Run one test file: `npx vitest run test/<file>.test.ts`
- Deploy test environment: `npm run deploy:test`
- Deploy production: `npm run deploy`
- Generate Drizzle migrations: `npm run db:generate`
- Apply remote migrations: `npm run db:migrate`
- Apply local D1 migrations: `npm run db:migrate:local`

There is currently no configured `lint` script or ESLint config in `package.json`. Do not claim lint passed unless a lint tool is added and run. `README.md` notes that `npm run typecheck` may have existing historical failures; when that happens, record the failure and still run focused tests for changed code.

## 4. Code Style Conventions

- Use TypeScript and ESM imports/exports.
- Keep `strict` TypeScript compatibility in mind; avoid `any` unless interacting with external or legacy APIs where it is already unavoidable.
- Use the `~` path alias for app imports, following existing files such as `~/.server/...`, `~/store`, and `~/hooks/...`.
- Keep server-only logic inside `app/.server/`; do not import server-only modules into client components.
- React components should be functional components using hooks.
- Styling should use Tailwind CSS 4 and DaisyUI classes from `app/app.css`; avoid adding ad hoc global CSS unless it belongs in the theme or shared app styles.
- Follow the surrounding file style. Most current files use two-space indentation and double quotes, though some legacy tests use single quotes. Match the file you edit.
- Keep comments useful and concise. Add comments for business rules, provider quirks, Cloudflare constraints, and non-obvious billing/credit behavior.
- Public copy and UI text are primarily English. Existing Chinese comments/tests may remain when they clarify internal behavior.
- When adding, deleting, or renaming public pages, update sitemap/metadata routes under `app/routes/_meta/` as needed.
- For AI generation changes, preserve the current split: images use ApiMart, Seedance 2.0 video uses ApiMart, and Seedance 1.5 Pro plus historical Kie tasks use Kie compatibility paths.

## 5. Pre-Commit Checklist

- Confirm the working tree only contains intentional changes: `git status --short`.
- Run the most relevant focused tests, for example `npx vitest run test/apimart-image.test.ts` for ApiMart image changes or `npx vitest run test/apimart-video.test.ts test/video-credits.test.ts test/video-model-config.test.ts` for Seedance video changes.
- Run `npm run build` before user-facing or deployment changes.
- Run `npm run typecheck` when touching TypeScript types, routes, Cloudflare bindings, server services, or shared models. If it fails because of known existing issues, include the exact failure summary in your handoff.
- Check that no secrets, tokens, API keys, cookies, or local `.dev.vars` / `.env` values were committed.
- For database changes, update schema and migrations together, then verify the intended D1 migration command.
- For billing, credits, auth, or webhook changes, test both success and failure/rollback paths.
- For Seedance 2.0 changes, verify the four ApiMart models, 1080p restrictions, 1.5x credit multiplier, task polling, thumbnail extraction, and credit rollback on failure.
- For new or removed public pages, verify `robots.txt` and sitemap behavior.
- Do not deploy production until the test environment has been deployed and manually verified.

## 6. Files Not To Change Casually

Only edit these with an explicit reason and extra verification:

- `.dev.vars`, `.env*`: Local secrets and environment-specific credentials.
- `wrangler.jsonc`: Production Cloudflare Worker, D1, KV, R2, cron, routes, and public environment configuration.
- `wrangler.test.jsonc`: Test Cloudflare Worker configuration. Keep it isolated from production where possible.
- `worker-configuration.d.ts`: Generated Cloudflare binding types. Regenerate with `npm run cf-typegen`.
- `.react-router/`, `build/`, `node_modules/`, `.wrangler/`, `*.tsbuildinfo`: Generated or local tool output.
- `package-lock.json`, `pnpm-lock.yaml`: Only update when dependencies actually change, and avoid mixing package manager churn.
- `app/.server/drizzle/schema.ts` and `app/.server/drizzle/migrations/`: Database contract. Changes require migration review.
- `migrations/` and `migrations/meta/`: Migration snapshots/history. Do not hand-edit unless repairing migration metadata deliberately.
- `app/.server/services/credits.ts`, `app/.server/services/order.ts`, `app/routes/webhooks/payment/route.ts`: Billing and credit logic. Require focused tests and rollback-path review.
- `app/.server/services/ai-tasks.ts`, `app/.server/aisdk/`, `app/routes/webhooks/kie-image/route.ts`, `app/routes/webhooks/seedance-video/route.ts`: Provider integrations and async task state transitions. Keep historical task compatibility intact.
- `public/ads.txt`, `app/routes/_meta/[robots.txt]/route.ts`, `app/routes/_meta/[sitemap.xml].tsx`: SEO, ads, and crawler metadata.
- `README.md` deployment sections and production URLs: Keep them accurate; do not rewrite casually.
