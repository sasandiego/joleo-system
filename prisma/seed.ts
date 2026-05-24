import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── TRUCK TYPES ─────────────────────────────────────────────
// Per-truck-type rates feed the new bottom-up pricing engine.
// eightHourBaseRate: trip_base when billing type = EIGHT_HOUR (local / short trips)
// perTripBaseRate:   trip_base when billing type = PER_TRIP (long-distance flat)
// dailyRate / excessHourRate: retained informational fields (not consumed by engine)
const TRUCK_TYPES = [
  {
    code: "10FT_4W",
    label: "10 Ftr - 4 Wheels",
    sizeFt: 10,
    wheelType: "4-wheel",
    eightHourBaseRate: 2500,
    perTripBaseRate: 3500,
    dailyRate: 2500,
    excessHourRate: 150,
  },
  {
    code: "10FT_6W",
    label: "10 Ftr - 6 Wheels",
    sizeFt: 10,
    wheelType: "6-wheel",
    eightHourBaseRate: 3000,
    perTripBaseRate: 4200,
    dailyRate: 3000,
    excessHourRate: 150,
  },
  {
    code: "12FT_6W",
    label: "12 Ftr - 6 Wheels",
    sizeFt: 12,
    wheelType: "6-wheel",
    eightHourBaseRate: 3500,
    perTripBaseRate: 4900,
    dailyRate: 3500,
    excessHourRate: 175,
  },
  {
    code: "14FT_6W",
    label: "14 Ftr - 6 Wheels",
    sizeFt: 14,
    wheelType: "6-wheel",
    eightHourBaseRate: 4500,
    perTripBaseRate: 6300,
    dailyRate: 4500,
    excessHourRate: 200,
  },
  {
    code: "16FT_6W",
    label: "16 Ftr - 6 Wheels",
    sizeFt: 16,
    wheelType: "6-wheel",
    eightHourBaseRate: 6000,
    perTripBaseRate: 8400,
    dailyRate: 6000,
    excessHourRate: 250,
  },
  {
    code: "20FT_6W",
    label: "20 Ftr - 6 Wheels",
    sizeFt: 20,
    wheelType: "6-wheel",
    eightHourBaseRate: 8000,
    perTripBaseRate: 11200,
    dailyRate: 8000,
    excessHourRate: 300,
  },
  {
    code: "16FT_DROPSIDE",
    label: "16 Ftr - Dropside",
    sizeFt: 16,
    wheelType: "6-wheel",
    eightHourBaseRate: 5000,
    perTripBaseRate: 7000,
    dailyRate: 5000,
    excessHourRate: 250,
  },
] as const;

// ─── TRUCKS ──────────────────────────────────────────────────
// Source: JOLEO_TRANSPORT_PRICING_MATRIX.xlsx → TRUCK MASTERLIST sheet
// Plate numbers + types confirmed from joleo_mockup.html (11 of 17 shown; remainder estimated)
// All trucks ACTIVE per owner. V12 and ELF1 under repair (remarks).
const TRUCKS = [
  { code: "V5",   plateNo: "XHR 788", truckTypeCode: "10FT_4W",     remarks: null },
  { code: "V6",   plateNo: "REP 141", truckTypeCode: "14FT_6W",     remarks: null },
  { code: "V7",   plateNo: "RFZ 534", truckTypeCode: "16FT_6W",     remarks: null },
  { code: "V9",   plateNo: "XKD 180", truckTypeCode: "12FT_6W",     remarks: null },
  { code: "V10",  plateNo: "RJB 646", truckTypeCode: "20FT_6W",     remarks: null },
  { code: "V12",  plateNo: "TQO 775", truckTypeCode: "14FT_6W",     remarks: "Under repair" },
  { code: "V13",  plateNo: "UWI 887", truckTypeCode: "14FT_6W",     remarks: null },
  { code: "V15",  plateNo: "RBH 578", truckTypeCode: "10FT_6W",     remarks: null },
  { code: "V16",  plateNo: "TBD-009", truckTypeCode: "16FT_6W",     remarks: null },
  { code: "V17",  plateNo: "TBD-010", truckTypeCode: "16FT_6W",     remarks: null },
  { code: "V18",  plateNo: "TBD-011", truckTypeCode: "16FT_DROPSIDE", remarks: null },
  { code: "V20",  plateNo: "TBD-012", truckTypeCode: "12FT_6W",     remarks: null },
  { code: "V21",  plateNo: "TBD-013", truckTypeCode: "12FT_6W",     remarks: null },
  { code: "V22",  plateNo: "RHV 542", truckTypeCode: "14FT_6W",     remarks: null },
  { code: "V23",  plateNo: "TBD-015", truckTypeCode: "10FT_6W",     remarks: null },
  { code: "ELF1", plateNo: "XAM 959", truckTypeCode: "14FT_6W",     remarks: "Under repair" },
  { code: "ELF2", plateNo: "XSH 957", truckTypeCode: "16FT_DROPSIDE", remarks: null },
] as const;

