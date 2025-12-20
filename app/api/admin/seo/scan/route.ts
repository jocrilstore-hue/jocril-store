import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"

export interface SEOIssue {
  id: string
  type: "missing_meta_description" | "duplicate_title" | "missing_alt_text"
  severity: "warning" | "error"
  entityType: "template" | "image"
  entityId: number
  entityName: string
  description: string
  currentValue?: string | null
  imageUrl?: string
}

export interface SEOScanResult {
  issues: SEOIssue[]
  summary: {
    total: number
    missingMetaDescriptions: number
    duplicateTitles: number
    missingAltText: number
  }
  coverage: number
}

export async function GET() {
  const { userId } = await auth()

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const supabase = await createClient()

  try {
    const issues: SEOIssue[] = []

    // 1. Fetch all templates with SEO fields
    const { data: templates, error: templatesError } = await supabase
      .from("product_templates")
      .select("id, name, slug, seo_title_template, seo_description_template, short_description")
      .eq("is_active", true)

    if (templatesError) throw templatesError

    // 2. Check for missing meta descriptions
    const templatesWithoutMeta = (templates || []).filter(
      (t) => !t.seo_description_template && !t.short_description
    )

    for (const template of templatesWithoutMeta) {
      issues.push({
        id: `meta_${template.id}`,
        type: "missing_meta_description",
        severity: "warning",
        entityType: "template",
        entityId: template.id,
        entityName: template.name,
        description: `O produto "${template.name}" não tem meta descrição definida`,
        currentValue: null,
      })
    }

    // 3. Check for duplicate titles
    const titleCounts = new Map<string, number[]>()
    for (const template of templates || []) {
      const title = (template.seo_title_template || template.name).toLowerCase().trim()
      const existing = titleCounts.get(title) || []
      existing.push(template.id)
      titleCounts.set(title, existing)
    }

    for (const [title, ids] of titleCounts) {
      if (ids.length > 1) {
        for (const id of ids) {
          const template = templates?.find((t) => t.id === id)
          if (template) {
            issues.push({
              id: `dup_title_${id}`,
              type: "duplicate_title",
              severity: "error",
              entityType: "template",
              entityId: id,
              entityName: template.name,
              description: `O título "${template.name}" está duplicado em ${ids.length} produtos`,
              currentValue: template.seo_title_template || template.name,
            })
          }
        }
      }
    }

    // 4. Fetch all template images without alt text
    const { data: templateImages, error: templateImagesError } = await supabase
      .from("product_template_images")
      .select("id, product_template_id, image_url, alt_text")
      .or("alt_text.is.null,alt_text.eq.")

    if (templateImagesError) throw templateImagesError

    for (const image of templateImages || []) {
      const template = templates?.find((t) => t.id === image.product_template_id)
      issues.push({
        id: `alt_template_${image.id}`,
        type: "missing_alt_text",
        severity: "warning",
        entityType: "image",
        entityId: image.id,
        entityName: template?.name || `Template #${image.product_template_id}`,
        description: `Imagem sem alt text no produto "${template?.name || image.product_template_id}"`,
        currentValue: null,
        imageUrl: image.image_url,
      })
    }

    // 5. Fetch all variant images without alt text
    const { data: variantImages, error: variantImagesError } = await supabase
      .from("product_images")
      .select(`
        id,
        product_variant_id,
        image_url,
        alt_text,
        variant:product_variants!product_images_product_variant_id_fkey (
          id,
          sku,
          product_template_id
        )
      `)
      .or("alt_text.is.null,alt_text.eq.")

    if (variantImagesError) throw variantImagesError

    for (const image of variantImages || []) {
      const variant = Array.isArray(image.variant) ? image.variant[0] : image.variant
      const template = templates?.find((t) => t.id === variant?.product_template_id)
      issues.push({
        id: `alt_variant_${image.id}`,
        type: "missing_alt_text",
        severity: "warning",
        entityType: "image",
        entityId: image.id,
        entityName: template?.name || variant?.sku || `Variante #${image.product_variant_id}`,
        description: `Imagem sem alt text na variante "${variant?.sku || image.product_variant_id}"`,
        currentValue: null,
        imageUrl: image.image_url,
      })
    }

    // Calculate summary
    const summary = {
      total: issues.length,
      missingMetaDescriptions: issues.filter((i) => i.type === "missing_meta_description").length,
      duplicateTitles: issues.filter((i) => i.type === "duplicate_title").length,
      missingAltText: issues.filter((i) => i.type === "missing_alt_text").length,
    }

    // Calculate coverage (templates with all SEO fields filled)
    const totalTemplates = templates?.length || 0
    const templatesWithSeo = (templates || []).filter(
      (t) => (t.seo_description_template || t.short_description) && t.name
    ).length
    const coverage = totalTemplates > 0 ? Math.round((templatesWithSeo / totalTemplates) * 100) : 100

    return NextResponse.json({
      issues,
      summary,
      coverage,
    } as SEOScanResult)
  } catch (error) {
    console.error("Failed to scan SEO:", error)
    return NextResponse.json({ error: "Erro ao analisar SEO" }, { status: 500 })
  }
}
