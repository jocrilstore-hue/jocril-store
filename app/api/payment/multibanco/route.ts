import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  createMultibancoReference,
  formatReference,
  EuPagoError,
} from "@/lib/payments/eupago"

const requestSchema = z.object({
  orderId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "ID da encomenda em falta" },
        { status: 400 }
      )
    }

    const { orderId } = parsed.data
    const supabase = await createClient()

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount_with_vat, payment_status, eupago_reference")
      .eq("order_number", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Encomenda não encontrada" },
        { status: 404 }
      )
    }

    // Check if already paid
    if (order.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Esta encomenda já foi paga" },
        { status: 400 }
      )
    }

    // Check if already has a reference (avoid duplicates)
    if (order.eupago_reference) {
      // Return existing reference
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("eupago_entity, eupago_reference, total_amount_with_vat, payment_deadline")
        .eq("id", order.id)
        .single()

      if (existingOrder?.eupago_entity && existingOrder?.eupago_reference) {
        return NextResponse.json({
          success: true,
          data: {
            entity: existingOrder.eupago_entity,
            reference: existingOrder.eupago_reference,
            referenceFormatted: formatReference(existingOrder.eupago_reference),
            amount: existingOrder.total_amount_with_vat,
            deadline: existingOrder.payment_deadline,
          },
        })
      }
    }

    // Create Multibanco reference
    const result = await createMultibancoReference(
      order.order_number,
      order.total_amount_with_vat,
      24 // 24 hour deadline
    )

    // Update order with payment info
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_method: "multibanco",
        eupago_entity: result.entity,
        eupago_reference: result.reference,
        payment_deadline: result.deadline.toISOString(),
        payment_status: "pending",
      })
      .eq("id", order.id)

    if (updateError) {
      console.error("Error updating order with payment info:", updateError)
      // Don't fail - the reference was created, just log the error
    }

    return NextResponse.json({
      success: true,
      data: {
        entity: result.entity,
        reference: result.reference,
        referenceFormatted: formatReference(result.reference),
        amount: result.amount,
        deadline: result.deadline.toISOString(),
      },
    })
  } catch (error) {
    console.error("Multibanco payment error:", error)

    if (error instanceof EuPagoError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Erro ao processar pagamento" },
      { status: 500 }
    )
  }
}
