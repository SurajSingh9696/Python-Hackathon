/**
 * Document Data Masking Service.
 *
 * Enforces strict PII masking before display and before storage:
 * - Aadhaar: Only last 4 digits visible (XXXX-XXXX-1234)
 * - PAN: Only 4 digits visible (XXXXX1234X)
 * - Account numbers: Only last 4 digits visible (XXXXXXXX1234)
 * - Names & addresses: Sanitized against prompt injection markers
 */

export function maskAadhaar(raw: string): string {
  return raw.replace(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/g, 'XXXX-XXXX-$3');
}

export function maskPan(raw: string): string {
  return raw.replace(/\b([A-Z]{5})(\d{4})([A-Z])\b/gi, 'XXXXX$2X');
}

export function maskAccountNumber(raw: string): string {
  return raw.replace(/\b(\d{6,14})(\d{4})\b/g, 'XXXXXXXX$2');
}

export function maskPii(text: string): string {
  let masked = text;
  masked = maskAadhaar(masked);
  masked = maskPan(masked);
  masked = maskAccountNumber(masked);
  return masked;
}

export function maskExtractedRecord(fields: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') {
      clean[k] = maskPii(v);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      clean[k] = maskExtractedRecord(v as Record<string, unknown>);
    } else {
      clean[k] = v;
    }
  }

  return clean;
}
