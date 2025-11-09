import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

const categoryImageMap: Record<string, string> = {
  "acrilicos-chao": "/categories/acrilicos-chao.avif",
  "acrilicos-mesa": "/categories/acrilicos-mesa.avif",
  "acrilicos-parede": "/categories/acrilicos-parede.avif",
  "caixas-acrilico": "/categories/caixas-acrilico.avif",
  "molduras-acrilico": "/categories/molduras-acrilico.avif",
  "tombolas-acrilico": "/categories/tombolas-acrilico.avif",
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground">Explore os nossos produtos organizados por categoria</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories?.map((category) => {
            const imageUrl = categoryImageMap[category.slug] || category.image_url || "/placeholder.svg?height=400&width=400&query=acrylic display products"
            return (
              <Link key={category.id} href={`/categorias/${category.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden pt-0">
                  <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description || "Ver todos os produtos desta categoria"}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
