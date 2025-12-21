/**
 * Shipping System Types
 * Table Rate Shipping for Jocril Acrilicos
 */

// =====================================================
// Database Record Types
// =====================================================

export interface ShippingZone {
  id: number;
  code: string;
  name: string;
  postal_code_start: number;
  postal_code_end: number;
  free_shipping_threshold_cents: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingClass {
  id: number;
  code: string;
  name: string;
  max_weight_grams: number;
  carrier_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  id: number;
  zone_id: number;
  class_id: number;
  min_weight_grams: number;
  max_weight_grams: number;
  base_rate_cents: number;
  extra_kg_rate_cents: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
}

// =====================================================
// Extended Types with Relations
// =====================================================

export interface ShippingRateWithRelations extends ShippingRate {
  zone?: ShippingZone;
  class?: ShippingClass;
}

export interface ShippingZoneWithRates extends ShippingZone {
  rates?: ShippingRate[];
}

// =====================================================
// Calculation Types
// =====================================================

export interface CartItemForShipping {
  variant_id: number;
  quantity: number;
}

export interface ShippingCalculationRequest {
  cart_items: CartItemForShipping[];
  postal_code: string;
}

export interface ShippingCalculationResult {
  success: boolean;
  error?: string;
  zone_code?: string;
  zone_name?: string;
  shipping_class_code?: string;
  shipping_class_name?: string;
  carrier_name?: string;
  actual_weight_grams?: number;
  volumetric_weight_grams?: number;
  billable_weight_grams?: number;
  shipping_cost_cents?: number;
  free_shipping_threshold_cents?: number | null;
  is_free_shipping?: boolean;
  estimated_days_min?: number;
  estimated_days_max?: number;
}

// =====================================================
// API Response Types
// =====================================================

export interface ShippingZoneResponse {
  success: boolean;
  data?: ShippingZone | ShippingZone[];
  error?: string;
}

export interface ShippingClassResponse {
  success: boolean;
  data?: ShippingClass | ShippingClass[];
  error?: string;
}

export interface ShippingRateResponse {
  success: boolean;
  data?: ShippingRate | ShippingRate[];
  error?: string;
}

export interface ShippingSettingsResponse {
  success: boolean;
  data?: ShippingSetting[];
  error?: string;
}

// =====================================================
// Form Types
// =====================================================

export interface ShippingZoneFormData {
  code: string;
  name: string;
  postal_code_start: number;
  postal_code_end: number;
  free_shipping_threshold_cents: number | null;
  is_active: boolean;
  display_order: number;
}

export interface ShippingClassFormData {
  code: string;
  name: string;
  max_weight_grams: number;
  carrier_name: string;
  is_active: boolean;
}

export interface ShippingRateFormData {
  zone_id: number;
  class_id: number;
  min_weight_grams: number;
  max_weight_grams: number;
  base_rate_cents: number;
  extra_kg_rate_cents: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
}

// =====================================================
// UI Display Types
// =====================================================

export interface ShippingRateMatrix {
  zones: ShippingZone[];
  classes: ShippingClass[];
  rates: Map<string, ShippingRate>; // key: `${zone_id}-${class_id}-${min_weight}`
}

export interface ShippingDisplayInfo {
  zoneName: string;
  carrierName: string;
  costFormatted: string;
  estimatedDays: string;
  isFreeShipping: boolean;
  freeShippingProgress?: number; // 0-100 percentage to free shipping
  amountToFreeShipping?: number; // cents remaining
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Format cents to Euro currency string
 */
export function formatShippingCost(cents: number): string {
  return (cents / 100).toFixed(2) + "€";
}

/**
 * Format weight in grams to kg display
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return (grams / 1000).toFixed(1) + " kg";
  }
  return grams + " g";
}

/**
 * Format estimated delivery days
 */
export function formatEstimatedDays(min: number, max: number): string {
  if (min === max) {
    return `${min} dia${min !== 1 ? "s" : ""} útil`;
  }
  return `${min}-${max} dias úteis`;
}

/**
 * Calculate free shipping progress (0-100)
 */
export function calculateFreeShippingProgress(
  subtotalCents: number,
  thresholdCents: number | null
): number {
  if (!thresholdCents || thresholdCents <= 0) return 0;
  if (subtotalCents >= thresholdCents) return 100;
  return Math.round((subtotalCents / thresholdCents) * 100);
}

/**
 * Calculate amount remaining for free shipping
 */
export function calculateAmountToFreeShipping(
  subtotalCents: number,
  thresholdCents: number | null
): number {
  if (!thresholdCents || thresholdCents <= 0) return 0;
  if (subtotalCents >= thresholdCents) return 0;
  return thresholdCents - subtotalCents;
}

/**
 * Validate Portuguese postal code format
 */
export function isValidPortuguesePostalCode(postalCode: string): boolean {
  // Accepts: 1234, 1234-567, 1234567
  const cleaned = postalCode.replace(/[^0-9]/g, "");
  if (cleaned.length < 4 || cleaned.length > 7) return false;
  const prefix = parseInt(cleaned.substring(0, 4), 10);
  return prefix >= 1000 && prefix <= 9999;
}

/**
 * Extract numeric postal code prefix (first 4 digits)
 */
export function extractPostalCodePrefix(postalCode: string): number | null {
  const cleaned = postalCode.replace(/[^0-9]/g, "");
  if (cleaned.length < 4) return null;
  return parseInt(cleaned.substring(0, 4), 10);
}
