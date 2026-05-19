# BUILD_PROGRESS

## System Health
Last updated: 2026-05-19

## ✅ Stable — Do Not Touch
### M1 — Foundation
- Next.js 15.5 App Router scaffolded (manual, no create-next-app)
- Tailwind v4 configured (CSS-based, no tailwind.config.js)
- Brand CSS variables + @theme tokens applied in globals.css
- Fraunces / DM Sans / JetBrains Mono fonts loaded via next/font/google
- Prisma 6 schema complete (all models, enums, indexes)
- Prisma client generated
- Sidebar component — all 3 sections, nav-dot active state, brand mark, footer
- Admin layout shell (240px sidebar + main grid)
- Dashboard stub page (stat cards + today's schedule)
- Login stub page
- CLAUDE.md + docs/ context files created
- docker-compose.yml (no backup service), docker-compose.dev.yml, Dockerfile
- ESLint config (flat config for Next.js 15)
- `pnpm build` ✅ clean | ESLint ✅ clean | `pnpm dev` ✅ 200 on /dashboard

### M2 — Auth + Users
- Auth.js v5 split config: `src/features/auth/config.edge.ts` (middleware) + `config.ts` (full)
- Login page — two-column layout matching mockup exactly (white form left, maroon visual right)
- Sidebar updated — nav-dots only (no icons), "Transport · Admin" tagline, "Owner · Admin" footer
- Middleware protects all routes; unauthenticated → /login; logged-in on /login → /dashboard
- Seed script (`prisma/seed.ts`) — 7 truck types, 17 trucks, 9 drivers, 7 helpers, 8 route areas, 5 clients, RateSettings, 3 admin users
- Users page (`/users`) — list with role/status badges, password reset dialog (Radix UI)
- Server actions: `loginAction`, `signOutAction`, `resetPasswordAction`
- Session data flows into sidebar footer (real user name/initials from JWT)
- `pnpm build` ✅ clean | `pnpm db:seed` ✅ | Login ✅ | Middleware ✅ | Users page ✅

## 🔨 In Progress
### M3 — Masterlists CRUD
- Next: Trucks page (list, add, edit, soft-disable) matching mockup screen 6

## 🧪 Experimental (treat as fragile)
_(none)_

## 🚫 Known Issues (Deprioritized)
- favicon.ico missing → 404 in browser console (harmless, add in M10 polish)
- Seed data (trucks, drivers, helpers) uses placeholder plate numbers / employee IDs — update from actual Excel files
- NEXTAUTH_URL removed from .env.local in favor of AUTH_TRUST_HOST=true — dev server port no longer matters

## Milestone Status
| # | Milestone | Status |
|---|---|---|
| M1 | Foundation | ✅ Complete |
| M2 | Auth + Users | ✅ Complete |
| M3 | Masterlists CRUD | 🔨 In Progress |
| M4 | Rate Settings | ⬜ Not started |
| M5 | Pricing Engine | ⬜ Not started |
| M6 | Quote Builder | ⬜ Not started |
| M7 | Bookings + Calendar | ⬜ Not started |
| M8 | Dashboard | ⬜ Not started |
| M9 | Dockerize + Deploy | ⬜ Not started |
| M10 | Polish + Testing | ⬜ Not started |
