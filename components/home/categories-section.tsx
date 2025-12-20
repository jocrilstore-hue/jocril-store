import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

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

export async function CategoriesSection() {
    const supabase = await createClient()

    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, slug, description")
        .is("parent_id", null)
        .eq("is_active", true)

    const dbCategories = categories ?? []

    const displayCategories = homepageCategories.map((category) => {
        const match = dbCategories.find((item) => item.slug === category.slug || item.name === category.name)

        return {
            id: match?.id ?? category.slug,
            name: category.name,
            slug: category.slug,
            image: category.image,
            description: match?.description ?? category.description,
        }
    })

    return (
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
    )
}
