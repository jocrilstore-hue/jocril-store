import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Truck, Gem, BadgePercent, Factory } from "lucide-react"
import { Suspense } from "react"
import { FeaturedProducts } from "@/components/home/featured-products"
import { CategoriesSection } from "@/components/home/categories-section"
import { Skeleton } from "@/components/ui/skeleton"

// Enable ISR with 5 minute revalidation
export const revalidate = 300 // 5 minutes

function CategoriesSkeleton() {
  return <div className="py-16 bg-muted/30"><div className="container h-64 flex items-center justify-center"><Skeleton className="h-10 w-48" /></div></div>
}

function ProductsSkeleton() {
  return <div className="py-16"><div className="container h-64 flex items-center justify-center"><Skeleton className="h-10 w-48" /></div></div>
}

export default function HomePage() {
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

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

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
