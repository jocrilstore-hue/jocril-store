import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import {
  generateMetaDescription,
  generateUniqueTitle,
  generateImageAltText,
  type OpenRouterConfig,
  type ProductContext,
} from "@/lib/openrouter";
import type { SEOIssue } from "../scan/route";

export interface SEOFix {
  issueId: string;
  type: SEOIssue["type"];
  entityType: "template" | "image";
  entityId: number;
  entityName: string;
  currentValue: string | null;
  suggestedValue: string;
  imageUrl?: string;
}

export interface AutoFixRequest {
  issues: SEOIssue[];
}

export interface AutoFixResponse {
  fixes: SEOFix[];
  errors: Array<{ issueId: string; error: string }>;
}

// Helper to extract name from category/material relation
function extractRelationName(
  relation: { name: string } | { name: string }[] | null | undefined,
): string | undefined {
  if (!relation) return undefined;
  if (Array.isArray(relation)) {
    return relation[0]?.name;
  }
  return relation.name;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  try {
    const body: AutoFixRequest = await request.json();
    const { issues } = body;

    if (!issues || issues.length === 0) {
      return NextResponse.json(
        { error: "Nenhum problema fornecido" },
        { status: 400 },
      );
    }

    // Get API settings
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["openrouter_api_key", "openrouter_model"]);

    const apiKey = settings?.find((s) => s.key === "openrouter_api_key")?.value;
    const model =
      settings?.find((s) => s.key === "openrouter_model")?.value ||
      "google/gemini-2.5-flash-preview-09-2025";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave API não configurada. Configure nas definições." },
        { status: 400 },
      );
    }

    const config: OpenRouterConfig = { apiKey, model };

    // Get all template IDs we need to fetch
    const templateIds = new Set<number>();
    for (const issue of issues) {
      if (issue.entityType === "template") {
        templateIds.add(issue.entityId);
      }
    }

    // Fetch template data with explicit type
    const { data: templates } = await supabase
      .from("product_templates")
      .select(
        `
        id,
        name,
        short_description,
        full_description,
        advantages,
        seo_title_template,
        category:categories!product_templates_category_id_fkey (name),
        material:materials!product_templates_material_id_fkey (name)
      `,
      )
      .in("id", [...templateIds]);

    type TemplateRow = NonNullable<typeof templates>[number];

    // Get all existing titles for duplicate checking
    const { data: allTemplates } = await supabase
      .from("product_templates")
      .select("id, name, seo_title_template")
      .eq("is_active", true);

    const existingTitles = (allTemplates || []).map(
      (t) => t.seo_title_template || t.name,
    );

    const fixes: SEOFix[] = [];
    const errors: Array<{ issueId: string; error: string }> = [];

    // Process each issue
    for (const issue of issues) {
      try {
        let suggestedValue = "";

        if (issue.type === "missing_meta_description") {
          const template = templates?.find((t) => t.id === issue.entityId) as
            | TemplateRow
            | undefined;
          if (!template) {
            errors.push({
              issueId: issue.id,
              error: "Template não encontrado",
            });
            continue;
          }

          const context: ProductContext = {
            name: template.name,
            category: extractRelationName(
              template.category as { name: string } | { name: string }[] | null,
            ),
            material: extractRelationName(
              template.material as { name: string } | { name: string }[] | null,
            ),
            shortDescription: template.short_description || undefined,
            fullDescription: template.full_description || undefined,
            advantages: template.advantages || undefined,
          };

          suggestedValue = await generateMetaDescription(config, context);
        } else if (issue.type === "duplicate_title") {
          const template = templates?.find((t) => t.id === issue.entityId) as
            | TemplateRow
            | undefined;
          if (!template) {
            errors.push({
              issueId: issue.id,
              error: "Template não encontrado",
            });
            continue;
          }

          const context: ProductContext = {
            name: template.name,
            category: extractRelationName(
              template.category as { name: string } | { name: string }[] | null,
            ),
            material: extractRelationName(
              template.material as { name: string } | { name: string }[] | null,
            ),
            shortDescription: template.short_description || undefined,
          };

          // Filter out this template's current title from existing titles
          const otherTitles = existingTitles.filter(
            (t) => t !== (template.seo_title_template || template.name),
          );

          suggestedValue = await generateUniqueTitle(
            config,
            context,
            otherTitles,
          );
        } else if (issue.type === "missing_alt_text") {
          // Find the product context for this image
          let productContext: ProductContext = {
            name: issue.entityName,
            category: "Expositores de acrílico",
            material: "Acrílico",
          };

          // Try to get more context if it's a template image
          if (issue.id.startsWith("alt_template_")) {
            const { data: imgData } = await supabase
              .from("product_template_images")
              .select(
                `
                product_template_id,
                template:product_templates!product_template_images_product_template_id_fkey (
                  name,
                  short_description,
                  category:categories!product_templates_category_id_fkey (name),
                  material:materials!product_templates_material_id_fkey (name)
                )
              `,
              )
              .eq("id", issue.entityId)
              .single();

            if (imgData?.template) {
              const t = Array.isArray(imgData.template)
                ? imgData.template[0]
                : imgData.template;
              if (t) {
                productContext = {
                  name: (t as { name: string }).name,
                  category: extractRelationName(
                    (t as { category?: { name: string } | { name: string }[] })
                      .category,
                  ),
                  material: extractRelationName(
                    (t as { material?: { name: string } | { name: string }[] })
                      .material,
                  ),
                  shortDescription:
                    (t as { short_description?: string }).short_description ||
                    undefined,
                };
              }
            }
          } else if (issue.id.startsWith("alt_variant_")) {
            const { data: imgData } = await supabase
              .from("product_images")
              .select(
                `
                product_variant_id,
                variant:product_variants!product_images_product_variant_id_fkey (
                  sku,
                  template:product_templates!product_variants_product_template_id_fkey (
                    name,
                    short_description,
                    category:categories!product_templates_category_id_fkey (name),
                    material:materials!product_templates_material_id_fkey (name)
                  )
                )
              `,
              )
              .eq("id", issue.entityId)
              .single();

            if (imgData?.variant) {
              const v = Array.isArray(imgData.variant)
                ? imgData.variant[0]
                : imgData.variant;
              if (v) {
                const t = (v as { template?: unknown }).template
                  ? Array.isArray((v as { template: unknown[] }).template)
                    ? (v as { template: unknown[] }).template[0]
                    : (v as { template: unknown }).template
                  : null;
                if (t) {
                  productContext = {
                    name: (t as { name: string }).name,
                    category: extractRelationName(
                      (
                        t as {
                          category?: { name: string } | { name: string }[];
                        }
                      ).category,
                    ),
                    material: extractRelationName(
                      (
                        t as {
                          material?: { name: string } | { name: string }[];
                        }
                      ).material,
                    ),
                    shortDescription:
                      (t as { short_description?: string }).short_description ||
                      undefined,
                  };
                }
              }
            }
          }

          suggestedValue = await generateImageAltText(
            config,
            issue.imageUrl || "",
            productContext,
          );
        }

        if (suggestedValue) {
          fixes.push({
            issueId: issue.id,
            type: issue.type,
            entityType: issue.entityType,
            entityId: issue.entityId,
            entityName: issue.entityName,
            currentValue: issue.currentValue || null,
            suggestedValue,
            imageUrl: issue.imageUrl,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        errors.push({ issueId: issue.id, error: errorMessage });
      }
    }

    return NextResponse.json({ fixes, errors } as AutoFixResponse);
  } catch (error) {
    console.error("Failed to generate SEO fixes:", error);
    return NextResponse.json(
      { error: "Erro ao gerar correções SEO" },
      { status: 500 },
    );
  }
}
