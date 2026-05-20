---
name: joleo-build-state
description: "Joleo build state snapshot — Phase 1 complete + PDF redesign (client-facing, DejaVu ₱ fix, 1-page layout, ISE debug pending)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 69dcdbc1-66d8-4654-88d8-5291b1e62c82
---

**Last build state: 2026-05-20 — Phase 1 complete (M1–M10) + post-M10 polish + PDF redesign. All pushed to `main`.**

## PDF redesign (2026-05-20) — BLOCKER: ISE not yet resolved
- PDF is now client-facing: 7 sections (Client & Booking Details, Truck & Crew, Service Inclusions, Exclusions, Pricing Summary, Terms & Conditions). Internal cost data (line items, overhead, tier grid) removed.
- **₱ fix:** DejaVu Sans Regular (only confirmed font with U+20B1) copied to `public/fonts/`. Bold variant lacks ₱ — amount strings always use Regular weight.
- **React import required:** `import React from "react"` must stay in `QuotationPDF.tsx` — @react-pdf/renderer v4 reconciler calls the component outside the automatic JSX transform scope. Removing it = `ReferenceError: React is not defined`.
- **1-page layout:** Client & Booking Details uses 4 two-column grid rows (not 8 stacked); Truck & Crew uses 2 rows; tight spacing throughout.
- **ISE blocker:** `/api/quotes/[id]/pdf` returns 500 in Next.js; tsx render test passes (27 KB). Try-catch now wraps `renderToBuffer` in `route.tsx` — next test will show actual error text. Fix once error message is known.
- **createdBy tracked:** Both `Quote` and `Booking` have `createdById` → `User` relation. PDF footer shows "Prepared by: [username]".

## Post-M10 polish (2026-05-20)
- Dashboard now matches mockup: Fleet Status card (Active/Under Repair/Inactive via `db.truck.groupBy`), Recent Quotes card (latest 3), "+ New Quote" header button, 2-col split layout
- TruckCalendar Fragment key warning fixed
- Fonts: Google Fonts CDN (literal `<link>` tags), no `next/font`. Per user directive "Do not substitute fonts. Match the Joleo mockup exactly." — do NOT migrate back.
- Favicons: `src/app/icon.png` (32×32) + `src/app/apple-icon.png` (180×180) from `docs/356378784_*.jpg`
- middleware matcher excludes `icon.png`, `apple-icon.png`
- Public URL: **https://joleo.sas-agent.co.uk** via existing Nucbox cloudflared tunnel (ID `bda80536-...`). CNAME created in Cloudflare dashboard.
- `NEXTAUTH_URL=https://joleo.sas-agent.co.uk` in `.env.local`
- pnpm 11 needs `allowBuilds:` booleans in `pnpm-workspace.yaml`

## What's built

| Route | Status |
|---|---|
| /login, /dashboard | ✅ Live with real data |
| /trucks, /drivers, /helpers, /clients, /route-areas | ✅ Full CRUD |
| /rate-settings | ✅ 25-field form, AuditLog change log |
| /quotes, /quotes/new, /quotes/[id] | ✅ Live pricing, save/convert, PDF download |
| /bookings, /bookings/new, /bookings/[id] | ✅ FSM transitions, assignment form, conflict detection |
| /calendar | ✅ Week grid, truck × day, color-coded blocks |
| /api/quotes/[id]/pdf | ✅ @react-pdf/renderer, auth-guarded |

## Critical decisions to not break

- **Pricing engine formula is locked.** Excel had broken cell refs for steps 1 & 16. Engine INCLUDES both — corrected target = ₱18,532 for V6/100km reference case. Do NOT change without explicit business request.
- **Pct fields stored as fractions** (0.05 = 5%). Page ×100 for display; action ÷100 before save; engine receives raw fractions.
- **Decimal serialization:** Call `.toNumber()` at server/client boundary — never pass Prisma Decimal objects to client components.
- **Auth.js v5 split config:** `config.edge.ts` (no Prisma, for middleware) + `config.ts` (full, for API/server components). `AUTH_TRUST_HOST=true` in .env.local.
- **Driver/Helper field name is `fullName`**, not `name`. Easy to get wrong.
- **RouteArea field is `label`**, not `name`.
- **Quote has `truckTypeId` but no `@relation`** in Prisma schema — must do a separate query for truckType in quote detail pages.
- **Booking state machine** in `src/features/booking/state-machine.ts`: DRAFT → QUOTED → CONFIRMED → DISPATCHED → COMPLETED. CANCELLED reachable from any non-terminal. All status changes must go through `transitionBookingAction`.

## Test reference
Run `pnpm test --run` → should be 41/41. If broken, the pricing engine formula was changed.
Manual test guide: `TEST_GUIDE.md` in repo root.

**Why:** These are the non-obvious gotchas that caused build errors in the original session. Knowing them prevents repeat mistakes.

**How to apply:** Before editing any pricing logic, booking actions, or Prisma queries involving Driver/Helper/RouteArea, check these constraints first.
