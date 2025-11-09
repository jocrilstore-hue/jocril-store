"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type {
  ApplicationOption,
  ProductTaxonomyData,
  ProductTemplateDetail,
} from "@/lib/supabase/queries/admin-products"
import { Loader2, Trash2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { generateSlug } from "@/lib/validations/product-schemas"
// Note: Server-side validation function removed - will be added back via API routes
// import { validateTemplateSlug } from "@/lib/validations/uniqueness"
import { handleAsyncOperation } from "@/lib/utils/supabase-errors"

const templateSchema = z.object({
  name: z.string().min(3, "Introduza um nome com pelo menos 3 caracteres."),
  slug: z
    .string()
    .min(3, "Slug obrigatório.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilize apenas letras minúsculas, números e hífen."),
  referenceCode: z.string().max(50).optional().nullable(),
  skuPrefix: z.string().max(20).optional().nullable(),
  categoryId: z.number({ required_error: "Selecione uma categoria." }),
  materialId: z.number().optional().nullable(),
  shortDescription: z.string().max(400).optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  advantages: z.string().optional().nullable(),
  specificationsText: z.string().optional().nullable(),
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
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface ProductTemplateFormProps {
  mode: "create" | "edit"
  template?: ProductTemplateDetail | null
  taxonomies: ProductTaxonomyData
  applications: ApplicationOption[]
  onDeleted?: () => void
}

export function ProductTemplateForm({ mode, template, taxonomies, applications, onDeleted }: ProductTemplateFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle")
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft")
  const [slugValidation, setSlugValidation] = useState<{
    checking: boolean
    unique: boolean
    suggestion?: string
  }>({ checking: false, unique: true })

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
      careInstructions: template?.careInstructions ?? "",
      faq: template?.faq ?? [],
      orientation: (template?.orientation as TemplateFormValues["orientation"]) ?? "vertical",
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
  })

  const faqFieldArray = useFieldArray({
    control: form.control,
    name: "faq",
  })

  // Real-time slug uniqueness validation
  const checkSlugUniqueness = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugValidation({ checking: false, unique: true })
        return
      }

      setSlugValidation({ checking: true, unique: true })

      // TODO: Add API route for template slug validation
      // const result = await validateTemplateSlug(slug, template?.id)

      setSlugValidation({
        checking: false,
        unique: true, // Temporarily assume unique until API route is added
        suggestion: undefined,
      })

      // if (!result.isUnique) {
      //   form.setError("slug", {
      //     type: "manual",
      //     message: result.error || "Este slug já está em uso",
      //   })
      // } else {
      //   form.clearErrors("slug")
      // }
    },
    [template?.id, form],
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    // Check slug uniqueness before saving
    if (!slugValidation.unique) {
      toast({
        title: "Slug duplicado",
        description: "Por favor, escolha um slug único antes de guardar.",
        variant: "destructive",
      })
      return
    }

    setSavingState("saving")

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
          care_instructions: values.careInstructions || null,
          faq: values.faq?.length ? values.faq : null,
          orientation: values.orientation,
          min_order_quantity: values.minOrderQuantity,
          display_order: values.displayOrder ?? 0,
          is_active: publishMode === "publish" ? true : values.isActive,
          is_featured: values.isFeatured,
          is_customizable: values.isCustomizable,
          is_double_sided: values.isDoubleSided,
          is_adhesive: values.isAdhesive,
          has_lock: values.hasLock,
          has_quantity_discounts: values.hasQuantityDiscounts,
          seo_title_template: values.seoTitleTemplate || null,
          seo_description_template: values.seoDescriptionTemplate || null,
        }

        let templateId: number | undefined = template?.id

        if (mode === "create" || !templateId) {
          const { data, error } = await supabase.from("product_templates").insert(payload).select("id").single()
          if (error) throw error
          templateId = data?.id
        } else {
          const { error } = await supabase.from("product_templates").update(payload).eq("id", templateId)
          if (error) throw error
        }

        if (templateId && values.applications) {
          const { error: deleteError } = await supabase
            .from("product_applications")
            .delete()
            .eq("product_template_id", templateId)
          if (deleteError) throw deleteError

          if (values.applications.length > 0) {
            const rows = values.applications.map((applicationId) => ({
              product_template_id: templateId,
              application_id: applicationId,
            }))
            const { error: insertError } = await supabase.from("product_applications").insert(rows)
            if (insertError) throw insertError
          }
        }

        return templateId
      },
      {
        successMessage:
          publishMode === "publish"
            ? "Template publicado! O produto está ativo no site."
            : "Template guardado como rascunho.",
        errorTitle: "Erro ao guardar template",
        showToast: toast,
        onSuccess: (templateId) => {
          setSavingState("saved")
          if (mode === "create" && templateId) {
            router.push(`/admin/products/${templateId}`)
          } else {
            router.refresh()
          }
        },
      },
    )

    if (!result.success) {
      setSavingState("idle")
    } else {
      setTimeout(() => setSavingState("idle"), 2000)
    }
  })

  const handleDelete = async () => {
    if (!template?.id) return
    if (!confirm("Eliminar este template e todas as variantes associadas?")) return

    await handleAsyncOperation(
      async () => {
        const { error } = await supabase.from("product_templates").delete().eq("id", template.id)
        if (error) throw error
        return true
      },
      {
        successMessage: "Template eliminado definitivamente.",
        errorTitle: "Não foi possível eliminar o template",
        showToast: toast,
        onSuccess: () => {
          onDeleted?.()
          router.push("/admin/products")
        },
      },
    )
  }

  const handleGenerateSlug = async () => {
    const name = form.getValues("name")
    const slug = generateSlug(name)
    form.setValue("slug", slug)
    // Check uniqueness immediately after generating
    await checkSlugUniqueness(slug)
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <button type="submit" className="hidden" aria-hidden />
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPublishMode("draft")
            handleSubmit()
          }}
          disabled={savingState === "saving"}
          className="gap-2"
        >
          {savingState === "saving" && publishMode === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar rascunho
        </Button>
        <Button
          type="button"
          onClick={() => {
            setPublishMode("publish")
            handleSubmit()
          }}
          className="gap-2"
          disabled={savingState === "saving"}
        >
          {savingState === "saving" && publishMode === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publicar
        </Button>
        {savingState === "saved" && <Badge variant="outline">Guardado</Badge>}
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="basic">Informações básicas</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="applications">Aplicações</TabsTrigger>
          <TabsTrigger value="settings">Definições</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações gerais</CardTitle>
              <CardDescription>Defina os dados principais do template.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">Slug</Label>
                  <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={handleGenerateSlug}>
                    Gerar automaticamente
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    onChange={(e) => {
                      form.setValue("slug", e.target.value)
                      checkSlugUniqueness(e.target.value)
                    }}
                    className={cn(
                      !slugValidation.unique && "border-destructive focus-visible:ring-destructive",
                      slugValidation.unique && form.watch("slug") && "border-green-500 focus-visible:ring-green-500",
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugValidation.checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {!slugValidation.checking && slugValidation.unique && form.watch("slug") && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {!slugValidation.checking && !slugValidation.unique && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
                {!slugValidation.unique && slugValidation.suggestion && (
                  <div className="mt-1 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                    <p className="text-xs text-muted-foreground">
                      Sugestão:{" "}
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("slug", slugValidation.suggestion!)
                          checkSlugUniqueness(slugValidation.suggestion!)
                        }}
                        className="font-medium text-primary hover:underline"
                      >
                        {slugValidation.suggestion}
                      </button>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="referenceCode">Código de referência</Label>
                <Input id="referenceCode" {...form.register("referenceCode")} />
              </div>
              <div>
                <Label htmlFor="skuPrefix">Prefixo SKU</Label>
                <Input id="skuPrefix" {...form.register("skuPrefix")} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={String(form.watch("categoryId"))}
                  onValueChange={(value) => form.setValue("categoryId", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomies.categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Material</Label>
                <Select
                  value={form.watch("materialId") ? String(form.watch("materialId")) : "none"}
                  onValueChange={(value) => form.setValue("materialId", value === "none" ? null : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem material</SelectItem>
                    {taxonomies.materials.map((material) => (
                      <SelectItem key={material.id} value={String(material.id)}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orientação</Label>
                <Select
                  value={form.watch("orientation")}
                  onValueChange={(value: TemplateFormValues["orientation"]) => form.setValue("orientation", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="both">Ambas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minOrderQuantity">Quantidade mínima</Label>
                <Input
                  id="minOrderQuantity"
                  type="number"
                  min={1}
                  {...form.register("minOrderQuantity", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="displayOrder">Ordem de exibição</Label>
                <Input id="displayOrder" type="number" {...form.register("displayOrder", { valueAsNumber: true })} />
              </div>
              <div className="col-span-full grid gap-3 rounded-lg border p-4 md:grid-cols-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ativo</p>
                    <p className="text-xs text-muted-foreground">Disponível no site público</p>
                  </div>
                  <Switch checked={form.watch("isActive")} onCheckedChange={(checked) => form.setValue("isActive", checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Destaque</p>
                    <p className="text-xs text-muted-foreground">Mostrado nas listagens principais</p>
                  </div>
                  <Switch
                    checked={form.watch("isFeatured")}
                    onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Personalizável</p>
                    <p className="text-xs text-muted-foreground">Aceita medidas especiais</p>
                  </div>
                  <Switch
                    checked={form.watch("isCustomizable")}
                    onCheckedChange={(checked) => form.setValue("isCustomizable", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Dupla face</p>
                    <p className="text-xs text-muted-foreground">Permite impressão dos dois lados</p>
                  </div>
                  <Switch
                    checked={form.watch("isDoubleSided")}
                    onCheckedChange={(checked) => form.setValue("isDoubleSided", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Adesivo</p>
                    <p className="text-xs text-muted-foreground">Inclui fita/painel adesivo</p>
                  </div>
                  <Switch
                    checked={form.watch("isAdhesive")}
                    onCheckedChange={(checked) => form.setValue("isAdhesive", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tem fecho</p>
                    <p className="text-xs text-muted-foreground">Inclui fechadura ou mecanismo</p>
                  </div>
                  <Switch checked={form.watch("hasLock")} onCheckedChange={(checked) => form.setValue("hasLock", checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Descontos por quantidade</p>
                    <p className="text-xs text-muted-foreground">Exibe tabela de preços progressivos</p>
                  </div>
                  <Switch
                    checked={form.watch("hasQuantityDiscounts")}
                    onCheckedChange={(checked) => form.setValue("hasQuantityDiscounts", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrições</CardTitle>
              <CardDescription>Conteúdo exibido nas páginas públicas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shortDescription">Resumo</Label>
                <Textarea id="shortDescription" rows={3} {...form.register("shortDescription")} />
              </div>
              <div>
                <Label>Descrição completa</Label>
                <Controller
                  name="fullDescription"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Detalhes completos..." />
                  )}
                />
              </div>
              <div>
                <Label>Vantagens</Label>
                <Controller
                  name="advantages"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Benefícios principais..." />
                  )}
                />
              </div>
              <div>
                <Label>Especificações técnicas</Label>
                <Controller
                  name="specificationsText"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Materiais, dimensões..." />
                  )}
                />
              </div>
              <div>
                <Label>Instruções de manutenção</Label>
                <Controller
                  name="careInstructions"
                  control={form.control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Como limpar, armazenar..." />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas frequentes</CardTitle>
              <CardDescription>Adicione respostas comuns para orientar o cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqFieldArray.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Pergunta</Label>
                        <Input {...form.register(`faq.${index}.question` as const)} />
                      </div>
                      <div>
                        <Label>Resposta</Label>
                        <Textarea rows={3} {...form.register(`faq.${index}.answer` as const)} />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => faqFieldArray.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  faqFieldArray.append({
                    question: "",
                    answer: "",
                  })
                }
              >
                Adicionar FAQ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modelos SEO</CardTitle>
              <CardDescription>Personalize títulos e descrições com variáveis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitleTemplate">Título</Label>
                <Input id="seoTitleTemplate" {...form.register("seoTitleTemplate")} />
              </div>
              <div>
                <Label htmlFor="seoDescriptionTemplate">Descrição</Label>
                <Textarea id="seoDescriptionTemplate" rows={4} {...form.register("seoDescriptionTemplate")} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Variáveis suportadas: {"{PRODUCT_NAME}"}, {"{SIZE}"}, {"{MATERIAL}"}, {"{ORIENTATION}"}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Pré-visualização</p>
                <p className="text-sm text-primary">
                  {(form.watch("seoTitleTemplate") || form.watch("name")) ?? "Título do produto"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.watch("seoDescriptionTemplate") || "Descrição otimizada do produto..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Aplicações</CardTitle>
              <CardDescription>Associe este template aos casos de uso relevantes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {applications.map((application) => (
                <label key={application.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={form.watch("applications")?.includes(application.id)}
                    onCheckedChange={(checked) => {
                      const current = form.watch("applications") ?? []
                      if (checked) {
                        form.setValue("applications", [...current, application.id])
                      } else {
                        form.setValue(
                          "applications",
                          current.filter((id) => id !== application.id),
                        )
                      }
                    }}
                  />
                  <span className="text-sm font-medium">{application.title}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="text-sm font-medium">
                  {template?.createdAt
                    ? new Date(template.createdAt).toLocaleString("pt-PT")
                    : "Será definido após a criação"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Atualizado em</p>
                <p className="text-sm font-medium">
                  {template?.updatedAt ? new Date(template.updatedAt).toLocaleString("pt-PT") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {template?.id && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Zona perigosa</CardTitle>
                <CardDescription>Esta ação é irreversível.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Eliminar template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </form>
  )
}
