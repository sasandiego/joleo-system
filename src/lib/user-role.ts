// Display-only role mapping. The DB `role` column stays as the
// authoritative permissions enum (`ADMIN`); this is purely for the
// label shown to users in the sidebar footer and Users page.
//
// Add a username here when a new co-owner is onboarded.
const OWNER_USERNAMES = new Set(["shem", "vyela"]);

export function getDisplayRole(username: string | null | undefined): "Owner" | "Admin" {
  if (!username) return "Admin";
  return OWNER_USERNAMES.has(username.toLowerCase()) ? "Owner" : "Admin";
}
