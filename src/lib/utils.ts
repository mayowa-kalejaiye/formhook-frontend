// Utility functions for the FormHook frontend
// Tailwind Merge and className joiner

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(...inputs));
}

export function describeTimeUntil(target?: string | null) {
  if (!target) return null;
  const timestamp = Date.parse(target);
  if (Number.isNaN(timestamp)) return null;
  const diffMs = timestamp - Date.now();
  if (diffMs <= 0) return '0m';
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  const hours = Math.floor((diffMs % dayMs) / hourMs);
  const minutes = Math.floor((diffMs % hourMs) / minuteMs);
  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${Math.max(minutes, 0)}m`;
}

export function formatDateShort(target?: string | null, locale = 'en-US') {
  if (!target) return null;
  const timestamp = Date.parse(target);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric'
  });
}
