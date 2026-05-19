import { db } from "@/lib/db";
import { HelperListClient } from "@/components/helpers/HelperListClient";

export default async function HelpersPage() {
  const raw = await db.helper.findMany({ orderBy: { fullName: "asc" } });
  const helpers = raw.map((h) => ({
    ...h,
    dailyRate: h.dailyRate.toNumber(),
    otRate: h.otRate.toNumber(),
  }));
  return <HelperListClient helpers={helpers} />;
}
