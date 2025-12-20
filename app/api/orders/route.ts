import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send-order-emails"

// Validation schemas
const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(9, "Telefone inválido"),
  company: z.string().optional(),
  nif: z.string().optional(),
})

const shippingSchema = z.object({
  address: z.string().min(1, "Morada é obrigatória"),
  address2: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  postalCode: z.string().min(4, "Código postal inválido"),
  country: z.string().default("Portugal"),
})

const orderItemSchema = z.object({
  variantId: z.number(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  productName: z.string().optional(),
  productSku: z.string().optional(),
  sizeFormat: z.string().optional(),
})

const createOrderSchema = z.object({
  customer: customerSchema,
  shipping: shippingSchema,
  items: z.array(orderItemSchema).min(1, "Carrinho vazio"),
  subtotal: z.number(),
  shippingCost: z.number(),
  total: z.number(),
  notes: z.string().optional(),
})

// GET - Fetch order by order_number or user's orders
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get("order_number")
    const { userId } = await auth()

    // Fetch single order by order_number
    if (orderNumber) {
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          shipping_address:shipping_addresses(*),
          items:order_items(*)
        `)
        .eq("order_number", orderNumber)
        .single()

      if (error || !order) {
        return NextResponse.json(
          { success: false, error: "Encomenda não encontrada" },
          { status: 404 }
        )
      }

      // If user is logged in, verify they own this order
      if (userId) {
        const customer = order.customer as { auth_user_id?: string }
        if (customer?.auth_user_id && customer.auth_user_id !== userId) {
          return NextResponse.json(
            { success: false, error: "Não autorizado" },
            { status: 403 }
          )
        }
      }

      return NextResponse.json({ success: true, data: order })
    }

    // Fetch all orders for logged-in user
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Autenticação necessária" },
        { status: 401 }
      )
    }

    // Find customer by auth_user_id
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", userId)
      .single()

    if (!customer) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json(
        { success: false, error: "Erro ao carregar encomendas" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error("Error in GET /api/orders:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Create new order
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate request body
    const parseResult = createOrderSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: errors },
        { status: 400 }
      )
    }

    const { customer, shipping, items, subtotal, shippingCost, total, notes } = parseResult.data

    // Optional authentication - guests can also checkout
    const { userId } = await auth()

    const nameParts = customer.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Check if customer exists by email, if not create one
    let customerId: number
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customer.email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update customer info
      await supabase
        .from("customers")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: customer.phone,
          company_name: customer.company || null,
          tax_id: customer.nif || null,
          ...(userId && { auth_user_id: userId }),
        })
        .eq("id", customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: customer.email,
          phone: customer.phone,
          company_name: customer.company || null,
          tax_id: customer.nif || null,
          auth_user_id: userId || null,
        })
        .select("id")
        .single()

      if (customerError || !newCustomer) {
        console.error("Error creating customer:", customerError)
        return NextResponse.json(
          { success: false, error: "Erro ao criar cliente" },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // Create shipping address
    const { data: shippingAddress, error: shippingError } = await supabase
      .from("shipping_addresses")
      .insert({
        customer_id: customerId,
        address_line_1: shipping.address,
        address_line_2: shipping.address2 || null,
        city: shipping.city,
        postal_code: shipping.postalCode,
        country: shipping.country,
        is_default: false,
      })
      .select("id")
      .single()

    if (shippingError || !shippingAddress) {
      console.error("Error creating shipping address:", shippingError)
      return NextResponse.json(
        { success: false, error: "Erro ao criar morada de envio" },
        { status: 500 }
      )
    }

    // Generate order number
    const orderNumber = `JCR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        status: "pending",
        subtotal_excluding_vat: subtotal / 1.23,
        subtotal_including_vat: subtotal,
        shipping_cost_excluding_vat: shippingCost / 1.23,
        shipping_cost_including_vat: shippingCost,
        total_amount_excluding_vat: (subtotal + shippingCost) / 1.23,
        total_amount_with_vat: total,
        shipping_address_id: shippingAddress.id,
        notes: notes || null,
      })
      .select("id, order_number")
      .single()

    if (orderError || !order) {
      console.error("Error creating order:", orderError)
      return NextResponse.json(
        { success: false, error: "Erro ao criar encomenda" },
        { status: 500 }
      )
    }

    // Fetch product info for snapshots
    const variantIds = items.map((item) => item.variantId)
    const { data: variants } = await supabase
      .from("product_variants")
      .select(`
        id,
        sku,
        size_format,
        stock_quantity,
        template:product_templates(name)
      `)
      .in("id", variantIds)

    const variantMap = new Map(
      variants?.map((v) => [v.id, v]) || []
    )

    // Create order items with product snapshots
    const orderItems = items.map((item) => {
      const variant = variantMap.get(item.variantId)
      const template = variant?.template as { name?: string } | null

      return {
        order_id: order.id,
        product_variant_id: item.variantId,
        quantity: item.quantity,
        unit_price_excluding_vat: item.unitPrice / 1.23,
        unit_price_with_vat: item.unitPrice,
        line_total_excluding_vat: item.totalPrice / 1.23,
        line_total_with_vat: item.totalPrice,
        // Snapshot fields
        product_name: item.productName || template?.name || null,
        product_sku: item.productSku || variant?.sku || null,
        size_format: item.sizeFormat || variant?.size_format || null,
      }
    })

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      return NextResponse.json(
        { success: false, error: "Erro ao criar itens da encomenda" },
        { status: 500 }
      )
    }

    // Update product stock quantities
    for (const item of items) {
      const variant = variantMap.get(item.variantId)
      if (variant) {
        const newStock = Math.max(0, (variant.stock_quantity || 0) - item.quantity)
        await supabase
          .from("product_variants")
          .update({ stock_quantity: newStock })
          .eq("id", item.variantId)
      }
    }

    // Send emails (don't fail order if emails fail)
    try {
      // These run in parallel but we don't await them to not block the response
      Promise.all([
        sendOrderConfirmation(order.order_number),
        sendAdminNotification(order.order_number),
      ]).catch((err) => console.error("Email send error:", err))
    } catch (emailError) {
      console.error("Failed to queue emails:", emailError)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
        },
        message: "Encomenda criada com sucesso",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
