import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import { shippingClassSchema } from "@/lib/validations/shipping";

/**
 * GET /api/admin/shipping/classes
 * Returns all shipping classes
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_classes")
      .select("*")
      .order("max_weight_grams", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching shipping classes:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar classes de envio" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping/classes
 * Creates a new shipping class
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const validation = shippingClassSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_classes")
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Já existe uma classe com este código" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping class:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar classe de envio" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/shipping/classes
 * Updates an existing shipping class
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
        { success: false, error: "ID da classe é obrigatório" },
        { status: 400 }
      );
    }

    const validation = shippingClassSchema.safeParse(updateData);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_classes")
      .update(validation.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Já existe uma classe com este código" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating shipping class:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar classe de envio" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipping/classes?id=1
 * Deletes a shipping class
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
        { success: false, error: "ID da classe é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("shipping_classes")
      .delete()
      .eq("id", parseInt(id, 10));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping class:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar classe de envio" },
      { status: 500 }
    );
  }
}
