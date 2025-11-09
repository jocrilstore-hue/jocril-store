import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import ProductDetail from "@/components/product-detail"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: currentVariant } = await supabase
    .from("product_variants")
    .select(`
      *,
      product_templates (
        *,
        categories (*)
      ),
      size_formats (*)
    `)
    .eq("url_slug", slug)
    .eq("is_active", true)
    .single()

  if (!currentVariant) {
    notFound()
  }

  const { data: allVariants } = await supabase
    .from("product_variants")
    .select(`
      *,
      size_formats (*)
    `)
    .eq("product_template_id", currentVariant.product_template_id)
    .eq("is_active", true)
    .order("display_order", { ascending: true, foreignTable: "size_formats" })

  const variantIds = allVariants?.map((v) => v.id) || []
  const { data: allPriceTiers } = await supabase
    .from("price_tiers")
    .select("*")
    .in("product_variant_id", variantIds)
    .order("min_quantity", { ascending: true })

  const priceTiersByVariant: Record<number, any[]> = {}
  allPriceTiers?.forEach((tier) => {
    if (!priceTiersByVariant[tier.product_variant_id]) {
      priceTiersByVariant[tier.product_variant_id] = []
    }
    priceTiersByVariant[tier.product_variant_id].push(tier)
  })

  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_variant_id", currentVariant.id)
    .order("display_order", { ascending: true })

  const template = currentVariant.product_templates
  const size = currentVariant.size_formats
  const categories = template.categories

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Início
          </Link>
          {" / "}
          <Link href="/produtos" className="hover:text-foreground">
            Produtos
          </Link>
          {" / "}
          <span className="text-foreground">{template.name}</span>
        </div>

        <ProductDetail
          currentVariant={currentVariant}
          allVariants={allVariants || []}
          priceTiersByVariant={priceTiersByVariant}
          images={images || []}
        />
      </div>
    </div>
  )
}
