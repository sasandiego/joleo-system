"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveQuoteAction } from "@/actions/quotes";
import { computePrice } from "@/features/pricing/engine";
import { PriceBreakdownPanel } from "./PriceBreakdownPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import type { PricingResult } from "@/features/pricing/types";
import Link from "next/link";

interface Client {
  id: string;
  companyName: string;
  contactPerson: string | null;
}

interface TruckType {
  id: string;
  code: string;
  label: string;
  sizeFt: number;
  wheelType: string;
  minBaseRate: number;
  fuelKmPerLiter: number;
}

interface RouteArea {
  id: string;
  label: string;
}

interface Settings {
  dieselPricePerLiter: number;
  fuelSurchargePct: number;
  driverDailyRate: number;
  helperDailyRate: number;
  additionalHelperRate: number;
  additionalHourRate: number;
  additionalDropoffCharge: number;
  condoHandlingFee: number;
  cateringHandlingFee: number;
  loadingUnloadingFee: number;
  nightDeliverySurcharge: number;
  outOfTownSurcharge: number;
  longDistanceSurcharge: number;
  distanceRatePerKm: number;
  maintenancePctOfBase: number;
  overheadPctOfDirect: number;
  contingencyPctOfDirect: number;
  floorMarginPct: number;
  targetMarginPct: number;
  ceilingMarginPct: number;
  vatRate: number;
  standardIncludedHours: number;
}

interface Props {
  clients: Client[];
  truckTypes: TruckType[];
  routeAreas: RouteArea[];
  settings: Settings;
}

function wrapDecimal(n: number) {
  return { toNumber: () => n };
}

function buildContext(settings: Settings, truckType: TruckType) {
  return {
    truckType: {
      minBaseRate: wrapDecimal(truckType.minBaseRate),
      fuelKmPerLiter: wrapDecimal(truckType.fuelKmPerLiter),
    },
    settings: {
      dieselPricePerLiter: wrapDecimal(settings.dieselPricePerLiter),
      fuelSurchargePct: wrapDecimal(settings.fuelSurchargePct),
      driverDailyRate: wrapDecimal(settings.driverDailyRate),
      helperDailyRate: wrapDecimal(settings.helperDailyRate),
      additionalHelperRate: wrapDecimal(settings.additionalHelperRate),
      additionalHourRate: wrapDecimal(settings.additionalHourRate),
      additionalDropoffCharge: wrapDecimal(settings.additionalDropoffCharge),
      condoHandlingFee: wrapDecimal(settings.condoHandlingFee),
      cateringHandlingFee: wrapDecimal(settings.cateringHandlingFee),
      loadingUnloadingFee: wrapDecimal(settings.loadingUnloadingFee),
      nightDeliverySurcharge: wrapDecimal(settings.nightDeliverySurcharge),
      outOfTownSurcharge: wrapDecimal(settings.outOfTownSurcharge),
      longDistanceSurcharge: wrapDecimal(settings.longDistanceSurcharge),
      distanceRatePerKm: wrapDecimal(settings.distanceRatePerKm),
      maintenancePctOfBase: wrapDecimal(settings.maintenancePctOfBase),
      overheadPctOfDirect: wrapDecimal(settings.overheadPctOfDirect),
      contingencyPctOfDirect: wrapDecimal(settings.contingencyPctOfDirect),
      floorMarginPct: wrapDecimal(settings.floorMarginPct),
      targetMarginPct: wrapDecimal(settings.targetMarginPct),
      ceilingMarginPct: wrapDecimal(settings.ceilingMarginPct),
      vatRate: wrapDecimal(settings.vatRate),
    },
  };
}

function FieldGroup({
  label,
  hint,
  span2,
  children,
}: {
  label: string;
  hint?: string;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ gridColumn: span2 ? "1 / -1" : undefined }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  background: "var(--bg)",
  color: "var(--fg)",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 28,
};

function SaveButtons({ hasError }: { hasError: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        name="convertToBooking"
        value="false"
        disabled={pending || hasError}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 500,
          cursor: pending || hasError ? "not-allowed" : "pointer",
          color: hasError ? "var(--muted)" : "var(--fg)",
          fontFamily: "inherit",
        }}
      >
        {pending ? "Saving…" : "Save as draft"}
      </button>
      <button
        type="submit"
        name="convertToBooking"
        value="true"
        disabled={pending || hasError}
        style={{
          background: pending || hasError ? "var(--maroon-tint)" : "var(--maroon)",
          color: pending || hasError ? "var(--maroon)" : "white",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 500,
          cursor: pending || hasError ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {pending ? "Saving…" : "Save & convert to booking"}
      </button>
    </>
  );
}

