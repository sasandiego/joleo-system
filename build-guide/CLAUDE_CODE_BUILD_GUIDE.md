# Joleo Transport — Admin Portal Build Guide

> **Audience:** Claude Code (autonomous build agent)
> **Goal:** Ship Phase 1 — a dockerized admin portal for Joleo Transport, hosted on a Nucbox, exposed via Cloudflare Tunnel.
> **Scope:** Admin Portal only. Customer Portal (Phase 2) is parked.

---

## 0. How to use this guide

- Read this entire document first.
- Work top-to-bottom by milestone. Do not skip ahead.
- After each milestone, run the verification checklist before moving on.
- The HTML mockup (`joleo_mockup.html`) is the **visual source of truth** for layout, color, and component patterns. Match it.
- The two Excel files in the project root are the **business logic source of truth**:
  - `JOLEO_TRANSPORT_PRICING_MATRIX.xlsx` — pricing engine logic + masterlists (canonical)
  - `Joleo_Transport_Operations_Master_Sheet_Intelligent.xlsx` — secondary reference
- When the two Excel files disagree, **PRICING_MATRIX wins**.

---

## 1. Product Overview

**Joleo Transport** is a trucking business in Caloocan City, Philippines, serving Luzon-wide deliveries (Metro Manila, Central Luzon, CALABARZON, North Luzon, South Luzon, Bicol, Mindoro, Palawan).

**Phase 1 — Admin Portal** lets 3 admin users:
1. Manage masterlists (trucks, drivers, helpers, clients, route areas)
2. Configure global rate settings (the pricing engine knobs)
3. Build quotes using a real-time pricing engine that replicates the Excel computation
4. Generate quotation PDFs for clients
5. Convert quotes into bookings, assign trucks/drivers/helpers, track status
6. View truck availability on a weekly calendar to prevent double-booking

**Out of scope (Phase 2, parked):**
- Customer-facing portal, self-service quotes, payment integration, GPS tracking, driver mobile app, public booking flow.

---

## 2. Tech Stack (locked)

| Layer | Choice | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Framework | Next.js (App Router) | 15.5+ |
| Language | TypeScript | 5.x |
| UI | React | 19 |
| Styling | Tailwind CSS v4 + shadcn/ui | latest |
| Database | PostgreSQL | 17 |
| ORM | Prisma | 6.x |
| Auth | Auth.js v5 (Credentials provider) | latest |
| Validation | Zod | latest |
| Forms | React Hook Form + Zod resolver | latest |
| Server state | TanStack Query v5 | latest |
| PDF generation | @react-pdf/renderer | latest |
| Tests | Vitest | latest |
| Container | Docker + Docker Compose | latest |
| Reverse proxy | Caddy 2 | latest |
| Exposure | Cloudflare Tunnel (cloudflared) | latest |

**Important constraints:**
- Use Node 22 LTS in Dockerfile (`node:22-alpine`).
- Use Postgres 17 (`postgres:17-alpine`).
- All currency is PHP (₱). Locale: `en-PH`. Timezone: `Asia/Manila`.

---

## 3. Brand & Design System

### Colors (CSS variables — use these exact values)

```css
--maroon: #7B1E2E;         /* primary */
--maroon-dark: #5C1622;    /* hover/active */
--maroon-light: #9B2D40;
--maroon-tint: #FAF3F4;    /* subtle backgrounds */
--ink: #0A0A0A;            /* primary text */
--ink-soft: #2A2A2A;
--muted: #6B6B6B;
--paper: #FFFFFF;
--surface: #FAFAF9;        /* page background */
--border: #E7E5E4;
--border-strong: #D6D3D1;
--success: #2F7D52;
--warning: #B8801C;
--danger: #B8362B;
```

### Typography
- **Display:** `Fraunces` (serif) for page titles, brand wordmark, large numbers
- **Body:** `DM Sans` for everything else
- **Mono:** `JetBrains Mono` for plate numbers, IDs, currency
- Load via Google Fonts in `app/layout.tsx`

### Aesthetic rules (match mockup)
- Minimalist, editorial feel — generous whitespace
- 1px borders, 6–10px border-radius
- Subtle shadows only (`shadow-sm: 0 1px 2px rgba(0,0,0,0.04)`)
- Maroon is the ONLY accent color — used for primary buttons, active nav, KPI accents
- Page title style: Fraunces 32px, weight 500, letter-spacing -0.02em
- Section labels: uppercase, 11px, letter-spacing 0.1em, color maroon

