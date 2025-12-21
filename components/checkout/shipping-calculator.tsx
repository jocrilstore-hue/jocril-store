"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck, Gift, AlertCircle, Package } from "lucide-react"
import type { CartItem } from "@/lib/types"
import type { ShippingCalculationResult } from "@/lib/types/shipping"
import {
  formatShippingCost,
  formatEstimatedDays,
  calculateFreeShippingProgress,
  calculateAmountToFreeShipping,
  isValidPortuguesePostalCode,
} from "@/lib/types/shipping"

interface ShippingCalculatorProps {
  cartItems: CartItem[]
  postalCode: string
  subtotalCents: number
  onShippingChange: (shippingCostCents: number, shippingResult: ShippingCalculationResult | null) => void
}

export function ShippingCalculator({
  cartItems,
  postalCode,
  subtotalCents,
  onShippingChange,
}: ShippingCalculatorProps) {
  const [result, setResult] = useState<ShippingCalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateShipping = useCallback(async () => {
    // Validate postal code before making API call
    if (!postalCode || !isValidPortuguesePostalCode(postalCode)) {
      setResult(null)
      setError(null)
      onShippingChange(0, null)
      return
    }

    if (cartItems.length === 0) {
      setResult(null)
      setError(null)
      onShippingChange(0, null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_items: cartItems.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
          postal_code: postalCode,
        }),
      })

      const data: ShippingCalculationResult = await response.json()

      if (data.success) {
        // Check for free shipping eligibility
        const qualifiesForFreeShipping =
          data.free_shipping_threshold_cents &&
          subtotalCents >= data.free_shipping_threshold_cents

        const finalShippingCost = qualifiesForFreeShipping ? 0 : (data.shipping_cost_cents || 0)

        setResult({
          ...data,
          shipping_cost_cents: finalShippingCost,
        })
        setError(null)
        onShippingChange(finalShippingCost, data)
      } else {
        setError(data.error || "Erro ao calcular envio")
        setResult(null)
        onShippingChange(0, null)
      }
    } catch (err) {
      console.error("Shipping calculation error:", err)
      setError("Erro ao calcular envio. Tente novamente.")
      setResult(null)
      onShippingChange(0, null)
    } finally {
      setLoading(false)
    }
  }, [cartItems, postalCode, subtotalCents, onShippingChange])

  // Debounce the calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateShipping()
    }, 500)

    return () => clearTimeout(timer)
  }, [calculateShipping])

  // Not enough info to show shipping
  if (!postalCode || postalCode.length < 4) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Truck className="h-4 w-4" />
        <span>Introduza o código postal para calcular o envio</span>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  // No result yet
  if (!result) {
    return null
  }

  // Calculate free shipping progress
  const freeShippingProgress = calculateFreeShippingProgress(
    subtotalCents,
    result.free_shipping_threshold_cents || null
  )
  const amountToFreeShipping = calculateAmountToFreeShipping(
    subtotalCents,
    result.free_shipping_threshold_cents || null
  )

  const isFreeShipping = result.shipping_cost_cents === 0

  return (
    <div className="space-y-3">
      {/* Shipping Cost */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Envio</span>
        </div>
        {isFreeShipping ? (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <Gift className="h-3 w-3 mr-1" />
            Grátis
          </Badge>
        ) : (
          <span className="font-semibold">
            {formatShippingCost(result.shipping_cost_cents || 0)}
          </span>
        )}
      </div>

      {/* Shipping Details */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          <span>{result.zone_name}</span>
          <span className="mx-1">|</span>
          <span>{result.carrier_name}</span>
        </div>
        {result.estimated_days_min && result.estimated_days_max && (
          <div>
            Prazo estimado: {formatEstimatedDays(result.estimated_days_min, result.estimated_days_max)}
          </div>
        )}
      </div>

      {/* Free Shipping Progress (only show if threshold exists and not yet reached) */}
      {result.free_shipping_threshold_cents && !isFreeShipping && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Falta {formatShippingCost(amountToFreeShipping)} para envio grátis
                </span>
                <span className="font-medium">{freeShippingProgress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Envio grátis a partir de {formatShippingCost(result.free_shipping_threshold_cents)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
