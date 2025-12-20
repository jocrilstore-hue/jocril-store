import { z } from "zod";

/**
 * Product Template Validation Schema
 * Used for creating and editing product templates
 */
export const productTemplateSchema = z.object({
  // Basic Info
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(200, "O nome não pode ter mais de 200 caracteres")
    .trim(),

  slug: z
    .string()
    .min(3, "O slug deve ter pelo menos 3 caracteres")
    .max(200, "O slug não pode ter mais de 200 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "O slug deve conter apenas letras minúsculas, números e hífens",
    )
    .trim(),

  skuPrefix: z
    .string()
    .min(2, "O prefixo SKU deve ter pelo menos 2 caracteres")
    .max(20, "O prefixo SKU não pode ter mais de 20 caracteres")
    .regex(
      /^[A-Z0-9-]+$/,
      "O prefixo SKU deve conter apenas letras maiúsculas, números e hífens",
    )
    .optional(),

  referenceCode: z.string().max(50).optional().or(z.literal("")),

  // Taxonomy
  categoryId: z.number().int().positive("Selecione uma categoria").nullable(),

  materialId: z
    .number()
    .int()
    .positive("Selecione um material")
    .nullable()
    .optional(),

  // Descriptions
  shortDescription: z
    .string()
    .max(500, "A descrição curta não pode ter mais de 500 caracteres")
    .optional()
    .or(z.literal("")),

  fullDescription: z
    .string()
    .max(10000, "A descrição completa é muito longa")
    .optional()
    .or(z.literal("")),

  advantages: z.string().max(2000).optional().or(z.literal("")),

  specificationsText: z.string().max(2000).optional().or(z.literal("")),

  careInstructions: z.string().max(1000).optional().or(z.literal("")),

  // FAQ
  faq: z
    .array(
      z.object({
        question: z
          .string()
          .min(5, "A pergunta deve ter pelo menos 5 caracteres")
          .max(500),
        answer: z
          .string()
          .min(10, "A resposta deve ter pelo menos 10 caracteres")
          .max(2000),
      }),
    )
    .optional(),

  // Product Features
  isCustomizable: z.boolean().default(false),
  isDoubleSided: z.boolean().default(false),
  isAdhesive: z.boolean().default(false),
  hasLock: z.boolean().default(false),
  hasQuantityDiscounts: z.boolean().default(false),

  // Status & Ordering
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(9999).optional().nullable(),
  minOrderQuantity: z.number().int().min(1).max(1000).default(1),

  // SEO
  metaTitle: z
    .string()
    .max(60, "O título SEO não pode ter mais de 60 caracteres")
    .optional()
    .or(z.literal("")),

  metaDescription: z
    .string()
    .max(160, "A descrição SEO não pode ter mais de 160 caracteres")
    .optional()
    .or(z.literal("")),

  metaKeywords: z.string().max(255).optional().or(z.literal("")),
});

export type ProductTemplateFormData = z.infer<typeof productTemplateSchema>;

/**
 * Product Variant Validation Schema
 * Used for creating and editing product variants
 */
