/**
 * Format a date string
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} [locale=en-US] - Locale for formatting
 * @returns {string} - Formatted date string
 */
export function FormatDate(dateInput: any, locale = "en-US") {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString(locale, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const FineDate = (timestamp: any) => {
  // Extract parts
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6) - 1; // JS months are 0-based
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);

  // Create Date object
  const date = new Date(year, month, day, hour, minute, second);
  return date.toString()
  // Format it
  console.log(date.toString());
}

export function getDurationFromNow(createdAt: any) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

export const getDaysBetween = (futureDateStr: string): number => {
  const today = new Date();
  const futureDate = new Date(futureDateStr);
  const diffTime = futureDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};