// ─── DRIVERS ─────────────────────────────────────────────────
// Source: JOLEO_TRANSPORT_PRICING_MATRIX.xlsx → DRIVER MASTERLIST sheet
// 9 drivers — placeholder employee IDs, update from Excel
const DRIVERS = [
  { employeeId: "DRV-001", fullName: "Juan Santos",     dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-002", fullName: "Pedro Reyes",     dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-003", fullName: "Jose Garcia",     dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-004", fullName: "Carlos Mendoza",  dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-005", fullName: "Antonio Cruz",    dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-006", fullName: "Roberto Dela Cruz", dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-007", fullName: "Miguel Torres",   dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-008", fullName: "Eduardo Flores",  dailyRate: 800, otRate: 150 },
  { employeeId: "DRV-009", fullName: "Ramon Villanueva", dailyRate: 800, otRate: 150 },
] as const;

// ─── HELPERS ─────────────────────────────────────────────────
// Source: JOLEO_TRANSPORT_PRICING_MATRIX.xlsx → HELPER MASTERLIST sheet
// 7 helpers — placeholder employee IDs, update from Excel
const HELPERS = [
  { employeeId: "HLP-001", fullName: "Mario Bautista",  dailyRate: 600, otRate: 100 },
  { employeeId: "HLP-002", fullName: "Andres Castillo",  dailyRate: 600, otRate: 100 },
  { employeeId: "HLP-003", fullName: "Luis Ramos",       dailyRate: 600, otRate: 100 },
  { employeeId: "HLP-004", fullName: "Victor Navarro",   dailyRate: 600, otRate: 100 },
  { employeeId: "HLP-005", fullName: "Ernesto Salazar",  dailyRate: 600, otRate: 100 },
  { employeeId: "HLP-006", fullName: "Felipe Herrera",   dailyRate: 600, otRate: 100 },
  { employeeId: "HLP-007", fullName: "Crisanto Aguilar", dailyRate: 600, otRate: 100 },
] as const;

// ─── ROUTE AREAS ─────────────────────────────────────────────
// Source: JOLEO_TRANSPORT_PRICING_MATRIX.xlsx → ROUTE-AREA SETTINGS sheet
// 8 route areas covering key destinations from Caloocan
const ROUTE_AREAS = [
  {
    code: "METRO_MANILA",
    label: "Metro Manila",
    sampleDest: "Quezon City, Makati, Pasig, Taguig, Paranaque, Valenzuela, Navotas",
    distanceMinKm: 5,
    distanceMaxKm: 50,
    surcharge: 0,
    estimatedToll: 300,
    isLongDistance: false,
    remarks: null,
  },
  {
    code: "CAVITE_LAGUNA",
    label: "Cavite / Laguna",
    sampleDest: "Bacoor, Imus, Dasmariñas, Sta. Rosa, Calamba, San Pedro",
    distanceMinKm: 30,
    distanceMaxKm: 80,
    surcharge: 300,
    estimatedToll: 250,
    isLongDistance: false,
    remarks: null,
  },
  {
    code: "BATANGAS_QUEZON",
    label: "Batangas / Quezon Province",
    sampleDest: "Lipa, Batangas City, Lucena, Tayabas",
    distanceMinKm: 80,
    distanceMaxKm: 180,
    surcharge: 500,
    estimatedToll: 400,
    isLongDistance: false,
    remarks: null,
  },
  {
    code: "CENTRAL_LUZON",
    label: "Central Luzon",
    sampleDest: "Bulacan, Pampanga, Tarlac, Nueva Ecija, Olongapo, Bataan",
    distanceMinKm: 50,
    distanceMaxKm: 200,
    surcharge: 500,
    estimatedToll: 400,
    isLongDistance: false,
    remarks: null,
  },
  {
    code: "NORTH_LUZON",
    label: "North Luzon",
    sampleDest: "La Union, Pangasinan, Baguio, Ilocos",
    distanceMinKm: 180,
    distanceMaxKm: 450,
    surcharge: 1500,
    estimatedToll: 600,
    isLongDistance: true,
    remarks: null,
  },
  {
    code: "BICOL",
    label: "Bicol Region",
    sampleDest: "Naga, Legaspi, Sorsogon, Daet, Masbate",
    distanceMinKm: 380,
    distanceMaxKm: 550,
    surcharge: 1500,
    estimatedToll: 600,
    isLongDistance: true,
    remarks: null,
  },
  {
    code: "MINDORO",
    label: "Mindoro",
    sampleDest: "Calapan, San Jose, Mamburao (via Batangas Port)",
    distanceMinKm: 200,
    distanceMaxKm: 350,
    surcharge: 1500,
    estimatedToll: 400,
    isLongDistance: true,
    remarks: "Includes ferry crossing via Batangas Port",
  },
  {
    code: "ISABELA_CAGAYAN",
    label: "Isabela / Cagayan Valley",
    sampleDest: "Ilagan, Cauayan, Tuguegarao, Santiago City",
    distanceMinKm: 350,
    distanceMaxKm: 500,
    surcharge: 1500,
    estimatedToll: 600,
    isLongDistance: true,
    remarks: null,
  },
] as const;

// ─── CLIENTS ─────────────────────────────────────────────────
// Source: Joleo_Transport_Operations_Master_Sheet — CLIENTS sheet (5 sample clients)
const CLIENTS = [
  {
    clientName: "Sample Client A",
    contactPerson: "Maria Santos",
    mobile: "0917-000-0001",
    email: null,

    notes: null,
  },
  {
    clientName: "Sample Client B",
    contactPerson: "Jose Reyes",
    mobile: "0918-000-0002",
    email: null,
    paymentTerms: "1 WEEK",
    notes: null,
  },
  {
    clientName: "Sample Client C",
    contactPerson: "Ana Cruz",
    mobile: "0919-000-0003",
    email: null,
    paymentTerms: "COD",
    notes: null,
  },
  {
    clientName: "Sample Client D",
    contactPerson: "Carlos Mendez",
    mobile: "0920-000-0004",
    email: null,

    notes: null,
  },
  {
    clientName: "Sample Client E",
    contactPerson: null,
    mobile: "0921-000-0005",
    email: null,
    paymentTerms: "COD",
    notes: null,
  },
] as const;

// ─── RATE SETTINGS (Pricing Config) ───────────────────────────
// Singleton row — id is always 1. Values from Joleo_Update_Guide.md Section C.
const RATE_SETTINGS = {
  id: 1,

  // Labor markups (percentage of Revenue Net of VAT)
  driverRate: 0.15,
  helperRate: 0.075,

  // Overhead & surcharges
  overheadRate: 0.05,
  longDistanceRate: 0.05,
  longDistanceThresholdKm: 50,

  // Fuel config
  dieselPricePerLiter: 70.0,
  fuelFloor: 500,
  fuelEfficiencyKmpl: 5.0,

  // Add-on rates (added to direct costs when triggered)
  additionalHelperRate: 600,
  additionalHourRate: 350,
  additionalDropoffCharge: 300,
  standardIncludedHours: 8,

  // Special service fees
  condoHandlingFee: 500,
  cateringHandlingFee: 400,
  loadingUnloadingFee: 0,

  // Distance
  distanceRatePerKm: 12,

  // Tax (locked by BIR)
  vatRate: 0.12,
} as const;

async function main() {
  console.log("🌱 Seeding database...");

  // ── Truck Types ──────────────────────────────────────────
  console.log("  → Truck types");
  const truckTypeMap: Record<string, string> = {};
  for (const tt of TRUCK_TYPES) {
    const record = await prisma.truckType.upsert({
      where: { code: tt.code },
      update: {
        label: tt.label,
        sizeFt: tt.sizeFt,
        wheelType: tt.wheelType,
        eightHourBaseRate: tt.eightHourBaseRate,
        perTripBaseRate: tt.perTripBaseRate,
        dailyRate: tt.dailyRate,
        excessHourRate: tt.excessHourRate,
      },
      create: {
        code: tt.code,
        label: tt.label,
        sizeFt: tt.sizeFt,
        wheelType: tt.wheelType,
        eightHourBaseRate: tt.eightHourBaseRate,
        perTripBaseRate: tt.perTripBaseRate,
        dailyRate: tt.dailyRate,
        excessHourRate: tt.excessHourRate,
      },
    });
    truckTypeMap[tt.code] = record.id;
  }

  // ── Trucks ───────────────────────────────────────────────
  console.log("  → Trucks");
  for (const t of TRUCKS) {
    await prisma.truck.upsert({
      where: { code: t.code },
      update: {
        plateNo: t.plateNo,
        truckTypeId: truckTypeMap[t.truckTypeCode],
        remarks: t.remarks,
      },
      create: {
        code: t.code,
        plateNo: t.plateNo,
        truckTypeId: truckTypeMap[t.truckTypeCode],
        status: "ACTIVE",
        remarks: t.remarks,
      },
    });
  }

  // ── Drivers ──────────────────────────────────────────────
  console.log("  → Drivers");
  for (const d of DRIVERS) {
    await prisma.driver.upsert({
      where: { employeeId: d.employeeId },
      update: { fullName: d.fullName, dailyRate: d.dailyRate, otRate: d.otRate },
      create: {
        employeeId: d.employeeId,
        fullName: d.fullName,
        dailyRate: d.dailyRate,
        otRate: d.otRate,
        status: "ACTIVE",
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  console.log("  → Helpers");
  for (const h of HELPERS) {
    await prisma.helper.upsert({
      where: { employeeId: h.employeeId },
      update: { fullName: h.fullName, dailyRate: h.dailyRate, otRate: h.otRate },
      create: {
        employeeId: h.employeeId,
        fullName: h.fullName,
        dailyRate: h.dailyRate,
        otRate: h.otRate,
        status: "ACTIVE",
      },
    });
  }

  // ── Route Areas ──────────────────────────────────────────
  console.log("  → Route areas");
  for (const ra of ROUTE_AREAS) {
    await prisma.routeArea.upsert({
      where: { code: ra.code },
      update: {
        label: ra.label,
        sampleDest: ra.sampleDest,
        distanceMinKm: ra.distanceMinKm,
        distanceMaxKm: ra.distanceMaxKm,
        surcharge: ra.surcharge,
        estimatedToll: ra.estimatedToll,
        isLongDistance: ra.isLongDistance,
        remarks: ra.remarks,
      },
      create: {
        code: ra.code,
        label: ra.label,
        sampleDest: ra.sampleDest,
        distanceMinKm: ra.distanceMinKm,
        distanceMaxKm: ra.distanceMaxKm,
        surcharge: ra.surcharge,
        estimatedToll: ra.estimatedToll,
        isLongDistance: ra.isLongDistance,
        remarks: ra.remarks,
      },
    });
  }

  // ── Clients ──────────────────────────────────────────────
  console.log("  → Clients");
  for (const c of CLIENTS) {
    const existing = await prisma.client.findFirst({
      where: { clientName: c.clientName },
    });
    if (!existing) {
      await prisma.client.create({ data: { ...c } });
    }
  }

  // ── Rate Settings (singleton) ─────────────────────────────
  console.log("  → Rate settings");
  await prisma.rateSettings.upsert({
    where: { id: 1 },
    update: { ...RATE_SETTINGS },
    create: { ...RATE_SETTINGS },
  });

  // ── Admin Users ──────────────────────────────────────────
  console.log("  → Admin users");
  const admins = [
    {
      username: process.env.SEED_ADMIN_1_USERNAME ?? "jess",
      password: process.env.SEED_ADMIN_1_PASSWORD ?? "admin123",
      fullName: process.env.SEED_ADMIN_1_FULLNAME ?? "Jess R.",
    },
    {
      username: process.env.SEED_ADMIN_2_USERNAME ?? "admin2",
      password: process.env.SEED_ADMIN_2_PASSWORD ?? "admin123",
      fullName: process.env.SEED_ADMIN_2_FULLNAME ?? "Admin 2",
    },
    {
      username: process.env.SEED_ADMIN_3_USERNAME ?? "admin3",
      password: process.env.SEED_ADMIN_3_PASSWORD ?? "admin123",
      fullName: process.env.SEED_ADMIN_3_FULLNAME ?? "Admin 3",
    },
  ];

  for (const admin of admins) {
    if (!admin.username || !admin.password) continue;
    const passwordHash = await bcrypt.hash(admin.password, 12);
    await prisma.user.upsert({
      where: { username: admin.username },
      update: { fullName: admin.fullName, passwordHash },
      create: {
        username: admin.username,
        fullName: admin.fullName,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });
  }

  // ── CompanyProfile ────────────────────────────────────────
  console.log("  → CompanyProfile");
  await prisma.companyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phone: "(02) 7000-8985",
      mobile: "0917-132-9915",
      email: "joleo.transport@gmail.com",
      address: "GSIS Hills, Talipapa, Caloocan",
    },
  });

  // ── PaymentConfig ─────────────────────────────────────────
  console.log("  → PaymentConfig");
  await prisma.paymentConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyProfileId: 1,
      bank1Name: "EASTWEST BANK",
      bank1Holder: "JOLEO TRANSPORT",
      bank1Account: "200048853462",
      bank2Name: "BDO UNIBANK",
      bank2Holder: "JOLEO TRANSPORT",
      bank2Account: "013208001304",
      gcashHolder: "LEOVINA SALVADOR",
      gcashNumber: "09178305652",
    },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
