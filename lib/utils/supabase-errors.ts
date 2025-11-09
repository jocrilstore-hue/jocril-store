import type { PostgrestError } from "@supabase/supabase-js"

/**
 * User-friendly error messages mapped from Supabase/PostgreSQL error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  // PostgreSQL error codes
  "23505": "Este item já existe. Por favor, use um valor único.",
  "23503": "Não é possível realizar esta operação devido a dependências existentes.",
  "23502": "Campo obrigatório não foi preenchido.",
  "22001": "O texto inserido é muito longo para este campo.",
  "22003": "O número inserido está fora do intervalo permitido.",
  "22P02": "Formato de dados inválido.",
  "42P01": "Tabela não encontrada. Por favor, contacte o suporte.",
  "42703": "Coluna não encontrada. Por favor, contacte o suporte.",

  // Custom error codes (can be added from database triggers/functions)
  PGRST116: "A consulta retornou mais resultados do que o esperado.",
  PGRST301: "Não foi possível processar a sua solicitação.",

  // Supabase specific
  "404": "Item não encontrado.",
  "409": "Conflito: este item já existe.",
  "403": "Você não tem permissão para realizar esta ação.",
  "401": "Você precisa fazer login para realizar esta ação.",
}

/**
 * Specific field-level error messages
 */
const FIELD_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  slug: {
    "23505": "Este slug já está em uso. Por favor, escolha outro.",
  },
  sku: {
    "23505": "Este SKU já está em uso. Por favor, escolha outro.",
  },
  url_slug: {
    "23505": "Este URL slug já está em uso. Por favor, escolha outro.",
  },
  email: {
    "23505": "Este email já está cadastrado.",
  },
}

/**
 * Parse Supabase error and return user-friendly message
 */
export function parseSupabaseError(error: PostgrestError | Error | null | undefined): string {
  if (!error) {
    return "Ocorreu um erro desconhecido."
  }

  // If it's a regular Error object
  if (error instanceof Error && !("code" in error)) {
    return error.message || "Ocorreu um erro ao processar a solicitação."
  }

  // Cast to PostgrestError
  const pgError = error as PostgrestError

  // Check for specific error code
  if (pgError.code) {
    // Check for field-specific messages
    if (pgError.details) {
      const fieldMatch = pgError.details.match(/Key \(([^)]+)\)/)
      if (fieldMatch) {
        const field = fieldMatch[1]
        if (FIELD_ERROR_MESSAGES[field]?.[pgError.code]) {
          return FIELD_ERROR_MESSAGES[field][pgError.code]
        }
      }
    }

    // Return generic error for the code
    if (ERROR_MESSAGES[pgError.code]) {
      return ERROR_MESSAGES[pgError.code]
    }
  }

  // Fallback to error message if available
  if (pgError.message) {
    return pgError.message
  }

  return "Ocorreu um erro ao processar a solicitação."
}

/**
 * Extract detailed error information for logging/debugging
 */
export interface DetailedError {
  message: string
  code?: string
  details?: string
  hint?: string
  originalError: unknown
}

export function getDetailedError(error: unknown): DetailedError {
  const pgError = error as PostgrestError

  return {
    message: parseSupabaseError(pgError),
    code: pgError?.code,
    details: pgError?.details,
    hint: pgError?.hint,
    originalError: error,
  }
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueViolation(error: unknown): boolean {
  const pgError = error as PostgrestError
  return pgError?.code === "23505"
}

/**
 * Check if error is a foreign key violation
 */
export function isForeignKeyViolation(error: unknown): boolean {
  const pgError = error as PostgrestError
  return pgError?.code === "23503"
}

/**
 * Check if error is a not-null violation
 */
export function isNotNullViolation(error: unknown): boolean {
  const pgError = error as PostgrestError
  return pgError?.code === "23502"
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  const pgError = error as PostgrestError
  return pgError?.code === "403" || pgError?.message?.toLowerCase().includes("permission")
}

/**
 * Extract constraint name from unique violation error
 */
export function getConstraintName(error: unknown): string | null {
  const pgError = error as PostgrestError
  if (pgError?.code !== "23505") return null

  const match = pgError.details?.match(/Key \(([^)]+)\)/)
  return match ? match[1] : null
}

/**
 * Format error for toast notification
 */
export interface ToastError {
  title: string
  description: string
  variant: "destructive" | "default"
}

export function formatErrorForToast(error: unknown, fallbackTitle: string = "Erro"): ToastError {
  const detailed = getDetailedError(error)

  let title = fallbackTitle
  let description = detailed.message

  // Customize title based on error type
  if (isUniqueViolation(error)) {
    title = "Item duplicado"
  } else if (isForeignKeyViolation(error)) {
    title = "Não é possível excluir"
    description = "Este item está sendo usado em outros locais. Remova as dependências primeiro."
  } else if (isNotNullViolation(error)) {
    title = "Campo obrigatório"
    description = "Preencha todos os campos obrigatórios."
  } else if (isPermissionError(error)) {
    title = "Sem permissão"
    description = "Você não tem permissão para realizar esta ação."
  }

  return {
    title,
    description,
    variant: "destructive",
  }
}

/**
 * Log error to console (development) or error tracking service (production)
 */
export function logError(error: unknown, context?: string): void {
  const detailed = getDetailedError(error)

  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "Error"}]`, {
      message: detailed.message,
      code: detailed.code,
      details: detailed.details,
      hint: detailed.hint,
      error: detailed.originalError,
    })
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    // Sentry.captureException(detailed.originalError, {
    //   tags: { context },
    //   extra: { ...detailed },
    // })
    console.error(`[${context || "Error"}]`, detailed.message)
  }
}

/**
 * Handle async operation with error catching and toast
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    successMessage?: string
    errorTitle?: string
    onSuccess?: (result: T) => void
    onError?: (error: unknown) => void
    showToast?: (toast: ToastError | { title: string; description: string }) => void
  } = {},
): Promise<{ success: boolean; data?: T; error?: unknown }> {
  try {
    const result = await operation()

    if (options.successMessage && options.showToast) {
      options.showToast({
        title: "Sucesso",
        description: options.successMessage,
      })
    }

    options.onSuccess?.(result)

    return { success: true, data: result }
  } catch (error) {
    logError(error, "AsyncOperation")

    if (options.showToast) {
      const toastError = formatErrorForToast(error, options.errorTitle)
      options.showToast(toastError)
    }

    options.onError?.(error)

    return { success: false, error }
  }
}
