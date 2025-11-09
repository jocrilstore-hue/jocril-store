"use client"

import { Badge } from "@/components/ui/badge"
import { getStockStatusVariant, formatStockStatus, type StockStatus, getStockInfo } from "@/lib/utils/stock-management"
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StockBadgeProps {
  quantity: number
  status?: StockStatus
  showIcon?: boolean
  showQuantity?: boolean
  showTooltip?: boolean
  lowStockThreshold?: number
  size?: "default" | "sm" | "lg"
  className?: string
}

/**
 * Stock Badge Component
 * Displays stock status with color-coded badge and optional icons
 */
export function StockBadge({
  quantity,
  status: providedStatus,
  showIcon = false,
  showQuantity = false,
  showTooltip = true,
  lowStockThreshold = 10,
  size = "default",
  className,
}: StockBadgeProps) {
  const stockInfo = getStockInfo(quantity, providedStatus, { lowStock: lowStockThreshold })
  const variant = getStockStatusVariant(stockInfo.status)

  const icon = getStockIcon(stockInfo.status)
  const label = formatStockStatus(stockInfo.status)

  const badgeContent = (
    <Badge variant={variant} className={className}>
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {showQuantity ? `${quantity} ${label}` : label}
    </Badge>
  )

  if (showTooltip && stockInfo.warningMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p>{stockInfo.warningMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badgeContent
}

/**
 * Get icon for stock status
 */
function getStockIcon(status: StockStatus) {
  const iconProps = { className: "h-3 w-3", "aria-hidden": true }

  switch (status) {
    case "in_stock":
      return <CheckCircle {...iconProps} />
    case "low_stock":
      return <AlertTriangle {...iconProps} />
    case "out_of_stock":
      return <XCircle {...iconProps} />
    case "discontinued":
      return <AlertCircle {...iconProps} />
    default:
      return null
  }
}

/**
 * Compact Stock Indicator (for tables/lists)
 */
interface StockIndicatorProps {
  quantity: number
  status?: StockStatus
  lowStockThreshold?: number
}

export function StockIndicator({ quantity, status: providedStatus, lowStockThreshold = 10 }: StockIndicatorProps) {
  const stockInfo = getStockInfo(quantity, providedStatus, { lowStock: lowStockThreshold })

  const colorMap: Record<StockStatus, string> = {
    in_stock: "bg-green-500",
    low_stock: "bg-yellow-500",
    out_of_stock: "bg-red-500",
    discontinued: "bg-gray-500",
  }

  const color = colorMap[stockInfo.status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-sm text-muted-foreground">{quantity}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{formatStockStatus(stockInfo.status)}</p>
          {stockInfo.warningMessage && <p className="text-xs text-muted-foreground">{stockInfo.warningMessage}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Stock Alert Banner (for product pages)
 */
interface StockAlertProps {
  quantity: number
  status?: StockStatus
  lowStockThreshold?: number
  className?: string
}

export function StockAlert({ quantity, status: providedStatus, lowStockThreshold = 10, className }: StockAlertProps) {
  const stockInfo = getStockInfo(quantity, providedStatus, { lowStock: lowStockThreshold })

  // Only show alert for low stock or out of stock
  if (stockInfo.status === "in_stock") {
    return null
  }

  const bgColorMap: Record<StockStatus, string> = {
    in_stock: "bg-green-50 border-green-200",
    low_stock: "bg-yellow-50 border-yellow-200",
    out_of_stock: "bg-red-50 border-red-200",
    discontinued: "bg-gray-50 border-gray-200",
  }

  const textColorMap: Record<StockStatus, string> = {
    in_stock: "text-green-800",
    low_stock: "text-yellow-800",
    out_of_stock: "text-red-800",
    discontinued: "text-gray-800",
  }

  const bgColor = bgColorMap[stockInfo.status]
  const textColor = textColorMap[stockInfo.status]

  return (
    <div className={`rounded-lg border p-3 ${bgColor} ${className}`}>
      <div className="flex items-start gap-2">
        {getStockIcon(stockInfo.status) && (
          <div className={`mt-0.5 ${textColor}`}>{getStockIcon(stockInfo.status)}</div>
        )}
        <div>
          <p className={`font-medium ${textColor}`}>{formatStockStatus(stockInfo.status)}</p>
          {stockInfo.warningMessage && <p className={`text-sm ${textColor} opacity-90`}>{stockInfo.warningMessage}</p>}
        </div>
      </div>
    </div>
  )
}
