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
- Seed script (`prisma/seed.ts`) — 7 truck types, 17 trucks, 9 drivers, 7 helpers, 8 route areas, 5 clients, RateSettings, 3 admin users (real plate numbers from mockup)
- Users page (`/users`) — list with role/status badges, password reset dialog (Radix UI)
- Server actions: `loginAction`, `signOutAction`, `resetPasswordAction`
- Session data flows into sidebar footer (real user name/initials from JWT)
- `pnpm build` ✅ clean | `pnpm db:seed` ✅ | Login ✅ | Middleware ✅ | Users page ✅

### M3 — Masterlists CRUD
- Trucks page — list table, TruckDialog (add/edit), truck type select, status badge
- Drivers page — list table, DriverDialog (add/edit), Decimal rate serialization
- Helpers page — list table, HelperDialog (add/edit), Decimal rate serialization
- Clients page — list table, ClientDialog (add/edit), ToggleClientButton (active/inactive)
- Route Areas page — list table, RouteAreaDialog (add/edit), long-distance badge
- All server actions: Zod validation, upsert pattern, P2002 duplicate handling, revalidatePath
- `pnpm build` ✅ clean | All 5 pages load | CRUD works | Decimal serialization correct

### M4 — Rate Settings
- Single-form settings page covering all 25 RateSettings fields (6 sections)
- VAT rate readonly (locked at 12%)
- Percentage fields stored as fractions, displayed as whole numbers (0.05 ↔ 5)
- Save action: Zod validation → update DB → write AuditLog with before/after snapshot
- "View change log" dialog — last 20 changes, shows field-level diffs (red → green)
- README updated with full NUCBox first-time setup + Cloudflare Tunnel guide
- `pnpm build` ✅ clean | All 13 routes compile | Committed + pushed to GitHub

## 🔨 In Progress
_(none — ready for M5)_

## 🧪 Experimental (treat as fragile)
_(none)_

## 🚫 Known Issues (Deprioritized)
- favicon.ico missing → 404 in browser console (harmless, add in M10 polish)
- AUTH_TRUST_HOST=true in .env.local — dev server port no longer matters

## Milestone Status
| # | Milestone | Status |
|---|---|---|
| M1 | Foundation | ✅ Complete |
| M2 | Auth + Users | ✅ Complete |
| M3 | Masterlists CRUD | ✅ Complete |
| M4 | Rate Settings | ✅ Complete |
| M5 | Pricing Engine | ⬜ Not started |
| M6 | Quote Builder | ⬜ Not started |
| M7 | Bookings + Calendar | ⬜ Not started |
| M8 | Dashboard | ⬜ Not started |
| M9 | Dockerize + Deploy | ⬜ Not started |
| M10 | Polish + Testing | ⬜ Not started |
