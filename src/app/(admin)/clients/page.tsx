import { db } from "@/lib/db";
import { ClientListClient } from "@/components/clients/ClientListClient";

export default async function ClientsPage() {
  const clients = await db.client.findMany({ orderBy: { clientName: "asc" } });
  return <ClientListClient clients={clients} />;
}
