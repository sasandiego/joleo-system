import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/features/auth/config";
import { getDisplayRole } from "@/lib/user-role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JR";

  const roleLabel = getDisplayRole(user?.username);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100vh",
      }}
    >
      <Sidebar
        userInitials={initials}
        userName={user?.fullName ?? "Admin"}
        userRole={roleLabel}
      />
      <main
        data-page-enter
        style={{
          padding: "32px 40px",
          maxWidth: 1400,
          width: "100%",
        }}
      >
        {children}
      </main>
    </div>
  );
}
