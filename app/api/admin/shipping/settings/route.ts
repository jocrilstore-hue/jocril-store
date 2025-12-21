import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import { shippingSettingSchema } from "@/lib/validations/shipping";

/**
 * GET /api/admin/shipping/settings
 * Returns all shipping settings
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_settings")
      .select("*")
      .order("setting_key", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar definições de envio" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/shipping/settings
 * Updates shipping settings (upsert)
 */
export async function PUT(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();

    // Handle both single setting and array of settings
    const settings = Array.isArray(body) ? body : [body];

    const validatedSettings = [];
    for (const setting of settings) {
      const validation = shippingSettingSchema.safeParse(setting);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0].message },
          { status: 400 }
        );
      }
      validatedSettings.push(validation.data);
    }

    const { data, error } = await supabase
      .from("shipping_settings")
      .upsert(validatedSettings, { onConflict: "setting_key" })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar definições de envio" },
      { status: 500 }
    );
  }
}
