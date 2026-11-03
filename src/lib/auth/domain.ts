/**
 * Validates that an email belongs to the permitted college domain.
 */
export function isAllowedCollegeEmail(
  email: string | null | undefined,
  allowedDomainEnv = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ||
    process.env.ALLOWED_EMAIL_DOMAIN ||
    "aits.edu"
): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const allowedDomains = allowedDomainEnv
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  const parts = normalizedEmail.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];
  if (!domain) {
    return false;
  }

  return allowedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
}
