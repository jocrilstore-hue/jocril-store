import { notFound } from "next/navigation"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductVariantsBoard } from "@/components/admin/products/product-variants-board"
import {
  fetchProductTemplateDetail,
  fetchVariantsByTemplate,
  fetchSizeFormats,
} from "@/lib/supabase/queries/admin-products"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface VariantsPageProps {
  params: { id: string } | Promise<{ id: string }>
}

export default async function ProductVariantsPage({ params }: VariantsPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const templateId = Number(resolvedParams?.id)
  if (Number.isNaN(templateId)) {
    notFound()
  }

  const [template, variants, sizeFormats] = await Promise.all([
    fetchProductTemplateDetail(templateId),
    fetchVariantsByTemplate(templateId),
    fetchSizeFormats(),
  ])

  if (!template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Variações: ${template.name}`}
        description="Configure tamanhos, preços e stock específicos por variante."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/admin/products/${templateId}`}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao template
            </Link>
          </Button>
        }
      />
      <ProductVariantsBoard template={template} variants={variants} sizeFormats={sizeFormats} />
    </div>
  )
}