### Component patterns (defined in mockup)
- **Sidebar:** 240px fixed left, white bg, sections: Operations / Masterlists / Configuration
- **Page header:** title + subtitle on left, action buttons on right, bottom border
- **Stat cards:** value in Fraunces 34px, with 3px maroon right accent strip
- **Tables:** uppercase column headers in surface bg, 14px row padding, hover bg surface
- **Status badges:** small pill, semantic colors (success/warning/danger/neutral/maroon)
- **Truck ID pill:** monospace, black bg, white text (`<span class="truck-id-pill">V6</span>`)

> Open `joleo_mockup.html` in a browser. Every UI decision should match what you see there.

---

## 4. Repository Layout

```
joleo-portal/
├── docker/
│   ├── Caddyfile
│   ├── cloudflared/config.yml.example
│   └── backup/backup.sh
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx              # sidebar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── quotes/
│   │   │   │   ├── page.tsx            # list
│   │   │   │   ├── new/page.tsx        # quote builder
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── calendar/page.tsx       # truck availability
│   │   │   ├── trucks/page.tsx
│   │   │   ├── drivers/page.tsx
│   │   │   ├── helpers/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── route-areas/page.tsx
│   │   │   ├── rate-settings/page.tsx
│   │   │   └── users/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── quotes/[id]/pdf/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn primitives
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── Topbar.tsx
│   │   ├── domain/
│   │   │   ├── QuoteBuilderForm.tsx
│   │   │   ├── PriceBreakdownPanel.tsx
│   │   │   ├── TruckCalendar.tsx
│   │   │   ├── BookingStatusBadge.tsx
│   │   │   └── TruckIdPill.tsx
│   │   └── pdf/QuotationPDF.tsx
│   ├── features/
│   │   ├── pricing/
│   │   │   ├── engine.ts               # PURE pricing engine
│   │   │   ├── engine.test.ts          # parity tests vs Excel
│   │   │   ├── schemas.ts              # Zod input/output
│   │   │   └── types.ts
│   │   ├── booking/
│   │   │   ├── service.ts
│   │   │   ├── availability.ts         # conflict detection
│   │   │   └── state-machine.ts
│   │   ├── quote/
│   │   │   └── service.ts
│   │   └── auth/
│   │       └── config.ts
│   ├── lib/
│   │   ├── db.ts                       # Prisma client singleton
│   │   ├── auth.ts                     # Auth.js export
│   │   ├── format.ts                   # currency, dates (en-PH, Asia/Manila)
│   │   ├── permissions.ts
│   │   └── env.ts                      # Zod-validated env
│   └── actions/                        # Server Actions
│       ├── quotes.ts
│       ├── bookings.ts
│       ├── trucks.ts
│       └── settings.ts
├── tests/
│   └── pricing-parity.test.ts
├── .env.example
├── .env.local                          # gitignored
├── docker-compose.yml
├── docker-compose.dev.yml
├── Dockerfile
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Data Model (Prisma Schema)

Translate this directly to `prisma/schema.prisma`. Use `cuid()` for IDs. Use `@db.Decimal(12, 2)` for currency, `@db.Decimal(5, 4)` for percentages (stored as fractions, e.g. `0.1200` = 12%).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
}

enum TruckStatus {
  ACTIVE
  UNDER_REPAIR
  INACTIVE
}

enum PersonStatus {
  ACTIVE
  INACTIVE
}

enum BookingStatus {
  DRAFT
  QUOTED
  CONFIRMED
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum VatOption {
  VAT_INCLUSIVE
  VAT_EXCLUSIVE
  NON_VAT
}

enum ServiceType {
  LIPAT_BAHAY
  COMMERCIAL_DELIVERY
  CATERING_DELIVERY
  OTHER
}

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  fullName     String
  role         UserRole @default(ADMIN)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  quotesCreated   Quote[]   @relation("QuoteCreator")
  bookingsCreated Booking[] @relation("BookingCreator")
}

model TruckType {
  id              String  @id @default(cuid())
  code            String  @unique  // "10FT_4W", "14FT_6W", "16FT_DROPSIDE", etc.
  label           String           // "10 ftr - 4 wheels"
  sizeFt          Int
  wheelType       String           // "4-wheel" | "6-wheel"
  fuelKmPerLiter  Decimal @db.Decimal(5, 2)
  minBaseRate     Decimal @db.Decimal(12, 2)
  dailyRate       Decimal @db.Decimal(12, 2)
  excessHourRate  Decimal @db.Decimal(12, 2)

  trucks Truck[]
}

model Truck {
  id          String      @id @default(cuid())
  code        String      @unique  // "V5", "V6", "ELF1"
  plateNo     String      @unique
  truckTypeId String
  truckType   TruckType   @relation(fields: [truckTypeId], references: [id])
  status      TruckStatus @default(ACTIVE)
  remarks     String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  bookings Booking[]
}

model Driver {
  id         String       @id @default(cuid())
  employeeId String       @unique  // e.g. "2013030"
  fullName   String
  dailyRate  Decimal      @db.Decimal(12, 2)
  otRate     Decimal      @db.Decimal(12, 2)
  status     PersonStatus @default(ACTIVE)
  remarks    String?
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  bookings Booking[]
}

model Helper {
  id         String       @id @default(cuid())
  employeeId String       @unique
  fullName   String
  dailyRate  Decimal      @db.Decimal(12, 2)
  otRate     Decimal      @db.Decimal(12, 2)
  status     PersonStatus @default(ACTIVE)
  remarks    String?
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  bookingHelpers BookingHelper[]
}

model Client {
  id            String   @id @default(cuid())
  companyName   String
  contactPerson String?
  mobile        String?
  email         String?
  paymentTerms  String?  // "30 DAYS", "1 WEEK"
  notes         String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  quotes   Quote[]
  bookings Booking[]
}

model RouteArea {
  id              String   @id @default(cuid())
  code            String   @unique  // "METRO_MANILA", "CENTRAL_LUZON"
  label           String
  sampleDest      String?  @db.Text
  distanceMinKm   Int
  distanceMaxKm   Int
  surcharge       Decimal  @db.Decimal(12, 2)
  estimatedToll   Decimal  @db.Decimal(12, 2)
  isLongDistance  Boolean  @default(false)
  remarks         String?
}

// SINGLETON: only one row, id = 1. Fully captures RATE SETTINGS sheet.
model RateSettings {
  id                     Int      @id @default(1)
  // FUEL & OPERATIONS
  dieselPricePerLiter    Decimal  @db.Decimal(8, 2)   // 70.00
  fuelSurchargePct       Decimal  @db.Decimal(5, 4)   // 0.0500

  // MANPOWER
  driverDailyRate        Decimal  @db.Decimal(12, 2)  // 800
  driverOtRate           Decimal  @db.Decimal(12, 2)  // 150
  helperDailyRate        Decimal  @db.Decimal(12, 2)  // 600
  helperOtRate           Decimal  @db.Decimal(12, 2)  // 100
  additionalHelperRate   Decimal  @db.Decimal(12, 2)  // 600

  // SERVICE INCLUSIONS
  standardIncludedHours  Int                          // 8
  additionalHourRate     Decimal  @db.Decimal(12, 2)  // 350
  additionalDropoffCharge Decimal @db.Decimal(12, 2)  // 300

  // SPECIAL SERVICE FEES
  condoHandlingFee       Decimal  @db.Decimal(12, 2)  // 500
  cateringHandlingFee    Decimal  @db.Decimal(12, 2)  // 400
  loadingUnloadingFee    Decimal  @db.Decimal(12, 2)  // 0
  nightDeliverySurcharge Decimal  @db.Decimal(12, 2)  // 500
  waitingTimeChargePerHr Decimal  @db.Decimal(12, 2)  // 200

  // DISTANCE SURCHARGES
  outOfTownSurcharge     Decimal  @db.Decimal(12, 2)  // 500
  longDistanceSurcharge  Decimal  @db.Decimal(12, 2)  // 1500
  distanceRatePerKm      Decimal  @db.Decimal(12, 2)  // 12

  // COST ALLOCATIONS (fractions)
  maintenancePctOfBase   Decimal  @db.Decimal(5, 4)   // 0.0800
  overheadPctOfDirect    Decimal  @db.Decimal(5, 4)   // 0.1000
  contingencyPctOfDirect Decimal  @db.Decimal(5, 4)   // 0.0300

  // PROFIT MARGINS (fractions)
  floorMarginPct         Decimal  @db.Decimal(5, 4)   // 0.1500
  targetMarginPct        Decimal  @db.Decimal(5, 4)   // 0.2500
  ceilingMarginPct       Decimal  @db.Decimal(5, 4)   // 0.4000

  // TAX
  vatRate                Decimal  @db.Decimal(5, 4)   // 0.1200

  updatedAt              DateTime @updatedAt
  updatedBy              String?
}

model Quote {
  id              String      @id @default(cuid())
  quoteNo         String      @unique  // "QT-2026-0389"
  status          String      @default("DRAFT") // DRAFT | SENT | ACCEPTED | REJECTED | EXPIRED
  quotedAt        DateTime    @default(now())

  clientId        String?
  client          Client?     @relation(fields: [clientId], references: [id])
  walkInName      String?     // when no client record

  serviceType     ServiceType @default(LIPAT_BAHAY)
  pickupPoint     String
  dropoffPoint    String
  routeAreaId     String?
  estimatedDistanceKm Int
  estimatedHours  Int?
  numberOfDropoffs Int        @default(1)

  // Truck/crew (suggested at quote time, finalized at booking)
  truckTypeId     String?
  numberOfHelpers Int         @default(1)

  // Flags
  condoService    Boolean     @default(false)
  cateringService Boolean     @default(false)
  nightDelivery   Boolean     @default(false)
  additionalHelper Boolean    @default(false)
  outOfTown       Boolean     @default(false)
  longDistance    Boolean     @default(false)

  // Costs
  tollFee         Decimal     @db.Decimal(12, 2) @default(0)
  parkingFee      Decimal     @db.Decimal(12, 2) @default(0)
  fuelPriceOverride Decimal?  @db.Decimal(8, 2)
  discountAmount  Decimal     @db.Decimal(12, 2) @default(0)
  vatOption       VatOption   @default(VAT_INCLUSIVE)

  // Snapshot of pricing engine output at the moment of quote
  pricingSnapshot Json        // full PricingResult, includes rateSettings used
  finalPrice      Decimal     @db.Decimal(12, 2)
  manualOverridePrice Decimal? @db.Decimal(12, 2)

  notes           String?     @db.Text

  createdById     String
  createdBy       User        @relation("QuoteCreator", fields: [createdById], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  booking         Booking?
}

model Booking {
  id              String        @id @default(cuid())
  bookingNo       String        @unique  // "JOL-2026-0245"
  status          BookingStatus @default(DRAFT)

  quoteId         String?       @unique
  quote           Quote?        @relation(fields: [quoteId], references: [id])

  clientId        String?
  client          Client?       @relation(fields: [clientId], references: [id])
  walkInName      String?

  // Schedule
  scheduledDate   DateTime      @db.Date
  scheduledStartTime String?    // "06:30"
  scheduledEndTime   String?    // "18:00"
  actualStartAt   DateTime?
  actualEndAt     DateTime?

  // Trip details
  pickupPoint     String
  dropoffPoint    String
  estimatedDistanceKm Int
  routeAreaId     String?

  // Assignment
  truckId         String?
  truck           Truck?        @relation(fields: [truckId], references: [id])
  driverId        String?
  driver          Driver?       @relation(fields: [driverId], references: [id])
  helpers         BookingHelper[]

  // Financial
  quotedAmount    Decimal       @db.Decimal(12, 2)
  finalAmount     Decimal?      @db.Decimal(12, 2)

  notes           String?       @db.Text
  cancelReason    String?

  createdById     String
  createdBy       User          @relation("BookingCreator", fields: [createdById], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([scheduledDate])
  @@index([truckId, scheduledDate])
  @@index([status])
}

model BookingHelper {
  bookingId String
  helperId  String
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  helper    Helper  @relation(fields: [helperId], references: [id])

  @@id([bookingId, helperId])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String   // "RATE_SETTINGS_UPDATED", "BOOKING_CANCELLED", etc.
  entityType String?
  entityId   String?
  before     Json?
  after      Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
}
```

