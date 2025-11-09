import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Truck, Gem, BadgePercent, Factory } from "lucide-react"

// Enable ISR with 5 minute revalidation
export const revalidate = 300 // 5 minutes

const homepageCategories = [
  {
    name: "Acrílicos Chão",
    slug: "acrilicos-chao",
    image: "/categories/acrilicos-chao.avif",
    description: "Expositores robustos para chão e áreas de grande circulação",
  },
  {
    name: "Acrílicos Mesa",
    slug: "acrilicos-mesa",
    image: "/categories/acrilicos-mesa.avif",
    description: "Suportes compactos ideais para balcões e receções",
  },
  {
    name: "Acrílicos Parede",
    slug: "acrilicos-parede",
    image: "/categories/acrilicos-parede.avif",
    description: "Placas e expositores para comunicação vertical",
  },
  {
    name: "Caixas Acrílico",
    slug: "caixas-acrilico",
    image: "/categories/caixas-acrilico.avif",
    description: "Caixas transparentes para exposição, recolha e sorteios",
  },
  {
    name: "Molduras Acrílico (fotos)",
    slug: "molduras-acrilico",
    image: "/categories/molduras-acrilico.avif",
    description: "Molduras elegantes para fotografias e certificados",
  },
  {
    name: "Tómbolas Acrílico",
    slug: "tombolas-acrilico",
    image: "/categories/tombolas-acrilico.avif",
    description: "Tómbolas em acrílico para eventos e ativações",
  },
] as const

export default async function HomePage() {
  const supabase = await createClient()

  // Parallel queries with minimal fields for better performance
  const [featuredProductsResult, categoriesResult] = await Promise.all([
    supabase
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
      .limit(6),

    supabase
      .from("categories")
      .select("id, name, slug, description")
      .is("parent_id", null)
      .eq("is_active", true)
  ])

  const featuredProducts = featuredProductsResult.data ?? []
  const categories = categoriesResult.data ?? []

  const displayCategories = homepageCategories.map((category) => {
    const match = categories.find((item) => item.slug === category.slug || item.name === category.name)

    return {
      id: match?.id ?? category.slug,
      name: category.name,
      slug: category.slug,
      image: category.image,
      description: match?.description ?? category.description,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative h-[420px] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/back2-mi-Zw9Xq3zLgDEy3c0ygqLqFiq98am1fn.avif')`,
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Expositores em Acrílico</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Soluções profissionais para apresentar os seus produtos com elegância e qualidade
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/produtos">Ver Produtos</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
            >
              <Link href="/categorias">Explorar Categorias</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Categorias</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCategories.map((category) => (
              <Link key={category.id} href={`/categorias/${category.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden pt-0">
                  <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                    <Image src={category.image} alt={category.name} fill className="object-cover" />
                  </div>
                  <CardContent className="pt-6">
                    <CardTitle className="mb-2">{category.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os nossos produtos mais populares, escolhidos por milhares de clientes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/produtos/${product.url_slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden pt-0">
                  <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                    {product.main_image_url ? (
                      <Image
                        src={product.main_image_url || "/placeholder.svg"}
                        alt={product.product_templates?.name || "Produto"}
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
                      {product.product_templates?.name} - {product.size_formats?.name}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {product.product_templates?.short_description}
                    </CardDescription>
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
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <Truck className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="font-bold mb-2">Envio Grátis</h3>
              <p className="text-sm text-muted-foreground">Em encomendas superiores a 150€</p>
            </div>
            <div>
              <Gem className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="font-bold mb-2">Qualidade Premium</h3>
              <p className="text-sm text-muted-foreground">Acrílico cristal de alta qualidade</p>
            </div>
            <div>
              <BadgePercent className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="font-bold mb-2">Descontos por Quantidade</h3>
              <p className="text-sm text-muted-foreground">Até 20% em grandes encomendas</p>
            </div>
            <div>
              <Factory className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="font-bold mb-2">Empresa Portuguesa</h3>
              <p className="text-sm text-muted-foreground">Apoio em português sempre disponível</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
