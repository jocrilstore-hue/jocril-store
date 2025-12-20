import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single()

  if (!category) {
    notFound()
  }

  const { data: products } = await supabase
    .from("product_variants")
    .select(`
      id,
      sku,
      base_price_including_vat,
      main_image_url,
      url_slug,
      is_bestseller,
      stock_status,
      product_templates (
        name,
        short_description,
        category_id
      ),
      size_formats (
        name
      )
    `)
    .eq("is_active", true)
    .eq("product_templates.category_id", category.id)
    .order("is_bestseller", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground">
              Início
            </Link>
            {" / "}
            <Link href="/categorias" className="hover:text-foreground">
              Categorias
            </Link>
            {" / "}
            <span className="text-foreground font-semibold">{category.name}</span>
          </div>
          <p className="text-muted-foreground">{products?.length || 0} produtos disponíveis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product) => {
            const templateInfo = Array.isArray(product.product_templates)
              ? product.product_templates[0]
              : product.product_templates
            const sizeFormat = Array.isArray(product.size_formats) ? product.size_formats[0] : product.size_formats

            return (
              <Link key={product.id} href={`/produtos/${product.url_slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col overflow-hidden pt-0">
                  <CardHeader className="p-0">
                    <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                      {product.main_image_url ? (
                        <Image
                          src={product.main_image_url || "/placeholder.svg"}
                          alt={templateInfo?.name || "Produto"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground">Sem imagem</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-2">
                        {product.is_bestseller && <Badge className="bg-primary">Mais Vendido</Badge>}
                        {product.stock_status === "out_of_stock" && <Badge variant="destructive">Esgotado</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {templateInfo?.name} {sizeFormat?.name ? `- ${sizeFormat.name}` : ""}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">{templateInfo?.short_description}</CardDescription>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{product.base_price_including_vat.toFixed(2)}€</p>
                      <p className="text-xs text-muted-foreground">IVA incluído</p>
                    </div>
                    <Button size="sm">Ver</Button>
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto disponível nesta categoria no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
