import {
  colors,
  containerStyle,
  headerStyle,
  h1Style,
  h2Style,
  cardStyle,
  mutedTextStyle,
  labelStyle,
  valueStyle,
  footerStyle,
  fonts,
} from "./styles"

interface OrderItem {
  product_name: string | null
  product_sku: string | null
  size_format: string | null
  quantity: number
  unit_price_with_vat: number
  line_total_with_vat: number
}

interface AdminNotificationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName?: string | null
  taxId?: string | null
  items: OrderItem[]
  subtotalWithVat: number
  shippingCostWithVat: number
  totalWithVat: number
  shippingAddress: {
    address_line_1: string
    address_line_2?: string | null
    city: string
    postal_code: string
    country: string
  }
  paymentMethod: string | null
  paymentStatus: string
  notes?: string | null
  createdAt: string
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + "€"
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getPaymentMethodLabel(method: string | null): string {
  switch (method) {
    case "multibanco":
      return "Multibanco"
    case "mbway":
      return "MB Way"
    default:
      return "Não definido"
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "🟡 Pendente"
    case "paid":
      return "🟢 Pago"
    case "failed":
      return "🔴 Falhou"
    default:
      return status
  }
}

export function renderAdminNotification(data: AdminNotificationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid ${colors.borderLight};">
          ${item.product_name || "Produto"}<br>
          <span style="${mutedTextStyle}; font-size: 12px;">${item.size_format || ""} ${item.product_sku ? `(${item.product_sku})` : ""}</span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid ${colors.borderLight}; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid ${colors.borderLight}; text-align: right; font-family: ${fonts.mono};">
          ${formatCurrency(item.unit_price_with_vat)}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid ${colors.borderLight}; text-align: right; font-family: ${fonts.mono}; font-weight: 600;">
          ${formatCurrency(item.line_total_with_vat)}
        </td>
      </tr>
    `
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Encomenda - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5;">
  <div style="${containerStyle}">
    <!-- Header -->
    <div style="${headerStyle}; background-color: ${colors.bgDark}; margin: -40px -20px 32px; padding: 24px 20px;">
      <h1 style="color: ${colors.textLight}; font-size: 14px; letter-spacing: 2px; margin: 0;">
        JOCRIL ADMIN
      </h1>
    </div>

    <!-- Alert -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">📦</span>
      <h1 style="${h1Style}">Nova Encomenda Recebida!</h1>
    </div>

    <!-- Order Summary -->
    <div style="${cardStyle}; border-color: ${colors.primary};">
      <table style="width: 100%;">
        <tr>
          <td style="${labelStyle}">Encomenda:</td>
          <td style="text-align: right; ${valueStyle}; color: ${colors.primary};">${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">Data:</td>
          <td style="text-align: right; padding-top: 8px;">${formatDate(data.createdAt)}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">Total:</td>
          <td style="text-align: right; padding-top: 8px; ${valueStyle}">${formatCurrency(data.totalWithVat)}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">Pagamento:</td>
          <td style="text-align: right; padding-top: 8px;">
            ${getPaymentMethodLabel(data.paymentMethod)} - ${getPaymentStatusLabel(data.paymentStatus)}
          </td>
        </tr>
      </table>
    </div>

    <!-- Customer Info -->
    <h2 style="${h2Style}">CLIENTE</h2>
    <div style="${cardStyle}">
      <table style="width: 100%;">
        <tr>
          <td style="${labelStyle}">Nome:</td>
          <td style="text-align: right; font-weight: 600;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">Email:</td>
          <td style="text-align: right; padding-top: 8px;">
            <a href="mailto:${data.customerEmail}" style="color: ${colors.primary};">${data.customerEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">Telefone:</td>
          <td style="text-align: right; padding-top: 8px;">
            <a href="tel:${data.customerPhone}" style="color: ${colors.primary};">${data.customerPhone}</a>
          </td>
        </tr>
        ${
          data.companyName
            ? `
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">Empresa:</td>
          <td style="text-align: right; padding-top: 8px;">${data.companyName}</td>
        </tr>
        `
            : ""
        }
        ${
          data.taxId
            ? `
        <tr>
          <td style="${labelStyle}; padding-top: 8px;">NIF:</td>
          <td style="text-align: right; padding-top: 8px;">${data.taxId}</td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <!-- Shipping Address -->
    <h2 style="${h2Style}">MORADA DE ENVIO</h2>
    <div style="${cardStyle}">
      <p style="margin: 0;">
        ${data.shippingAddress.address_line_1}<br>
        ${data.shippingAddress.address_line_2 ? data.shippingAddress.address_line_2 + "<br>" : ""}
        ${data.shippingAddress.postal_code} ${data.shippingAddress.city}<br>
        ${data.shippingAddress.country}
      </p>
    </div>

    <!-- Order Items -->
    <h2 style="${h2Style}">ITENS</h2>
    <table style="width: 100%; border-collapse: collapse; background: ${colors.bgMuted};">
      <thead>
        <tr style="background: ${colors.bgDark}; color: ${colors.textLight};">
          <th style="padding: 12px 8px; text-align: left; font-size: 12px;">Produto</th>
          <th style="padding: 12px 8px; text-align: center; font-size: 12px;">Qtd</th>
          <th style="padding: 12px 8px; text-align: right; font-size: 12px;">Unit.</th>
          <th style="padding: 12px 8px; text-align: right; font-size: 12px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 8px; text-align: right; ${mutedTextStyle}">Subtotal:</td>
          <td style="padding: 8px; text-align: right; font-family: ${fonts.mono};">${formatCurrency(data.subtotalWithVat)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px; text-align: right; ${mutedTextStyle}">Envio:</td>
          <td style="padding: 8px; text-align: right; font-family: ${fonts.mono};">
            ${data.shippingCostWithVat === 0 ? "Grátis" : formatCurrency(data.shippingCostWithVat)}
          </td>
        </tr>
        <tr style="background: ${colors.bgDark}; color: ${colors.textLight};">
          <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600;">TOTAL:</td>
          <td style="padding: 12px 8px; text-align: right; font-size: 18px; font-weight: 700;">${formatCurrency(data.totalWithVat)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Notes -->
    ${
      data.notes
        ? `
    <h2 style="${h2Style}">NOTAS DO CLIENTE</h2>
    <div style="${cardStyle}">
      <p style="margin: 0; white-space: pre-wrap;">${data.notes}</p>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div style="${footerStyle}">
      <p style="margin: 0; font-size: 12px;">
        Este é um email automático do sistema Jocril Store.
      </p>
    </div>
  </div>
</body>
</html>
  `
}
