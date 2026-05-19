import { db } from "@/lib/db";
import { DriverListClient } from "@/components/drivers/DriverListClient";

export default async function DriversPage() {
  const raw = await db.driver.findMany({ orderBy: { fullName: "asc" } });
  const drivers = raw.map((d) => ({
    ...d,
    dailyRate: d.dailyRate.toNumber(),
    otRate: d.otRate.toNumber(),
  }));
  return <DriverListClient drivers={drivers} />;
}
