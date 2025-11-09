import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductTemplateForm } from "@/components/admin/products/product-template-form"
import { fetchApplications, fetchProductTaxonomies } from "@/lib/supabase/queries/admin-products"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewProductTemplatePage() {
  const [taxonomies, applications] = await Promise.all([fetchProductTaxonomies(), fetchApplications()])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Novo template de produto"
        description="Crie o conteúdo base para gerar variações e páginas de detalhe."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <ProductTemplateForm mode="create" taxonomies={taxonomies} applications={applications} />
    </div>
  )
}
