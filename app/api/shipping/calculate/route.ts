import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shippingCalculationSchema } from "@/lib/validations/shipping";
import type { ShippingCalculationResult } from "@/lib/types/shipping";

/**
 * POST /api/shipping/calculate
 * Calculates shipping cost for a cart
 * Public route - no auth required
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const validation = shippingCalculationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        } as ShippingCalculationResult,
        { status: 400 }
      );
    }

    const { cart_items, postal_code } = validation.data;

    // Call the database function to calculate shipping
    const { data, error } = await supabase.rpc("fn_calculate_shipping", {
      p_cart_items: JSON.stringify(cart_items),
      p_postal_code: postal_code,
    });

    if (error) {
      console.error("Shipping calculation error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao calcular o envio. Por favor, tente novamente.",
        } as ShippingCalculationResult,
        { status: 500 }
      );
    }

    // The function returns JSONB, parse it
    const result = typeof data === "string" ? JSON.parse(data) : data;

    if (!result.success) {
      return NextResponse.json(result as ShippingCalculationResult, { status: 400 });
    }

    return NextResponse.json(result as ShippingCalculationResult);
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao calcular o envio. Por favor, tente novamente.",
      } as ShippingCalculationResult,
      { status: 500 }
    );
  }
}
