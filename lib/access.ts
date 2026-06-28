const fallbackGlobalAdmins = ["yashbarot712@gmail.com"];

function readEmailList(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const admins = readEmailList(process.env.ADMIN_EMAILS);
  return admins.includes(email.toLowerCase()) || isGlobalAdminEmail(email);
}

export function isGlobalAdminEmail(email?: string | null) {
  if (!email) return false;

  const globalAdmins = readEmailList(process.env.GLOBAL_ADMIN_EMAILS);
  const allowed = globalAdmins.length > 0 ? globalAdmins : fallbackGlobalAdmins;

  return allowed.includes(email.toLowerCase());
}
