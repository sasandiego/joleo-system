# SYSTEM_HANDOFF

## Last Updated
2026-05-19 — M2 complete

## Current System State
Next.js 15.5 app running. Login, auth guard, session, and Users page are all working. DB seeded with full masterlist data + 3 admin users. Login with `jess` / `admin123` to enter.

## Architecture Snapshot
- `src/app/layout.tsx` — root layout, loads 3 fonts via next/font/google
- `src/app/globals.css` — Tailwind v4 @import + @theme brand tokens + :root CSS vars
- `src/app/(admin)/layout.tsx` — grid layout: 240px Sidebar + main; reads session from auth()
- `src/app/(admin)/dashboard/page.tsx` — stub with stat card placeholders
- `src/app/(admin)/users/page.tsx` — users list + password reset dialog
- `src/app/(auth)/login/page.tsx` — two-column mockup layout; uses LoginForm client component
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js handlers
- `src/middleware.ts` — protects all routes via edge config; 307 to /login if unauthenticated
- `src/components/layout/Sidebar.tsx` — nav-dot items (no icons), "Transport · Admin" tagline
- `src/components/layout/PageHeader.tsx` — reusable page header
- `src/components/auth/LoginForm.tsx` — client component with useActionState + useFormStatus
- `src/components/users/ResetPasswordDialog.tsx` — Radix Dialog for password reset
- `src/features/auth/config.edge.ts` — edge-safe NextAuth config (no Prisma, for middleware)
- `src/features/auth/config.ts` — full NextAuth config with bcryptjs + Prisma
- `src/actions/auth.ts` — loginAction, signOutAction
- `src/actions/users.ts` — resetPasswordAction
- `src/types/next-auth.d.ts` — session/user/JWT type augmentation
- `src/lib/utils.ts`, `db.ts`, `format.ts`, `env.ts` — utility modules
- `prisma/schema.prisma` — full schema (all models + enums + indexes)
- `prisma/seed.ts` — seeds truck types, trucks, drivers, helpers, route areas, clients, RateSettings, 3 admin users

## Key Decisions
### Decision: Pricing engine includes Steps 1 and 16
- Chose: truck base rate (step 1) and maintenance allowance (step 16) are additive cost line items
- Because: Excel PRICE COMPUTATION had broken cell refs showing both as 0; guide formula is authoritative
- Trade-off: engine output differs from the buggy Excel example; corrected V6 target = ₱18,532 not ₱11,209.60
- Do NOT change unless: business explicitly requests the Excel's incorrect behavior

### Decision: No backup service in Phase 1
- Chose: deferred; docker-compose has 4 services (postgres/web/caddy/cloudflared), no backup
- Because: small data volume; will be added post-Phase 1 polish

### Decision: Quote/Booking number format
- Chose: QT-YYYYMMDD-NNNN / JOL-YYYYMMDD-NNNN, sequence resets daily (Asia/Manila TZ)
- Because: user requested date-identifiable format

### Decision: Tailwind v4 CSS-based config (no tailwind.config.js)
- Chose: brand tokens defined in @theme block inside globals.css
- Because: Tailwind v4 no longer uses JS config
- Do NOT add a tailwind.config.js — use @theme in globals.css instead

### Decision: Auth.js v5 split config
- Chose: `config.edge.ts` (no Prisma) for middleware, `config.ts` (with Prisma) for API + server components
- Because: Next.js middleware runs in Edge Runtime; Prisma uses Node.js APIs
- Pattern: middleware imports `NextAuth(authConfigEdge).auth`; API route and server components import from `config.ts`

### Decision: Seed truck data uses placeholder values
- Chose: placeholder plate numbers (TBD-001..017) and employee IDs (DRV-001..009, HLP-001..007)
- Because: actual Excel files not available during implementation
- Action required: update with real data from JOLEO_TRANSPORT_PRICING_MATRIX.xlsx TRUCK MASTERLIST sheet
- V6 truck type confirmed as 14FT_6W with minBaseRate=4500, fuelKmPerLiter=5.0 (from pricing test case in guide)

## Active Gotchas
- Tailwind v4: `@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` in postcss.config.mjs
- Auth.js v5: package is `next-auth@beta`; NEXTAUTH_URL removed from .env.local; using AUTH_TRUST_HOST=true
- Prisma: schema has `longDistanceSurcharge` field — check schema if adding fields
- `env.ts` validates at startup — if any required var is missing in production, app won't start
- Sidebar uses inline styles (not Tailwind classes) to ensure brand CSS vars apply during SSR before hydration
- After `pnpm db:seed` re-run, seed uses upsert — safe to run multiple times
- `jose` v6 (Auth.js dep) logs Edge Runtime warnings about CompressionStream — harmless, known upstream issue

## Session Continuity
- Last worked on: M2 complete — auth, login page, seed, users page
- Next logical step: M3 — Masterlists CRUD (Trucks, Drivers, Helpers, Clients, Route Areas pages)
- Do NOT touch: `prisma/schema.prisma`, `src/app/globals.css` brand tokens, `src/features/auth/config.edge.ts` + `config.ts`
- DB running: `docker run` joleo-postgres container on localhost:5432
- Dev server: `pnpm dev` (kills old process if port conflict)
