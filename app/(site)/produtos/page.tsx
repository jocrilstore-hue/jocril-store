import { createClient } from "@/lib/supabase/server"
import { ProductsClient } from "@/components/products-client"
import { Suspense } from "react"

export const revalidate = 300 // 5 minutes

interface SearchParams {
  search?: string
  minPrice?: string
  maxPrice?: string
  categories?: string
  sort?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase
    .from("product_variants")
    .select(`
      id,
      sku,
      base_price_including_vat,
      main_image_url,
      url_slug,
      is_bestseller,
      stock_status,
      product_templates!inner (
        name,
        short_description,
        category_id
      ),
      size_formats!inner (
        name
      )
    `)
    .eq("is_active", true)

  // Apply server-side filters
  if (params.search) {
    query = query.or(
      `product_templates.name.ilike.%${params.search}%,product_templates.short_description.ilike.%${params.search}%,sku.ilike.%${params.search}%`
    )
  }

  if (params.minPrice) {
    query = query.gte("base_price_including_vat", parseFloat(params.minPrice))
  }

  if (params.maxPrice) {
    query = query.lte("base_price_including_vat", parseFloat(params.maxPrice))
  }

  if (params.categories) {
    const categoryIds = params.categories.split(",")
    query = query.in("product_templates.category_id", categoryIds)
  }

  // Apply server-side sorting
  switch (params.sort) {
    case "price-asc":
      query = query.order("base_price_including_vat", { ascending: true })
      break
    case "price-desc":
      query = query.order("base_price_including_vat", { ascending: false })
      break
    case "name":
      query = query.order("product_templates(name)", { ascending: true })
      break
    default:
      query = query.order("is_bestseller", { ascending: false })
  }

  // Fetch products and categories in parallel
  const [productsResult, categoriesResult, minPriceResult, maxPriceResult] = await Promise.all([
    query.limit(100), // Add pagination later
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true),
    supabase
      .from("product_variants")
      .select("base_price_including_vat")
      .eq("is_active", true)
      .order("base_price_including_vat", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("product_variants")
      .select("base_price_including_vat")
      .eq("is_active", true)
      .order("base_price_including_vat", { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  const rawProducts = productsResult.data ?? []
  const categories = categoriesResult.data ?? []

  const normalizedProducts = rawProducts.map((product) => {
    const templateInfo = Array.isArray(product.product_templates)
      ? product.product_templates[0]
      : product.product_templates
    const sizeFormat = Array.isArray(product.size_formats) ? product.size_formats[0] : product.size_formats

    return {
      ...product,
      product_templates: {
        name: templateInfo?.name ?? "Produto",
        short_description: templateInfo?.short_description ?? "",
        category_id: templateInfo?.category_id ?? "",
      },
      size_formats: {
        name: sizeFormat?.name ?? "",
      },
    }
  })

  const productPrices = normalizedProducts.map((p) => p.base_price_including_vat)
  const derivedMinPrice = productPrices.length > 0 ? Math.min(...productPrices) : undefined
  const derivedMaxPrice = productPrices.length > 0 ? Math.max(...productPrices) : undefined

  const minPrice =
    minPriceResult.data?.base_price_including_vat ??
    derivedMinPrice ??
    0

  const maxPriceCandidate =
    maxPriceResult.data?.base_price_including_vat ??
    derivedMaxPrice ??
    minPrice

  const maxPrice = maxPriceCandidate >= minPrice ? maxPriceCandidate : minPrice

  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductsClient
        initialProducts={normalizedProducts}
        categories={categories}
        minPrice={minPrice}
        maxPrice={maxPrice}
        initialParams={params}
      />
    </Suspense>
  )
}

function ProductsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">A carregar produtos...</p>
    </div>
  )
}
