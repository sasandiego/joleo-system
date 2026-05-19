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

The stack runs as four Docker containers: `postgres`, `web` (Next.js), `caddy` (reverse proxy), `cloudflared` (tunnel). The Nucbox only needs **Docker** installed — no Node.js, no pnpm, no Postgres required on the host.

### First-time setup

```bash
# 1. Clone the repo
git clone https://github.com/sasandiego/joleo-system.git
cd joleo-system

# 2. Generate a secret
openssl rand -base64 32   # copy the output — this is your AUTH_SECRET

# 3. Create the environment file
cp .env.example .env
# Open .env and fill in:
#   AUTH_SECRET        → the value from step 2
#   POSTGRES_PASSWORD  → a strong password of your choice
#   NEXTAUTH_URL       → your Cloudflare tunnel public URL (e.g. https://joleo.example.com)
#   CLOUDFLARE_TUNNEL_TOKEN → from Cloudflare Zero Trust dashboard (see below)
#   SEED_ADMIN_1_*, SEED_ADMIN_2_*, SEED_ADMIN_3_* → credentials for 3 admin accounts

# 4. Start the stack (builds the Next.js image on first run)
docker compose up -d --build

# 5. Initialize the database (run once after first boot)
docker compose exec web pnpm db:push
docker compose exec web pnpm db:seed
```

HTTPS is terminated by Cloudflare Tunnel — Caddy handles plain HTTP internally.

### Cloudflare Tunnel setup (one-time)

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com) → **Networks → Tunnels → Create tunnel**
2. Name it (e.g. `joleo-nucbox`), choose **Docker** as the connector
3. Copy the `--token` value shown in the install command — that's your `CLOUDFLARE_TUNNEL_TOKEN`
4. Add a public hostname: subdomain → `joleo.yourdomain.com`, service → `http://caddy:80`
5. Set `NEXTAUTH_URL=https://joleo.yourdomain.com` in your `.env`

### Subsequent deploys (after pulling updates)

```bash
git pull
docker compose build web
docker compose up -d web

# Only if the database schema changed (check git log for prisma/schema.prisma changes):
docker compose exec web pnpm db:push
```

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
