function yearOfDate(value: unknown): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getUTCFullYear() : null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date.getUTCFullYear() : null;
}

export function validatePeakEstimates(ability: unknown, year: unknown, birthdate: unknown, currentDate: unknown): void {
  if (ability != null && (typeof ability !== 'number' || !Number.isInteger(ability) || ability < 0 || ability > 99)) {
    throw new Error('Estimated peak ability must be a whole number between 0 and 99, or unknown');
  }
  if (year == null) return;
  if (ability == null) throw new Error('An estimated peak year requires an estimated peak ability');
  const birthYear = yearOfDate(birthdate);
  const currentYear = yearOfDate(currentDate);
  if (typeof year !== 'number' || !Number.isInteger(year) || birthYear === null || currentYear === null
    || year < birthYear || year > currentYear) {
    throw new Error('Estimated peak year must be within the trainer lifetime through the current save year; leave it unknown otherwise');
  }
}
