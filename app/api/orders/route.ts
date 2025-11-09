import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const data = await request.json()

    const { customer, shipping, items, subtotal, shippingCost, total, notes } = data

    // Validate required fields
    if (!customer.name || !customer.email || !customer.phone) {
      return NextResponse.json({ error: "Missing customer information" }, { status: 400 })
    }

    if (!shipping.address || !shipping.city || !shipping.postalCode) {
      return NextResponse.json({ error: "Missing shipping information" }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

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

      const { error: updateError } = await supabase
        .from("customers")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: customer.phone,
          company_name: customer.company || null,
          tax_id: customer.nif || null,
        })
        .eq("id", customerId)

      if (updateError) {
        console.error("Error updating customer:", updateError)
      }
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
          auth_user_id: user?.id || null,
        })
        .select("id")
        .single()

      if (customerError || !newCustomer) {
        console.error("Error creating customer:", customerError)
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
      }

      customerId = newCustomer.id
    }

    // Create shipping address
    const { data: shippingAddress, error: shippingError } = await supabase
      .from("shipping_addresses")
      .insert({
        customer_id: customerId,
        address_line_1: shipping.address,
        city: shipping.city,
        postal_code: shipping.postalCode,
        country: shipping.country,
        is_default: false,
      })
      .select("id")
      .single()

    if (shippingError || !shippingAddress) {
      console.error("Error creating shipping address:", shippingError)
      return NextResponse.json({ error: "Failed to create shipping address" }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_variant_id: item.variantId,
      quantity: item.quantity,
      unit_price_excluding_vat: item.unitPrice / 1.23,
      unit_price_with_vat: item.unitPrice,
      line_total_excluding_vat: item.totalPrice / 1.23,
      line_total_with_vat: item.totalPrice,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Update product stock quantities
    for (const item of items) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variantId)
        .single()

      if (variant) {
        const newStock = Math.max(0, (variant.stock_quantity || 0) - item.quantity)
        await supabase.from("product_variants").update({ stock_quantity: newStock }).eq("id", item.variantId)
      }
    }

    // Return success with order ID
    return NextResponse.json(
      {
        success: true,
        orderId: order.order_number,
        message: "Order created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