---

## 6. The Pricing Engine — Critical

This is the core of Phase 1. **It must produce values identical to the Excel `PRICE COMPUTATION` sheet** for the same inputs. Implement as a **pure TypeScript module** in `src/features/pricing/engine.ts`.

### 6.1 Inputs

```typescript
type PricingInput = {
  // Trip
  estimatedDistanceKm: number;
  numberOfDropoffs: number;
  estimatedJobHours: number;
  includedHours: number;          // default from settings.standardIncludedHours

  // Truck + crew
  truckTypeCode: string;          // resolves to minBaseRate, fuelKmPerLiter
  numberOfHelpers: number;

  // Flags
  condoService: boolean;
  cateringService: boolean;
  nightDelivery: boolean;
  additionalHelper: boolean;
  outOfTown: boolean;
  longDistance: boolean;          // distance > 200km one-way

  // Costs
  tollFee: number;
  parkingFee: number;
  fuelPriceOverride?: number;
  discountAmount: number;
  vatOption: 'VAT_INCLUSIVE' | 'VAT_EXCLUSIVE' | 'NON_VAT';
};

type PricingContext = {
  settings: RateSettings;  // from DB
  truckType: TruckType;    // resolved
};
```

### 6.2 Computation steps (mirror Excel SECTION D exactly)

