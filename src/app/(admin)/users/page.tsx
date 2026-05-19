import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";

export default async function UsersPage() {
  const session = await auth();
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 24,
          marginBottom: 28,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Users
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Admin accounts with portal access. New users are added via seed script.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Full name", "Username", "Role", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "12px 24px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--muted)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => {
              const isCurrentUser = user.id === session?.user?.id;
              return (
                <tr
                  key={user.id}
                  style={{
                    borderBottom:
                      i < users.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td style={{ padding: "14px 24px", color: "var(--ink-soft)" }}>
                    <span style={{ fontWeight: 600 }}>{user.fullName}</span>
                    {isCurrentUser && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: "var(--muted)",
                          fontStyle: "italic",
                        }}
                      >
                        (you)
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {user.username}
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "var(--maroon-tint)",
                        color: "var(--maroon)",
                      }}
                    >
                      {"Admin"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: user.isActive ? "#E8F5EC" : "#F0EFEC",
                        color: user.isActive ? "var(--success)" : "var(--muted)",
                      }}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <ResetPasswordDialog
                      userId={user.id}
                      userName={user.fullName}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
