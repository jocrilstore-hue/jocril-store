import { createClient } from "@/lib/supabase/server"
import { sendEmail, sendAdminEmail } from "./resend"
import { renderOrderConfirmation } from "./templates/order-confirmation"
import { renderPaymentReceived } from "./templates/payment-received"
import { renderAdminNotification } from "./templates/admin-notification"

interface OrderData {
  id: number
  order_number: string
  customer_id: number
  status: string
  subtotal_including_vat: number
  shipping_cost_including_vat: number
  total_amount_with_vat: number
  payment_method: string | null
  payment_status: string
  eupago_entity: string | null
  eupago_reference: string | null
  payment_deadline: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  customer: {
    id: number
    first_name: string
    last_name: string | null
    email: string
    phone: string
    company_name: string | null
    tax_id: string | null
  }
  shipping_address: {
    address_line_1: string
    address_line_2: string | null
    city: string
    postal_code: string
    country: string
  }
  items: Array<{
    product_name: string | null
    product_sku: string | null
    size_format: string | null
    quantity: number
    unit_price_with_vat: number
    line_total_with_vat: number
  }>
}

/**
 * Fetch complete order data for emails
 */
async function fetchOrderData(orderNumber: string): Promise<OrderData | null> {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customer:customers(*),
      shipping_address:shipping_addresses(*),
      items:order_items(*)
    `
    )
    .eq("order_number", orderNumber)
    .single()

  if (error || !order) {
    console.error("Failed to fetch order for email:", error)
    return null
  }

  return order as OrderData
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(orderNumber: string): Promise<boolean> {
  try {
    const order = await fetchOrderData(orderNumber)
    if (!order) return false

    const customerName = [order.customer.first_name, order.customer.last_name]
      .filter(Boolean)
      .join(" ")

    const html = renderOrderConfirmation({
      orderNumber: order.order_number,
      customerName,
      items: order.items,
      subtotalWithVat: order.subtotal_including_vat,
      shippingCostWithVat: order.shipping_cost_including_vat,
      totalWithVat: order.total_amount_with_vat,
      shippingAddress: order.shipping_address,
      payment: {
        method: order.payment_method as "multibanco" | "mbway" | null,
        entity: order.eupago_entity,
        reference: order.eupago_reference,
        deadline: order.payment_deadline,
      },
    })

    const result = await sendEmail({
      to: order.customer.email,
      subject: `Confirmação de Encomenda ${order.order_number} - Jocril`,
      html,
      orderId: order.id,
      customerId: order.customer.id,
      emailType: "order_confirmation",
    })

    return result.success
  } catch (error) {
    console.error("sendOrderConfirmation error:", error)
    return false
  }
}

/**
 * Send payment received email to customer
 */
export async function sendPaymentReceived(orderNumber: string): Promise<boolean> {
  try {
    const order = await fetchOrderData(orderNumber)
    if (!order) return false

    const customerName = [order.customer.first_name, order.customer.last_name]
      .filter(Boolean)
      .join(" ")

    const html = renderPaymentReceived({
      orderNumber: order.order_number,
      customerName,
      totalWithVat: order.total_amount_with_vat,
      paidAt: order.paid_at || new Date().toISOString(),
    })

    const result = await sendEmail({
      to: order.customer.email,
      subject: `Pagamento Confirmado - Encomenda ${order.order_number} - Jocril`,
      html,
      orderId: order.id,
      customerId: order.customer.id,
      emailType: "payment_received",
    })

    return result.success
  } catch (error) {
    console.error("sendPaymentReceived error:", error)
    return false
  }
}

/**
 * Send new order notification to admin
 */
export async function sendAdminNotification(orderNumber: string): Promise<boolean> {
  try {
    const order = await fetchOrderData(orderNumber)
    if (!order) return false

    const customerName = [order.customer.first_name, order.customer.last_name]
      .filter(Boolean)
      .join(" ")

    const html = renderAdminNotification({
      orderNumber: order.order_number,
      customerName,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      companyName: order.customer.company_name,
      taxId: order.customer.tax_id,
      items: order.items,
      subtotalWithVat: order.subtotal_including_vat,
      shippingCostWithVat: order.shipping_cost_including_vat,
      totalWithVat: order.total_amount_with_vat,
      shippingAddress: order.shipping_address,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      notes: order.notes,
      createdAt: order.created_at,
    })

    const result = await sendAdminEmail({
      subject: `🛒 Nova Encomenda ${order.order_number} - ${customerName}`,
      html,
      orderId: order.id,
    })

    return result.success
  } catch (error) {
    console.error("sendAdminNotification error:", error)
    return false
  }
}

/**
 * Send order shipped email to customer (for future use)
 */
export async function sendOrderShipped(
  orderNumber: string,
  trackingNumber?: string
): Promise<boolean> {
  // TODO: Implement when shipping integration is added
  console.log("sendOrderShipped not yet implemented:", orderNumber, trackingNumber)
  return true
}
