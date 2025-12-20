"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, Smartphone, Loader2, CheckCheck } from "lucide-react"

function formatReference(reference: string): string {
  return reference.replace(/(\d{3})(?=\d)/g, "$1 ")
}

function formatAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return num.toFixed(2).replace(".", ",")
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "error">("pending")
  const [pollCount, setPollCount] = useState(0)

  const orderId = searchParams.get("orderId")
  const paymentMethod = searchParams.get("method")
  const paymentError = searchParams.get("paymentError")

  // Multibanco params
  const entity = searchParams.get("entity")
  const reference = searchParams.get("reference")
  const amount = searchParams.get("amount")
  const deadline = searchParams.get("deadline")

  // MB Way params
  const phone = searchParams.get("phone")

  useEffect(() => {
    if (orderId) {
      clearCart()
    }
  }, [orderId, clearCart])

  // Poll for MB Way payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!orderId || paymentMethod !== "mbway") return

    try {
      const response = await fetch(`/api/orders/${orderId}/status`)
      const result = await response.json()

      if (result.success && result.data.paymentStatus === "paid") {
        setPaymentStatus("paid")
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }, [orderId, paymentMethod])

  useEffect(() => {
    if (paymentMethod !== "mbway" || paymentStatus === "paid") return

    // Poll every 3 seconds for 2 minutes (40 attempts)
    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= 40) {
          clearInterval(interval)
          return prev
        }
        checkPaymentStatus()
        return prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentMethod, paymentStatus, checkPaymentStatus])

  const copyReference = async () => {
    if (reference) {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Payment error fallback
  if (paymentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle className="w-24 h-24 mx-auto mb-6 text-green-600" />
            <h1 className="text-4xl font-bold mb-4">Encomenda Recebida</h1>
            <p className="text-xl text-muted-foreground mb-8">
              A sua encomenda foi registada, mas houve um problema ao gerar os dados de pagamento.
            </p>

            {orderId && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Número da Encomenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{orderId}</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Entraremos em contacto consigo em breve com os dados de pagamento.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/produtos">Continuar a Comprar</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número da Encomenda</p>
                  <p className="text-2xl font-bold text-primary">{orderId}</p>
                </div>

                {/* Multibanco Payment Details */}
                {paymentMethod === "multibanco" && entity && reference && amount && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-4">
                      Pague a sua encomenda através de Multibanco:
                    </p>
                    <div className="bg-muted rounded-lg p-6 text-left space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Entidade:</span>
                        <span className="font-mono font-bold text-lg">{entity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Referência:</span>
                        <span className="font-mono font-bold text-lg">{formatReference(reference)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-bold text-lg text-primary">{formatAmount(amount)}€</span>
                      </div>
                      {deadline && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Prazo:</span>
                          <span className="text-sm">{formatDeadline(deadline)}</span>
                        </div>
                      )}
                      <div className="pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={copyReference}
                        >
                          {copied ? (
                            <>
                              <CheckCheck className="w-4 h-4 mr-2" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Referência
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Após o pagamento, receberá confirmação por email.
                    </p>
                  </div>
                )}

                {/* MB Way Payment Details */}
                {paymentMethod === "mbway" && phone && (
                  <div className="pt-4 border-t">
                    {paymentStatus === "paid" ? (
                      <div className="text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <p className="text-xl font-bold text-green-600 mb-2">Pagamento Confirmado!</p>
                        <p className="text-muted-foreground">
                          O seu pagamento foi recebido com sucesso.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          Confirme o pagamento no seu telemóvel:
                        </p>
                        <div className="bg-muted rounded-lg p-6 text-center space-y-4">
                          <Smartphone className="w-12 h-12 mx-auto text-primary" />
                          <p className="text-sm">
                            Enviámos um pedido de pagamento para
                          </p>
                          <p className="font-mono font-bold text-xl">{phone}</p>
                          <div className="flex justify-center items-center">
                            <span className="text-muted-foreground mr-2">Valor:</span>
                            <span className="font-bold text-lg text-primary">
                              {formatAmount(amount || "0")}€
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Aguardando confirmação...</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Não recebeu? O pedido expira em 4 minutos.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Generic next steps (no payment method) */}
                {!paymentMethod && (
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
                        <span>Entraremos em contacto para confirmar os detalhes</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">4.</span>
                        <span>A sua encomenda será enviada em 1-3 dias úteis</span>
                      </div>
                    </div>
                  </div>
                )}
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-64 mx-auto mb-4 bg-muted animate-pulse rounded" />
          <div className="h-6 w-96 mx-auto mb-8 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
