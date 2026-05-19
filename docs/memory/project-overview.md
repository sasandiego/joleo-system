---
name: joleo-project-overview
description: "Joleo Transport admin portal — Phase 1 COMPLETE, all 10 milestones done, pushed to main"
metadata: 
  node_type: memory
  type: project
  originSessionId: 69dcdbc1-66d8-4654-88d8-5291b1e62c82
---

Joleo Transport Phase 1 admin portal. Trucking business in Caloocan City, Philippines. Admin-only portal for 3 users. Build guide at build-guide/CLAUDE_CODE_BUILD_GUIDE.md, visual spec at build-guide/joleo_mockup.html.

**Stack (locked):** Next.js 15.5 App Router, TypeScript 5, React 19, Tailwind v4 (CSS-based, no tailwind.config.js), Postgres 17, Prisma 6, Auth.js v5 Credentials, Zod, @react-pdf/renderer, Vitest, Docker + Caddy 2 + Cloudflare Tunnel. Currency = Decimal.js / Postgres DECIMAL. Never float. Locale en-PH, timezone Asia/Manila.

**Phase 1 Status: COMPLETE** — All 10 milestones done and pushed to GitHub (`main`). `pnpm build` clean, `pnpm test` 41/41 green as of 2026-05-19.

**Why:** Self-hosted on a Nucbox (mini PC) exposed via Cloudflare Tunnel. No customer-facing features in Phase 1. Phase 2 (customer portal) is parked.

**How to apply:** Phase 1 is feature-complete. Any new work is either bug fixes, Phase 2 scope (must confirm first), or infra changes. Check SYSTEM_HANDOFF.md for current state.
