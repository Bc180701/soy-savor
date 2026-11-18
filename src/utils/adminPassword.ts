export const ADMIN_PASSWORD_MIN_LENGTH = 12;

type PasswordAuth = {
  reauthenticate: (password: string) => Promise<boolean>;
  updatePassword: (password: string, currentPassword: string) => Promise<boolean>;
  signOutEverywhere: () => Promise<boolean>;
};

export async function changeOwnAdminPassword(
  auth: PasswordAuth,
  current: string,
  next: string,
  confirmation: string,
) {
  if (!current) return "missing-current";
  if (next.length < ADMIN_PASSWORD_MIN_LENGTH) return "too-short";
  if (next !== confirmation) return "mismatch";
  if (current === next) return "unchanged";
  if (!(await auth.reauthenticate(current))) return "reauthentication-failed";
  if (!(await auth.updatePassword(next, current))) return "update-failed";

  // A successful update is final even if the additional sign-out call fails.
  try {
    return await auth.signOutEverywhere() ? "done" : "sign-out-failed";
  } catch {
    return "sign-out-failed";
  }
}

export function isRevokedAdminSession(error: { code?: string; name?: string; status?: number } | null) {
  return error?.code === "session_not_found" || error?.code === "session_expired"
    || error?.code === "user_not_found" || error?.code === "bad_jwt"
    || error?.name === "AuthSessionMissingError" || error?.status === 401;
}