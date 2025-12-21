import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ShippingZone } from "@/lib/types/shipping";

/**
 * GET /api/shipping/zones
 * Returns active shipping zones for public display
 * Public route - no auth required
 */
export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_zones")
      .select("id, code, name, free_shipping_threshold_cents, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    // Format for public display
    const zones = (data || []).map((zone) => ({
      id: zone.id,
      code: zone.code,
      name: zone.name,
      freeShippingThreshold: zone.free_shipping_threshold_cents
        ? zone.free_shipping_threshold_cents / 100
        : null,
      hasFreeShipping: zone.free_shipping_threshold_cents !== null,
    }));

    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    console.error("Error fetching shipping zones:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar zonas de envio" },
      { status: 500 }
    );
  }
}
