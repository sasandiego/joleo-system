import { db } from "@/lib/db";
import { TruckListClient } from "@/components/trucks/TruckListClient";

export default async function TrucksPage() {
  const [trucks, truckTypes] = await Promise.all([
    db.truck.findMany({
      include: { truckType: true },
      orderBy: { code: "asc" },
    }),
    db.truckType.findMany({
      orderBy: { sizeFt: "asc" },
    }),
  ]);

  return <TruckListClient trucks={trucks} truckTypes={truckTypes} />;
}
