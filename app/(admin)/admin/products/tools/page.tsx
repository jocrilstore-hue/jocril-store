import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductToolsDashboard } from "@/components/admin/products/product-tools-dashboard"

export default function ProductToolsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ferramentas de gestão"
        description="Executa ajustes em massa, auditorias e exportações sem sair do backoffice."
      />
      <ProductToolsDashboard />
    </div>
  )
}
