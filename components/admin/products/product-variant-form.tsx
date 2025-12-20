"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type {
  ProductVariantDetail,
  SizeFormatOption,
} from "@/lib/supabase/queries/admin-products";
import { Loader2, AlertCircle, CheckCircle2, Upload, X } from "lucide-react";
import { uploadImageWithCompression } from "@/lib/utils/image-upload";

import {
  productVariantSchema,
  generateSlug,
  generateSKU,
  calculatePriceWithVAT,
} from "@/lib/validations/product-schemas";
import type { ProductVariantFormData } from "@/lib/validations/product-schemas";
import { SpecificationsEditor } from "./specifications-editor";

interface ProductVariantFormEnhancedProps {
  mode: "create" | "edit";
  templateId: number;
  templateName?: string;
  variant?: ProductVariantDetail | null;
  sizeFormats: SizeFormatOption[];
}

export function ProductVariantFormEnhanced({
  mode,
  templateId,
  templateName,
  variant,
  sizeFormats,
}: ProductVariantFormEnhancedProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [savingState, setSavingState] = useState<"idle" | "saving">("idle");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [technicalImagePreview, setTechnicalImagePreview] = useState<
    string | null
  >(variant?.technicalImageUrl ?? null);
  const [skuValidation, setSkuValidation] = useState<{
    checking: boolean;
    unique: boolean;
    suggestion?: string;
  }>({
    checking: false,
    unique: true,
  });
  const [slugValidation, setSlugValidation] = useState<{
    checking: boolean;
    unique: boolean;
    suggestion?: string;
  }>({
    checking: false,
    unique: true,
  });

  const initialSizeFormatId = variant?.sizeFormatId ?? sizeFormats[0]?.id ?? 0;

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
      minOrderQuantity: variant?.minOrderQuantity ?? 1,
      technicalImageUrl: variant?.technicalImageUrl ?? "",
      specificationsJson: variant?.specificationsJson ?? null,
    },
  });

  // Auto-generate slug and SKU when size format changes
  const handleSizeFormatChange = useCallback(
    (sizeFormatId: number) => {
      form.setValue("sizeFormatId", sizeFormatId);

      // Always regenerate in create mode when format changes
      if (mode === "create" && templateName) {
        const format = sizeFormats.find((f) => f.id === sizeFormatId);
        if (format) {
          // Always generate slug from template name + format
          const slug = generateSlug(`${templateName} ${format.name}`);
          form.setValue("urlSlug", slug);

          // Always generate SKU from template name + format code
          const suggestedSku = generateSKU(
            templateName,
            format.code ?? format.name ?? sizeFormatId,
          );
          form.setValue("sku", suggestedSku);
        }
      }
    },
    [mode, templateName, sizeFormats, form],
  );

  // Auto-generate on initial load for create mode
  useEffect(() => {
    if (mode === "create" && templateName && sizeFormats.length > 0) {
      const currentFormatId = form.getValues("sizeFormatId");
      const formatId =
        currentFormatId && currentFormatId !== 0
          ? currentFormatId
          : sizeFormats[0].id;

      // Set format and generate SKU/slug
      handleSizeFormatChange(formatId);
    }
  }, [mode, templateName, sizeFormats, form, handleSizeFormatChange]);

  const watchedSizeFormatId = form.watch("sizeFormatId");
  const selectedFormat = useMemo(
    () =>
      sizeFormats.find((format) => format.id === watchedSizeFormatId) ?? null,
    [sizeFormats, watchedSizeFormatId],
  );

  // Check SKU uniqueness
  const checkSKUUniqueness = useCallback(
    async (sku: string) => {
      if (!sku || sku.length < 3) return;

      setSkuValidation({ checking: true, unique: true });

      // TODO: Add API route for SKU validation
      // const result = await validateVariantSKU(sku, variant?.id)
      setSkuValidation({
        checking: false,
        unique: true, // Temporarily assume unique until API route is added
        suggestion: undefined,
      });

      // if (!result.isUnique) {
      //   form.setError("sku", {
      //     type: "manual",
      //     message: result.error || "SKU já existe"
      //   })
      // }
    },
    [variant?.id, form],
  );

  // Check slug uniqueness
  const checkSlugUniqueness = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) return;

      setSlugValidation({ checking: true, unique: true });

      // TODO: Add API route for slug validation
      // const result = await validateVariantSlug(slug, variant?.id)
      setSlugValidation({
        checking: false,
        unique: true, // Temporarily assume unique until API route is added
        suggestion: undefined,
      });

      // if (!result.isUnique) {
      //   form.setError("urlSlug", {
      //     type: "manual",
      //     message: result.error || "Slug já existe"
      //   })
      // }
    },
    [variant?.id, form],
  );

  // Auto-calculate VAT price
  const handlePriceExcludingVatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const priceEx = parseFloat(e.target.value);
      if (!isNaN(priceEx)) {
        const priceInc = calculatePriceWithVAT(priceEx);
        form.setValue("basePriceIncludingVat", priceInc);
      }
    },
    [form],
  );

  // Handle technical image upload
  const handleTechnicalImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);

      try {
        const result = await uploadImageWithCompression(file, {
          folder: `variants/${templateId}/technical`,
          compress: true,
          maxWidth: 1200,
          quality: 0.9,
        });

        if (result.success && result.url) {
          form.setValue("technicalImageUrl", result.url);
          setTechnicalImagePreview(result.url);

          toast({
            title: "Imagem enviada",
            description: "A imagem técnica foi enviada com sucesso",
          });
        } else {
          toast({
            title: "Erro no upload",
            description: result.error || "Não foi possível enviar a imagem",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Erro no upload",
          description: "Ocorreu um erro ao enviar a imagem",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    },
    [templateId, form, toast],
  );

  // Remove technical image
  const handleTechnicalImageRemove = useCallback(() => {
    form.setValue("technicalImageUrl", "");
    setTechnicalImagePreview(null);
  }, [form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    // Final uniqueness checks before submit
    if (!skuValidation.unique) {
      toast({
        title: "SKU duplicado",
        description: skuValidation.suggestion
          ? `Sugestão: ${skuValidation.suggestion}`
          : "Por favor, escolha outro SKU",
        variant: "destructive",
      });
      return;
    }

    if (!slugValidation.unique) {
      toast({
        title: "Slug duplicado",
        description: slugValidation.suggestion
          ? `Sugestão: ${slugValidation.suggestion}`
          : "Por favor, escolha outro slug",
        variant: "destructive",
      });
      return;
    }

    setSavingState("saving");

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
      specifications_json: values.specificationsJson ?? null,
      min_order_quantity: values.minOrderQuantity ?? 1,
      technical_image_url: values.technicalImageUrl || null,
      is_active: values.isActive,
      is_bestseller: values.isBestseller,
      display_order: values.displayOrder ?? null,
      orientation: values.orientation ?? null,
    };

    if (mode === "create") {
      // Create mode: use API route to bypass RLS
      try {
        const response = await fetch("/api/admin/products/variants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.data?.id) {
          toast({
            title: "Variante criada",
            description: "Já pode ajustar os restantes detalhes.",
          });
          router.push(
            `/admin/products/${templateId}/variants/${data.data.id}/edit`,
          );
        } else {
          toast({
            title: "Erro ao criar variante",
            description: data.error || "Ocorreu um erro ao criar.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao criar variante",
          description: "Não foi possível comunicar com o servidor.",
          variant: "destructive",
        });
      }
    } else if (variant?.id) {
      // Edit mode: use API route to bypass RLS
      try {
        const response = await fetch(`/api/admin/products/variants/${variant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Variante atualizada",
            description: "As alterações foram guardadas.",
          });
          router.refresh();
        } else {
          toast({
            title: "Erro ao atualizar variante",
            description: data.error || "Ocorreu um erro ao guardar.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao atualizar variante",
          description: "Não foi possível comunicar com o servidor.",
          variant: "destructive",
        });
      }
    }

    setSavingState("idle");
  });

  const showCustomDimensions = form.watch("sizeFormatId") === 0; // Custom format

  return (
    <FormProvider {...form}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="gap-2"
            disabled={savingState === "saving"}
          >
            {savingState === "saving" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Criar variante" : "Guardar alterações"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>

        {/* Identification Card */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>
              Defina os campos únicos desta variação
            </CardDescription>
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
                  className={
                    form.formState.errors.sku ? "border-destructive" : ""
                  }
                />
                {skuValidation.checking && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!skuValidation.checking &&
                  form.watch("sku") &&
                  skuValidation.unique && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                  )}
                {!skuValidation.checking && !skuValidation.unique && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                )}
              </div>
              {form.formState.errors.sku && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.sku.message}
                </p>
              )}
              {skuValidation.suggestion && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Sugestão:
                  <button
                    type="button"
                    className="ml-1 underline"
                    onClick={() =>
                      form.setValue("sku", skuValidation.suggestion!)
                    }
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
                  className={
                    form.formState.errors.urlSlug ? "border-destructive" : ""
                  }
                />
                {slugValidation.checking && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!slugValidation.checking &&
                  form.watch("urlSlug") &&
                  slugValidation.unique && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                  )}
              </div>
              {form.formState.errors.urlSlug && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.urlSlug.message}
                </p>
              )}
              {slugValidation.suggestion && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Sugestão:
                  <button
                    type="button"
                    className="ml-1 underline"
                    onClick={() =>
                      form.setValue("urlSlug", slugValidation.suggestion!)
                    }
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
                  {[
                    selectedFormat.code?.toUpperCase(),
                    selectedFormat.width_mm && selectedFormat.height_mm
                      ? `${selectedFormat.width_mm} × ${selectedFormat.height_mm} mm`
                      : null,
                  ]
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
                onValueChange={(value) =>
                  form.setValue("orientation", value as any)
                }
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
                <p className="text-xs text-muted-foreground">
                  Disponível para compra no site
                </p>
              </div>
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
              />
            </div>

            {/* Bestseller */}
            <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium">Mais vendido</p>
                <p className="text-xs text-muted-foreground">
                  Destacar como best-seller
                </p>
              </div>
              <Switch
                checked={form.watch("isBestseller")}
                onCheckedChange={(checked) =>
                  form.setValue("isBestseller", checked)
                }
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
                  onChange: handlePriceExcludingVatChange,
                })}
                className={
                  form.formState.errors.basePriceExcludingVat
                    ? "border-destructive"
                    : ""
                }
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
                {...form.register("basePriceIncludingVat", {
                  valueAsNumber: true,
                })}
                className={
                  form.formState.errors.basePriceIncludingVat
                    ? "border-destructive"
                    : ""
                }
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
            <div>
              <Label htmlFor="minOrderQty">Quantidade mínima</Label>
              <Input
                id="minOrderQty"
                type="number"
                min="1"
                {...form.register("minOrderQuantity", { valueAsNumber: true })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Quantidade mínima por encomenda
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Image Card */}
        <Card>
          <CardHeader>
            <CardTitle>Imagem Técnica</CardTitle>
            <CardDescription>
              Diagrama com dimensões desta variante (se não definida, usa a
              imagem do template)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {technicalImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={technicalImagePreview}
                  alt="Imagem técnica"
                  className="max-h-64 rounded-lg border object-contain"
                />
                <button
                  type="button"
                  onClick={handleTechnicalImageRemove}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Label
                htmlFor="technical-image-upload"
                className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      A enviar...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Clique para enviar imagem técnica
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP até 5MB
                    </p>
                  </>
                )}
                <input
                  id="technical-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTechnicalImageUpload}
                  disabled={uploadingImage}
                />
              </Label>
            )}
          </CardContent>
        </Card>

        {/* Technical Specifications Card */}
        <Card>
          <CardHeader>
            <CardTitle>Especificações Técnicas</CardTitle>
            <CardDescription>
              Dimensões e características específicas desta variante (sobrepõe
              as especificações do template)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpecificationsEditor name="specificationsJson" />
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}

export { ProductVariantFormEnhanced as ProductVariantForm };
