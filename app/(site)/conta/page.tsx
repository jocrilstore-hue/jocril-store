import { createClient } from "@/lib/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Package, MapPin, Mail } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AccountPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const userEmail = user.emailAddresses[0]?.emailAddress
  const supabase = await createClient()

  // Get customer data
  const { data: customer } = await supabase.from("customers").select("*").eq("email", userEmail).single()

  // Get recent orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, created_at, status, total_amount_with_vat")
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
          <p className="text-muted-foreground">Gerir a sua conta e encomendas</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Os seus dados de conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {userEmail}
                </p>
              </div>
              {customer && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p>
                      {customer.first_name} {customer.last_name}
                    </p>
                  </div>
                  {customer.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p>{customer.phone}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Encomendas Recentes
              </CardTitle>
              <CardDescription>Últimas 5 encomendas</CardDescription>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">#{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.total_amount_with_vat.toFixed(2)}€</p>
                        <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/encomendas">Ver Todas as Encomendas</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Ainda não fez nenhuma encomenda</p>
                  <Button asChild>
                    <Link href="/produtos">Começar a Comprar</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {customer?.shipping_addresses && customer.shipping_addresses.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Moradas de Envio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {customer.shipping_addresses.map((address: any) => (
                  <div key={address.id} className="p-4 border rounded-lg">
                    <p className="font-medium">{address.address_line_1}</p>
                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                    <p>
                      {address.postal_code} {address.city}
                    </p>
                    <p>{address.country}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