```
Step 1.  truckBaseRate     = truckType.minBaseRate
Step 2.  distanceCharge    = distanceKm * settings.distanceRatePerKm
Step 3.  fuelCost          = (distanceKm / truckType.fuelKmPerLiter)
                             * effectiveDieselPrice
                             * 2                              // round-trip
                             * (1 + settings.fuelSurchargePct)
Step 4.  driverCost        = settings.driverDailyRate
Step 5.  helperCost        = settings.helperDailyRate * numberOfHelpers
Step 6.  additionalHelperCost = additionalHelper ? settings.additionalHelperRate : 0
Step 7.  excessHoursCost   = max(0, estimatedJobHours - includedHours)
                             * settings.additionalHourRate
Step 8.  extraDropoffCharge = max(0, numberOfDropoffs - 1)
                              * settings.additionalDropoffCharge
Step 9.  condoFee          = condoService ? settings.condoHandlingFee : 0
Step 10. cateringFee       = cateringService ? settings.cateringHandlingFee : 0
Step 11. loadUnloadFee     = settings.loadingUnloadingFee
Step 12. nightSurcharge    = nightDelivery ? settings.nightDeliverySurcharge : 0
Step 13. outOfTownSurcharge = outOfTown ? settings.outOfTownSurcharge : 0
Step 14. longDistSurcharge = longDistance ? settings.longDistanceSurcharge : 0
Step 15. tollAndParking    = tollFee + parkingFee
Step 16. maintenanceAllowance = truckBaseRate * settings.maintenancePctOfBase

directCostSubtotal = sum(steps 1..16)

Step 17. overheadAllocation = directCostSubtotal * settings.overheadPctOfDirect
Step 18. contingencyBuffer  = directCostSubtotal * settings.contingencyPctOfDirect

totalCostBeforeProfit = directCostSubtotal + overheadAllocation + contingencyBuffer

floorPrice   = totalCostBeforeProfit / (1 - settings.floorMarginPct)
targetPrice  = totalCostBeforeProfit / (1 - settings.targetMarginPct)
ceilingPrice = totalCostBeforeProfit / (1 - settings.ceilingMarginPct)

basePriceForVat = targetPrice - discountAmount

VAT logic:
  if VAT_EXCLUSIVE → vat = basePriceForVat * vatRate,           final = basePriceForVat + vat
  if VAT_INCLUSIVE → vat = basePriceForVat - (basePriceForVat / (1 + vatRate)),
                                                                final = basePriceForVat
  if NON_VAT       → vat = 0,                                   final = basePriceForVat
```

