"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Flag, Lock, Truck } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { productFAQ } from "@/lib/product-faq"

interface ProductDetailProps {
  currentVariant: any
  allVariants: any[]
  priceTiersByVariant: Record<number, any[]>
  images: any[]
}

export default function ProductDetail({
  currentVariant,
  allVariants,
  priceTiersByVariant,
  images,
}: ProductDetailProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [selectedVariantId, setSelectedVariantId] = useState(currentVariant.id)
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = allVariants.find((v) => v.id === selectedVariantId) || currentVariant
  const priceTiers = priceTiersByVariant[selectedVariantId] || []
  const template = currentVariant.product_templates

  const handleVariantChange = (variantId: number) => {
    const variant = allVariants.find((v) => v.id === variantId)
    if (variant) {
      router.push(`/produtos/${variant.url_slug}`)
    }
  }

  const getCurrentPrice = () => {
    if (priceTiers.length === 0) {
      return selectedVariant.base_price_including_vat
    }
    const tier = priceTiers.find(
      (t) => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity),
    )
    return tier ? tier.price_per_unit : selectedVariant.base_price_including_vat
  }

  const handleAddToCart = () => {
    addToCart({
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      productName: template.name,
      sizeName: selectedVariant.size_formats.name,
      quantity: quantity,
      unitPrice: getCurrentPrice(),
      imageUrl: selectedVariant.main_image_url,
      stockQuantity: selectedVariant.stock_quantity,
    })

    toast({
      title: "Produto adicionado ao carrinho",
      description: `${quantity}x ${template.name} - ${selectedVariant.size_formats.name}`,
    })

    setQuantity(1)
  }

  const currentPrice = getCurrentPrice()
  const totalPrice = currentPrice * quantity

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 pt-20 pb-32">
        <div className="grid grid-cols-2 gap-32">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="relative w-full aspect-square bg-muted border border-border rounded-lg">
              <Image
                src={selectedVariant.main_image_url || "https://placehold.co/800x800?text=Imagem"}
                alt={template.name}
                fill
                className="object-cover rounded-lg"
              />
              {selectedVariant.is_bestseller && (
                <Badge className="absolute top-4 right-4 bg-foreground text-background">Bestseller</Badge>
              )}
            </div>
            {images && images.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                {images.map((img) => (
                  <div key={img.id} className="relative w-full aspect-square bg-muted border border-border cursor-pointer hover:border-foreground transition-colors rounded-lg">
                    <Image
                      src={img.image_url || "https://placehold.co/200x200?text=Imagem"}
                      alt={img.alt_text || "Imagem"}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-3">{template.name}</h1>
            <p className="text-xs text-muted-foreground mb-10">Ref.: {template.reference_code || selectedVariant.sku}</p>

            {/* Price */}
            <div style={{ color: "oklch(0.75 0.12 192)" }} className="text-3xl lg:text-4xl mb-3">
              {currentPrice.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground mb-10">Iva incluido</p>

            {/* Size Selector */}
            <div className="mb-10">
              <p className="text-xs text-foreground mb-4">Dimensões:</p>
              <div className="grid grid-cols-4 gap-4">
                {allVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant.id)}
                    className={`py-4 px-4 text-xs border transition-all rounded-lg ${
                      variant.id === selectedVariantId
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {variant.size_formats.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector + Carrinho Button (side by side) */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center border border-border h-12 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full border-r border-border hover:bg-muted transition-colors text-center"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-16 text-center bg-background border-none focus:outline-none text-sm"
                  min="1"
                  max={selectedVariant.stock_quantity}
                />
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, selectedVariant.stock_quantity))}
                  className="w-12 h-full border-l border-border hover:bg-muted transition-colors text-center"
                  disabled={quantity >= selectedVariant.stock_quantity}
                >
                  +
                </button>
              </div>

              <Button
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 h-12 text-xs rounded-lg"
                disabled={selectedVariant.stock_status === "out_of_stock"}
                onClick={handleAddToCart}
              >
                + Carrinho
              </Button>
            </div>

            {/* Solicitar Orçamento (full width) */}
            <Button 
              className="w-full bg-background text-foreground border border-foreground hover:bg-foreground hover:text-background h-12 text-xs mb-10 rounded-lg"
              variant="outline"
            >
              Solicitar Orçamento
            </Button>

            {/* Quantity Discounts */}
            {priceTiers && priceTiers.length > 0 && (
              <div className="mb-10 p-6 border border-dashed border-border rounded-lg">
                <p className="text-base text-foreground mb-4">Descontos por quantidade:</p>
                <div className="space-y-3">
                  {priceTiers.map((tier) => (
                    <div key={tier.id} className="flex justify-between items-center text-base pb-3 border-b border-dashed border-border last:border-b-0">
                      <span className="text-muted-foreground">{tier.min_quantity} unidades</span>
                      <span style={{ color: "oklch(0.75 0.12 192)" }}>{tier.price_per_unit.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-8 pt-10 border-t border-border">
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <Truck className="w-4 h-4 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="text-xs text-foreground">Envio</p>
                  <p className="text-xs text-muted-foreground">Em 1-3 dias</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <Lock className="w-4 h-4 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="text-xs text-foreground">Pagamento</p>
                  <p className="text-xs text-muted-foreground">Seguro</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <Flag className="w-4 h-4 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="text-xs text-foreground">Fabricado</p>
                  <p className="text-xs text-muted-foreground">Em Portugal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="description" className="mt-32 mb-12">
          <TabsList className="w-full">
            <TabsTrigger value="description" className="uppercase text-xs tracking-wide">Descrição</TabsTrigger>
            <TabsTrigger value="specs" className="uppercase text-xs tracking-wide">Especificações</TabsTrigger>
            <TabsTrigger value="uses" className="uppercase text-xs tracking-wide">Onde Utilizar</TabsTrigger>
            <TabsTrigger value="faq" className="uppercase text-xs tracking-wide">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <div className="max-w-4xl">
              {template.full_description ? (
                <div className="prose max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{template.full_description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed">Descrição completa em breve.</p>
              )}

              {template.advantages && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Vantagens</h3>
                  <div className="prose max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{template.advantages}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="specs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Specifications List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold mb-8 text-foreground">Especificações Técnicas</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Material</span>
                    <span className="text-foreground">Acrílico cristal de alta qualidade</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Formato</span>
                    <span className="text-foreground">{selectedVariant.size_formats.name}</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Dimensões</span>
                    <span className="text-foreground">
                      {selectedVariant.size_formats.width_mm} × {selectedVariant.size_formats.height_mm} mm
                    </span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Orientação</span>
                    <span className="text-foreground capitalize">{selectedVariant.orientation || "Vertical"}</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Visibilidade</span>
                    <span className="text-foreground">Dupla face</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Espessura</span>
                    <span className="text-foreground">3 mm</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline border-b border-dashed border-border pb-4">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Peso</span>
                    <span className="text-foreground">120 g</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] gap-8 items-baseline">
                    <span className="text-xs uppercase tracking-wide font-semibold text-foreground">Acabamento</span>
                    <span className="text-foreground">Polido em todas as arestas</span>
                  </div>
                </div>
              </div>

              {/* Technical Image Placeholder */}
              <div className="flex items-start justify-center lg:sticky lg:top-24 lg:h-fit">
                <div className="w-full aspect-square bg-muted border border-dashed border-border rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Diagrama Técnico</p>
                    <p className="text-sm text-muted-foreground">Imagem técnica em breve</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="uses">
            <div className="max-w-4xl">
              <h3 className="text-2xl font-semibold mb-8 text-foreground">Aplicações Profissionais</h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="restaurants">
                  <AccordionTrigger className="text-base font-semibold text-foreground uppercase tracking-wide hover:no-underline">
                    Restaurantes e Cafés
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 text-foreground pl-4">
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Menus de mesa</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Carta de vinhos</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Promoções do dia</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Menu de sobremesas</span>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="hotel">
                  <AccordionTrigger className="text-base font-semibold text-foreground uppercase tracking-wide hover:no-underline">
                    Hotelaria
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 text-foreground pl-4">
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Informações de quarto</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Serviços disponíveis</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Horários</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Contactos úteis</span>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="retail">
                  <AccordionTrigger className="text-base font-semibold text-foreground uppercase tracking-wide hover:no-underline">
                    Comércio
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 text-foreground pl-4">
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Preçários</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Características de produtos</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Promoções</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Novidades</span>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="offices">
                  <AccordionTrigger className="text-base font-semibold text-foreground uppercase tracking-wide hover:no-underline">
                    Escritórios
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 text-foreground pl-4">
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Recepção</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Salas de reunião</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Avisos internos</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>Directórios</span>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="max-w-4xl">
              <h3 className="text-2xl font-semibold mb-8 text-foreground">Perguntas Frequentes</h3>
              <Accordion type="single" collapsible className="w-full">
                {productFAQ.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-base font-semibold text-foreground uppercase tracking-wide hover:no-underline text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-foreground leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
