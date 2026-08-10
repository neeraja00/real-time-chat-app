/**
 * Formats a ISO Date string or Date object into human-readable chat timestamp.
 * 
 * Today: "7:32 PM"
 * Older: "Aug 9, 2026, 7:32 PM"
 * 
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export const formatChatTime = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Time format: "7:32 PM"
  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

  if (isToday) {
    return formattedTime;
  } else {
    // Older messages: "Aug 9, 2026, 7:32 PM"
    const dateOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    const formattedDate = date.toLocaleDateString(undefined, dateOptions);
    return `${formattedDate}, ${formattedTime}`;
  }
};
