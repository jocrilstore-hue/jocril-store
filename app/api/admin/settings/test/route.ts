import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import { testConnection, type OpenRouterConfig } from "@/lib/openrouter";

export async function POST() {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    // Get API settings
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["openrouter_api_key", "openrouter_model"]);

    const apiKey = settings?.find((s) => s.key === "openrouter_api_key")?.value;
    const model =
      settings?.find((s) => s.key === "openrouter_model")?.value ||
      "google/gemini-2.5-flash-preview-09-2025";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Chave API não configurada" },
        { status: 400 },
      );
    }

    const config: OpenRouterConfig = { apiKey, model };
    const success = await testConnection(config);

    if (success) {
      return NextResponse.json({ success: true, model });
    } else {
      return NextResponse.json(
        { success: false, error: "Falha na conexão. Verifique a chave API." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Failed to test connection:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