### 6.3 Warnings (Section E in Excel)

```
priceVsFloor:
  - "ERROR" if finalPrice < floorPrice
  - "OK" otherwise

jobHours:
  - "WARNING" if estimatedJobHours > includedHours and additional hour rate not factored
  - "OK" otherwise

profitMargin:
  - actualMargin = (finalPrice - totalCostBeforeProfit) / finalPrice
  - "ERROR" if actualMargin < floorMarginPct
  - "WARNING" if actualMargin > ceilingMarginPct
  - "OK" otherwise
```

### 6.4 Output

```typescript
type PricingResult = {
  // Line items in order, for display in breakdown panel
  lineItems: Array<{
    code: string;          // "TRUCK_BASE_RATE"
    label: string;         // "1. Truck Base Rate"
    basis: string;         // "Min rate for selected truck type"
    amount: number;        // 4500.00
  }>;

  directCostSubtotal: number;
  overheadAllocation: number;
  contingencyBuffer: number;
  totalCostBeforeProfit: number;

  floorPrice: number;
  targetPrice: number;
  ceilingPrice: number;

  discountAmount: number;
  priceAfterDiscount: number;
  vatAmount: number;
  finalPrice: number;
  actualMarginPct: number;

  warnings: Array<{
    code: 'PRICE_VS_FLOOR' | 'JOB_HOURS' | 'PROFIT_MARGIN';
    level: 'OK' | 'WARNING' | 'ERROR';
    message: string;
  }>;

  // Snapshot for audit
  rateSnapshot: RateSettings;
  inputsSnapshot: PricingInput;
  computedAt: string;
};
```

### 6.5 Parity tests (MANDATORY)

Create `src/features/pricing/engine.test.ts` with **at least these reference cases** drawn from the Excel sheet:

**Test Case 1: The Excel example (must match exactly)**
- Inputs: V6 truck (14ft-6w, fuel 5km/L, min rate 4500), distance 100km, 2 dropoffs, 2 helpers, condo=yes, outOfTown=yes, VAT_INCLUSIVE, 8 included hours, 8 job hours, 0 toll/parking/discount
- Use default RateSettings (diesel 70, fuel surcharge 5%, distance rate 12, etc.)
- **Expected:**
  - directCostSubtotal ≈ ₱7,440 (but recompute precisely — Excel showed 7,440 without step 16 visible; include maintenance: 4500 × 0.08 = 360, so 7,800)
  - **NOTE:** the Excel snapshot showed 7,440 with maintenance shown as 0 — this is because Excel's row for maintenance was empty in the snapshot. Engine should include it per the formula.
  - targetPrice ≈ ₱11,209.60
  - finalPrice ≈ ₱11,209.60 (VAT_INCLUSIVE, no discount)
  - actualMargin ≈ 0.25

**Test Case 2:** Distance < 30km, Metro Manila, no surcharges, single drop, 1 helper, VAT_EXCLUSIVE — small local job

