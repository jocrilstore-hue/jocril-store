import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export async function FeaturedProducts() {
    const supabase = await createClient()

    const { data: featuredProducts } = await supabase
        .from("product_variants")
        .select(`
      id,
      sku,
      base_price_including_vat,
      main_image_url,
      url_slug,
      is_bestseller,
      product_templates!inner (
        name,
        short_description
      ),
      size_formats!inner (
        name
      )
    `)
        .eq("is_active", true)
        .eq("is_bestseller", true)
        .order("created_at", { ascending: false })
        .limit(6)

    const products = featuredProducts ?? []

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Os nossos produtos mais populares, escolhidos por milhares de clientes
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                        const templateInfo = Array.isArray(product.product_templates)
                            ? product.product_templates[0]
                            : product.product_templates
                        const sizeFormat = Array.isArray(product.size_formats) ? product.size_formats[0] : product.size_formats

                        return (
                            <Link key={product.id} href={`/produtos/${product.url_slug}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden pt-0">
                                    <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                                        {product.main_image_url ? (
                                            <Image
                                                src={product.main_image_url || "/placeholder.svg"}
                                                alt={templateInfo?.name || "Produto"}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-muted-foreground">Sem imagem</span>
                                            </div>
                                        )}
                                        {product.is_bestseller && <Badge className="absolute top-2 right-2 bg-primary">Mais Vendido</Badge>}
                                    </div>
                                    <CardContent className="pt-4">
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
                                        <Button>Ver Detalhes</Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
