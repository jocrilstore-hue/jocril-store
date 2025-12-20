import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { z } from "zod"

// Validation schema for variant creation
const createVariantSchema = z.object({
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

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  try {
    const body = await request.json()
    
    // Validate the payload
    const validationResult = createVariantSchema.safeParse(body)
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
      .insert(payload)
      .select("id")
      .single()

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        const errorMessage = error.message || ""
        const field = errorMessage.includes("sku") ? "SKU" : 
                     errorMessage.includes("url_slug") ? "URL Slug" : 
                     errorMessage.includes("size_format") ? "Formato" : "campo"
        return NextResponse.json(
          { error: `${field} já existe. Por favor escolha outro.` },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.exception(error, { route: "/api/admin/products/variants", method: "POST" })
    return NextResponse.json({ error: "Erro ao criar variante" }, { status: 500 })
  }
}
