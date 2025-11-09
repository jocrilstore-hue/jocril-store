"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (orderId) {
      clearCart()
    }
  }, [orderId, clearCart])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="w-24 h-24 mx-auto mb-6 text-green-600" />
          <h1 className="text-4xl font-bold mb-4">Encomenda Confirmada!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Obrigado pela sua confiança. A sua encomenda foi recebida com sucesso.
          </p>

          {orderId && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Detalhes da Encomenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número da Encomenda</p>
                  <p className="text-2xl font-bold text-primary">{orderId}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">O que acontece agora?</p>
                  <div className="text-left space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-primary">1.</span>
                      <span>Receberá um email de confirmação nos próximos minutos</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">2.</span>
                      <span>A nossa equipa irá processar a sua encomenda</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      <span>Entraremos em contacto para confirmar os detalhes de pagamento e envio</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">4.</span>
                      <span>A sua encomenda será enviada em 1-3 dias úteis</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/produtos">Continuar a Comprar</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Voltar à Página Inicial</Link>
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Precisa de ajuda?</p>
            <p className="text-sm">
              Entre em contacto connosco:{" "}
              <a href="tel:+351214718903" className="text-primary hover:underline">
                (+351) 21 471 89 03
              </a>{" "}
              ou{" "}
              <a href="mailto:geral@jocril.pt" className="text-primary hover:underline">
                geral@jocril.pt
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
