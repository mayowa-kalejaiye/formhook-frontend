// Utility functions for the FormHook frontend
// Tailwind Merge and className joiner

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(...inputs));
}
