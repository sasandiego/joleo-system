"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveQuoteAction, updateQuoteAction } from "@/actions/quotes";
import { generateServiceDescriptionAction } from "@/actions/ai-quotes";
import { computePrice } from "@/features/pricing/engine";
import { PriceBreakdownPanel } from "./PriceBreakdownPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import type { BillingType, PricingResult, VatOption } from "@/features/pricing/types";
import Link from "next/link";

interface Client {
  id: string;
  clientName: string;
  contactPerson: string | null;
}

interface TruckType {
  id: string;
  code: string;
  label: string;
  sizeFt: number;
  wheelType: string;
  eightHourBaseRate: number;
  perTripBaseRate: number;
}

interface Settings {
  driverRate: number; // fraction (0.15 = 15%)
  helperRate: number;
  overheadRate: number;
  longDistanceRate: number;
  longDistanceThresholdKm: number;
  dieselPricePerLiter: number;
  fuelFloor: number;
  fuelEfficiencyKmpl: number;
  additionalHourRate: number;
  additionalDropoffCharge: number;
  standardIncludedHours: number;
  difficultAccessFee: number;
  cateringHandlingFee: number;
  loadingUnloadingFee: number;
  distanceRatePerKm: number;
  vatRate: number;
}

// For the edit mode — values restored from an existing quote
export interface QuoteInitialValues {
  id: string;
  clientId: string;
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  truckTypeId: string;
  numberOfHelpers: number;
  estimatedDistanceKm: number;
  estimatedHours: number;
  numberOfDropoffs: number;
  tripBillingType: BillingType;
  difficultAccess: boolean;
  cateringService: boolean;
  tollFee: number;
  discountAmount: number;
  manualOverridePrice: number | null;
  vatOption: VatOption;
  serviceDescription: string | null;
  notes: string | null;
  paymentTerms: string | null;
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledStartTime: string | null; // HH:MM
}

interface Props {
  clients: Client[];
  truckTypes: TruckType[];
  settings: Settings;
  initial?: QuoteInitialValues; // present in edit mode
  defaultClientId?: string; // pre-select client when coming from client detail page
}

function w(n: number) {
  return { toNumber: () => n };
}

