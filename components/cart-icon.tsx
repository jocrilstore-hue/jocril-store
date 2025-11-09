"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function CartIcon() {
  const { cart } = useCart()

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/carrinho">
        <ShoppingCart className="h-5 w-5" />
        {cart.totalItems > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {cart.totalItems}
          </Badge>
        )}
        <span className="sr-only">Carrinho de compras</span>
      </Link>
    </Button>
  )
}
