import { notFound } from "next/navigation"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductVariantForm } from "@/components/admin/products/product-variant-form"
import {
  fetchProductTemplateDetail,
  fetchVariantDetail,
  fetchSizeFormats,
} from "@/lib/supabase/queries/admin-products"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface EditVariantPageProps {
  params: { id: string; variantId: string } | Promise<{ id: string; variantId: string }>
}

export default async function EditVariantPage({ params }: EditVariantPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const templateId = Number(resolvedParams?.id)
  const variantId = Number(resolvedParams?.variantId)

  if (Number.isNaN(templateId) || Number.isNaN(variantId)) {
    notFound()
  }

  const [template, variant, sizeFormats] = await Promise.all([
    fetchProductTemplateDetail(templateId),
    fetchVariantDetail(variantId),
    fetchSizeFormats(),
  ])

  if (!template || !variant) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Editar variação · ${variant.sku}`}
        description="Atualize detalhes específicos desta configuração."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/admin/products/${templateId}/variants`}>
              <ArrowLeft className="h-4 w-4" />
              Voltar às variações
            </Link>
          </Button>
        }
      />
      <ProductVariantForm mode="edit" templateId={templateId} variant={variant} sizeFormats={sizeFormats} />
    </div>
  )
}
