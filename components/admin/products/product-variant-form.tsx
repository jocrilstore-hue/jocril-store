"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { ProductVariantDetail, SizeFormatOption } from "@/lib/supabase/queries/admin-products"
import { Loader2, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import our new utilities
import { productVariantSchema, generateSlug, generateSKU, calculatePriceWithVAT } from "@/lib/validations/product-schemas"
import type { ProductVariantFormData } from "@/lib/validations/product-schemas"
// Note: Server-side validation functions removed - will be added back via API routes
// import { validateVariantSKU, validateVariantSlug } from "@/lib/validations/uniqueness"
import { parseSupabaseError, formatErrorForToast, handleAsyncOperation, isUniqueViolation } from "@/lib/utils/supabase-errors"
import { StockBadge, StockAlert } from "@/components/ui/stock-badge"
import { getStockInfo } from "@/lib/utils/stock-management"
import { uploadImageWithCompression, deleteImage } from "@/lib/utils/image-upload"

interface ProductVariantFormEnhancedProps {
  mode: "create" | "edit"
  templateId: number
  templateName?: string
  variant?: ProductVariantDetail | null
  sizeFormats: SizeFormatOption[]
}

export function ProductVariantFormEnhanced({
  mode,
  templateId,
  templateName,
  variant,
  sizeFormats
}: ProductVariantFormEnhancedProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [savingState, setSavingState] = useState<"idle" | "saving">("idle")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(variant?.mainImageUrl ?? null)
  const [skuValidation, setSkuValidation] = useState<{ checking: boolean; unique: boolean; suggestion?: string }>({
    checking: false,
    unique: true
  })
  const [slugValidation, setSlugValidation] = useState<{ checking: boolean; unique: boolean; suggestion?: string }>({
    checking: false,
    unique: true
  })

  const initialSizeFormatId = variant?.sizeFormatId ?? sizeFormats[0]?.id ?? 0

  const form = useForm<ProductVariantFormData>({
    resolver: zodResolver(productVariantSchema),
    defaultValues: {
      productTemplateId: templateId,
      sizeFormatId: initialSizeFormatId,
      sku: variant?.sku ?? "",
      urlSlug: variant?.urlSlug ?? "",
      basePriceExcludingVat: variant?.basePriceExcludingVat ?? 0,
      basePriceIncludingVat: variant?.basePriceIncludingVat ?? 0,
      stockQuantity: variant?.stockQuantity ?? 0,
      stockStatus: (variant?.stockStatus as any) ?? "in_stock",
      lowStockThreshold: variant?.lowStockThreshold ?? 10,
      specificDescription: variant?.specificDescription ?? "",
      idealFor: variant?.idealFor ?? "",
      mainImageUrl: variant?.mainImageUrl ?? "",
      customWidth: variant?.customWidthMm ?? undefined,
      customHeight: variant?.customHeightMm ?? undefined,
      customDepth: variant?.customDepthMm ?? undefined,
      isActive: variant?.isActive ?? true,
      isBestseller: variant?.isBestseller ?? false,
      displayOrder: variant?.displayOrder ?? undefined,
      orientation: (variant?.orientation as any) ?? undefined,
    },
  })

  // Auto-generate slug when size format changes
  const handleSizeFormatChange = useCallback((sizeFormatId: number) => {
    form.setValue("sizeFormatId", sizeFormatId)

    if (mode === "create" && templateName) {
      const format = sizeFormats.find(f => f.id === sizeFormatId)
      if (format) {
        const currentSlug = form.getValues("urlSlug")
        if (!currentSlug) {
          const slug = generateSlug(`${templateName} ${format.name}`)
          form.setValue("urlSlug", slug)
        }

        const currentSku = form.getValues("sku")
        if (!currentSku) {
          const suggestedSku = generateSKU(templateName, format.code ?? format.name ?? sizeFormatId)
          form.setValue("sku", suggestedSku)
        }
      }
    }
  }, [mode, templateName, sizeFormats, form])

  useEffect(() => {
    if (mode === "create" && !variant?.sizeFormatId && sizeFormats.length > 0) {
      const current = form.getValues("sizeFormatId")
      if (!current || current === 0) {
        handleSizeFormatChange(sizeFormats[0].id)
      }
    }
  }, [mode, variant?.sizeFormatId, sizeFormats, form, handleSizeFormatChange])

  const watchedSizeFormatId = form.watch("sizeFormatId")
  const selectedFormat = useMemo(
    () => sizeFormats.find((format) => format.id === watchedSizeFormatId) ?? null,
    [sizeFormats, watchedSizeFormatId],
  )

  // Check SKU uniqueness
  const checkSKUUniqueness = useCallback(async (sku: string) => {
    if (!sku || sku.length < 3) return

    setSkuValidation({ checking: true, unique: true })

    // TODO: Add API route for SKU validation
    // const result = await validateVariantSKU(sku, variant?.id)
    setSkuValidation({
      checking: false,
      unique: true, // Temporarily assume unique until API route is added
      suggestion: undefined
    })

    // if (!result.isUnique) {
    //   form.setError("sku", {
    //     type: "manual",
    //     message: result.error || "SKU já existe"
    //   })
    // }
  }, [variant?.id, form])

  // Check slug uniqueness
  const checkSlugUniqueness = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) return

    setSlugValidation({ checking: true, unique: true })

    // TODO: Add API route for slug validation
    // const result = await validateVariantSlug(slug, variant?.id)
    setSlugValidation({
      checking: false,
      unique: true, // Temporarily assume unique until API route is added
      suggestion: undefined
    })

    // if (!result.isUnique) {
    //   form.setError("urlSlug", {
    //     type: "manual",
    //     message: result.error || "Slug já existe"
    //   })
    // }
  }, [variant?.id, form])

  // Auto-calculate VAT price
  const handlePriceExcludingVatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const priceEx = parseFloat(e.target.value)
    if (!isNaN(priceEx)) {
      const priceInc = calculatePriceWithVAT(priceEx)
      form.setValue("basePriceIncludingVat", priceInc)
    }
  }, [form])

  // Handle image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const result = await uploadImageWithCompression(file, {
        folder: `variants/${templateId}`,
        compress: true,
        maxWidth: 1920,
        quality: 0.9
      })

      if (result.success && result.url) {
        form.setValue("mainImageUrl", result.url)
        setImagePreview(result.url)

        toast({
          title: "Imagem enviada",
          description: "A imagem foi enviada com sucesso"
        })
      } else {
        toast({
          title: "Erro no upload",
          description: result.error || "Não foi possível enviar a imagem",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: parseSupabaseError(error as any),
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }, [templateId, form, toast])

  // Remove image
  const handleImageRemove = useCallback(() => {
    form.setValue("mainImageUrl", "")
    setImagePreview(null)
  }, [form])

  const handleSubmit = form.handleSubmit(async (values) => {
    // Final uniqueness checks before submit
    if (!skuValidation.unique) {
      toast({
        title: "SKU duplicado",
        description: skuValidation.suggestion
          ? `Sugestão: ${skuValidation.suggestion}`
          : "Por favor, escolha outro SKU",
        variant: "destructive"
      })
      return
    }

    if (!slugValidation.unique) {
      toast({
        title: "Slug duplicado",
        description: slugValidation.suggestion
          ? `Sugestão: ${slugValidation.suggestion}`
          : "Por favor, escolha outro slug",
        variant: "destructive"
      })
      return
    }

    setSavingState("saving")

    const payload = {
      product_template_id: templateId,
      size_format_id: values.sizeFormatId,
      sku: values.sku,
      url_slug: values.urlSlug,
      base_price_excluding_vat: values.basePriceExcludingVat,
      base_price_including_vat: values.basePriceIncludingVat,
      stock_quantity: values.stockQuantity,
      stock_status: values.stockStatus,
      low_stock_threshold: values.lowStockThreshold,
      specific_description: values.specificDescription || null,
      ideal_for: values.idealFor || null,
      main_image_url: values.mainImageUrl || null,
      custom_width_mm: values.customWidth ?? null,
      custom_height_mm: values.customHeight ?? null,
      custom_depth_mm: values.customDepth ?? null,
      is_active: values.isActive,
      is_bestseller: values.isBestseller,
      display_order: values.displayOrder ?? null,
      orientation: values.orientation ?? null,
    }

    let result

    if (mode === "create") {
      result = await handleAsyncOperation(async () =>
        supabase.from("product_variants").insert(payload).select("id").single(),
      )

      if (result.success && result.data?.data) {
        toast({
          title: "Variante criada",
          description: "Já pode ajustar os restantes detalhes.",
        })
        router.push(`/admin/products/${templateId}/variants/${result.data.data.id}/edit`)
      } else if (result.error) {
        if (isUniqueViolation(result.error)) {
          toast({
            title: "Formato já existente",
            description: "Este template já possui uma variação para este formato. Edite-a ou escolha outro formato.",
            variant: "destructive",
          })
        } else {
          toast(formatErrorForToast(result.error, "Erro ao criar variante"))
        }
      }
    } else if (variant?.id) {
      result = await handleAsyncOperation(async () =>
        supabase.from("product_variants").update(payload).eq("id", variant.id),
      )

      if (result.success) {
        toast({
          title: "Variante atualizada",
          description: "As alterações foram guardadas.",
        })
        router.refresh()
      } else if (result.error) {
        toast(formatErrorForToast(result.error, "Erro ao atualizar variante"))
      }
    }

    setSavingState("idle")
  })

  const showCustomDimensions = form.watch("sizeFormatId") === 0 // Custom format
  const stockQuantity = form.watch("stockQuantity") ?? 0
  const stockStatus = form.watch("stockStatus")
  const stockInfo = getStockInfo(stockQuantity, stockStatus as any)

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Button type="submit" className="gap-2" disabled={savingState === "saving"}>
            {savingState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Criar variante" : "Guardar alterações"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>

        {/* Stock indicator */}
        <StockBadge
          quantity={stockQuantity}
          status={stockStatus as any}
          showIcon
          showQuantity
        />
      </div>

      {/* Stock Alert */}
      {stockInfo.status !== "in_stock" && (
        <StockAlert quantity={stockQuantity} status={stockStatus as any} />
      )}

      {/* Identification Card */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>Defina os campos únicos desta variação</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* SKU */}
          <div>
            <Label htmlFor="sku">
              SKU <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="sku"
                {...form.register("sku")}
                onBlur={(e) => checkSKUUniqueness(e.target.value)}
                className={form.formState.errors.sku ? "border-destructive" : ""}
              />
              {skuValidation.checking && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!skuValidation.checking && form.watch("sku") && skuValidation.unique && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
              )}
              {!skuValidation.checking && !skuValidation.unique && (
                <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
              )}
            </div>
            {form.formState.errors.sku && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.sku.message}</p>
            )}
            {skuValidation.suggestion && (
              <p className="mt-1 text-sm text-muted-foreground">
                Sugestão:
                <button
                  type="button"
                  className="ml-1 underline"
                  onClick={() => form.setValue("sku", skuValidation.suggestion!)}
                >
                  {skuValidation.suggestion}
                </button>
              </p>
            )}
          </div>

          {/* URL Slug */}
          <div>
            <Label htmlFor="urlSlug">
              URL Slug <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="urlSlug"
                {...form.register("urlSlug")}
                onBlur={(e) => checkSlugUniqueness(e.target.value)}
                className={form.formState.errors.urlSlug ? "border-destructive" : ""}
              />
              {slugValidation.checking && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!slugValidation.checking && form.watch("urlSlug") && slugValidation.unique && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
              )}
            </div>
            {form.formState.errors.urlSlug && (
              <p className="mt-1 text-sm text-destructive">{form.formState.errors.urlSlug.message}</p>
            )}
            {slugValidation.suggestion && (
              <p className="mt-1 text-sm text-muted-foreground">
                Sugestão:
                <button
                  type="button"
                  className="ml-1 underline"
                  onClick={() => form.setValue("urlSlug", slugValidation.suggestion!)}
                >
                  {slugValidation.suggestion}
                </button>
              </p>
            )}
          </div>

          {/* Size Format */}
          <div>
            <Label>
              Formato <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchedSizeFormatId ? String(watchedSizeFormatId) : ""}
              onValueChange={(value) => handleSizeFormatChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                {sizeFormats.map((format) => (
                  <SelectItem key={format.id} value={String(format.id)}>
                    {format.name}
                    {format.code ? ` (${format.code.toUpperCase()})` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="0">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {selectedFormat && (
              <p className="mt-1 text-xs text-muted-foreground">
                {[selectedFormat.code?.toUpperCase(), selectedFormat.width_mm && selectedFormat.height_mm
                  ? `${selectedFormat.width_mm} × ${selectedFormat.height_mm} mm`
                  : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          {/* Orientation */}
          <div>
            <Label>Orientação</Label>
            <Select
              value={form.watch("orientation") || ""}
              onValueChange={(value) => form.setValue("orientation", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a orientação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
                <SelectItem value="both">Ambas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium">Ativo</p>
              <p className="text-xs text-muted-foreground">Disponível para compra no site</p>
            </div>
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
          </div>

          {/* Bestseller */}
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium">Mais vendido</p>
              <p className="text-xs text-muted-foreground">Destacar como best-seller</p>
            </div>
            <Switch
              checked={form.watch("isBestseller")}
              onCheckedChange={(checked) => form.setValue("isBestseller", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Dimensions (if applicable) */}
      {showCustomDimensions && (
        <Card>
          <CardHeader>
            <CardTitle>Dimensões personalizadas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="customWidth">Largura (mm)</Label>
              <Input
                id="customWidth"
                type="number"
                {...form.register("customWidth", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="customHeight">Altura (mm)</Label>
              <Input
                id="customHeight"
                type="number"
                {...form.register("customHeight", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="customDepth">Profundidade (mm)</Label>
              <Input
                id="customDepth"
                type="number"
                {...form.register("customDepth", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="priceExVat">
              Preço s/ IVA (€) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="priceExVat"
              type="number"
              step="0.01"
              {...form.register("basePriceExcludingVat", {
                valueAsNumber: true,
                onChange: handlePriceExcludingVatChange
              })}
              className={form.formState.errors.basePriceExcludingVat ? "border-destructive" : ""}
            />
            {form.formState.errors.basePriceExcludingVat && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.basePriceExcludingVat.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="priceIncVat">
              Preço c/ IVA (€) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="priceIncVat"
              type="number"
              step="0.01"
              {...form.register("basePriceIncludingVat", { valueAsNumber: true })}
              className={form.formState.errors.basePriceIncludingVat ? "border-destructive" : ""}
            />
            {form.formState.errors.basePriceIncludingVat && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.basePriceIncludingVat.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              IVA: 23% (calculado automaticamente)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stock Card */}
      <Card>
        <CardHeader>
          <CardTitle>Stock & Logística</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="stockQty">
              Quantidade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stockQty"
              type="number"
              {...form.register("stockQuantity", { valueAsNumber: true })}
              className={form.formState.errors.stockQuantity ? "border-destructive" : ""}
            />
            {form.formState.errors.stockQuantity && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.stockQuantity.message}
              </p>
            )}
          </div>
          <div>
            <Label>Estado de stock</Label>
            <Select
              value={form.watch("stockStatus")}
              onValueChange={(value) => form.setValue("stockStatus", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">Em stock</SelectItem>
                <SelectItem value="low_stock">Stock baixo</SelectItem>
                <SelectItem value="out_of_stock">Esgotado</SelectItem>
                <SelectItem value="discontinued">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="lowStock">Alerta stock baixo</Label>
            <Input
              id="lowStock"
              type="number"
              {...form.register("lowStockThreshold", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Alerta quando stock ≤ este valor
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Imagem Principal</CardTitle>
          <CardDescription>Envie a imagem principal desta variante (máx 5MB)</CardDescription>
        </CardHeader>
        <CardContent>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-48 w-48 rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Label
              htmlFor="image-upload"
              className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">A enviar...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Clique para enviar imagem</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WebP até 5MB</p>
                </>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </Label>
          )}
        </CardContent>
      </Card>

      {/* Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo específico</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="specificDesc">Descrição específica</Label>
            <Textarea
              id="specificDesc"
              rows={4}
              {...form.register("specificDescription")}
              placeholder="Detalhes específicos desta variante..."
            />
          </div>
          <div>
            <Label htmlFor="idealFor">Ideal para</Label>
            <Textarea
              id="idealFor"
              rows={3}
              {...form.register("idealFor")}
              placeholder="Ex: Ideal para menus, cardápios, informações..."
            />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export { ProductVariantFormEnhanced as ProductVariantForm }
