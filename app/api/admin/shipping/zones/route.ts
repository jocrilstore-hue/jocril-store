import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import { shippingZoneSchemaWithRefinement } from "@/lib/validations/shipping";
import type { ShippingZone } from "@/lib/types/shipping";

/**
 * GET /api/admin/shipping/zones
 * Returns all shipping zones with their rates count
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_zones")
      .select("*, shipping_rates(count)")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching shipping zones:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar zonas de envio" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping/zones
 * Creates a new shipping zone
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const validation = shippingZoneSchemaWithRefinement.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_zones")
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Já existe uma zona com este código" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping zone:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar zona de envio" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/shipping/zones
 * Updates an existing shipping zone
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
        { success: false, error: "ID da zona é obrigatório" },
        { status: 400 }
      );
    }

    const validation = shippingZoneSchemaWithRefinement.safeParse(updateData);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_zones")
      .update(validation.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Já existe uma zona com este código" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating shipping zone:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar zona de envio" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipping/zones?id=1
 * Deletes a shipping zone
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
        { success: false, error: "ID da zona é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("shipping_zones")
      .delete()
      .eq("id", parseInt(id, 10));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping zone:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar zona de envio" },
      { status: 500 }
    );
  }
}
