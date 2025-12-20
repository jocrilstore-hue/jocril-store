import {
  colors,
  containerStyle,
  headerStyle,
  logoStyle,
  h1Style,
  h2Style,
  cardStyle,
  highlightBoxStyle,
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

interface ShippingAddress {
  address_line_1: string
  address_line_2?: string | null
  city: string
  postal_code: string
  country: string
}

interface PaymentInfo {
  method: "multibanco" | "mbway" | null
  entity?: string | null
  reference?: string | null
  deadline?: string | null
}

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  items: OrderItem[]
  subtotalWithVat: number
  shippingCostWithVat: number
  totalWithVat: number
  shippingAddress: ShippingAddress
  payment: PaymentInfo
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + "€"
}

function formatReference(ref: string): string {
  return ref.replace(/(\d{3})(?=\d)/g, "$1 ")
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function renderOrderConfirmation(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderLight};">
          <div style="font-weight: 500;">${item.product_name || "Produto"}</div>
          ${item.size_format ? `<div style="${mutedTextStyle}">${item.size_format}</div>` : ""}
          ${item.product_sku ? `<div style="${labelStyle}">SKU: ${item.product_sku}</div>` : ""}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderLight}; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderLight}; text-align: right; font-family: ${fonts.mono};">
          ${formatCurrency(item.line_total_with_vat)}
        </td>
      </tr>
    `
    )
    .join("")

  const paymentHtml =
    data.payment.method === "multibanco" && data.payment.entity && data.payment.reference
      ? `
      <div style="${highlightBoxStyle}">
        <div style="${labelStyle}; margin-bottom: 16px;">DADOS PARA PAGAMENTO MULTIBANCO</div>

        <table style="width: 100%; margin: 0 auto; max-width: 300px;">
          <tr>
            <td style="padding: 8px 0; text-align: left; ${labelStyle}">Entidade:</td>
            <td style="padding: 8px 0; text-align: right; ${valueStyle}">${data.payment.entity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; text-align: left; ${labelStyle}">Referência:</td>
            <td style="padding: 8px 0; text-align: right; ${valueStyle}">${formatReference(data.payment.reference)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; text-align: left; ${labelStyle}">Valor:</td>
            <td style="padding: 8px 0; text-align: right; ${valueStyle}; color: ${colors.primary};">${formatCurrency(data.totalWithVat)}</td>
          </tr>
          ${
            data.payment.deadline
              ? `
          <tr>
            <td style="padding: 8px 0; text-align: left; ${labelStyle}">Prazo:</td>
            <td style="padding: 8px 0; text-align: right; font-size: 14px;">${formatDeadline(data.payment.deadline)}</td>
          </tr>
          `
              : ""
          }
        </table>

        <div style="margin-top: 16px; ${mutedTextStyle}">
          Pague via homebanking ou caixa multibanco
        </div>
      </div>
    `
      : data.payment.method === "mbway"
        ? `
      <div style="${cardStyle}; text-align: center;">
        <div style="${labelStyle}; margin-bottom: 12px;">PAGAMENTO MB WAY</div>
        <p style="margin: 0;">
          O pagamento será confirmado após aprovar o pedido no seu telemóvel.
        </p>
      </div>
    `
        : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Encomenda - Jocril</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5;">
  <div style="${containerStyle}">
    <!-- Header -->
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">JOCRIL</h1>
      <p style="${mutedTextStyle}; margin: 8px 0 0 0;">Acrílicos de Qualidade</p>
    </div>

    <!-- Main Content -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="${h1Style}">Obrigado pela sua encomenda!</h1>
      <p style="${mutedTextStyle}">
        Olá ${data.customerName}, a sua encomenda foi recebida com sucesso.
      </p>
    </div>

    <!-- Order Number -->
    <div style="${cardStyle}; text-align: center;">
      <div style="${labelStyle}">NÚMERO DA ENCOMENDA</div>
      <div style="${valueStyle}; margin-top: 8px; color: ${colors.primary};">${data.orderNumber}</div>
    </div>

    <!-- Payment Info -->
    ${paymentHtml}

    <!-- Order Items -->
    <h2 style="${h2Style}">ITENS DA ENCOMENDA</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid ${colors.borderLight};">
          <th style="text-align: left; padding: 8px 0; ${labelStyle}">Produto</th>
          <th style="text-align: center; padding: 8px 0; ${labelStyle}">Qtd</th>
          <th style="text-align: right; padding: 8px 0; ${labelStyle}">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="margin-top: 24px; text-align: right;">
      <table style="margin-left: auto;">
        <tr>
          <td style="padding: 4px 16px 4px 0; ${mutedTextStyle}">Subtotal:</td>
          <td style="padding: 4px 0; font-family: ${fonts.mono};">${formatCurrency(data.subtotalWithVat)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 16px 4px 0; ${mutedTextStyle}">Envio:</td>
          <td style="padding: 4px 0; font-family: ${fonts.mono};">
            ${data.shippingCostWithVat === 0 ? '<span style="color: ' + colors.primary + ';">Grátis</span>' : formatCurrency(data.shippingCostWithVat)}
          </td>
        </tr>
        <tr style="border-top: 1px solid ${colors.borderLight};">
          <td style="padding: 12px 16px 4px 0; font-weight: 600;">Total:</td>
          <td style="padding: 12px 0 4px 0; ${valueStyle}; color: ${colors.primary};">${formatCurrency(data.totalWithVat)}</td>
        </tr>
      </table>
      <div style="${mutedTextStyle}; font-size: 12px; margin-top: 4px;">IVA incluído</div>
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

    <!-- Footer -->
    <div style="${footerStyle}">
      <p style="margin: 0 0 8px 0;">
        Dúvidas? Contacte-nos:
      </p>
      <p style="margin: 0;">
        <a href="mailto:geral@jocril.pt" style="color: ${colors.primary};">geral@jocril.pt</a>
        &nbsp;|&nbsp;
        <a href="tel:+351214718903" style="color: ${colors.primary};">(+351) 21 471 89 03</a>
      </p>
      <p style="margin: 16px 0 0 0; font-size: 12px;">
        © ${new Date().getFullYear()} Jocril Acrílicos. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `
}
