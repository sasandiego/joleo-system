import { db } from "@/lib/db";
import { NewBookingForm } from "@/components/bookings/NewBookingForm";

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

  return <NewBookingForm clients={clients} trucks={trucks} drivers={drivers} />;
}
