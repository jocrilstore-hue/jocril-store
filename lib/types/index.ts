/**
 * Centralized Type Exports
 * 
 * Import types from this file for consistent access across the codebase.
 * 
 * @example
 * import type { CartItem, ProductTemplate, ApiResponse } from "@/lib/types";
 */

// Core domain types
export * from "./products";
export * from "./cart";
export * from "./api";

// Legacy re-exports from main types file (for backwards compatibility)
export type {
  Category,
  SizeFormat,
  ProductTemplate,
  ProductVariant,
  PriceTier,
  ProductImage,
  ProductTemplateImage,
  ProductFull,
  CartItem,
  Cart,
  ProductSpecifications,
} from "@/lib/types";
