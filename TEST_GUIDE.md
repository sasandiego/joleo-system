# Joleo Transport — Test Guide

This guide covers end-to-end testing of all Phase 1 features. Run through each section after deploying or after a major change. No test automation for UI flows — this is a manual walkthrough guide.

---

## 0. Setup & Login

1. Start the app: `pnpm dev` (or `docker compose up` on NUCBox)
2. Navigate to `http://localhost:3000`
3. You should be redirected to `/login`
4. Log in: username `jess`, password `admin123`
5. ✅ You should land on the Dashboard

---

## 1. Dashboard

| What to check | Expected |
|---|---|
| Stat cards show numbers | Active Bookings, Fleet Active, Quotes This Month, Revenue MTD — all show real values (will be 0/low on a fresh seed) |
| Today's Schedule | Shows bookings scheduled for today, or "No bookings" empty state |
| Links work | "View all bookings →" goes to `/bookings`; booking links go to detail pages |

---

## 2. Masterlists — CRUD

### 2a. Trucks
1. Go to **Masterlists → Trucks**
2. Click **+ Add Truck** — fill in plate no, select a truck type, set status to ACTIVE → Save
3. ✅ New truck appears in list
4. Click the edit button — change the plate number → Save
5. ✅ Updated value shows
6. Try saving with an empty plate number → ✅ Validation error shown

### 2b. Drivers
1. Go to **Masterlists → Drivers** (same tab as Helpers)
2. Add a driver with a unique employee ID
3. ✅ Appears in list with daily rate shown
4. Try adding a duplicate employee ID → ✅ "Already exists" error

### 2c. Clients
1. Go to **Masterlists → Clients**
2. Add a client with a company name
3. Toggle the client to **Inactive** — ✅ Badge changes; client won't appear in new quote dropdowns

### 2d. Route Areas
1. Go to **Masterlists → Route Areas**
2. Edit an existing area — change the surcharge
3. ✅ Value updates and shows in the list

---

## 3. Rate Settings

1. Go to **Configuration → Rate Settings**
2. Change **Diesel Price** from 70 to 75 → **Save changes**
3. ✅ "Last saved" footer updates with timestamp and your username
4. Click **View change log** → ✅ Dialog shows the before/after diff for Diesel Price
5. Revert diesel price back to 70 and save

---

## 4. Quote Builder — Live Pricing

1. Go to **Operations → Quotes** → **+ New Quote**
2. Fill in:
   - Pick-up: `Caloocan City`
   - Drop-off: `Pampanga`
   - Distance: `100`
   - Service: `Lipat-Bahay`
   - Truck Type: `14 Ftr - 6 Wheels` (V6 type)
   - Helpers: `2`
   - Included Hours: `8`, Estimated Hours: `8`
3. ✅ Price Computation panel updates immediately:
   - Truck Base Rate: ₱4,500.00
   - Direct Cost Subtotal: ~₱12,300
   - Target Price: ~₱18,532
4. Change **Condo Service** to Yes → ✅ Condo fee line appears, final price increases
5. Change **Discount** to 2000 → ✅ Final price drops; watch for PRICE_VS_FLOOR error if price drops below floor
6. Set **VAT Option** to VAT-Exclusive → ✅ VAT row appears, final price increases by 12%

### 4a. Save as Draft
7. Fill in required fields (pickup, dropoff, service type) → click **Save as draft**
8. ✅ Redirected to `/quotes/[id]` detail page
9. ✅ Quote shows pricing snapshot, Download PDF button visible

### 4b. Download PDF
10. Click **Download PDF**
11. ✅ PDF downloads as `QT-YYYYMMDD-NNNN.pdf`
12. ✅ PDF shows: Joleo branding, client name, pricing breakdown, floor/target/ceiling, final price

### 4c. Save & Convert to Booking
13. Create a second quote → click **Save & convert to booking**
14. ✅ Quote detail page shows "Converted to Booking" panel with the JOL number

---

## 5. Quotes List