function buildContext(settings: Settings, truckType: TruckType) {
  return {
    truckType: {
      eightHourBaseRate: w(truckType.eightHourBaseRate),
      perTripBaseRate: w(truckType.perTripBaseRate),
    },
    settings: {
      driverRate: w(settings.driverRate),
      helperRate: w(settings.helperRate),
      overheadRate: w(settings.overheadRate),
      longDistanceRate: w(settings.longDistanceRate),
      longDistanceThresholdKm: settings.longDistanceThresholdKm,
      dieselPricePerLiter: w(settings.dieselPricePerLiter),
      fuelFloor: w(settings.fuelFloor),
      fuelEfficiencyKmpl: w(settings.fuelEfficiencyKmpl),
      additionalHourRate: w(settings.additionalHourRate),
      additionalDropoffCharge: w(settings.additionalDropoffCharge),
      standardIncludedHours: settings.standardIncludedHours,
      difficultAccessFee: w(settings.difficultAccessFee),
      cateringHandlingFee: w(settings.cateringHandlingFee),
      loadingUnloadingFee: w(settings.loadingUnloadingFee),
      distanceRatePerKm: w(settings.distanceRatePerKm),
      vatRate: w(settings.vatRate),
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
  background: "white",
  color: "var(--ink)",
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

function SaveButtons({ hasError, isEdit }: { hasError: boolean; isEdit: boolean }) {
  const { pending } = useFormStatus();
  if (isEdit) {
    return (
      <button
        type="submit"
        data-btn
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    );
  }
  return (
    <>
      <button
        type="submit"
        name="convertToBooking"
        value="false"
        data-btn
        disabled={pending || hasError}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 500,
          cursor: pending || hasError ? "not-allowed" : "pointer",
          color: hasError ? "var(--muted)" : "var(--ink)",
          fontFamily: "inherit",
        }}
      >
        {pending ? "Saving…" : "Save as draft"}
      </button>
      <button
        type="submit"
        name="convertToBooking"
        value="true"
        data-btn
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

export function QuoteBuilderForm({ clients, truckTypes, settings, initial, defaultClientId }: Props) {
  const isEdit = !!initial;
  const [actionState, formAction] = useActionState(
    isEdit ? updateQuoteAction : saveQuoteAction,
    undefined,
  );

  const defaultTruckType = truckTypes[0];

  const [serviceType, setServiceType] = useState(initial?.serviceType ?? "LIPAT_BAHAY");
  const [pickupPoint, setPickupPoint] = useState(initial?.pickupPoint ?? "");
  const [dropoffPoint, setDropoffPoint] = useState(initial?.dropoffPoint ?? "");
  const [serviceDescription, setServiceDescription] = useState(initial?.serviceDescription ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const DEFAULT_PAYMENT_TERMS = "20% downpayment required to confirm booking (non-refundable, non-cancellable but re-bookable). Accepted payment methods: Cash, Bank Transfer, GCash Send Money.";
  const paymentTerms = initial?.paymentTerms ?? DEFAULT_PAYMENT_TERMS;
  const [scheduledDate, setScheduledDate] = useState(initial?.scheduledDate ?? "");
  const [scheduledStartTime, setScheduledStartTime] = useState(initial?.scheduledStartTime ?? "");
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [truckTypeId, setTruckTypeId] = useState(initial?.truckTypeId ?? defaultTruckType?.id ?? "");
  const [tripBillingType, setTripBillingType] = useState<BillingType>(initial?.tripBillingType ?? "EIGHT_HOUR");
  // Number-input fields are stored as strings so users can clear them mid-edit.
  // Parse-on-use when computing the live preview (empty / NaN → 0 fallback).
  const [distanceKm, setDistanceKm] = useState<string>(String(initial?.estimatedDistanceKm ?? 30));
  const [jobHours, setJobHours] = useState<string>(String(initial?.estimatedHours ?? settings.standardIncludedHours));
  const [numHelpers, setNumHelpers] = useState<string>(String(initial?.numberOfHelpers ?? 1));
  const [numDropoffs, setNumDropoffs] = useState<string>(String(initial?.numberOfDropoffs ?? 1));
  const [tollFee, setTollFee] = useState<string>(String(initial?.tollFee ?? 0));
  const [discountAmount, setDiscountAmount] = useState<string>(String(initial?.discountAmount ?? 0));
  const [manualOverridePrice, setManualOverridePrice] = useState<string>(
    initial?.manualOverridePrice != null ? String(initial.manualOverridePrice) : "",
  );

  // Parse helpers — used by live preview only. Hidden inputs serialize the raw string.
  const distanceKmNum = parseFloat(distanceKm) || 0;
  const jobHoursNum = parseFloat(jobHours) || 0;
  const numHelpersNum = parseInt(numHelpers, 10) || 0;
  const numDropoffsNum = parseInt(numDropoffs, 10) || 1;
  const tollFeeNum = parseFloat(tollFee) || 0;
  const discountAmountNum = parseFloat(discountAmount) || 0;
  const manualOverridePriceNum = manualOverridePrice.trim() === "" ? undefined : parseFloat(manualOverridePrice);
  const [difficultAccess, setDifficultAccess] = useState(initial?.difficultAccess ?? false);
  const [cateringService, setCateringService] = useState(initial?.cateringService ?? false);
  const [vatOption, setVatOption] = useState<VatOption>(initial?.vatOption ?? "VAT_INCLUSIVE");

  const selectedTruckType = truckTypes.find((t) => t.id === truckTypeId) ?? defaultTruckType;
  const isLongDistance = distanceKmNum >= settings.longDistanceThresholdKm;

  async function handleGenerateDescription() {
    setIsGeneratingDesc(true);
    const result = await generateServiceDescriptionAction({
      serviceType,
      pickupPoint,
      dropoffPoint,
      truckType: selectedTruckType?.label ?? truckTypeId,
      numberOfHelpers: numHelpersNum,
      billingType: tripBillingType,
      notes: notes.trim() || undefined,
    });
    setIsGeneratingDesc(false);
    if (result.text) setServiceDescription(result.text);
  }

  const pricingResult = useMemo<PricingResult | null>(() => {
    if (!selectedTruckType) return null;
    if (distanceKmNum <= 0) return null;
    try {
      return computePrice(
        {
          estimatedDistanceKm: distanceKmNum,
          estimatedJobHours: jobHoursNum,
          tripBillingType,
          numberOfHelpers: numHelpersNum < 1 ? 1 : numHelpersNum,
          numberOfDropoffs: numDropoffsNum,
          difficultAccess,
          cateringService,
          tollFee: tollFeeNum,
          discountAmount: discountAmountNum,
          manualOverridePrice: manualOverridePriceNum,
          vatOption,
        },
        buildContext(settings, selectedTruckType),
      );
    } catch {
      return null;
    }
  }, [
    selectedTruckType,
    distanceKmNum,
    jobHoursNum,
    tripBillingType,
    numHelpersNum,
    numDropoffsNum,
    difficultAccess,
    cateringService,
    tollFeeNum,
    discountAmountNum,
    manualOverridePriceNum,
    vatOption,
    settings,
  ]);

  const hasError =
    !pricingResult ||
    !!pricingResult.warnings.some((w) => w.level === "ERROR");

  return (
    <form action={formAction}>
      <PageHeader
        title={isEdit ? `Edit ${initial?.id ? "Quotation" : ""}` : "New Quotation"}
        subtitle={isEdit ? "All changes recalculate the price and are audited." : "Draft"}
      >
        <Link
          href={isEdit ? `/quotes/${initial?.id}` : "/quotes"}
          data-btn
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          Cancel
        </Link>
        <SaveButtons hasError={hasError} isEdit={isEdit} />
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

      {/* Hidden fields for pricing inputs */}
      {isEdit && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="estimatedDistanceKm" value={distanceKm} />
      <input type="hidden" name="estimatedHours" value={jobHours} />
      <input type="hidden" name="numberOfHelpers" value={numHelpers} />
      <input type="hidden" name="numberOfDropoffs" value={numDropoffs} />
      <input type="hidden" name="tollFee" value={tollFee} />
      <input type="hidden" name="discountAmount" value={discountAmount} />
      <input type="hidden" name="manualOverridePrice" value={manualOverridePrice} />
      <input type="hidden" name="difficultAccess" value={String(difficultAccess)} />
      <input type="hidden" name="cateringService" value={String(cateringService)} />
      <input type="hidden" name="vatOption" value={vatOption} />
      <input type="hidden" name="truckTypeId" value={truckTypeId} />
      <input type="hidden" name="tripBillingType" value={tripBillingType} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
        {/* Left: form sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section A — Booking Information */}
          <SectionCard title="A · Booking Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FieldGroup label="Client">
                <select name="clientId" style={selectStyle} required defaultValue={initial?.clientId ?? defaultClientId ?? ""}>
                  <option value="" disabled>— Select client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Service Type">
                <select name="serviceType" style={selectStyle} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                  <option value="LIPAT_BAHAY">Lipat-Bahay / House Moving</option>
                  <option value="COMMERCIAL_DELIVERY">Commercial Delivery</option>
                  <option value="CATERING_DELIVERY">Catering Delivery</option>
                  <option value="OTHER">Other</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Scheduled Date" hint="Required. When the move/delivery will take place.">
                <input
                  name="scheduledDate"
                  type="date"
                  style={inputStyle}
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Scheduled Start Time" hint="Optional. Leave blank if to be confirmed.">
                <input
                  name="scheduledStartTime"
                  type="time"
                  style={inputStyle}
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Pick-up Point">
                <input name="pickupPoint" type="text" style={inputStyle} placeholder="e.g. Robinsons Pioneer, Mandaluyong" required value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Drop-off Point">
                <input name="dropoffPoint" type="text" style={inputStyle} placeholder="e.g. Robinsons Marquee, Pampanga" required value={dropoffPoint} onChange={(e) => setDropoffPoint(e.target.value)} />
              </FieldGroup>
              <FieldGroup
                label="Estimated Distance (km)"
                hint={isLongDistance ? `≥ ${settings.longDistanceThresholdKm} km — long-distance surcharge applies` : undefined}
              >
                <input
                  type="number"
                  style={{
                    ...inputStyle,
                    borderColor: isLongDistance ? "var(--maroon)" : "var(--border)",
                  }}
                  value={distanceKm}
                  min={1}
                  onChange={(e) => setDistanceKm(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Number of Drop-offs">
                <input
                  type="number"
                  style={inputStyle}
                  value={numDropoffs}
                  min={1}
                  onChange={(e) => setNumDropoffs(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Notes (Internal)" hint="Admin-only. Special client requests or operational reminders — won't appear on the PDF, but the AI Service Description generator on the right will summarize them." span2>
                <textarea
                  name="notes"
                  style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
                  placeholder="e.g. Client requested 6 AM start; bring extra straps; condo elevator booked 8-10 AM."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FieldGroup>
            </div>
          </SectionCard>

          {/* Section B — Truck & Crew */}
          <SectionCard title="B · Truck & Crew Selection">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FieldGroup
                label="Truck Type"
                hint={
                  selectedTruckType
                    ? `8-hr base ₱${selectedTruckType.eightHourBaseRate.toLocaleString("en-PH")} · Per-trip ₱${selectedTruckType.perTripBaseRate.toLocaleString("en-PH")}`
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
              <FieldGroup label="Number of Helpers" hint={`Min 1. Each helper adds ${(settings.helperRate * 100).toFixed(1)}% to the markup (revenue net of VAT).`}>
                <input
                  type="number"
                  style={inputStyle}
                  value={numHelpers}
                  min={1}
                  onChange={(e) => setNumHelpers(e.target.value)}
                />
              </FieldGroup>
            </div>
          </SectionCard>

          {/* Section C — Billing & Job Details */}
          <SectionCard title="C · Billing & Job Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FieldGroup label="Billing Type" hint="Per 8 Hours for local/short trips · Per Trip for long-distance flat-rate trips.">
                <div style={{ display: "flex", gap: 6 }}>
                  <BillingToggleBtn
                    label="Per 8 Hours"
                    active={tripBillingType === "EIGHT_HOUR"}
                    onClick={() => setTripBillingType("EIGHT_HOUR")}
                  />
                  <BillingToggleBtn
                    label="Per Trip"
                    active={tripBillingType === "PER_TRIP"}
                    onClick={() => setTripBillingType("PER_TRIP")}
                  />
                </div>
              </FieldGroup>
              <FieldGroup
                label="Estimated Job Hours"
                hint={
                  tripBillingType === "EIGHT_HOUR"
                    ? `Standard ${settings.standardIncludedHours} hrs included. Excess hours billed at ₱${settings.additionalHourRate}/hr.`
                    : "Not used for Per-Trip billing."
                }
              >
                <input
                  type="number"
                  style={inputStyle}
                  value={jobHours}
                  min={1}
                  disabled={tripBillingType === "PER_TRIP"}
                  onChange={(e) => setJobHours(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Toll Fee (₱)" hint="Pass-through — added to the final price, no markup or VAT.">
                <input
                  type="number"
                  style={inputStyle}
                  value={tollFee}
                  min={0}
                  step="0.01"
                  onChange={(e) => setTollFee(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="VAT Option">
                <select
                  style={selectStyle}
                  value={vatOption}
                  onChange={(e) => setVatOption(e.target.value as VatOption)}
                >
                  <option value="VAT_INCLUSIVE">VAT-Inclusive (default)</option>
                  <option value="VAT_EXCLUSIVE">VAT-Exclusive</option>
                  <option value="NON_VAT">Non-VAT</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Difficult Access?" hint="Applies when access requires extra effort (stairs, elevator wait, parking restrictions, non-ground floor delivery).">
                <select
                  style={selectStyle}
                  value={difficultAccess ? "true" : "false"}
                  onChange={(e) => setDifficultAccess(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes (+₱{settings.difficultAccessFee})</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Catering Service?">
                <select
                  style={selectStyle}
                  value={cateringService ? "true" : "false"}
                  onChange={(e) => setCateringService(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes (+₱{settings.cateringHandlingFee})</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Discount (₱)">
                <input
                  type="number"
                  style={inputStyle}
                  value={discountAmount}
                  min={0}
                  step="0.01"
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup
                label="Manual Override Price (₱)"
                hint="Leave blank to use the computed price. When set, this becomes the final quoted amount (VAT back-computed)."
                span2
              >
                <input
                  type="number"
                  style={inputStyle}
                  value={manualOverridePrice}
                  min={0}
                  step="0.01"
                  placeholder="Leave blank to use computed price"
                  onChange={(e) => setManualOverridePrice(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Payment Terms" hint="Fixed text shown on every PDF quotation. Edit the template in Payment Config (under Configuration) if it needs to change." span2>
                <input type="hidden" name="paymentTerms" value={paymentTerms} />
                <div
                  style={{
                    ...inputStyle,
                    minHeight: 64,
                    background: "var(--surface)",
                    color: "var(--ink-soft)",
                    cursor: "default",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                  }}
                >
                  {paymentTerms}
                </div>
              </FieldGroup>
            </div>
          </SectionCard>
        </div>

        {/* Right: service description + live breakdown */}
        <div style={{ position: "sticky", top: 72, display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 104px)", overflowY: "auto", paddingRight: 4 }}>
          <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--maroon)", marginBottom: 10 }}>
              Service Description
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
              Appears on the client-facing PDF. Click Generate to draft from all the form fields (including Notes).
            </div>
            <textarea
              name="serviceDescription"
              style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              placeholder="Describe the service in professional terms, or click Generate."
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
            />
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDesc || !pickupPoint || !dropoffPoint}
              title={
                isGeneratingDesc
                  ? "Generating description…"
                  : !pickupPoint && !dropoffPoint
                    ? "Fill in pick-up and drop-off points first so the AI has enough context."
                    : !pickupPoint
                      ? "Fill in the pick-up point first so the AI has enough context."
                      : !dropoffPoint
                        ? "Fill in the drop-off point first so the AI has enough context."
                        : "Generate a professional service description with AI (uses all form fields plus Notes)."
              }
              style={{
                marginTop: 8,
                width: "100%",
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "inherit",
                background: isGeneratingDesc ? "var(--surface)" : "var(--maroon-tint)",
                color: isGeneratingDesc ? "var(--muted)" : "var(--maroon)",
                border: "1px solid var(--maroon)",
                borderRadius: 6,
                cursor: isGeneratingDesc || !pickupPoint || !dropoffPoint ? "not-allowed" : "pointer",
                opacity: !pickupPoint || !dropoffPoint ? 0.5 : 1,
              }}
            >
              {isGeneratingDesc ? "Generating…" : "✨ Generate with AI"}
            </button>
          </div>

          <PriceBreakdownPanel result={pricingResult} />
        </div>
      </div>
    </form>
  );
}

function BillingToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-btn
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 12px",
        border: `1px solid ${active ? "var(--maroon)" : "var(--border)"}`,
        background: active ? "var(--maroon)" : "white",
        color: active ? "white" : "var(--ink)",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
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
