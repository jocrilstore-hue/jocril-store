"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  generateSlug,
  generateReferenceCode,
  generateSkuPrefix,
} from "@/lib/validations/product-schemas";
import { handleAsyncOperation } from "@/lib/utils/supabase-errors";
import type {
  ProductTaxonomyData,
  ProductTemplateDetail,
} from "@/lib/supabase/queries/admin-products";
import type { ProductTemplateImage, ProductSpecifications } from "@/lib/types";

// Schema
export const templateSchema = z.object({
  name: z.string().min(3, "Introduza um nome com pelo menos 3 caracteres."),
  slug: z
    .string()
    .min(3, "Slug obrigatório.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Utilize apenas letras minúsculas, números e hífen.",
    ),
  referenceCode: z.string().max(50).optional().nullable(),
  skuPrefix: z.string().max(20).optional().nullable(),
  categoryId: z.number({ required_error: "Selecione uma categoria." }),
  materialId: z.number().optional().nullable(),
  shortDescription: z.string().max(400).optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  advantages: z.string().optional().nullable(),
  specificationsText: z.string().optional().nullable(),
  specificationsJson: z
    .object({
      produto: z.object({
        largura_mm: z.number().nullable(),
        altura_mm: z.number().nullable(),
        profundidade_mm: z.number().nullable(),
      }),
      area_grafica: z.object({
        largura_mm: z.number().nullable(),
        altura_mm: z.number().nullable(),
        formato: z.string().nullable(),
        impressao: z.enum(["frente", "verso", "frente_verso"]).nullable(),
        num_cores: z.number().nullable(),
      }),
      notas: z.string().nullable(),
      extras: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      ),
    })
    .optional()
    .nullable(),
  careInstructions: z.string().optional().nullable(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1, "Pergunta obrigatória."),
        answer: z.string().min(1, "Resposta obrigatória."),
      }),
    )
    .optional()
    .nullable(),
  orientation: z.enum(["vertical", "horizontal", "both"]),
  minOrderQuantity: z.number().min(1),
  displayOrder: z.number().optional().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isCustomizable: z.boolean(),
  isDoubleSided: z.boolean(),
  isAdhesive: z.boolean(),
  hasLock: z.boolean(),
  hasQuantityDiscounts: z.boolean(),
  seoTitleTemplate: z.string().max(200).optional().nullable(),
  seoDescriptionTemplate: z.string().max(320).optional().nullable(),
  applications: z.array(z.number()).optional(),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

export interface UseProductTemplateFormOptions {
  mode: "create" | "edit";
  template?: ProductTemplateDetail | null;
  taxonomies: ProductTaxonomyData;
  initialImages?: ProductTemplateImage[];
  onDeleted?: () => void;
}

