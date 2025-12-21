import { ShippingManagement } from "@/components/admin/shipping/shipping-management"

export const metadata = {
  title: "Gestão de Envio | Admin Jocril",
  description: "Configurar zonas, classes e taxas de envio",
}

export const dynamic = "force-dynamic"

export default function ShippingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestão de Envio
        </h1>
        <p className="text-muted-foreground">
          Configurar zonas de envio, classes de peso e taxas
        </p>
      </div>

      <ShippingManagement />
    </div>
  )
}
