import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ orderNumber: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { orderNumber } = await params
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from("orders")
      .select("payment_status, status, paid_at")
      .eq("order_number", orderNumber)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Encomenda não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentStatus: order.payment_status,
        orderStatus: order.status,
        paidAt: order.paid_at,
      },
    })
  } catch (error) {
    console.error("Error fetching order status:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    )
  }
}
