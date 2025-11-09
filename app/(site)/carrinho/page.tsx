"use client"

import { useCart } from "@/contexts/cart-context"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"

export default function CarrinhoPage() {
  const { cart, updateQuantity, removeFromCart } = useCart()

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">O seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">Adicione produtos ao carrinho para continuar.</p>
          <Button asChild size="lg">
            <Link href="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Carrinho de Compras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.variantId}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-24 h-24 bg-muted rounded flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.productName}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Sem imagem</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.productName}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{item.sizeName}</p>
                      <p className="text-xs text-muted-foreground mb-3">SKU: {item.sku}</p>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center border-2 rounded">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{item.unitPrice.toFixed(2)}€ /un</p>
                          <p className="text-xl font-bold text-primary">{item.totalPrice.toFixed(2)}€</p>
                        </div>
                      </div>

                      {item.quantity >= item.stockQuantity && (
                        <p className="text-xs text-orange-600 mt-2">Stock máximo atingido</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumo da Encomenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{cart.totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Itens</span>
                  <span className="font-semibold">{cart.totalItems}</span>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <span className="text-muted-foreground">Envio</span>
                  <span className="font-semibold">
                    {cart.totalPrice >= 150 ? <span className="text-green-600">Grátis</span> : <span>A calcular</span>}
                  </span>
                </div>
                {cart.totalPrice < 150 && (
                  <p className="text-xs text-muted-foreground">
                    Adicione {(150 - cart.totalPrice).toFixed(2)}€ para envio grátis
                  </p>
                )}
                <div className="flex justify-between pt-4 border-t text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-2xl">{cart.totalPrice.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-muted-foreground">IVA incluído</p>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link href="/checkout">Finalizar Compra</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
                  <Link href="/produtos">Continuar a Comprar</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Trust Badges */}
            <Card className="mt-4">
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>🚚</span>
                  <span>Envio grátis acima de 150€</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Pagamento 100% seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span>12 meses de garantia</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🇵🇹</span>
                  <span>Empresa portuguesa</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
