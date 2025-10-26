import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects if the current device is a mobile device
 * @returns true if the device is mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Mobile regex patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
}

/**
 * Detects if the current device is a tablet
 * @returns true if the device is a tablet, false otherwise
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for iPad specifically
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Basic tablet detection (iPad or Android tablet)
  return /iPad|Android.*(?=.*tablet)/i.test(userAgent);
}