**Test Case 3:** Long-distance to Baguio (350km, longDistance=true, outOfTown=true), 20ft truck, 2 helpers

**Test Case 4:** Discount applied with VAT_INCLUSIVE

**Test Case 5:** Floor margin violation — verify warning

**Tolerance:** Use rounding to 2 decimal places (currency). Allow ±₱0.01 floating-point delta.

### 6.6 Implementation rules
- ALL math uses `Decimal.js` (`npm i decimal.js`) — NOT JavaScript `number`. The Excel values are exact and we need parity.
- Each line item gets a code constant — don't string-match labels.
- Engine is **pure** — no DB access, no side effects. Caller resolves `RateSettings` and `TruckType` and passes them in.
- Return values are plain numbers (converted from Decimal at the boundary), but keep precision internally.

---

## 7. Booking State Machine

```
DRAFT ──────► QUOTED ──────► CONFIRMED ──────► DISPATCHED ──────► COMPLETED
   │              │              │                  │
   └──────────────┴──────────────┴──────────────────┴──► CANCELLED
```

Rules (`src/features/booking/state-machine.ts`):

| From | Allowed transitions |
|---|---|
| DRAFT | QUOTED, CANCELLED |
| QUOTED | CONFIRMED, CANCELLED |
| CONFIRMED | DISPATCHED, CANCELLED |
| DISPATCHED | COMPLETED, CANCELLED |
| COMPLETED | — (terminal) |
| CANCELLED | — (terminal) |

Server action `transitionBooking(id, toStatus, reason?)` validates transition, writes audit log, returns updated booking.

---

## 8. Truck Availability

When creating/confirming a booking with a truck assigned:

1. Check no other non-cancelled booking has same `truckId` on same `scheduledDate`
2. Run check in a transaction with `SERIALIZABLE` isolation OR use `SELECT ... FOR UPDATE` on existing bookings for that truck+date
3. Truck must have `status = ACTIVE`
4. If conflict, throw `BookingConflictError` with details

**Calendar view (`/calendar`):** week grid showing 7 days × N trucks. Each cell shows confirmed/dispatched/draft bookings for that truck-day. UNDER_REPAIR/INACTIVE trucks show diagonal stripes (unavailable).

Match the calendar visual exactly from the mockup (`#screen-calendar`).

---

## 9. Authentication

- **Auth.js v5 (NextAuth)** with **Credentials provider** only.
- Password hashing: `bcrypt` (12 rounds).
- Session strategy: `jwt`.
- Middleware (`src/middleware.ts`) protects all `/admin/*` routes. Unauthenticated → redirect to `/login`.
- All 3 admin users seeded from environment (`SEED_ADMIN_*`). No registration UI in Phase 1.
- `/users` page lets existing admins reset another admin's password (not create new ones — that's still through seed for Phase 1).

---

## 10. Seed Data

`prisma/seed.ts` must populate:

1. **3 admin users** — credentials from `.env` (`SEED_ADMIN_1_USERNAME`, `_PASSWORD`, `_FULLNAME`, repeat 2/3)
2. **Truck types** — extract from `JOLEO_TRANSPORT_PRICING_MATRIX.xlsx` sheet `RATE SETTINGS` (MINIMUM BASE RATES BY TRUCK TYPE section) + `TRUCK MASTERLIST`. Should produce: `10FT_4W`, `10FT_6W`, `12FT_6W`, `14FT_6W`, `16FT_6W`, `20FT_6W`, `16FT_DROPSIDE`.
3. **17 trucks** — exact list from `TRUCK MASTERLIST` sheet: V5, V6, V7, V9, V10, V12, V13, V15, V16, V17, V18, V20, V21, V22, V23, ELF1, ELF2 with their plate numbers and types.
4. **9 drivers** from `DRIVER MASTERLIST`.
5. **7 helpers** from `HELPER MASTERLIST`.
6. **8 route areas** from `ROUTE-AREA SETTINGS`.
7. **1 RateSettings row** with id=1 — values from `RATE SETTINGS` sheet (diesel=70, fuelSurcharge=0.05, driverDaily=800, etc.).
8. **5 sample clients** from the `CLIENTS` sheet in the operations workbook.

**Implementation:** Hardcode the values in `seed.ts` as TypeScript constants (do NOT parse Excel at runtime). Reference the Excel files as source of truth, but the seed script is plain TS.

---

## 11. Docker Compose

`docker-compose.yml`:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_TRUST_HOST: "true"
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      TZ: Asia/Manila
    ports:
      - "3000:3000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    depends_on:
      - web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    depends_on:
      - caddy
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}

  backup:
    image: postgres:17-alpine
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      PGUSER: ${POSTGRES_USER}
      PGPASSWORD: ${POSTGRES_PASSWORD}
      PGHOST: postgres
      PGDATABASE: ${POSTGRES_DB}
    volumes:
      - ./backups:/backups
      - ./docker/backup/backup.sh:/backup.sh:ro
    entrypoint: ["/bin/sh", "-c"]
    command: |
      "while true; do
         sleep 86400;
         /backup.sh;
       done"

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