export function useProductTemplateForm({
  mode,
  template,
  taxonomies,
  initialImages = [],
  onDeleted,
}: UseProductTemplateFormOptions) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  // State
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft");
  const publishModeRef = useRef<"draft" | "publish">("draft");
  const [slugValidation, setSlugValidation] = useState<{
    checking: boolean;
    unique: boolean;
    suggestion?: string;
  }>({ checking: false, unique: true });
  const [templateImages, setTemplateImages] = useState<ProductTemplateImage[]>(initialImages);

  // Form setup
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? "",
      slug: template?.slug ?? "",
      referenceCode: template?.referenceCode ?? "",
      skuPrefix: template?.skuPrefix ?? "",
      categoryId: template?.categoryId ?? taxonomies.categories[0]?.id ?? 0,
      materialId: template?.materialId ?? null,
      shortDescription: template?.shortDescription ?? "",
      fullDescription: template?.fullDescription ?? "",
      advantages: template?.advantages ?? "",
      specificationsText: template?.specificationsText ?? "",
      specificationsJson: template?.specificationsJson ?? {
        produto: {
          largura_mm: null,
          altura_mm: null,
          profundidade_mm: null,
        },
        area_grafica: {
          largura_mm: null,
          altura_mm: null,
          formato: null,
          impressao: null,
          num_cores: null,
        },
        notas: null,
        extras: [],
      },
      careInstructions: template?.careInstructions ?? "",
      faq: template?.faq ?? [],
      orientation:
        (template?.orientation as TemplateFormValues["orientation"]) ?? "vertical",
      minOrderQuantity: template?.minOrderQuantity ?? 1,
      displayOrder: template?.displayOrder ?? 0,
      isActive: template?.isActive ?? false,
      isFeatured: template?.isFeatured ?? false,
      isCustomizable: template?.isCustomizable ?? false,
      isDoubleSided: template?.isDoubleSided ?? false,
      isAdhesive: template?.isAdhesive ?? false,
      hasLock: template?.hasLock ?? false,
      hasQuantityDiscounts: template?.hasQuantityDiscounts ?? true,
      seoTitleTemplate: template?.seoTitleTemplate ?? "",
      seoDescriptionTemplate: template?.seoDescriptionTemplate ?? "",
      applications: template?.applications ?? [],
    },
  });

  const faqFieldArray = useFieldArray({
    control: form.control,
    name: "faq",
  });

  // Slug validation
  const checkSlugUniqueness = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugValidation({ checking: false, unique: true });
        return;
      }

      setSlugValidation({ checking: true, unique: true });

      // TODO: Add API route for template slug validation
      setSlugValidation({
        checking: false,
        unique: true,
        suggestion: undefined,
      });
    },
    [template?.id],
  );

  // Submit handler
  const handleSubmit = form.handleSubmit(async (values) => {
    if (!slugValidation.unique) {
      toast({
        title: "Slug duplicado",
        description: "Por favor, escolha um slug único antes de guardar.",
        variant: "destructive",
      });
      return;
    }

    setSavingState("saving");

    const result = await handleAsyncOperation(
      async () => {
        const payload = {
          name: values.name,
          slug: values.slug,
          reference_code: values.referenceCode || null,
          sku_prefix: values.skuPrefix || null,
          category_id: values.categoryId,
          material_id: values.materialId || null,
          short_description: values.shortDescription || null,
          full_description: values.fullDescription || null,
          advantages: values.advantages || null,
          specifications_text: values.specificationsText || null,
          specifications_json: values.specificationsJson || null,
          care_instructions: values.careInstructions || null,
          faq: values.faq?.length ? values.faq : null,
          orientation: values.orientation,
          min_order_quantity: values.minOrderQuantity,
          display_order: values.displayOrder ?? 0,
          is_active: publishModeRef.current === "publish" ? true : values.isActive,
          is_featured: values.isFeatured,
          is_customizable: values.isCustomizable,
          is_double_sided: values.isDoubleSided,
          is_adhesive: values.isAdhesive,
          has_lock: values.hasLock,
          has_quantity_discounts: values.hasQuantityDiscounts,
          seo_title_template: values.seoTitleTemplate || null,
          seo_description_template: values.seoDescriptionTemplate || null,
        };

        let templateId: number | undefined = template?.id;

        if (mode === "create" || !templateId) {
          const { data, error } = await supabase
            .from("product_templates")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;
          templateId = data?.id;
        } else {
          const { error } = await supabase
            .from("product_templates")
            .update(payload)
            .eq("id", templateId);
          if (error) throw error;
        }

        if (templateId && values.applications) {
          const { error: deleteError } = await supabase
            .from("product_applications")
            .delete()
            .eq("product_template_id", templateId);
          if (deleteError) throw deleteError;

          if (values.applications.length > 0) {
            const rows = values.applications.map((applicationId) => ({
              product_template_id: templateId,
              application_id: applicationId,
            }));
            const { error: insertError } = await supabase
              .from("product_applications")
              .insert(rows);
            if (insertError) throw insertError;
          }
        }

        return templateId;
      },
      {
        successMessage:
          publishModeRef.current === "publish"
            ? "Produto publicado! Está agora ativo no site."
            : "Produto guardado como rascunho.",
        errorTitle: "Erro ao guardar produto",
        showToast: toast,
        onSuccess: (templateId) => {
          setSavingState("saved");
          if (mode === "create" && templateId) {
            router.push(`/admin/products/${templateId}`);
          } else {
            router.refresh();
          }
        },
      },
    );

    if (!result.success) {
      setSavingState("idle");
    } else {
      setTimeout(() => setSavingState("idle"), 2000);
    }
  });

  // Delete handler
  const handleDelete = async () => {
    if (!template?.id) return;
    if (!confirm("Eliminar este produto e todas as variantes associadas?")) return;

    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from("product_templates")
          .delete()
          .eq("id", template.id);
        if (error) throw error;
        return true;
      },
      {
        successMessage: "Produto eliminado definitivamente.",
        errorTitle: "Não foi possível eliminar o produto",
        showToast: toast,
        onSuccess: () => {
          onDeleted?.();
          router.push("/admin/products");
        },
      },
    );
  };

  // Generate slug from name
  const handleGenerateSlug = async () => {
    const name = form.getValues("name");
    const slug = generateSlug(name);
    form.setValue("slug", slug);
    await checkSlugUniqueness(slug);
  };

  // Auto-generate fields when name changes (create mode only)
  const watchedName = form.watch("name");
  useEffect(() => {
    if (mode !== "create" || !watchedName || watchedName.length < 3) return;

    const slug = generateSlug(watchedName);
    form.setValue("slug", slug);
    checkSlugUniqueness(slug);

    if (!form.getValues("referenceCode")) {
      form.setValue("referenceCode", generateReferenceCode());
    }

    form.setValue("skuPrefix", generateSkuPrefix(watchedName));
  }, [watchedName, mode, form, checkSlugUniqueness]);

  // Submit helpers
  const saveDraft = () => {
    setPublishMode("draft");
    publishModeRef.current = "draft";
    handleSubmit();
  };

  const publish = () => {
    setPublishMode("publish");
    publishModeRef.current = "publish";
    handleSubmit();
  };

  return {
    form,
    faqFieldArray,
    savingState,
    publishMode,
    publishModeRef,
    slugValidation,
    templateImages,
    setTemplateImages,
    checkSlugUniqueness,
    handleSubmit,
    handleDelete,
    handleGenerateSlug,
    saveDraft,
    publish,
  };
}
