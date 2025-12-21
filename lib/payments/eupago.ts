import { z } from "zod"

// Environment validation
const EUPAGO_API_KEY = process.env.EUPAGO_API_KEY
const EUPAGO_BASE_URL = process.env.EUPAGO_BASE_URL || "https://clientes.eupago.pt"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jocril-store.vercel.app"
const WEBHOOK_URL = `${SITE_URL}/api/webhooks/eupago`

// Response schemas
const multibancoResponseSchema = z.object({
  sucesso: z.boolean(),
  estado: z.number(),
  resposta: z.string(),
  referencia: z.string().optional(),
  entidade: z.string().optional(),
  valor: z.number().optional(),
})

const mbwayResponseSchema = z.object({
  sucesso: z.boolean(),
  estado: z.number(),
  resposta: z.string(),
  referencia: z.string().optional(),
  valor: z.number().optional(),
})

// Callback schema (what EuPago sends to our webhook)
export const eupagoCallbackSchema = z.object({
  valor: z.coerce.number(),
  canal: z.string(),
  referencia: z.string(),
  transacao: z.string(),
  identificador: z.string(),
  mp: z.string().optional(),
  data: z.string(),
  entidade: z.string().optional(),
  chave_api: z.string().optional(),
})

export type EuPagoCallback = z.infer<typeof eupagoCallbackSchema>

// Error types
export class EuPagoError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: string
  ) {
    super(message)
    this.name = "EuPagoError"
  }
}

// Types
export interface MultibancoResult {
  entity: string
  reference: string
  amount: number
  deadline: Date
}

export interface MBWayResult {
  reference: string
  amount: number
}

/**
 * Format date for EuPago API (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Format reference with spaces for display (123 456 789)
 */
export function formatReference(reference: string): string {
  return reference.replace(/(\d{3})(?=\d)/g, "$1 ")
}

/**
 * Validate Portuguese mobile phone number
 * Must be 9 digits starting with 91, 92, 93, or 96
 * Also handles numbers with country code prefix (351)
 */
export function validatePhoneNumber(phone: string): boolean {
  let cleaned = phone.replace(/\D/g, "")
  // Remove Portuguese country code if present (351)
  if (cleaned.startsWith("351") && cleaned.length > 9) {
    cleaned = cleaned.substring(3)
  }
  return /^9[1236]\d{7}$/.test(cleaned)
}

/**
 * Format phone for EuPago (add 351 prefix)
 * Handles numbers with or without country code
 */
export function formatPhoneForEuPago(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  // Remove country code if already present to avoid duplication
  if (cleaned.startsWith("351") && cleaned.length > 9) {
    cleaned = cleaned.substring(3)
  }
  return `351${cleaned}`
}

/**
 * Mask phone number for display (912***678)
 */
export function maskPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  // Remove country code if present for consistent masking
  if (cleaned.startsWith("351") && cleaned.length > 9) {
    cleaned = cleaned.substring(3)
  }
  if (cleaned.length < 9) return phone
  return `${cleaned.slice(0, 3)}***${cleaned.slice(-3)}`
}

/**
 * Create Multibanco payment reference
 */
