import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "geral@jocril.pt"

export { EMAIL_FROM, ADMIN_EMAIL }

interface SendEmailParams {
  to: string
  subject: string
  html: string
  orderId?: number
  customerId?: number
  emailType: string
}

interface SendEmailResult {
  success: boolean
  resendId?: string
  error?: string
}

/**
 * Send email via Resend and log to database
 */
export async function sendEmail({
  to,
  subject,
  html,
  orderId,
  customerId,
  emailType,
}: SendEmailParams): Promise<SendEmailResult> {
  let resendId: string | undefined
  let errorMessage: string | undefined
  let success = false

  try {
    const { data, error } = await resend.emails.send({
      from: `Jocril Acrílicos <${EMAIL_FROM}>`,
      to: [to],
      subject,
      html,
    })

    if (error) {
      errorMessage = error.message
      console.error(`Email send error (${emailType}):`, error)
    } else if (data?.id) {
      resendId = data.id
      success = true
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error(`Email exception (${emailType}):`, err)
  }

  // Log to database (don't fail if logging fails)
  try {
    const supabase = await createClient()
    await supabase.from("email_logs").insert({
      order_id: orderId || null,
      customer_id: customerId || null,
      email_type: emailType,
      recipient_email: to,
      subject,
      resend_id: resendId || null,
      status: success ? "sent" : "failed",
      error_message: errorMessage || null,
    })
  } catch (logError) {
    console.error("Failed to log email:", logError)
  }

  return { success, resendId, error: errorMessage }
}

/**
 * Send email to admin
 */
export async function sendAdminEmail({
  subject,
  html,
  orderId,
}: {
  subject: string
  html: string
  orderId?: number
}): Promise<SendEmailResult> {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
    orderId,
    emailType: "admin_notification",
  })
}
