/**
 * Application-wide constants
 * Centralized to avoid magic numbers/strings throughout the codebase
 */

// Cart & Order
export const MAX_CART_QUANTITY = 9999;
export const MIN_ORDER_QUANTITY = 1;
export const FREE_SHIPPING_THRESHOLD = 150; // euros

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Stock
export const LOW_STOCK_THRESHOLD = 10;
export const OUT_OF_STOCK_THRESHOLD = 0;

// VAT
export const VAT_RATE = 0.23; // 23% Portuguese VAT
export const VAT_MULTIPLIER = 1 + VAT_RATE;

// Image Upload
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const IMAGE_COMPRESSION_QUALITY = 0.9;
export const IMAGE_MAX_WIDTH = 1920;

// ISR Revalidation Times (in seconds)
export const REVALIDATE_SHORT = 300; // 5 minutes
export const REVALIDATE_MEDIUM = 3600; // 1 hour
export const REVALIDATE_LONG = 86400; // 24 hours

// Rate Limiting
export const RATE_LIMIT_ADMIN = 100; // requests per minute
export const RATE_LIMIT_PUBLIC = 30; // requests per minute
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Debounce
export const DEBOUNCE_SEARCH_MS = 400;
export const DEBOUNCE_SAVE_MS = 1000;

// Local Storage Keys
export const STORAGE_CART_KEY = "jocril-cart";
export const STORAGE_THEME_KEY = "jocril-theme";

// Search
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_RESULTS = 100;

// SEO
export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_DESCRIPTION_MAX_LENGTH = 160;
export const SEO_SITE_NAME = "Jocril Acrílicos";

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
