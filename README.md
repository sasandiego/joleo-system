# Joleo Transport — Admin Portal

Internal admin portal for **Joleo Transport**, a trucking company based in Brgy. 164, Caloocan City, Metro Manila. Manages fleet, drivers, clients, pricing, quotes, and bookings — all in one place.

> Phase 1 · Self-hosted on a Nucbox mini PC via Cloudflare Tunnel

---

## Features

| Module | Description |
|---|---|
| **Auth** | Credentials-based login, JWT sessions, middleware-protected routes |
| **Masterlists** | CRUD for trucks, drivers, helpers, clients, and route areas |
| **Rate Settings** | Configurable pricing parameters (diesel price, manpower rates, surcharges, margins) |
| **Pricing Engine** | 18-step pure TypeScript engine — mirrors the Excel computation sheet exactly |
| **Quote Builder** | Live pricing breakdown, PDF quotation generation |
| **Bookings** | State machine (DRAFT → CONFIRMED → DISPATCHED → COMPLETED), conflict detection |
| **Calendar** | Weekly truck availability grid |
| **Dashboard** | Live stats: active bookings, fleet utilization, pending quotes, monthly revenue |

---

## Stack

- **Framework:** Next.js 15.5 (App Router, standalone output)
- **Language:** TypeScript 5 · React 19
- **Styling:** Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`)
- **Database:** PostgreSQL 17 · Prisma 6
- **Auth:** Auth.js v5 (Credentials provider, JWT sessions)
- **Forms:** React Hook Form · Zod
- **PDF:** @react-pdf/renderer
- **Currency:** Decimal.js (no floating-point arithmetic for money)
- **Infrastructure:** Docker · Caddy 2 (reverse proxy) · Cloudflare Tunnel
- **Tests:** Vitest (pricing engine parity tests)

---

## Local Development

### Prerequisites

- Node.js 22+ with [corepack](https://nodejs.org/api/corepack.html) enabled
- pnpm (activated via corepack)
- Docker (Docker Desktop or [Colima](https://github.com/abiosoft/colima) on macOS)

### 1. Install dependencies

```bash
corepack enable pnpm
pnpm install
```

### 2. Start local Postgres

```bash
# Docker Desktop
docker compose -f docker-compose.dev.yml up -d

# Colima (macOS)
DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" docker compose -f docker-compose.dev.yml up -d
```

### 3. Set up environment

```bash
cp .env.example .env.local
# Fill in AUTH_SECRET and seed admin credentials
```

`.env` is read by Prisma CLI (already committed with the dev `DATABASE_URL`).

### 4. Push schema and seed data

```bash
pnpm db:push    # Sync schema to local DB
pnpm db:seed    # Seed truck types, trucks, drivers, helpers, route areas, clients, rate settings, 3 admin users
```

### 5. Run dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) · Login with the credentials set in `.env.local` (`SEED_ADMIN_1_*`).

---

## Production Deployment (Nucbox)

The stack runs as four Docker containers: `postgres`, `web` (Next.js), `caddy` (reverse proxy), `cloudflared` (tunnel).

```bash
# On the Nucbox
cp .env.example .env
# Fill in all values (AUTH_SECRET, POSTGRES_PASSWORD, CLOUDFLARE_TUNNEL_TOKEN, NEXTAUTH_URL)

docker compose up -d --build
```

HTTPS is terminated by Cloudflare Tunnel — Caddy handles plain HTTP internally.

### One-time setup

1. Create a Cloudflare Tunnel in the Zero Trust dashboard → copy the token to `CLOUDFLARE_TUNNEL_TOKEN`
2. Set `NEXTAUTH_URL` to the public tunnel URL
3. Run `docker compose exec web pnpm db:push && pnpm db:seed` to initialize the DB

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/          # Protected admin pages (sidebar layout)
│   │   ├── dashboard/
│   │   ├── trucks/
│   │   ├── drivers/
│   │   ├── helpers/
│   │   ├── clients/
│   │   ├── route-areas/
│   │   ├── rate-settings/
│   │   ├── quotes/
│   │   ├── bookings/
│   │   ├── calendar/
│   │   └── users/
│   ├── (auth)/
│   │   └── login/
│   └── api/auth/[...nextauth]/
├── actions/              # Server Actions (mutations)
├── components/
│   ├── layout/           # Sidebar, PageHeader
│   ├── auth/             # LoginForm
│   └── [feature]/        # Feature-specific components
├── features/
│   ├── auth/             # Auth.js config (edge + full)
│   ├── pricing/          # Pricing engine (pure TS)
│   ├── booking/          # State machine + availability
│   └── quote/            # Quote service
├── lib/
│   ├── db.ts             # Prisma singleton
│   ├── env.ts            # Zod-validated env vars
│   ├── format.ts         # Currency + date formatting (en-PH, Asia/Manila)
│   └── utils.ts          # cn() utility
└── types/
    └── next-auth.d.ts    # Session type augmentation

prisma/
├── schema.prisma
└── seed.ts
```

---

## Key Conventions

- **Currency:** `Decimal.js` in code, `DECIMAL(12,2)` in Postgres — never JavaScript `number` for money
- **Timezone:** All dates in `Asia/Manila`
- **Numbers:** Quote format `QT-YYYYMMDD-NNNN`, Booking format `JOL-YYYYMMDD-NNNN` (daily sequence)
- **Auth:** Split config — `config.edge.ts` (middleware, no Prisma) + `config.ts` (API routes + server components)
- **Pricing:** Engine is pure (no DB calls) — caller resolves `RateSettings` and `TruckType`, passes them in
- **Booking status:** Always via `transitionBooking()` — never direct Prisma status updates

---

## Available Scripts

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm test         # Vitest (pricing engine tests)
pnpm db:push      # Push schema to DB (no migration file)
pnpm db:migrate   # Create migration
pnpm db:seed      # Run seed script
pnpm db:studio    # Open Prisma Studio
pnpm db:generate  # Regenerate Prisma client
```

---

## Environment Variables

See `.env.example` for the full list. Required for production:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL (Cloudflare tunnel hostname) |
| `POSTGRES_USER/PASSWORD/DB` | Docker Compose Postgres config |
| `CLOUDFLARE_TUNNEL_TOKEN` | From Cloudflare Zero Trust dashboard |
| `SEED_ADMIN_*` | Credentials for the 3 seeded admin users |

---

*Phase 1 — Internal admin portal · Phase 2 (client portal) is not in scope for this build.*
