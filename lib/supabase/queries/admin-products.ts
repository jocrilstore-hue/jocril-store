import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export type ProductTemplateSort =
  | "name-asc"
  | "name-desc"
  | "updated-desc"
  | "updated-asc"
  | "order-asc"
  | "order-desc"

export type ProductTemplateStatusFilter = "all" | "active" | "inactive" | "featured"

export interface ProductTemplateFilters {
  search?: string
  categoryId?: number
  materialId?: number
  status?: ProductTemplateStatusFilter
  page?: number
  pageSize?: number
  sort?: ProductTemplateSort
}

type RawTemplateRow = {
  id: number
  name: string
  slug: string
  reference_code?: string | null
  created_at?: string | null
  updated_at: string | null
  display_order?: number | null
  is_active?: boolean | null
  is_featured?: boolean | null
  min_order_quantity?: number | null
  category?: {
    id: number
    name: string
    slug?: string | null
  } | null
  material?: {
    id: number
    name: string
  } | null
  variants?: Array<{
    id: number
    is_active?: boolean | null
    main_image_url?: string | null
    display_order?: number | null
  }> | null
}

export interface ProductTemplateSummary {
  id: number
  name: string
  slug: string
  referenceCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  displayOrder?: number | null
  isActive: boolean
  isFeatured: boolean
  minOrderQuantity?: number | null
  category?: { id: number; name: string } | null
  material?: { id: number; name: string } | null
  variantCount: number
  activeVariantCount: number
  thumbnailUrl?: string | null
}

export interface PaginatedProductTemplates {
  items: ProductTemplateSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProductTaxonomyData {
  categories: Array<{ id: number; name: string }>
  materials: Array<{ id: number; name: string }>
}

export interface ProductTemplateDetail extends ProductTemplateSummary {
  categoryId?: number | null
  materialId?: number | null
  skuPrefix?: string | null
  shortDescription?: string | null
  fullDescription?: string | null
  advantages?: string | null
  specificationsText?: string | null
  careInstructions?: string | null
  faq?: Array<{ question: string; answer: string }>
  isCustomizable?: boolean
  isDoubleSided?: boolean
  isAdhesive?: boolean
  hasLock?: boolean
  hasQuantityDiscounts?: boolean
  orientation?: string | null
  seoTitleTemplate?: string | null
  seoDescriptionTemplate?: string | null
  applications: number[]
}

export interface ApplicationOption {
  id: number
  title: string
}

export interface SizeFormatOption {
  id: number
  name: string
  code?: string | null
  width_mm?: number | null
  height_mm?: number | null
}

export interface VariantSummary {
  id: number
  productTemplateId: number
  sizeFormatId?: number | null
  sku: string
  urlSlug: string
  orientation?: string | null
  basePriceExcludingVat: number
  basePriceIncludingVat: number
  costPrice?: number | null
  stockQuantity?: number | null
  stockStatus?: string | null
  mainImageUrl?: string | null
  weightGrams?: number | null
  isActive: boolean
  sizeFormat?: SizeFormatOption | null
  priceTierCount: number
  imageCount: number
}

export interface ProductVariantDetail extends VariantSummary {
  barcode?: string | null
  specificDescription?: string | null
  idealFor?: string | null
  capacityDescription?: string | null
  stockStatus?: string | null
  lowStockThreshold?: number | null
  restockDate?: string | null
  customWidthMm?: number | null
  customHeightMm?: number | null
  customDepthMm?: number | null
  stockQuantity?: number | null
}

const SORT_MAP: Record<ProductTemplateSort, { column: string; ascending: boolean }> = {
  "name-asc": { column: "name", ascending: true },
  "name-desc": { column: "name", ascending: false },
  "updated-desc": { column: "updated_at", ascending: false },
  "updated-asc": { column: "updated_at", ascending: true },
  "order-asc": { column: "display_order", ascending: true },
  "order-desc": { column: "display_order", ascending: false },
}

function normalizeSort(sort?: ProductTemplateSort) {
  if (!sort) {
    return SORT_MAP["order-asc"]
  }
  return SORT_MAP[sort] ?? SORT_MAP["order-asc"]
}

function mapTemplateRow(row: RawTemplateRow): ProductTemplateSummary {
  const variants = row.variants ?? []
  const sortedVariants = [...variants].sort((a, b) => {
    const orderA = a.display_order ?? 0
    const orderB = b.display_order ?? 0
    return orderA - orderB
  })
  const activeVariant = sortedVariants.find((variant) => variant.is_active)
  const thumbnailSource = activeVariant ?? sortedVariants[0]

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    referenceCode: row.reference_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    displayOrder: row.display_order ?? undefined,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    minOrderQuantity: row.min_order_quantity ?? undefined,
    category: row.category ? { id: row.category.id, name: row.category.name } : null,
    material: row.material ? { id: row.material.id, name: row.material.name } : null,
    variantCount: variants.length,
    activeVariantCount: variants.filter((variant) => variant.is_active).length,
    thumbnailUrl: thumbnailSource?.main_image_url ?? null,
  }
}