export const productVariantSchema = z.object({
  // Relations
  productTemplateId: z.number().int().positive(),
  sizeFormatId: z.number().int().positive("Selecione um formato"),

  // Identification
  sku: z
    .string()
    .min(3, "O SKU deve ter pelo menos 3 caracteres")
    .max(50, "O SKU não pode ter mais de 50 caracteres")
    .regex(
      /^[A-Z0-9-]+$/,
      "O SKU deve conter apenas letras maiúsculas, números e hífens",
    )
    .trim(),

  urlSlug: z
    .string()
    .min(3, "O slug URL deve ter pelo menos 3 caracteres")
    .max(255, "O slug URL não pode ter mais de 255 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "O slug URL deve conter apenas letras minúsculas, números e hífens",
    )
    .trim(),

  // Pricing
  basePriceExcludingVat: z
    .number()
    .positive("O preço deve ser maior que zero")
    .max(99999.99, "O preço é muito alto")
    .multipleOf(0.01, "O preço deve ter no máximo 2 casas decimais"),

  basePriceIncludingVat: z
    .number()
    .positive("O preço deve ser maior que zero")
    .max(99999.99, "O preço é muito alto")
    .multipleOf(0.01, "O preço deve ter no máximo 2 casas decimais"),

  // Stock (dormant - products are manufactured to order)
  stockQuantity: z
    .number()
    .int("A quantidade deve ser um número inteiro")
    .min(0, "A quantidade não pode ser negativa")
    .max(999999, "A quantidade é muito alta")
    .default(9999),

  stockStatus: z
    .enum(["in_stock", "low_stock", "out_of_stock", "discontinued"])
    .default("in_stock"), // Always in_stock for manufactured products

  lowStockThreshold: z.number().int().min(0).max(1000).default(10),

  // Content
  specificDescription: z.string().max(1000).optional().or(z.literal("")),

  idealFor: z.string().max(500).optional().or(z.literal("")),

  mainImageUrl: z
    .string()
    .url("URL de imagem inválida")
    .optional()
    .or(z.literal("")),

  // Custom Dimensions (for customizable products)
  customWidth: z.number().positive().optional().nullable(),
  customHeight: z.number().positive().optional().nullable(),
  customDepth: z.number().positive().optional().nullable(),

  // Status
  isActive: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(9999).optional().nullable(),

  // Orientation (for products that have it)
  orientation: z.enum(["horizontal", "vertical", "both"]).optional().nullable(),

  // Minimum order quantity
  minOrderQuantity: z.number().int().min(1).default(1),

  // Technical image (specifications diagram for this variant)
  technicalImageUrl: z
    .string()
    .url("URL de imagem inválida")
    .optional()
    .or(z.literal("")),

  // Technical Specifications (variant-specific)
  specificationsJson: z
    .object({
      produto: z
        .object({
          largura_mm: z.number().nullable().optional(),
          altura_mm: z.number().nullable().optional(),
          profundidade_mm: z.number().nullable().optional(),
        })
        .optional(),
      area_grafica: z
        .object({
          largura_mm: z.number().nullable().optional(),
          altura_mm: z.number().nullable().optional(),
          formato: z.string().nullable().optional(),
          impressao: z.string().nullable().optional(),
          num_cores: z.number().nullable().optional(),
        })
        .optional(),
      notas: z.string().nullable().optional(),
      extras: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
    })
    .nullable()
    .optional(),
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;

/**
 * Price Tier Validation Schema
 * Used for quantity-based pricing
 */
export const priceTierSchema = z.object({
  productVariantId: z.number().int().positive(),
  minQuantity: z
    .number()
    .int()
    .min(2, "A quantidade mínima deve ser pelo menos 2"),
  maxQuantity: z.number().int().positive().optional().nullable(),
  discountPercentage: z
    .number()
    .min(0, "O desconto não pode ser negativo")
    .max(100, "O desconto não pode ser maior que 100%")
    .multipleOf(0.01),
  pricePerUnit: z
    .number()
    .positive("O preço deve ser maior que zero")
    .max(99999.99, "O preço é muito alto")
    .multipleOf(0.01),
});

// Refine to ensure maxQuantity is greater than minQuantity
export const priceTierSchemaWithRefinement = priceTierSchema.refine(
  (data) => {
    if (data.maxQuantity && data.minQuantity) {
      return data.maxQuantity > data.minQuantity;
    }
    return true;
  },
  {
    message: "A quantidade máxima deve ser maior que a quantidade mínima",
    path: ["maxQuantity"],
  },
);

export type PriceTierFormData = z.infer<typeof priceTierSchema>;

/**
 * Product Image Validation Schema
 */
export const productImageSchema = z.object({
  productVariantId: z.number().int().positive(),
  imageUrl: z.string().url("URL de imagem inválida"),
  imageType: z
    .enum(["main", "gallery", "thumbnail", "detail"])
    .default("gallery"),
  altText: z.string().max(255).optional().or(z.literal("")),
  displayOrder: z.number().int().min(0).default(0),
});

export type ProductImageFormData = z.infer<typeof productImageSchema>;

/**
 * Bulk Price Update Schema
 * Used for tools dashboard bulk operations
 */
export const bulkPriceUpdateSchema = z.object({
  variantIds: z
    .array(z.number().int().positive())
    .min(1, "Selecione pelo menos uma variante"),
  adjustmentType: z.enum(["percentage", "fixed"]),
  adjustmentValue: z.number().min(-100).max(1000),
  applyToBasePrice: z.boolean().default(true),
  applyToPriceTiers: z.boolean().default(false),
});

export type BulkPriceUpdateFormData = z.infer<typeof bulkPriceUpdateSchema>;

/**
 * Helper: Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single
}

/**
 * Helper: Generate SKU
 */
export function generateSKU(prefix: string, suffix: string | number): string {
  const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const cleanSuffix = String(suffix)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
  return `${cleanPrefix}-${cleanSuffix}`;
}

/**
 * Helper: Generate reference code (J- + 6 random alphanumeric chars)
 */
export function generateReferenceCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "J-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Helper: Generate SKU prefix from product name (first letter of each word)
 */
export function generateSkuPrefix(name: string): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .slice(0, 5)
    .join("");
}

/**
 * Helper: Calculate price including VAT
 */
export function calculatePriceWithVAT(
  priceExcludingVAT: number,
  vatRate: number = 0.23,
): number {
  return Math.round(priceExcludingVAT * (1 + vatRate) * 100) / 100;
}

/**
 * Helper: Calculate price excluding VAT
 */
export function calculatePriceWithoutVAT(
  priceIncludingVAT: number,
  vatRate: number = 0.23,
): number {
  return Math.round((priceIncludingVAT / (1 + vatRate)) * 100) / 100;
}

/**
 * Helper: Determine stock status
 */
export function determineStockStatus(
  quantity: number,
  lowStockThreshold: number = 10,
): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

/**
 * Helper: Format price for display
 */
export function formatPrice(price: number): string {
  return price.toFixed(2) + "€";
}

/**
 * Helper: Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Formato de imagem inválido. Use JPEG, PNG, WebP ou AVIF.",
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: "A imagem é muito grande. O tamanho máximo é 5MB.",
    };
  }

  return { valid: true };
}
