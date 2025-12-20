import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"
import type { SEOFix } from "../auto-fix/route"

export interface ApplyFixesRequest {
  fixes: SEOFix[]
}

export interface ApplyFixesResponse {
  applied: number
  errors: Array<{ issueId: string; error: string }>
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const supabase = await createClient()

  try {
    const body: ApplyFixesRequest = await request.json()
    const { fixes } = body

    if (!fixes || fixes.length === 0) {
      return NextResponse.json({ error: "Nenhuma correção fornecida" }, { status: 400 })
    }

    let applied = 0
    const errors: Array<{ issueId: string; error: string }> = []

    for (const fix of fixes) {
      try {
        if (fix.type === "missing_meta_description") {
          // Update template's SEO description
          const { error } = await supabase
            .from("product_templates")
            .update({
              seo_description_template: fix.suggestedValue,
              updated_at: new Date().toISOString()
            })
            .eq("id", fix.entityId)

          if (error) throw error
          applied++

        } else if (fix.type === "duplicate_title") {
          // Update template's SEO title
          const { error } = await supabase
            .from("product_templates")
            .update({
              seo_title_template: fix.suggestedValue,
              updated_at: new Date().toISOString()
            })
            .eq("id", fix.entityId)

          if (error) throw error
          applied++

        } else if (fix.type === "missing_alt_text") {
          // Determine which table to update based on issue ID
          if (fix.issueId.startsWith("alt_template_")) {
            const { error } = await supabase
              .from("product_template_images")
              .update({
                alt_text: fix.suggestedValue,
                updated_at: new Date().toISOString()
              })
              .eq("id", fix.entityId)

            if (error) throw error
            applied++

          } else if (fix.issueId.startsWith("alt_variant_")) {
            const { error } = await supabase
              .from("product_images")
              .update({ alt_text: fix.suggestedValue })
              .eq("id", fix.entityId)

            if (error) throw error
            applied++
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
        errors.push({ issueId: fix.issueId, error: errorMessage })
      }
    }

    return NextResponse.json({ applied, errors } as ApplyFixesResponse)
  } catch (error) {
    console.error("Failed to apply SEO fixes:", error)
    return NextResponse.json({ error: "Erro ao aplicar correções SEO" }, { status: 500 })
  }
}
