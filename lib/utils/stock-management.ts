/**
 * Stock Management Utilities
 * Helpers for managing product stock levels and status
 */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued"

export interface StockInfo {
  quantity: number
  status: StockStatus
  isAvailable: boolean
  warningMessage?: string
  canOrder: boolean
}

export interface StockThresholds {
  lowStock: number
  criticalStock: number
  outOfStock: number
}

const DEFAULT_THRESHOLDS: StockThresholds = {
  lowStock: 10,
  criticalStock: 5,
  outOfStock: 0,
}

/**
 * Calculate stock status based on quantity and thresholds
 */
export function calculateStockStatus(
  quantity: number,
  thresholds: Partial<StockThresholds> = {},
): StockStatus {
  const { lowStock, outOfStock } = { ...DEFAULT_THRESHOLDS, ...thresholds }

  if (quantity <= outOfStock) {
    return "out_of_stock"
  }

  if (quantity <= lowStock) {
    return "low_stock"
  }

  return "in_stock"
}

/**
 * Get detailed stock information
 */
export function getStockInfo(
  quantity: number,
  status?: StockStatus,
  thresholds: Partial<StockThresholds> = {},
): StockInfo {
  const calculatedStatus = status || calculateStockStatus(quantity, thresholds)
  const { criticalStock } = { ...DEFAULT_THRESHOLDS, ...thresholds }

  let warningMessage: string | undefined
  let canOrder = true
  let isAvailable = true

  switch (calculatedStatus) {
    case "out_of_stock":
      warningMessage = "Produto esgotado"
      canOrder = false
      isAvailable = false
      break

    case "low_stock":
      if (quantity <= criticalStock) {
        warningMessage = `Apenas ${quantity} ${quantity === 1 ? "unidade" : "unidades"} ${quantity === 1 ? "restante" : "restantes"}!`
      } else {
        warningMessage = `Stock limitado (${quantity} ${quantity === 1 ? "unidade" : "unidades"})`
      }
      canOrder = true
      isAvailable = true
      break

    case "discontinued":
      warningMessage = "Produto descontinuado"
      canOrder = false
      isAvailable = false
      break

    default:
      // in_stock
      canOrder = true
      isAvailable = true
  }

  return {
    quantity,
    status: calculatedStatus,
    isAvailable,
    warningMessage,
    canOrder,
  }
}

/**
 * Check if quantity can be fulfilled
 */
export function canFulfillQuantity(requestedQty: number, availableQty: number, status: StockStatus): boolean {
  if (status === "out_of_stock" || status === "discontinued") {
    return false
  }

  return requestedQty <= availableQty
}

/**
 * Get maximum orderable quantity
 */
export function getMaxOrderableQuantity(availableQty: number, status: StockStatus, maxPerOrder: number = 999): number {
  if (status === "out_of_stock" || status === "discontinued") {
    return 0
  }

  return Math.min(availableQty, maxPerOrder)
}

/**
 * Format stock status for display
 */
export function formatStockStatus(status: StockStatus): string {
  const statusMap: Record<StockStatus, string> = {
    in_stock: "Em stock",
    low_stock: "Stock limitado",
    out_of_stock: "Esgotado",
    discontinued: "Descontinuado",
  }

  return statusMap[status] || "Desconhecido"
}

/**
 * Get stock status color variant for badges
 */
export function getStockStatusVariant(
  status: StockStatus,
): "default" | "secondary" | "destructive" | "outline" {
  const variantMap: Record<StockStatus, "default" | "secondary" | "destructive" | "outline"> = {
    in_stock: "default",
    low_stock: "secondary",
    out_of_stock: "destructive",
    discontinued: "outline",
  }

  return variantMap[status] || "outline"
}

/**
 * Calculate estimated restock date
 * (Placeholder - would integrate with supplier/inventory system)
 */
export function estimateRestockDate(productId: number, leadTimeDays: number = 7): Date {
  const today = new Date()
  const restockDate = new Date(today)
  restockDate.setDate(today.getDate() + leadTimeDays)
  return restockDate
}

/**
 * Check if product needs reordering based on thresholds
 */
export function needsReorder(quantity: number, reorderPoint: number = 10): boolean {
  return quantity <= reorderPoint
}

/**
 * Calculate suggested reorder quantity
 * (Simple formula - can be enhanced with sales velocity, seasonality, etc.)
 */
export function calculateReorderQuantity(
  currentQty: number,
  reorderPoint: number = 10,
  targetStock: number = 50,
): number {
  if (currentQty >= reorderPoint) {
    return 0
  }

  return Math.max(0, targetStock - currentQty)
}

/**
 * Get low stock products (for admin dashboard alerts)
 */
export interface LowStockAlert {
  variantId: number
  productName: string
  sku: string
  quantity: number
  status: StockStatus
  reorderSuggestion: number
}

/**
 * Format quantity with units
 */
export function formatQuantity(quantity: number, unit: string = "unidade"): string {
  if (quantity === 1) {
    return `${quantity} ${unit}`
  }
  return `${quantity} ${unit}${unit.endsWith("s") ? "" : "s"}`
}

/**
 * Get stock trend indicator
 */
export type StockTrend = "increasing" | "stable" | "decreasing" | "critical"

export function getStockTrend(currentQty: number, previousQty: number, thresholds = DEFAULT_THRESHOLDS): StockTrend {
  const diff = currentQty - previousQty
  const percentChange = previousQty > 0 ? (diff / previousQty) * 100 : 0

  if (currentQty <= thresholds.criticalStock) {
    return "critical"
  }

  if (Math.abs(percentChange) < 5) {
    return "stable"
  }

  return percentChange > 0 ? "increasing" : "decreasing"
}

/**
 * Validate stock adjustment
 */
export interface StockAdjustment {
  variantId: number
  adjustment: number // positive for additions, negative for reductions
  reason: string
  reference?: string
}

export function validateStockAdjustment(
  currentQty: number,
  adjustment: number,
): { valid: boolean; newQty: number; error?: string } {
  const newQty = currentQty + adjustment

  if (newQty < 0) {
    return {
      valid: false,
      newQty: currentQty,
      error: "O ajuste resultaria em quantidade negativa",
    }
  }

  if (newQty > 999999) {
    return {
      valid: false,
      newQty: currentQty,
      error: "A quantidade resultante excede o limite máximo",
    }
  }

  return {
    valid: true,
    newQty,
  }
}

/**
 * Calculate stock value (for inventory reports)
 */
export function calculateStockValue(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

/**
 * Get stock alert message for admin
 */
export function getStockAlertMessage(stockInfo: StockInfo): string | null {
  if (stockInfo.status === "out_of_stock") {
    return `🔴 ESGOTADO: ${stockInfo.warningMessage}`
  }

  if (stockInfo.status === "low_stock") {
    return `🟡 STOCK BAIXO: ${stockInfo.warningMessage}`
  }

  return null
}
