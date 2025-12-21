"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingBag, CreditCard, Smartphone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type PaymentMethod = "multibanco" | "mbway"

export default function CheckoutPage() {
  const { cart } = useCart()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("multibanco")
  const [phoneError, setPhoneError] = useState("")

  const [formData, setFormData] = useState({
    // Customer info
    fullName: "",
    email: "",
    phone: "",
    // Company info (optional)
    companyName: "",
    nif: "",
    // Shipping address
    address: "",
    city: "",
    postalCode: "",
    country: "Portugal",
    // Payment
    mbwayPhone: "",
    // Additional
    notes: "",
    acceptTerms: false,
  })

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get customer data from database
        const { data: customer } = await supabase
          .from("customers")
          .select("*, shipping_addresses(*)")
          .eq("email", user.email)
          .single()

        if (customer) {
          // Clean phone number and check if it's a valid mobile for MB Way
          const cleanedPhone = (customer.phone || "").replace(/\D/g, "")
          const isValidMobileForMBWay = /^9[1236]\d{7}$/.test(cleanedPhone)

          setFormData((prev) => ({
            ...prev,
            fullName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
            email: customer.email || user.email || "",
            phone: customer.phone || "",
            companyName: customer.company_name || "",
            nif: customer.tax_id || "",
            // Pre-fill MB Way phone if it's a valid Portuguese mobile number
            mbwayPhone: isValidMobileForMBWay ? cleanedPhone : "",
          }))

          // Pre-fill with last shipping address if available
          if (customer.shipping_addresses && customer.shipping_addresses.length > 0) {
            const lastAddress = customer.shipping_addresses[0]
            setFormData((prev) => ({
              ...prev,
              address: lastAddress.address_line_1 || "",
              city: lastAddress.city || "",
              postalCode: lastAddress.postal_code || "",
              country: lastAddress.country || "Portugal",
            }))
          }
        } else {
          // Just set email if no customer record exists
          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
          }))
        }
      }
      setIsLoadingUser(false)
    }

    loadUserData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear phone error when user types
    if (name === "mbwayPhone") {
      setPhoneError("")
    }
  }

  // Validate Portuguese mobile phone
  // Handles formats like: 912345678, +351912345678, 351 912 345 678
  const validateMBWayPhone = (phone: string): boolean => {
    let cleaned = phone.replace(/\D/g, "")
    // Remove Portuguese country code if present (351)
    if (cleaned.startsWith("351") && cleaned.length > 9) {
      cleaned = cleaned.substring(3)
    }
    return /^9[1236]\d{7}$/.test(cleaned)
  }

  // Clean phone number for API (remove country code and non-digits)
  const cleanMBWayPhone = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "")
    // Remove Portuguese country code if present (351)
    if (cleaned.startsWith("351") && cleaned.length > 9) {
      cleaned = cleaned.substring(3)
    }
    return cleaned
  }

  const shippingCost = cart.totalPrice >= 150 ? 0 : 7.5
  const finalTotal = cart.totalPrice + shippingCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setPhoneError("")

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.postalCode
    ) {
      alert("Por favor preencha todos os campos obrigatórios")
      setIsSubmitting(false)
      return
    }

    // Validate MB Way phone if selected
    if (paymentMethod === "mbway") {
      if (!formData.mbwayPhone) {
        setPhoneError("Introduza o número de telemóvel")
        setIsSubmitting(false)
        return
      }
      if (!validateMBWayPhone(formData.mbwayPhone)) {
        setPhoneError("Número inválido. Use formato 9XXXXXXXX (91, 92, 93 ou 96)")
        setIsSubmitting(false)
        return
      }
    }

    if (!formData.acceptTerms) {
      alert("Por favor aceite os termos e condições")
      setIsSubmitting(false)
      return
    }

    // Prepare order data
    const orderData = {
      customer: {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.companyName,
        nif: formData.nif,
      },
      shipping: {
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      },
      items: cart.items,
      subtotal: cart.totalPrice,
      shippingCost: shippingCost,
      total: finalTotal,
      notes: formData.notes,
    }

    try {
      // Step 1: Create order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.error || "Erro ao criar encomenda")
      }

      const orderNumber = orderResult.data.orderNumber

      // Step 2: Process payment based on method
      if (paymentMethod === "multibanco") {
        const paymentResponse = await fetch("/api/payment/multibanco", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderNumber }),
        })

        const paymentResult = await paymentResponse.json()

        if (!paymentResponse.ok || !paymentResult.success) {
          // Order created but payment failed - still redirect with order ID
          console.error("Payment error:", paymentResult.error)
          router.push(`/checkout/sucesso?orderId=${orderNumber}&paymentError=true`)
          return
        }

        // Redirect to success with Multibanco details
        const params = new URLSearchParams({
          orderId: orderNumber,
          method: "multibanco",
          entity: paymentResult.data.entity,
          reference: paymentResult.data.reference,
          amount: paymentResult.data.amount.toString(),
          deadline: paymentResult.data.deadline,
        })
        router.push(`/checkout/sucesso?${params.toString()}`)
      } else {
        // MB Way - clean phone number before sending (handles country code, spaces, etc)
        const cleanedPhone = cleanMBWayPhone(formData.mbwayPhone)

        const paymentResponse = await fetch("/api/payment/mbway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderNumber,
            phoneNumber: cleanedPhone,
          }),
        })

        const paymentResult = await paymentResponse.json()

        if (!paymentResponse.ok || !paymentResult.success) {
          console.error("MB Way error:", paymentResult.error)
          // Show the actual error to the user for phone-related issues
          if (paymentResult.error?.includes("telemóvel") || paymentResult.error?.includes("phone")) {
            setPhoneError(paymentResult.error || "Número de telemóvel inválido")
            setIsSubmitting(false)
            return
          }
          router.push(`/checkout/sucesso?orderId=${orderNumber}&paymentError=true`)
          return
        }

        // Redirect to success with MB Way details
        const params = new URLSearchParams({
          orderId: orderNumber,
          method: "mbway",
          phone: paymentResult.data.phone,
          amount: paymentResult.data.amount.toString(),
        })
        router.push(`/checkout/sucesso?${params.toString()}`)
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar encomenda. Por favor tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">O seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">Adicione produtos ao carrinho antes de finalizar a compra.</p>
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
        <h1 className="text-4xl font-bold mb-8">Finalizar Encomenda</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Informações de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingUser ? (
                    <div className="text-center py-4 text-muted-foreground">A carregar...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">
                            Nome Completo <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            placeholder="João Silva"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="joao@example.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Telefone <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="+351 912 345 678"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Company Information (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle>2. Dados da Empresa (Opcional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Empresa Lda."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nif">NIF</Label>
                      <Input
                        id="nif"
                        name="nif"
                        value={formData.nif}
                        onChange={handleInputChange}
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>3. Morada de Envio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Morada <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Rua exemplo, nº 123"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        Cidade <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Lisboa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">
                        Código Postal <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        placeholder="1000-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleInputChange} disabled />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>4. Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="multibanco" id="multibanco" />
                      <Label htmlFor="multibanco" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-medium">Referência Multibanco</p>
                          <p className="text-sm text-muted-foreground">Pague via homebanking ou caixa multibanco</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="mbway" id="mbway" className="mt-1" />
                      <Label htmlFor="mbway" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-6 h-6 text-primary" />
                          <div>
                            <p className="font-medium">MB Way</p>
                            <p className="text-sm text-muted-foreground">Pague diretamente pelo telemóvel</p>
                          </div>
                        </div>
                        {paymentMethod === "mbway" && (
                          <div className="mt-4 ml-9">
                            <Label htmlFor="mbwayPhone" className="text-sm">
                              Número de Telemóvel <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="mbwayPhone"
                              name="mbwayPhone"
                              type="tel"
                              value={formData.mbwayPhone}
                              onChange={handleInputChange}
                              placeholder="912345678"
                              className={`mt-1 max-w-xs ${phoneError ? "border-destructive" : ""}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {phoneError && <p className="text-sm text-destructive mt-1">{phoneError}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              Números válidos: 91, 92, 93 ou 96
                            </p>
                          </div>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>5. Observações (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Adicione aqui qualquer informação adicional sobre a sua encomenda..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      acceptTerms: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                  Aceito os{" "}
                  <Link href="/termos-condicoes" className="text-primary hover:underline" target="_blank">
                    termos e condições
                  </Link>{" "}
                  e a{" "}
                  <Link href="/politica-privacidade" className="text-primary hover:underline" target="_blank">
                    política de privacidade
                  </Link>
                  <span className="text-destructive"> *</span>
                </Label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Resumo da Encomenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3 pb-4 border-b">
                    {cart.items.map((item) => (
                      <div key={item.variantId} className="flex gap-3">
                        <div className="relative w-16 h-16 bg-muted rounded flex-shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.productName}
                              fill
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              Sem imagem
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.sizeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x {item.unitPrice.toFixed(2)}€
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{item.totalPrice.toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{cart.totalPrice.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envio</span>
                      <span className="font-semibold">
                        {shippingCost === 0 ? (
                          <span className="text-green-600">Grátis</span>
                        ) : (
                          <span>{shippingCost.toFixed(2)}€</span>
                        )}
                      </span>
                    </div>
                    {cart.totalPrice < 150 && shippingCost > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Adicione {(150 - cart.totalPrice).toFixed(2)}€ para envio grátis
                      </p>
                    )}
                    <div className="flex justify-between pt-4 border-t text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-primary text-2xl">{finalTotal.toFixed(2)}€</span>
                    </div>
                    <p className="text-xs text-muted-foreground">IVA incluído</p>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "A processar..." : "Confirmar Encomenda"}
                  </Button>

                  <div className="text-center">
                    <Link href="/carrinho" className="text-sm text-primary hover:underline">
                      Voltar ao carrinho
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