async function resolveClient(client?: SupabaseClient) {
  if (client) {
    return client
  }
  return createClient()
}

export async function fetchAdminProductTemplates(
  filters: ProductTemplateFilters,
  client?: SupabaseClient,
): Promise<PaginatedProductTemplates> {
  const supabase = await resolveClient(client)
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { column, ascending } = normalizeSort(filters.sort)

  let query = supabase
    .from("product_templates")
    .select(
      `
        id,
        name,
        slug,
        reference_code,
        updated_at,
        display_order,
        is_active,
        is_featured,
        min_order_quantity,
        category:categories!product_templates_category_id_fkey (
          id,
          name,
          slug
        ),
        material:materials!product_templates_material_id_fkey (
          id,
          name
        ),
        variants:product_variants (
          id,
          is_active,
          main_image_url,
          display_order
        )
      `,
      { count: "exact" },
    )
    .range(from, to)
    .order(column, { ascending, nullsFirst: true })
    .order("name", { ascending: true })

  if (filters.search) {
    const like = `%${filters.search}%`
    query = query.or(`name.ilike.${like},reference_code.ilike.${like}`)
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId)
  }

  if (filters.materialId) {
    query = query.eq("material_id", filters.materialId)
  }

  if (filters.status === "active") {
    query = query.eq("is_active", true)
  } else if (filters.status === "inactive") {
    query = query.eq("is_active", false)
  } else if (filters.status === "featured") {
    query = query.eq("is_featured", true)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  const total = count ?? 0
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1

  return {
    items: (data ?? []).map(mapTemplateRow),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function fetchProductTaxonomies(client?: SupabaseClient): Promise<ProductTaxonomyData> {
  const supabase = await resolveClient(client)

  const [categoriesResult, materialsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("materials")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ])

  if (categoriesResult.error) {
    throw categoriesResult.error
  }

  if (materialsResult.error) {
    throw materialsResult.error
  }

  return {
    categories: categoriesResult.data ?? [],
    materials: materialsResult.data ?? [],
  }
}

export async function fetchApplications(client?: SupabaseClient): Promise<ApplicationOption[]> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase.from("applications").select("id, title").order("title", { ascending: true })
  if (error) {
    throw error
  }
  return data ?? []
}

export async function fetchSizeFormats(client?: SupabaseClient): Promise<SizeFormatOption[]> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase
    .from("size_formats")
    .select("id, name, code, width_mm, height_mm")
    .order("name", { ascending: true })
  if (error) {
    throw error
  }
  return data ?? []
}

export async function fetchProductTemplateDetail(id: number, client?: SupabaseClient): Promise<ProductTemplateDetail | null> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase
    .from("product_templates")
    .select(
      `
        id,
        name,
        slug,
        reference_code,
        sku_prefix,
        category_id,
        material_id,
        short_description,
        full_description,
        advantages,
        specifications_text,
        care_instructions,
        faq,
        is_active,
        is_featured,
        is_customizable,
        is_double_sided,
        is_adhesive,
        has_lock,
        has_quantity_discounts,
        orientation,
        min_order_quantity,
        display_order,
        seo_title_template,
        seo_description_template,
        updated_at,
        category:categories!product_templates_category_id_fkey (
          id,
          name
        ),
        material:materials!product_templates_material_id_fkey (
          id,
          name
        ),
        variants:product_variants (
          id,
          is_active,
          main_image_url,
          display_order
        )
      `,
    )
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw error
  }

  const { data: applicationLinks, error: applicationsError } = await supabase
    .from("product_applications")
    .select("application_id")
    .eq("product_template_id", id)

  if (applicationsError) {
    throw applicationsError
  }

  const template = data as RawTemplateRow & {
    sku_prefix?: string | null
    short_description?: string | null
    full_description?: string | null
    advantages?: string | null
    specifications_text?: string | null
    care_instructions?: string | null
    faq?: Array<{ question: string; answer: string }> | null
    is_customizable?: boolean | null
    is_double_sided?: boolean | null
    is_adhesive?: boolean | null
    has_lock?: boolean | null
    has_quantity_discounts?: boolean | null
    orientation?: string | null
    seo_title_template?: string | null
    seo_description_template?: string | null
    category_id?: number | null
    material_id?: number | null
  }

  return {
    ...mapTemplateRow(template),
    categoryId: template.category_id ?? null,
    materialId: template.material_id ?? null,
    skuPrefix: template.sku_prefix ?? null,
    shortDescription: template.short_description ?? null,
    fullDescription: template.full_description ?? null,
    advantages: template.advantages ?? null,
    specificationsText: template.specifications_text ?? null,
    careInstructions: template.care_instructions ?? null,
    faq: template.faq ?? undefined,
    isCustomizable: Boolean(template.is_customizable),
    isDoubleSided: Boolean(template.is_double_sided),
    isAdhesive: Boolean(template.is_adhesive),
    hasLock: Boolean(template.has_lock),
    hasQuantityDiscounts: Boolean(template.has_quantity_discounts),
    orientation: template.orientation ?? null,
    seoTitleTemplate: template.seo_title_template ?? null,
    seoDescriptionTemplate: template.seo_description_template ?? null,
    applications: (applicationLinks ?? []).map((item) => item.application_id),
  }
}

