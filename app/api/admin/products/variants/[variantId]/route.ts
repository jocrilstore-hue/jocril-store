import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { z } from "zod"

// Validation schema for variant update
const updateVariantSchema = z.object({
  product_template_id: z.number().int().positive(),
  size_format_id: z.number().int().positive(),
  sku: z.string().min(3).max(50),
  url_slug: z.string().min(3).max(255),
  base_price_excluding_vat: z.number().positive(),
  base_price_including_vat: z.number().positive(),
  stock_quantity: z.number().int().min(0).optional(),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "discontinued"]).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  specific_description: z.string().nullable().optional(),
  ideal_for: z.string().nullable().optional(),
  main_image_url: z.string().nullable().optional(),
  custom_width_mm: z.number().nullable().optional(),
  custom_height_mm: z.number().nullable().optional(),
  custom_depth_mm: z.number().nullable().optional(),
  specifications_json: z.any().nullable().optional(),
  min_order_quantity: z.number().int().min(1).optional(),
  technical_image_url: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
  display_order: z.number().nullable().optional(),
  orientation: z.enum(["horizontal", "vertical", "both"]).nullable().optional(),
})

interface RouteParams {
  params: { variantId: string } | Promise<{ variantId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  
  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const resolvedParams = await Promise.resolve(params)
  const variantId = Number(resolvedParams.variantId)

  if (Number.isNaN(variantId)) {
    return NextResponse.json({ error: "ID de variante inválido" }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("id", variantId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Variante não encontrada" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.exception(error, { route: "/api/admin/products/variants/[variantId]", method: "GET", variantId })
    return NextResponse.json({ error: "Erro ao carregar variante" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  
  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const resolvedParams = await Promise.resolve(params)
  const variantId = Number(resolvedParams.variantId)

  if (Number.isNaN(variantId)) {
    return NextResponse.json({ error: "ID de variante inválido" }, { status: 400 })
  }

  try {
    const body = await request.json()
    
    // Validate the payload
    const validationResult = updateVariantSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const payload = validationResult.data
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("product_variants")
      .update(payload)
      .eq("id", variantId)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        const field = error.message.includes("sku") ? "SKU" : 
                     error.message.includes("url_slug") ? "URL Slug" : "campo"
        return NextResponse.json(
          { error: `${field} já existe. Por favor escolha outro.` },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.exception(error, { route: "/api/admin/products/variants/[variantId]", method: "PUT", variantId })
    return NextResponse.json({ error: "Erro ao atualizar variante" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  
  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const resolvedParams = await Promise.resolve(params)
  const variantId = Number(resolvedParams.variantId)

  if (Number.isNaN(variantId)) {
    return NextResponse.json({ error: "ID de variante inválido" }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.exception(error, { route: "/api/admin/products/variants/[variantId]", method: "DELETE", variantId })
    return NextResponse.json({ error: "Erro ao eliminar variante" }, { status: 500 })
  }
}
