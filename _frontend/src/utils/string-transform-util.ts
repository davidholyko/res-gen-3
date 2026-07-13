/**
 * @param date
 * @returns {string} date in YYYY-MM-DD format
 */
export function toYearMonthDayFormat(date: Date = new Date()) {
  const year = date.getFullYear().toString().slice(-2); // Get the last two digits of the year
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toSlugCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, ''); // Remove any non-alphanumeric characters except hyphens
}