**`Dockerfile`** — multi-stage Next.js standalone build (Node 22 alpine). Standard `output: 'standalone'` pattern.

**`docker/Caddyfile`:**
```
:80 {
  reverse_proxy web:3000
}
```
(HTTPS is terminated at Cloudflare Tunnel — no certs needed in Caddy.)

**`docker/backup/backup.sh`:**
```sh
#!/bin/sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -Fc > /backups/joleo_${TIMESTAMP}.dump
# Keep last 14 days
find /backups -name "joleo_*.dump" -mtime +14 -delete
```

### Cloudflare Tunnel setup (manual, document in README)

1. In Cloudflare Zero Trust dashboard → Networks → Tunnels → Create a tunnel (name: `joleo-nucbox`).
2. Copy the tunnel token. Set as `CLOUDFLARE_TUNNEL_TOKEN` in `.env`.
3. Add a public hostname routing to `http://caddy:80` (use any free `*.cfargotunnel.com` subdomain or a custom domain if added).
4. Update `NEXTAUTH_URL` to the public hostname.

---

## 12. Environment Variables

`.env.example`:

```
# Postgres
POSTGRES_USER=joleo
POSTGRES_PASSWORD=change-me
POSTGRES_DB=joleo

# Next / Auth
DATABASE_URL=postgresql://joleo:change-me@localhost:5432/joleo
AUTH_SECRET=                      # generate: openssl rand -base64 32
NEXTAUTH_URL=https://your-subdomain.cfargotunnel.com
NODE_ENV=production

# Seed admins (3)
SEED_ADMIN_1_USERNAME=jess
SEED_ADMIN_1_PASSWORD=
SEED_ADMIN_1_FULLNAME=Jess R.
SEED_ADMIN_2_USERNAME=admin2
SEED_ADMIN_2_PASSWORD=
SEED_ADMIN_2_FULLNAME=
SEED_ADMIN_3_USERNAME=admin3
SEED_ADMIN_3_PASSWORD=
SEED_ADMIN_3_FULLNAME=

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=
```

Validate at startup with Zod in `src/lib/env.ts`.

---

## 13. Build Milestones

Work through these in order. Verify each before moving on.

### M1 — Foundation
- [ ] Bootstrap Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [ ] Configure fonts (Fraunces, DM Sans, JetBrains Mono)
- [ ] Apply brand CSS variables in `globals.css`
- [ ] Set up Prisma + Postgres locally
- [ ] Build sidebar layout shell matching mockup
- [ ] **Verify:** `pnpm dev` runs, sidebar renders identical to mockup

### M2 — Auth + Users
- [ ] Auth.js v5 with Credentials provider
- [ ] Login page matching mockup screen 1
- [ ] Middleware protecting `/admin/*`
- [ ] Seed 3 admin users from env
- [ ] **Verify:** Can log in, sessions persist, logout works

### M3 — Masterlists CRUD
- [ ] Trucks page (matching mockup screen 6) — list, add, edit, soft-disable
- [ ] Drivers page — same pattern
- [ ] Helpers page — same pattern
- [ ] Clients page — same pattern
- [ ] Route Areas page — same pattern
- [ ] Truck Types page (or embed in Trucks page) — read-only after seed
- [ ] **Verify:** Can CRUD all entities; data persists; validation works

### M4 — Rate Settings
- [ ] Single-form Rate Settings page (matching mockup screen 7)
- [ ] Server action to update with audit log
- [ ] **Verify:** Changes persist; "view change log" shows history

### M5 — Pricing Engine ⭐ (highest risk)
- [ ] Implement `engine.ts` with decimal.js
- [ ] Write 5+ parity tests against Excel reference values
- [ ] Run tests: `pnpm test` — all green
- [ ] **Verify:** Open the Excel `PRICE COMPUTATION` sheet, change inputs, compare with engine output for same inputs. Must match to ±₱0.01.

### M6 — Quote Builder
- [ ] Quote builder page matching mockup screen 3
- [ ] Form on left, live PriceBreakdownPanel on right (recomputes on every change)
- [ ] Save as draft, save & convert to booking
- [ ] PDF generation with @react-pdf/renderer matching `QUOTATION SUMMARY` sheet layout
- [ ] **Verify:** End-to-end create a quote → PDF downloads → values match engine

