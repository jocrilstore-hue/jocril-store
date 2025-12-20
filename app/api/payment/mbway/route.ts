import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  createMBWayPayment,
  validatePhoneNumber,
  maskPhoneNumber,
  EuPagoError,
} from "@/lib/payments/eupago"

const requestSchema = z.object({
  orderId: z.string().min(1),
  phoneNumber: z.string().min(9),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dados em falta" },
        { status: 400 }
      )
    }

    const { orderId, phoneNumber } = parsed.data

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "Número de telemóvel inválido. Use formato 9XXXXXXXX (91, 92, 93 ou 96)",
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount_with_vat, payment_status")
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

    // Create MB Way payment request
    const result = await createMBWayPayment(
      order.order_number,
      order.total_amount_with_vat,
      phoneNumber
    )

    // Update order with payment info
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_method: "mbway",
        eupago_transaction_id: result.reference,
        payment_status: "pending",
      })
      .eq("id", order.id)

    if (updateError) {
      console.error("Error updating order with MB Way info:", updateError)
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: result.reference,
        amount: result.amount,
        phone: maskPhoneNumber(phoneNumber),
      },
      message: "Pedido de pagamento enviado. Confirme no seu telemóvel.",
    })
  } catch (error) {
    console.error("MB Way payment error:", error)

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
