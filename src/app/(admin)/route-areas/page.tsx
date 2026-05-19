import { db } from "@/lib/db";
import { RouteAreaListClient } from "@/components/route-areas/RouteAreaListClient";

export default async function RouteAreasPage() {
  const raw = await db.routeArea.findMany({ orderBy: { label: "asc" } });
  const routeAreas = raw.map((ra) => ({
    ...ra,
    surcharge: ra.surcharge.toNumber(),
    estimatedToll: ra.estimatedToll.toNumber(),
  }));
  return <RouteAreaListClient routeAreas={routeAreas} />;
}
