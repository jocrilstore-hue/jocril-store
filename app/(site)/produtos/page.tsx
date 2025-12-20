import { createClient } from "@/lib/supabase/server";
import { ProductsClient } from "@/components/products-client";
import { Suspense } from "react";

export const revalidate = 300; // 5 minutes

interface SearchParams {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  categories?: string;
  sort?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Parse category IDs if provided
  const categoryIds = params.categories
    ? params.categories.split(",").filter(Boolean)
    : null;

  // Use RPC function for search with proper filtering
  const { data: rawProducts, error } = await supabase.rpc("search_products", {
    search_term: params.search || null,
    min_price: params.minPrice ? parseFloat(params.minPrice) : null,
    max_price: params.maxPrice ? parseFloat(params.maxPrice) : null,
    category_ids: categoryIds,
    sort_by: params.sort || "relevance",
    result_limit: 100,
  });

  if (error) {
    console.error("Search error:", error);
  }

  // Fetch categories and price bounds in parallel
  const [categoriesResult, minPriceResult, maxPriceResult] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("is_active", true),
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
      .maybeSingle(),
  ]);

  const categories = categoriesResult.data ?? [];

  // Normalize products to match expected format
  const normalizedProducts = (rawProducts ?? []).map(
    (product: {
      id: number;
      sku: string;
      base_price_including_vat: number;
      main_image_url: string | null;
      url_slug: string;
      is_bestseller: boolean;
      stock_status: string;
      template_name: string;
      template_short_description: string | null;
      template_category_id: number;
      size_format_name: string;
    }) => ({
      id: product.id,
      sku: product.sku,
      base_price_including_vat: product.base_price_including_vat,
      main_image_url: product.main_image_url,
      url_slug: product.url_slug,
      is_bestseller: product.is_bestseller,
      stock_status: product.stock_status,
      product_templates: {
        name: product.template_name ?? "Produto",
        short_description: product.template_short_description ?? "",
        category_id: product.template_category_id ?? "",
      },
      size_formats: {
        name: product.size_format_name ?? "",
      },
    }),
  );

  const productPrices = normalizedProducts.map(
    (p: { base_price_including_vat: number }) => p.base_price_including_vat,
  );
  const derivedMinPrice =
    productPrices.length > 0 ? Math.min(...productPrices) : undefined;
  const derivedMaxPrice =
    productPrices.length > 0 ? Math.max(...productPrices) : undefined;

  const minPrice =
    minPriceResult.data?.base_price_including_vat ?? derivedMinPrice ?? 0;

  const maxPriceCandidate =
    maxPriceResult.data?.base_price_including_vat ??
    derivedMaxPrice ??
    minPrice;

  const maxPrice = maxPriceCandidate >= minPrice ? maxPriceCandidate : minPrice;

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
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">A carregar produtos...</p>
    </div>
  );
}
