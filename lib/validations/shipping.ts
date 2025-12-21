import { z } from "zod";

/**
 * Shipping Zone Validation Schema
 */
export const shippingZoneSchema = z.object({
  code: z
    .string()
    .min(2, "O código deve ter pelo menos 2 caracteres")
    .max(50, "O código não pode ter mais de 50 caracteres")
    .regex(
      /^[a-z0-9_-]+$/,
      "O código deve conter apenas letras minúsculas, números, hífens e underscores"
    )
    .trim(),

  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome não pode ter mais de 100 caracteres")
    .trim(),

  postal_code_start: z
    .number()
    .int("O código postal deve ser um número inteiro")
    .min(1000, "O código postal inicial deve ser no mínimo 1000")
    .max(9999, "O código postal inicial deve ser no máximo 9999"),

  postal_code_end: z
    .number()
    .int("O código postal deve ser um número inteiro")
    .min(1000, "O código postal final deve ser no mínimo 1000")
    .max(9999, "O código postal final deve ser no máximo 9999"),

  free_shipping_threshold_cents: z
    .number()
    .int("O valor deve ser um número inteiro")
    .min(0, "O valor não pode ser negativo")
    .nullable()
    .optional(),

  is_active: z.boolean().default(true),

  display_order: z
    .number()
    .int("A ordem deve ser um número inteiro")
    .min(0, "A ordem não pode ser negativa")
    .default(0),
});

export const shippingZoneSchemaWithRefinement = shippingZoneSchema.refine(
  (data) => data.postal_code_end >= data.postal_code_start,
  {
    message: "O código postal final deve ser maior ou igual ao inicial",
    path: ["postal_code_end"],
  }
);

export type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>;

/**
 * Shipping Class Validation Schema
 */
export const shippingClassSchema = z.object({
  code: z
    .string()
    .min(2, "O código deve ter pelo menos 2 caracteres")
    .max(50, "O código não pode ter mais de 50 caracteres")
    .regex(
      /^[a-z0-9_-]+$/,
      "O código deve conter apenas letras minúsculas, números, hífens e underscores"
    )
    .trim(),

  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome não pode ter mais de 100 caracteres")
    .trim(),

  max_weight_grams: z
    .number()
    .int("O peso deve ser um número inteiro")
    .min(1, "O peso máximo deve ser pelo menos 1 grama")
    .max(999999999, "O peso máximo é muito alto"),

  carrier_name: z
    .string()
    .min(2, "O nome da transportadora deve ter pelo menos 2 caracteres")
    .max(200, "O nome da transportadora não pode ter mais de 200 caracteres")
    .trim(),

  is_active: z.boolean().default(true),
});

export type ShippingClassFormData = z.infer<typeof shippingClassSchema>;

/**
 * Shipping Rate Validation Schema
 */
export const shippingRateSchema = z.object({
  zone_id: z.number().int().positive("Selecione uma zona"),

  class_id: z.number().int().positive("Selecione uma classe"),

  min_weight_grams: z
    .number()
    .int("O peso deve ser um número inteiro")
    .min(0, "O peso mínimo não pode ser negativo"),

  max_weight_grams: z
    .number()
    .int("O peso deve ser um número inteiro")
    .min(1, "O peso máximo deve ser pelo menos 1 grama"),

  base_rate_cents: z
    .number()
    .int("O valor deve ser um número inteiro")
    .min(0, "O valor não pode ser negativo"),

  extra_kg_rate_cents: z
    .number()
    .int("O valor deve ser um número inteiro")
    .min(0, "O valor não pode ser negativo")
    .default(0),

  estimated_days_min: z
    .number()
    .int("Os dias devem ser um número inteiro")
    .min(1, "O mínimo de dias deve ser pelo menos 1")
    .default(1),

  estimated_days_max: z
    .number()
    .int("Os dias devem ser um número inteiro")
    .min(1, "O máximo de dias deve ser pelo menos 1")
    .default(3),

  is_active: z.boolean().default(true),
});

export const shippingRateSchemaWithRefinement = shippingRateSchema
  .refine((data) => data.max_weight_grams > data.min_weight_grams, {
    message: "O peso máximo deve ser maior que o peso mínimo",
    path: ["max_weight_grams"],
  })
  .refine((data) => data.estimated_days_max >= data.estimated_days_min, {
    message: "O máximo de dias deve ser maior ou igual ao mínimo",
    path: ["estimated_days_max"],
  });

export type ShippingRateFormData = z.infer<typeof shippingRateSchema>;

/**
 * Shipping Settings Validation Schema
 */
export const shippingSettingSchema = z.object({
  setting_key: z
    .string()
    .min(2, "A chave deve ter pelo menos 2 caracteres")
    .max(100, "A chave não pode ter mais de 100 caracteres")
    .regex(
      /^[a-z0-9_]+$/,
      "A chave deve conter apenas letras minúsculas, números e underscores"
    ),

  setting_value: z
    .string()
    .min(1, "O valor é obrigatório")
    .max(1000, "O valor não pode ter mais de 1000 caracteres"),

  description: z.string().max(500).nullable().optional(),
});

export type ShippingSettingFormData = z.infer<typeof shippingSettingSchema>;

/**
 * Shipping Calculation Request Schema
 */
export const shippingCalculationSchema = z.object({
  cart_items: z
    .array(
      z.object({
        variant_id: z.number().int().positive("ID da variante inválido"),
        quantity: z
          .number()
          .int("A quantidade deve ser um número inteiro")
          .min(1, "A quantidade mínima é 1"),
      })
    )
    .min(1, "Adicione produtos ao carrinho para calcular o envio."),

  postal_code: z
    .string()
    .min(4, "Código postal inválido. Use o formato português (XXXX-XXX ou XXXX).")
    .max(10, "Código postal inválido.")
    .refine(
      (val) => {
        const cleaned = val.replace(/[^0-9]/g, "");
        if (cleaned.length < 4) return false;
        const prefix = parseInt(cleaned.substring(0, 4), 10);
        return prefix >= 1000 && prefix <= 9999;
      },
      {
        message: "Código postal inválido. Use o formato português (XXXX-XXX ou XXXX).",
      }
    ),
});

export type ShippingCalculationFormData = z.infer<typeof shippingCalculationSchema>;

/**
 * Bulk Rate Update Schema
 */
export const bulkRateUpdateSchema = z.object({
  rate_ids: z
    .array(z.number().int().positive())
    .min(1, "Selecione pelo menos uma taxa"),

  adjustment_type: z.enum(["percentage", "fixed"]),

  adjustment_value: z.number(),

  apply_to_base: z.boolean().default(true),
  apply_to_extra_kg: z.boolean().default(false),
});

export type BulkRateUpdateFormData = z.infer<typeof bulkRateUpdateSchema>;

/**
 * Helper: Format cents to display (e.g., 500 -> "5.00")
 */
export function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Helper: Parse display value to cents (e.g., "5.00" -> 500)
 */
export function displayToCents(display: string): number {
  const value = parseFloat(display.replace(",", "."));
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Helper: Format grams to display (e.g., 1000 -> "1.0 kg")
 */
export function gramsToDisplay(grams: number): string {
  if (grams >= 1000) {
    return (grams / 1000).toFixed(1) + " kg";
  }
  return grams + " g";
}

/**
 * Helper: Parse kg input to grams (e.g., "1.5" -> 1500)
 */
export function kgToGrams(kg: string): number {
  const value = parseFloat(kg.replace(",", "."));
  if (isNaN(value)) return 0;
  return Math.round(value * 1000);
}
