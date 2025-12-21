import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import { shippingRateSchemaWithRefinement } from "@/lib/validations/shipping";

/**
 * GET /api/admin/shipping/rates
 * Returns all shipping rates with zone and class info
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const zoneId = searchParams.get("zone_id");
  const classId = searchParams.get("class_id");

  try {
    let query = supabase
      .from("shipping_rates")
      .select("*, shipping_zones(*), shipping_classes(*)")
      .order("zone_id", { ascending: true })
      .order("class_id", { ascending: true })
      .order("min_weight_grams", { ascending: true });

    if (zoneId) {
      query = query.eq("zone_id", parseInt(zoneId, 10));
    }
    if (classId) {
      query = query.eq("class_id", parseInt(classId, 10));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar taxas de envio" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping/rates
 * Creates a new shipping rate
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const validation = shippingRateSchemaWithRefinement.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_rates")
      .insert(validation.data)
      .select("*, shipping_zones(*), shipping_classes(*)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Já existe uma taxa para esta combinação de zona, classe e peso" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping rate:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar taxa de envio" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/shipping/rates
 * Updates an existing shipping rate
 */
export async function PUT(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da taxa é obrigatório" },
        { status: 400 }
      );
    }

    const validation = shippingRateSchemaWithRefinement.safeParse(updateData);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_rates")
      .update(validation.data)
      .eq("id", id)
      .select("*, shipping_zones(*), shipping_classes(*)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Já existe uma taxa para esta combinação de zona, classe e peso" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating shipping rate:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar taxa de envio" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipping/rates?id=1
 * Deletes a shipping rate
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da taxa é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("shipping_rates")
      .delete()
      .eq("id", parseInt(id, 10));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping rate:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar taxa de envio" },
      { status: 500 }
    );
  }
}
