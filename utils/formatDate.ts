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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
  