import { notFound } from "next/navigation"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductVariantForm } from "@/components/admin/products/product-variant-form"
import { fetchProductTemplateDetail, fetchSizeFormats } from "@/lib/supabase/queries/admin-products"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface NewVariantPageProps {
  params: { id: string } | Promise<{ id: string }>
}

export default async function NewVariantPage({ params }: NewVariantPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const templateId = Number(resolvedParams?.id)
  if (Number.isNaN(templateId)) {
    notFound()
  }

  const [template, sizeFormats] = await Promise.all([fetchProductTemplateDetail(templateId), fetchSizeFormats()])

  if (!template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Nova variação · ${template.name}`}
        description="Crie um tamanho/configuração específico com preços e stock próprios."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/admin/products/${templateId}/variants`}>
              <ArrowLeft className="h-4 w-4" />
              Voltar às variações
            </Link>
          </Button>
        }
      />
      <ProductVariantForm mode="create" templateId={templateId} sizeFormats={sizeFormats} />
    </div>
  )
}
