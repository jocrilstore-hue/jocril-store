import {
  colors,
  containerStyle,
  headerStyle,
  logoStyle,
  h1Style,
  cardStyle,
  mutedTextStyle,
  labelStyle,
  valueStyle,
  footerStyle,
  fonts,
} from "./styles"

interface PaymentReceivedData {
  orderNumber: string
  customerName: string
  totalWithVat: number
  paidAt: string
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + "€"
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function renderPaymentReceived(data: PaymentReceivedData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - Jocril</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5;">
  <div style="${containerStyle}">
    <!-- Header -->
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">JOCRIL</h1>
      <p style="${mutedTextStyle}; margin: 8px 0 0 0;">Acrílicos de Qualidade</p>
    </div>

    <!-- Success Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="
        width: 80px;
        height: 80px;
        background-color: ${colors.primary};
        border-radius: 50%;
        margin: 0 auto 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="font-size: 40px; color: white;">✓</span>
      </div>
      <h1 style="${h1Style}; color: ${colors.primary};">Pagamento Confirmado!</h1>
    </div>

    <!-- Message -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 16px; margin: 0;">
        Olá ${data.customerName}, o seu pagamento foi recebido com sucesso.
      </p>
    </div>

    <!-- Payment Details -->
    <div style="${cardStyle}">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; ${labelStyle}">Encomenda:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${colors.primary};">${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; ${labelStyle}">Valor pago:</td>
          <td style="padding: 8px 0; text-align: right; ${valueStyle}">${formatCurrency(data.totalWithVat)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; ${labelStyle}">Data:</td>
          <td style="padding: 8px 0; text-align: right;">${formatDate(data.paidAt)}</td>
        </tr>
      </table>
    </div>

    <!-- Next Steps -->
    <div style="margin-top: 32px; text-align: center;">
      <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
        O que acontece agora?
      </h2>
      <div style="${cardStyle}; text-align: left;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px; vertical-align: top; width: 30px; color: ${colors.primary}; font-weight: 600;">1.</td>
            <td style="padding: 8px;">A sua encomenda está a ser preparada pela nossa equipa</td>
          </tr>
          <tr>
            <td style="padding: 8px; vertical-align: top; width: 30px; color: ${colors.primary}; font-weight: 600;">2.</td>
            <td style="padding: 8px;">Receberá uma notificação quando for expedida</td>
          </tr>
          <tr>
            <td style="padding: 8px; vertical-align: top; width: 30px; color: ${colors.primary}; font-weight: 600;">3.</td>
            <td style="padding: 8px;">Entrega estimada: 2-5 dias úteis</td>
          </tr>
        </table>
      </div>
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
