import { db } from "@/lib/db";
import { PaymentConfigForm } from "@/components/payment-config/PaymentConfigForm";

export default async function PaymentConfigPage() {
  const config = await db.paymentConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyProfileId: 1,
      bank1Name: "EASTWEST BANK",
      bank1Holder: "JOLEO TRANSPORT",
      bank1Account: "200048853462",
      bank2Name: "BDO UNIBANK",
      bank2Holder: "JOLEO TRANSPORT",
      bank2Account: "013208001304",
      gcashHolder: "LEOVINA SALVADOR",
      gcashNumber: "09178305652",
    },
  });

  return (
    <PaymentConfigForm
      initial={{
        bank1Name:    config.bank1Name,
        bank1Holder:  config.bank1Holder,
        bank1Account: config.bank1Account,
        bank2Name:    config.bank2Name,
        bank2Holder:  config.bank2Holder,
        bank2Account: config.bank2Account,
        gcashHolder:  config.gcashHolder,
        gcashNumber:  config.gcashNumber,
        updatedAt:    config.updatedAt.toISOString(),
      }}
    />
  );
}
