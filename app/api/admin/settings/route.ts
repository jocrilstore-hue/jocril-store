import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"

// Mask API key to show only last 4 characters
function maskApiKey(key: string | null): string | null {
  if (!key) return null
  if (key.length <= 8) return "••••••••"
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("key, value, description")
      .in("key", ["openrouter_api_key", "openrouter_model"])

    if (error) throw error

    // Transform to object and mask API key
    const settings: Record<string, string | null> = {}
    for (const row of data || []) {
      if (row.key === "openrouter_api_key") {
        settings[row.key] = maskApiKey(row.value)
        settings["openrouter_api_key_configured"] = row.value ? "true" : "false"
      } else {
        settings[row.key] = row.value
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Erro ao carregar configurações" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { openrouter_api_key, openrouter_model } = body

    const updates: { key: string; value: string }[] = []

    // Only update API key if provided (not the masked version)
    if (openrouter_api_key && !openrouter_api_key.includes("•") && !openrouter_api_key.includes("...")) {
      updates.push({ key: "openrouter_api_key", value: openrouter_api_key })
    }

    if (openrouter_model) {
      updates.push({ key: "openrouter_model", value: openrouter_model })
    }

    // Upsert each setting
    for (const update of updates) {
      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          { key: update.key, value: update.value },
          { onConflict: "key" }
        )

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save settings:", error)
    return NextResponse.json({ error: "Erro ao guardar configurações" }, { status: 500 })
  }
}
