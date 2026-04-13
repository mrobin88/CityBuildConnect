/** Rough status for UI dot: green = ok, amber = expiring within 90 days or expired. */
export function certExpiryStatus(expiryDate: Date | null): "green" | "amber" {
  if (!expiryDate) return "amber";
  const now = new Date();
  const ms = expiryDate.getTime() - now.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (days < 90) return "amber";
  return "green";
}
