/**
 * Time formatting utilities for displaying relative and absolute timestamps
 */

/**
 * Format a date as relative time (e.g., "Just now", "5m ago", "2h ago")
 * @param {Date} date - The date to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date as a short save indicator (e.g., "Saved", "5m ago", "3:45 PM")
 * @param {Date} date - The date to format
 * @returns {string|null} Formatted time string or null if no date
 */
export function formatSaveTime(date) {
  if (!date) return null;

  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Saved';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format a date as time ago for dashboard display (e.g., "Today", "Yesterday", "3d ago")
 * @param {Date|string} dateInput - The date to format
 * @returns {string} Formatted time string
 */
export function formatTimeAgo(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
