/**
 * Formatting utilities — shared between web and api
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INR_TABULAR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  numberingSystem: 'latn',
});

/** Format a rupee amount: ₹2,00,000 */
export function formatINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

/** Format rupee amount with tabular numerals (for UI tables) */
export function formatINRTabular(amount: number): string {
  return INR_TABULAR.format(amount);
}

/** Format percentage: "10.5%" */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format tenure in human-readable form */
export function formatTenure(months: number): string {
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} yr ${rem} mo`;
}

/** Abbreviate large amounts for compact display: ₹2L, ₹1.5Cr */
export function abbreviateINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${amount}`;
}
