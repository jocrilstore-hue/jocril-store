/**
 * Product-related types
 * 
 * Note: These are re-exports from lib/types.ts for backwards compatibility.
 * New code should import directly from lib/types/.
 */

export type {
  Category,
  SizeFormat,
  ProductTemplate,
  ProductVariant,
  PriceTier,
  ProductImage,
  ProductTemplateImage,
  ProductFull,
  ProductSpecifications,
} from "@/lib/types";

/**
 * Extended product types for admin queries
 */
export type {
  ProductTemplateSort,
  ProductTemplateStatusFilter,
  ProductTemplateFilters,
  ProductTemplateSummary,
  PaginatedProductTemplates,
  ProductTaxonomyData,
  ProductTemplateDetail,
  ApplicationOption,
  SizeFormatOption,
  VariantSummary,
  ProductVariantDetail,
} from "@/lib/supabase/queries/admin-products";
