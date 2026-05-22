import { db } from "@/lib/db";
import Link from "next/link";
import { NewBookingForm } from "@/components/bookings/NewBookingForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function NewBookingPage() {
  const [clients, trucks, drivers] = await Promise.all([
    db.client.findMany({
      where: { isActive: true },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    db.truck.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, plateNo: true },
    }),
    db.driver.findMany({
      where: { status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  if (clients.length === 0) {
    return (
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="New Booking" subtitle="Add a client first" />
        <div className="j-empty" style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 10 }}>
          No active clients yet — every booking needs a client profile.
          <small>
            <Link href="/clients">Go to Clients → add the first one</Link>
          </small>
        </div>
      </div>
    );
  }

  return <NewBookingForm clients={clients} trucks={trucks} drivers={drivers} />;
}