### M7 — Bookings + Calendar
- [ ] Bookings list page matching mockup screen 4
- [ ] Booking detail page (state machine actions)
- [ ] Truck availability calendar matching mockup screen 5
- [ ] Conflict detection on assign
- [ ] **Verify:** Try to double-book a truck — gets clear error. Calendar reflects all bookings.

### M8 — Dashboard
- [ ] Dashboard matching mockup screen 2
- [ ] Real stats from DB (active bookings, fleet status, today's schedule)
- [ ] **Verify:** All numbers reflect real data; today's schedule shows real bookings

### M9 — Dockerize + Deploy
- [ ] Dockerfile (multi-stage, standalone Next.js output)
- [ ] docker-compose.yml with all 5 services
- [ ] Caddyfile
- [ ] Backup script
- [ ] Cloudflare Tunnel setup documented in README
- [ ] **Verify:** `docker compose up -d` boots cleanly on a fresh machine; portal accessible via tunnel URL

### M10 — Polish + Testing
- [ ] All form validations match Zod schemas
- [ ] Error states match design system (no raw stack traces)
- [ ] Loading states (skeleton or spinner) on every async UI
- [ ] Empty states ("No bookings yet — create your first quote")
- [ ] Currency formatting consistent (`₱1,234.56`, en-PH locale)
- [ ] Date formatting consistent (Asia/Manila timezone)
- [ ] Mobile responsive (sidebar collapses to drawer on <768px)
- [ ] Manual QA pass against each mockup screen
- [ ] **Verify:** Full happy-path walkthrough: log in → create quote → convert to booking → assign truck → dispatch → complete

---

## 14. Verification Checklists

### After every milestone
- [ ] `pnpm build` succeeds with no TS errors
- [ ] `pnpm lint` clean
- [ ] `pnpm test` passes (when tests exist)
- [ ] Docker image builds without warnings
- [ ] No console errors in browser
- [ ] Changes match the corresponding mockup screen

### Before declaring Phase 1 done
- [ ] All 10 milestones complete
- [ ] Pricing engine parity tests all pass
- [ ] All 3 admin users can log in independently
- [ ] Successfully created at least 1 quote, 1 booking, 1 PDF in production deploy
- [ ] Backup script ran at least once and produced a valid dump
- [ ] Cloudflare Tunnel exposes the portal externally with HTTPS
- [ ] README documents: dev setup, deploy steps, backup restore, Cloudflare Tunnel config

---

## 15. Things NOT to do

- ❌ Do not parse the Excel files at runtime. Seed values are hardcoded constants.
- ❌ Do not use floating-point numbers for currency. Use Decimal.js in the engine, Postgres `DECIMAL` in storage.
- ❌ Do not implement customer portal, signup, payment, GPS, tracking, mobile app. Phase 2 is parked.
- ❌ Do not add features not in this guide without asking.
- ❌ Do not deviate from the maroon/white/black palette or swap fonts.
- ❌ Do not use Postgres-only features beyond what's listed. Keep migration to SQLite theoretically possible (no native exclusion constraints, no JSONB indexing).
- ❌ Do not bypass the state machine — all booking status changes go through `transitionBooking`.
- ❌ Do not store passwords in plaintext, even in dev. Always bcrypt.
- ❌ Do not introduce additional dependencies without justification — stick to the listed stack.

---

## 16. Open Questions for the User

If you hit any of these, **stop and ask the human** instead of guessing:

1. Exact wording/branding for the quotation PDF header/footer (company address, tel, email).
2. Whether the V12 (Under Repair) and ELF1 (Under Repair) and ELF2 + V10 (Inactive) statuses in the masterlist should be preserved or normalized to ACTIVE on seed.
3. Whether quote numbers/booking numbers should reset annually or continue across years.
4. Backup retention period (default proposed: 14 days local).
5. Whether to add a "system health" widget on the dashboard (backup status, last DB write) — propose yes for ops visibility.

---

## 17. References

- Mockup file: `joleo_mockup.html` — the visual spec.
- Excel source-of-truth: `JOLEO_TRANSPORT_PRICING_MATRIX.xlsx`
  - `RATE SETTINGS` sheet → seed defaults for `RateSettings` model
  - `TRUCK MASTERLIST` → seed for `Truck` and `TruckType`
  - `DRIVER MASTERLIST` → seed for `Driver`
  - `HELPER MASTERLIST` → seed for `Helper`
  - `ROUTE-AREA SETTINGS` → seed for `RouteArea`
  - `PRICE COMPUTATION` → reference for engine parity tests
  - `QUOTATION SUMMARY` → layout for PDF generation
- Operations workbook: `Joleo_Transport_Operations_Master_Sheet_Intelligent.xlsx` — secondary reference (use for CLIENTS sheet).

When in doubt about a business rule, the Excel files win. When the two Excel files disagree, `PRICING_MATRIX` wins.

---

**End of build guide. Ship Phase 1.**
