import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyCallback } from "@/lib/payments/eupago"
import { sendPaymentReceived } from "@/lib/email/send-order-emails"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("EuPago webhook received:", JSON.stringify(body, null, 2))

    // Validate callback
    const callback = verifyCallback(body)
    if (!callback) {
      console.error("Invalid EuPago callback format")
      return NextResponse.json(
        { success: false, error: "Invalid callback format" },
        { status: 400 }
      )
    }

    const {
      identificador: orderNumber,
      transacao: transactionId,
      valor: amount,
      canal: channel,
      referencia: reference,
      data: paymentDate,
    } = callback

    const supabase = await createClient()

    // Find order by order_number
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, payment_status, total_amount_with_vat")
      .eq("order_number", orderNumber)
      .single()

    if (findError || !order) {
      console.error(`Order not found: ${orderNumber}`)
      // Return 200 to prevent EuPago retries for unknown orders
      return NextResponse.json({ success: true, message: "Order not found" })
    }

    // Check if already processed
    if (order.payment_status === "paid") {
      console.log(`Order ${orderNumber} already marked as paid`)
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    // Verify amount matches (with small tolerance for rounding)
    const amountDiff = Math.abs(order.total_amount_with_vat - amount)
    if (amountDiff > 0.01) {
      console.error(
        `Amount mismatch for ${orderNumber}: expected ${order.total_amount_with_vat}, got ${amount}`
      )
      // Still process but log the discrepancy
    }

    // Update order as paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        paid_at: new Date().toISOString(),
        eupago_transaction_id: transactionId,
      })
      .eq("id", order.id)

    if (updateError) {
      console.error("Error updating order payment status:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update order" },
        { status: 500 }
      )
    }

    console.log(
      `Order ${orderNumber} paid via ${channel}. Reference: ${reference}, Transaction: ${transactionId}`
    )

    // Send payment confirmation email (don't fail webhook if email fails)
    try {
      sendPaymentReceived(orderNumber).catch((err) =>
        console.error("Failed to send payment received email:", err)
      )
    } catch (emailError) {
      console.error("Failed to queue payment email:", emailError)
    }

    // Return 200 OK - EuPago expects this
    return NextResponse.json({
      success: true,
      message: "Payment processed",
    })
  } catch (error) {
    console.error("EuPago webhook error:", error)
    // Return 200 to prevent retries - we'll investigate manually
    return NextResponse.json({
      success: false,
      error: "Internal error",
    })
  }
}

// Also handle GET for testing/verification
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "EuPago Webhook",
    timestamp: new Date().toISOString(),
  })
}
