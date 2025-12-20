import { createClient } from "@/lib/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function OrdersPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const userEmail = user.emailAddresses[0]?.emailAddress
  const supabase = await createClient()

  // Get customer data
  const { data: customer } = await supabase.from("customers").select("id").eq("email", userEmail).single()

  // Get all orders with items
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        product_variants (
          sku,
          product_templates (
            name
          ),
          size_formats (
            name
          )
        )
      )
    `)
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-cyan-100 text-cyan-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      processing: "A Processar",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    }
    return labels[status] || status
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/conta">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Minhas Encomendas</h1>
            <p className="text-muted-foreground">Histórico completo de encomendas</p>
          </div>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Encomenda #{order.order_number}</CardTitle>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_variants.product_templates.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Tamanho: {item.product_variants.size_formats.name} | SKU: {item.product_variants.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity}x {item.unit_price_with_vat.toFixed(2)}€
                          </p>
                          <p className="text-sm text-muted-foreground">{item.line_total_with_vat.toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t font-bold">
                      <span>Total</span>
                      <span className="text-lg">{order.total_amount_with_vat.toFixed(2)}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma encomenda encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Ainda não fez nenhuma encomenda. Comece a explorar os nossos produtos!
              </p>
              <Button asChild>
                <Link href="/produtos">Ver Produtos</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
