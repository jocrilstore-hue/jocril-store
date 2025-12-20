import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";

interface TierConfig {
  min_value: number;
  discount_pct: number;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId || !(await userIsAdmin())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    const body = await request.json();
    const tiers: TierConfig[] = body.tiers;

    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json(
        { error: "Escalões inválidos" },
        { status: 400 },
      );
    }

    // Sort tiers by min_value
    const sortedTiers = [...tiers].sort((a, b) => a.min_value - b.min_value);

    // Get all active variants with prices
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, base_price_including_vat")
      .eq("is_active", true)
      .gt("base_price_including_vat", 0);

    if (variantsError) {
      console.error("Error fetching variants:", variantsError);
      return NextResponse.json(
        { error: "Erro ao obter variantes" },
        { status: 500 },
      );
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma variante encontrada" },
        { status: 404 },
      );
    }

    // Delete all existing price tiers
    const { error: deleteError } = await supabase
      .from("price_tiers")
      .delete()
      .neq("id", 0); // Delete all

    if (deleteError) {
      console.error("Error deleting price tiers:", deleteError);
      return NextResponse.json(
        { error: "Erro ao limpar escalões existentes" },
        { status: 500 },
      );
    }

    // Helper function to round up to nice numbers
    const roundToNice = (qty: number): number => {
      if (qty <= 10) return qty;
      if (qty <= 50) return Math.ceil(qty / 5) * 5; // Round to nearest 5
      if (qty <= 100) return Math.ceil(qty / 10) * 10; // Round to nearest 10
      if (qty <= 500) return Math.ceil(qty / 20) * 20; // Round to nearest 20
      if (qty <= 1000) return Math.ceil(qty / 50) * 50; // Round to nearest 50
      return Math.ceil(qty / 100) * 100; // Round to nearest 100
    };

    // Helper function to round price to nearest 0.50€
    const roundPriceToHalf = (price: number): number => {
      return Math.round(price * 2) / 2;
    };

    // Generate new price tiers for each variant
    const allTiers: {
      product_variant_id: number;
      min_quantity: number;
      max_quantity: number | null;
      discount_percentage: number;
      price_per_unit: number;
      display_text: string;
    }[] = [];

    for (const variant of variants) {
      const basePrice = parseFloat(String(variant.base_price_including_vat));
      if (basePrice <= 0) continue;

      let prevMaxQty = 0;

      for (let i = 0; i < sortedTiers.length; i++) {
        const tier = sortedTiers[i];
        const rawMinQty = Math.ceil(tier.min_value / basePrice);
        const minQty = roundToNice(rawMinQty);

        // Skip if quantity threshold is same or lower than previous
        if (minQty <= prevMaxQty) continue;

        const discountPct = tier.discount_pct;
        const rawPrice = basePrice * (1 - discountPct / 100);
        const pricePerUnit = roundPriceToHalf(rawPrice);

        // Calculate max_quantity (rounded)
        let maxQty: number | null = null;
        if (i < sortedTiers.length - 1) {
          const rawNextMinQty = Math.ceil(
            sortedTiers[i + 1].min_value / basePrice,
          );
          const nextMinQty = roundToNice(rawNextMinQty);
          if (nextMinQty > minQty) {
            maxQty = nextMinQty - 1;
          }
        }

        allTiers.push({
          product_variant_id: variant.id,
          min_quantity: minQty,
          max_quantity: maxQty,
          discount_percentage: discountPct,
          price_per_unit: pricePerUnit,
          display_text: `${minQty} unidades`,
        });

        prevMaxQty = minQty;
      }
    }

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < allTiers.length; i += batchSize) {
      const batch = allTiers.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("price_tiers")
        .insert(batch);

      if (insertError) {
        console.error("Error inserting price tiers:", insertError);
        return NextResponse.json(
          { error: "Erro ao criar escalões" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      variantsUpdated: variants.length,
      tiersCreated: allTiers.length,
    });
  } catch (error) {
    console.error("Price tiers error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
