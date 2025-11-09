import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Check if a product template slug is unique
 * @param slug - The slug to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns true if unique, false if duplicate
 */
export async function isTemplateSlugUnique(slug: string, excludeId?: number): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase.from("product_templates").select("id").eq("slug", slug).limit(1)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error checking slug uniqueness:", error)
    return false // Assume not unique on error to be safe
  }

  return data.length === 0
}

/**
 * Check if a product variant SKU is unique
 * @param sku - The SKU to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns true if unique, false if duplicate
 */
export async function isVariantSKUUnique(sku: string, excludeId?: number): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase.from("product_variants").select("id").eq("sku", sku).limit(1)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error checking SKU uniqueness:", error)
    return false // Assume not unique on error to be safe
  }

  return data.length === 0
}

/**
 * Check if a product variant URL slug is unique
 * @param urlSlug - The URL slug to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns true if unique, false if duplicate
 */
export async function isVariantSlugUnique(urlSlug: string, excludeId?: number): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase.from("product_variants").select("id").eq("url_slug", urlSlug).limit(1)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error checking variant slug uniqueness:", error)
    return false // Assume not unique on error to be safe
  }

  return data.length === 0
}

/**
 * Generate a unique SKU by incrementing a suffix if needed
 * @param basePrefix - The base SKU prefix
 * @param baseSuffix - The initial suffix
 * @param maxAttempts - Maximum number of attempts to generate a unique SKU
 * @returns A unique SKU or null if max attempts reached
 */
export async function generateUniqueSKU(
  basePrefix: string,
  baseSuffix: string | number,
  maxAttempts: number = 100,
): Promise<string | null> {
  let attempt = 0
  let suffix = String(baseSuffix)

  while (attempt < maxAttempts) {
    const sku = `${basePrefix}-${suffix}`
    const isUnique = await isVariantSKUUnique(sku)

    if (isUnique) {
      return sku
    }

    // Increment suffix
    const numMatch = suffix.match(/\d+$/)
    if (numMatch) {
      const num = parseInt(numMatch[0])
      suffix = suffix.replace(/\d+$/, String(num + 1).padStart(numMatch[0].length, "0"))
    } else {
      suffix = `${suffix}-1`
    }

    attempt++
  }

  return null
}

/**
 * Generate a unique slug by incrementing a suffix if needed
 * @param baseSlug - The base slug
 * @param isTemplate - Whether this is for a template (true) or variant (false)
 * @param excludeId - Optional ID to exclude from the check
 * @param maxAttempts - Maximum number of attempts
 * @returns A unique slug or null if max attempts reached
 */
export async function generateUniqueSlug(
  baseSlug: string,
  isTemplate: boolean = false,
  excludeId?: number,
  maxAttempts: number = 100,
): Promise<string | null> {
  const checkFunction = isTemplate ? isTemplateSlugUnique : isVariantSlugUnique
  let attempt = 0
  let slug = baseSlug

  while (attempt < maxAttempts) {
    const isUnique = await checkFunction(slug, excludeId)

    if (isUnique) {
      return slug
    }

    // Increment suffix
    const numMatch = slug.match(/-(\d+)$/)
    if (numMatch) {
      const num = parseInt(numMatch[1])
      slug = slug.replace(/-\d+$/, `-${num + 1}`)
    } else {
      slug = `${slug}-1`
    }

    attempt++
  }

  return null
}

/**
 * Validate and ensure uniqueness for a template slug
 * @param slug - The proposed slug
 * @param excludeId - Optional ID to exclude
 * @returns Object with validation result and suggested slug if not unique
 */
export async function validateTemplateSlug(
  slug: string,
  excludeId?: number,
): Promise<{
  isValid: boolean
  isUnique: boolean
  suggestedSlug?: string
  error?: string
}> {
  // Basic validation
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(slug)) {
    return {
      isValid: false,
      isUnique: false,
      error: "O slug deve conter apenas letras minúsculas, números e hífens",
    }
  }

  // Check uniqueness
  const isUnique = await isTemplateSlugUnique(slug, excludeId)

  if (!isUnique) {
    const suggestedSlug = await generateUniqueSlug(slug, true, excludeId)
    return {
      isValid: true,
      isUnique: false,
      suggestedSlug: suggestedSlug || undefined,
      error: "Este slug já está em uso",
    }
  }

  return {
    isValid: true,
    isUnique: true,
  }
}

/**
 * Validate and ensure uniqueness for a variant SKU
 * @param sku - The proposed SKU
 * @param excludeId - Optional ID to exclude
 * @returns Object with validation result and suggested SKU if not unique
 */
export async function validateVariantSKU(
  sku: string,
  excludeId?: number,
): Promise<{
  isValid: boolean
  isUnique: boolean
  suggestedSKU?: string
  error?: string
}> {
  // Basic validation
  const skuRegex = /^[A-Z0-9-]+$/
  if (!skuRegex.test(sku)) {
    return {
      isValid: false,
      isUnique: false,
      error: "O SKU deve conter apenas letras maiúsculas, números e hífens",
    }
  }

  // Check uniqueness
  const isUnique = await isVariantSKUUnique(sku, excludeId)

  if (!isUnique) {
    // Try to extract prefix and suffix for suggestion
    const parts = sku.split("-")
    if (parts.length >= 2) {
      const prefix = parts.slice(0, -1).join("-")
      const suffix = parts[parts.length - 1]
      const suggestedSKU = await generateUniqueSKU(prefix, suffix)
      return {
        isValid: true,
        isUnique: false,
        suggestedSKU: suggestedSKU || undefined,
        error: "Este SKU já está em uso",
      }
    }

    return {
      isValid: true,
      isUnique: false,
      error: "Este SKU já está em uso",
    }
  }

  return {
    isValid: true,
    isUnique: true,
  }
}

/**
 * Batch check uniqueness for multiple SKUs
 * @param skus - Array of SKUs to check
 * @returns Map of SKU to uniqueness status
 */
export async function batchCheckSKUUniqueness(skus: string[]): Promise<Map<string, boolean>> {
  const supabase = await createClient()
  const result = new Map<string, boolean>()

  // Query all SKUs in one go
  const { data, error } = await supabase.from("product_variants").select("sku").in("sku", skus)

  if (error) {
    console.error("Error batch checking SKU uniqueness:", error)
    // Mark all as not unique on error
    skus.forEach((sku) => result.set(sku, false))
    return result
  }

  const existingSKUs = new Set(data.map((item) => item.sku))
  skus.forEach((sku) => {
    result.set(sku, !existingSKUs.has(sku))
  })

  return result
}