export function QuoteBuilderForm({ clients, truckTypes, routeAreas, settings }: Props) {
  const [actionState, formAction] = useActionState(saveQuoteAction, undefined);

  const defaultTruckType = truckTypes[0];

  const [truckTypeId, setTruckTypeId] = useState(defaultTruckType?.id ?? "");
  const [distanceKm, setDistanceKm] = useState(50);
  const [jobHours, setJobHours] = useState(settings.standardIncludedHours);
  const [includedHours, setIncludedHours] = useState(settings.standardIncludedHours);
  const [numHelpers, setNumHelpers] = useState(1);
  const [numDropoffs, setNumDropoffs] = useState(1);
  const [tollFee, setTollFee] = useState(0);
  const [parkingFee, setParkingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [condoService, setCondoService] = useState(false);
  const [cateringService, setCateringService] = useState(false);
  const [nightDelivery, setNightDelivery] = useState(false);
  const [additionalHelper, setAdditionalHelper] = useState(false);
  const [outOfTown, setOutOfTown] = useState(false);
  const [longDistance, setLongDistance] = useState(false);
  const [vatOption, setVatOption] = useState<"VAT_INCLUSIVE" | "VAT_EXCLUSIVE" | "NON_VAT">("VAT_INCLUSIVE");

  const selectedTruckType = truckTypes.find((t) => t.id === truckTypeId) ?? defaultTruckType;

  const pricingResult = useMemo<PricingResult | null>(() => {
    if (!selectedTruckType) return null;
    try {
      return computePrice(
        {
          estimatedDistanceKm: distanceKm,
          estimatedJobHours: jobHours,
          includedHours,
          numberOfHelpers: numHelpers,
          numberOfDropoffs: numDropoffs,
          condoService,
          cateringService,
          nightDelivery,
          additionalHelper,
          outOfTown,
          longDistance,
          tollFee,
          parkingFee,
          discountAmount,
          vatOption,
        },
        buildContext(settings, selectedTruckType)
      );
    } catch {
      return null;
    }
  }, [
    selectedTruckType,
    distanceKm,
    jobHours,
    includedHours,
    numHelpers,
    numDropoffs,
    condoService,
    cateringService,
    nightDelivery,
    additionalHelper,
    outOfTown,
    longDistance,
    tollFee,
    parkingFee,
    discountAmount,
    vatOption,
    settings,
  ]);

  const hasError =
    !!pricingResult?.warnings.some((w) => w.level === "ERROR") || !pricingResult;

  return (
    <form action={formAction}>
      <PageHeader title="New Quotation" subtitle="Draft">
        <Link
          href="/quotes"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--fg)",
            textDecoration: "none",
          }}
        >
          Cancel
        </Link>
        <SaveButtons hasError={hasError} />
      </PageHeader>

      {actionState?.error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 6,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
            border: "1px solid #fca5a5",
          }}
        >
          {actionState.error}
        </div>
      )}

      {/* Hidden fields for pricing-derived values */}
      <input type="hidden" name="estimatedDistanceKm" value={distanceKm} />
      <input type="hidden" name="estimatedHours" value={jobHours} />
      <input type="hidden" name="includedHours" value={includedHours} />
      <input type="hidden" name="numberOfHelpers" value={numHelpers} />
      <input type="hidden" name="numberOfDropoffs" value={numDropoffs} />
      <input type="hidden" name="tollFee" value={tollFee} />
      <input type="hidden" name="parkingFee" value={parkingFee} />
      <input type="hidden" name="discountAmount" value={discountAmount} />
      <input type="hidden" name="condoService" value={String(condoService)} />
      <input type="hidden" name="cateringService" value={String(cateringService)} />
      <input type="hidden" name="nightDelivery" value={String(nightDelivery)} />
      <input type="hidden" name="additionalHelper" value={String(additionalHelper)} />
      <input type="hidden" name="outOfTown" value={String(outOfTown)} />
      <input type="hidden" name="longDistance" value={String(longDistance)} />
      <input type="hidden" name="vatOption" value={vatOption} />
      <input type="hidden" name="truckTypeId" value={truckTypeId} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
        {/* Left: form sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section A */}
          <SectionCard title="A · Booking Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FieldGroup label="Client">
                <select name="clientId" style={selectStyle}>
                  <option value="">Walk-in client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Walk-in Name">
                <input name="walkInName" type="text" style={inputStyle} placeholder="If no client record" />
              </FieldGroup>
              <FieldGroup label="Pick-up Point">
                <input name="pickupPoint" type="text" style={inputStyle} placeholder="e.g. Robinsons Pioneer, Mandaluyong" required />
              </FieldGroup>
              <FieldGroup label="Drop-off Point">
                <input name="dropoffPoint" type="text" style={inputStyle} placeholder="e.g. Robinsons Marquee, Pampanga" required />
              </FieldGroup>
              <FieldGroup label="Route / Area">
                <select name="routeAreaId" style={selectStyle}>
                  <option value="">— Select area —</option>
                  {routeAreas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Service Type">
                <select name="serviceType" style={selectStyle} defaultValue="LIPAT_BAHAY">
                  <option value="LIPAT_BAHAY">Lipat-Bahay / House Moving</option>
                  <option value="COMMERCIAL_DELIVERY">Commercial Delivery</option>
                  <option value="CATERING_DELIVERY">Catering Delivery</option>
                  <option value="OTHER">Other</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Estimated Distance (km)">
                <input
                  type="number"
                  style={inputStyle}
                  value={distanceKm}
                  min={1}
                  onChange={(e) => setDistanceKm(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </FieldGroup>
              <FieldGroup label="Number of Drop-offs">
                <input
                  type="number"
                  style={inputStyle}
                  value={numDropoffs}
                  min={1}
                  onChange={(e) => setNumDropoffs(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </FieldGroup>
              <FieldGroup label="Notes" span2>
                <textarea
                  name="notes"
                  style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                  placeholder="Optional notes for this quote"
                />
              </FieldGroup>
            </div>
          </SectionCard>

          {/* Section B */}
          <SectionCard title="B · Truck & Crew Selection">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FieldGroup
                label="Truck Type"
                hint={
                  selectedTruckType
                    ? `Min base rate ₱${selectedTruckType.minBaseRate.toLocaleString("en-PH")} · ${selectedTruckType.fuelKmPerLiter} km/L`
                    : undefined
                }
              >
                <select
                  style={selectStyle}
                  value={truckTypeId}
                  onChange={(e) => setTruckTypeId(e.target.value)}
                >
                  {truckTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Number of Helpers">
                <input
                  type="number"
                  style={inputStyle}
                  value={numHelpers}
                  min={0}
                  onChange={(e) => setNumHelpers(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </FieldGroup>
            </div>
          </SectionCard>

          {/* Section C */}
          <SectionCard title="C · Job Details & Service Flags">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FieldGroup label="Included Hours">
                <input
                  type="number"
                  style={inputStyle}
                  value={includedHours}
                  min={1}
                  onChange={(e) => setIncludedHours(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </FieldGroup>
              <FieldGroup label="Estimated Job Hours">
                <input
                  type="number"
                  style={inputStyle}
                  value={jobHours}
                  min={1}
                  onChange={(e) => setJobHours(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </FieldGroup>
              <FieldGroup label="Toll Fee (₱)">
                <input
                  type="number"
                  style={inputStyle}
                  value={tollFee}
                  min={0}
                  step="0.01"
                  onChange={(e) => setTollFee(parseFloat(e.target.value) || 0)}
                />
              </FieldGroup>
              <FieldGroup label="Parking Fee (₱)">
                <input
                  type="number"
                  style={inputStyle}
                  value={parkingFee}
                  min={0}
                  step="0.01"
                  onChange={(e) => setParkingFee(parseFloat(e.target.value) || 0)}
                />
              </FieldGroup>
              <FieldGroup label="Condo Service?">
                <select
                  style={selectStyle}
                  value={condoService ? "true" : "false"}
                  onChange={(e) => setCondoService(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Out-of-Town Trip?">
                <select
                  style={selectStyle}
                  value={outOfTown ? "true" : "false"}
                  onChange={(e) => setOutOfTown(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Night Delivery?">
                <select
                  style={selectStyle}
                  value={nightDelivery ? "true" : "false"}
                  onChange={(e) => setNightDelivery(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Long Distance?">
                <select
                  style={selectStyle}
                  value={longDistance ? "true" : "false"}
                  onChange={(e) => setLongDistance(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Catering Service?">
                <select
                  style={selectStyle}
                  value={cateringService ? "true" : "false"}
                  onChange={(e) => setCateringService(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Additional Helper?">
                <select
                  style={selectStyle}
                  value={additionalHelper ? "true" : "false"}
                  onChange={(e) => setAdditionalHelper(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FieldGroup>
              <FieldGroup label="VAT Option">
                <select
                  style={selectStyle}
                  value={vatOption}
                  onChange={(e) => setVatOption(e.target.value as typeof vatOption)}
                >
                  <option value="VAT_INCLUSIVE">VAT-Inclusive</option>
                  <option value="VAT_EXCLUSIVE">VAT-Exclusive</option>
                  <option value="NON_VAT">Non-VAT</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Discount Amount (₱)" span2>
                <input
                  type="number"
                  style={inputStyle}
                  value={discountAmount}
                  min={0}
                  step="0.01"
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                />
              </FieldGroup>
            </div>
          </SectionCard>
        </div>

        {/* Right: live breakdown */}
        <div style={{ position: "sticky", top: 72 }}>
          <PriceBreakdownPanel result={pricingResult} />
        </div>
      </div>
    </form>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--maroon)",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