export async function createMultibancoReference(
  orderId: string,
  amount: number,
  deadlineHours: number = 24
): Promise<MultibancoResult> {
  if (!EUPAGO_API_KEY) {
    throw new EuPagoError("Configuração de pagamento em falta", 500)
  }

  const now = new Date()
  const deadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000)

  const payload = {
    chave: EUPAGO_API_KEY,
    valor: Number(amount.toFixed(2)),
    id: orderId,
    per_dup: 0, // Não permitir duplicados
    data_inicio: formatDate(now),
    data_fim: formatDate(deadline),
    callback: WEBHOOK_URL,
  }

  try {
    const response = await fetch(
      `${EUPAGO_BASE_URL}/clientes/rest_api/multibanco/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      throw new EuPagoError(
        "Erro ao comunicar com o serviço de pagamento",
        response.status
      )
    }

    const data = await response.json()
    const parsed = multibancoResponseSchema.safeParse(data)

    if (!parsed.success) {
      console.error("Invalid EuPago response:", data)
      throw new EuPagoError("Resposta inválida do serviço de pagamento")
    }

    if (!parsed.data.sucesso || !parsed.data.referencia || !parsed.data.entidade) {
      throw new EuPagoError(
        parsed.data.resposta || "Erro ao gerar referência Multibanco",
        parsed.data.estado
      )
    }

    return {
      entity: parsed.data.entidade,
      reference: parsed.data.referencia,
      amount: parsed.data.valor || amount,
      deadline,
    }
  } catch (error) {
    if (error instanceof EuPagoError) throw error
    console.error("EuPago Multibanco error:", error)
    throw new EuPagoError("Erro ao processar pagamento. Tente novamente.")
  }
}

/**
 * Create MB Way payment request
 * Uses EuPago API v1.02 format with customerPhone and countryCode as separate fields
 */
export async function createMBWayPayment(
  orderId: string,
  amount: number,
  phoneNumber: string
): Promise<MBWayResult> {
  if (!EUPAGO_API_KEY) {
    throw new EuPagoError("Configuração de pagamento em falta", 500)
  }

  // Log the incoming phone number for debugging
  console.log("MB Way payment - Input phone:", phoneNumber)
  
  if (!validatePhoneNumber(phoneNumber)) {
    console.error("MB Way validation failed for phone:", phoneNumber)
    throw new EuPagoError("Número de telemóvel inválido. Use formato 9XXXXXXXX")
  }

  // Clean the phone number (remove country code if present)
  let cleanedPhone = phoneNumber.replace(/\D/g, "")
  if (cleanedPhone.startsWith("351") && cleanedPhone.length > 9) {
    cleanedPhone = cleanedPhone.substring(3)
  }
  
  console.log("MB Way payment - Cleaned phone:", cleanedPhone)

  // New EuPago API v1.02 format
  const payload = {
    payment: {
      identifier: orderId,
      amount: {
        value: Number(amount.toFixed(2)),
        currency: "EUR",
      },
      customerPhone: cleanedPhone,
      countryCode: "+351",
      successUrl: `${SITE_URL}/checkout/sucesso`,
      failUrl: `${SITE_URL}/checkout`,
      backUrl: `${SITE_URL}/carrinho`,
      lang: "PT",
    },
    customer: {
      notify: true,
    },
  }

  // Log the payload (sanitized)
  console.log("MB Way payment - Payload:", JSON.stringify(payload, null, 2))

  try {
    // Use the new API v1.02 endpoint
    const apiUrl = EUPAGO_BASE_URL.includes("sandbox") 
      ? "https://sandbox.eupago.pt/api/v1.02/mbway/create"
      : "https://clientes.eupago.pt/api/v1.02/mbway/create"
    
    console.log("MB Way payment - Using URL:", apiUrl)
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${EUPAGO_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    
    // Log the full response for debugging
    console.log("MB Way payment - EuPago response:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error("MB Way API error response:", data)
      throw new EuPagoError(
        data.message || data.resposta || "Erro ao comunicar com o serviço de pagamento",
        response.status
      )
    }

    // Handle new API response format
    if (data.transactionStatus === "Success" || data.sucesso === true) {
      return {
        reference: data.reference || data.referencia || orderId,
        amount: data.amount?.value || data.valor || amount,
      }
    }

    // Handle error in response
    console.error("MB Way payment failed:", data)
    throw new EuPagoError(
      data.message || data.resposta || "Erro ao iniciar pagamento MB Way",
      data.transactionStatus || data.estado
    )
  } catch (error) {
    if (error instanceof EuPagoError) throw error
    console.error("EuPago MB Way error:", error)
    throw new EuPagoError("Erro ao processar pagamento. Tente novamente.")
  }
}

/**
 * Verify callback is from EuPago (basic validation)
 * In production, you might want to verify the chave_api matches
 */
export function verifyCallback(payload: unknown): EuPagoCallback | null {
  const parsed = eupagoCallbackSchema.safeParse(payload)
  if (!parsed.success) {
    console.error("Invalid EuPago callback:", payload, parsed.error)
    return null
  }
  return parsed.data
}
