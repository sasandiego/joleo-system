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

  const serializedTruckTypes = truckTypes.map((t) => ({
    id: t.id,
    code: t.code,
    label: t.label,
    sizeFt: t.sizeFt,
    wheelType: t.wheelType,
    eightHourBaseRate: t.eightHourBaseRate.toNumber(),
    perTripBaseRate: t.perTripBaseRate.toNumber(),
  }));

  const serializedTrucks = trucks.map((t) => ({
    id: t.id,
    code: t.code,
    plateNo: t.plateNo,
    truckTypeId: t.truckTypeId,
    status: t.status,
    remarks: t.remarks,
    truckType: {
      id: t.truckType.id,
      code: t.truckType.code,
      label: t.truckType.label,
      sizeFt: t.truckType.sizeFt,
      wheelType: t.truckType.wheelType,
      eightHourBaseRate: t.truckType.eightHourBaseRate.toNumber(),
      perTripBaseRate: t.truckType.perTripBaseRate.toNumber(),
    },
  }));

  return <TruckListClient trucks={serializedTrucks} truckTypes={serializedTruckTypes} />;
}