export async function fetchVariantsByTemplate(templateId: number, client?: SupabaseClient): Promise<VariantSummary[]> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `
        id,
        product_template_id,
        size_format_id,
        sku,
        url_slug,
        orientation,
        base_price_excluding_vat,
        base_price_including_vat,
        cost_price,
        stock_quantity,
        stock_status,
        main_image_url,
        weight_grams,
        display_order,
        is_active,
        size_format:size_formats!product_variants_size_format_id_fkey (
          id,
          name,
          code,
          width_mm,
          height_mm
        ),
        price_tiers (
          id
        ),
        images:product_images (
          id
        )
      `,
    )
    .eq("product_template_id", templateId)
    .order("display_order", { ascending: true })

  if (error) {
    throw error
  }

  return (
    data?.map((variant) => ({
      id: variant.id,
      productTemplateId: variant.product_template_id,
      sizeFormatId: variant.size_format_id,
      sku: variant.sku,
      urlSlug: variant.url_slug,
      orientation: variant.orientation,
      basePriceExcludingVat: Number(variant.base_price_excluding_vat),
      basePriceIncludingVat: Number(variant.base_price_including_vat),
      costPrice: variant.cost_price ? Number(variant.cost_price) : null,
      stockQuantity: variant.stock_quantity ?? null,
      stockStatus: variant.stock_status ?? null,
      mainImageUrl: variant.main_image_url ?? null,
      weightGrams: variant.weight_grams ?? null,
      isActive: Boolean(variant.is_active),
      sizeFormat: variant.size_format
        ? {
            id: variant.size_format.id,
            name: variant.size_format.name,
            code: variant.size_format.code ?? null,
            width_mm: variant.size_format.width_mm,
            height_mm: variant.size_format.height_mm,
          }
        : null,
      priceTierCount: variant.price_tiers?.length ?? 0,
      imageCount: variant.images?.length ?? 0,
    })) ?? []
  )
}

export async function fetchVariantDetail(id: number, client?: SupabaseClient): Promise<ProductVariantDetail | null> {
  const supabase = await resolveClient(client)
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `
        id,
        product_template_id,
        size_format_id,
        sku,
        barcode,
        url_slug,
        orientation,
        base_price_excluding_vat,
        base_price_including_vat,
        cost_price,
        stock_quantity,
        stock_status,
        low_stock_threshold,
        restock_date,
        specific_description,
        ideal_for,
        capacity_description,
        main_image_url,
        weight_grams,
        custom_width_mm,
        custom_height_mm,
        custom_depth_mm,
        is_active,
        size_format:size_formats!product_variants_size_format_id_fkey (
          id,
          name,
          code,
          width_mm,
          height_mm
        ),
        price_tiers (
          id
        ),
        images:product_images (
          id
        )
      `,
    )
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw error
  }

  const summary = {
    id: data.id,
    productTemplateId: data.product_template_id,
    sizeFormatId: data.size_format_id,
    sku: data.sku,
    urlSlug: data.url_slug,
    orientation: data.orientation,
    basePriceExcludingVat: Number(data.base_price_excluding_vat),
    basePriceIncludingVat: Number(data.base_price_including_vat),
    costPrice: data.cost_price ? Number(data.cost_price) : null,
    stockQuantity: data.stock_quantity ?? null,
    stockStatus: data.stock_status ?? null,
    mainImageUrl: data.main_image_url ?? null,
    weightGrams: data.weight_grams ?? null,
    isActive: Boolean(data.is_active),
    sizeFormat: data.size_format
      ? {
          id: data.size_format.id,
          name: data.size_format.name,
          code: data.size_format.code ?? null,
          width_mm: data.size_format.width_mm,
          height_mm: data.size_format.height_mm,
        }
      : null,
    priceTierCount: data.price_tiers?.length ?? 0,
    imageCount: data.images?.length ?? 0,
  } as VariantSummary

  return {
    ...summary,
    barcode: data.barcode ?? null,
    specificDescription: data.specific_description ?? null,
    idealFor: data.ideal_for ?? null,
    capacityDescription: data.capacity_description ?? null,
    lowStockThreshold: data.low_stock_threshold ?? null,
    restockDate: data.restock_date ?? null,
    customWidthMm: data.custom_width_mm ?? null,
    customHeightMm: data.custom_height_mm ?? null,
    customDepthMm: data.custom_depth_mm ?? null,
  }
}
