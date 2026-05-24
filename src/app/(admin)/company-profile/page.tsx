import { db } from "@/lib/db";
import { CompanyProfileForm } from "@/components/company-profile/CompanyProfileForm";

export default async function CompanyProfilePage() {
  const profile = await db.companyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phone: "(02) 7000-8985",
      mobile: "0917-132-9915",
      email: "joleo.transport@gmail.com",
      address: "GSIS Hills, Talipapa, Caloocan",
    },
  });

  return (
    <CompanyProfileForm
      initial={{
        phone:   profile.phone,
        mobile:  profile.mobile,
        email:   profile.email,
        address: profile.address,
      }}
    />
  );
}