1. Go to `/quotes`
2. ✅ Both quotes created above appear in the list
3. ✅ Status badges: DRAFT
4. Quote number format: `QT-YYYYMMDD-NNNN`
5. Click **View →** on a quote → goes to detail page

---

## 6. Bookings

### 6a. Bookings List
1. Go to **Operations → Bookings**
2. ✅ The booking created from "Save & convert" in step 4c is visible
3. ✅ Status badge: DRAFT
4. Filter by status "CONFIRMED" → ✅ List filters correctly
5. Type a booking ID in the search box → ✅ Filters to that booking

### 6b. Booking Detail & Assignment
1. Click **View →** on a booking
2. In the **Truck & Crew Assignment** section:
   - Select a truck from the dropdown
   - Select a driver
   - Set a scheduled date
   - Click **Save assignment**
3. ✅ "Assignment saved." confirmation shown
4. ✅ Values persist on refresh

### 6c. Status Transitions
5. Still on the booking detail, look at the **Status** panel on the right
6. Click **→ QUOTED**
7. ✅ Status badge updates to QUOTED
8. Click **→ CONFIRMED**
9. ✅ Status updates to CONFIRMED (this also checks truck conflict if truck is assigned)
10. Click **→ DISPATCHED** → ✅ DISPATCHED
11. Click **→ COMPLETED** → ✅ COMPLETED (terminal — no more buttons)

### 6d. Double-Booking Prevention
12. Create a new standalone booking: go to **+ New Booking**
13. Assign the same truck and same date as a CONFIRMED booking
14. ✅ Error: "Truck [code] is already booked on [date] ([bookingNo])."

### 6e. Cancel a Booking
15. Create a new booking (DRAFT)
16. In the Status panel, click **→ CANCELLED**
17. ✅ A cancel reason textarea appears; type a reason → click **→ CANCELLED**
18. ✅ Status changes to CANCELLED; cancel reason shown in a card

---

## 7. Calendar

1. Go to **Operations → Calendar** (linked as "Calendar" in sidebar)
2. ✅ Week grid shows: trucks on rows, 7 days as columns
3. ✅ Confirmed bookings appear as maroon blocks; dispatched as dark blocks; draft as dashed outline
4. ✅ UNDER_REPAIR or INACTIVE trucks show diagonal stripe cells
5. Click **← Prev week** / **Next week →** → ✅ URL updates (`?week=YYYY-MM-DD`), grid reloads with that week's data
6. Click **This week** → ✅ Returns to current week
7. Click a booking block → ✅ Navigates to booking detail

---

## 8. Pricing Engine — Correctness Check

The reference case from the Excel pricing matrix:

| Input | Value |
|---|---|
| Truck | 14 Ftr 6-wheel (V6 type: minBase ₱4,500, 5 km/L) |
| Distance | 100 km |
| Helpers | 2 |
| Condo Service | Yes |
| Out-of-Town | Yes |
| All other flags | No/default |
| Diesel | ₱70/L |
| VAT | Inclusive |
| Discount | ₱0 |

**Expected target price: ₱18,532.00**

In the Quote Builder, set these values and verify the Target tier shows **₱18,532**.

---

## 9. Auth & Security

| Check | Expected |
|---|---|
| Open `http://localhost:3000/dashboard` without logging in | Redirected to `/login` |
| Log in with wrong password | "Invalid credentials" error |
| Log in correctly, open a new tab | Session persists |
| Try `/api/quotes/[any-id]/pdf` while logged out | 401 Unauthorized |

---

## 10. Automated Tests

```bash
pnpm test --run
```

Expected: **41/41 tests pass** (pricing engine unit tests)

These tests verify the pricing engine formulas match the Excel PRICE COMPUTATION sheet to ±₱0.01 across 8 scenarios including: base case, out-of-town, VAT exclusive, excess hours, floor violations, multiple dropoffs, and condo service.

---

## Known Limitations (Phase 1)

- No email notifications
- No customer-facing quote portal
- No backup service (deferred to Phase 2)
- Booking number is generated at creation time in Asia/Manila TZ; sequence resets daily
- PDF generation uses server-side rendering — works correctly in production; in dev with turbopack there may be minor rendering differences
